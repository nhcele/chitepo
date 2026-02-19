import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class CourseModulesAndModuleReuse1723710740000 implements MigrationInterface {
  name = 'CourseModulesAndModuleReuse1723710740000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend modules table for reuse - check if table and columns exist first
    const table = await queryRunner.getTable('modules');
    if (!table) {
      return; // Modules table doesn't exist yet, skip this migration
    }
    if (!table.findColumnByName('author_id')) {
      await queryRunner.addColumn('modules', new TableColumn({ name: 'author_id', type: 'varchar', isNullable: true }));
    }
    if (!table.findColumnByName('thumbnail')) {
      await queryRunner.addColumn('modules', new TableColumn({ name: 'thumbnail', type: 'varchar', isNullable: true }));
    }
    if (!table.findColumnByName('estimated_duration_min')) {
      await queryRunner.addColumn('modules', new TableColumn({ name: 'estimated_duration_min', type: 'int', isNullable: true }));
    }
    if (!table.findColumnByName('tags')) {
      await queryRunner.addColumn('modules', new TableColumn({ name: 'tags', type: 'json', isNullable: true }));
    }
    if (!table.findColumnByName('visibility')) {
      await queryRunner.addColumn('modules', new TableColumn({ name: 'visibility', type: "enum", enum: ['public','private','shared'], default: `'private'` }));
    }

    // Drop FK on modules.course_id before altering nullability to avoid index drop errors
    const courseFk = table.foreignKeys.find(fk => fk.columnNames.includes('course_id'));
    if (courseFk) {
      await queryRunner.dropForeignKey('modules', courseFk);
    }
    await queryRunner.changeColumn('modules', 'course_id', new TableColumn({ name: 'course_id', type: 'varchar', isNullable: true }));

    // Re-create FK after altering column
    const refreshed = await queryRunner.getTable('modules');
    const hasCourseFk = refreshed?.foreignKeys.some(fk => fk.columnNames.includes('course_id'));
    if (!hasCourseFk) {
      await queryRunner.createForeignKey('modules', new TableForeignKey({
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }));
    }

    // Create course_modules join table
    await queryRunner.createTable(new Table({
      name: 'course_modules',
      columns: [
        { name: 'id', type: 'varchar', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'course_id', type: 'varchar' },
        { name: 'module_id', type: 'varchar' },
        { name: 'sort_order', type: 'int', default: 0 },
        { name: 'is_required', type: 'boolean', default: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
      uniques: [{ columnNames: ['course_id', 'module_id'] }],
    }));

    await queryRunner.createForeignKey('course_modules', new TableForeignKey({
      columnNames: ['course_id'], referencedTableName: 'courses', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
    await queryRunner.createForeignKey('course_modules', new TableForeignKey({
      columnNames: ['module_id'], referencedTableName: 'modules', referencedColumnNames: ['id'], onDelete: 'CASCADE',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs then table
    const table = await queryRunner.getTable('course_modules');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('course_modules', fk);
      }
      await queryRunner.dropTable('course_modules');
    }

    // Revert modules columns
    await queryRunner.changeColumn('modules', 'course_id', new TableColumn({ name: 'course_id', type: 'varchar', isNullable: false }));
    await queryRunner.dropColumn('modules', 'visibility');
    await queryRunner.dropColumn('modules', 'tags');
    await queryRunner.dropColumn('modules', 'estimated_duration_min');
    await queryRunner.dropColumn('modules', 'thumbnail');
    await queryRunner.dropColumn('modules', 'author_id');
  }
}
