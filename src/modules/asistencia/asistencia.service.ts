import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Rol } from '../roles/entities/rol.entity';
import { Tarjeta } from '../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { HorariosService } from '../horarios/horarios.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { MarcarAsistenciaDto } from './dto/marcar-asistencia.dto';
import { Asistencia } from './entities/asistencia.entity';

const TOLERANCIA_MINUTOS = 10;
const TZ = 'America/Bogota';

const NOMBRE_DIA: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

/** Devuelve minutos desde medianoche en la zona horaria del proyecto. */
function minutosLocales(date: Date): number {
  const local = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
  return local.getHours() * 60 + local.getMinutes();
}

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
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
    @InjectRepository(Dispositivo)
    private readonly dispositivosRepository: Repository<Dispositivo>,
    private readonly horariosService: HorariosService,
    private readonly notificacionesService: NotificacionesService,
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

    // Resolver horario ANTES del duplicado — la clave de unicidad incluye horario_id
    // getDay(): 0=Dom, 1=Lun…6=Sáb — coincide con el smallint almacenado (1-6)
    const diaSemana = new Date(new Date().toLocaleString('en-US', { timeZone: TZ })).getDay();
    const horario = await this.horariosService.findHorarioActivo(tarjeta.usuario_id, diaSemana);
    const horario_id = horario?.id_horarios ?? null;

    // Duplicado: usuario + horario + fecha de hoy
    const duplicadoQb = this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.estado', 'e')
      .where('a.usuario_id = :usuario_id', { usuario_id: tarjeta.usuario_id })
      .andWhere('DATE(a.fecha_hora) = CURRENT_DATE');

    if (horario_id !== null) {
      duplicadoQb.andWhere('a.horario_id = :horario_id', { horario_id });
    } else {
      duplicadoQb.andWhere('a.horario_id IS NULL');
    }

    const existente = await duplicadoQb.getOne();

    if (existente) {
      this.logger.log(`marcar() — ya registrado hoy (horario_id=${horario_id}): ${tarjeta.usuario.correo}`);
      return {
        mensaje: 'Asistencia ya registrada hoy',
        ya_registrado: true,
        usuario: usuarioInfo,
        fecha_hora: existente.fecha_hora,
        clasificacion: existente.estado?.nombre ?? null,
      };
    }

    // Clasificar según diferencia con hora_inicio del horario
    let estado_id: number | null = null;
    let clasificacion: string | null = null;
    let tardanza: number | null = null;

    if (horario) {
      const minutosAhora = minutosLocales(new Date());
      const [hh, mm] = horario.hora_inicio.split(':').map(Number);
      const minutosEsperados = hh * 60 + mm;
      tardanza = minutosAhora - minutosEsperados;

      const nombreEstado = tardanza <= TOLERANCIA_MINUTOS ? 'A tiempo' : 'Tarde';
      const estado = await this.estadosRepository.findOne({ where: { nombre: nombreEstado } });
      estado_id = estado?.id_estados ?? null;
      clasificacion = nombreEstado;
    }

    // Buscar dispositivo del laboratorio asociado al horario
    let dispositivo_id: number | null = null;
    if (horario?.laboratorio_id) {
      const dispositivo = await this.dispositivosRepository.findOne({
        where: { laboratorio_id: horario.laboratorio_id },
      });
      dispositivo_id = dispositivo?.id_dispositivos ?? null;
    }

    const fecha_hora = new Date();
    const asistencia = this.asistenciaRepository.create({
      tarjeta_id: tarjeta.id_tarjeta,
      tarjeta_nfc_id: tarjeta.id_tarjeta,
      usuario_id: tarjeta.usuario_id,
      dispositivo_id,
      fecha_hora,
      tipo: 'entrada',
      estado_id,
      horario_id,
      hora_entrada_esperada: horario?.hora_inicio ?? null,
      minutos_diferencia: tardanza,
    });
    await this.asistenciaRepository.save(asistencia);

    this.logger.log(
      `marcar() — usuario: ${tarjeta.usuario.correo}, horario_id: ${horario_id}, clasificacion: ${clasificacion ?? 'sin horario'}`,
    );

    if (clasificacion === 'Tarde' && horario) {
      const adminEmail = await this.findAdminEmail();
      if (adminEmail) {
        void this.notificacionesService.sendAlertaAsistencia(adminEmail, {
          usuario: tarjeta.usuario.nombre,
          dia: NOMBRE_DIA[horario.dia_semana] ?? String(horario.dia_semana),
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          laboratorio: horario.laboratorio?.nombre ?? 'N/A',
          tipo: 'tarde',
        });
      }
    }

    return {
      mensaje: 'Asistencia registrada',
      ya_registrado: false,
      usuario: usuarioInfo,
      fecha_hora,
      clasificacion,
    };
  }

  async findAdminEmail(): Promise<string | null> {
    const rol = await this.rolesRepository.findOne({ where: { nombre: 'Administrador' } });
    if (!rol) return null;
    const admin = await this.usuariosRepository.findOne({ where: { rol_id: rol.id_roles } });
    return admin?.correo ?? null;
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
