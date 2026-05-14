import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Tarjeta } from '../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { HorariosService } from '../horarios/horarios.service';
import { MarcarAsistenciaDto } from './dto/marcar-asistencia.dto';
import { Asistencia } from './entities/asistencia.entity';

const TOLERANCIA_MINUTOS = 10;
const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

@Injectable()
export class AsistenciaService {
  private readonly logger = new Logger(AsistenciaService.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Tarjeta)
    private readonly tarjetasRepository: Repository<Tarjeta>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    @InjectRepository(Estado)
    private readonly estadosRepository: Repository<Estado>,
    private readonly horariosService: HorariosService,
  ) {}

  async marcar(dto: MarcarAsistenciaDto): Promise<{
    mensaje: string;
    ya_registrado: boolean;
    usuario: { nombre: string; correo: string };
    fecha_hora: Date;
    clasificacion: string | null;
  }> {
    const tarjeta = await this.tarjetasRepository.findOne({
      where: { uid_nfc: dto.uid_nfc },
      relations: ['usuario'],
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no registrada');
    if (!tarjeta.usuario_id || !tarjeta.usuario) {
      throw new BadRequestException('Tarjeta sin usuario asignado');
    }

    const usuarioInfo = {
      nombre: tarjeta.usuario.nombre,
      correo: tarjeta.usuario.correo,
    };

    // Idempotencia: si ya marcó hoy, devolver registro existente
    const existente = await this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.estado', 'e')
      .where('a.usuario_id = :usuario_id', { usuario_id: tarjeta.usuario_id })
      .andWhere('DATE(a.fecha_hora) = CURRENT_DATE')
      .getOne();

    if (existente) {
      this.logger.log(`marcar() — ya registrado hoy: ${tarjeta.usuario.correo}`);
      return {
        mensaje: 'Asistencia ya registrada hoy',
        ya_registrado: true,
        usuario: usuarioInfo,
        fecha_hora: existente.fecha_hora,
        clasificacion: existente.estado?.nombre ?? null,
      };
    }

    // Clasificar según horario del día
    const diaSemana = DIAS_SEMANA[new Date().getDay()];
    const horario = await this.horariosService.findHorarioActivo(tarjeta.usuario_id, diaSemana);

    let estado_id: number | null = null;
    let clasificacion: string | null = null;

    if (horario) {
      const ahora = new Date();
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      const [hh, mm] = horario.hora_inicio.split(':').map(Number);
      const minutosEsperados = hh * 60 + mm;
      const tardanza = minutosAhora - minutosEsperados;

      const nombreEstado = tardanza <= TOLERANCIA_MINUTOS ? 'A tiempo' : 'Tarde';
      const estado = await this.estadosRepository.findOne({ where: { nombre: nombreEstado } });
      estado_id = estado?.id_estados ?? null;
      clasificacion = nombreEstado;
    }

    const fecha_hora = new Date();
    const asistencia = this.asistenciaRepository.create({
      tarjeta_id: tarjeta.id_tarjeta,
      usuario_id: tarjeta.usuario_id,
      fecha_hora,
      tipo: 'entrada',
      estado_id,
    });
    await this.asistenciaRepository.save(asistencia);

    this.logger.log(
      `marcar() — usuario: ${tarjeta.usuario.correo}, clasificacion: ${clasificacion ?? 'sin horario'}`,
    );

    return {
      mensaje: 'Asistencia registrada',
      ya_registrado: false,
      usuario: usuarioInfo,
      fecha_hora,
      clasificacion,
    };
  }

  findAll(usuarioId?: number, fecha?: string): Promise<Asistencia[]> {
    const qb = this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.tarjeta', 't')
      .leftJoinAndSelect('a.estado', 'e')
      .orderBy('a.fecha_hora', 'DESC');

    if (usuarioId) {
      qb.andWhere('a.usuario_id = :usuarioId', { usuarioId });
    }

    if (fecha) {
      qb.andWhere('DATE(a.fecha_hora) = :fecha', { fecha });
    }

    return qb.getMany();
  }

  findByUsuario(usuario_id: number): Promise<Asistencia[]> {
    return this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.tarjeta', 't')
      .leftJoinAndSelect('a.estado', 'e')
      .where('a.usuario_id = :usuario_id', { usuario_id })
      .orderBy('a.fecha_hora', 'DESC')
      .getMany();
  }

  findByFecha(fecha: string): Promise<Asistencia[]> {
    return this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.tarjeta', 't')
      .leftJoinAndSelect('a.estado', 'e')
      .where('DATE(a.fecha_hora) = :fecha', { fecha })
      .orderBy('a.fecha_hora', 'DESC')
      .getMany();
  }
}
