import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tbl_categorias_estado')
export class CategoriaEstado {
  @PrimaryGeneratedColumn({ name: 'id_categorias_estado' })
  id_categorias_estado: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;
}
