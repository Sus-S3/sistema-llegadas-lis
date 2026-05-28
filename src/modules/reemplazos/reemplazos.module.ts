import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from '../horarios/entities/horario.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Reemplazo } from './entities/reemplazo.entity';
import { ReemplazosController } from './reemplazos.controller';
import { ReemplazosService } from './reemplazos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reemplazo, Horario, Estado])],
  controllers: [ReemplazosController],
  providers: [ReemplazosService],
  exports: [ReemplazosService],
})
export class ReemplazosModule {}
