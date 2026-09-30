import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullLessonIdOnLessonProgress20260928181000 implements MigrationInterface {
  name = 'AllowNullLessonIdOnLessonProgress20260928181000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE lesson_progress
      MODIFY lesson_id VARCHAR(36) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rows with NULL lesson_id (course-level SCORM progress) would violate NOT NULL; delete none.
    await queryRunner.query(`
      UPDATE lesson_progress SET lesson_id = 'legacy' WHERE lesson_id IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE lesson_progress
      MODIFY lesson_id VARCHAR(36) NOT NULL
    `);
  }
}
