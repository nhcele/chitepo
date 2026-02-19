import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddScormPackages1739000000000 implements MigrationInterface {
  name = 'AddScormPackages1739000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scorm_packages',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'course_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'version', type: 'varchar', length: '20', default: "'scorm_1_2'" },
          { name: 'entry_point', type: 'varchar', length: '500', isNullable: false },
          { name: 'root_path', type: 'varchar', length: '500', isNullable: false },
          { name: 'manifest_json', type: 'json', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scorm_packages');
  }
}
