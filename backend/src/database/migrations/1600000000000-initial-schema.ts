import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1600000000000 implements MigrationInterface {
  name = 'InitialSchema1600000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'email', type: 'varchar', length: '255', isUnique: true },
        { name: 'password', type: 'varchar', length: '255', isNullable: true },
        { name: 'first_name', type: 'varchar', length: '100' },
        { name: 'last_name', type: 'varchar', length: '100' },
        { name: 'role', type: 'enum', enum: ['student', 'instructor', 'admin', 'super_admin'], default: "'student'" },
        { name: 'avatar_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'bio', type: 'text', isNullable: true },
        { name: 'is_active', type: 'boolean', default: true },
        { name: 'email_verified', type: 'boolean', default: false },
        { name: 'google_id', type: 'varchar', length: '255', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_users_email', columnNames: ['email'] },
        { name: 'IDX_users_role', columnNames: ['role'] },
        { name: 'IDX_users_google_id', columnNames: ['google_id'] },
      ],
    }));

    // Instructor applications table
    await queryRunner.createTable(new Table({
      name: 'instructor_applications',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'full_name', type: 'varchar', length: '255' },
        { name: 'email', type: 'varchar', length: '255' },
        { name: 'bio', type: 'text', isNullable: true },
        { name: 'sample_video_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'socials', type: 'json', isNullable: true },
        { name: 'agree_tos', type: 'boolean', default: false },
        { name: 'agree_ownership', type: 'boolean', default: false },
        { name: 'agree_revenue_share', type: 'boolean', default: false },
        { name: 'status', type: 'enum', enum: ['pending', 'approved', 'rejected'], default: "'pending'" },
        { name: 'reviewed_by', type: 'varchar', length: '36', isNullable: true },
        { name: 'review_notes', type: 'text', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_instructor_applications_email', columnNames: ['email'] },
        { name: 'IDX_instructor_applications_status', columnNames: ['status'] },
      ],
    }));

    // Courses table
    await queryRunner.createTable(new Table({
      name: 'courses',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'title', type: 'varchar', length: '255' },
        { name: 'subtitle', type: 'varchar', length: '500', isNullable: true },
        { name: 'description', type: 'text' },
        { name: 'tags', type: 'json', isNullable: true },
        { name: 'trailer_video_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'cover_image_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'instructor_id', type: 'varchar', length: '36' },
        { name: 'status', type: 'enum', enum: ['draft', 'review', 'published', 'archived'], default: "'draft'" },
        { name: 'difficulty', type: 'enum', enum: ['beginner', 'intermediate', 'advanced'], default: "'beginner'" },
        { name: 'estimated_duration', type: 'int', default: 0 },
        { name: 'price', type: 'decimal', precision: 10, scale: 2, default: 0 },
        { name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 },
        { name: 'total_ratings', type: 'int', default: 0 },
        { name: 'total_enrollments', type: 'int', default: 0 },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_courses_instructor_id', columnNames: ['instructor_id'] },
        { name: 'IDX_courses_status', columnNames: ['status'] },
        { name: 'IDX_courses_difficulty', columnNames: ['difficulty'] },
        { name: 'IDX_courses_price', columnNames: ['price'] },
      ],
    }));

    // Modules table
    await queryRunner.createTable(new Table({
      name: 'modules',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'course_id', type: 'varchar', length: '36', isNullable: true },
        { name: 'title', type: 'varchar', length: '255' },
        { name: 'summary', type: 'text', isNullable: true },
        { name: 'author_id', type: 'varchar', length: '36', isNullable: true },
        { name: 'thumbnail', type: 'varchar', length: '500', isNullable: true },
        { name: 'estimated_duration_min', type: 'int', isNullable: true },
        { name: 'tags', type: 'json', isNullable: true },
        { name: 'visibility', type: 'enum', enum: ['public', 'private', 'shared'], default: "'private'" },
        { name: 'order_index', type: 'int' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_modules_course_id', columnNames: ['course_id'] },
        { name: 'IDX_modules_author_id', columnNames: ['author_id'] },
        { name: 'IDX_modules_visibility', columnNames: ['visibility'] },
      ],
    }));

    // Lessons table
    await queryRunner.createTable(new Table({
      name: 'lessons',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'module_id', type: 'varchar', length: '36' },
        { name: 'title', type: 'varchar', length: '255' },
        { name: 'content', type: 'text', isNullable: true },
        { name: 'video_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'video_duration', type: 'int', isNullable: true },
        { name: 'order_index', type: 'int' },
        { name: 'is_published', type: 'boolean', default: false },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_lessons_module_id', columnNames: ['module_id'] },
        { name: 'IDX_lessons_order', columnNames: ['module_id', 'order_index'] },
      ],
    }));

    // Quizzes table
    await queryRunner.createTable(new Table({
      name: 'quizzes',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'lesson_id', type: 'varchar', length: '36', isNullable: true },
        { name: 'title', type: 'varchar', length: '255' },
        { name: 'description', type: 'text', isNullable: true },
        { name: 'passing_score', type: 'int', default: 70 },
        { name: 'time_limit_minutes', type: 'int', isNullable: true },
        { name: 'max_attempts', type: 'int', default: 3 },
        { name: 'is_published', type: 'boolean', default: false },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_quizzes_lesson_id', columnNames: ['lesson_id'] },
      ],
    }));

    // Questions table
    await queryRunner.createTable(new Table({
      name: 'questions',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'quiz_id', type: 'varchar', length: '36' },
        { name: 'question_text', type: 'text' },
        { name: 'question_type', type: 'enum', enum: ['multiple_choice', 'true_false', 'short_answer'], default: "'multiple_choice'" },
        { name: 'options', type: 'json', isNullable: true },
        { name: 'correct_answer', type: 'varchar', length: '255' },
        { name: 'explanation', type: 'text', isNullable: true },
        { name: 'points', type: 'int', default: 1 },
        { name: 'order_index', type: 'int' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_questions_quiz_id', columnNames: ['quiz_id'] },
        { name: 'IDX_questions_order', columnNames: ['quiz_id', 'order_index'] },
      ],
    }));

    // Quiz attempts table
    await queryRunner.createTable(new Table({
      name: 'quiz_attempts',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'quiz_id', type: 'varchar', length: '36' },
        { name: 'user_id', type: 'varchar', length: '36' },
        { name: 'answers', type: 'json' },
        { name: 'score', type: 'int' },
        { name: 'passed', type: 'boolean' },
        { name: 'attempt_number', type: 'int' },
        { name: 'started_at', type: 'timestamp', isNullable: true },
        { name: 'completed_at', type: 'timestamp', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_quiz_attempts_quiz_id', columnNames: ['quiz_id'] },
        { name: 'IDX_quiz_attempts_user_id', columnNames: ['user_id'] },
      ],
    }));

    // Enrollments table
    await queryRunner.createTable(new Table({
      name: 'enrollments',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'course_id', type: 'varchar', length: '36' },
        { name: 'user_id', type: 'varchar', length: '36' },
        { name: 'enrolled_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'completed_at', type: 'timestamp', isNullable: true },
        { name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 },
        { name: 'certificate_issued', type: 'boolean', default: false },
      ],
      indices: [
        { name: 'IDX_enrollments_course_id', columnNames: ['course_id'] },
        { name: 'IDX_enrollments_user_id', columnNames: ['user_id'] },
        { name: 'IDX_enrollments_unique', columnNames: ['course_id', 'user_id'], isUnique: true },
      ],
    }));

    // Certificates table
    await queryRunner.createTable(new Table({
      name: 'certificates',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'course_id', type: 'varchar', length: '36' },
        { name: 'user_id', type: 'varchar', length: '36' },
        { name: 'certificate_url', type: 'varchar', length: '500', isNullable: true },
        { name: 'blockchain_tx_hash', type: 'varchar', length: '255', isNullable: true },
        { name: 'ipfs_hash', type: 'varchar', length: '255', isNullable: true },
        { name: 'issued_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'verified_at', type: 'timestamp', isNullable: true },
      ],
      indices: [
        { name: 'IDX_certificates_course_id', columnNames: ['course_id'] },
        { name: 'IDX_certificates_user_id', columnNames: ['user_id'] },
        { name: 'IDX_certificates_blockchain_tx', columnNames: ['blockchain_tx_hash'] },
      ],
    }));

    // Analytics events table
    await queryRunner.createTable(new Table({
      name: 'analytics_events',
      columns: [
        { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'user_id', type: 'varchar', length: '36', isNullable: true },
        { name: 'event_type', type: 'varchar', length: '100' },
        { name: 'event_data', type: 'json', isNullable: true },
        { name: 'session_id', type: 'varchar', length: '255', isNullable: true },
        { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
        { name: 'user_agent', type: 'varchar', length: '500', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
      indices: [
        { name: 'IDX_analytics_events_user_id', columnNames: ['user_id'] },
        { name: 'IDX_analytics_events_type', columnNames: ['event_type'] },
        { name: 'IDX_analytics_events_created', columnNames: ['created_at'] },
      ],
    }));

    // Add foreign keys
    await queryRunner.createForeignKey('courses', new TableForeignKey({
      columnNames: ['instructor_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('modules', new TableForeignKey({
      columnNames: ['course_id'], referencedTableName: 'courses', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('modules', new TableForeignKey({
      columnNames: ['author_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('lessons', new TableForeignKey({
      columnNames: ['module_id'], referencedTableName: 'modules', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('quizzes', new TableForeignKey({
      columnNames: ['lesson_id'], referencedTableName: 'lessons', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('questions', new TableForeignKey({
      columnNames: ['quiz_id'], referencedTableName: 'quizzes', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('quiz_attempts', new TableForeignKey({
      columnNames: ['quiz_id'], referencedTableName: 'quizzes', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('quiz_attempts', new TableForeignKey({
      columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('enrollments', new TableForeignKey({
      columnNames: ['course_id'], referencedTableName: 'courses', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('enrollments', new TableForeignKey({
      columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('certificates', new TableForeignKey({
      columnNames: ['course_id'], referencedTableName: 'courses', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('certificates', new TableForeignKey({
      columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('analytics_events', new TableForeignKey({
      columnNames: ['user_id'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('instructor_applications', new TableForeignKey({
      columnNames: ['reviewed_by'], referencedTableName: 'users', referencedColumnNames: ['id'], onDelete: 'SET NULL',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.dropTable('analytics_events');
    await queryRunner.dropTable('certificates');
    await queryRunner.dropTable('enrollments');
    await queryRunner.dropTable('quiz_attempts');
    await queryRunner.dropTable('questions');
    await queryRunner.dropTable('quizzes');
    await queryRunner.dropTable('lessons');
    await queryRunner.dropTable('modules');
    await queryRunner.dropTable('courses');
    await queryRunner.dropTable('instructor_applications');
    await queryRunner.dropTable('users');
  }
}

