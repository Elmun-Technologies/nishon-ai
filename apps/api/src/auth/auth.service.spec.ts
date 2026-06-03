import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";
import { User } from "../users/entities/user.entity";

jest.mock("bcryptjs");

/**
 * QueryBuilder mock: fluent chain that resolves with .getOne().
 * Matches how the service composes: createQueryBuilder("user")
 *   .addSelect(...).where(...).getOne()
 */
function makeQb(getOneResolves: any) {
  const qb: any = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(getOneResolves),
  };
  return qb;
}

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) =>
        Promise.resolve({ id: d.id ?? "user-1", ...d }),
      ),
      update: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };
    jwtService = {
      sign: jest.fn((p: any, opts: any) =>
        opts?.secret === "refresh-secret" ? "refresh-token" : "access-token",
      ),
      verify: jest.fn(),
    };
    config = {
      get: jest.fn((key: string, fallback?: any) => {
        if (key === "JWT_SECRET") return "access-secret";
        if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
        return fallback;
      }),
    };

    (bcrypt.hash as jest.Mock).mockImplementation((v: string) =>
      Promise.resolve(`hashed:${v}`),
    );
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("register", () => {
    it("rejects a duplicate email with 409 — never reaches save", async () => {
      userRepo.findOne.mockResolvedValue({ id: "u-1", email: "a@b.com" });
      await expect(
        service.register({
          email: "a@b.com",
          password: "p",
          name: "A",
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it("hashes password with 12 bcrypt rounds and persists the new user", async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue({
        id: "u-1",
        email: "a@b.com",
        name: "A",
        password: "hashed:p",
        plan: "free",
        trialEndsAt: new Date(),
        isAdmin: false,
      });
      const out = await service.register({
        email: "a@b.com",
        password: "p",
        name: "A",
      } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith("p", 12);
      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.password).toBe("hashed:p");
      expect(saved.email).toBe("a@b.com");
      expect(saved.trialEndsAt).toBeInstanceOf(Date);
      expect(out.accessToken).toBe("access-token");
      expect(out.refreshToken).toBe("refresh-token");
    });
  });

  describe("login — email-enumeration safety", () => {
    it("unknown email gets the same UnauthorizedException as wrong password", async () => {
      userRepo.createQueryBuilder.mockReturnValue(makeQb(null));
      let unknownErr: any;
      try {
        await service.login({ email: "ghost@x", password: "p" } as any);
      } catch (e) {
        unknownErr = e;
      }
      expect(unknownErr).toBeInstanceOf(UnauthorizedException);

      // Now wrong password against an existing user.
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", email: "a@b.com", password: "hashed:p" }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      let wrongErr: any;
      try {
        await service.login({ email: "a@b.com", password: "bad" } as any);
      } catch (e) {
        wrongErr = e;
      }
      expect(wrongErr).toBeInstanceOf(UnauthorizedException);
      // The two errors should be indistinguishable.
      expect(unknownErr.message).toBe(wrongErr.message);
    });

    it("a user with no password (OAuth-only) cannot log in via email/password", async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", email: "a@b.com", password: null }),
      );
      await expect(
        service.login({ email: "a@b.com", password: "p" } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("happy path issues access + refresh tokens and stores a hashed refresh", async () => {
      const user = {
        id: "u-1",
        email: "a@b.com",
        password: "hashed:p",
        plan: "free",
        trialEndsAt: new Date(),
        isAdmin: false,
      };
      userRepo.createQueryBuilder.mockReturnValue(makeQb(user));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const out = await service.login({
        email: "a@b.com",
        password: "p",
      } as any);
      expect(out.accessToken).toBe("access-token");
      expect(out.refreshToken).toBe("refresh-token");
      // Refresh token was hashed and persisted on the user row.
      expect(userRepo.update).toHaveBeenCalledWith(
        "u-1",
        expect.objectContaining({
          refreshToken: expect.stringMatching(/^hashed:/),
        }),
      );
    });
  });

  describe("refreshToken", () => {
    it("401 when the token cannot be verified", async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("expired");
      });
      await expect(service.refreshToken("bad")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("401 when there is no refreshToken stored for the user", async () => {
      jwtService.verify.mockReturnValue({ sub: "u-1", email: "a@b.com" });
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", refreshToken: null }),
      );
      await expect(service.refreshToken("rt")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("401 when the provided token doesn't match the stored hash", async () => {
      jwtService.verify.mockReturnValue({ sub: "u-1", email: "a@b.com" });
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", refreshToken: "hashed:rt" }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(service.refreshToken("rt")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("returns a fresh access token (and ONLY an access token) on success", async () => {
      jwtService.verify.mockReturnValue({ sub: "u-1", email: "a@b.com" });
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", refreshToken: "hashed:rt" }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const out = await service.refreshToken("rt");
      expect(out).toEqual({ accessToken: "access-token" });
      // The refresh token must NOT be rotated by /refresh — only /login does that.
      expect(userRepo.update).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("clears refreshToken on the user row, so a stolen RT cannot be re-used", async () => {
      await service.logout("u-1");
      expect(userRepo.update).toHaveBeenCalledWith("u-1", {
        refreshToken: null,
      });
    });
  });

  describe("updateMe", () => {
    it("401 if the user row is gone", async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateMe("u-1", { name: "X" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("changing email to one taken by another user is a 409", async () => {
      userRepo.findOne
        .mockResolvedValueOnce({
          id: "u-1",
          email: "a@b.com",
          name: "A",
          plan: "free",
          isAdmin: false,
        })
        .mockResolvedValueOnce({ id: "u-2", email: "taken@b.com" });
      await expect(
        service.updateMe("u-1", { email: "taken@b.com" }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("setting the same email re-saves but doesn't trigger collision check", async () => {
      userRepo.findOne.mockResolvedValueOnce({
        id: "u-1",
        email: "a@b.com",
        name: "A",
        plan: "free",
        isAdmin: false,
      });
      userRepo.save.mockImplementation((d: any) => Promise.resolve(d));
      const out = await service.updateMe("u-1", { email: "a@b.com" });
      // Only the initial findOne (no second collision lookup).
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(out.email).toBe("a@b.com");
    });

    it("returns only the public profile fields (no password, no refreshToken)", async () => {
      const dbUser = {
        id: "u-1",
        email: "a@b.com",
        name: "A",
        password: "secret-hash",
        refreshToken: "secret-refresh-hash",
        plan: "free",
        trialEndsAt: new Date(),
        isAdmin: false,
      };
      userRepo.findOne.mockResolvedValueOnce(dbUser);
      userRepo.save.mockResolvedValue({ ...dbUser, name: "Brand New" });
      const out = await service.updateMe("u-1", { name: "Brand New" });
      expect(out).not.toHaveProperty("password");
      expect(out).not.toHaveProperty("refreshToken");
      expect(out.name).toBe("Brand New");
    });
  });

  describe("findOrCreateFromGoogle", () => {
    it("returns existing user if googleId matches", async () => {
      userRepo.findOne.mockResolvedValueOnce({
        id: "u-1",
        email: "a@b.com",
        googleId: "g-1",
        plan: "free",
        isAdmin: false,
      });
      const out = await service.findOrCreateFromGoogle({
        googleId: "g-1",
        email: "a@b.com",
        name: "A",
      });
      // No second findOne lookup, no save (just token issuance).
      expect(userRepo.findOne).toHaveBeenCalledTimes(1);
      expect(out.accessToken).toBe("access-token");
    });

    it("links Google to an existing email-matched user (instead of creating a duplicate)", async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null) // by googleId
        .mockResolvedValueOnce({
          id: "u-1",
          email: "a@b.com",
          googleId: null,
          plan: "free",
          isAdmin: false,
        }) // by email
        .mockResolvedValueOnce({
          id: "u-1",
          email: "a@b.com",
          googleId: "g-1",
          picture: "pic",
          plan: "free",
          isAdmin: false,
        }); // reload after update
      await service.findOrCreateFromGoogle({
        googleId: "g-1",
        email: "a@b.com",
        name: "A",
        picture: "pic",
      });
      expect(userRepo.update).toHaveBeenCalledWith(
        "u-1",
        expect.objectContaining({ googleId: "g-1", picture: "pic" }),
      );
      // We linked, not duplicated.
      expect(userRepo.save).toHaveBeenCalledTimes(0);
    });

    it("creates a brand-new user when nothing matches", async () => {
      userRepo.findOne
        .mockResolvedValueOnce(null) // googleId
        .mockResolvedValueOnce(null); // email
      userRepo.save.mockResolvedValue({
        id: "u-new",
        email: "new@x.com",
        googleId: "g-new",
        plan: "free",
        trialEndsAt: new Date(),
        isAdmin: false,
      });
      await service.findOrCreateFromGoogle({
        googleId: "g-new",
        email: "new@x.com",
        name: "New",
      });
      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.email).toBe("new@x.com");
      expect(saved.googleId).toBe("g-new");
      // OAuth-only user: password is null so login by email/password can't impersonate.
      expect(saved.password).toBeNull();
      expect(saved.trialEndsAt).toBeInstanceOf(Date);
    });
  });

  describe("validateUser (local strategy)", () => {
    it("returns null for unknown email", async () => {
      userRepo.createQueryBuilder.mockReturnValue(makeQb(null));
      expect(await service.validateUser("ghost@x", "p")).toBeNull();
    });

    it("returns null for an OAuth-only user (no password)", async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", password: null }),
      );
      expect(await service.validateUser("a@b.com", "p")).toBeNull();
    });

    it("returns the user when bcrypt agrees", async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", email: "a@b.com", password: "hashed:p" }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const out = await service.validateUser("a@b.com", "p");
      expect(out?.id).toBe("u-1");
    });

    it("returns null when bcrypt disagrees", async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        makeQb({ id: "u-1", email: "a@b.com", password: "hashed:p" }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      expect(await service.validateUser("a@b.com", "p")).toBeNull();
    });
  });

  describe("generateAuthResponse — secret guard", () => {
    it("500 when JWT_SECRET is missing", async () => {
      userRepo.findOne.mockResolvedValue(null);
      config.get.mockImplementation((key: string, fallback?: any) => {
        if (key === "JWT_SECRET") return "";
        if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
        return fallback;
      });
      await expect(
        service.register({
          email: "x@y.com",
          password: "p",
          name: "X",
        } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it("500 when JWT_REFRESH_SECRET is missing", async () => {
      userRepo.findOne.mockResolvedValue(null);
      config.get.mockImplementation((key: string, fallback?: any) => {
        if (key === "JWT_SECRET") return "access-secret";
        if (key === "JWT_REFRESH_SECRET") return "";
        return fallback;
      });
      await expect(
        service.register({
          email: "x@y.com",
          password: "p",
          name: "X",
        } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
