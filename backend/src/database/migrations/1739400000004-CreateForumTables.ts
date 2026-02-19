import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { ForumStatus, ForumType } from '../../forums/entities/forum.entity';

export class CreateForumTables1739400000004 implements MigrationInterface {
  name = 'CreateForumTables1739400000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const forumsTable = await queryRunner.getTable('forums');
    if (!forumsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'forums',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'title', type: 'varchar', length: '255' },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'type', type: 'enum', enum: Object.values(ForumType), default: `'${ForumType.GENERAL}'` },
            { name: 'status', type: 'enum', enum: Object.values(ForumStatus), default: `'${ForumStatus.ACTIVE}'` },
            { name: 'cohort_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'region', type: 'varchar', length: '100', isNullable: true },
            { name: 'country', type: 'varchar', length: '100', isNullable: true },
            { name: 'created_by', type: 'varchar', length: '36' },
            { name: 'is_public', type: 'boolean', default: true },
            { name: 'member_count', type: 'int', default: 0 },
            { name: 'post_count', type: 'int', default: 0 },
            { name: 'last_activity_at', type: 'timestamp', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'forums',
        new TableIndex({ name: 'idx_forums_type', columnNames: ['type'] }),
      );
      await queryRunner.createIndex(
        'forums',
        new TableIndex({ name: 'idx_forums_cohort_id', columnNames: ['cohort_id'] }),
      );
      await queryRunner.createIndex(
        'forums',
        new TableIndex({ name: 'idx_forums_region', columnNames: ['region'] }),
      );
      await queryRunner.createIndex(
        'forums',
        new TableIndex({ name: 'idx_forums_country', columnNames: ['country'] }),
      );
      await queryRunner.createIndex(
        'forums',
        new TableIndex({ name: 'idx_forums_status', columnNames: ['status'] }),
      );

      await queryRunner.createForeignKey(
        'forums',
        new TableForeignKey({
          columnNames: ['cohort_id'],
          referencedTableName: 'training_cohorts',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
      await queryRunner.createForeignKey(
        'forums',
        new TableForeignKey({
          columnNames: ['created_by'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    const postsTable = await queryRunner.getTable('forum_posts');
    if (!postsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'forum_posts',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'forum_id', type: 'varchar', length: '36' },
            { name: 'parent_id', type: 'varchar', length: '36', isNullable: true },
            { name: 'author_id', type: 'varchar', length: '36' },
            { name: 'title', type: 'varchar', length: '255' },
            { name: 'content', type: 'text' },
            { name: 'is_pinned', type: 'boolean', default: false },
            { name: 'is_locked', type: 'boolean', default: false },
            { name: 'view_count', type: 'int', default: 0 },
            { name: 'reply_count', type: 'int', default: 0 },
            { name: 'like_count', type: 'int', default: 0 },
            { name: 'tags', type: 'json', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'forum_posts',
        new TableIndex({ name: 'idx_forum_posts_forum_id', columnNames: ['forum_id'] }),
      );
      await queryRunner.createIndex(
        'forum_posts',
        new TableIndex({ name: 'idx_forum_posts_parent_id', columnNames: ['parent_id'] }),
      );
      await queryRunner.createIndex(
        'forum_posts',
        new TableIndex({ name: 'idx_forum_posts_author_id', columnNames: ['author_id'] }),
      );
      await queryRunner.createIndex(
        'forum_posts',
        new TableIndex({ name: 'idx_forum_posts_created_at', columnNames: ['created_at'] }),
      );

      await queryRunner.createForeignKey(
        'forum_posts',
        new TableForeignKey({
          columnNames: ['forum_id'],
          referencedTableName: 'forums',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'forum_posts',
        new TableForeignKey({
          columnNames: ['parent_id'],
          referencedTableName: 'forum_posts',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'forum_posts',
        new TableForeignKey({
          columnNames: ['author_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    const membersTable = await queryRunner.getTable('forum_members');
    if (!membersTable) {
      await queryRunner.createTable(
        new Table({
          name: 'forum_members',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'forum_id', type: 'varchar', length: '36' },
            { name: 'user_id', type: 'varchar', length: '36' },
            { name: 'role', type: 'enum', enum: ['member', 'moderator', 'admin'], default: "'member'" },
            { name: 'joined_at', type: 'timestamp' },
            { name: 'last_read_at', type: 'timestamp', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
          ],
          uniques: [{ columnNames: ['forum_id', 'user_id'] }],
        }),
        true,
      );

      await queryRunner.createIndex(
        'forum_members',
        new TableIndex({ name: 'idx_forum_members_forum_id', columnNames: ['forum_id'] }),
      );
      await queryRunner.createIndex(
        'forum_members',
        new TableIndex({ name: 'idx_forum_members_user_id', columnNames: ['user_id'] }),
      );

      await queryRunner.createForeignKey(
        'forum_members',
        new TableForeignKey({
          columnNames: ['forum_id'],
          referencedTableName: 'forums',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'forum_members',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    const likesTable = await queryRunner.getTable('forum_post_likes');
    if (!likesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'forum_post_likes',
          columns: [
            { name: 'id', type: 'varchar', length: '36', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'post_id', type: 'varchar', length: '36' },
            { name: 'user_id', type: 'varchar', length: '36' },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
          uniques: [{ columnNames: ['post_id', 'user_id'] }],
        }),
        true,
      );

      await queryRunner.createIndex(
        'forum_post_likes',
        new TableIndex({ name: 'idx_forum_post_likes_post_id', columnNames: ['post_id'] }),
      );
      await queryRunner.createIndex(
        'forum_post_likes',
        new TableIndex({ name: 'idx_forum_post_likes_user_id', columnNames: ['user_id'] }),
      );

      await queryRunner.createForeignKey(
        'forum_post_likes',
        new TableForeignKey({
          columnNames: ['post_id'],
          referencedTableName: 'forum_posts',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'forum_post_likes',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const likesTable = await queryRunner.getTable('forum_post_likes');
    if (likesTable) {
      for (const fk of likesTable.foreignKeys) {
        await queryRunner.dropForeignKey('forum_post_likes', fk);
      }
      await queryRunner.dropTable('forum_post_likes');
    }

    const membersTable = await queryRunner.getTable('forum_members');
    if (membersTable) {
      for (const fk of membersTable.foreignKeys) {
        await queryRunner.dropForeignKey('forum_members', fk);
      }
      await queryRunner.dropTable('forum_members');
    }

    const postsTable = await queryRunner.getTable('forum_posts');
    if (postsTable) {
      for (const fk of postsTable.foreignKeys) {
        await queryRunner.dropForeignKey('forum_posts', fk);
      }
      await queryRunner.dropTable('forum_posts');
    }

    const forumsTable = await queryRunner.getTable('forums');
    if (forumsTable) {
      for (const fk of forumsTable.foreignKeys) {
        await queryRunner.dropForeignKey('forums', fk);
      }
      await queryRunner.dropTable('forums');
    }
  }
}
