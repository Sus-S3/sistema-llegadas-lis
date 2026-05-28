import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateReemplazoDto {
  @IsInt()
  @Min(1)
  solicitante_id: number;

  @IsInt()
  @Min(1)
  reemplazante_id: number;

  @IsInt()
  @Min(1)
  horario_id: number;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}
