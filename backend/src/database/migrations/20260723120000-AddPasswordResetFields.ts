import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordResetFields20260723120000 implements MigrationInterface {
  name = 'AddPasswordResetFields20260723120000';

  private userTable = 'users';

  private columns: TableColumn[] = [
    new TableColumn({
      name: 'password_reset_token',
      type: 'varchar',
      length: '255',
      isNullable: true,
    }),
    new TableColumn({
      name: 'password_reset_expires_at',
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
