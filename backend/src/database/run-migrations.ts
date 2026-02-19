import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function run() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const results = await AppDataSource.runMigrations();
    console.log('Migrations executed:', results.map(r => r.name));
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration run failed:', err);
    try { if (AppDataSource.isInitialized) await AppDataSource.destroy(); } catch {}
    process.exit(1);
  }
}

run();
