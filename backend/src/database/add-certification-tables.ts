// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';
import { PathwayType } from '../certifications/entities/certification-pathway.entity';
import { CertificationStatus } from '../certifications/entities/user-certification.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addCertificationTables() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Create certification_pathways table
    console.log('📋 Creating certification_pathways table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS certification_pathways (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        type ENUM('${Object.values(PathwayType).join("','")}') NOT NULL,
        level INT NOT NULL,
        level_title VARCHAR(255) NOT NULL,
        description TEXT,
        estimated_duration_weeks INT NOT NULL,
        cost DECIMAL(10,2) DEFAULT 0,
        minimum_courses INT NOT NULL,
        required_courses JSON,
        pass_percentage INT NOT NULL,
        requirements JSON,
        outcome TEXT,
        is_mandatory BOOLEAN DEFAULT FALSE,
        mandatory_for VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_certification_pathways_type (type),
        INDEX idx_certification_pathways_level (level)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ certification_pathways table created');

    // Create user_certifications table
    console.log('📋 Creating user_certifications table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS user_certifications (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        pathway_id VARCHAR(36) NOT NULL,
        status ENUM('${Object.values(CertificationStatus).join("','")}') DEFAULT '${CertificationStatus.NOT_STARTED}',
        progress_percentage INT DEFAULT 0,
        courses_completed INT DEFAULT 0,
        courses_required INT DEFAULT 0,
        completed_course_ids JSON,
        average_score DECIMAL(5,2),
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        awarded_at TIMESTAMP NULL,
        certificate_url VARCHAR(500),
        certificate_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_certifications_user_id (user_id),
        INDEX idx_user_certifications_pathway_id (pathway_id),
        INDEX idx_user_certifications_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (pathway_id) REFERENCES certification_pathways(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ user_certifications table created');

    console.log('');
    console.log('🎉 Certification tables created successfully!');
    console.log('');
    console.log('Next step: Run npm run seed to populate certification pathways');

  } catch (error) {
    console.error('❌ Error creating certification tables:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addCertificationTables();


