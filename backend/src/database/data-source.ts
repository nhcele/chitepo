import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv({ path: path.resolve(process.cwd(), '.env') });
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

// Fallbacks
const HOST = process.env.DATABASE_HOST || 'localhost';
const PORT = Number(process.env.DATABASE_PORT || 3306);
const USERNAME = process.env.DATABASE_USERNAME || 'root';
const PASSWORD = process.env.DATABASE_PASSWORD || 'password';
const DATABASE = process.env.DATABASE_NAME || 'mindelta';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: HOST,
  port: PORT,
  username: USERNAME,
  password: PASSWORD,
  database: DATABASE,
  // Use entity globs so CLI can discover entities without Nest context
  entities: [
    path.join(__dirname, '..', '**', '*.entity.{ts,js}')
  ],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  charset: 'utf8mb4',
  timezone: 'Z',
  // Do not use synchronize in CLI; rely on migrations
  synchronize: false,
  logging: false,
});
