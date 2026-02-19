import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { CreateUserGroups1700000000000 } from './migrations/1700000000000-CreateUserGroups';

async function run() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log('🚀 Running User Groups migration...\n');

    const migration = new CreateUserGroups1700000000000();
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      console.log('📋 Creating user_groups tables...');
      await migration.up(queryRunner);
      
      await queryRunner.commitTransaction();
      console.log('✅ User Groups migration completed successfully!\n');
      
      // Mark migration as executed (check if migrations table exists first)
      try {
        const migrationsTableExists = await queryRunner.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = 'migrations'`
        );
        
        if (migrationsTableExists[0].count > 0) {
          await queryRunner.query(
            `INSERT IGNORE INTO migrations (timestamp, name) VALUES (1700000000000, 'CreateUserGroups1700000000000')`
          );
          console.log('✅ Migration marked as executed\n');
        }
      } catch (err) {
        console.log('⚠️  Could not mark migration (migrations table may not exist)\n');
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    try { 
      if (AppDataSource.isInitialized) await AppDataSource.destroy(); 
    } catch {}
    process.exit(1);
  }
}

run();

