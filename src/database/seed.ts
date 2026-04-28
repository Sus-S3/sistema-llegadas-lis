import { DataSource, Repository } from 'typeorm';
import { CategoriaEstado } from '../modules/estados/entities/categoria-estado.entity';
import { Estado } from '../modules/laboratorios/entities/estado.entity';
import { Rol } from '../modules/roles/entities/rol.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';

// ─── datos ────────────────────────────────────────────────────────────────────

const CATEGORIAS = ['GENERAL', 'ASISTENCIA', 'JUSTIFICACION', 'NOTIFICACION', 'REEMPLAZO'];

const ESTADOS_POR_CATEGORIA: Record<string, string[]> = {
  GENERAL:       ['Activo', 'Inactivo'],
  ASISTENCIA:    ['A tiempo', 'Tarde', 'Ausente'],
  JUSTIFICACION: ['Pendiente', 'Aprobada', 'Rechazada'],
  NOTIFICACION:  ['Enviada', 'Fallida'],
  REEMPLAZO:     ['Pendiente', 'Aprobado', 'Rechazado'],
};

const ROLES = ['Auxiliar administrativo', 'Auxiliar de programación', 'Administrador'];

// ─── helpers ──────────────────────────────────────────────────────────────────

async function seedCategorias(
  repo: Repository<CategoriaEstado>,
): Promise<Map<string, number>> {
  console.log('[Seed] Categorías de estado');
  const idMap = new Map<string, number>();

  for (const nombre of CATEGORIAS) {
    let cat = await repo.findOne({ where: { nombre } });
    if (!cat) {
      cat = await repo.save(repo.create({ nombre }));
      console.log(`[Seed]   ✓ ${nombre}`);
    }
    idMap.set(nombre, cat.id_categorias_estado);
  }

  return idMap;
}

async function seedEstados(
  repo: Repository<Estado>,
  idMap: Map<string, number>,
): Promise<void> {
  console.log('[Seed] Estados');

  for (const [categoriaNombre, estados] of Object.entries(ESTADOS_POR_CATEGORIA)) {
    const categoria_estado_id = idMap.get(categoriaNombre)!;

    for (const nombre of estados) {
      const existe = await repo.findOne({ where: { nombre, categoria_estado_id } });
      if (!existe) {
        await repo.save(repo.create({ nombre, categoria_estado_id }));
        console.log(`[Seed]   ✓ ${nombre} (${categoriaNombre})`);
      }
    }
  }
}

async function seedRoles(
  repo: Repository<Rol>,
  estadoActivoId: number,
): Promise<Map<string, number>> {
  console.log('[Seed] Roles');

  const rolMap = new Map<string, number>();
  for (const nombre of ROLES) {
    let rol = await repo.findOne({ where: { nombre } });
    if (!rol) {
      rol = await repo.save(repo.create({ nombre, estado_id: estadoActivoId }));
      console.log(`[Seed]   ✓ ${nombre} (id=${rol.id_roles})`);
    } else if (rol.estado_id !== estadoActivoId) {
      rol.estado_id = estadoActivoId;
      rol = await repo.save(rol);
    }
    rolMap.set(nombre, rol.id_roles);
  }

  return rolMap;
}

async function seedUsuarios(
  repo: Repository<Usuario>,
  rolMap: Map<string, number>,
): Promise<void> {
  console.log('[Seed] Usuarios');

  const idAuxiliar     = rolMap.get('Auxiliar administrativo')!;
  const idAdministrador = rolMap.get('Administrador')!;
  const idsValidos      = [...rolMap.values()];

  const usuarios = await repo.find();
  let corregidos = 0;

  for (const usuario of usuarios) {
    const rolInvalido = !idsValidos.includes(usuario.rol_id);
    const esSusana    = usuario.correo === 'susana.suareza@udea.edu.co';

    const nuevoRolId = esSusana
      ? idAdministrador
      : rolInvalido
        ? idAuxiliar
        : null;

    if (nuevoRolId !== null && usuario.rol_id !== nuevoRolId) {
      console.log(`[Seed] Corrigiendo usuario ${usuario.correo}, rol_id actual: ${usuario.rol_id} → nuevo: ${nuevoRolId}`);
      usuario.rol_id = nuevoRolId;
      await repo.save(usuario);
      console.log(`[Seed]   ✓ ${usuario.correo} → rol_id ${nuevoRolId}`);
      corregidos++;
    }
  }

  console.log(`[Seed]   ${corregidos} usuario(s) con rol inválido corregido(s)`);
}

// ─── función exportada ────────────────────────────────────────────────────────

export async function runSeed(dataSource: DataSource): Promise<void> {
  const categoriaRepo = dataSource.getRepository(CategoriaEstado);
  const estadoRepo    = dataSource.getRepository(Estado);
  const rolRepo       = dataSource.getRepository(Rol);
  const usuarioRepo   = dataSource.getRepository(Usuario);

  const idMap = await seedCategorias(categoriaRepo);
  await seedEstados(estadoRepo, idMap);

  const estadoActivo = await estadoRepo.findOneOrFail({
    where: { nombre: 'Activo', categoria_estado_id: idMap.get('GENERAL') },
  });
  const rolMap = await seedRoles(rolRepo, estadoActivo.id_estados);
  await seedUsuarios(usuarioRepo, rolMap);

  console.log('[Seed] ✅ Completado');
}
