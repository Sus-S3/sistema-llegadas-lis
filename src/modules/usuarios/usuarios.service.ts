import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    this.logger.log(`create() llamado — correo: ${dto.correo}, rol_id: ${dto.rol_id}, estado_id: ${dto.estado_id}`);

    const existing = await this.usuariosRepository.findOne({
      where: { correo: dto.correo },
    });
    if (existing) {
      this.logger.warn(`create() bloqueado — correo ya registrado: ${dto.correo}`);
      throw new ConflictException('El correo ya está registrado');
    }

    const usuario = this.usuariosRepository.create(dto);
    this.logger.log(`Entidad creada en memoria, ejecutando save()...`);

    try {
      const saved = await this.usuariosRepository.save(usuario);
      this.logger.log(`save() exitoso — id_usuarios: ${saved.id_usuarios}`);
      return saved;
    } catch (error) {
      this.logger.error(`save() falló: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find();
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id_usuarios: id },
    });
    if (!usuario) throw new NotFoundException(`Usuario #${id} no encontrado`);
    return usuario;
  }

  async findByCorreo(correo: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { correo } });
  }

  async findByGoogleSub(googleSub: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({ where: { google_sub: googleSub } });
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);
    Object.assign(usuario, dto);
    return this.usuariosRepository.save(usuario);
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuariosRepository.remove(usuario);
  }
}
