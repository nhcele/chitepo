import { IsUUID, IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

export enum AnalyticsEventType {
  LESSON_STARTED = 'lesson_started',
  LESSON_COMPLETED = 'lesson_completed',
  LESSON_PAUSED = 'lesson_paused',
  LESSON_RESUMED = 'lesson_resumed',
  QUIZ_STARTED = 'quiz_started',
  QUIZ_COMPLETED = 'quiz_completed',
  COURSE_ENROLLED = 'course_enrolled',
  COURSE_COMPLETED = 'course_completed',
  CERTIFICATE_ISSUED = 'certificate_issued',
  CERTIFICATE_DOWNLOADED = 'certificate_downloaded',
  VIDEO_SEEK = 'video_seek',
  VIDEO_SPEED_CHANGE = 'video_speed_change',
  DISCUSSION_POSTED = 'discussion_posted',
  DISCUSSION_VIEWED = 'discussion_viewed',
  DISCUSSION_LIKED = 'discussion_liked',
  RESOURCE_DOWNLOADED = 'resource_downloaded',
  LIVE_SESSION_JOINED = 'live_session_joined',
  LIVE_SESSION_LEFT = 'live_session_left',
  LIVE_SESSION_STARTED = 'live_session_started',
  LIVE_SESSION_ENDED = 'live_session_ended',
  LIVE_SESSION_ATTENDANCE_RECORDED = 'live_session_attendance_recorded',
  KNOWLEDGE_CHECK_ANSWERED = 'knowledge_check_answered',
  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted'
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  quizId?: string;
  eventType: AnalyticsEventType;
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LearnerDashboardStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalCertificatesEarned: number;
  currentStreak: number;
  longestStreak: number;
  totalLearningTimeMinutes: number;
  averageQuizScore: number;
  upcomingDeadlines: CourseDeadline[];
}

export interface CourseDeadline {
  courseId: string;
  courseName: string;
  dueDate: Date;
  progressPercent: number;
}

export interface InstructorAnalytics {
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  courseStats: CourseAnalytics[];
  revenueByMonth: MonthlyRevenue[];
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalEnrollments: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  dropOffPoints: LessonDropOff[];
  quizPerformance: QuizPerformance[];
}

export interface LessonDropOff {
  lessonId: string;
  lessonName: string;
  dropOffRate: number;
  averageWatchTime: number;
  totalWatchTime: number;
}

export interface QuizPerformance {
  quizId: string;
  quizName: string;
  averageScore: number;
  passRate: number;
  averageAttempts: number;
  difficultQuestions: QuestionDifficulty[];
}

export interface QuestionDifficulty {
  questionId: string;
  correctAnswerRate: number;
  averageTimeSeconds: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  enrollments: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  carbonSavingsKg: number;
  systemHealth: SystemHealthMetrics;
}

export interface SystemHealthMetrics {
  apiResponseTime: number;
  videoStreamingQuality: number;
  databasePerformance: number;
  errorRate: number;
  uptime: number;
}

export class TrackEventDto {
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsUUID()
  quizId?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  sessionId: string;
}

export class CreateAnalyticsEventDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsUUID()
  quizId?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
