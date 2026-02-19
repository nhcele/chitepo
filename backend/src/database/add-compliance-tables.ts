// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';
import { OfficialPositionType, ComplianceStatus } from '../compliance/entities/official-position.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addComplianceTables() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Create official_positions table
    console.log('📋 Creating official_positions table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS official_positions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        position ENUM('${Object.values(OfficialPositionType).join("','")}') NOT NULL,
        position_title VARCHAR(255) NOT NULL,
        region_province VARCHAR(100),
        ward VARCHAR(50),
        constituency VARCHAR(100),
        start_date DATE NOT NULL,
        end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        is_elected BOOLEAN DEFAULT TRUE,
        election_year INT,
        compliance_status ENUM('${Object.values(ComplianceStatus).join("','")}') DEFAULT '${ComplianceStatus.PENDING_VERIFICATION}',
        required_certifications JSON,
        completed_certifications JSON,
        compliance_deadline DATE,
        grace_period_end DATE,
        exemption_reason TEXT,
        last_compliance_check TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_official_positions_user_id (user_id),
        INDEX idx_official_positions_position (position),
        INDEX idx_official_positions_compliance_status (compliance_status),
        INDEX idx_official_positions_region (region_province),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ official_positions table created');

    // Create compliance_alerts table
    console.log('📋 Creating compliance_alerts table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS compliance_alerts (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        position_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        alert_type ENUM('deadline_approaching', 'deadline_passed', 'grace_period_ending', 'non_compliant') NOT NULL,
        message TEXT NOT NULL,
        severity ENUM('info', 'warning', 'critical') NOT NULL,
        due_date DATE,
        is_read BOOLEAN DEFAULT FALSE,
        is_resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_compliance_alerts_position_id (position_id),
        INDEX idx_compliance_alerts_user_id (user_id),
        INDEX idx_compliance_alerts_is_read (is_read),
        INDEX idx_compliance_alerts_is_resolved (is_resolved),
        FOREIGN KEY (position_id) REFERENCES official_positions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ compliance_alerts table created');

    console.log('');
    console.log('🎉 Compliance tables created successfully!');
    console.log('');
    console.log('Next step: Run seeds to populate sample official positions');

  } catch (error) {
    console.error('❌ Error creating compliance tables:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addComplianceTables();


