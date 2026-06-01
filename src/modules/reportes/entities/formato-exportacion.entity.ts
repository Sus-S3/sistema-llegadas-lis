import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tbl_formatos_exportacion')
export class FormatoExportacion {
  @PrimaryGeneratedColumn({ name: 'id_formatos_exportacion' })
  id_formatos_exportacion!: number;

  @Column({ type: 'varchar', length: 10, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  descripcion!: string | null;
}
