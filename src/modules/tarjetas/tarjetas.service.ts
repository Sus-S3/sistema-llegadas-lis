import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';
import { Tarjeta } from './entities/tarjeta.entity';

@Injectable()
export class TarjetasService {
  private readonly logger = new Logger(TarjetasService.name);

  constructor(
    @InjectRepository(Tarjeta)
    private readonly tarjetasRepository: Repository<Tarjeta>,
  ) {}

  findAll(): Promise<Tarjeta[]> {
    return this.tarjetasRepository.find({ relations: ['usuario', 'estado'] });
  }

  async findOne(id: number): Promise<Tarjeta> {
    const tarjeta = await this.tarjetasRepository.findOne({
      where: { id_tarjeta: id },
      relations: ['usuario', 'estado'],
    });
    if (!tarjeta) throw new NotFoundException(`Tarjeta #${id} no encontrada`);
    return tarjeta;
  }

  findByUid(uid_nfc: string): Promise<Tarjeta | null> {
    return this.tarjetasRepository.findOne({
      where: { uid_nfc },
      relations: ['usuario', 'estado'],
    });
  }

  async create(dto: CreateTarjetaDto): Promise<Tarjeta> {
    this.logger.log(`create() — uid_nfc: ${dto.uid_nfc}`);

    const existing = await this.tarjetasRepository.findOne({
      where: { uid_nfc: dto.uid_nfc },
    });
    if (existing) {
      throw new BadRequestException(`El UID '${dto.uid_nfc}' ya está registrado`);
    }

    const tarjeta = this.tarjetasRepository.create(dto);
    return this.tarjetasRepository.save(tarjeta);
  }

  async update(id: number, dto: UpdateTarjetaDto): Promise<Tarjeta> {
    const tarjeta = await this.findOne(id);
    Object.assign(tarjeta, dto);
    return this.tarjetasRepository.save(tarjeta);
  }

  async remove(id: number): Promise<void> {
    const tarjeta = await this.findOne(id);
    await this.tarjetasRepository.remove(tarjeta);
  }
}
