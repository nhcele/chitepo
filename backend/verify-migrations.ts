import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'chitepo',
  synchronize: false,
  logging: false,
});

async function verify() {
  try {
    console.log('🔍 Verifying database schema...\n');
    await dataSource.initialize();

    // Check lessons table columns
    const lessonsColumns = await dataSource.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'chitepo' AND TABLE_NAME = 'lessons'
      AND COLUMN_NAME IN ('resource_links', 'completion_mode', 'minimum_watch_percent', 'minimum_quiz_score')
      ORDER BY COLUMN_NAME
    `);

    console.log('📋 Lessons Table - New Columns:');
    if (lessonsColumns.length > 0) {
      lessonsColumns.forEach((col: any) => {
        console.log(`  ✅ ${col.COLUMN_NAME} (${col.DATA_TYPE}) - ${col.COLUMN_COMMENT || 'No comment'}`);
      });
    } else {
      console.log('  ❌ No new columns found - migration may not have run');
    }

    // Check lesson_progress table
    const progressTable = await dataSource.query(`
      SELECT TABLE_NAME, TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'chitepo' AND TABLE_NAME = 'lesson_progress'
    `);

    console.log('\n📋 Lesson Progress Table:');
    if (progressTable.length > 0) {
      console.log('  ✅ lesson_progress table exists');
      
      const progressColumns = await dataSource.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'chitepo' AND TABLE_NAME = 'lesson_progress'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`  ✅ ${progressColumns.length} columns found:`);
      progressColumns.forEach((col: any) => {
        console.log(`     - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
      });
    } else {
      console.log('  ❌ lesson_progress table not found - migration may not have run');
    }

    await dataSource.destroy();
    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify();
