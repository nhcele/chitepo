import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddScormRuns1739100000000 implements MigrationInterface {
  name = 'AddScormRuns1739100000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scorm_runs',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'scorm_package_id', type: 'varchar', length: '36' },
          { name: 'user_id', type: 'varchar', length: '36' },
          { name: 'course_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'enrollment_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', default: "'in_progress'" },
          { name: 'lesson_status', type: 'varchar', length: '40', isNullable: true },
          { name: 'score_raw', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'score_min', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'score_max', type: 'decimal', precision: 8, scale: 2, isNullable: true },
          { name: 'total_time_seconds', type: 'int', default: 0 },
          { name: 'cmi', type: 'json', isNullable: true },
          { name: 'started_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scorm_runs');
  }
}
