import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  google_sub?: string;

  @IsInt()
  @Min(1)
  rol_id: number;

  @IsInt()
  @Min(1)
  estado_id: number;
}
