import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoleEnum20260917000000 implements MigrationInterface {
  name = 'UpdateUserRoleEnum20260917000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update the role column enum from 'student' to 'learner'
    await queryRunner.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('learner', 'instructor', 'admin', 'super_admin') 
      NOT NULL DEFAULT 'learner'
    `);

    // Update existing 'student' values to 'learner'
    await queryRunner.query(`
      UPDATE users SET role = 'learner' WHERE role = 'student'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the enum back to 'student'
    await queryRunner.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('student', 'instructor', 'admin', 'super_admin') 
      NOT NULL DEFAULT 'student'
    `);

    // Revert existing 'learner' values to 'student'
    await queryRunner.query(`
      UPDATE users SET role = 'student' WHERE role = 'learner'
    `);
  }
}
