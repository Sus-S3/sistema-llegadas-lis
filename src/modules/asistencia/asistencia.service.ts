import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarjeta } from '../tarjetas/entities/tarjeta.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { MarcarAsistenciaDto } from './dto/marcar-asistencia.dto';
import { Asistencia } from './entities/asistencia.entity';

@Injectable()
export class AsistenciaService {
  private readonly logger = new Logger(AsistenciaService.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Tarjeta)
    private readonly tarjetasRepository: Repository<Tarjeta>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async marcar(dto: MarcarAsistenciaDto): Promise<{
    mensaje: string;
    usuario: { nombre: string; correo: string };
    fecha_hora: Date;
  }> {
    const tarjeta = await this.tarjetasRepository.findOne({
      where: { uid_nfc: dto.uid_nfc },
      relations: ['usuario'],
    });

    if (!tarjeta) throw new NotFoundException('Tarjeta no registrada');
    if (!tarjeta.usuario_id || !tarjeta.usuario) {
      throw new BadRequestException('Tarjeta sin usuario asignado');
    }

    const fecha_hora = new Date();
    const asistencia = this.asistenciaRepository.create({
      tarjeta_id: tarjeta.id_tarjeta,
      usuario_id: tarjeta.usuario_id,
      fecha_hora,
      tipo: 'entrada',
    });
    await this.asistenciaRepository.save(asistencia);

    this.logger.log(`marcar() — usuario: ${tarjeta.usuario.correo}, tarjeta: ${tarjeta.uid_nfc}`);

    return {
      mensaje: 'Asistencia registrada',
      usuario: { nombre: tarjeta.usuario.nombre, correo: tarjeta.usuario.correo },
      fecha_hora,
    };
  }

  findAll(usuarioId?: number, fecha?: string): Promise<Asistencia[]> {
    const qb = this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.tarjeta', 't')
      .orderBy('a.fecha_hora', 'DESC');

    if (usuarioId) {
      qb.andWhere('a.usuario_id = :usuarioId', { usuarioId });
    }

    if (fecha) {
      qb.andWhere('DATE(a.fecha_hora) = :fecha', { fecha });
    }

    return qb.getMany();
  }

  findByUsuario(usuario_id: number): Promise<Asistencia[]> {
    return this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.tarjeta', 't')
      .where('a.usuario_id = :usuario_id', { usuario_id })
      .orderBy('a.fecha_hora', 'DESC')
      .getMany();
  }

  findByFecha(fecha: string): Promise<Asistencia[]> {
    return this.asistenciaRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('a.tarjeta', 't')
      .where('DATE(a.fecha_hora) = :fecha', { fecha })
      .orderBy('a.fecha_hora', 'DESC')
      .getMany();
  }
}
