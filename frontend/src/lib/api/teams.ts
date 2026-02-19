import { apiClient } from './client';

export interface CreateTeamDto {
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logo?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  settings?: {
    allowSelfEnrollment?: boolean;
    requireApproval?: boolean;
    defaultLearningPath?: string;
    customBranding?: boolean;
    reportingFrequency?: 'weekly' | 'monthly' | 'quarterly';
  };
  billingEmail?: string;
  contactPhone?: string;
}

export interface UpdateTeamDto extends Partial<CreateTeamDto> {}

export interface InviteMemberDto {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
}

export interface BulkInviteMembersDto {
  emails: string[];
  role: 'admin' | 'member' | 'viewer';
  message?: string;
}

export interface PurchaseLicenseDto {
  type: 'individual' | 'team' | 'enterprise';
  quantity: number;
  duration: 'monthly' | 'yearly';
  courses?: string[];
}

export interface BulkPurchaseLicensesDto {
  licenses: PurchaseLicenseDto[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logo?: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    allowSelfEnrollment: boolean;
    requireApproval: boolean;
    defaultLearningPath?: string;
    customBranding: boolean;
    reportingFrequency: 'weekly' | 'monthly' | 'quarterly';
  };
  billingEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  memberCount: number;
  licenseCount: number;
  activeLicenseCount: number;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  lastActiveAt?: string;
  completedCourses: number;
  inProgressCourses: number;
  totalLearningHours: number;
}

export interface TeamLicense {
  id: string;
  teamId: string;
  type: 'individual' | 'team' | 'enterprise';
  quantity: number;
  used: number;
  available: number;
  duration: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
  courses?: string[];
  createdAt: string;
  expiresAt: string;
  cost: number;
  currency: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  message?: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
}

export interface TeamAnalytics {
  overview: {
    totalMembers: number;
    activeMembers: number;
    totalLicenses: number;
    activeLicenses: number;
    completionRate: number;
    averageScore: number;
    totalLearningHours: number;
    averageHoursPerMember: number;
  };
  learning: {
    coursesCompleted: number;
    coursesInProgress: number;
    averageCompletionTime: number;
    popularCourses: Array<{
      courseId: string;
      title: string;
      enrollments: number;
      completions: number;
    }>;
    skillProgress: Array<{
      skill: string;
      averageLevel: number;
      membersCount: number;
    }>;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    courseStartRate: number;
    courseCompletionRate: number;
  };
  members: TeamMember[];
  licenses: TeamLicense[];
}

