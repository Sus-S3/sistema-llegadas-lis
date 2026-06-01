import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Justificacion } from '../../justificaciones/entities/justificacion.entity';
import { Archivo } from './archivo.entity';

@Entity('tbl_archivos_justificacion')
@Unique(['justificacion_id', 'archivo_id'])
export class ArchivoJustificacion {
  @PrimaryGeneratedColumn({ name: 'id_archivos_justificacion' })
  id_archivos_justificacion!: number;

  @Column({ name: 'justificacion_id', type: 'int' })
  justificacion_id!: number;

  @ManyToOne(() => Justificacion, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'justificacion_id' })
  justificacion!: Justificacion;

  @Column({ name: 'archivo_id', type: 'int' })
  archivo_id!: number;

  @ManyToOne(() => Archivo, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'archivo_id' })
  archivo!: Archivo;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;
}
