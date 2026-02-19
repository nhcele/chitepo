import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingEntityColumns1732500000000 implements MigrationInterface {
  name = 'AddMissingEntityColumns1732500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to users table
    await queryRunner.addColumn('users', new TableColumn({
      name: 'job_title',
      type: 'varchar',
      length: '255',
      isNullable: true,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'skill_interests',
      type: 'json',
      isNullable: true,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'email_verification_token',
      type: 'varchar',
      length: '255',
      isNullable: true,
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'last_login_at',
      type: 'timestamp',
      isNullable: true,
    }));

    // Add columns to lessons table
    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'lesson_type',
      type: 'varchar',
      length: '50',
      isNullable: true,
      default: "'video'",
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'is_preview',
      type: 'boolean',
      default: false,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'transcript',
      type: 'text',
      isNullable: true,
    }));

    // Add columns to courses table
    await queryRunner.addColumn('courses', new TableColumn({
      name: 'skills',
      type: 'json',
      isNullable: true,
    }));

    // Add columns to analytics_events table
    await queryRunner.addColumn('analytics_events', new TableColumn({
      name: 'course_id',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    // Add columns to certificates table
    await queryRunner.addColumn('certificates', new TableColumn({
      name: 'serial_number',
      type: 'varchar',
      length: '100',
      isNullable: true,
    }));

    await queryRunner.addColumn('certificates', new TableColumn({
      name: 'final_score',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
    }));

    await queryRunner.addColumn('certificates', new TableColumn({
      name: 'skills_tags',
      type: 'json',
      isNullable: true,
    }));

    // Add columns to enrollments table
    await queryRunner.addColumn('enrollments', new TableColumn({
      name: 'last_lesson_seen_at',
      type: 'timestamp',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns from enrollments table
    await queryRunner.dropColumn('enrollments', 'last_lesson_seen_at');

    // Drop columns from certificates table
    await queryRunner.dropColumn('certificates', 'skills_tags');
    await queryRunner.dropColumn('certificates', 'final_score');
    await queryRunner.dropColumn('certificates', 'serial_number');

    // Drop columns from analytics_events table
    await queryRunner.dropColumn('analytics_events', 'course_id');

    // Drop columns from courses table
    await queryRunner.dropColumn('courses', 'skills');

    // Drop columns from lessons table
    await queryRunner.dropColumn('lessons', 'transcript');
    await queryRunner.dropColumn('lessons', 'is_preview');
    await queryRunner.dropColumn('lessons', 'lesson_type');

    // Drop columns from users table
    await queryRunner.dropColumn('users', 'last_login_at');
    await queryRunner.dropColumn('users', 'email_verification_token');
    await queryRunner.dropColumn('users', 'skill_interests');
    await queryRunner.dropColumn('users', 'job_title');
  }
}

