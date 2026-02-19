import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleManagementService, RoleOverview } from './role-management.service';
import { User } from './entities/user.entity';

@Controller('role-management')
@UseGuards(JwtAuthGuard)
export class RoleManagementController {
  constructor(private readonly roleManagementService: RoleManagementService) {}

  @Get('overview')
  async getRoleOverview(@Req() req: any) {
    // Only admin can access role overview
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.getRoleOverview();
  }

  @Get('roles/:roleName/users')
  async getUsersByRole(
    @Req() req: any,
    @Param('roleName') roleName: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Only admin can access role user lists
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.getUsersByRole(roleName, page, limit);
  }

  @Post('assign-bulk')
  async assignRolesBulk(@Req() req: any, @Body() body: {
    userRoleAssignments: Array<{
      userId: string;
      jobRole: string;
    }>;
    notifyUsers?: boolean;
  }) {
    // Only admin can assign roles
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.assignRolesBulk(
      body.userRoleAssignments,
      req.user.id,
      body.notifyUsers || false,
    );
  }

  @Post('upload-csv')
  async uploadRoleAssignmentCsv(@Req() req: any, @Body() body: {
    csvData: string; // CSV content as string
    notifyUsers?: boolean;
  }) {
    // Only admin can upload CSV
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.processRoleAssignmentCsv(
      body.csvData,
      req.user.id,
      body.notifyUsers || false,
    );
  }

  @Put('users/:userId/role')
  async updateUserRole(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() body: {
      jobRole: string;
      notifyUser?: boolean;
    },
  ) {
    // Only admin can update roles
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.updateUserRole(
      userId,
      body.jobRole,
      req.user.id,
      body.notifyUser || false,
    );
  }

  @Get('users/search')
  async searchUsers(
    @Req() req: any,
    @Query('q') query: string,
    @Query('role') role?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Only admin can search users
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.searchUsers(query, role, page, limit);
  }

  @Get('assignments/history')
  async getRoleAssignmentHistory(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Only admin can view assignment history
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.getRoleAssignmentHistory(userId, page, limit);
  }

  @Get('stats')
  async getRoleStats(@Req() req: any) {
    // Only admin can access role stats
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.getRoleStats();
  }

  @Post('export')
  async exportRoleData(@Req() req: any, @Body() body: {
    format: 'csv' | 'xlsx';
    role?: string;
    includeInactive?: boolean;
  }) {
    // Only admin can export role data
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
    return this.roleManagementService.exportRoleData(
      body.format,
      body.role,
      body.includeInactive || false,
    );
  }
}
