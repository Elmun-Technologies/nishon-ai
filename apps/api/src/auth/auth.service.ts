import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { User } from "../users/entities/user.entity";
import { RegisterDto, LoginDto, AuthResponseDto } from "@adspectr/shared";
import { trialEndsAtFromNow } from "../config/trial.config";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Register a new user account.
   * Password is hashed with bcrypt using 12 salt rounds — this is intentionally
   * slow to make brute-force attacks computationally expensive.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    // Hash password — 12 rounds is the industry standard balance of security vs speed
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      trialEndsAt: trialEndsAtFromNow(),
    });

    const savedUser = await this.userRepo.save(user);
    return this.generateAuthResponse(savedUser);
  }

  /**
   * Validate email/password and return JWT tokens.
   * We use a generic error message intentionally — never reveal whether
   * the email exists or the password is wrong (security best practice).
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // addSelect because password has select: false in the entity
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: dto.email })
      .getOne();

    if (!user || !user.password) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Verify a refresh token and issue a new access token.
   * Refresh tokens are stored hashed in the DB — if the user logs out,
   * the token in DB is cleared, making all existing refresh tokens invalid.
   */
  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.userRepo
        .createQueryBuilder("user")
        .addSelect("user.refreshToken")
        .where("user.id = :id", { id: payload.sub })
        .getOne();

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify the stored hashed token matches the provided one
      const isValid = await bcrypt.compare(token, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { expiresIn: this.config.get("JWT_EXPIRES_IN", "15m") },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  /**
   * Logout by clearing the refresh token from the database.
   * After this, the old refresh token can no longer be used to get new access tokens.
   * Existing access tokens remain valid until they expire (max 15 minutes).
   */
  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: null });
  }

  async updateMe(
    userId: string,
    patch: { name?: string; email?: string },
  ): Promise<
    Pick<User, "id" | "email" | "name" | "plan" | "trialEndsAt" | "isAdmin">
  > {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    if (patch.email && patch.email !== user.email) {
      const exists = await this.userRepo.findOne({ where: { email: patch.email } });
      if (exists && exists.id !== userId) {
        throw new ConflictException("An account with this email already exists");
      }
      user.email = patch.email;
    }
    if (patch.name !== undefined) user.name = patch.name;
    const updated = await this.userRepo.save(user);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      plan: updated.plan,
      trialEndsAt: updated.trialEndsAt,
      isAdmin: updated.isAdmin,
    };
  }

  /**
   * Find or create a user from Google OAuth profile data.
   * Looks up by googleId first, then by email (to link existing accounts),
   * otherwise creates a new user record.
   */
  async findOrCreateFromGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<AuthResponseDto> {
    // First try to find by googleId
    let user = await this.userRepo.findOne({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      // Try to link existing email account
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) {
        // Link Google to existing account
        await this.userRepo.update(user.id, {
          googleId: profile.googleId,
          picture:  profile.picture ?? user.picture,
        });
        const reloaded = await this.userRepo.findOne({ where: { id: user.id } });
        if (!reloaded) {
          throw new UnauthorizedException("User disappeared after Google link update");
        }
        user = reloaded;
      } else {
        // Create a brand-new user
        user = await this.userRepo.save(
          this.userRepo.create({
            email:    profile.email,
            name:     profile.name,
            googleId: profile.googleId,
            picture:  profile.picture ?? null,
            password: null,
            trialEndsAt: trialEndsAtFromNow(),
          }),
        );
      }
    }

    return this.generateAuthResponse(user);
  }

  /** Find or create user from Facebook OAuth profile. */
  async findOrCreateFromFacebook(profile: {
    facebookId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<AuthResponseDto> {
    let user = await this.userRepo.findOne({ where: { facebookId: profile.facebookId } });

    if (!user) {
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) {
        await this.userRepo.update(user.id, {
          facebookId: profile.facebookId,
          picture:    profile.picture ?? user.picture,
        });
        const reloaded = await this.userRepo.findOne({ where: { id: user.id } });
        if (!reloaded) {
          throw new UnauthorizedException("User disappeared after Facebook link update");
        }
        user = reloaded;
      } else {
        user = await this.userRepo.save(
          this.userRepo.create({
            email:      profile.email,
            name:       profile.name,
            facebookId: profile.facebookId,
            picture:    profile.picture ?? null,
            password:   null,
            trialEndsAt: trialEndsAtFromNow(),
          }),
        );
      }
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Validate user credentials — called by LocalStrategy during login.
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!user || !user.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  /**
   * Internal helper: generate both access and refresh tokens for a user,
   * store hashed refresh token in DB, and return the full auth response.
   */
  private async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_SECRET"),
      expiresIn: this.config.get("JWT_EXPIRES_IN", "15m"),
    });

    const refreshSecret = this.config.get<string>("JWT_REFRESH_SECRET");
    if (!refreshSecret?.trim()) {
      throw new Error("JWT_REFRESH_SECRET is not set");
    }

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "7d"),
    });

    // Store hashed refresh token — same security principle as passwords
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refreshToken: hashedRefreshToken });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        trialEndsAt: user.trialEndsAt ? user.trialEndsAt.toISOString() : null,
        isAdmin: user.isAdmin,
      },
    };
  }
}
