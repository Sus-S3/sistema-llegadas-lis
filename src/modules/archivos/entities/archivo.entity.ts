import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('tbl_archivos')
export class Archivo {
  @PrimaryGeneratedColumn({ name: 'id_archivos' })
  id_archivos!: number;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombre_original!: string;

  @Column({ name: 'nombre_almacenado', type: 'varchar', length: 255, unique: true })
  nombre_almacenado!: string;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ name: 'tipo_mime', type: 'varchar', length: 100 })
  tipo_mime!: string;

  @Column({ name: 'tamanio_bytes', type: 'bigint' })
  tamanio_bytes!: number;

  @Column({ name: 'subido_por', type: 'int' })
  subido_por!: number;

  @ManyToOne(() => Usuario, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subido_por' })
  usuario!: Usuario;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;
}
