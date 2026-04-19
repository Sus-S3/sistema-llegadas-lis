export class AuthResponseDto {
  access_token: string;
  usuario: {
    id_usuarios: number;
    nombre: string;
    correo: string;
    rol_id: number;
    estado_id: number;
  };
}
