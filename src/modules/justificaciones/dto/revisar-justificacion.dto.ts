import { IsInt, Min } from 'class-validator';

export class RevisarJustificacionDto {
  @IsInt()
  @Min(1)
  estado_id: number;

  @IsInt()
  @Min(1)
  revisado_por_id: number;
}
