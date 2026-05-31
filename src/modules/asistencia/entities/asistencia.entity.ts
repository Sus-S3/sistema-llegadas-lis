import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Dispositivo } from '../../dispositivos/entities/dispositivo.entity';
import { Horario } from '../../horarios/entities/horario.entity';
import { Estado } from '../../laboratorios/entities/estado.entity';
import { Tarjeta } from '../../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_asistencia')
export class Asistencia {
  @PrimaryGeneratedColumn({ name: 'id_asistencia' })
  id_asistencia!: number;

  @Column({ name: 'tarjeta_id', type: 'int', nullable: true })
  tarjeta_id!: number | null;

  @ManyToOne(() => Tarjeta, { nullable: true, eager: false })
  @JoinColumn({ name: 'tarjeta_id' })
  tarjeta!: Tarjeta | null;

  @Column({ name: 'tarjeta_nfc_id', type: 'int', nullable: true })
  tarjeta_nfc_id!: number | null;

  @ManyToOne(() => Tarjeta, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tarjeta_nfc_id' })
  tarjeta_nfc!: Tarjeta | null;

  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ name: 'dispositivo_id', type: 'int', nullable: true })
  dispositivo_id!: number | null;

  @ManyToOne(() => Dispositivo, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dispositivo_id' })
  dispositivo!: Dispositivo | null;

  @Column({ type: 'timestamptz', name: 'fecha_hora', default: () => 'NOW()' })
  fecha_hora!: Date;

  @Column({ type: 'varchar', length: 20, default: 'entrada' })
  tipo!: string;

  @Column({ name: 'estado_id', type: 'int', nullable: true })
  estado_id!: number | null;

  @ManyToOne(() => Estado, { nullable: true, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado!: Estado | null;

  @Column({ name: 'horario_id', type: 'int', nullable: true })
  horario_id!: number | null;

  @ManyToOne(() => Horario, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'horario_id' })
  horario!: Horario | null;

  @Column({ type: 'time', name: 'hora_entrada_esperada', nullable: true })
  hora_entrada_esperada!: string | null;

  @Column({ type: 'integer', name: 'minutos_diferencia', nullable: true })
  minutos_diferencia!: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;
}
