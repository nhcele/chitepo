import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import {
  CohortStatus,
  CohortQuarter,
  CohortTrack,
  CohortPacingMode,
} from '../../cohorts/entities/training-cohort.entity';

export class CreateCohortTables1739400000000 implements MigrationInterface {
  name = 'CreateCohortTables1739400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cohortsTable = await queryRunner.getTable('training_cohorts');
    if (!cohortsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'training_cohorts',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'name', type: 'varchar', length: '255' },
            { name: 'track', type: 'enum', enum: Object.values(CohortTrack) },
            { name: 'quarter', type: 'enum', enum: Object.values(CohortQuarter) },
            { name: 'year', type: 'int' },
            { name: 'status', type: 'enum', enum: Object.values(CohortStatus), default: `'${CohortStatus.UPCOMING}'` },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'start_date', type: 'date' },
            { name: 'end_date', type: 'date' },
            { name: 'enrollment_open_date', type: 'date' },
            { name: 'enrollment_close_date', type: 'date' },
            { name: 'max_participants', type: 'int', default: 100 },
            { name: 'current_participants', type: 'int', default: 0 },
            { name: 'is_mandatory', type: 'boolean', default: false },
            { name: 'mandatory_for', type: 'varchar', length: '500', isNullable: true },
            { name: 'is_virtual', type: 'boolean', default: false },
            { name: 'meeting_schedule', type: 'varchar', length: '500', isNullable: true },
            { name: 'venue', type: 'varchar', length: '500', isNullable: true },
            { name: 'pacing_mode', type: 'enum', enum: Object.values(CohortPacingMode), default: `'${CohortPacingMode.COHORT_PACED}'` },
            { name: 'weekly_target_minutes', type: 'int', isNullable: true },
            { name: 'instructor_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'course_ids', type: 'json', isNullable: true },
            { name: 'cost', type: 'decimal', precision: 10, scale: 2, default: 0 },
            { name: 'prerequisites', type: 'json', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'onboarding_template', type: 'json', isNullable: true },
            { name: 'is_active', type: 'boolean', default: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'training_cohorts',
        new TableIndex({ name: 'idx_training_cohorts_track', columnNames: ['track'] }),
      );
      await queryRunner.createIndex(
        'training_cohorts',
        new TableIndex({ name: 'idx_training_cohorts_quarter', columnNames: ['quarter'] }),
      );
      await queryRunner.createIndex(
        'training_cohorts',
        new TableIndex({ name: 'idx_training_cohorts_year', columnNames: ['year'] }),
      );
      await queryRunner.createIndex(
        'training_cohorts',
        new TableIndex({ name: 'idx_training_cohorts_status', columnNames: ['status'] }),
      );

      await queryRunner.createForeignKey(
        'training_cohorts',
        new TableForeignKey({
          columnNames: ['instructor_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    const enrollmentsTable = await queryRunner.getTable('cohort_enrollments');
    if (!enrollmentsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'cohort_enrollments',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'cohort_id', type: 'varchar', length: '36' },
            { name: 'user_id', type: 'varchar', length: '36' },
            { name: 'mentor_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'status', type: 'enum', enum: ['enrolled', 'active', 'completed', 'withdrawn', 'failed'], default: "'enrolled'" },
            { name: 'enrolled_at', type: 'timestamp' },
            { name: 'completed_at', type: 'timestamp', isNullable: true },
            { name: 'attendance_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 },
            { name: 'final_score', type: 'decimal', precision: 5, scale: 2, isNullable: true },
            { name: 'onboarding_checklist', type: 'json', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
          uniques: [{ columnNames: ['cohort_id', 'user_id'] }],
        }),
        true,
      );

      await queryRunner.createIndex(
        'cohort_enrollments',
        new TableIndex({ name: 'idx_cohort_enrollments_cohort_id', columnNames: ['cohort_id'] }),
      );
      await queryRunner.createIndex(
        'cohort_enrollments',
        new TableIndex({ name: 'idx_cohort_enrollments_user_id', columnNames: ['user_id'] }),
      );
      await queryRunner.createIndex(
        'cohort_enrollments',
        new TableIndex({ name: 'idx_cohort_enrollments_status', columnNames: ['status'] }),
      );

      await queryRunner.createForeignKey(
        'cohort_enrollments',
        new TableForeignKey({
          columnNames: ['cohort_id'],
          referencedTableName: 'training_cohorts',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'cohort_enrollments',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const enrollmentsTable = await queryRunner.getTable('cohort_enrollments');
    if (enrollmentsTable) {
      for (const fk of enrollmentsTable.foreignKeys) {
        await queryRunner.dropForeignKey('cohort_enrollments', fk);
      }
      await queryRunner.dropTable('cohort_enrollments');
    }

    const cohortsTable = await queryRunner.getTable('training_cohorts');
    if (cohortsTable) {
      for (const fk of cohortsTable.foreignKeys) {
        await queryRunner.dropForeignKey('training_cohorts', fk);
      }
      await queryRunner.dropTable('training_cohorts');
    }
  }
}
