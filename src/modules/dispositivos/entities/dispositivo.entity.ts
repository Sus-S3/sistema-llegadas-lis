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

@Entity('tbl_dispositivos')
export class Dispositivo {
  @PrimaryGeneratedColumn({ name: 'id_dispositivos' })
  id_dispositivos: number;

  @Column({ name: 'laboratorio_id' })
  laboratorio_id: number;

  @ManyToOne(() => Laboratorio, { nullable: false, eager: false })
  @JoinColumn({ name: 'laboratorio_id' })
  laboratorio: Laboratorio;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'estado_id' })
  estado_id: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado: Estado;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en: Date;
}
