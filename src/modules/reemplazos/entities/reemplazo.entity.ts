import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Horario } from '../../horarios/entities/horario.entity';
import { Estado } from '../../laboratorios/entities/estado.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_reemplazos')
export class Reemplazo {
  @PrimaryGeneratedColumn({ name: 'id_reemplazo' })
  id_reemplazo!: number;

  @Column({ name: 'solicitante_id', type: 'int' })
  solicitante_id!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'solicitante_id' })
  solicitante!: Usuario;

  @Column({ name: 'reemplazante_id', type: 'int' })
  reemplazante_id!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'reemplazante_id' })
  reemplazante!: Usuario;

  @Column({ name: 'horario_id', type: 'int', nullable: true })
  horario_id!: number | null;

  @ManyToOne(() => Horario, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'horario_id' })
  horario!: Horario | null;

  @Column({ type: 'text' })
  motivo!: string;

  @Column({ name: 'estado_id', type: 'int' })
  estado_id!: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado!: Estado;

  @Column({ name: 'revisado_por', type: 'int', nullable: true })
  revisado_por!: number | null;

  @ManyToOne(() => Usuario, { nullable: true, eager: false })
  @JoinColumn({ name: 'revisado_por' })
  revisor!: Usuario | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'fecha_solicitud' })
  fecha_solicitud!: Date;

  @Column({ type: 'timestamptz', name: 'fecha_revision', nullable: true })
  fecha_revision!: Date | null;
}
