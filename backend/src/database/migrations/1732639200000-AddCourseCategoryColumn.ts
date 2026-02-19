import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCourseCategoryColumn1732639200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const table = await queryRunner.getTable('courses');
    const categoryColumn = table?.findColumnByName('category');
    
    if (!categoryColumn) {
      // Add category column to courses table
      await queryRunner.addColumn(
        'courses',
        new TableColumn({
          name: 'category',
          type: 'enum',
          enum: ['core_ideology', 'contemporary_studies', 'practical_governance', 'diaspora_program'],
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove category column
    await queryRunner.dropColumn('courses', 'category');
  }
}

