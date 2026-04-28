import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Tarjeta } from './entities/tarjeta.entity';
import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tarjeta, Estado])],
  controllers: [TarjetasController],
  providers: [TarjetasService],
  exports: [TarjetasService],
})
export class TarjetasModule {}
