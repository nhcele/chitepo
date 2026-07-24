import 'dotenv/config';
import { MigrationUtils } from './migration-utils';
import { execSync } from 'child_process';

async function setupDatabase() {
  console.log('🚀 Setting up Chitepo Database...\n');

  const utils = new MigrationUtils();

  try {
    // Step 1: Check database connection
    console.log('📡 Step 1: Checking database connection...');
    await utils.initialize();
    console.log('✅ Database connection successful\n');
    await utils.destroy();

    // Step 2: Run migrations
    console.log('📋 Step 2: Running database migrations...');
    await utils.runMigrations();
    console.log('');

    // Step 3: Run seeds
    console.log('🌱 Step 3: Running database seeds...');
    console.log('Running seed script...');
    execSync('npm run seed:run', { stdio: 'inherit', cwd: process.cwd() });
    console.log('');

    // Step 4: Verify setup
    console.log('🔍 Step 4: Verifying database setup...');
    await utils.initialize();
    
    // Check if tables exist
    const tables = await utils.dataSource.query('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables in database`);
    
    // Check user count
    const userCount = await utils.dataSource.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Database contains ${userCount[0].count} users`);
    
    // Check course count
    const courseCount = await utils.dataSource.query('SELECT COUNT(*) as count FROM courses');
    console.log(`✅ Database contains ${courseCount[0].count} courses`);
    
    await utils.destroy();

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Start the development server: npm run start:dev');
    console.log('2. Visit http://localhost:3001 for the API');
    console.log('3. Check the API documentation at http://localhost:3001/api');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    console.log('\n🛠️ Troubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your .env file database credentials');
    console.log('3. Ensure the database exists: CREATE DATABASE mindelta;');
    console.log('4. Try running migrations manually: npm run migration:run');
    process.exit(1);
  }
}

// Export for programmatic use
export { setupDatabase };

// Run if called directly
if (require.main === module) {
  setupDatabase();
}
