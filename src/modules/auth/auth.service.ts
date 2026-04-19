import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<Usuario> {
    this.logger.log(`[1] Iniciando validateGoogleUser — google_sub: ${profile.google_sub}, correo: ${profile.correo}`);

    let usuario = await this.usuariosService.findByGoogleSub(profile.google_sub);
    this.logger.log(`[2] findByGoogleSub → ${usuario ? `encontrado id=${usuario.id_usuarios}` : 'no encontrado'}`);

    if (!usuario) {
      usuario = await this.usuariosService.findByCorreo(profile.correo);
      this.logger.log(`[3] findByCorreo → ${usuario ? `encontrado id=${usuario.id_usuarios}` : 'no encontrado'}`);

      if (usuario) {
        this.logger.log(`[4] Vinculando google_sub al usuario existente id=${usuario.id_usuarios}`);
        usuario = await this.usuariosService.update(usuario.id_usuarios, {
          google_sub: profile.google_sub,
        });
        this.logger.log(`[5] Usuario actualizado con google_sub`);
      } else {
        this.logger.log(`[4] Usuario nuevo — llamando usuariosService.create()`);
        try {
          usuario = await this.usuariosService.create({
            nombre: profile.nombre,
            correo: profile.correo,
            google_sub: profile.google_sub,
            rol_id: 2,
            estado_id: 1,
          });
          this.logger.log(`[5] Usuario creado exitosamente — id=${usuario.id_usuarios}`);
        } catch (error) {
          this.logger.error(`[5] Error en usuariosService.create(): ${(error as Error).message}`, (error as Error).stack);
          throw error;
        }
      }
    }

    this.logger.log(`[FIN] validateGoogleUser completado — id_usuarios: ${usuario.id_usuarios}`);
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
