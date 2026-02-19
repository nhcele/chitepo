import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordPolicyFields1740000000000 implements MigrationInterface {
  name = 'AddPasswordPolicyFields1740000000000';

  private userTable = 'users';

  private columns: TableColumn[] = [
    new TableColumn({
      name: 'password_history',
      type: 'json',
      isNullable: true,
    }),
    new TableColumn({
      name: 'last_password_changed_at',
      type: 'timestamp',
      isNullable: true,
    }),
    new TableColumn({
      name: 'password_expiry_at',
      type: 'timestamp',
      isNullable: true,
    }),
    new TableColumn({
      name: 'failed_login_attempts',
      type: 'int',
      isNullable: false,
      default: 0,
    }),
    new TableColumn({
      name: 'mfa_enabled',
      type: 'boolean',
      isNullable: false,
      default: false,
    }),
    new TableColumn({
      name: 'lockout_until',
      type: 'timestamp',
      isNullable: true,
    }),
    new TableColumn({
      name: 'last_failed_login_at',
      type: 'timestamp',
      isNullable: true,
    }),
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of this.columns) {
      const exists = await queryRunner.hasColumn(this.userTable, column.name);
      if (!exists) {
        await queryRunner.addColumn(this.userTable, column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of [...this.columns].reverse()) {
      const exists = await queryRunner.hasColumn(this.userTable, column.name);
      if (exists) {
        await queryRunner.dropColumn(this.userTable, column.name);
      }
    }
  }
}
