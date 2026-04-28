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
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_tarjetas')
export class Tarjeta {
  @PrimaryGeneratedColumn({ name: 'id_tarjeta' })
  id_tarjeta!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  uid_nfc!: string;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuario_id!: number | null;

  @ManyToOne(() => Usuario, { nullable: true, eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario | null;

  @Column({ name: 'estado_id', type: 'int' })
  estado_id!: number;

  @ManyToOne(() => Estado, { nullable: false, eager: false })
  @JoinColumn({ name: 'estado_id' })
  estado!: Estado;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en' })
  actualizado_en!: Date;
}
