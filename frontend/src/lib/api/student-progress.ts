import { apiClient } from './client';

export interface StudentProgressSummary {
  enrollmentId: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  enrolledAt: Date;
  progressPercentage: number;
  completedAt: Date | null;
  lastActivity: Date | null;
  totalWatchTime: number;
  completedLessons: number;
  averageScore: number;
  totalLessons: number;
}

export interface CourseStudentsResponse {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  students: StudentProgressSummary[];
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  orderIndex: number;
  completed: boolean;
  watchTime: number;
  score: number | null;
  attempts: number;
  lastAccessed: Date | null;
  completionDate: Date | null;
}

export interface StudentProgressDetails {
  student: {
    id: string;
    name: string;
    email: string;
  };
  enrollment: {
    id: string;
    enrolledAt: Date;
    progressPercentage: number;
    completedAt: Date | null;
    lastLessonSeenAt: Date | null;
  };
  statistics: {
    totalWatchTime: number;
    totalWatchTimeFormatted: string;
    completedLessons: number;
    totalLessons: number;
    completionRate: number;
    averageScore: number;
    totalProgressRecords: number;
  };
  lessonProgress: LessonProgress[];
}

export interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  summary: {
    totalStudents: number;
    completedStudents: number;
    activeStudents: number;
    completionRate: number;
    averageProgress: number;
    averageWatchTime: string;
    averageScore: number;
  };
}

export const studentProgressApi = {
  getCourseStudents: async (courseId: string): Promise<CourseStudentsResponse> => {
    return apiClient.get<CourseStudentsResponse>(`/instructor/courses/${courseId}/students`);
  },

  getStudentProgress: async (courseId: string, studentId: string): Promise<StudentProgressDetails> => {
    return apiClient.get<StudentProgressDetails>(
      `/instructor/courses/${courseId}/students/${studentId}/progress`
    );
  },

  getCourseProgressSummary: async (courseId: string): Promise<CourseProgressSummary> => {
    return apiClient.get<CourseProgressSummary>(`/instructor/courses/${courseId}/progress-summary`);
  },
};

