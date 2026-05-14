import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Tarjeta } from '../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { HorariosModule } from '../horarios/horarios.module';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { Asistencia } from './entities/asistencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asistencia, Tarjeta, Usuario, Estado]),
    HorariosModule,
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}
