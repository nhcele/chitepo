import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMentorAndChecklistToCohortEnrollments1740000000004 implements MigrationInterface {
  name = 'AddMentorAndChecklistToCohortEnrollments1740000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = 'cohort_enrollments';
    const tableExists = await queryRunner.hasTable(table);
    if (!tableExists) {
      return;
    }

    const mentorExists = await queryRunner.hasColumn(table, 'mentor_id');
    if (!mentorExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({ name: 'mentor_id', type: 'varchar', length: '36', isNullable: true }),
      );
    }

    const checklistExists = await queryRunner.hasColumn(table, 'onboarding_checklist');
    if (!checklistExists) {
      await queryRunner.addColumn(
        table,
        new TableColumn({ name: 'onboarding_checklist', type: 'json', isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = 'cohort_enrollments';
    const tableExists = await queryRunner.hasTable(table);
    if (!tableExists) {
      return;
    }

    const checklistExists = await queryRunner.hasColumn(table, 'onboarding_checklist');
    if (checklistExists) {
      await queryRunner.dropColumn(table, 'onboarding_checklist');
    }

    const mentorExists = await queryRunner.hasColumn(table, 'mentor_id');
    if (mentorExists) {
      await queryRunner.dropColumn(table, 'mentor_id');
    }
  }
}
