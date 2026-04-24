import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispositivo } from './entities/dispositivo.entity';
import { DispositivosController } from './dispositivos.controller';
import { DispositivosService } from './dispositivos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dispositivo])],
  controllers: [DispositivosController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
