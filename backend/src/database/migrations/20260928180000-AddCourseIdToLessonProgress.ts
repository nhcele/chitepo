import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseIdToLessonProgress20260928180000 implements MigrationInterface {
  name = 'AddCourseIdToLessonProgress20260928180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lesson_progress'
          AND COLUMN_NAME = 'course_id'`,
    );
    if (Number(count) === 0) {
      await queryRunner.query(`
        ALTER TABLE lesson_progress
        ADD COLUMN course_id VARCHAR(36) NULL
      `);
    }

    await queryRunner.query(`
      UPDATE lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      SET lp.course_id = m.course_id
      WHERE lp.course_id IS NULL
    `);

    const [{ count: idxCount }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lesson_progress'
          AND INDEX_NAME = 'idx_lesson_progress_course'`,
    );
    if (Number(idxCount) === 0) {
      await queryRunner.query(`
        ALTER TABLE lesson_progress
        ADD INDEX idx_lesson_progress_course (course_id)
      `);
    }

    const [{ count: idx2Count }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lesson_progress'
          AND INDEX_NAME = 'idx_lesson_progress_user_course'`,
    );
    if (Number(idx2Count) === 0) {
      await queryRunner.query(`
        ALTER TABLE lesson_progress
        ADD INDEX idx_lesson_progress_user_course (user_id, course_id)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE lesson_progress DROP INDEX idx_lesson_progress_course`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP INDEX idx_lesson_progress_user_course`);
    await queryRunner.query(`ALTER TABLE lesson_progress DROP COLUMN course_id`);
  }
}
