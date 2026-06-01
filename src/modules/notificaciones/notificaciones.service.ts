import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Estado } from '../laboratorios/entities/estado.entity';
import { Notificacion } from './entities/notificacion.entity';

export interface AlertaAsistenciaDatos {
  usuario: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  laboratorio: string;
  tipo: 'tarde' | 'ausente';
  asistencia_id: number;
}

const TIPO_MAP: Record<'tarde' | 'ausente', string> = {
  tarde: 'LLEGADA_TARDE',
  ausente: 'AUSENCIA',
};

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly mailerService: MailerService,
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

    // Deduplicación: no reenviar si ya existe para esta asistencia y tipo
    const existe = await this.notificacionesRepo.findOne({
      where: { asistencia_id: datos.asistencia_id, tipo: tipoNotificacion },
    });
    if (existe) {
      this.logger.log(
        `sendAlertaAsistencia() → ya existe notificación para asistencia #${datos.asistencia_id} tipo ${tipoNotificacion}, omitiendo`,
      );
      return;
    }

    const [estadoEnviada, estadoFallida] = await Promise.all([
      this.findEstadoNotificacion('Enviada'),
      this.findEstadoNotificacion('Fallida'),
    ]);

    try {
      await this.mailerService.sendMail({
        to: adminEmail,
        subject: asunto,
        html: `
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
              <tr>
                <td style="padding:10px 12px; border:1px solid #e5e7eb; font-weight:600;">Horario</td>
                <td style="padding:10px 12px; border:1px solid #e5e7eb;">${datos.hora_inicio} – ${datos.hora_fin}</td>
              </tr>
            </table>
            <p style="color:#9ca3af; font-size:12px; margin-top:20px;">
              Sistema de Llegadas LIS · Generado automáticamente
            </p>
          </div>
        `,
      });

      if (estadoEnviada) {
        await this.notificacionesRepo.save(
          this.notificacionesRepo.create({
            tipo: tipoNotificacion,
            correo_destinatario: adminEmail,
            asunto,
            asistencia_id: datos.asistencia_id,
            estado_id: estadoEnviada.id_estados,
          }),
        );
      }

      this.logger.log(
        `sendAlertaAsistencia() → enviado a ${adminEmail}, tipo: ${tipoLabel}, usuario: ${datos.usuario}`,
      );
    } catch (error) {
      this.logger.error(
        `sendAlertaAsistencia() → error al enviar correo a ${adminEmail}: ${(error as Error).message}`,
      );

      if (estadoFallida) {
        await this.notificacionesRepo.save(
          this.notificacionesRepo.create({
            tipo: tipoNotificacion,
            correo_destinatario: adminEmail,
            asunto,
            asistencia_id: datos.asistencia_id,
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
