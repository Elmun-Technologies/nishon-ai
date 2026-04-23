import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID:     config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ||
        `${config.get<string>('API_BASE_URL', 'http://localhost:3001')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const email  = profile.emails?.[0]?.value;
    const name   = profile.displayName ?? profile.name?.givenName ?? 'User';
    const picture = profile.photos?.[0]?.value ?? undefined;

    if (!email) {
      return done(new Error('Google profile has no email'), undefined);
    }

    try {
      const authResponse = await this.authService.findOrCreateFromGoogle({
        googleId: profile.id,
        email,
        name,
        picture,
      });
      done(null, authResponse);
    } catch (err) {
      const e = err as Error & { driverError?: { message?: string; code?: string } };
      this.logger.error({
        message: 'Google OAuth validate failed',
        email,
        error: e?.message,
        pgCode: e?.driverError?.code,
        pgMessage: e?.driverError?.message,
      });
      // Pass error as a marker object so the callback controller can redirect
      // to the frontend with a human-readable error instead of returning 500.
      done(null, { _oauthError: e?.message ?? 'Google authentication failed' });
    }
  }
}
