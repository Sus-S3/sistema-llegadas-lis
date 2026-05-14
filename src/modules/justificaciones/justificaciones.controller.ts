import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateJustificacionDto } from './dto/create-justificacion.dto';
import { RevisarJustificacionDto } from './dto/revisar-justificacion.dto';
import { JustificacionesService } from './justificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('justificaciones')
export class JustificacionesController {
  constructor(private readonly justificacionesService: JustificacionesService) {}

  @Post()
  crear(@Body() dto: CreateJustificacionDto) {
    return this.justificacionesService.crear(dto);
  }

  @Patch(':id/revisar')
  revisar(@Param('id', ParseIntPipe) id: number, @Body() dto: RevisarJustificacionDto) {
    return this.justificacionesService.revisar(id, dto);
  }

  @Get()
  findAll() {
    return this.justificacionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.justificacionesService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.justificacionesService.remove(id);
  }
}
