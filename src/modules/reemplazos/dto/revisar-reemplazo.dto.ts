import { IsInt, Min } from 'class-validator';

export class RevisarReemplazoDto {
  @IsInt()
  @Min(1)
  estado_id: number;

  @IsInt()
  @Min(1)
  revisado_por_id: number;
}
