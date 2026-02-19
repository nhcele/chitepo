import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserGamification1740000000005 implements MigrationInterface {
  name = 'CreateUserGamification1740000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_gamification');
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: 'user_gamification',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
          { name: 'user_id', type: 'varchar', length: '36', isUnique: true },
          { name: 'points', type: 'int', default: 0 },
          { name: 'badges', type: 'json', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_gamification');
    if (!exists) return;
    await queryRunner.dropTable('user_gamification');
  }
}
