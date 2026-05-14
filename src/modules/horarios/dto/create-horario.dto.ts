import { IsIn, IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator';

export const DIAS_SEMANA = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

export class CreateHorarioDto {
  @IsNumber()
  usuario_id: number;

  @IsNumber()
  laboratorio_id: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(DIAS_SEMANA)
  dia_semana: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'hora_inicio debe tener formato HH:MM' })
  hora_inicio: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'hora_fin debe tener formato HH:MM' })
  hora_fin: string;

  @IsNumber()
  estado_id: number;
}
