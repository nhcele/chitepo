import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroupsController } from './user-groups.controller';
import { UserGroupsService } from './user-groups.service';
import { UserGroup } from './entities/user-group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupDiscussion, DiscussionReply } from './entities/group-discussion.entity';
import { User } from '../users/entities/user.entity';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserGroup,
      GroupMember,
      GroupDiscussion,
      DiscussionReply,
      User,
    ]),
    AnalyticsModule,
  ],
  controllers: [UserGroupsController],
  providers: [UserGroupsService],
  exports: [UserGroupsService],
})
export class UserGroupsModule {}


