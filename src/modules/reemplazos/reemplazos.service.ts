import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from '../horarios/entities/horario.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { CreateReemplazoDto } from './dto/create-reemplazo.dto';
import { RevisarReemplazoDto } from './dto/revisar-reemplazo.dto';
import { Reemplazo } from './entities/reemplazo.entity';

const ESTADOS_VALIDOS_REVISION = ['Aprobado', 'Rechazado'];

@Injectable()
export class ReemplazosService {
  private readonly logger = new Logger(ReemplazosService.name);

  constructor(
    @InjectRepository(Reemplazo)
    private readonly reemplazosRepo: Repository<Reemplazo>,
    @InjectRepository(Horario)
    private readonly horariosRepo: Repository<Horario>,
    @InjectRepository(Estado)
    private readonly estadosRepo: Repository<Estado>,
  ) {}

  async crear(dto: CreateReemplazoDto): Promise<Reemplazo> {
    if (dto.solicitante_id === dto.reemplazante_id) {
      throw new BadRequestException('El solicitante y el reemplazante no pueden ser el mismo usuario');
    }

    const horario = await this.horariosRepo.findOne({
      where: { id_horarios: dto.horario_id },
    });
    if (!horario) {
      throw new NotFoundException(`Horario #${dto.horario_id} no encontrado`);
    }

    if (horario.usuario_id !== dto.solicitante_id) {
      throw new ForbiddenException('El horario no pertenece al solicitante');
    }

    const pendienteExistente = await this.reemplazosRepo
      .createQueryBuilder('r')
      .innerJoin('tbl_estados', 'e', 'e.id_estados = r.estado_id')
      .where('r.horario_id = :horario_id', { horario_id: dto.horario_id })
      .andWhere("LOWER(e.nombre) = 'pendiente'")
      .getOne();

    if (pendienteExistente) {
      throw new ConflictException(
        `Ya existe un reemplazo pendiente para el horario #${dto.horario_id}`,
      );
    }

    const estadoPendiente = await this.estadosRepo.findOne({ where: { nombre: 'Pendiente' } });
    if (!estadoPendiente) {
      throw new InternalServerErrorException('Estado "Pendiente" no encontrado en la base de datos');
    }

    const reemplazo = this.reemplazosRepo.create({
      solicitante_id: dto.solicitante_id,
      reemplazante_id: dto.reemplazante_id,
      horario_id: dto.horario_id,
      motivo: dto.motivo,
      estado_id: estadoPendiente.id_estados,
      revisado_por: null,
      fecha_revision: null,
    });
    const saved = await this.reemplazosRepo.save(reemplazo);

    this.logger.log(
      `crear() — horario_id: ${dto.horario_id}, solicitante_id: ${dto.solicitante_id}, reemplazante_id: ${dto.reemplazante_id}`,
    );
    return this.findOne(saved.id_reemplazo);
  }

  async revisar(id: number, dto: RevisarReemplazoDto): Promise<Reemplazo> {
    const reemplazo = await this.findOne(id);

    if (reemplazo.estado?.nombre !== 'Pendiente') {
      throw new BadRequestException('Este reemplazo ya fue revisado');
    }

    const nuevoEstado = await this.estadosRepo.findOne({
      where: { id_estados: dto.estado_id },
    });
    if (!nuevoEstado || !ESTADOS_VALIDOS_REVISION.includes(nuevoEstado.nombre)) {
      throw new BadRequestException(
        `El estado debe ser uno de: ${ESTADOS_VALIDOS_REVISION.join(', ')}`,
      );
    }

    // repository.update() evita conflicto FK-relación con save() sobre relaciones cargadas
    await this.reemplazosRepo.update(
      { id_reemplazo: id },
      {
        estado_id: dto.estado_id,
        revisado_por: dto.revisado_por_id,
        fecha_revision: new Date(),
      },
    );

    // Si se aprueba, reasignar el horario al reemplazante
    if (nuevoEstado.nombre === 'Aprobado') {
      // TODO: quitar log temporal
      console.log('[DEBUG revisar] horariosRepo.update filtro:', { id_horarios: reemplazo.horario_id }, 'valores:', { usuario_id: reemplazo.reemplazante_id });
      await this.horariosRepo.update(
        { id_horarios: reemplazo.horario_id },
        { usuario_id: reemplazo.reemplazante_id },
      );
      this.logger.log(
        `revisar() — reemplazo #${id} aprobado: horario #${reemplazo.horario_id} reasignado a usuario #${reemplazo.reemplazante_id}`,
      );
    }

    this.logger.log(
      `revisar() — id: ${id}, nuevo estado: ${nuevoEstado.nombre}, revisado_por: ${dto.revisado_por_id}`,
    );
    return this.findOne(id);
  }

  findAll(): Promise<Reemplazo[]> {
    return this.reemplazosRepo.find({
      relations: ['solicitante', 'reemplazante', 'horario', 'estado', 'revisor'],
      order: { fecha_solicitud: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Reemplazo> {
    const reemplazo = await this.reemplazosRepo.findOne({
      where: { id_reemplazo: id },
      relations: ['solicitante', 'reemplazante', 'horario', 'estado', 'revisor'],
    });
    if (!reemplazo) throw new NotFoundException(`Reemplazo #${id} no encontrado`);
    return reemplazo;
  }

  async remove(id: number): Promise<void> {
    const reemplazo = await this.findOne(id);
    await this.reemplazosRepo.remove(reemplazo);
  }
}
