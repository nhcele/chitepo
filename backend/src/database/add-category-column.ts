// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';

async function addCategoryColumn() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[add-category] Connecting to MySQL', {
    host,
    port,
    username,
    database,
  });

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    charset: 'utf8mb4',
    timezone: 'Z',
  });

  try {
    await dataSource.initialize();
    console.log('[add-category] Database connection established');

    // Check if column already exists
    const checkQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${database}' 
      AND TABLE_NAME = 'courses' 
      AND COLUMN_NAME = 'category'
    `;
    
    const existing = await dataSource.query(checkQuery);
    
    if (existing && existing.length > 0) {
      console.log('[add-category] ✅ Category column already exists!');
      await dataSource.destroy();
      return;
    }

    console.log('[add-category] Adding category column...');
    
    const alterQuery = `
      ALTER TABLE courses 
      ADD COLUMN category ENUM('core_ideology', 'contemporary_studies', 'practical_governance', 'diaspora_program') NULL 
      AFTER difficulty
    `;
    
    await dataSource.query(alterQuery);
    
    console.log('[add-category] ✅ Category column added successfully!');
    console.log('[add-category] You can now run: npm run seed');
    
    await dataSource.destroy();
  } catch (error) {
    console.error('[add-category] ❌ Error:', error);
    try {
      await dataSource.destroy();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

addCategoryColumn();


