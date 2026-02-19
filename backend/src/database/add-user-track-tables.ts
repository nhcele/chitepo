// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addUserTrackTables() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    console.log('📋 Creating user_track_assignments table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS user_track_assignments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        track_type ENUM(
          'general_education',
          'government_officials',
          'diaspora_engagement',
          'youth_leadership',
          'womens_leadership',
          'specialist'
        ) NOT NULL,
        status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'active',
        source ENUM('manual', 'self_enrolled', 'automatic', 'migrated') DEFAULT 'manual',
        assigned_by VARCHAR(36),
        assigned_reason TEXT,
        start_date TIMESTAMP NULL,
        end_date TIMESTAMP NULL,
        completion_target_date TIMESTAMP NULL,
        is_mandatory BOOLEAN DEFAULT FALSE,
        mandatory_reason TEXT,
        metadata JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_track (user_id, track_type),
        INDEX idx_user_track_user_id (user_id),
        INDEX idx_user_track_type (track_type),
        INDEX idx_user_track_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ user_track_assignments table created');

    console.log('');
    console.log('🎉 User track assignments table created successfully!');
    console.log('');
    console.log('Track assignment system is ready!');
    console.log('Available track types:');
    console.log('  - general_education');
    console.log('  - government_officials');
    console.log('  - diaspora_engagement');
    console.log('  - youth_leadership');
    console.log('  - womens_leadership');
    console.log('  - specialist');

  } catch (error) {
    console.error('❌ Error creating user track assignments table:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addUserTrackTables();


