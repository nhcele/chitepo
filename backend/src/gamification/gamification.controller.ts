import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('summary/:userId')
  @UseGuards(JwtAuthGuard)
  async getSummary(@Param('userId') userId: string) {
    return this.gamificationService.getUserSummary(userId);
  }

  @Post('recompute/:userId')
  @UseGuards(JwtAuthGuard)
  async recompute(@Param('userId') userId: string) {
    return this.gamificationService.recompute(userId);
  }

  @Post('aggregate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async aggregateAll() {
    return this.gamificationService.aggregateAllUsers();
  }

  @Post('award')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async award(@Body() body: { userId: string; deltaPoints: number; badgeCodes?: string[] }) {
    return this.gamificationService.award(body.userId, body.deltaPoints, body.badgeCodes || []);
  }
}
