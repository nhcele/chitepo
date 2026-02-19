import { apiClient } from './client';

export interface Message {
  id: string;
  courseId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'instructor_to_student' | 'student_to_instructor' | 'system';
  status: 'sent' | 'delivered' | 'read';
  readAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface CreateMessageDto {
  courseId: string;
  recipientId: string;
  content: string;
  type?: 'instructor_to_student' | 'student_to_instructor' | 'system';
}

export interface ConversationSummary {
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export const messagingApi = {
  sendMessage: async (dto: CreateMessageDto): Promise<Message> => {
    return apiClient.post<Message>('/messaging/send', dto);
  },

  getConversation: async (courseId: string, otherUserId: string): Promise<Message[]> => {
    return apiClient.get<Message[]>(`/messaging/conversation/${courseId}/${otherUserId}`);
  },

  getInbox: async (courseId?: string): Promise<Message[]> => {
    const params = courseId ? { courseId } : undefined;
    return apiClient.get<Message[]>('/messaging/inbox', { params });
  },

  getSentMessages: async (courseId?: string): Promise<Message[]> => {
    const params = courseId ? { courseId } : undefined;
    return apiClient.get<Message[]>('/messaging/sent', { params });
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/messaging/unread-count');
    return response.count;
  },

  markAsRead: async (messageId: string): Promise<Message> => {
    return apiClient.patch<Message>(`/messaging/${messageId}/read`);
  },

  archiveMessage: async (messageId: string): Promise<Message> => {
    return apiClient.patch<Message>(`/messaging/${messageId}/archive`);
  },

  getCourseConversations: async (courseId: string): Promise<ConversationSummary[]> => {
    return apiClient.get<ConversationSummary[]>(`/messaging/course/${courseId}/conversations`);
  },

  // Compliance reminder methods (admin only)
  sendComplianceReminder: async (data: {
    recipientIds: string[];
    courseName: string;
    daysUntilDue: number;
    isOverdue?: boolean;
  }): Promise<Message[]> => {
    return apiClient.post<Message[]>('/messaging/compliance-reminder', data);
  },

  sendBulkReminders: async (data: {
    overdueUsers: Array<{ userId: string; courseName: string; daysOverdue: number }>;
    dueSoonUsers: Array<{ userId: string; courseName: string; daysUntilDue: number }>;
  }): Promise<{ overdue: Message[]; dueSoon: Message[] }> => {
    return apiClient.post<{ overdue: Message[]; dueSoon: Message[] }>('/messaging/bulk-reminders', data);
  },

  // Export conversation methods
  exportConversation: async (userId: string): Promise<{
    emailContent: string;
    filename: string;
  }> => {
    return apiClient.get<{
      emailContent: string;
      filename: string;
    }>(`/messaging/export/${userId}`);
  },

  downloadConversation: async (userId: string): Promise<void> => {
    const { emailContent, filename } = await messagingApi.exportConversation(userId);
    
    // Create a blob and download
    const blob = new Blob([emailContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Compliance messaging methods
  getComplianceConversation: async (userId: string): Promise<Message[]> => {
    return apiClient.get<Message[]>(`/compliance-messaging/conversation/${userId}`);
  },

  sendComplianceMessage: async (data: {
    recipientId: string;
    content: string;
    subject?: string;
    type?: 'compliance_reminder' | 'compliance_chat';
  }): Promise<Message> => {
    return apiClient.post<Message>('/compliance-messaging/send', data);
  },

  getComplianceUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/compliance-messaging/unread-count');
    return response.count;
  },

  markComplianceMessageAsRead: async (messageId: string): Promise<Message> => {
    return apiClient.put<Message>(`/compliance-messaging/${messageId}/read`);
  },

  exportComplianceConversation: async (userId: string): Promise<{
    emailContent: string;
    filename: string;
  }> => {
    return apiClient.get<{
      emailContent: string;
      filename: string;
    }>(`/compliance-messaging/export/${userId}`);
  },

  downloadComplianceConversation: async (userId: string): Promise<void> => {
    const { emailContent, filename } = await messagingApi.exportComplianceConversation(userId);
    
    // Create a blob and download
    const blob = new Blob([emailContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  sendBulkComplianceReminders: async (data: {
    overdueUsers: Array<{ userId: string; courseName: string; daysOverdue: number }>;
    dueSoonUsers: Array<{ userId: string; courseName: string; daysUntilDue: number }>;
  }): Promise<{ overdue: Message[]; dueSoon: Message[] }> => {
    return apiClient.post<{ overdue: Message[]; dueSoon: Message[] }>('/compliance-messaging/bulk-reminders', data);
  },
};

