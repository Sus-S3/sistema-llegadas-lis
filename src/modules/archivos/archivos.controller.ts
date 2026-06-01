import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ArchivosService } from './archivos.service';

@UseGuards(JwtAuthGuard)
@Controller('archivos')
export class ArchivosController {
  constructor(private readonly archivosService: ArchivosService) {}

  @Get('justificacion/:justificacion_id')
  findByJustificacion(@Param('justificacion_id', ParseIntPipe) justificacion_id: number) {
    return this.archivosService.findByJustificacion(justificacion_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.archivosService.eliminar(id);
  }
}
