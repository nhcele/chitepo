import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonProgressResumeColumns20260928130000 implements MigrationInterface {
  name = 'AddLessonProgressResumeColumns20260928130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE lesson_progress
       ADD COLUMN last_position_seconds INT NOT NULL DEFAULT 0,
       ADD COLUMN watched_seconds INT NOT NULL DEFAULT 0,
       ADD COLUMN active_seconds INT NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE lesson_progress
       DROP COLUMN last_position_seconds,
       DROP COLUMN watched_seconds,
       DROP COLUMN active_seconds`,
    );
  }
}
