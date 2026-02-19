export declare enum AnalyticsEventType {
    LESSON_STARTED = "lesson_started",
    LESSON_COMPLETED = "lesson_completed",
    LESSON_PAUSED = "lesson_paused",
    LESSON_RESUMED = "lesson_resumed",
    QUIZ_STARTED = "quiz_started",
    QUIZ_COMPLETED = "quiz_completed",
    COURSE_ENROLLED = "course_enrolled",
    COURSE_COMPLETED = "course_completed",
    CERTIFICATE_ISSUED = "certificate_issued",
    VIDEO_SEEK = "video_seek",
    VIDEO_SPEED_CHANGE = "video_speed_change"
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
export declare class TrackEventDto {
    eventType: AnalyticsEventType;
    courseId?: string;
    lessonId?: string;
    quizId?: string;
    metadata?: Record<string, any>;
    sessionId: string;
}
export declare class CreateAnalyticsEventDto {
    userId: string;
    eventType: AnalyticsEventType;
    courseId?: string;
    lessonId?: string;
    quizId?: string;
    metadata?: Record<string, any>;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
}
