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
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { RegistrarFisicaDto } from './dto/registrar-fisica.dto';
import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';
import { TarjetasService } from './tarjetas.service';

@UseGuards(JwtAuthGuard)
@Controller('tarjetas')
export class TarjetasController {
  constructor(private readonly tarjetasService: TarjetasService) {}

  @Post()
  create(@Body() dto: CreateTarjetaDto) {
    return this.tarjetasService.create(dto);
  }

  @Get()
  findAll() {
    return this.tarjetasService.findAll();
  }

  @Public()
  @Post('registrar-fisica')
  registrarFisica(@Body() dto: RegistrarFisicaDto) {
    return this.tarjetasService.registrarFisica(dto.uid_nfc);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarjetasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTarjetaDto) {
    return this.tarjetasService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tarjetasService.remove(id);
  }
}
