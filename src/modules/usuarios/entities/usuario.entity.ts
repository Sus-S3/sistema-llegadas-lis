import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
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

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en' })
  actualizado_en: Date;
}
