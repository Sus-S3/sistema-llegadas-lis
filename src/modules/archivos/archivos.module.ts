import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivoJustificacion } from './entities/archivo-justificacion.entity';
import { Archivo } from './entities/archivo.entity';
import { ArchivosController } from './archivos.controller';
import { ArchivosService } from './archivos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Archivo, ArchivoJustificacion])],
  controllers: [ArchivosController],
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule {}
