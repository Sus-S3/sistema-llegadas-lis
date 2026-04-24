import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';
import { Dispositivo } from './entities/dispositivo.entity';

@Injectable()
export class DispositivosService {
  private readonly logger = new Logger(DispositivosService.name);

  constructor(
    @InjectRepository(Dispositivo)
    private readonly dispositivosRepository: Repository<Dispositivo>,
  ) {}

  async create(dto: CreateDispositivoDto): Promise<Dispositivo> {
    this.logger.log(`create() llamado — nombre: ${dto.nombre}, laboratorio_id: ${dto.laboratorio_id}`);

    const dispositivo = this.dispositivosRepository.create(dto);

    try {
      const saved = await this.dispositivosRepository.save(dispositivo);
      this.logger.log(`save() exitoso — id_dispositivos: ${saved.id_dispositivos}`);
      return saved;
    } catch (error) {
      this.logger.error(`save() falló: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  findAll(): Promise<Dispositivo[]> {
    return this.dispositivosRepository.find({ relations: ['laboratorio', 'estado'] });
  }

  async findOne(id: number): Promise<Dispositivo> {
    const dispositivo = await this.dispositivosRepository.findOne({
      where: { id_dispositivos: id },
      relations: ['laboratorio', 'estado'],
    });
    if (!dispositivo) throw new NotFoundException(`Dispositivo #${id} no encontrado`);
    return dispositivo;
  }

  async update(id: number, dto: UpdateDispositivoDto): Promise<Dispositivo> {
    const dispositivo = await this.findOne(id);
    Object.assign(dispositivo, dto);
    return this.dispositivosRepository.save(dispositivo);
  }

  async remove(id: number): Promise<void> {
    const dispositivo = await this.findOne(id);
    await this.dispositivosRepository.remove(dispositivo);
  }
}
