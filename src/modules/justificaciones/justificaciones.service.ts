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
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { CreateJustificacionDto } from './dto/create-justificacion.dto';
import { RevisarJustificacionDto } from './dto/revisar-justificacion.dto';
import { Justificacion } from './entities/justificacion.entity';

const ESTADOS_VALIDOS_REVISION = ['Aprobada', 'Rechazada'];

@Injectable()
export class JustificacionesService {
  private readonly logger = new Logger(JustificacionesService.name);

  constructor(
    @InjectRepository(Justificacion)
    private readonly justificacionesRepo: Repository<Justificacion>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Estado)
    private readonly estadosRepo: Repository<Estado>,
  ) {}

  async crear(dto: CreateJustificacionDto): Promise<Justificacion> {
    const asistencia = await this.asistenciaRepo.findOne({
      where: { id_asistencia: dto.asistencia_id },
    });
    if (!asistencia) {
      throw new NotFoundException(`Asistencia #${dto.asistencia_id} no encontrada`);
    }

    if (asistencia.usuario_id !== dto.usuario_id) {
      throw new ForbiddenException('La asistencia no pertenece al usuario indicado');
    }

    const existente = await this.justificacionesRepo.findOne({
      where: { asistencia_id: dto.asistencia_id },
    });
    if (existente) {
      throw new ConflictException(
        `Ya existe una justificación para la asistencia #${dto.asistencia_id}`,
      );
    }

    const estadoPendiente = await this.estadosRepo.findOne({ where: { nombre: 'Pendiente' } });
    if (!estadoPendiente) {
      throw new InternalServerErrorException('Estado "Pendiente" no encontrado en la base de datos');
    }

    const justificacion = this.justificacionesRepo.create({
      asistencia_id: dto.asistencia_id,
      usuario_id: dto.usuario_id,
      motivo: dto.motivo,
      estado_id: estadoPendiente.id_estados,
      revisado_por: null,
      fecha_revision: null,
    });
    const saved = await this.justificacionesRepo.save(justificacion);

    this.logger.log(
      `crear() — asistencia_id: ${dto.asistencia_id}, usuario_id: ${dto.usuario_id}`,
    );
    return this.findOne(saved.id_justificacion);
  }

  async revisar(id: number, dto: RevisarJustificacionDto): Promise<Justificacion> {
    const justificacion = await this.findOne(id);

    // Verificar que todavía está pendiente
    if (justificacion.estado?.nombre !== 'Pendiente') {
      throw new BadRequestException('Esta justificación ya fue revisada');
    }

    // Verificar que el nuevo estado es válido para revisión
    const nuevoEstado = await this.estadosRepo.findOne({
      where: { id_estados: dto.estado_id },
    });
    if (!nuevoEstado || !ESTADOS_VALIDOS_REVISION.includes(nuevoEstado.nombre)) {
      throw new BadRequestException(
        `El estado debe ser uno de: ${ESTADOS_VALIDOS_REVISION.join(', ')}`,
      );
    }

    // repository.update() evita el conflicto FK-relación del save() con relaciones cargadas
    await this.justificacionesRepo.update(
      { id_justificacion: id },
      {
        estado_id: dto.estado_id,
        revisado_por: dto.revisado_por_id,
        fecha_revision: new Date(),
      },
    );

    this.logger.log(
      `revisar() — id: ${id}, nuevo estado: ${nuevoEstado.nombre}, revisado_por: ${dto.revisado_por_id}`,
    );
    return this.findOne(id);
  }

  findAll(): Promise<Justificacion[]> {
    return this.justificacionesRepo.find({
      relations: ['asistencia', 'usuario', 'estado', 'revisor'],
      order: { fecha_solicitud: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Justificacion> {
    const justificacion = await this.justificacionesRepo.findOne({
      where: { id_justificacion: id },
      relations: ['asistencia', 'usuario', 'estado', 'revisor'],
    });
    if (!justificacion) throw new NotFoundException(`Justificación #${id} no encontrada`);
    return justificacion;
  }

  async remove(id: number): Promise<void> {
    const justificacion = await this.findOne(id);
    await this.justificacionesRepo.remove(justificacion);
  }
}
