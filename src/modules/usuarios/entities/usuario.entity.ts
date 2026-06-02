import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Estado } from '../../laboratorios/entities/estado.entity';

@Entity('tbl_usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuarios' })
  id_usuarios: number;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 254, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  google_sub: string | null;

  @Column({ type: 'int' })
  rol_id: number;

  @Column({ type: 'int' })
  estado_id: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado!: Estado;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en' })
  actualizado_en: Date;
}
