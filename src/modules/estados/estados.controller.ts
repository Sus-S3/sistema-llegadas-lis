import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { EstadosService } from './estados.service';

@Controller('estados')
export class EstadosController {
  constructor(private readonly estadosService: EstadosService) {}

  @Public()
  @Get()
  findAll(@Query('categoria') categoria?: string) {
    return this.estadosService.findAll(categoria);
  }
}
