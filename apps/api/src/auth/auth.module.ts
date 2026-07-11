import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { FacebookStrategy } from "./strategies/facebook.strategy";
import { AuthService as AuthServiceType } from "./auth.service";
import { isFacebookConfigured, isGoogleConfigured } from "./oauth.util";
import { User } from "../users/entities/user.entity";
import { MetaAuthController } from "./meta-auth.controller";
import { MetaOAuthService } from "./meta-oauth.service";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ConnectedAccount, Workspace]),
    HttpModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN", "15m"),
        },
      }),
    }),
  ],
  controllers: [AuthController, MetaAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    // OAuth login strategies register with passport in their constructor. We
    // instantiate them ONLY when their credentials are present — an unconfigured
    // provider must not throw at construction and crash the whole API on boot.
    {
      provide: GoogleStrategy,
      useFactory: (config: ConfigService, authService: AuthServiceType) =>
        isGoogleConfigured(config)
          ? new GoogleStrategy(config, authService)
          : null,
      inject: [ConfigService, AuthService],
    },
    {
      provide: FacebookStrategy,
      useFactory: (config: ConfigService, authService: AuthServiceType) =>
        isFacebookConfigured(config)
          ? new FacebookStrategy(config, authService)
          : null,
      inject: [ConfigService, AuthService],
    },
    MetaOAuthService,
    MetaConnector,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
