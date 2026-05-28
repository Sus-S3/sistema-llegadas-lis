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
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';
import { DispositivosService } from './dispositivos.service';

// rol_id 3 = Administrador (según seed: Auxiliar admin=1, Auxiliar prog=2, Administrador=3)
const ADMIN = 3;

@UseGuards(JwtAuthGuard)
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly dispositivosService: DispositivosService) {}

  @Roles(ADMIN)
  @Post()
  create(@Body() dto: CreateDispositivoDto) {
    return this.dispositivosService.create(dto);
  }

  @Get()
  findAll() {
    return this.dispositivosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dispositivosService.findOne(id);
  }

  @Roles(ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDispositivoDto) {
    return this.dispositivosService.update(id, dto);
  }

  @Roles(ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dispositivosService.remove(id);
  }
}
