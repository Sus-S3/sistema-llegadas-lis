import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Asistencia } from '../../asistencia/entities/asistencia.entity';
import { Estado } from '../../laboratorios/entities/estado.entity';

@Entity('tbl_notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  id_notificacion!: number;

  @Column({ type: 'varchar', length: 15 })
  tipo!: string;

  @Column({ name: 'correo_destinatario', type: 'varchar', length: 254 })
  correo_destinatario!: string;

  @Column({ type: 'varchar', length: 300 })
  asunto!: string;

  @Column({ name: 'asistencia_id', type: 'int' })
  asistencia_id!: number;

  @ManyToOne(() => Asistencia, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asistencia_id' })
  asistencia!: Asistencia;

  @Column({ name: 'estado_id', type: 'int' })
  estado_id!: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado!: Estado;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;
}
