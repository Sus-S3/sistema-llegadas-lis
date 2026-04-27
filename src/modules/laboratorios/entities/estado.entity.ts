import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tbl_estados')
export class Estado {
  @PrimaryGeneratedColumn({ name: 'id_estados' })
  id_estados!: number;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ name: 'categoria_estado_id', type: 'int', nullable: true })
  categoria_estado_id!: number | null;
}
