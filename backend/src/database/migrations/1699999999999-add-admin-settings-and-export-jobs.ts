import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminSettingsAndExportJobs1699999999999 implements MigrationInterface {
  name = 'AddAdminSettingsAndExportJobs1699999999999'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ` +
      "`system_settings` (\n" +
      "  `id` varchar(36) NOT NULL,\n" +
      "  `key` varchar(128) NOT NULL,\n" +
      "  `value` text NULL,\n" +
      "  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),\n" +
      "  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),\n" +
      "  UNIQUE INDEX `IDX_system_settings_key` (`key`),\n" +
      "  PRIMARY KEY (`id`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n"
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ` +
      "`export_jobs` (\n" +
      "  `id` varchar(36) NOT NULL,\n" +
      "  `type` varchar(255) NOT NULL,\n" +
      "  `params` json NULL,\n" +
      "  `status` varchar(255) NOT NULL DEFAULT 'PENDING',\n" +
      "  `error` text NULL,\n" +
      "  `file_path` text NULL,\n" +
      "  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),\n" +
      "  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),\n" +
      "  `completed_at` datetime NULL,\n" +
      "  PRIMARY KEY (`id`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n"
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS `export_jobs`");
    await queryRunner.query("DROP TABLE IF EXISTS `system_settings`");
  }
}
