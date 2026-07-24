import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateLessonProgress20260518130000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lesson_progress',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'lesson_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'is_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'watch_percent',
            type: 'int',
            default: 0,
          },
          {
            name: 'best_quiz_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'quiz_attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_quiz_attempt_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Idempotent: the table/keys may already exist from an earlier synchronize run.
    const table = await queryRunner.getTable('lesson_progress');
    const hasFk = (col: string) =>
      !!table?.foreignKeys.find((fk) => fk.columnNames.length === 1 && fk.columnNames[0] === col);
    const hasIndex = (name: string) => !!table?.indices.find((ix) => ix.name === name);

    if (!hasFk('user_id')) {
      await queryRunner.createForeignKey(
        'lesson_progress',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    if (!hasFk('lesson_id')) {
      await queryRunner.createForeignKey(
        'lesson_progress',
        new TableForeignKey({
          columnNames: ['lesson_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'lessons',
          onDelete: 'CASCADE',
        }),
      );
    }

    if (!hasIndex('IDX_lesson_progress_user_id')) {
      await queryRunner.createIndex(
        'lesson_progress',
        new TableIndex({ name: 'IDX_lesson_progress_user_id', columnNames: ['user_id'] }),
      );
    }

    if (!hasIndex('IDX_lesson_progress_lesson_id')) {
      await queryRunner.createIndex(
        'lesson_progress',
        new TableIndex({ name: 'IDX_lesson_progress_lesson_id', columnNames: ['lesson_id'] }),
      );
    }

    if (!hasIndex('IDX_lesson_progress_user_lesson_unique')) {
      await queryRunner.createIndex(
        'lesson_progress',
        new TableIndex({
          name: 'IDX_lesson_progress_user_lesson_unique',
          columnNames: ['user_id', 'lesson_id'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lesson_progress');
  }
}
