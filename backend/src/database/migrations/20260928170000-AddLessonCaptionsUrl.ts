import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonCaptionsUrl20260928170000 implements MigrationInterface {
  name = 'AddLessonCaptionsUrl20260928170000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lessons'
          AND COLUMN_NAME = 'captions_url'`,
    );
    if (Number(count) === 0) {
      await queryRunner.query(`
        ALTER TABLE lessons
        ADD COLUMN captions_url VARCHAR(500) NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'lessons'
          AND COLUMN_NAME = 'captions_url'`,
    );
    if (Number(count) > 0) {
      await queryRunner.query(`ALTER TABLE lessons DROP COLUMN captions_url`);
    }
  }
}
