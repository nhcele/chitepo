import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { JobRole } from '@mindelta/shared';

export interface RoleOverview {
  roleName: string;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentAssignments: number;
  complianceRate?: number;
}

interface RoleAssignment {
  id: string;
  userId: string;
  previousRole: string;
  newRole: string;
  assignedBy: string;
  assignedAt: Date;
  reason?: string;
}

@Injectable()
export class RoleManagementService {
  // In-memory storage for role assignments (for demo purposes)
  private roleAssignments: RoleAssignment[] = [];
  private assignmentIdCounter = 1;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get overview of all roles with user counts
   */
  async getRoleOverview(): Promise<RoleOverview[]> {
    const allUsers = await this.userRepository.find({
      where: { isActive: true },
    });

    const roleCounts = new Map<string, { total: number; active: number; recent: number }>();

    // Initialize all job roles with zero counts
    const allRoles = [
      'Teller', 'Customer Service Rep', 'Personal Banker', 'Operations Clerk',
      'Compliance Officer', 'Risk Analyst', 'Credit Analyst', 'IT Support',
      'Systems Administrator', 'Cybersecurity Analyst', 'Branch Manager',
      'Operations Manager', 'Compliance Manager', 'Risk Manager',
      'CEO', 'CFO', 'CTO', 'CCO', 'CRO'
    ];

    allRoles.forEach(role => {
      roleCounts.set(role, { total: 0, active: 0, recent: 0 });
    });

    // Count users by role
    allUsers.forEach(user => {
      if (user.jobRole) {
        const current = roleCounts.get(user.jobRole) || { total: 0, active: 0, recent: 0 };
        current.total++;
        if (user.isActive) {
          current.active++;
        }
        // Count recent assignments (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const userRecentAssignments = this.roleAssignments.filter(
          assignment => assignment.userId === user.id && assignment.assignedAt >= thirtyDaysAgo
        );
        current.recent += userRecentAssignments.length;
        roleCounts.set(user.jobRole, current);
      }
    });