// Team Management API
export const teamsApi = {
  // Create team
  createTeam: async (data: CreateTeamDto): Promise<Team> => {
    const response = await apiClient.post<Team>('/teams', data);
    return response;
  },

  // Get user teams
  getUserTeams: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>('/teams');
    return response;
  },

  // Get team by ID
  getTeam: async (teamId: string): Promise<Team> => {
    const response = await apiClient.get<Team>(`/teams/${teamId}`);
    return response;
  },

  // Update team
  updateTeam: async (teamId: string, data: Partial<CreateTeamDto>): Promise<Team> => {
    const response = await apiClient.put<Team>(`/teams/${teamId}`, data);
    return response;
  },

  // Delete team
  deleteTeam: async (teamId: string): Promise<void> => {
    await apiClient.delete<void>(`/teams/${teamId}`);
  },

  // Team Member Management
  // Invite member
  inviteMember: async (teamId: string, data: InviteMemberDto): Promise<TeamInvitation> => {
    const response = await apiClient.post<TeamInvitation>(`/teams/${teamId}/members/invite`, data);
    return response;
  },

  // Bulk invite members
  bulkInviteMembers: async (teamId: string, data: BulkInviteMembersDto): Promise<TeamInvitation[]> => {
    const response = await apiClient.post<TeamInvitation[]>(`/teams/${teamId}/members/invite-bulk`, data);
    return response;
  },

  // Accept invitation
  acceptInvitation: async (token: string): Promise<TeamMember> => {
    const response = await apiClient.post<TeamMember>(`/teams/invitations/${token}/accept`);
    return response;
  },

  // Get team members
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
    return response;
  },

  // Remove member
  removeMember: async (teamId: string, memberId: string): Promise<void> => {
    await apiClient.delete<void>(`/teams/${teamId}/members/${memberId}`);
  },

  // Update member role
  updateMemberRole: async (teamId: string, memberId: string, role: string): Promise<TeamMember> => {
    const response = await apiClient.put<TeamMember>(`/teams/${teamId}/members/${memberId}/role`, { role });
    return response;
  },

  // License Management
  // Purchase license
  purchaseLicense: async (teamId: string, data: PurchaseLicenseDto): Promise<TeamLicense> => {
    const response = await apiClient.post<TeamLicense>(`/teams/${teamId}/licenses`, data);
    return response;
  },

  // Bulk purchase licenses
  bulkPurchaseLicenses: async (teamId: string, data: BulkPurchaseLicensesDto): Promise<TeamLicense[]> => {
    const response = await apiClient.post<TeamLicense[]>(`/teams/${teamId}/licenses/bulk`, data);
    return response;
  },

  // Get team licenses
  getTeamLicenses: async (teamId: string): Promise<TeamLicense[]> => {
    const response = await apiClient.get<TeamLicense[]>(`/teams/${teamId}/licenses`);
    return response;
  },

  // Assign license to member
  assignLicense: async (teamId: string, licenseId: string, memberId: string): Promise<void> => {
    await apiClient.post<void>(`/teams/${teamId}/licenses/${licenseId}/assign/${memberId}`);
  },

  // Analytics
  // Get team analytics
  getTeamAnalytics: async (teamId: string, dateRange?: { from: string; to: string }): Promise<TeamAnalytics> => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);
    
    const response = await apiClient.get<TeamAnalytics>(`/teams/${teamId}/analytics?${params}`);
    return response;
  },

  // Get team analytics summary
  getTeamAnalyticsSummary: async (teamId: string): Promise<Pick<TeamAnalytics, 'overview' | 'learning'>> => {
    const response = await apiClient.get<Pick<TeamAnalytics, 'overview' | 'learning'>>(`/teams/${teamId}/analytics/summary`);
    return response;
  },

  // Get team member analytics
  getTeamMemberAnalytics: async (teamId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get<TeamMember[]>(`/teams/${teamId}/analytics/members`);
    return response;
  },

  // Get team license analytics
  getTeamLicenseAnalytics: async (teamId: string): Promise<TeamLicense[]> => {
    const response = await apiClient.get<TeamLicense[]>(`/teams/${teamId}/analytics/licenses`);
    return response;
  },
};

// Admin Team Management API
export const adminTeamsApi = {
  // Get all teams (admin)
  getAllTeams: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ teams: Team[]; total: number; page: number; limit: number }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    
    const response = await apiClient.get<{ teams: Team[]; total: number; page: number; limit: number }>(`/admin/teams?${searchParams}`);
    return response;
  },

  // Get global team analytics
  getGlobalTeamAnalytics: async (): Promise<{
    overview: {
      totalTeams: number;
      activeTeams: number;
      totalMembers: number;
      totalLicenses: number;
      totalRevenue: number;
    };
    teams: Team[];
  }> => {
    const response = await apiClient.get<{
      overview: {
        totalTeams: number;
        activeTeams: number;
        totalMembers: number;
        totalLicenses: number;
        totalRevenue: number;
      };
      teams: Team[];
    }>('/admin/teams/analytics');
    return response;
  },

  // Update team status (admin)
  updateTeamStatus: async (teamId: string, status: 'active' | 'inactive' | 'suspended'): Promise<Team> => {
    const response = await apiClient.patch<Team>(`/admin/teams/${teamId}/status`, { status });
    return response;
  },

  // Suspend team (admin)
  suspendTeam: async (teamId: string, reason?: string): Promise<void> => {
    await apiClient.post<void>(`/admin/teams/${teamId}/suspend`, { reason });
  },

  // Get team audit logs (admin)
  getTeamAuditLogs: async (teamId: string, params?: {
    page?: number;
    limit?: number;
    action?: string;
  }): Promise<{
    logs: Array<{
      id: string;
      teamId: string;
      userId: string;
      action: string;
      details: any;
    }>;
    total: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.action) searchParams.append('action', params.action);
    
    const response = await apiClient.get<{
      logs: Array<{
        id: string;
        teamId: string;
        userId: string;
        action: string;
        details: any;
      }>;
      total: number;
    }>(`/admin/teams/${teamId}/audit-logs?${searchParams}`);
    return response;
  },
};

export default teamsApi;
