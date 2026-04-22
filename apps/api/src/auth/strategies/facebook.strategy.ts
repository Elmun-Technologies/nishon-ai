import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    // Same Meta developer app: Marketing API uses META_*; social login historically used FACEBOOK_*.
    // Allow one pair in env — fall back so operators don't duplicate App ID / Secret.
    const clientID =
      config.get<string>('FACEBOOK_APP_ID', '').trim() ||
      config.get<string>('META_APP_ID', '').trim()
    const clientSecret =
      config.get<string>('FACEBOOK_APP_SECRET', '').trim() ||
      config.get<string>('META_APP_SECRET', '').trim()
    if (!clientID || !clientSecret) {
      throw new Error(
        'Facebook login requires FACEBOOK_APP_ID and FACEBOOK_APP_SECRET, or the same values as META_APP_ID and META_APP_SECRET.',
      )
    }
    super({
      clientID,
      clientSecret,
      // Default host is for local dev only; production must set API_BASE_URL (e.g. https://api.adspectr.com).
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL') ||
        `${config.get<string>('API_BASE_URL', 'http://localhost:3001')}/auth/facebook/callback`,
      scope:        ['email', 'public_profile'],
      profileFields: ['id', 'displayName', 'emails', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): Promise<void> {
    const email =
      profile.emails?.[0]?.value ??
      // Facebook sometimes omits email — use a stable fallback
      `fb_${profile.id}@adspectr.com`;

    const name    = profile.displayName ?? 'Facebook User';
    const picture = profile.photos?.[0]?.value ?? undefined;

    const authResponse = await this.authService.findOrCreateFromFacebook({
      facebookId: profile.id,
      email,
      name,
      picture,
    });

    done(null, authResponse);
  }
}
