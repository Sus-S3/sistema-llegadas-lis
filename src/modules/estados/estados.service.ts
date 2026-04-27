import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Estado } from '../laboratorios/entities/estado.entity';

@Injectable()
export class EstadosService {
  constructor(
    @InjectRepository(Estado)
    private readonly estadosRepository: Repository<Estado>,
  ) {}

  findAll(categoria?: string): Promise<Estado[]> {
    const qb = this.estadosRepository.createQueryBuilder('e');

    if (categoria) {
      qb.innerJoin(
        'tbl_categorias_estado',
        'c',
        'c.id_categorias_estado = e.categoria_estado_id',
      ).where('LOWER(c.nombre) = LOWER(:categoria)', { categoria });
    }

    return qb.getMany();
  }
}
