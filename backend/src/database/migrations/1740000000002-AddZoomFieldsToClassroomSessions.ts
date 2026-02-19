import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddZoomFieldsToClassroomSessions1740000000002 implements MigrationInterface {
  name = 'AddZoomFieldsToClassroomSessions1740000000002';
  private table = 'classroom_sessions';

  private columns: TableColumn[] = [
    new TableColumn({ name: 'timezone', type: 'varchar', length: '64', isNullable: false, default: "'Africa/Harare'" }),
    new TableColumn({ name: 'zoom_meeting_id', type: 'varchar', length: '255', isNullable: true }),
    new TableColumn({ name: 'zoom_join_url', type: 'text', isNullable: true }),
    new TableColumn({ name: 'zoom_host_url', type: 'text', isNullable: true }),
    new TableColumn({ name: 'zoom_recording_url', type: 'text', isNullable: true }),
    new TableColumn({ name: 'zoom_attendance_report_url', type: 'text', isNullable: true }),
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(this.table);
    if (!tableExists) {
      return;
    }
    for (const column of this.columns) {
      const exists = await queryRunner.hasColumn(this.table, column.name);
      if (!exists) {
        await queryRunner.addColumn(this.table, column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable(this.table);
    if (!tableExists) {
      return;
    }
    for (const column of [...this.columns].reverse()) {
      const exists = await queryRunner.hasColumn(this.table, column.name);
      if (exists) {
        await queryRunner.dropColumn(this.table, column.name);
      }
    }
  }
}
