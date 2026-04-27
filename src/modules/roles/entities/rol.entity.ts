import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tbl_roles')
export class Rol {
  @PrimaryGeneratedColumn({ name: 'id_roles' })
  id_roles!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string | null;

  @Column({ name: 'estado_id', type: 'int', nullable: true })
  estado_id!: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en' })
  creado_en!: Date;
}
