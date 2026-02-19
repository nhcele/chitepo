import { getStoredToken } from '../auth';

const API_BASE = '/api';

export interface RoleLearningPath {
  user: {
    id: string;
    name: string;
    jobRole: string;
    roleCategory: string;
    roleLevel: string;
    department: string;
  };
  learningPath: {
    requiredCourses: any[];
    recommendedCourses: any[];
    electives: any[];
    progress: number;
    nextRecommendedCourse: any;
    complianceDeadlines: any[];
    timeToComplete: number;
  };
}

export interface ComplianceStatus {
  userId: string;
  jobRole: string;
  complianceScore: number;
  status: 'compliant' | 'in_progress' | 'non_compliant';
  complianceItems: {
    courseId: string;
    courseTitle: string;
    dueDate: Date;
    isOverdue: boolean;
    isCompleted: boolean;
    daysUntilDue: number;
    isRecurring: boolean;
  }[];
  summary: {
    total: number;
    completed: number;
    overdue: number;
    pending: number;
  };
}

export async function getRoleLearningPath(userId?: string): Promise<RoleLearningPath> {
  const url = userId ? `${API_BASE}/role-learning/users/${userId}/path` : `${API_BASE}/role-learning/my-path`;
  const token = getStoredToken();
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch role learning path: ${response.statusText}`);
  }

  return response.json();
}

export async function getComplianceStatus(userId?: string): Promise<ComplianceStatus> {
  const url = userId ? `${API_BASE}/role-learning/users/${userId}/compliance` : `${API_BASE}/role-learning/my-compliance`;
  const token = getStoredToken();
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compliance status: ${response.statusText}`);
  }

  return response.json();
}

export async function autoAssignRoleBasedCourses(userId: string): Promise<any> {
  const token = getStoredToken();
  
  const response = await fetch(`${API_BASE}/role-learning/auto-assign/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to auto-assign courses: ${response.statusText}`);
  }

  return response.json();
}

export async function getRoleComplianceAnalytics(query?: any): Promise<any> {
  const queryString = query ? new URLSearchParams(query).toString() : '';
  const url = `${API_BASE}/role-learning/analytics/role-compliance${queryString ? `?${queryString}` : ''}`;
  const token = getStoredToken();
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch role compliance analytics: ${response.statusText}`);
  }

  return response.json();
}

