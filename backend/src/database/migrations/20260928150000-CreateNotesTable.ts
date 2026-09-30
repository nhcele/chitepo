import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotesTable20260928150000 implements MigrationInterface {
  name = 'CreateNotesTable20260928150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        course_id VARCHAR(36) NULL,
        lesson_id VARCHAR(36) NULL,
        video_timestamp_seconds INT NULL,
        title VARCHAR(255) NULL,
        content TEXT NOT NULL,
        tags JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_notes_user_course (user_id, course_id),
        INDEX idx_notes_user_lesson (user_id, lesson_id)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notes`);
  }
}
