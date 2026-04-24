import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from './entities/estado.entity';
import { Laboratorio } from './entities/laboratorio.entity';
import { LaboratoriosController } from './laboratorios.controller';
import { LaboratoriosService } from './laboratorios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Laboratorio, Estado])],
  controllers: [LaboratoriosController],
  providers: [LaboratoriosService],
  exports: [LaboratoriosService],
})
export class LaboratoriosModule {}
