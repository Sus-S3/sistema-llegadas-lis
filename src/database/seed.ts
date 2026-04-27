import { DataSource, Repository } from 'typeorm';
import { CategoriaEstado } from '../modules/estados/entities/categoria-estado.entity';
import { Estado } from '../modules/laboratorios/entities/estado.entity';
import { Rol } from '../modules/roles/entities/rol.entity';

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

async function seedRoles(repo: Repository<Rol>, estadoActivoId: number): Promise<void> {
  console.log('[Seed] Roles');

  await repo.clear();

  for (const nombre of ROLES) {
    await repo.save(repo.create({ nombre, estado_id: estadoActivoId }));
    console.log(`[Seed]   ✓ ${nombre}`);
  }
}

// ─── función exportada ────────────────────────────────────────────────────────

export async function runSeed(dataSource: DataSource): Promise<void> {
  const categoriaRepo = dataSource.getRepository(CategoriaEstado);
  const estadoRepo    = dataSource.getRepository(Estado);
  const rolRepo       = dataSource.getRepository(Rol);

  const idMap = await seedCategorias(categoriaRepo);
  await seedEstados(estadoRepo, idMap);

  const estadoActivo = await estadoRepo.findOneOrFail({
    where: { nombre: 'Activo', categoria_estado_id: idMap.get('GENERAL') },
  });
  await seedRoles(rolRepo, estadoActivo.id_estados);

  console.log('[Seed] ✅ Completado');
}
