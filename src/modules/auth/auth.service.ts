import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

interface GoogleProfile {
  google_sub: string;
  correo: string;
  nombre: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<Usuario> {
    let usuario = await this.usuariosService.findByGoogleSub(profile.google_sub);

    if (!usuario) {
      usuario = await this.usuariosService.findByCorreo(profile.correo);
      if (usuario) {
        usuario = await this.usuariosService.update(usuario.id_usuarios, {
          google_sub: profile.google_sub,
        });
      } else {
        usuario = await this.usuariosService.create({
          nombre: profile.nombre,
          correo: profile.correo,
          google_sub: profile.google_sub,
          rol_id: 2,
          estado_id: 1,
        });
      }
    }

    return usuario;
  }

  login(usuario: Usuario): AuthResponseDto {
    const payload: JwtPayload = {
      sub: usuario.id_usuarios,
      correo: usuario.correo,
      rol_id: usuario.rol_id,
      estado_id: usuario.estado_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id_usuarios: usuario.id_usuarios,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        estado_id: usuario.estado_id,
      },
    };
  }
}
