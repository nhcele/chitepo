import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DiasporaImpactService } from './diaspora-impact.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('diaspora/impact')
export class DiasporaImpactController {
  constructor(private readonly impactService: DiasporaImpactService) {}

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Param('userId') userId: string) {
    return this.impactService.getDiasporaUserProfile(userId);
  }

  @Get('region/:region')
  async getRegionalMetrics(@Param('region') region: string) {
    return this.impactService.getRegionalImpactMetrics(region);
  }

  @Get('regions')
  async getAllRegionalMetrics() {
    return this.impactService.getAllRegionalImpactMetrics();
  }

  @Post('investment')
  @UseGuards(JwtAuthGuard)
  async trackInvestment(@Req() req: any, @Body() body: any) {
    await this.impactService.trackInvestment(req.user.id, body.amount, body.projectDescription);
    return { success: true };
  }

  @Post('project')
  @UseGuards(JwtAuthGuard)
  async trackProject(@Req() req: any, @Body() body: any) {
    await this.impactService.trackProject(req.user.id, body.projectName, body.projectType);
    return { success: true };
  }

  @Post('voter-registration')
  @UseGuards(JwtAuthGuard)
  async trackVoterRegistration(@Req() req: any, @Body() body: any) {
    await this.impactService.trackVoterRegistration(req.user.id, body.count);
    return { success: true };
  }
}

