import 'reflect-metadata';
import { AppDataSource } from './data-source';

async function createMessagesTable() {
  try {
    console.log('🔌 Connecting to database...');
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ Connected to database\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if table already exists
    const tables = await queryRunner.query(
      "SHOW TABLES LIKE 'messages'"
    );

    if (tables.length > 0) {
      console.log('ℹ️  Messages table already exists. Skipping creation.');
      await queryRunner.release();
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log('📋 Creating messages table...');

    // Create table
    await queryRunner.query(`
      CREATE TABLE \`messages\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`course_id\` VARCHAR(36) NOT NULL,
        \`sender_id\` VARCHAR(36) NOT NULL,
        \`recipient_id\` VARCHAR(36) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`type\` ENUM('instructor_to_student', 'student_to_instructor', 'system') DEFAULT 'student_to_instructor',
        \`status\` ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
        \`read_at\` TIMESTAMP NULL,
        \`is_archived\` BOOLEAN DEFAULT FALSE,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`IDX_messages_course_created\` (\`course_id\`, \`created_at\`),
        INDEX \`IDX_messages_sender_created\` (\`sender_id\`, \`created_at\`),
        INDEX \`IDX_messages_recipient_created\` (\`recipient_id\`, \`created_at\`),
        CONSTRAINT \`FK_messages_course_id\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_messages_sender_id\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_messages_recipient_id\` FOREIGN KEY (\`recipient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Messages table created successfully');

    // Mark migration as complete
    try {
      await queryRunner.query(`
        INSERT INTO \`migrations\` (\`timestamp\`, \`name\`) 
        VALUES (1733000000000, 'AddMessagingTable1733000000000')
        ON DUPLICATE KEY UPDATE \`name\` = 'AddMessagingTable1733000000000'
      `);
      console.log('✅ Migration marked as complete');
    } catch (error: any) {
      if (error.code !== 'ER_NO_SUCH_TABLE') {
        console.warn('⚠️  Could not update migrations table (this is okay if migrations table does not exist yet)');
      }
    }

    await queryRunner.release();
    await AppDataSource.destroy();

    console.log('\n🎉 Messages table setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create messages table:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

createMessagesTable();

