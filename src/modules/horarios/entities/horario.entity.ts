import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Estado } from '../../laboratorios/entities/estado.entity';
import { Laboratorio } from '../../laboratorios/entities/laboratorio.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_horarios')
export class Horario {
  @PrimaryGeneratedColumn({ name: 'id_horarios' })
  id_horarios: number;

  @Column({ name: 'usuario_id' })
  usuario_id: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'laboratorio_id' })
  laboratorio_id: number;

  @ManyToOne(() => Laboratorio, { nullable: false, eager: false })
  @JoinColumn({ name: 'laboratorio_id' })
  laboratorio: Laboratorio;

  @Column({ type: 'varchar', length: 10, name: 'dia_semana' })
  dia_semana: string;

  @Column({ type: 'time', name: 'hora_inicio' })
  hora_inicio: string;

  @Column({ type: 'time', name: 'hora_fin' })
  hora_fin: string;

  @Column({ name: 'estado_id' })
  estado_id: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado: Estado;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en: Date;
}
