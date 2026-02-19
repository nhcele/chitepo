import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCohortPacingFields1741300000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'training_cohorts';
    const tableExists = await queryRunner.hasTable(table);
    if (!tableExists) {
      return;
    }

    const pacingModeExists = await queryRunner.hasColumn(table, 'pacing_mode');
    if (!pacingModeExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'pacing_mode',
          type: 'enum',
          enum: ['cohort_paced', 'self_paced', 'hybrid'],
          default: "'cohort_paced'",
        }),
      );
    }

    const weeklyTargetExists = await queryRunner.hasColumn(table, 'weekly_target_minutes');
    if (!weeklyTargetExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'weekly_target_minutes',
          type: 'int',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'training_cohorts';
    const tableExists = await queryRunner.hasTable(table);
    if (!tableExists) {
      return;
    }

    const weeklyTargetExists = await queryRunner.hasColumn(table, 'weekly_target_minutes');
    if (weeklyTargetExists) {
      await queryRunner.dropColumn(table, 'weekly_target_minutes');
    }

    const pacingModeExists = await queryRunner.hasColumn(table, 'pacing_mode');
    if (pacingModeExists) {
      await queryRunner.dropColumn(table, 'pacing_mode');
    }
  }
}
