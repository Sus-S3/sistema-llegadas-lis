import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const existing = await this.usuariosRepository.findOne({
      where: { correo: dto.correo },
    });
    if (existing) throw new ConflictException('El correo ya está registrado');

    const usuario = this.usuariosRepository.create(dto);
    return this.usuariosRepository.save(usuario);
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
