import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { RPLStatus } from '../../rpl/entities/rpl-application.entity';

export class CreateRplApplicationsTable1739400000003 implements MigrationInterface {
  name = 'CreateRplApplicationsTable1739400000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rpl_applications');
    if (table) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'rpl_applications',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'user_id', type: 'varchar', length: '36' },
          { name: 'pathway_id', type: 'varchar', length: '36' },
          { name: 'status', type: 'enum', enum: Object.values(RPLStatus), default: `'${RPLStatus.DRAFT}'` },
          { name: 'rationale', type: 'text' },
          { name: 'evidence_items', type: 'json' },
          { name: 'requested_credits', type: 'json', isNullable: true },
          { name: 'approved_credits', type: 'json', isNullable: true },
          { name: 'credits_requested', type: 'int', default: 0 },
          { name: 'credits_approved', type: 'int', default: 0 },
          { name: 'assessor_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'assessor_notes', type: 'text', isNullable: true },
          { name: 'submitted_at', type: 'timestamp', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp', isNullable: true },
          { name: 'approved_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'rpl_applications',
      new TableIndex({ name: 'idx_rpl_applications_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'rpl_applications',
      new TableIndex({ name: 'idx_rpl_applications_pathway_id', columnNames: ['pathway_id'] }),
    );
    await queryRunner.createIndex(
      'rpl_applications',
      new TableIndex({ name: 'idx_rpl_applications_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'rpl_applications',
      new TableIndex({ name: 'idx_rpl_applications_assessor_id', columnNames: ['assessor_id'] }),
    );

    await queryRunner.createForeignKey(
      'rpl_applications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'rpl_applications',
      new TableForeignKey({
        columnNames: ['pathway_id'],
        referencedTableName: 'certification_pathways',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'rpl_applications',
      new TableForeignKey({
        columnNames: ['assessor_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('rpl_applications');
    if (!table) {
      return;
    }
    for (const fk of table.foreignKeys) {
      await queryRunner.dropForeignKey('rpl_applications', fk);
    }
    await queryRunner.dropTable('rpl_applications');
  }
}
