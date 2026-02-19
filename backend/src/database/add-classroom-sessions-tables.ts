// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';
import { SessionStatus, SessionType } from '../classroom-sessions/entities/classroom-session.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addClassroomSessionsTables() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Create classroom_sessions table
    console.log('📋 Creating classroom_sessions table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS classroom_sessions (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        session_code VARCHAR(6) UNIQUE NOT NULL,
        trainer_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36),
        lesson_id VARCHAR(36),
        type ENUM('${Object.values(SessionType).join("','")}') DEFAULT '${SessionType.PHYSICAL}',
        status ENUM('${Object.values(SessionStatus).join("','")}') DEFAULT '${SessionStatus.SCHEDULED}',
        scheduled_start TIMESTAMP NOT NULL,
        scheduled_end TIMESTAMP NULL,
        actual_start TIMESTAMP NULL,
        actual_end TIMESTAMP NULL,
        venue VARCHAR(500),
        max_participants INT DEFAULT 50,
        is_synchronized BOOLEAN DEFAULT FALSE,
        allow_remote_join BOOLEAN DEFAULT FALSE,
        settings JSON,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_classroom_sessions_trainer_id (trainer_id),
        INDEX idx_classroom_sessions_course_id (course_id),
        INDEX idx_classroom_sessions_lesson_id (lesson_id),
        INDEX idx_classroom_sessions_status (status),
        INDEX idx_classroom_sessions_type (type),
        INDEX idx_classroom_sessions_session_code (session_code),
        INDEX idx_classroom_sessions_scheduled_start (scheduled_start),
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ classroom_sessions table created');

    // Create classroom_session_participants table
    console.log('📋 Creating classroom_session_participants table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS classroom_session_participants (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        session_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        joined_at TIMESTAMP NOT NULL,
        left_at TIMESTAMP NULL,
        is_physical BOOLEAN DEFAULT TRUE,
        current_lesson_id VARCHAR(36),
        progress_percentage DECIMAL(5,2) DEFAULT 0,
        last_activity_at TIMESTAMP NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_classroom_session_participants_session_id (session_id),
        INDEX idx_classroom_session_participants_user_id (user_id),
        INDEX idx_classroom_session_participants_joined_at (joined_at),
        FOREIGN KEY (session_id) REFERENCES classroom_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (current_lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ classroom_session_participants table created');

    console.log('');
    console.log('🎉 Classroom sessions tables created successfully!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating classroom sessions tables:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addClassroomSessionsTables();


