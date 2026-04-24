import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../common/decorators/public.decorator';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirige automáticamente a Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: { user: Usuario }, @Res() res: any) {
    const { access_token } = this.authService.login(req.user);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?token=${access_token}`);
  }
}