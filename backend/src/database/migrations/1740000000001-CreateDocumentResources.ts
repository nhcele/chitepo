import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class CreateDocumentResources1740000000001 implements MigrationInterface {
  name = 'CreateDocumentResources1740000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('document_resources');
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: 'document_resources',
        columns: [
          new TableColumn({ name: 'id', type: 'varchar', length: '36', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' }),
          new TableColumn({ name: 'tenant_id', type: 'varchar', length: '36', isNullable: true }),
          new TableColumn({ name: 'title', type: 'varchar', length: '512' }),
          new TableColumn({ name: 'description', type: 'text', isNullable: true }),
          new TableColumn({ name: 'tags', type: 'text', isNullable: true }),
          new TableColumn({ name: 'owner_id', type: 'varchar', length: '36', isNullable: true }),
          new TableColumn({ name: 'department', type: 'varchar', length: '255', isNullable: true }),
          new TableColumn({ name: 'retention_until', type: 'timestamp', isNullable: true }),
          new TableColumn({ name: 'classification', type: 'varchar', length: '64', isNullable: true }),
          new TableColumn({ name: 'version', type: 'int', default: 1 }),
          new TableColumn({ name: 'checksum', type: 'varchar', length: '256', isNullable: true }),
          new TableColumn({ name: 'source', type: 'varchar', length: '128', isNullable: true }),
          new TableColumn({ name: 'access_roles', type: 'text', isNullable: true }),
          new TableColumn({ name: 'access_departments', type: 'text', isNullable: true }),
          new TableColumn({ name: 'file_url', type: 'text' }),
          new TableColumn({ name: 'file_key', type: 'text', isNullable: true }),
          new TableColumn({ name: 'mime_type', type: 'varchar', length: '255', isNullable: true }),
          new TableColumn({ name: 'size_bytes', type: 'bigint', isNullable: true }),
          new TableColumn({ name: 'state', type: 'enum', enum: ['ACTIVE', 'ARCHIVED'], default: "'ACTIVE'" }),
          new TableColumn({ name: 'metadata', type: 'json', isNullable: true }),
          new TableColumn({ name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }),
          new TableColumn({ name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );

    await queryRunner.createIndices('document_resources', [
      new TableIndex({ name: 'IDX_document_resources_tenant_state_created', columnNames: ['tenant_id', 'state', 'created_at'] }),
      new TableIndex({ name: 'IDX_document_resources_tenant_owner_created', columnNames: ['tenant_id', 'owner_id', 'created_at'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('document_resources');
    if (!exists) return;
    await queryRunner.dropTable('document_resources');
  }
}
