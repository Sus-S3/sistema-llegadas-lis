import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from '../horarios/entities/horario.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { Asistencia } from './entities/asistencia.entity';
import { AsistenciaService } from './asistencia.service';

const TZ = 'America/Bogota';
const TOLERANCIA_TARDANZA_MIN = 20;

const NOMBRE_DIA: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

function minutosLocales(date: Date): number {
  const local = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
  return local.getHours() * 60 + local.getMinutes();
}

@Injectable()
export class AsistenciaCron {
  private readonly logger = new Logger('AsistenciaCron');

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Horario)
    private readonly horariosRepo: Repository<Horario>,
    @InjectRepository(Estado)
    private readonly estadosRepo: Repository<Estado>,
    private readonly asistenciaService: AsistenciaService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Cron('* * * * *')
  async revisarAusentes(): Promise<void> {
    this.logger.warn(`revisarAusentes() ejecutado — ${new Date().toISOString()}`);
    try {
      const ahora = new Date();
      const ahoraLocal = new Date(ahora.toLocaleString('en-US', { timeZone: TZ }));
      const diaSemana = ahoraLocal.getDay();
      const minutosAhora = minutosLocales(ahora);
      const hoyBogota = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(ahora);
      const fechaLegible = ahora.toLocaleDateString('es-CO', {
        timeZone: TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const horariosHoy = await this.horariosRepo
        .createQueryBuilder('h')
        .leftJoinAndSelect('h.usuario', 'u')
        .leftJoinAndSelect('h.laboratorio', 'l')
        .innerJoin('tbl_estados', 'e', 'e.id_estados = h.estado_id')
        .where('h.dia_semana = :dia', { dia: diaSemana })
        .andWhere("LOWER(e.nombre) = 'activo'")
        .getMany();

      if (horariosHoy.length === 0) return;

      const estadoAusente = await this.estadosRepo.findOne({ where: { nombre: 'Ausente' } });
      if (!estadoAusente) {
        this.logger.warn('Estado "Ausente" no encontrado — la revisión de ausentes será omitida');
      }

      const adminEmail = await this.asistenciaService.findAdminEmail();

      for (const horario of horariosHoy) {
        const [ihh, imm] = horario.hora_inicio.split(':').map(Number);
        const [fhh, fmm] = horario.hora_fin.split(':').map(Number);
        const minutosInicio = ihh * 60 + imm;
        const minutosFin = fhh * 60 + fmm;

        // Verificar si ya existe registro de asistencia para este usuario+horario+hoy
        const tieneAsistencia = await this.asistenciaRepo
          .createQueryBuilder('a')
          .where('a.usuario_id = :uid', { uid: horario.usuario_id })
          .andWhere('a.horario_id = :hid', { hid: horario.id_horarios })
          .andWhere(
            "DATE(a.fecha_hora AT TIME ZONE 'America/Bogota') = :hoy",
            { hoy: hoyBogota },
          )
          .getOne();

        const datosBase = {
          usuario: horario.usuario?.nombre ?? `Usuario #${horario.usuario_id}`,
          dia: NOMBRE_DIA[horario.dia_semana] ?? String(horario.dia_semana),
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          laboratorio: horario.laboratorio?.nombre ?? 'N/A',
          fecha: fechaLegible,
          horario_id: horario.id_horarios,
          usuario_id: horario.usuario_id,
        };

        // ── Revisión 1: alerta de tardanza ────────────────────────────────────
        // Condición: > 20 min desde hora_inicio, antes del fin, sin asistencia
        if (
          !tieneAsistencia &&
          minutosAhora > minutosInicio + TOLERANCIA_TARDANZA_MIN &&
          minutosAhora < minutosFin
        ) {
          if (adminEmail) {
            void this.notificacionesService.sendAlertaAsistencia(adminEmail, {
              ...datosBase,
              tipo: 'tarde',
            });
          }
        }

        // ── Revisión 2: ausente (turno terminado sin asistencia) ──────────────
        if (!tieneAsistencia && minutosAhora >= minutosFin && estadoAusente) {
          const savedAusente = await this.asistenciaRepo.save(
            this.asistenciaRepo.create({
              tarjeta_id: null,
              usuario_id: horario.usuario_id,
              fecha_hora: ahora,
              tipo: 'ausente',
              estado_id: estadoAusente.id_estados,
              horario_id: horario.id_horarios,
            }),
          );

          this.logger.log(
            `revisarAusentes() — ausente registrado: usuario #${horario.usuario_id}, horario #${horario.id_horarios}`,
          );

          if (adminEmail) {
            this.logger.warn(`[CRON] Enviando correo ausencia id=${savedAusente.id_asistencia} usuario=${horario.usuario?.nombre}`);
            void this.notificacionesService.sendAlertaAsistencia(adminEmail, {
              ...datosBase,
              tipo: 'ausente',
              asistencia_id: savedAusente.id_asistencia,
            });
            this.logger.warn(`[CRON] sendAlertaAsistencia llamado para asistencia #${savedAusente.id_asistencia}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`revisarAusentes() — error: ${(error as Error).message}`);
    }
  }
}
