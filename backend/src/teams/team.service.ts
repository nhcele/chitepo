import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Team, TeamStatus, TeamSize } from './entities/team.entity';
import { TeamMember, TeamRole, MemberStatus } from './entities/team-member.entity';
import { TeamLicense, LicenseType, LicenseStatus } from './entities/team-license.entity';
import { TeamInvitation, InvitationStatus, InvitationRole } from './entities/team-invitation.entity';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteMemberDto, BulkInviteMembersDto } from './dto/invite-member.dto';
import { PurchaseLicenseDto, BulkPurchaseLicensesDto } from './dto/purchase-license.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamLicense)
    private teamLicenseRepository: Repository<TeamLicense>,
    @InjectRepository(TeamInvitation)
    private teamInvitationRepository: Repository<TeamInvitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  // Team Management
  async createTeam(createTeamDto: CreateTeamDto, ownerId: string): Promise<Team> {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    // Check if user already owns a team (optional business rule)
    const existingTeam = await this.teamMemberRepository.findOne({
      where: { userId: ownerId, role: TeamRole.OWNER },
      relations: ['team'],
    });

    if (existingTeam) {
      throw new ConflictException('User already owns a team');
    }

    const team = this.teamRepository.create({
      ...createTeamDto,
      ownerId,
      status: TeamStatus.ACTIVE,
      settings: {
        allowSelfEnrollment: true,
        requireApproval: false,
        defaultLearningPath: '',
        customBranding: false,
        reportingFrequency: 'monthly',
        ...createTeamDto.settings,
      },
    });

    const savedTeam = await this.teamRepository.save(team);

    // Add owner as team member
    const ownerMember = this.teamMemberRepository.create({
      teamId: savedTeam.id,
      userId: ownerId,
      role: TeamRole.OWNER,
      status: MemberStatus.ACTIVE,
      permissions: {
        canInviteMembers: true,
        canRemoveMembers: true,
        canViewReports: true,
        canManageLicenses: true,
        canManageCourses: true,
      },
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });

    await this.teamMemberRepository.save(ownerMember);

    // Update team member count
    await this.teamRepository.update(savedTeam.id, { memberCount: 1 });

    return savedTeam;
  }

  async getTeam(teamId: string, userId: string): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if user is a member of the team
    const isMember = await this.teamMemberRepository.findOne({
      where: { teamId, userId, status: MemberStatus.ACTIVE },
    });

    if (!isMember) {
      throw new ForbiddenException('Access denied to this team');
    }

    return team;
  }

  async updateTeam(teamId: string, updateTeamDto: UpdateTeamDto, userId: string): Promise<Team> {
    const team = await this.getTeam(teamId, userId);
    const member = await this.teamMemberRepository.findOne({
      where: { teamId, userId },
    });

    // Check if user has permission to update team
    if (member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to update team');
    }

    await this.teamRepository.update(teamId, updateTeamDto);
    return this.getTeam(teamId, userId);
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    const team = await this.getTeam(teamId, userId);
    const member = await this.teamMemberRepository.findOne({
      where: { teamId, userId },
    });

    if (member.role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only team owners can delete teams');
    }

    await this.teamRepository.softDelete(teamId);
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId, status: MemberStatus.ACTIVE },
      relations: ['team', 'team.owner'],
    });

    return memberships.map(membership => membership.team);
  }

  // Team Member Management
  async inviteMember(teamId: string, inviteMemberDto: InviteMemberDto, invitedById: string): Promise<TeamInvitation> {
    const team = await this.getTeam(teamId, invitedById);
    const inviter = await this.teamMemberRepository.findOne({
      where: { teamId, userId: invitedById },
    });

    // Check permissions
    if (!inviter.permissions.canInviteMembers) {
      throw new ForbiddenException('Insufficient permissions to invite members');
    }

    // Check if user is already a member
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteMemberDto.email },
    });

    if (existingUser) {
      const existingMember = await this.teamMemberRepository.findOne({
        where: { teamId, userId: existingUser.id },
      });

      if (existingMember && existingMember.status === MemberStatus.ACTIVE) {
        throw new ConflictException('User is already a team member');
      }
    }

    // Check if invitation already exists
    const existingInvitation = await this.teamInvitationRepository.findOne({
      where: { teamId, email: inviteMemberDto.email, status: InvitationStatus.PENDING },
    });

    if (existingInvitation) {
      throw new ConflictException('Invitation already sent to this email');
    }

    const invitation = this.teamInvitationRepository.create({
      ...inviteMemberDto,
      teamId,
      invitedById,
      inviteToken: this.generateInviteToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      permissions: {
        canInviteMembers: false,
        canRemoveMembers: false,
        canViewReports: true,
        canManageLicenses: false,
        ...inviteMemberDto.permissions,
      },
    });

    return this.teamInvitationRepository.save(invitation);
  }

  async bulkInviteMembers(teamId: string, bulkInviteDto: BulkInviteMembersDto, invitedById: string): Promise<TeamInvitation[]> {
    const invitations: TeamInvitation[] = [];

    for (const memberData of bulkInviteDto.members) {
      try {
        const invitation = await this.inviteMember(teamId, {
          ...memberData,
          role: memberData.role || bulkInviteDto.defaultRole,
          message: memberData.message || bulkInviteDto.defaultMessage,
        }, invitedById);
        invitations.push(invitation);
      } catch (error) {
        // Log error but continue with other invitations
        console.error(`Failed to invite ${memberData.email}:`, error.message);
      }
    }

    return invitations;
  }

  async acceptInvitation(inviteToken: string, userId: string): Promise<TeamMember> {
    const invitation = await this.teamInvitationRepository.findOne({
      where: { inviteToken, status: InvitationStatus.PENDING },
      relations: ['team'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user email matches invitation email
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('Invitation email does not match your email');
    }

    // Create team member
    const teamMember = this.teamMemberRepository.create({
      teamId: invitation.teamId,
      userId,
      role: invitation.role === InvitationRole.ADMIN ? TeamRole.ADMIN : 
            invitation.role === InvitationRole.MANAGER ? TeamRole.MANAGER : TeamRole.MEMBER,
      status: MemberStatus.ACTIVE,
      permissions: invitation.permissions,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    });

    await this.teamMemberRepository.save(teamMember);

    // Update invitation
    await this.teamInvitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      acceptedById: userId,
      acceptedAt: new Date(),
    });

    // Update team member count
    await this.teamRepository.increment({ id: invitation.teamId }, 'memberCount', 1);

    return teamMember;
  }

  async removeMember(teamId: string, memberUserId: string, removedById: string): Promise<void> {
    const team = await this.getTeam(teamId, removedById);
    const remover = await this.teamMemberRepository.findOne({
      where: { teamId, userId: removedById },
    });

    const memberToRemove = await this.teamMemberRepository.findOne({
      where: { teamId, userId: memberUserId },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    // Check permissions
    if (memberToRemove.role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot remove team owner');
    }

    if (remover.role !== TeamRole.OWNER && remover.role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    if (remover.role === TeamRole.ADMIN && memberToRemove.role === TeamRole.ADMIN) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.teamMemberRepository.update(memberToRemove.id, {
      status: MemberStatus.REMOVED,
    });

    await this.teamRepository.decrement({ id: teamId }, 'memberCount', 1);
  }

  async updateMemberRole(teamId: string, memberUserId: string, newRole: TeamRole, updatedById: string): Promise<TeamMember> {
    const team = await this.getTeam(teamId, updatedById);
    const updater = await this.teamMemberRepository.findOne({
      where: { teamId, userId: updatedById },
    });

    const memberToUpdate = await this.teamMemberRepository.findOne({
      where: { teamId, userId: memberUserId },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Member not found');
    }

    // Check permissions
    if (updater.role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only team owners can update member roles');
    }

    // Cannot change owner role
    if (memberToUpdate.role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    await this.teamMemberRepository.update(memberToUpdate.id, { role: newRole });
    return this.teamMemberRepository.findOne({ where: { id: memberToUpdate.id } });
  }

  async getTeamMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    await this.getTeam(teamId, userId); // Verify access

    return this.teamMemberRepository.find({
      where: { teamId, status: MemberStatus.ACTIVE },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  // License Management
  async purchaseLicense(teamId: string, purchaseLicenseDto: PurchaseLicenseDto, purchasedById: string): Promise<TeamLicense> {
    const team = await this.getTeam(teamId, purchasedById);
    const purchaser = await this.teamMemberRepository.findOne({
      where: { teamId, userId: purchasedById },
    });

    // Check permissions
    if (!purchaser.permissions.canManageLicenses) {
      throw new ForbiddenException('Insufficient permissions to purchase licenses');
    }

    // Validate course if specified
    if (purchaseLicenseDto.courseId) {
      const course = await this.courseRepository.findOne({
        where: { id: purchaseLicenseDto.courseId, published: true },
      });

      if (!course) {
        throw new NotFoundException('Course not found or not published');
      }
    }

    // Calculate pricing
    const unitPrice = await this.calculateLicensePrice(purchaseLicenseDto);
    const totalPrice = unitPrice * purchaseLicenseDto.quantity;

    const license = this.teamLicenseRepository.create({
      ...purchaseLicenseDto,
      teamId,
      unitPrice,
      totalPrice,
      status: LicenseStatus.ACTIVE,
      expiresAt: new Date(Date.now() + (purchaseLicenseDto.durationMonths || 12) * 30 * 24 * 60 * 60 * 1000),
      restrictions: {
        canReassign: true,
        maxReassignments: 3,
        requireManagerApproval: false,
        allowedDepartments: [],
        ...purchaseLicenseDto.restrictions,
      },
      metadata: {
        purchaseOrderId: '',
        invoiceId: '',
        paymentMethod: 'credit_card',
        discountApplied: 0,
        bulkDiscount: 0,
        ...purchaseLicenseDto.metadata,
      },
    });

    const savedLicense = await this.teamLicenseRepository.save(license);

    // Update team license count
    await this.teamRepository.increment({ id: teamId }, 'licenseCount', purchaseLicenseDto.quantity);
    await this.teamRepository.increment({ id: teamId }, 'totalSpent', totalPrice);

    return savedLicense;
  }

  async bulkPurchaseLicenses(teamId: string, bulkPurchaseDto: BulkPurchaseLicensesDto, purchasedById: string): Promise<TeamLicense[]> {
    const licenses: TeamLicense[] = [];

    for (const licenseData of bulkPurchaseDto.licenses) {
      try {
        const license = await this.purchaseLicense(teamId, {
          ...licenseData,
          metadata: {
            ...licenseData.metadata,
            purchaseOrderId: bulkPurchaseDto.purchaseOrder,
          },
        }, purchasedById);
        licenses.push(license);
      } catch (error) {
        console.error(`Failed to purchase license:`, error.message);
        throw error;
      }
    }

    return licenses;
  }

  async getTeamLicenses(teamId: string, userId: string): Promise<TeamLicense[]> {
    await this.getTeam(teamId, userId); // Verify access

    return this.teamLicenseRepository.find({
      where: { teamId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async assignLicense(teamId: string, licenseId: string, memberUserId: string, assignedById: string): Promise<void> {
    const team = await this.getTeam(teamId, assignedById);
    const assigner = await this.teamMemberRepository.findOne({
      where: { teamId, userId: assignedById },
    });

    const license = await this.teamLicenseRepository.findOne({
      where: { id: licenseId, teamId },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    if (!assigner.permissions.canManageLicenses) {
      throw new ForbiddenException('Insufficient permissions to assign licenses');
    }

    if (license.usedQuantity >= license.quantity) {
      throw new BadRequestException('No licenses available');
    }

    // Check if member already has this license
    const existingAssignment = await this.checkLicenseAssignment(licenseId, memberUserId);
    if (existingAssignment) {
      throw new ConflictException('Member already has this license');
    }

    // Create license assignment (this would typically be a separate entity)
    await this.createLicenseAssignment(licenseId, memberUserId);

    // Update license usage
    await this.teamLicenseRepository.increment({ id: licenseId }, 'usedQuantity', 1);
  }

  // Team Analytics
  async getTeamAnalytics(teamId: string, userId: string, dateRange?: { from: Date; to: Date }): Promise<any> {
    await this.getTeam(teamId, userId); // Verify access

    const members = await this.teamMemberRepository.find({
      where: { teamId, status: MemberStatus.ACTIVE },
      relations: ['user'],
    });

    const licenses = await this.teamLicenseRepository.find({
      where: { teamId },
    });

    // Calculate analytics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => 
      m.lastActiveAt && m.lastActiveAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const totalLicenses = licenses.reduce((sum, license) => sum + license.quantity, 0);
    const usedLicenses = licenses.reduce((sum, license) => sum + license.usedQuantity, 0);

    const totalSpent = licenses.reduce((sum, license) => sum + license.totalPrice, 0);

    // Learning progress analytics
    const coursesCompleted = members.reduce((sum, member) => 
      sum + (member.learningProgress?.coursesCompleted || 0), 0
    );

    const averageScore = members.reduce((sum, member) => 
      sum + (member.learningProgress?.averageScore || 0), 0
    ) / totalMembers;

    const totalLearningHours = members.reduce((sum, member) => 
      sum + (member.learningProgress?.learningHours || 0), 0
    );

    return {
      overview: {
        totalMembers,
        activeMembers,
        totalLicenses,
        usedLicenses,
        licenseUtilization: totalLicenses > 0 ? (usedLicenses / totalLicenses) * 100 : 0,
        totalSpent,
      },
      learning: {
        coursesCompleted,
        averageScore: averageScore || 0,
        totalLearningHours,
        averageHoursPerMember: totalLearningHours / totalMembers,
      },
      members: members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        joinedAt: member.joinedAt,
        lastActiveAt: member.lastActiveAt,
        progress: member.learningProgress,
      })),
      licenses: licenses.map(license => ({
        id: license.id,
        type: license.type,
        quantity: license.quantity,
        usedQuantity: license.usedQuantity,
        unitPrice: license.unitPrice,
        totalPrice: license.totalPrice,
        status: license.status,
        expiresAt: license.expiresAt,
        course: license.course,
      })),
    };
  }

  // Helper methods
  private generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async calculateLicensePrice(purchaseLicenseDto: PurchaseLicenseDto): Promise<number> {
    // This would typically integrate with a pricing service
    const basePrices = {
      [LicenseType.COURSE]: 99.99,
      [LicenseType.LEARNING_PATH]: 299.99,
      [LicenseType.SUBSCRIPTION]: 49.99,
    };

    let basePrice = basePrices[purchaseLicenseDto.type] || 99.99;
    
    // Apply bulk discount
    if (purchaseLicenseDto.quantity >= 10) {
      basePrice *= 0.9; // 10% discount
    }
    if (purchaseLicenseDto.quantity >= 50) {
      basePrice *= 0.8; // 20% discount
    }
    if (purchaseLicenseDto.quantity >= 100) {
      basePrice *= 0.7; // 30% discount
    }

    return basePrice;
  }

  private async checkLicenseAssignment(licenseId: string, userId: string): Promise<boolean> {
    // This would check a license_assignments table
    return false;
  }

  private async createLicenseAssignment(licenseId: string, userId: string): Promise<void> {
    // This would create an entry in a license_assignments table
  }
}
