// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';
import { CohortStatus, CohortQuarter, CohortTrack } from '../cohorts/entities/training-cohort.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addCohortTables() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Create training_cohorts table
    console.log('📋 Creating training_cohorts table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS training_cohorts (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        track ENUM('${Object.values(CohortTrack).join("','")}') NOT NULL,
        quarter ENUM('${Object.values(CohortQuarter).join("','")}') NOT NULL,
        year INT NOT NULL,
        status ENUM('${Object.values(CohortStatus).join("','")}') DEFAULT '${CohortStatus.UPCOMING}',
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        enrollment_open_date DATE NOT NULL,
        enrollment_close_date DATE NOT NULL,
        max_participants INT DEFAULT 100,
        current_participants INT DEFAULT 0,
        is_mandatory BOOLEAN DEFAULT FALSE,
        mandatory_for VARCHAR(500),
        is_virtual BOOLEAN DEFAULT FALSE,
        meeting_schedule VARCHAR(500),
        venue VARCHAR(500),
        pacing_mode ENUM('cohort_paced','self_paced','hybrid') DEFAULT 'cohort_paced',
        weekly_target_minutes INT,
        instructor_id VARCHAR(36),
        course_ids JSON,
        cost DECIMAL(10,2) DEFAULT 0,
        prerequisites JSON,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_training_cohorts_track (track),
        INDEX idx_training_cohorts_quarter (quarter),
        INDEX idx_training_cohorts_year (year),
        INDEX idx_training_cohorts_status (status),
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ training_cohorts table created');

    // Create cohort_enrollments table
    console.log('📋 Creating cohort_enrollments table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS cohort_enrollments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        cohort_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        status ENUM('enrolled', 'active', 'completed', 'withdrawn', 'failed') DEFAULT 'enrolled',
        enrolled_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP NULL,
        attendance_percentage DECIMAL(5,2) DEFAULT 0,
        final_score DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cohort_enrollments_cohort_id (cohort_id),
        INDEX idx_cohort_enrollments_user_id (user_id),
        INDEX idx_cohort_enrollments_status (status),
        UNIQUE KEY unique_cohort_user (cohort_id, user_id),
        FOREIGN KEY (cohort_id) REFERENCES training_cohorts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ cohort_enrollments table created');

    console.log('');
    console.log('🎉 Cohort tables created successfully!');
    console.log('');
    console.log('Next step: Run npm run seed to populate training cohorts');

  } catch (error) {
    console.error('❌ Error creating cohort tables:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addCohortTables();


