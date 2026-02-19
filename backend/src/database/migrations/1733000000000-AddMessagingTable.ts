import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddMessagingTable1733000000000 implements MigrationInterface {
  name = 'AddMessagingTable1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'course_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'sender_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'recipient_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['instructor_to_student', 'student_to_instructor', 'system'],
            default: "'student_to_instructor'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['sent', 'delivered', 'read'],
            default: "'sent'",
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_archived',
            type: 'boolean',
            default: false,
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
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_course_created',
        columnNames: ['course_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_sender_created',
        columnNames: ['sender_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_recipient_created',
        columnNames: ['recipient_id', 'created_at'],
      }),
    );

    // Create foreign keys with explicit names
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'FK_messages_course_id',
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'FK_messages_sender_id',
        columnNames: ['sender_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'FK_messages_recipient_id',
        columnNames: ['recipient_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
  }
}

