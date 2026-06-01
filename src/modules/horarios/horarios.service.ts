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
   * Devuelve el horario activo de un usuario para un día y hora dados.
   * Prioriza el turno cuya ventana [hora_inicio - 30min, hora_fin + 30min]
   * contiene la hora actual, permitiendo múltiples turnos por día.
   * Si ningún turno está en ventana, devuelve el más cercano por hora_inicio.
   */
  async findHorarioActivo(
    usuario_id: number,
    dia_semana: number,
    minutosActuales?: number,
  ): Promise<Horario | null> {
    const horarios = await this.horariosRepository
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.estado', 'e')
      .leftJoinAndSelect('h.laboratorio', 'l')
      .where('h.usuario_id = :usuario_id', { usuario_id })
      .andWhere('h.dia_semana = :dia_semana', { dia_semana })
      .andWhere("LOWER(e.nombre) = 'activo'")
      .getMany();

    if (horarios.length === 0) return null;
    if (horarios.length === 1) return horarios[0];

    if (minutosActuales === undefined) return horarios[0];

    const MARGEN = 30;

    // Prioridad 1: turno cuya ventana cubre la hora actual
    const enVentana = horarios.find((h) => {
      const [hiH, hiM] = h.hora_inicio.split(':').map(Number);
      const [hfH, hfM] = h.hora_fin.split(':').map(Number);
      return (
        minutosActuales >= hiH * 60 + hiM - MARGEN &&
        minutosActuales <= hfH * 60 + hfM + MARGEN
      );
    });
    if (enVentana) return enVentana;

    // Prioridad 2: turno con hora_inicio más próxima a la hora actual
    return horarios.reduce((prev, curr) => {
      const [ph, pm] = prev.hora_inicio.split(':').map(Number);
      const [ch, cm] = curr.hora_inicio.split(':').map(Number);
      const distPrev = Math.abs(ph * 60 + pm - minutosActuales);
      const distCurr = Math.abs(ch * 60 + cm - minutosActuales);
      return distCurr < distPrev ? curr : prev;
    });
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
