import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateUserGroups1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if user_groups table already exists
    const userGroupsTable = await queryRunner.getTable('user_groups');
    if (userGroupsTable) {
      console.log('⚠️  user_groups table already exists, skipping creation');
    }

    // Create user_groups table
    await queryRunner.createTable(
      new Table({
        name: 'user_groups',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'study_group',
              'discussion_group',
              'party_cell',
              'branch',
              'learning_circle',
              'ideology_group',
            ],
            default: "'study_group'",
          },
          {
            name: 'privacy',
            type: 'enum',
            enum: ['public', 'private', 'secret'],
            default: "'public'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'suspended', 'archived'],
            default: "'active'",
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'member_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'max_members',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'allow_join_requests',
            type: 'boolean',
            default: true,
          },
          {
            name: 'require_approval',
            type: 'boolean',
            default: false,
          },
          {
            name: 'meeting_schedule',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'focus_areas',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'settings',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'parent_group_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'creator_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Check if group_members table already exists
    const groupMembersTable = await queryRunner.getTable('group_members');
    if (!groupMembersTable) {
      // Create group_members table
      await queryRunner.createTable(
      new Table({
        name: 'group_members',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'group_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['leader', 'moderator', 'member'],
            default: "'member'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'pending', 'inactive', 'removed', 'banned'],
            default: "'active'",
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_active_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'contributions',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'join_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'approved_by_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
    }

    // Check if group_discussions table already exists
    const groupDiscussionsTable = await queryRunner.getTable('group_discussions');
    if (!groupDiscussionsTable) {
      // Create group_discussions table
      await queryRunner.createTable(
      new Table({
        name: 'group_discussions',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'group_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'author_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'closed', 'pinned', 'archived'],
            default: "'active'",
          },
          {
            name: 'tags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'view_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'reply_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'like_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_pinned',
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
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
    }

    // Check if discussion_replies table already exists
    const discussionRepliesTable = await queryRunner.getTable('discussion_replies');
    if (!discussionRepliesTable) {
      // Create discussion_replies table
      await queryRunner.createTable(
      new Table({
        name: 'discussion_replies',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'discussion_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'author_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'parent_reply_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'like_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
    }

    // Add foreign keys (check if they exist first)
    const userGroupsTableFK = await queryRunner.getTable('user_groups');
    if (userGroupsTableFK) {
      const fkCreator = userGroupsTableFK.foreignKeys.find(fk => fk.columnNames.includes('creator_id'));
      if (!fkCreator) {
        await queryRunner.createForeignKey(
          'user_groups',
          new TableForeignKey({
            columnNames: ['creator_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      const fkParent = userGroupsTableFK.foreignKeys.find(fk => fk.columnNames.includes('parent_group_id'));
      if (!fkParent) {
        await queryRunner.createForeignKey(
          'user_groups',
          new TableForeignKey({
            columnNames: ['parent_group_id'],
            referencedTableName: 'user_groups',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    const groupMembersTableFK = await queryRunner.getTable('group_members');
    if (groupMembersTableFK) {
      const fkGroup = groupMembersTableFK.foreignKeys.find(fk => fk.columnNames.includes('group_id'));
      if (!fkGroup) {
        await queryRunner.createForeignKey(
          'group_members',
          new TableForeignKey({
            columnNames: ['group_id'],
            referencedTableName: 'user_groups',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      const fkUser = groupMembersTableFK.foreignKeys.find(fk => fk.columnNames.includes('user_id'));
      if (!fkUser) {
        await queryRunner.createForeignKey(
          'group_members',
          new TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      const fkApproved = groupMembersTableFK.foreignKeys.find(fk => fk.columnNames.includes('approved_by_id'));
      if (!fkApproved) {
        await queryRunner.createForeignKey(
          'group_members',
          new TableForeignKey({
            columnNames: ['approved_by_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    const groupDiscussionsTableFK = await queryRunner.getTable('group_discussions');
    if (groupDiscussionsTableFK) {
      const fkGroup = groupDiscussionsTableFK.foreignKeys.find(fk => fk.columnNames.includes('group_id'));
      if (!fkGroup) {
        await queryRunner.createForeignKey(
          'group_discussions',
          new TableForeignKey({
            columnNames: ['group_id'],
            referencedTableName: 'user_groups',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      const fkAuthor = groupDiscussionsTableFK.foreignKeys.find(fk => fk.columnNames.includes('author_id'));
      if (!fkAuthor) {
        await queryRunner.createForeignKey(
          'group_discussions',
          new TableForeignKey({
            columnNames: ['author_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    const discussionRepliesTableFK = await queryRunner.getTable('discussion_replies');
    if (discussionRepliesTableFK) {
      const fkDiscussion = discussionRepliesTableFK.foreignKeys.find(fk => fk.columnNames.includes('discussion_id'));
      if (!fkDiscussion) {
        await queryRunner.createForeignKey(
          'discussion_replies',
          new TableForeignKey({
            columnNames: ['discussion_id'],
            referencedTableName: 'group_discussions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      const fkAuthorReply = discussionRepliesTableFK.foreignKeys.find(fk => fk.columnNames.includes('author_id'));
      if (!fkAuthorReply) {
        await queryRunner.createForeignKey(
          'discussion_replies',
          new TableForeignKey({
            columnNames: ['author_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }

      const fkParent = discussionRepliesTableFK.foreignKeys.find(fk => fk.columnNames.includes('parent_reply_id'));
      if (!fkParent) {
        await queryRunner.createForeignKey(
          'discussion_replies',
          new TableForeignKey({
            columnNames: ['parent_reply_id'],
            referencedTableName: 'discussion_replies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }

    // Create indexes (check if they exist first)
    const groupMembersTableIdx = await queryRunner.getTable('group_members');
    if (groupMembersTableIdx) {
      const uniqueIndex = groupMembersTableIdx.indices.find(idx => idx.name === 'IDX_GROUP_MEMBER_UNIQUE');
      if (!uniqueIndex) {
        await queryRunner.createIndex(
          'group_members',
          new TableIndex({
            name: 'IDX_GROUP_MEMBER_UNIQUE',
            columnNames: ['group_id', 'user_id'],
            isUnique: true,
          }),
        );
      }

      const statusIndex = groupMembersTableIdx.indices.find(idx => idx.name === 'IDX_GROUP_MEMBERS_STATUS');
      if (!statusIndex) {
        await queryRunner.createIndex(
          'group_members',
          new TableIndex({
            name: 'IDX_GROUP_MEMBERS_STATUS',
            columnNames: ['status'],
          }),
        );
      }
    }

    const userGroupsTableIdx = await queryRunner.getTable('user_groups');
    if (userGroupsTableIdx) {
      const typeIndex = userGroupsTableIdx.indices.find(idx => idx.name === 'IDX_USER_GROUPS_TYPE');
      if (!typeIndex) {
        await queryRunner.createIndex(
          'user_groups',
          new TableIndex({
            name: 'IDX_USER_GROUPS_TYPE',
            columnNames: ['type'],
          }),
        );
      }

      const privacyIndex = userGroupsTableIdx.indices.find(idx => idx.name === 'IDX_USER_GROUPS_PRIVACY');
      if (!privacyIndex) {
        await queryRunner.createIndex(
          'user_groups',
          new TableIndex({
            name: 'IDX_USER_GROUPS_PRIVACY',
            columnNames: ['privacy'],
          }),
        );
      }

      const statusIndexUG = userGroupsTableIdx.indices.find(idx => idx.name === 'IDX_USER_GROUPS_STATUS');
      if (!statusIndexUG) {
        await queryRunner.createIndex(
          'user_groups',
          new TableIndex({
            name: 'IDX_USER_GROUPS_STATUS',
            columnNames: ['status'],
          }),
        );
      }
    }

    const groupDiscussionsTableIdx = await queryRunner.getTable('group_discussions');
    if (groupDiscussionsTableIdx) {
      const groupIdIndex = groupDiscussionsTableIdx.indices.find(idx => idx.name === 'IDX_GROUP_DISCUSSIONS_GROUP_ID');
      if (!groupIdIndex) {
        await queryRunner.createIndex(
          'group_discussions',
          new TableIndex({
            name: 'IDX_GROUP_DISCUSSIONS_GROUP_ID',
            columnNames: ['group_id'],
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('discussion_replies');
    await queryRunner.dropTable('group_discussions');
    await queryRunner.dropTable('group_members');
    await queryRunner.dropTable('user_groups');
  }
}


