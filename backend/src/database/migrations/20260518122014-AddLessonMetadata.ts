import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLessonMetadata20260518122014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add resource_links column (JSON)
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'resource_links',
        type: 'json',
        isNullable: true,
        comment: 'Array of resource links with title and url',
      }),
    );

    // Add completion_mode column (ENUM)
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'completion_mode',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: "'required'",
        comment: 'Completion mode: required, optional, or manual',
      }),
    );

    // Add minimum_watch_percent column (INT)
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'minimum_watch_percent',
        type: 'int',
        isNullable: true,
        comment: 'Minimum percentage of video that must be watched (0-100)',
      }),
    );

    // Add minimum_quiz_score column (INT)
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'minimum_quiz_score',
        type: 'int',
        isNullable: true,
        comment: 'Minimum quiz score required to pass (0-100)',
      }),
    );

    console.log('✅ Added lesson metadata columns: resource_links, completion_mode, minimum_watch_percent, minimum_quiz_score');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns in reverse order
    await queryRunner.dropColumn('lessons', 'minimum_quiz_score');
    await queryRunner.dropColumn('lessons', 'minimum_watch_percent');
    await queryRunner.dropColumn('lessons', 'completion_mode');
    await queryRunner.dropColumn('lessons', 'resource_links');

    console.log('✅ Removed lesson metadata columns');
  }
}
