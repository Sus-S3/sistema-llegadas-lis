import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity';
import { Horario } from '../horarios/entities/horario.entity';
import { HorariosModule } from '../horarios/horarios.module';
import { Estado } from '../laboratorios/entities/estado.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { Rol } from '../roles/entities/rol.entity';
import { Tarjeta } from '../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AsistenciaCron } from './asistencia.cron';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { Asistencia } from './entities/asistencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asistencia, Tarjeta, Usuario, Estado, Horario, Rol, Dispositivo]),
    HorariosModule,
    NotificacionesModule,
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService, AsistenciaCron],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}
