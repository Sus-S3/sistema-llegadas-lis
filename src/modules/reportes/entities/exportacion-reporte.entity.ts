import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { FormatoExportacion } from './formato-exportacion.entity';

@Entity('tbl_exportaciones_reporte')
export class ExportacionReporte {
  @PrimaryGeneratedColumn({ name: 'id_exportaciones_reporte' })
  id_exportaciones_reporte!: number;

  @Column({ name: 'generado_por', type: 'int' })
  generado_por!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'generado_por' })
  usuario!: Usuario;

  @Column({ name: 'id_formatos_exportacion', type: 'int' })
  id_formatos_exportacion!: number;

  @ManyToOne(() => FormatoExportacion, { nullable: false, eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_formatos_exportacion' })
  formato!: FormatoExportacion;

  @Column({ type: 'text' })
  filtros!: string;

  @Column({ name: 'url_archivo', type: 'varchar', length: 500, nullable: true })
  url_archivo!: string | null;

  @Column({ name: 'total_registros', type: 'integer', default: 0 })
  total_registros!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'generado_en' })
  generado_en!: Date;
}
