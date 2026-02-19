import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddUserTrackAssignments1738080000000 implements MigrationInterface {
  name = 'AddUserTrackAssignments1738080000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_track_assignments',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            generationStrategy: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'track_type',
            type: 'enum',
            enum: [
              'retail_banking',
              'compliance_risk',
              'digital_banking',
              'leadership_management',
              'corporate_banking',
              'operations_excellence',
              'general_education',
              'government_officials',
              'diaspora_engagement',
              'youth_leadership',
              'womens_leadership',
              'specialist'
            ],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'pending', 'suspended'],
            default: "'active'",
          },
          {
            name: 'source',
            type: 'enum',
            enum: ['manual', 'self_enrolled', 'automatic', 'migrated'],
            default: "'manual'",
          },
          {
            name: 'assigned_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'assigned_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'start_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'end_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completion_target_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_mandatory',
            type: 'boolean',
            default: false,
          },
          {
            name: 'mandatory_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          { name: 'idx_user_track_user_id', columnNames: ['user_id'] },
          { name: 'idx_user_track_type', columnNames: ['track_type'] },
          { name: 'idx_user_track_status', columnNames: ['status'] },
          { name: 'UQ_user_track_assignments_user_id_track_type', columnNames: ['user_id', 'track_type'], isUnique: true },
        ],
        foreignKeys: [
          {
            name: 'FK_user_track_assignments_user_id',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_track_assignments');
  }
}
