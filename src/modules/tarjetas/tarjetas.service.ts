import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';
import { Tarjeta } from './entities/tarjeta.entity';

@Injectable()
export class TarjetasService {
  private readonly logger = new Logger(TarjetasService.name);

  constructor(
    @InjectRepository(Tarjeta)
    private readonly tarjetasRepository: Repository<Tarjeta>,
    @InjectRepository(Estado)
    private readonly estadosRepository: Repository<Estado>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
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

  async registrarFisica(uid_nfc: string): Promise<{ id_tarjeta: number; uid_nfc: string; nueva: boolean }> {
    const existente = await this.tarjetasRepository.findOne({ where: { uid_nfc } });
    if (existente) {
      return { id_tarjeta: existente.id_tarjeta, uid_nfc: existente.uid_nfc, nueva: false };
    }

    const estadoActivo = await this.estadosRepository.findOneOrFail({
      where: { nombre: 'Activo' },
    });

    const nueva = await this.tarjetasRepository.save(
      this.tarjetasRepository.create({ uid_nfc, estado_id: estadoActivo.id_estados, usuario_id: null }),
    );

    this.logger.log(`registrarFisica() — tarjeta nueva uid_nfc: ${uid_nfc}, id: ${nueva.id_tarjeta}`);
    return { id_tarjeta: nueva.id_tarjeta, uid_nfc: nueva.uid_nfc, nueva: true };
  }

  async create(dto: CreateTarjetaDto): Promise<Tarjeta> {
    this.logger.log(`create() — uid_nfc: ${dto.uid_nfc}`);

    const existing = await this.tarjetasRepository.findOne({
      where: { uid_nfc: dto.uid_nfc },
    });
    if (existing) {
      throw new BadRequestException(`El UID '${dto.uid_nfc}' ya está registrado`);
    }

    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuarios: dto.usuario_id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario #${dto.usuario_id} no encontrado`);
    }

    const tarjeta = this.tarjetasRepository.create(dto);
    return this.tarjetasRepository.save(tarjeta);
  }

  async update(id: number, dto: UpdateTarjetaDto): Promise<Tarjeta> {
    await this.findOne(id); // lanza 404 si no existe
    await this.tarjetasRepository.update({ id_tarjeta: id }, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const tarjeta = await this.findOne(id);
    await this.tarjetasRepository.remove(tarjeta);
  }
}
