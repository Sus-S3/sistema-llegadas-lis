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
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';
import { LaboratoriosService } from './laboratorios.service';

// rol_id 3 = Administrador (según seed: Auxiliar admin=1, Auxiliar prog=2, Administrador=3)
const ADMIN = 6;

@UseGuards(JwtAuthGuard)
@Controller('laboratorios')
export class LaboratoriosController {
  constructor(private readonly laboratoriosService: LaboratoriosService) {}

  @Roles(ADMIN)
  @Post()
  create(@Body() dto: CreateLaboratorioDto) {
    return this.laboratoriosService.create(dto);
  }

  @Get()
  findAll() {
    return this.laboratoriosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.laboratoriosService.findOne(id);
  }

  @Roles(ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLaboratorioDto) {
    return this.laboratoriosService.update(id, dto);
  }

  @Roles(ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.laboratoriosService.remove(id);
  }
}
