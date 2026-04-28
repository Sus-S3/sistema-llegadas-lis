import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tarjeta } from '../../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_asistencia')
export class Asistencia {
  @PrimaryGeneratedColumn({ name: 'id_asistencia' })
  id_asistencia!: number;

  @Column({ name: 'tarjeta_id', type: 'int' })
  tarjeta_id!: number;

  @ManyToOne(() => Tarjeta, { nullable: false, eager: false })
  @JoinColumn({ name: 'tarjeta_id' })
  tarjeta!: Tarjeta;

  @Column({ name: 'usuario_id', type: 'int' })
  usuario_id!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'timestamptz', name: 'fecha_hora', default: () => 'NOW()' })
  fecha_hora!: Date;

  @Column({ type: 'varchar', length: 20, default: 'entrada' })
  tipo!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;
}
