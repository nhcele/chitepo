import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);
  private readonly enabled: boolean;
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    // Read env using constructor params (not `this`) before calling super
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') || '/api/auth/google/callback';

    // Pass safe values to Strategy to avoid constructor error in dev
    super({
      clientID: clientID || 'dev-disabled',
      clientSecret: clientSecret || 'dev-disabled',
      callbackURL,
      scope: ['email', 'profile'],
    });

    // Enable only if both credentials exist, otherwise allow dummy in development
    this.enabled = Boolean(clientID && clientSecret);

    if (!this.enabled && nodeEnv === 'development') {
      this.logger.warn(
        'Google OAuth is disabled (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET). Continuing without Google auth in development.',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!this.enabled) {
      // Prevent accidental use when disabled
      return done(new Error('Google OAuth is not configured'), null);
    }
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || null,
      googleId: id,
    };

    done(null, user);
  }
}
