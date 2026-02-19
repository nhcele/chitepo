// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';
import { RPLStatus, RPLEvidenceType } from '../rpl/entities/rpl-application.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addRPLTable() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    console.log('📋 Creating rpl_applications table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS rpl_applications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        pathway_id VARCHAR(36) NOT NULL,
        status ENUM('${Object.values(RPLStatus).join("','")}') DEFAULT '${RPLStatus.DRAFT}',
        rationale TEXT NOT NULL,
        evidence_items JSON NOT NULL,
        requested_credits JSON,
        approved_credits JSON,
        credits_requested INT DEFAULT 0,
        credits_approved INT DEFAULT 0,
        assessor_id VARCHAR(36),
        assessor_notes TEXT,
        submitted_at TIMESTAMP NULL,
        reviewed_at TIMESTAMP NULL,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rpl_applications_user_id (user_id),
        INDEX idx_rpl_applications_pathway_id (pathway_id),
        INDEX idx_rpl_applications_status (status),
        INDEX idx_rpl_applications_assessor_id (assessor_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (pathway_id) REFERENCES certification_pathways(id) ON DELETE CASCADE,
        FOREIGN KEY (assessor_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ rpl_applications table created');

    console.log('');
    console.log('🎉 RPL table created successfully!');
    console.log('');
    console.log('Recognition of Prior Learning (RPL) system is ready!');

  } catch (error) {
    console.error('❌ Error creating RPL table:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addRPLTable();


