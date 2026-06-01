import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportesService, ReporteFilters } from './reportes.service';

class ReporteQueryDto implements ReporteFilters {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuario_id?: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('asistencia/excel')
  async downloadExcel(
    @Query() query: ReporteQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const generadoPorId = (req.user as { id_usuarios: number }).id_usuarios;
    const buffer = await this.reportesService.generateExcel(query, generadoPorId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="asistencia-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('asistencia/pdf')
  async downloadPdf(
    @Query() query: ReporteQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const generadoPorId = (req.user as { id_usuarios: number }).id_usuarios;
    const buffer = await this.reportesService.generatePdf(query, generadoPorId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="asistencia-${Date.now()}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('historial')
  findAll() {
    return this.reportesService.findAll();
  }
}
