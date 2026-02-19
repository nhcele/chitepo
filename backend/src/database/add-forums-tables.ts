// DEPRECATED: Replaced by TypeORM migrations. Use npm run migrate.\r\nimport 'dotenv/config';
import { DataSource } from 'typeorm';
import { ForumType, ForumStatus } from '../forums/entities/forum.entity';

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'mindelta',
});

async function addForumsTables() {
  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Create forums table
    console.log('📋 Creating forums table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS forums (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('${Object.values(ForumType).join("','")}') DEFAULT '${ForumType.GENERAL}',
        status ENUM('${Object.values(ForumStatus).join("','")}') DEFAULT '${ForumStatus.ACTIVE}',
        cohort_id VARCHAR(36),
        region VARCHAR(100),
        country VARCHAR(100),
        created_by VARCHAR(36) NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        member_count INT DEFAULT 0,
        post_count INT DEFAULT 0,
        last_activity_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forums_type (type),
        INDEX idx_forums_cohort_id (cohort_id),
        INDEX idx_forums_region (region),
        INDEX idx_forums_country (country),
        INDEX idx_forums_status (status),
        FOREIGN KEY (cohort_id) REFERENCES training_cohorts(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ forums table created');

    // Create forum_posts table
    console.log('📋 Creating forum_posts table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        forum_id VARCHAR(36) NOT NULL,
        parent_id VARCHAR(36),
        author_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,
        view_count INT DEFAULT 0,
        reply_count INT DEFAULT 0,
        like_count INT DEFAULT 0,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forum_posts_forum_id (forum_id),
        INDEX idx_forum_posts_parent_id (parent_id),
        INDEX idx_forum_posts_author_id (author_id),
        INDEX idx_forum_posts_created_at (created_at),
        FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ forum_posts table created');

    // Create forum_members table
    console.log('📋 Creating forum_members table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS forum_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        forum_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
        joined_at TIMESTAMP NOT NULL,
        last_read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_forum_members_forum_id (forum_id),
        INDEX idx_forum_members_user_id (user_id),
        UNIQUE KEY unique_forum_user (forum_id, user_id),
        FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ forum_members table created');

    // Create forum_post_likes table
    console.log('📋 Creating forum_post_likes table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS forum_post_likes (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        post_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_forum_post_likes_post_id (post_id),
        INDEX idx_forum_post_likes_user_id (user_id),
        UNIQUE KEY unique_post_user (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ forum_post_likes table created');

    console.log('');
    console.log('🎉 Forum tables created successfully!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating forum tables:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Disconnected from database');
    }
  }
}

addForumsTables();


