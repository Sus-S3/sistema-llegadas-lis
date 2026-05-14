import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { CategoriaEstado } from '../modules/estados/entities/categoria-estado.entity';
import { Horario } from '../modules/horarios/entities/horario.entity';
import { Estado } from '../modules/laboratorios/entities/estado.entity';
import { Laboratorio } from '../modules/laboratorios/entities/laboratorio.entity';
import { Rol } from '../modules/roles/entities/rol.entity';
import { Usuario } from '../modules/usuarios/entities/usuario.entity';
import { runSeed } from './seed';

const CliDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [CategoriaEstado, Estado, Laboratorio, Rol, Usuario, Horario],
  synchronize: false,
  ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

async function main() {
  console.log('[Seed CLI] Conectando...');
  await CliDataSource.initialize();

  try {
    await runSeed(CliDataSource);
  } catch (error) {
    console.error('[Seed CLI] ❌ Error:', error);
    process.exit(1);
  } finally {
    await CliDataSource.destroy();
  }
}

main();
