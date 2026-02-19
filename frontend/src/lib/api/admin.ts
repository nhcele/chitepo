import { apiClient } from './client';
import { User, UserRole } from '@mindelta/shared';

export async function adminListUsers() {
  return apiClient.get<{ items: User[]; total: number }>(`/admin/users`);
}

export async function adminCreateUser(data: { email: string; name: string; role: UserRole; password?: string }) {
  return apiClient.post(`/admin/users`, data);
}

export async function adminChangeUserRole(id: string, role: UserRole) {
  return apiClient.post(`/admin/users/${id}/role`, { role });
}

export async function adminActivateUser(id: string) {
  return apiClient.post(`/admin/users/${id}/activate`, {});
}

export async function adminDeactivateUser(id: string) {
  return apiClient.post(`/admin/users/${id}/deactivate`, {});
}

export async function adminResetUserPassword(id: string, password: string) {
  return apiClient.post(`/admin/users/${id}/reset-password`, { password });
}

export async function adminDeleteUser(id: string) {
  return apiClient.delete(`/admin/users/${id}`);
}

export async function adminUpdateUser(id: string, data: any) {
  return apiClient.patch(`/admin/users/${id}`, data);
}

export async function adminBulkUserAction(userIds: string[], action: 'activate' | 'deactivate' | 'delete', role?: UserRole) {
  return apiClient.post(`/admin/users/bulk-action`, { userIds, action, role });
}

export async function adminGetApprovalQueue() {
  return apiClient.get<{ items: any[] }>(`/admin/approval-queue`);
}

export async function adminApproveCourse(id: string, comment?: string) {
  return apiClient.post(`/admin/approval-queue/${id}/approve`, { comment });
}

export async function adminRejectCourse(id: string, comment?: string) {
  return apiClient.post(`/admin/approval-queue/${id}/reject`, { comment });
}

export interface AdminMetrics {
  dau: number;
  mau: number;
  totalCourses: number;
  totalLearners: number;
  monthlyRevenue: number;
  series: { date: string; signups: number; completions: number }[];
}

export async function adminGetMetrics() {
  return apiClient.get<AdminMetrics>(`/admin/metrics`);
}

export interface InstructorApplicationDTO {
  id: string;
  fullName: string;
  email: string;
  bio?: string;
  sampleVideoUrl?: string;
  socials?: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerComment?: string;
  createdAt: string;
}

export async function adminListInstructorApplications(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient.get<{ items: InstructorApplicationDTO[]; total: number }>(`/admin/instructor-applications${qs}`);
}

export async function adminApproveInstructorApplication(id: string, comment?: string) {
  return apiClient.post(`/admin/instructor-applications/${id}/approve`, { comment });
}

export async function adminRejectInstructorApplication(id: string, comment?: string) {
  return apiClient.post(`/admin/instructor-applications/${id}/reject`, { comment });
}
