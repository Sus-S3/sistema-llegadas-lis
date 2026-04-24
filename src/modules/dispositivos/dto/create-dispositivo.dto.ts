import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateDispositivoDto {
  @IsInt()
  @Min(1)
  laboratorio_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsInt()
  @Min(1)
  estado_id: number;
}
