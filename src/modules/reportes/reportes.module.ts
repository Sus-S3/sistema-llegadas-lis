import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asistencia])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
