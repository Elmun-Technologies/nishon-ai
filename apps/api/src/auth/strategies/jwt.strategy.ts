import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../users/entities/user.entity";

interface JwtPayload {
  sub: string; // user ID
  email: string;
  iat: number; // issued at
  exp: number; // expires at
}

/**
 * JwtStrategy validates the Bearer token on every protected route.
 * When a request comes in with Authorization: Bearer <token>,
 * Passport extracts the token, we verify the signature, then load the user from DB.
 * The returned user object is attached to req.user for use in controllers.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const jwtSecret =
      config.get<string>("JWT_SECRET") ||
      "your-super-secret-jwt-key-change-in-production";
    console.log("JWT_SECRET from config:", jwtSecret);
    console.log("JWT_SECRET length:", jwtSecret?.length);

    super({
      // Extract JWT from the Authorization: Bearer header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Automatically reject expired tokens
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });

    if (!user) {
      // User was deleted after token was issued
      throw new UnauthorizedException("User no longer exists");
    }

    // This return value becomes req.user in every controller that uses @UseGuards(AuthGuard('jwt'))
    return user;
  }
}
