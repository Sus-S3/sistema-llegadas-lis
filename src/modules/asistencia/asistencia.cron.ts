import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from '../horarios/entities/horario.entity';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Rol } from '../roles/entities/rol.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { Asistencia } from './entities/asistencia.entity';
import { AsistenciaService } from './asistencia.service';

const TZ = 'America/Bogota';

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
  private readonly logger = new Logger(AsistenciaCron.name);

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

  @Cron('*/5 * * * *')
  async revisarAusentes(): Promise<void> {
    try {
      const ahora = new Date();
      const diaSemana = new Date(ahora.toLocaleString('en-US', { timeZone: TZ })).getDay();
      const minutosAhora = minutosLocales(ahora);

      // Todos los horarios activos del día de hoy
      const horariosHoy = await this.horariosRepo
        .createQueryBuilder('h')
        .leftJoinAndSelect('h.usuario', 'u')
        .leftJoinAndSelect('h.laboratorio', 'l')
        .innerJoin('tbl_estados', 'e', 'e.id_estados = h.estado_id')
        .where('h.dia_semana = :dia', { dia: diaSemana })
        .andWhere("LOWER(e.nombre) = 'activo'")
        .getMany();

      // Solo los que ya terminaron (hora_fin < ahora en Bogota)
      const terminados = horariosHoy.filter((h) => {
        const [hh, mm] = h.hora_fin.split(':').map(Number);
        return hh * 60 + mm < minutosAhora;
      });

      if (terminados.length === 0) return;

      const estadoAusente = await this.estadosRepo.findOne({ where: { nombre: 'Ausente' } });
      if (!estadoAusente) {
        this.logger.warn('revisarAusentes() — Estado "Ausente" no encontrado, abortando');
        return;
      }

      const adminEmail = await this.asistenciaService.findAdminEmail();

      for (const horario of terminados) {
        const existente = await this.asistenciaRepo
          .createQueryBuilder('a')
          .where('a.usuario_id = :uid', { uid: horario.usuario_id })
          .andWhere('a.horario_id = :hid', { hid: horario.id_horarios })
          .andWhere('DATE(a.fecha_hora) = CURRENT_DATE')
          .getOne();

        if (existente) continue;

        await this.asistenciaRepo.save(
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
          void this.notificacionesService.sendAlertaAsistencia(adminEmail, {
            usuario: horario.usuario?.nombre ?? `Usuario #${horario.usuario_id}`,
            dia: NOMBRE_DIA[horario.dia_semana] ?? String(horario.dia_semana),
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
            laboratorio: horario.laboratorio?.nombre ?? 'N/A',
            tipo: 'ausente',
          });
        }
      }
    } catch (error) {
      this.logger.error(`revisarAusentes() — error: ${(error as Error).message}`);
    }
  }
}
