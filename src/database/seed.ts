import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource, Repository } from 'typeorm';
import { CategoriaEstado } from '../modules/estados/entities/categoria-estado.entity';
import { Estado } from '../modules/laboratorios/entities/estado.entity';
import { Rol } from '../modules/roles/entities/rol.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [CategoriaEstado, Estado, Rol],
  synchronize: false,
  ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

// ─── datos de seed ────────────────────────────────────────────────────────────

const CATEGORIAS = ['GENERAL', 'ASISTENCIA', 'JUSTIFICACION', 'NOTIFICACION', 'REEMPLAZO'];

const ESTADOS_POR_CATEGORIA: Record<string, string[]> = {
  GENERAL:       ['Activo', 'Inactivo'],
  ASISTENCIA:    ['A tiempo', 'Tarde', 'Ausente'],
  JUSTIFICACION: ['Pendiente', 'Aprobada', 'Rechazada'],
  NOTIFICACION:  ['Enviada', 'Fallida'],
  REEMPLAZO:     ['Pendiente', 'Aprobado', 'Rechazado'],
};

const ROLES = ['Administrador', 'Coordinador', 'Auxiliar'];

// ─── helpers ──────────────────────────────────────────────────────────────────

async function seedCategorias(
  repo: Repository<CategoriaEstado>,
): Promise<Map<string, number>> {
  console.log('\n[1] Categorías de estado');
  const idMap = new Map<string, number>();

  for (const nombre of CATEGORIAS) {
    let cat = await repo.findOne({ where: { nombre } });
    if (!cat) {
      cat = await repo.save(repo.create({ nombre }));
      console.log(`  ✓ Insertada: ${nombre}`);
    } else {
      console.log(`  · Ya existe: ${nombre} (id=${cat.id_categorias_estado})`);
    }
    idMap.set(nombre, cat.id_categorias_estado);
  }

  return idMap;
}

async function seedEstados(
  repo: Repository<Estado>,
  idMap: Map<string, number>,
): Promise<void> {
  console.log('\n[2] Estados');

  for (const [categoriaNombre, estados] of Object.entries(ESTADOS_POR_CATEGORIA)) {
    const categoria_estado_id = idMap.get(categoriaNombre)!;

    for (const nombre of estados) {
      const estado = await repo.findOne({ where: { nombre, categoria_estado_id } });

      if (!estado) {
        await repo.save(repo.create({ nombre, categoria_estado_id }));
        console.log(`  ✓ Insertado: ${nombre} (${categoriaNombre})`);
      } else {
        console.log(`  · Ya existe: ${nombre} (${categoriaNombre})`);
      }
    }
  }
}

async function seedRoles(repo: Repository<Rol>): Promise<void> {
  console.log('\n[3] Roles');

  for (const nombre of ROLES) {
    const existing = await repo.findOne({ where: { nombre } });
    if (!existing) {
      await repo.save(repo.create({ nombre }));
      console.log(`  ✓ Insertado: ${nombre}`);
    } else {
      console.log(`  · Ya existe: ${nombre} (id=${existing.id_roles})`);
    }
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Conectando a la base de datos...');
  await AppDataSource.initialize();
  console.log('Conexión establecida.');

  try {
    const categoriaRepo = AppDataSource.getRepository(CategoriaEstado);
    const estadoRepo    = AppDataSource.getRepository(Estado);
    const rolRepo       = AppDataSource.getRepository(Rol);

    const idMap = await seedCategorias(categoriaRepo);
    await seedEstados(estadoRepo, idMap);
    await seedRoles(rolRepo);

    console.log('\n✅ Seed completado exitosamente.\n');
  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
