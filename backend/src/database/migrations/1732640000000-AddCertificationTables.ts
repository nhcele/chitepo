import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddCertificationTables1732640000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create certification_pathways table
    await queryRunner.createTable(
      new Table({
        name: 'certification_pathways',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['general_education', 'government_officials', 'diaspora_engagement', 'youth_leadership', 'womens_leadership', 'specialist'],
          },
          {
            name: 'level',
            type: 'int',
          },
          {
            name: 'level_title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'estimated_duration_weeks',
            type: 'int',
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'minimum_courses',
            type: 'int',
          },
          {
            name: 'required_courses',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'pass_percentage',
            type: 'int',
          },
          {
            name: 'requirements',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'outcome',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_mandatory',
            type: 'boolean',
            default: false,
          },
          {
            name: 'mandatory_for',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'order_index',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create user_certifications table
    await queryRunner.createTable(
      new Table({
        name: 'user_certifications',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'pathway_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['not_started', 'in_progress', 'completed', 'awarded', 'expired'],
            default: "'not_started'",
          },
          {
            name: 'progress_percentage',
            type: 'int',
            default: 0,
          },
          {
            name: 'courses_completed',
            type: 'int',
            default: 0,
          },
          {
            name: 'courses_required',
            type: 'int',
            default: 0,
          },
          {
            name: 'completed_course_ids',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'average_score',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'awarded_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'certificate_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'certificate_number',
            type: 'varchar',
            length: '100',
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
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys with explicit names to avoid duplicates
    // Some environments may already have these constraints (e.g., manual fixes or previous runs).
    // MySQL enforces FK names globally, so attempting to re-add will fail with ER_FK_DUP_NAME.
    const dbName = await queryRunner.getCurrentDatabase();
    const existing = await queryRunner.query(
      `SELECT CONSTRAINT_NAME AS name FROM information_schema.TABLE_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'user_certifications' AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [dbName],
    );
    const existingNames = new Set((existing || []).map((r: any) => String(r.name)));

    if (!existingNames.has('FK_user_certifications_user_id')) {
      await queryRunner.createForeignKey(
        'user_certifications',
        new TableForeignKey({
          name: 'FK_user_certifications_user_id',
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    if (!existingNames.has('FK_user_certifications_pathway_id')) {
      await queryRunner.createForeignKey(
        'user_certifications',
        new TableForeignKey({
          name: 'FK_user_certifications_pathway_id',
          columnNames: ['pathway_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'certification_pathways',
          onDelete: 'CASCADE',
        }),
      );
    }

    // Create indexes (idempotent)
    const existingIdx = await queryRunner.query(
      `SELECT INDEX_NAME AS name FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('user_certifications', 'certification_pathways')`,
      [dbName],
    );
    const idxNames = new Set((existingIdx || []).map((r: any) => String(r.name)));

    if (!idxNames.has('idx_user_certifications_user_id')) {
      await queryRunner.query(
        `CREATE INDEX idx_user_certifications_user_id ON user_certifications(user_id)`,
      );
    }
    if (!idxNames.has('idx_user_certifications_pathway_id')) {
      await queryRunner.query(
        `CREATE INDEX idx_user_certifications_pathway_id ON user_certifications(pathway_id)`,
      );
    }
    if (!idxNames.has('idx_user_certifications_status')) {
      await queryRunner.query(
        `CREATE INDEX idx_user_certifications_status ON user_certifications(status)`,
      );
    }
    if (!idxNames.has('idx_certification_pathways_type')) {
      await queryRunner.query(
        `CREATE INDEX idx_certification_pathways_type ON certification_pathways(type)`,
      );
    }
    if (!idxNames.has('idx_certification_pathways_level')) {
      await queryRunner.query(
        `CREATE INDEX idx_certification_pathways_level ON certification_pathways(level)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const userCertTable = await queryRunner.getTable('user_certifications');
    if (userCertTable) {
      const userForeignKey = userCertTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      const pathwayForeignKey = userCertTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('pathway_id') !== -1,
      );
      if (userForeignKey) {
        await queryRunner.dropForeignKey('user_certifications', userForeignKey);
      }
      if (pathwayForeignKey) {
        await queryRunner.dropForeignKey('user_certifications', pathwayForeignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('user_certifications', true);
    await queryRunner.dropTable('certification_pathways', true);
  }
}

