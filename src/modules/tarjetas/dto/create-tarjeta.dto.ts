import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTarjetaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  uid_nfc: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  usuario_id: number;

  @IsInt()
  @Min(1)
  estado_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  registrado_por_id?: number;
}
