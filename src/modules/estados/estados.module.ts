import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from '../laboratorios/entities/estado.entity';
import { CategoriaEstado } from './entities/categoria-estado.entity';
import { EstadosController } from './estados.controller';
import { EstadosService } from './estados.service';

@Module({
  imports: [TypeOrmModule.forFeature([Estado, CategoriaEstado])],
  controllers: [EstadosController],
  providers: [EstadosService],
  exports: [EstadosService],
})
export class EstadosModule {}
