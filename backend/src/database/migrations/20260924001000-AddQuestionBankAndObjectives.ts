import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddQuestionBankAndObjectives20260924001000 implements MigrationInterface {
  name = 'AddQuestionBankAndObjectives20260924001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'learning_objectives',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'course_id', type: 'varchar', length: '36' },
          { name: 'code', type: 'varchar', isNullable: true },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('learning_objectives', new TableIndex({ name: 'IDX_learning_objectives_course', columnNames: ['course_id'] }));
    await queryRunner.createForeignKey(
      'learning_objectives',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'question_bank_items',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'course_id', type: 'varchar', length: '36' },
          { name: 'objective_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'question_type', type: 'enum', enum: ['multiple_choice', 'true_false', 'short_answer'], default: "'multiple_choice'" },
          { name: 'question_text', type: 'text' },
          { name: 'options', type: 'json', isNullable: true },
          { name: 'correct_answer', type: 'varchar' },
          { name: 'explanation', type: 'text', isNullable: true },
          { name: 'points', type: 'int', default: 1 },
          { name: 'difficulty', type: 'varchar', isNullable: true },
          { name: 'tags', type: 'json', isNullable: true },
          { name: 'status', type: 'varchar', default: "'active'" },
          { name: 'source', type: 'varchar', default: "'manual'" },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex('question_bank_items', new TableIndex({ name: 'IDX_question_bank_items_course', columnNames: ['course_id'] }));
    await queryRunner.createIndex('question_bank_items', new TableIndex({ name: 'IDX_question_bank_items_objective', columnNames: ['objective_id'] }));
    await queryRunner.createForeignKey(
      'question_bank_items',
      new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'question_bank_items',
      new TableForeignKey({
        columnNames: ['objective_id'],
        referencedTableName: 'learning_objectives',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.addColumns('questions', [
      new TableColumn({ name: 'objective_id', type: 'varchar', length: '36', isNullable: true }),
      new TableColumn({ name: 'bank_item_id', type: 'varchar', length: '36', isNullable: true }),
      new TableColumn({ name: 'difficulty', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'tags', type: 'json', isNullable: true }),
    ]);
    await queryRunner.createIndex('questions', new TableIndex({ name: 'IDX_questions_objective', columnNames: ['objective_id'] }));
    await queryRunner.createIndex('questions', new TableIndex({ name: 'IDX_questions_bank_item', columnNames: ['bank_item_id'] }));
    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        columnNames: ['objective_id'],
        referencedTableName: 'learning_objectives',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        columnNames: ['bank_item_id'],
        referencedTableName: 'question_bank_items',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const questions = await queryRunner.getTable('questions');
    for (const fk of questions?.foreignKeys.filter((key) => key.columnNames.some((name) => ['objective_id', 'bank_item_id'].includes(name))) || []) {
      await queryRunner.dropForeignKey('questions', fk);
    }
    await queryRunner.dropIndex('questions', 'IDX_questions_bank_item');
    await queryRunner.dropIndex('questions', 'IDX_questions_objective');
    await queryRunner.dropColumns('questions', ['tags', 'difficulty', 'bank_item_id', 'objective_id']);

    await queryRunner.dropTable('question_bank_items', true);
    await queryRunner.dropTable('learning_objectives', true);
  }
}
