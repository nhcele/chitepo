import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOnboardingTemplateToCohorts1741300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'training_cohorts';
    const tableExists = await queryRunner.hasTable(table);
    if (!tableExists) {
      return;
    }
    const exists = await queryRunner.hasColumn(table, 'onboarding_template');
    if (!exists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'onboarding_template',
          type: 'json',
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
    const exists = await queryRunner.hasColumn(table, 'onboarding_template');
    if (exists) {
      await queryRunner.dropColumn(table, 'onboarding_template');
    }
  }
}
