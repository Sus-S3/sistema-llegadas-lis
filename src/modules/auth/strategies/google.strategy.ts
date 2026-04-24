import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
  configService: ConfigService,
  private readonly authService: AuthService,
) {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback';
  console.log('>>> GOOGLE_CALLBACK_URL en runtime:', callbackURL);
  super({
    clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
    callbackURL,
    scope: ['email', 'profile'],
  });
}

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value;

    this.logger.log(`Google OAuth callback recibido — sub: ${id}, correo: ${email}, nombre: ${displayName}`);

    if (!email) {
      this.logger.error('El perfil de Google no incluye correo electrónico');
      return done(new Error('El perfil de Google no incluye correo electrónico'), undefined);
    }

    try {
      const usuario = await this.authService.validateGoogleUser({
        google_sub: id,
        correo: email,
        nombre: displayName,
      });
      this.logger.log(`validateGoogleUser completado — id_usuarios: ${usuario.id_usuarios}`);
      done(null, usuario);
    } catch (error) {
      this.logger.error(`Error en validateGoogleUser: ${(error as Error).message}`, (error as Error).stack);
      done(error as Error, undefined);
    }
  }
}
