import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { Asistencia } from '../asistencia/entities/asistencia.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { ExportacionReporte } from './entities/exportacion-reporte.entity';
import { FormatoExportacion } from './entities/formato-exportacion.entity';

const TZ = 'America/Bogota';

export interface ReporteFilters {
  usuario_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(ExportacionReporte)
    private readonly exportacionRepo: Repository<ExportacionReporte>,
    @InjectRepository(FormatoExportacion)
    private readonly formatoRepo: Repository<FormatoExportacion>,
    @InjectRepository(Usuario)
    private readonly usuariosRepo: Repository<Usuario>,
  ) {}

  private async getRegistros(filters: ReporteFilters): Promise<Asistencia[]> {
    const qb = this.asistenciaRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.estado', 'e')
      .leftJoinAndSelect('a.horario', 'h')
      .leftJoinAndSelect('h.laboratorio', 'l')
      .orderBy('a.fecha_hora', 'DESC');

    if (filters.usuario_id) {
      qb.andWhere('a.usuario_id = :uid', { uid: filters.usuario_id });
    }
    if (filters.fecha_inicio) {
      qb.andWhere('a.fecha_hora >= :fi', { fi: filters.fecha_inicio });
    }
    if (filters.fecha_fin) {
      qb.andWhere('a.fecha_hora <= :ff', { ff: `${filters.fecha_fin} 23:59:59` });
    }

    return qb.getMany();
  }

  private formatFila(r: Asistencia) {
    const fechaBogota = new Date(r.fecha_hora.toLocaleString('en-US', { timeZone: TZ }));
    return {
      usuario: r.usuario?.nombre ?? '',
      correo: r.usuario?.correo ?? '',
      laboratorio: r.horario?.laboratorio?.nombre ?? 'Sin asignar',
      dia: fechaBogota.toLocaleDateString('es-CO', { weekday: 'long' }),
      fecha: fechaBogota.toLocaleDateString('es-CO'),
      hora: fechaBogota.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      estado: r.estado?.nombre ?? '',
    };
  }

  private async persistirExportacion(
    generadoPorId: number,
    nombreFormato: string,
    filters: ReporteFilters,
    totalRegistros: number,
  ): Promise<void> {
    try {
      const formato = await this.formatoRepo.findOne({ where: { nombre: nombreFormato } });
      if (!formato) {
        this.logger.warn(`persistirExportacion() → formato '${nombreFormato}' no encontrado en BD`);
        return;
      }
      await this.exportacionRepo.save(
        this.exportacionRepo.create({
          generado_por: generadoPorId,
          id_formatos_exportacion: formato.id_formatos_exportacion,
          filtros: JSON.stringify(filters),
          url_archivo: null,
          total_registros: totalRegistros,
        }),
      );
    } catch (error) {
      this.logger.error(`persistirExportacion() → error: ${(error as Error).message}`);
    }
  }

  async generateExcel(filters: ReporteFilters, generadoPorId: number): Promise<Buffer> {
    const registros = await this.getRegistros(filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencia');

    sheet.columns = [
      { header: 'Usuario',      key: 'usuario',     width: 28 },
      { header: 'Correo',       key: 'correo',      width: 32 },
      { header: 'Laboratorio',  key: 'laboratorio', width: 20 },
      { header: 'Día',          key: 'dia',         width: 14 },
      { header: 'Fecha',        key: 'fecha',       width: 14 },
      { header: 'Hora entrada', key: 'hora',        width: 14 },
      { header: 'Estado',       key: 'estado',      width: 14 },
    ];

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e3a5f' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    for (const r of registros) {
      sheet.addRow(this.formatFila(r));
    }

    const raw = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(raw);

    void this.persistirExportacion(generadoPorId, 'EXCEL', filters, registros.length);

    return buffer;
  }

  async generatePdf(filters: ReporteFilters, generadoPorId: number): Promise<Buffer> {
    const registros = await this.getRegistros(filters);

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).font('Helvetica-Bold').text('Reporte de Asistencia', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
        .text(`Generado: ${new Date().toLocaleString('es-CO', { timeZone: TZ })}`, { align: 'center' });
      doc.moveDown(1);

      const cols: [number, string, keyof ReturnType<typeof this.formatFila>][] = [
        [140, 'Usuario',      'usuario'],
        [155, 'Correo',       'correo'],
        [ 95, 'Laboratorio',  'laboratorio'],
        [ 65, 'Día',          'dia'],
        [ 65, 'Fecha',        'fecha'],
        [ 65, 'Hora entrada', 'hora'],
        [ 65, 'Estado',       'estado'],
      ];

      const startX = 30;
      const rowH = 18;

      const dibujarFila = (fila: Record<string, string>, y: number, bgColor?: string) => {
        let x = startX;
        if (bgColor) {
          const totalW = cols.reduce((s, [w]) => s + w, 0);
          doc.rect(x, y - 3, totalW, rowH).fill(bgColor).fillColor('#000000');
        }
        for (const [w, , key] of cols) {
          doc.fontSize(8).font('Helvetica').fillColor(bgColor === '#1e3a5f' ? '#ffffff' : '#111827')
            .text(fila[key] ?? '', x + 4, y, { width: w - 8, lineBreak: false, ellipsis: true });
          x += w;
        }
      };

      const headerFila = Object.fromEntries(cols.map(([, h, k]) => [k, h])) as Record<string, string>;
      dibujarFila(headerFila, doc.y, '#1e3a5f');
      doc.moveDown(1.2);

      for (let i = 0; i < registros.length; i++) {
        if (doc.y > 520) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
          dibujarFila(headerFila, doc.y, '#1e3a5f');
          doc.moveDown(1.2);
        }
        const bg = i % 2 === 0 ? '#f9fafb' : undefined;
        dibujarFila(this.formatFila(registros[i]) as Record<string, string>, doc.y, bg);
        doc.moveDown(1.2);
      }

      doc.end();
    });

    void this.persistirExportacion(generadoPorId, 'PDF', filters, registros.length);

    return buffer;
  }

  findAll(): Promise<ExportacionReporte[]> {
    return this.exportacionRepo.find({
      relations: ['usuario', 'formato'],
      order: { generado_en: 'DESC' },
    });
  }
}
