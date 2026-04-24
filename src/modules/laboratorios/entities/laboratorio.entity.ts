import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Estado } from './estado.entity';

@Entity('tbl_laboratorios')
export class Laboratorio {
  @PrimaryGeneratedColumn({ name: 'id_laboratorios' })
  id_laboratorios: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion: string | null;

  @Column({ name: 'estado_id', nullable: true })
  estado_id: number | null;

  @ManyToOne(() => Estado, { nullable: true, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado: Estado | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en: Date;
}
