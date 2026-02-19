import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { RoleManagementService } from './role-management.service';
import { RoleManagementController } from './role-management.controller';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, RoleManagementController],
  providers: [UsersService, RoleManagementService],
  exports: [UsersService, RoleManagementService, TypeOrmModule],
})
export class UsersModule {}

