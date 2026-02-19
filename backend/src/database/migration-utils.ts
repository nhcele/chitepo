import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { DataSource } from 'typeorm';

export class MigrationUtils {
  public dataSource: DataSource;

  constructor(dataSource?: DataSource) {
    this.dataSource = dataSource || AppDataSource;
  }

  async initialize() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  async destroy() {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.initialize();
      console.log('Running database migrations...');
      
      const pendingMigrations = await this.dataSource.showMigrations();
      if (pendingMigrations === true) {
        console.log('Pending migrations exist');
        const results = await this.dataSource.runMigrations();
        console.log('✅ Migrations executed successfully');
      } else {
        console.log('✅ No pending migrations');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.destroy();
    }
  }

  async revertLastMigration(): Promise<void> {
    try {
      await this.initialize();
      console.log('Reverting last migration...');
      
      const results = await this.dataSource.undoLastMigration();
      console.log('✅ Migration reverted successfully');
    } catch (error) {
      console.error('❌ Migration revert failed:', error);
      throw error;
    } finally {
      await this.destroy();
    }
  }

  async showPendingMigrations(): Promise<void> {
    try {
      await this.initialize();
      const pendingMigrations = await this.dataSource.showMigrations();
      
      if (pendingMigrations === true) {
        console.log('Pending migrations exist - run migrations to see details');
      } else {
        console.log('✅ No pending migrations');
      }
    } catch (error) {
      console.error('❌ Failed to check migrations:', error);
      throw error;
    } finally {
      await this.destroy();
    }
  }

  async generateMigration(name: string, timestamp?: string): Promise<void> {
    const timestampStr = timestamp || Date.now().toString();
    const fileName = `${timestampStr}-${name}.ts`;
    const filePath = `${__dirname}/migrations/${fileName}`;
    
    console.log(`Migration file would be created at: ${filePath}`);
    console.log('Note: Use npm run migration:generate -- --name <migration-name> to generate migrations');
  }

  async resetDatabase(): Promise<void> {
    try {
      await this.initialize();
      console.log('⚠️ WARNING: This will drop all tables and recreate them');
      
      // Drop all tables
      await this.dataSource.dropDatabase();
      console.log('Database dropped');
      
      // Run all migrations
      await this.dataSource.runMigrations();
      console.log('✅ Database reset and migrations completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    } finally {
      await this.destroy();
    }
  }
}

// CLI functions
export async function runMigrations() {
  const utils = new MigrationUtils();
  await utils.runMigrations();
}

export async function revertMigration() {
  const utils = new MigrationUtils();
  await utils.revertLastMigration();
}

export async function showMigrations() {
  const utils = new MigrationUtils();
  await utils.showPendingMigrations();
}

export async function resetDatabase() {
  const utils = new MigrationUtils();
  await utils.resetDatabase();
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      runMigrations().catch(() => process.exit(1));
      break;
    case 'revert':
      revertMigration().catch(() => process.exit(1));
      break;
    case 'show':
      showMigrations().catch(() => process.exit(1));
      break;
    case 'reset':
      resetDatabase().catch(() => process.exit(1));
      break;
    default:
      console.log('Usage: npm run migration-utils <command>');
      console.log('Commands:');
      console.log('  run    - Run pending migrations');
      console.log('  revert - Revert last migration');
      console.log('  show   - Show pending migrations');
      console.log('  reset  - Drop database and run all migrations');
      process.exit(1);
  }
}
