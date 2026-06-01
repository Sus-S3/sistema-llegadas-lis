import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ExportacionReporte } from './entities/exportacion-reporte.entity';
import { FormatoExportacion } from './entities/formato-exportacion.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asistencia, ExportacionReporte, FormatoExportacion, Usuario])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
