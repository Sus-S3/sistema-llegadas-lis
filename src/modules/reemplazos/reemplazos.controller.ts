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
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { RevisarReemplazoDto } from './dto/revisar-reemplazo.dto';
import { ReemplazosService } from './reemplazos.service';

@UseGuards(JwtAuthGuard)
@Controller('reemplazos')
export class ReemplazosController {
  constructor(private readonly reemplazosService: ReemplazosService) {}

  @Post()
  crear(@Body() dto: CreateReemplazoDto) {
    return this.reemplazosService.crear(dto);
  }

  @Patch(':id/revisar')
  revisar(@Param('id', ParseIntPipe) id: number, @Body() dto: RevisarReemplazoDto) {
    return this.reemplazosService.revisar(id, dto);
  }

  @Get()
  findAll() {
    return this.reemplazosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reemplazosService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reemplazosService.remove(id);
  }
}
