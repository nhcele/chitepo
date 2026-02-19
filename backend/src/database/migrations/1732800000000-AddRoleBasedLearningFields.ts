import { MigrationInterface, QueryRunner, TableColumn, Table, TableIndex } from 'typeorm';

export class AddRoleBasedLearningFields1732800000000 implements MigrationInterface {
  name = 'AddRoleBasedLearningFields1732800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add job role related columns to users table
    const userColumns: TableColumn[] = [
      new TableColumn({
        name: 'job_role',
        type: "enum('teller','customer_service_rep','personal_banker','operations_clerk','compliance_officer','risk_analyst','credit_analyst','it_support','systems_administrator','cybersecurity_analyst','branch_manager','operations_manager','compliance_manager','risk_manager','ceo','cfo','cto','cco','cro')",
        isNullable: true,
      }),
      new TableColumn({
        name: 'role_category',
        type: "enum('frontline','operations','technology','management','executive','compliance','risk')",
        isNullable: true,
      }),
      new TableColumn({
        name: 'role_level',
        type: "enum('staff','supervisor','manager','director','executive')",
        isNullable: true,
      }),
      new TableColumn({
        name: 'department',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'location',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'hire_date',
        type: 'timestamp',
        isNullable: true,
      }),
    ];

    for (const col of userColumns) {
      const exists = await queryRunner.hasColumn('users', col.name);
      if (!exists) {
        await queryRunner.addColumn('users', col);
      }
    }

    // Create role_learning_paths table for storing role-based learning path definitions
    await queryRunner.createTable(
      new Table({
        name: 'role_learning_paths',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          }),
          new TableColumn({
            name: 'job_role',
            type: "enum('teller','customer_service_rep','personal_banker','operations_clerk','compliance_officer','risk_analyst','credit_analyst','it_support','systems_administrator','cybersecurity_analyst','branch_manager','operations_manager','compliance_manager','risk_manager','ceo','cfo','cto','cco','cro')",
            isNullable: false,
          }),
          new TableColumn({
            name: 'required_courses',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'recommended_courses',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'electives',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'certification_requirements',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'time_to_complete_weeks',
            type: 'int',
            default: 0,
          }),
          new TableColumn({
            name: 'prerequisites',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'career_progression',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'compliance_deadlines',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'is_active',
            type: 'boolean',
            default: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_role_learning_paths_job_role',
            columnNames: ['job_role'],
          }),
        ],
      }),
      true,
    );

    // Create role_competencies table
    await queryRunner.createTable(
      new Table({
        name: 'role_competencies',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          }),
          new TableColumn({
            name: 'job_role',
            type: "enum('teller','customer_service_rep','personal_banker','operations_clerk','compliance_officer','risk_analyst','credit_analyst','it_support','systems_administrator','cybersecurity_analyst','branch_manager','operations_manager','compliance_manager','risk_manager','ceo','cfo','cto','cco','cro')",
            isNullable: false,
          }),
          new TableColumn({
            name: 'competency',
            type: 'varchar',
            length: '255',
            isNullable: false,
          }),
          new TableColumn({
            name: 'level',
            type: "enum('beginner','intermediate','advanced','expert')",
            isNullable: false,
          }),
          new TableColumn({
            name: 'required_courses',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'assessment_criteria',
            type: 'json',
            isNullable: true,
          }),
          new TableColumn({
            name: 'validation_method',
            type: "enum('quiz','project','simulation','peer_review')",
            isNullable: false,
          }),
          new TableColumn({
            name: 'is_active',
            type: 'boolean',
            default: true,
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          }),
        ],
        indices: [
          new TableIndex({
            name: 'idx_role_competencies_job_role',
            columnNames: ['job_role'],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new tables
    await queryRunner.dropTable('role_competencies');
    await queryRunner.dropTable('role_learning_paths');

    // Remove the new columns from users table
    await queryRunner.dropColumns('users', [
      'job_role',
      'role_category',
      'role_level',
      'department',
      'location',
      'hire_date',
    ]);
  }
}
