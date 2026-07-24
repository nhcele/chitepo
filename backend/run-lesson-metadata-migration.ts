import { DataSource } from 'typeorm';
import { AddLessonMetadata20260518122014 } from './src/database/migrations/20260518122014-AddLessonMetadata';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'chitepo',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

async function runMigration() {
  console.log('🚀 Starting Lesson Metadata Migration...\n');

  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Create query runner
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Run migration
    const migration = new AddLessonMetadata20260518122014();
    
    console.log('📝 Running UP migration...');
    await migration.up(queryRunner);
    console.log('✅ Migration completed successfully!\n');

    // Record migration in migrations table
    await queryRunner.query(`
      INSERT INTO migrations (timestamp, name) 
      VALUES (20260518122014, 'AddLessonMetadata20260518122014')
      ON DUPLICATE KEY UPDATE name = 'AddLessonMetadata20260518122014'
    `);
    console.log('✅ Migration recorded in database\n');

    // Release query runner
    await queryRunner.release();

    // Close connection
    await dataSource.destroy();
    console.log('✅ Database connection closed\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\nNew lesson fields added:');
    console.log('  - resource_links (JSON)');
    console.log('  - completion_mode (VARCHAR)');
    console.log('  - minimum_watch_percent (INT)');
    console.log('  - minimum_quiz_score (INT)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

export { runMigration };
