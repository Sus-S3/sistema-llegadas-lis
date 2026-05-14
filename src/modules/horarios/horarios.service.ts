import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { Horario } from './entities/horario.entity';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario)
    private readonly horariosRepository: Repository<Horario>,
  ) {}

  create(dto: CreateHorarioDto): Promise<Horario> {
    return this.horariosRepository.save(this.horariosRepository.create(dto));
  }

  findAll(): Promise<Horario[]> {
    return this.horariosRepository.find({
      relations: ['usuario', 'laboratorio', 'estado'],
    });
  }

  findByUsuario(usuario_id: number): Promise<Horario[]> {
    return this.horariosRepository.find({
      where: { usuario_id },
      relations: ['laboratorio', 'estado'],
    });
  }

  /**
   * Devuelve el horario activo de un usuario para un día dado.
   * Usado por AsistenciaService para clasificar la llegada.
   */
  findHorarioActivo(usuario_id: number, dia_semana: string): Promise<Horario | null> {
    return this.horariosRepository
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.estado', 'e')
      .where('h.usuario_id = :usuario_id', { usuario_id })
      .andWhere('h.dia_semana = :dia_semana', { dia_semana })
      .andWhere("LOWER(e.nombre) = 'activo'")
      .getOne();
  }

  async findOne(id: number): Promise<Horario> {
    const horario = await this.horariosRepository.findOne({
      where: { id_horarios: id },
      relations: ['usuario', 'laboratorio', 'estado'],
    });
    if (!horario) throw new NotFoundException(`Horario #${id} no encontrado`);
    return horario;
  }

  async update(id: number, dto: UpdateHorarioDto): Promise<Horario> {
    const horario = await this.findOne(id);
    Object.assign(horario, dto);
    return this.horariosRepository.save(horario);
  }

  async remove(id: number): Promise<void> {
    const horario = await this.findOne(id);
    await this.horariosRepository.remove(horario);
  }
}
