import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarjeta } from './entities/tarjeta.entity';
import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tarjeta])],
  controllers: [TarjetasController],
  providers: [TarjetasService],
  exports: [TarjetasService],
})
export class TarjetasModule {}
