import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArchivoJustificacion } from './entities/archivo-justificacion.entity';
import { Archivo } from './entities/archivo.entity';

export interface CrearArchivoDto {
  nombre_original: string;
  nombre_almacenado: string;
  url: string;
  tipo_mime: string;
  tamanio_bytes: number;
  subido_por_id: number;
}

@Injectable()
export class ArchivosService {
  constructor(
    @InjectRepository(Archivo)
    private readonly archivosRepo: Repository<Archivo>,
    @InjectRepository(ArchivoJustificacion)
    private readonly asociacionRepo: Repository<ArchivoJustificacion>,
  ) {}

  crearRegistro(dto: CrearArchivoDto): Promise<Archivo> {
    return this.archivosRepo.save(
      this.archivosRepo.create({
        nombre_original: dto.nombre_original,
        nombre_almacenado: dto.nombre_almacenado,
        url: dto.url,
        tipo_mime: dto.tipo_mime,
        tamanio_bytes: dto.tamanio_bytes,
        subido_por: dto.subido_por_id,
      }),
    );
  }

  asociarAJustificacion(archivo_id: number, justificacion_id: number): Promise<ArchivoJustificacion> {
    return this.asociacionRepo.save(
      this.asociacionRepo.create({ archivo_id, justificacion_id }),
    );
  }

  findByJustificacion(justificacion_id: number): Promise<ArchivoJustificacion[]> {
    return this.asociacionRepo.find({
      where: { justificacion_id },
      relations: ['archivo', 'archivo.usuario'],
      order: { creado_en: 'DESC' },
    });
  }

  async eliminar(id_archivos: number): Promise<void> {
    const archivo = await this.archivosRepo.findOne({ where: { id_archivos } });
    if (!archivo) throw new NotFoundException(`Archivo #${id_archivos} no encontrado`);
    await this.archivosRepo.remove(archivo);
  }
}
