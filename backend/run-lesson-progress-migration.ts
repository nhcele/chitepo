import { DataSource } from 'typeorm';
import { CreateLessonProgress20260518130000 } from './src/database/migrations/20260518130000-CreateLessonProgress';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'chitepo',
  synchronize: false,
  logging: true,
});

async function runMigration() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established.');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('Running CreateLessonProgress migration...');
    const migration = new CreateLessonProgress20260518130000();
    await migration.up(queryRunner);
    console.log('✅ Migration completed successfully!');

    await queryRunner.release();
    await dataSource.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
