import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AsistenciaService } from './asistencia.service';
import { MarcarAsistenciaDto } from './dto/marcar-asistencia.dto';

@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Public()
  @Post('marcar')
  marcar(@Body() dto: MarcarAsistenciaDto) {
    return this.asistenciaService.marcar(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('usuario/:id')
  findByUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.asistenciaService.findByUsuario(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mis-asistencias')
  misAsistencias(@Req() req: Request) {
    const usuario_id = (req.user as { id_usuarios: number }).id_usuarios;
    return this.asistenciaService.findMisAsistenciasJustificables(usuario_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('usuario_id') usuarioId?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.asistenciaService.findAll(
      usuarioId ? parseInt(usuarioId, 10) : undefined,
      fecha,
    );
  }
}
