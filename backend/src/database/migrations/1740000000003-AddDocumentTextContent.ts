import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDocumentTextContent1740000000003 implements MigrationInterface {
  name = 'AddDocumentTextContent1740000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn('document_resources', 'text_content');
    if (!exists) {
      await queryRunner.addColumn(
        'document_resources',
        new TableColumn({ name: 'text_content', type: 'text', isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn('document_resources', 'text_content');
    if (exists) {
      await queryRunner.dropColumn('document_resources', 'text_content');
    }
  }
}
