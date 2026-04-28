import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegistrarFisicaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  uid_nfc: string;
}
