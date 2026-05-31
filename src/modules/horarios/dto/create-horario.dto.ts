import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class CreateHorarioDto {
  @IsInt()
  @Min(1)
  usuario_id: number;

  @IsInt()
  @Min(1)
  laboratorio_id: number;

  /** 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado */
  @IsInt()
  @Min(1)
  @Max(6)
  dia_semana: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'hora_inicio debe tener formato HH:MM' })
  hora_inicio: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'hora_fin debe tener formato HH:MM' })
  hora_fin: string;

  @IsInt()
  @Min(1)
  estado_id: number;
}
