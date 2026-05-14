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
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_justificaciones')
export class Justificacion {
  @PrimaryGeneratedColumn({ name: 'id_justificacion' })
  id_justificacion!: number;

  @Column({ name: 'asistencia_id', type: 'int' })
  asistencia_id!: number;

  @ManyToOne(() => Asistencia, { nullable: false, eager: false })
  @JoinColumn({ name: 'asistencia_id' })
  asistencia!: Asistencia;

  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'text' })
  motivo!: string;

  @Column({ name: 'estado_id', type: 'int' })
  estado_id!: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado!: Estado;

  // Columna FK separada de la relación para evitar conflicto de nombre con el property de relación
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
