import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MarcarAsistenciaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  uid_nfc: string;
}
