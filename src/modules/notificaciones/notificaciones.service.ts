import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface AlertaAsistenciaDatos {
  usuario: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  laboratorio: string;
  tipo: 'tarde' | 'ausente';
}

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendAlertaAsistencia(adminEmail: string, datos: AlertaAsistenciaDatos): Promise<void> {
    const tipoLabel = datos.tipo === 'tarde' ? 'Tarde' : 'Ausente';
    const tipoColor = datos.tipo === 'tarde' ? '#f59e0b' : '#ef4444';

    try {
      await this.mailerService.sendMail({
        to: adminEmail,
        subject: `Alerta de asistencia - ${tipoLabel}`,
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
      this.logger.log(
        `sendAlertaAsistencia() → enviado a ${adminEmail}, tipo: ${tipoLabel}, usuario: ${datos.usuario}`,
      );
    } catch (error) {
      this.logger.error(
        `sendAlertaAsistencia() → error al enviar correo a ${adminEmail}: ${(error as Error).message}`,
      );
    }
  }
}
