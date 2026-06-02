import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Notificacion } from './entities/notificacion.entity';

export interface AlertaAsistenciaDatos {
  usuario: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  laboratorio: string;
  tipo: 'tarde' | 'ausente';
  asistencia_id?: number;   // null para alertas de tardanza sin registro aún
  horario_id?: number;      // necesario para dedup cuando no hay asistencia_id
  usuario_id?: number;      // necesario para dedup cuando no hay asistencia_id
  fecha?: string;
}

const TIPO_MAP: Record<'tarde' | 'ausente', string> = {
  tarde: 'LLEGADA_TARDE',
  ausente: 'AUSENCIA',
};

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionesRepo: Repository<Notificacion>,
    @InjectRepository(Estado)
    private readonly estadosRepo: Repository<Estado>,
  ) {}

  async sendAlertaAsistencia(adminEmail: string, datos: AlertaAsistenciaDatos): Promise<void> {
    const tipoNotificacion = TIPO_MAP[datos.tipo];
    const tipoLabel = datos.tipo === 'tarde' ? 'Tarde' : 'Ausente';
    const tipoColor = datos.tipo === 'tarde' ? '#f59e0b' : '#ef4444';
    const asunto = `Alerta de asistencia - ${tipoLabel}`;

    // Deduplicación:
    // - Con asistencia_id: buscar por asistencia_id + tipo
    // - Sin asistencia_id (alerta tardanza): buscar por horario_id + usuario_id + tipo + fecha hoy
    const dedupQb = this.notificacionesRepo
      .createQueryBuilder('n')
      .where('n.tipo = :tipo', { tipo: tipoNotificacion });

    if (datos.asistencia_id != null) {
      dedupQb.andWhere('n.asistencia_id = :aid', { aid: datos.asistencia_id });
    } else {
      dedupQb
        .andWhere('n.horario_id = :hid', { hid: datos.horario_id })
        .andWhere('n.usuario_id = :uid', { uid: datos.usuario_id })
        .andWhere("DATE(n.creado_en AT TIME ZONE 'America/Bogota') = CURRENT_DATE AT TIME ZONE 'America/Bogota'");
    }

    const existe = await dedupQb.getOne();
    if (existe) {
      this.logger.log(
        `sendAlertaAsistencia() → ya existe notificación tipo ${tipoNotificacion} (asistencia=${datos.asistencia_id ?? 'n/a'}, horario=${datos.horario_id ?? 'n/a'}), omitiendo`,
      );
      return;
    }

    const [estadoEnviada, estadoFallida] = await Promise.all([
      this.findEstadoNotificacion('Enviada'),
      this.findEstadoNotificacion('Fallida'),
    ]);

    const html = `
      <div style="font-family: sans-serif; max-width: 580px; padding: 24px;">
        <h2 style="color: ${tipoColor}; margin-top: 0;">
          Alerta de Asistencia: ${tipoLabel}
        </h2>
        <table style="width:100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 12px; border:1px solid #e5e7eb; font-weight:600; width:140px;">Auxiliar</td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${datos.usuario}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e5e7eb; font-weight:600;">Laboratorio</td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${datos.laboratorio}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 12px; border:1px solid #e5e7eb; font-weight:600;">Día</td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${datos.dia}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 12px; border:1px solid #e5e7eb; font-weight:600;">Fecha</td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${datos.fecha ?? ''}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px; border:1px solid #e5e7eb; font-weight:600;">Horario</td>
            <td style="padding:10px 12px; border:1px solid #e5e7eb;">${datos.hora_inicio} – ${datos.hora_fin}</td>
          </tr>
        </table>
        <p style="color:#9ca3af; font-size:12px; margin-top:20px;">
          Sistema de Llegadas LIS · Generado automáticamente
        </p>
      </div>
    `;

    try {
      const { error } = await this.resend.emails.send({
        from: process.env.MAIL_FROM ?? 'Sistema LIS <noreply@resend.dev>',
        to: adminEmail,
        subject: asunto,
        html,
      });

      if (error) {
        throw new Error(`Resend error: ${JSON.stringify(error)}`);
      }

      if (estadoEnviada) {
        await this.notificacionesRepo.save(
          this.notificacionesRepo.create({
            tipo: tipoNotificacion,
            correo_destinatario: adminEmail,
            asunto,
            asistencia_id: datos.asistencia_id ?? null,
            horario_id: datos.horario_id ?? null,
            usuario_id: datos.usuario_id ?? null,
            estado_id: estadoEnviada.id_estados,
          }),
        );
      }

      this.logger.log(
        `sendAlertaAsistencia() → enviado a ${adminEmail}, tipo: ${tipoLabel}, usuario: ${datos.usuario}`,
      );
    } catch (error) {
      this.logger.error(
        `sendAlertaAsistencia() → error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
      );

      if (estadoFallida) {
        await this.notificacionesRepo.save(
          this.notificacionesRepo.create({
            tipo: tipoNotificacion,
            correo_destinatario: adminEmail,
            asunto,
            asistencia_id: datos.asistencia_id ?? null,
            horario_id: datos.horario_id ?? null,
            usuario_id: datos.usuario_id ?? null,
            estado_id: estadoFallida.id_estados,
          }),
        ).catch((e: Error) =>
          this.logger.error(`sendAlertaAsistencia() → no se pudo persistir 'Fallida': ${e.message}`),
        );
      }
    }
  }

  findAll(): Promise<Notificacion[]> {
    return this.notificacionesRepo.find({
      relations: ['estado'],
      order: { creado_en: 'DESC' },
    });
  }

  private findEstadoNotificacion(nombre: string): Promise<Estado | null> {
    return this.estadosRepo
      .createQueryBuilder('e')
      .innerJoin(
        'tbl_categorias_estado',
        'c',
        'c.id_categorias_estado = e.categoria_estado_id',
      )
      .where('e.nombre = :nombre', { nombre })
      .andWhere("c.nombre = 'NOTIFICACION'")
      .getOne();
  }
}
