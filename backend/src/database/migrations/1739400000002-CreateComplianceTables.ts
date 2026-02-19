import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { OfficialPositionType, ComplianceStatus } from '../../compliance/entities/official-position.entity';

export class CreateComplianceTables1739400000002 implements MigrationInterface {
  name = 'CreateComplianceTables1739400000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const positionsTable = await queryRunner.getTable('official_positions');
    if (!positionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'official_positions',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'user_id', type: 'varchar', length: '36' },
            { name: 'position', type: 'enum', enum: Object.values(OfficialPositionType) },
            { name: 'position_title', type: 'varchar', length: '255' },
            { name: 'region_province', type: 'varchar', length: '100', isNullable: true },
            { name: 'ward', type: 'varchar', length: '50', isNullable: true },
            { name: 'constituency', type: 'varchar', length: '100', isNullable: true },
            { name: 'start_date', type: 'date' },
            { name: 'end_date', type: 'date', isNullable: true },
            { name: 'is_active', type: 'boolean', default: true },
            { name: 'is_elected', type: 'boolean', default: true },
            { name: 'election_year', type: 'int', isNullable: true },
            { name: 'compliance_status', type: 'enum', enum: Object.values(ComplianceStatus), default: `'${ComplianceStatus.PENDING_VERIFICATION}'` },
            { name: 'required_certifications', type: 'json' },
            { name: 'completed_certifications', type: 'json', isNullable: true },
            { name: 'compliance_deadline', type: 'date', isNullable: true },
            { name: 'grace_period_end', type: 'date', isNullable: true },
            { name: 'exemption_reason', type: 'text', isNullable: true },
            { name: 'last_compliance_check', type: 'timestamp', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'official_positions',
        new TableIndex({ name: 'idx_official_positions_user_id', columnNames: ['user_id'] }),
      );
      await queryRunner.createIndex(
        'official_positions',
        new TableIndex({ name: 'idx_official_positions_position', columnNames: ['position'] }),
      );
      await queryRunner.createIndex(
        'official_positions',
        new TableIndex({ name: 'idx_official_positions_compliance_status', columnNames: ['compliance_status'] }),
      );
      await queryRunner.createIndex(
        'official_positions',
        new TableIndex({ name: 'idx_official_positions_region', columnNames: ['region_province'] }),
      );

      await queryRunner.createForeignKey(
        'official_positions',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    const alertsTable = await queryRunner.getTable('compliance_alerts');
    if (!alertsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'compliance_alerts',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'position_id', type: 'varchar', length: '36' },
            { name: 'user_id', type: 'varchar', length: '36' },
            { name: 'alert_type', type: 'enum', enum: ['deadline_approaching', 'deadline_passed', 'grace_period_ending', 'non_compliant'] },
            { name: 'message', type: 'text' },
            { name: 'severity', type: 'enum', enum: ['info', 'warning', 'critical'] },
            { name: 'due_date', type: 'date', isNullable: true },
            { name: 'is_read', type: 'boolean', default: false },
            { name: 'is_resolved', type: 'boolean', default: false },
            { name: 'resolved_at', type: 'timestamp', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'compliance_alerts',
        new TableIndex({ name: 'idx_compliance_alerts_position_id', columnNames: ['position_id'] }),
      );
      await queryRunner.createIndex(
        'compliance_alerts',
        new TableIndex({ name: 'idx_compliance_alerts_user_id', columnNames: ['user_id'] }),
      );
      await queryRunner.createIndex(
        'compliance_alerts',
        new TableIndex({ name: 'idx_compliance_alerts_is_read', columnNames: ['is_read'] }),
      );
      await queryRunner.createIndex(
        'compliance_alerts',
        new TableIndex({ name: 'idx_compliance_alerts_is_resolved', columnNames: ['is_resolved'] }),
      );

      await queryRunner.createForeignKey(
        'compliance_alerts',
        new TableForeignKey({
          columnNames: ['position_id'],
          referencedTableName: 'official_positions',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'compliance_alerts',
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
    const alertsTable = await queryRunner.getTable('compliance_alerts');
    if (alertsTable) {
      for (const fk of alertsTable.foreignKeys) {
        await queryRunner.dropForeignKey('compliance_alerts', fk);
      }
      await queryRunner.dropTable('compliance_alerts');
    }

    const positionsTable = await queryRunner.getTable('official_positions');
    if (positionsTable) {
      for (const fk of positionsTable.foreignKeys) {
        await queryRunner.dropForeignKey('official_positions', fk);
      }
      await queryRunner.dropTable('official_positions');
    }
  }
}
