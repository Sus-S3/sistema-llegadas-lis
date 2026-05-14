import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateJustificacionDto {
  @IsInt()
  @Min(1)
  asistencia_id: number;

  @IsInt()
  @Min(1)
  usuario_id: number;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}
