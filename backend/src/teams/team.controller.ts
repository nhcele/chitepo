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
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteMemberDto, BulkInviteMembersDto } from './dto/invite-member.dto';
import { PurchaseLicenseDto, BulkPurchaseLicensesDto } from './dto/purchase-license.dto';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamLicense } from './entities/team-license.entity';
import { TeamInvitation } from './entities/team-invitation.entity';

@ApiTags('Teams')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  // Team Management
  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ status: 201, description: 'Team created successfully', type: Team })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already owns a team' })
  async createTeam(@Body() createTeamDto: CreateTeamDto, @Request() req: any): Promise<Team> {
    return this.teamService.createTeam(createTeamDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams for current user' })
  @ApiResponse({ status: 200, description: 'Teams retrieved successfully', type: [Team] })
  async getUserTeams(@Request() req: any): Promise<Team[]> {
    return this.teamService.getUserTeams(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team retrieved successfully', type: Team })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeam(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<Team> {
    return this.teamService.getTeam(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update team information' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team updated successfully', type: Team })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: any,
  ): Promise<Team> {
    return this.teamService.updateTeam(id, updateTeamDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 204, description: 'Team deleted successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Only team owners can delete teams' })
  async deleteTeam(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<void> {
    return this.teamService.deleteTeam(id, req.user.userId);
  }

  // Team Member Management
  @Post(':id/members/invite')
  @ApiOperation({ summary: 'Invite a member to the team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully', type: TeamInvitation })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Invitation already sent' })
  async inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @Request() req: any,
  ): Promise<TeamInvitation> {
    return this.teamService.inviteMember(id, inviteMemberDto, req.user.userId);
  }

  @Post(':id/members/invite-bulk')
  @ApiOperation({ summary: 'Invite multiple members to the team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 201, description: 'Invitations sent successfully', type: [TeamInvitation] })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkInviteMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() bulkInviteDto: BulkInviteMembersDto,
    @Request() req: any,
  ): Promise<TeamInvitation[]> {
    return this.teamService.bulkInviteMembers(id, bulkInviteDto, req.user.userId);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept a team invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 201, description: 'Invitation accepted successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Invalid or expired invitation' })
  @ApiResponse({ status: 400, description: 'Invitation expired' })
  @ApiResponse({ status: 403, description: 'Email mismatch' })
  async acceptInvitation(
    @Param('token') token: string,
    @Request() req: any,
  ): Promise<TeamMember> {
    return this.teamService.acceptInvitation(token, req.user.userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all team members' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team members retrieved successfully', type: [TeamMember] })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeamMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<TeamMember[]> {
    return this.teamService.getTeamMembers(id, req.user.userId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Team or member not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.teamService.removeMember(id, memberId, req.user.userId);
  }

  @Put(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
  @ApiResponse({ status: 200, description: 'Member role updated successfully', type: TeamMember })
  @ApiResponse({ status: 404, description: 'Team or member not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body('role') role: string,
    @Request() req: any,
  ): Promise<TeamMember> {
    return this.teamService.updateMemberRole(id, memberId, role as any, req.user.userId);
  }

  // License Management
  @Post(':id/licenses')
  @ApiOperation({ summary: 'Purchase licenses for the team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 201, description: 'Licenses purchased successfully', type: TeamLicense })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Invalid license data' })
  async purchaseLicense(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() purchaseLicenseDto: PurchaseLicenseDto,
    @Request() req: any,
  ): Promise<TeamLicense> {
    return this.teamService.purchaseLicense(id, purchaseLicenseDto, req.user.userId);
  }

  @Post(':id/licenses/bulk')
  @ApiOperation({ summary: 'Purchase multiple licenses for the team' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 201, description: 'Licenses purchased successfully', type: [TeamLicense] })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async bulkPurchaseLicenses(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() bulkPurchaseDto: BulkPurchaseLicensesDto,
    @Request() req: any,
  ): Promise<TeamLicense[]> {
    return this.teamService.bulkPurchaseLicenses(id, bulkPurchaseDto, req.user.userId);
  }

  @Get(':id/licenses')
  @ApiOperation({ summary: 'Get all team licenses' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team licenses retrieved successfully', type: [TeamLicense] })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeamLicenses(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<TeamLicense[]> {
    return this.teamService.getTeamLicenses(id, req.user.userId);
  }

  @Post(':id/licenses/:licenseId/assign/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Assign a license to a team member' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiParam({ name: 'licenseId', description: 'License ID' })
  @ApiParam({ name: 'memberId', description: 'Member user ID' })
  @ApiResponse({ status: 204, description: 'License assigned successfully' })
  @ApiResponse({ status: 404, description: 'Team, license, or member not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'No licenses available' })
  async assignLicense(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('licenseId', ParseUUIDPipe) licenseId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.teamService.assignLicense(id, licenseId, memberId, req.user.userId);
  }

  // Team Analytics
  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get team analytics and reporting' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO string)' })
  @ApiResponse({ status: 200, description: 'Team analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeamAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any> {
    const dateRange = from && to ? {
      from: new Date(from),
      to: new Date(to),
    } : undefined;

    return this.teamService.getTeamAnalytics(id, req.user.userId, dateRange);
  }

  @Get(':id/analytics/summary')
  @ApiOperation({ summary: 'Get team analytics summary' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team analytics summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeamAnalyticsSummary(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<any> {
    const analytics = await this.teamService.getTeamAnalytics(id, req.user.userId);
    
    return {
      overview: analytics.overview,
      learning: analytics.learning,
    };
  }

  @Get(':id/analytics/members')
  @ApiOperation({ summary: 'Get team member analytics' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team member analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeamMemberAnalytics(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<any> {
    const analytics = await this.teamService.getTeamAnalytics(id, req.user.userId);
    
    return analytics.members;
  }

  @Get(':id/analytics/licenses')
  @ApiOperation({ summary: 'Get team license analytics' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team license analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTeamLicenseAnalytics(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<any> {
    const analytics = await this.teamService.getTeamAnalytics(id, req.user.userId);
    
    return analytics.licenses;
  }
}
