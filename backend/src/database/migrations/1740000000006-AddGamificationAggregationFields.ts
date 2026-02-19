import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGamificationAggregationFields1740000000006 implements MigrationInterface {
  name = 'AddGamificationAggregationFields1740000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_gamification');
    if (!exists) return;

    const hasStats = await queryRunner.hasColumn('user_gamification', 'stats');
    if (!hasStats) {
      await queryRunner.addColumn(
        'user_gamification',
        new TableColumn({
          name: 'stats',
          type: 'json',
          isNullable: true,
        }),
      );
    }

    const hasLastAggregated = await queryRunner.hasColumn('user_gamification', 'last_aggregated_at');
    if (!hasLastAggregated) {
      await queryRunner.addColumn(
        'user_gamification',
        new TableColumn({
          name: 'last_aggregated_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('user_gamification');
    if (!exists) return;

    const hasLastAggregated = await queryRunner.hasColumn('user_gamification', 'last_aggregated_at');
    if (hasLastAggregated) {
      await queryRunner.dropColumn('user_gamification', 'last_aggregated_at');
    }

    const hasStats = await queryRunner.hasColumn('user_gamification', 'stats');
    if (hasStats) {
      await queryRunner.dropColumn('user_gamification', 'stats');
    }
  }
}