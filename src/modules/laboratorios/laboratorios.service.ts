import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLaboratorioDto } from './dto/create-laboratorio.dto';
import { UpdateLaboratorioDto } from './dto/update-laboratorio.dto';
import { Laboratorio } from './entities/laboratorio.entity';

@Injectable()
export class LaboratoriosService {
  private readonly logger = new Logger(LaboratoriosService.name);

  constructor(
    @InjectRepository(Laboratorio)
    private readonly laboratoriosRepository: Repository<Laboratorio>,
  ) {}

  async create(dto: CreateLaboratorioDto): Promise<Laboratorio> {
    this.logger.log(`create() llamado — nombre: ${dto.nombre}`);

    const existing = await this.laboratoriosRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      this.logger.warn(`create() bloqueado — nombre ya registrado: ${dto.nombre}`);
      throw new ConflictException('El nombre del laboratorio ya está registrado');
    }

    const laboratorio = this.laboratoriosRepository.create(dto);

    try {
      const saved = await this.laboratoriosRepository.save(laboratorio);
      this.logger.log(`save() exitoso — id_laboratorios: ${saved.id_laboratorios}`);
      return saved;
    } catch (error) {
      this.logger.error(`save() falló: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  findAll(): Promise<Laboratorio[]> {
    return this.laboratoriosRepository.find({ relations: ['estado'] });
  }

  async findOne(id: number): Promise<Laboratorio> {
    const laboratorio = await this.laboratoriosRepository.findOne({
      where: { id_laboratorios: id },
      relations: ['estado'],
    });
    if (!laboratorio) throw new NotFoundException(`Laboratorio #${id} no encontrado`);
    return laboratorio;
  }

  async update(id: number, dto: UpdateLaboratorioDto): Promise<Laboratorio> {
    const laboratorio = await this.findOne(id);
    Object.assign(laboratorio, dto);
    return this.laboratoriosRepository.save(laboratorio);
  }

  async remove(id: number): Promise<void> {
    const laboratorio = await this.findOne(id);
    await this.laboratoriosRepository.remove(laboratorio);
  }
}
