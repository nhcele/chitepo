import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { SessionStatus, SessionType } from '../../classroom-sessions/entities/classroom-session.entity';

export class CreateClassroomSessionsTables1739400000001 implements MigrationInterface {
  name = 'CreateClassroomSessionsTables1739400000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sessionsTable = await queryRunner.getTable('classroom_sessions');
    if (!sessionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'classroom_sessions',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'title', type: 'varchar', length: '255' },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'session_code', type: 'varchar', length: '6', isNullable: false },
            { name: 'trainer_id', type: 'varchar', length: '36' },
            { name: 'course_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'lesson_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'type', type: 'enum', enum: Object.values(SessionType), default: `'${SessionType.PHYSICAL}'` },
            { name: 'status', type: 'enum', enum: Object.values(SessionStatus), default: `'${SessionStatus.SCHEDULED}'` },
            { name: 'scheduled_start', type: 'timestamp' },
            { name: 'scheduled_end', type: 'timestamp', isNullable: true },
            { name: 'timezone', type: 'varchar', length: '64', default: "'Africa/Harare'" },
            { name: 'zoom_meeting_id', type: 'varchar', length: '255', isNullable: true },
            { name: 'zoom_join_url', type: 'text', isNullable: true },
            { name: 'zoom_host_url', type: 'text', isNullable: true },
            { name: 'zoom_recording_url', type: 'text', isNullable: true },
            { name: 'zoom_attendance_report_url', type: 'text', isNullable: true },
            { name: 'actual_start', type: 'timestamp', isNullable: true },
            { name: 'actual_end', type: 'timestamp', isNullable: true },
            { name: 'venue', type: 'varchar', length: '500', isNullable: true },
            { name: 'max_participants', type: 'int', default: 50 },
            { name: 'is_synchronized', type: 'boolean', default: false },
            { name: 'allow_remote_join', type: 'boolean', default: false },
            { name: 'settings', type: 'json', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'is_active', type: 'boolean', default: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_trainer_id', columnNames: ['trainer_id'] }),
      );
      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_course_id', columnNames: ['course_id'] }),
      );
      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_lesson_id', columnNames: ['lesson_id'] }),
      );
      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_status', columnNames: ['status'] }),
      );
      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_type', columnNames: ['type'] }),
      );
      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_session_code', columnNames: ['session_code'], isUnique: true }),
      );
      await queryRunner.createIndex(
        'classroom_sessions',
        new TableIndex({ name: 'idx_classroom_sessions_scheduled_start', columnNames: ['scheduled_start'] }),
      );

      await queryRunner.createForeignKey(
        'classroom_sessions',
        new TableForeignKey({
          columnNames: ['trainer_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'classroom_sessions',
        new TableForeignKey({
          columnNames: ['course_id'],
          referencedTableName: 'courses',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      await queryRunner.createForeignKey(
        'classroom_sessions',
        new TableForeignKey({
          columnNames: ['lesson_id'],
          referencedTableName: 'lessons',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    const participantsTable = await queryRunner.getTable('classroom_session_participants');
    if (!participantsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'classroom_session_participants',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'session_id', type: 'varchar', length: '36' },
            { name: 'user_id', type: 'varchar', length: '36' },
            { name: 'joined_at', type: 'timestamp' },
            { name: 'left_at', type: 'timestamp', isNullable: true },
            { name: 'is_physical', type: 'boolean', default: true },
            { name: 'current_lesson_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 },
            { name: 'last_activity_at', type: 'timestamp', isNullable: true },
            { name: 'metadata', type: 'json', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'classroom_session_participants',
        new TableIndex({ name: 'idx_classroom_session_participants_session_id', columnNames: ['session_id'] }),
      );
      await queryRunner.createIndex(
        'classroom_session_participants',
        new TableIndex({ name: 'idx_classroom_session_participants_user_id', columnNames: ['user_id'] }),
      );
      await queryRunner.createIndex(
        'classroom_session_participants',
        new TableIndex({ name: 'idx_classroom_session_participants_joined_at', columnNames: ['joined_at'] }),
      );

      await queryRunner.createForeignKey(
        'classroom_session_participants',
        new TableForeignKey({
          columnNames: ['session_id'],
          referencedTableName: 'classroom_sessions',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'classroom_session_participants',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'classroom_session_participants',
        new TableForeignKey({
          columnNames: ['current_lesson_id'],
          referencedTableName: 'lessons',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const participantsTable = await queryRunner.getTable('classroom_session_participants');
    if (participantsTable) {
      for (const fk of participantsTable.foreignKeys) {
        await queryRunner.dropForeignKey('classroom_session_participants', fk);
      }
      await queryRunner.dropTable('classroom_session_participants');
    }

    const sessionsTable = await queryRunner.getTable('classroom_sessions');
    if (sessionsTable) {
      for (const fk of sessionsTable.foreignKeys) {
        await queryRunner.dropForeignKey('classroom_sessions', fk);
      }
      await queryRunner.dropTable('classroom_sessions');
    }
  }
}
