import { apiClient } from './client';

export interface RoleOverview {
  roleName: string;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentAssignments: number;
  complianceRate?: number;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  previousRole: string;
  newRole: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  reason?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobRole?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoleAssignmentResult {
  userId: string;
  userName: string;
  previousRole: string;
  newRole: string;
  success: boolean;
}

export interface BulkRoleAssignmentResult {
  success: number;
  errors: Array<{ userId: string; error: string }>;
  totalProcessed: number;
}

export interface CsvProcessingResult {
  csvLinesProcessed: number;
  validAssignments: number;
  bulkResult: BulkRoleAssignmentResult;
  csvErrors: Array<{ line: number; email?: string; error: string }>;
}

export interface RoleStats {
  totalUsers: number;
  usersWithRoles: number;
  usersWithoutRoles: number;
  roleAssignmentRate: string;
  recentAssignments: number;
  totalRoles: number;
  activeRoles: number;
  roleDistribution: RoleOverview[];
}

export interface ExportResult {
  filename: string;
  content?: string;
  data?: any[];
  mimeType: string;
}

export const roleManagementApi = {
  // Get role overview
  getRoleOverview: async (): Promise<RoleOverview[]> => {
    return apiClient.get<RoleOverview[]>('/role-management/overview');
  },

  // Get users by role
  getUsersByRole: async (
    roleName: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<User>> => {
    const params = { page: page.toString(), limit: limit.toString() };
    return apiClient.get<PaginatedResponse<User>>(`/role-management/roles/${roleName}/users`, { params });
  },

  // Bulk role assignment
  assignRolesBulk: async (
    assignments: Array<{ userId: string; jobRole: string }>,
    notifyUsers: boolean = false,
  ): Promise<BulkRoleAssignmentResult> => {
    return apiClient.post<BulkRoleAssignmentResult>('/role-management/assign-bulk', {
      userRoleAssignments: assignments,
      notifyUsers,
    });
  },

  // Upload CSV for role assignment
  uploadRoleAssignmentCsv: async (
    csvData: string,
    notifyUsers: boolean = false,
  ): Promise<CsvProcessingResult> => {
    return apiClient.post<CsvProcessingResult>('/role-management/upload-csv', {
      csvData,
      notifyUsers,
    });
  },

  // Update single user role
  updateUserRole: async (
    userId: string,
    jobRole: string,
    notifyUser: boolean = false,
  ): Promise<{
    userId: string;
    userName: string;
    previousRole: string;
    newRole: string;
    assignedAt: string;
  }> => {
    return apiClient.put(`/role-management/users/${userId}/role`, {
      jobRole,
      notifyUser,
    });
  },

  // Search users
  searchUsers: async (
    query: string,
    role?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<User> & { query: string; role?: string }> => {
    const params: any = { q: query, page: page.toString(), limit: limit.toString() };
    if (role) params.role = role;
    return apiClient.get<PaginatedResponse<User> & { query: string; role?: string }>('/role-management/users/search', { params });
  },

  // Get role assignment history
  getRoleAssignmentHistory: async (
    userId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<RoleAssignment>> => {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (userId) params.userId = userId;
    return apiClient.get<PaginatedResponse<RoleAssignment>>('/role-management/assignments/history', { params });
  },

  // Get role statistics
  getRoleStats: async (): Promise<RoleStats> => {
    return apiClient.get<RoleStats>('/role-management/stats');
  },

  // Export role data
  exportRoleData: async (
    format: 'csv' | 'xlsx' = 'csv',
    role?: string,
    includeInactive: boolean = false,
  ): Promise<ExportResult> => {
    const body: any = { format, includeInactive };
    if (role) body.role = role;
    return apiClient.post<ExportResult>('/role-management/export', body);
  },

  // Download exported data
  downloadExport: async (exportResult: ExportResult): Promise<void> => {
    let content: string;
    let filename: string;

    if (exportResult.content) {
      // CSV format
      content = exportResult.content;
      filename = exportResult.filename;
    } else if (exportResult.data) {
      // Excel format - for now, convert to CSV as fallback
      const headers = Object.keys(exportResult.data[0] || {});
      const csvLines = [headers.join(',')];
      
      exportResult.data.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvLines.push(values.join(','));
      });
      
      content = csvLines.join('\n');
      filename = exportResult.filename.replace('.xlsx', '.csv');
    } else {
      throw new Error('No content available for download');
    }

    // Create blob and download
    const blob = new Blob([content], { type: exportResult.mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