    // Convert to array format
    return Array.from(roleCounts.entries()).map(([roleName, counts]) => ({
      roleName,
      totalUsers: counts.total,
      activeUsers: counts.active,
      inactiveUsers: counts.total - counts.active,
      recentAssignments: counts.recent,
      complianceRate: Math.floor(Math.random() * 30) + 70, // Mock compliance rate
    }));
  }

  /**
   * Get users by role with pagination
   */
  async getUsersByRole(roleName: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      where: { jobRole: roleName as JobRole },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Assign roles to multiple users
   */
  async assignRolesBulk(
    assignments: Array<{ userId: string; jobRole: string }>,
    assignedBy: string,
    notifyUsers: boolean = false,
  ) {
    const results = [];
    const errors = [];

    for (const assignment of assignments) {
      try {
        const user = await this.userRepository.findOne({ where: { id: assignment.userId } });
        if (!user) {
          errors.push({ userId: assignment.userId, error: 'User not found' });
          continue;
        }

        const previousRole = user.jobRole || 'Unassigned';
        
        // Update user role
        user.jobRole = assignment.jobRole as JobRole;
        await this.userRepository.save(user);

        // Record assignment
        const roleAssignment: RoleAssignment = {
          id: `assignment-${this.assignmentIdCounter++}`,
          userId: assignment.userId,
          previousRole,
          newRole: assignment.jobRole,
          assignedBy,
          assignedAt: new Date(),
        };
        this.roleAssignments.push(roleAssignment);

        results.push({
          userId: assignment.userId,
          userName: `${user.firstName} ${user.lastName}`,
          previousRole,
          newRole: assignment.jobRole,
          success: true,
        });

        // TODO: Send notification if notifyUsers is true
        if (notifyUsers) {
          console.log(`Notification sent to ${user.email} about role assignment`);
        }
      } catch (error) {
        errors.push({
          userId: assignment.userId,
          error: error.message,
        });
      }
    }

    return {
      success: results.length,
      errors,
      totalProcessed: assignments.length,
    };
  }

  /**
   * Process CSV role assignment
   */
  async processRoleAssignmentCsv(
    csvData: string,
    assignedBy: string,
    notifyUsers: boolean = false,
  ) {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new HttpException('CSV must contain header and at least one row', HttpStatus.BAD_REQUEST);
    }

    const header = lines[0].toLowerCase();
    const emailIndex = header.includes('email') ? header.split(',').findIndex(h => h.includes('email')) : -1;
    const roleIndex = header.includes('role') ? header.split(',').findIndex(h => h.includes('role')) : -1;

    if (emailIndex === -1 || roleIndex === -1) {
      throw new HttpException('CSV must contain email and role columns', HttpStatus.BAD_REQUEST);
    }

    const assignments = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length < Math.max(emailIndex, roleIndex) + 1) {
        errors.push({ line: i + 1, error: 'Invalid CSV format' });
        continue;
      }

      const email = values[emailIndex];
      const jobRole = values[roleIndex];

      try {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
          errors.push({ line: i + 1, email, error: 'User not found' });
          continue;
        }

        assignments.push({
          userId: user.id,
          jobRole,
        });
      } catch (error) {
        errors.push({ line: i + 1, email, error: error.message });
      }
    }

    // Process assignments
    const bulkResult = await this.assignRolesBulk(assignments, assignedBy, notifyUsers);

    return {
      csvLinesProcessed: lines.length - 1,
      validAssignments: assignments.length,
      bulkResult,
      csvErrors: errors,
    };
  }

  /**
   * Update single user role
   */
  async updateUserRole(
    userId: string,
    newRole: string,
    assignedBy: string,
    notifyUser: boolean = false,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const previousRole = user.jobRole || 'Unassigned';
    
    // Update user role
    user.jobRole = newRole as JobRole;
    await this.userRepository.save(user);

    // Record assignment
    const roleAssignment: RoleAssignment = {
      id: `assignment-${this.assignmentIdCounter++}`,
      userId,
      previousRole,
      newRole,
      assignedBy,
      assignedAt: new Date(),
    };
    this.roleAssignments.push(roleAssignment);

    // TODO: Send notification if notifyUser is true
    if (notifyUser) {
      console.log(`Notification sent to ${user.email} about role assignment`);
    }

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      previousRole,
      newRole,
      assignedAt: roleAssignment.assignedAt,
    };
  }

  /**
   * Search users with optional role filter
   */
  async searchUsers(
    query: string,
    role?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query)',
        { query: `%${query}%` }
      );

    if (role) {
      queryBuilder.andWhere('user.jobRole = :role', { role: role as JobRole });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query,
      role,
    };
  }

  /**
   * Get role assignment history
   */
  async getRoleAssignmentHistory(userId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    let assignments = this.roleAssignments;
    if (userId) {
      assignments = assignments.filter(a => a.userId === userId);
    }

    // Sort by date descending
    assignments.sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime());

    const paginatedAssignments = assignments.slice(skip, skip + limit);

    // Enrich with user details
    const enrichedAssignments = [];
    for (const assignment of paginatedAssignments) {
      const user = await this.userRepository.findOne({ where: { id: assignment.userId } });
      const assignedByUser = await this.userRepository.findOne({ where: { id: assignment.assignedBy } });
      
      enrichedAssignments.push({
        ...assignment,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        userEmail: user?.email,
        assignedByName: assignedByUser ? `${assignedByUser.firstName} ${assignedByUser.lastName}` : 'System',
      });
    }

    return {
      assignments: enrichedAssignments,
      total: assignments.length,
      page,
      limit,
      totalPages: Math.ceil(assignments.length / limit),
    };
  }

  /**
   * Get role statistics
   */
  async getRoleStats() {
    const totalUsers = await this.userRepository.count({ where: { isActive: true } });
    const usersWithRoles = await this.userRepository.count({ 
      where: { isActive: true, jobRole: Not(null) } 
    });
    const recentAssignments = this.roleAssignments.filter(
      assignment => assignment.assignedAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const roleDistribution = await this.getRoleOverview();

    return {
      totalUsers,
      usersWithRoles,
      usersWithoutRoles: totalUsers - usersWithRoles,
      roleAssignmentRate: totalUsers > 0 ? ((usersWithRoles / totalUsers) * 100).toFixed(2) : '0',
      recentAssignments,
      totalRoles: roleDistribution.length,
      activeRoles: roleDistribution.filter(r => r.totalUsers > 0).length,
      roleDistribution,
    };
  }

  /**
   * Export role data
   */
  async exportRoleData(format: 'csv' | 'xlsx', role?: string, includeInactive: boolean = false) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    if (!includeInactive) {
      queryBuilder.where('user.isActive = :isActive', { isActive: true });
    }
    
    if (role) {
      queryBuilder.andWhere('user.jobRole = :role', { role });
    }

    const users = await queryBuilder.orderBy('user.jobRole', 'ASC').getMany();

    if (format === 'csv') {
      const headers = ['First Name', 'Last Name', 'Email', 'Job Role', 'Department', 'Active', 'Created At'];
      const csvLines = [headers.join(',')];
      
      users.forEach(user => {
        const line = [
          user.firstName || '',
          user.lastName || '',
          user.email || '',
          user.jobRole || '',
          user.department || '',
          user.isActive ? 'Yes' : 'No',
          user.createdAt?.toISOString() || '',
        ];
        csvLines.push(line.join(','));
      });

      return {
        filename: `role-export-${new Date().toISOString().split('T')[0]}.csv`,
        content: csvLines.join('\n'),
        mimeType: 'text/csv',
      };
    }

    // For Excel format, return data that can be processed by a frontend library
    return {
      filename: `role-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      data: users.map(user => ({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobRole: user.jobRole,
        department: user.department,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
