import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddAssessmentAttemptFoundation20260923000000 implements MigrationInterface {
  name = 'AddAssessmentAttemptFoundation20260923000000';

  private async addColumnIfMissing(queryRunner: QueryRunner, table: string, column: TableColumn) {
    if (!(await queryRunner.hasColumn(table, column.name))) {
      await queryRunner.addColumn(table, column);
    }
  }

  private async createIndexIfMissing(queryRunner: QueryRunner, table: string, index: TableIndex) {
    const tableMetadata = await queryRunner.getTable(table);
    if (tableMetadata && !tableMetadata.indices.some((existing) => existing.name === index.name)) {
      await queryRunner.createIndex(table, index);
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      'questions',
      new TableColumn({ name: 'is_archived', type: 'boolean', default: false }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'questions',
      new TableColumn({ name: 'version', type: 'int', default: 1 }),
    );

    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['in_progress', 'submitted', 'auto_submitted', 'pending_grading', 'graded', 'finalized', 'abandoned'],
        default: "'in_progress'",
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({ name: 'attempt_number', type: 'int', default: 1 }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({ name: 'deadline_at', type: 'timestamp', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({ name: 'submitted_at', type: 'timestamp', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({ name: 'last_saved_at', type: 'timestamp', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({ name: 'idempotency_key', type: 'varchar', length: '128', isNullable: true }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableColumn({ name: 'max_score', type: 'decimal', precision: 8, scale: 2, isNullable: true }),
    );

    await queryRunner.query(`ALTER TABLE quiz_attempts MODIFY score DECIMAL(8,2) NULL`);
    await queryRunner.query(`ALTER TABLE quiz_attempts MODIFY max_score DECIMAL(8,2) NULL`);
    await queryRunner.query(`ALTER TABLE quiz_attempts MODIFY passed TINYINT(1) NULL`);
    await queryRunner.query(`UPDATE quiz_attempts SET started_at = created_at WHERE started_at IS NULL`);
    await queryRunner.query(`UPDATE quiz_attempts SET submitted_at = completed_at WHERE submitted_at IS NULL AND completed_at IS NOT NULL`);
    await queryRunner.query(`UPDATE quiz_attempts SET status = 'finalized' WHERE status = 'in_progress'`);
    await queryRunner.query(`
      UPDATE quiz_attempts current_attempt
      JOIN (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, quiz_id ORDER BY created_at, id) AS sequence_number
        FROM quiz_attempts
      ) numbered_attempts ON numbered_attempts.id = current_attempt.id
      SET current_attempt.attempt_number = numbered_attempts.sequence_number
    `);

    await this.createIndexIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableIndex({ name: 'IDX_quiz_attempts_user_quiz_status', columnNames: ['user_id', 'quiz_id', 'status'] }),
    );
    await this.createIndexIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableIndex({ name: 'IDX_quiz_attempts_user_quiz_created', columnNames: ['user_id', 'quiz_id', 'created_at'] }),
    );
    await this.createIndexIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableIndex({ name: 'IDX_quiz_attempts_deadline', columnNames: ['status', 'deadline_at'] }),
    );
    await this.createIndexIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableIndex({ name: 'IDX_quiz_attempts_user_quiz_number', columnNames: ['user_id', 'quiz_id', 'attempt_number'], isUnique: true }),
    );
    await this.createIndexIfMissing(
      queryRunner,
      'quiz_attempts',
      new TableIndex({ name: 'IDX_quiz_attempts_idempotency_key', columnNames: ['idempotency_key'], isUnique: true }),
    );

    if (!(await queryRunner.hasTable('attempt_items'))) {
      await queryRunner.createTable(
        new Table({
          name: 'attempt_items',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'attempt_id', type: 'varchar', length: '36' },
            { name: 'question_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'order_index', type: 'int' },
            { name: 'snapshot', type: 'json' },
            { name: 'response', type: 'text', isNullable: true },
            { name: 'response_revision', type: 'int', default: 0 },
            {
              name: 'grading_status',
              type: 'enum',
              enum: ['unanswered', 'auto_graded', 'pending_manual', 'manually_graded'],
              default: "'unanswered'",
            },
            { name: 'is_correct', type: 'boolean', isNullable: true },
            { name: 'points_earned', type: 'decimal', precision: 8, scale: 2, isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          ],
          indices: [
            { name: 'IDX_attempt_items_attempt_id', columnNames: ['attempt_id'] },
            { name: 'IDX_attempt_items_attempt_question', columnNames: ['attempt_id', 'question_id'], isUnique: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'attempt_items',
        new TableForeignKey({
          columnNames: ['attempt_id'],
          referencedTableName: 'quiz_attempts',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'attempt_items',
        new TableForeignKey({
          columnNames: ['question_id'],
          referencedTableName: 'questions',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('attempt_items')) {
      await queryRunner.dropTable('attempt_items');
    }

    const attemptTable = await queryRunner.getTable('quiz_attempts');
    for (const indexName of [
      'IDX_quiz_attempts_idempotency_key',
      'IDX_quiz_attempts_user_quiz_number',
      'IDX_quiz_attempts_deadline',
      'IDX_quiz_attempts_user_quiz_created',
      'IDX_quiz_attempts_user_quiz_status',
    ]) {
      const index = attemptTable?.indices.find((existing) => existing.name === indexName);
      if (index) await queryRunner.dropIndex('quiz_attempts', index);
    }

    for (const columnName of ['idempotency_key', 'last_saved_at', 'submitted_at', 'deadline_at', 'attempt_number', 'status']) {
      if (await queryRunner.hasColumn('quiz_attempts', columnName)) {
        await queryRunner.dropColumn('quiz_attempts', columnName);
      }
    }

    for (const columnName of ['version', 'is_archived']) {
      if (await queryRunner.hasColumn('questions', columnName)) {
        await queryRunner.dropColumn('questions', columnName);
      }
    }
  }
}
