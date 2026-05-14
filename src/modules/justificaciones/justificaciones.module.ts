import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Justificacion } from './entities/justificacion.entity';
import { JustificacionesController } from './justificaciones.controller';
import { JustificacionesService } from './justificaciones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Justificacion, Asistencia, Estado])],
  controllers: [JustificacionesController],
  providers: [JustificacionesService],
  exports: [JustificacionesService],
})
export class JustificacionesModule {}
