import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Not, IsNull, Between, MoreThan } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { CreateAnalyticsEventDto, AnalyticsEventType, CourseStatus } from '@mindelta/shared';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';

export interface LearnerProgressMetrics {
  userId: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalHours: number;
  completedHours: number;
  averageCompletionRate: number;
  streakDays: number;
  lastActivityDate: Date;
  skillProgress: SkillProgress[];
  learningPath: LearningPathProgress;
}

export interface SkillProgress {
  skillName: string;
  level: number;
  totalCourses: number;
  completedCourses: number;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface LearningPathProgress {
  currentPath: string;
  totalPaths: number;
  completedPaths: number;
  nextRecommended: CourseRecommendation[];
  progressPercentage: number;
}

export interface CourseRecommendation {
  courseId: string;
  title: string;
  reason: string;
  matchScore: number;
  estimatedDuration: number;
}

export interface CourseAnalytics {
  courseId: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completionRate: number;
  averageCompletionTime: number;
  dropOffPoints: DropOffPoint[];
  engagementMetrics: EngagementMetrics;
  revenueMetrics: RevenueMetrics;
  feedback: FeedbackAnalytics;
}

export interface DropOffPoint {
  lessonId: string;
  lessonTitle: string;
  dropOffRate: number;
  totalLearners: number;
  droppedLearners: number;
}

export interface EngagementMetrics {
  averageWatchTime: number;
  completionRate: number;
  quizScores: QuizScoreAnalytics;
  discussionParticipation: number;
  resourceDownloads: number;
  repeatViews: number;
}

export interface QuizScoreAnalytics {
  averageScore: number;
  passRate: number;
  averageAttempts: number;
  difficultyDistribution: Record<string, number>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  revenuePerEnrollment: number;
  monthlyRevenue: MonthlyRevenue[];
  projectedRevenue: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  enrollments: number;
}

export interface FeedbackAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  commonTopics: string[];
  sentimentScore: number;
}

export interface BusinessIntelligence {
  overview: PlatformOverview;
  learnerInsights: LearnerInsights;
  courseInsights: CourseInsights;
  financialMetrics: FinancialMetrics;
  trends: TrendAnalysis[];
}

export interface PlatformOverview {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalRevenue: number;
  monthlyGrowthRate: number;
  completionRate: number;
}

export interface LearnerInsights {
  demographics: Demographics;
  behaviorPatterns: BehaviorPattern[];
  retentionMetrics: RetentionMetrics;
  skillDistribution: SkillDistribution[];
}

export interface Demographics {
  ageGroups: Record<string, number>;
  locations: Record<string, number>;
  experienceLevels: Record<string, number>;
}

export interface BehaviorPattern {
  pattern: string;
  percentage: number;
  description: string;
}

export interface RetentionMetrics {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

export interface SkillDistribution {
  skill: string;
  learnerCount: number;
  averageProficiency: number;
  demand: number;
}

export interface CourseInsights {
  topPerforming: CoursePerformance[];
  underperforming: CoursePerformance[];
  categoryAnalysis: CategoryAnalysis[];
}

export interface CoursePerformance {
  courseId: string;
  title: string;
  enrollmentCount: number;
  completionRate: number;
  revenue: number;
  rating: number;
}

export interface CategoryAnalysis {
  category: string;
  totalCourses: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  revenue: number;
}

export interface FinancialMetrics {
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  dataPoints: DataPoint[];
}

export interface DataPoint {
  date: string;
  value: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private analyticsRepository: Repository<AnalyticsEvent>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(LessonProgress)
    private progressRepository: Repository<LessonProgress>,
  ) {}

  async trackEvent(createAnalyticsEventDto: CreateAnalyticsEventDto): Promise<AnalyticsEvent> {
    // Map metadata to eventData for database storage
    const { metadata, ...rest } = createAnalyticsEventDto;
    const eventData = this.buildEventData(metadata, rest);
    const event = this.analyticsRepository.create({
      ...rest,
      eventData,
    });
    return this.analyticsRepository.save(event);
  }

  async getCourseSummary(courseId: string): Promise<any> {
    // Get actual enrollments from database
    const enrollments = await this.enrollmentRepository.find({ 
      where: { courseId },
      relations: ['user']
    });

    // Get course with ratings
    const course = await this.courseRepository.findOne({ 
      where: { id: courseId },
      relations: ['modules', 'modules.lessons']
    });

    // Pull recent and historical events for this course
    const events = await this.analyticsRepository.find({ where: { courseId } });
    const progress = await this.progressRepository.find({ where: { courseId } });

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const active7d = new Set<string>();
    const active30d = new Set<string>();

    let lessonCompletions = 0;
    let quizCompleted = 0;
    let quizCompletedPassed = 0;

    events.forEach((e) => {
      if (e.eventType === AnalyticsEventType.LESSON_COMPLETED) lessonCompletions++;
      if (e.eventType === AnalyticsEventType.QUIZ_COMPLETED) {
        quizCompleted++;
        const passed = (e.metadata as any)?.passed === true || (e.metadata as any)?.score >= 50;
        if (passed) quizCompletedPassed++;
      }
      const age = now.getTime() - new Date(e.timestamp).getTime();
      if (age <= 7 * dayMs) active7d.add(e.userId);
      if (age <= 30 * dayMs) active30d.add(e.userId);
    });

    // Calculate metrics
    const totalEnrollments = enrollments.length;
    const activeStudents = active30d.size;
    const completedEnrollments = enrollments.filter(e => e.progressPercentage === 100).length;
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
    const averageProgress = totalEnrollments > 0 
      ? enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0) / totalEnrollments 
      : 0;

    // Calculate total lessons for completion rates
    const totalLessons = course?.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
    const lessonCompletionRate = totalLessons > 0 && totalEnrollments > 0
      ? (lessonCompletions / (totalLessons * totalEnrollments)) * 100
      : 0;
    const quizCompletionRate = quizCompleted > 0 && totalEnrollments > 0
      ? (quizCompleted / totalEnrollments) * 100
      : 0;

    const uniqueLearners = new Set(events.map((e) => e.userId)).size;
    const passRate = quizCompleted > 0 ? (quizCompletedPassed / quizCompleted) : 0;
    const avgAttemptsPerLearner = uniqueLearners > 0 ? (quizCompleted / uniqueLearners) : 0;

    const lastActivity = events.length > 0 
      ? events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp 
      : null;

    // Return data matching frontend interface
    const averageTimeSpent = progress.length > 0
      ? progress.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / progress.length
      : 0;

    return {
      courseId,
      totalEnrollments,
      activeStudents,
      completionRate,
      averageProgress,
      averageRating: course?.averageRating || 0,
      totalRatings: course?.totalRatings || 0,
      engagementMetrics: {
        averageTimeSpent,
        lessonCompletionRate,
        quizCompletionRate,
      },
      // Legacy fields for backward compatibility
      enrollments: totalEnrollments,
      lessonCompletions,
      quizCompleted,
      passRate,
      avgAttemptsPerLearner,
      active7d: active7d.size,
      active30d: active30d.size,
      lastActivity,
    };
  }

  async getInstructorSummary(instructorId: string): Promise<any> {
    // Get instructor courses
    const courses = await this.courseRepository.find({ where: { instructorId } });
    const courseIds = courses.map((c) => c.id);
    if (courseIds.length === 0) return { instructorId, courseStats: [], totals: { enrollments: 0, active30d: 0 } };

    // Load all events across these courses
    const events = await this.analyticsRepository.find({ where: { courseId: In(courseIds) } });

    // Compute per-course summaries by grouping
    const byCourse = new Map<string, AnalyticsEvent[]>();
    for (const e of events) {
      if (!byCourse.has(e.courseId)) byCourse.set(e.courseId, []);
      byCourse.get(e.courseId)!.push(e);
    }

    const stats: any[] = [];
    let totalEnrollments = 0;
    let totalActive30d = 0;
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    for (const courseId of courseIds) {
      const evs = byCourse.get(courseId) || [];
      let enrollments = 0;
      let lessonCompletions = 0;
      let quizCompleted = 0;
      let quizCompletedPassed = 0;
      const active30d = new Set<string>();

      for (const e of evs) {
        if (e.eventType === AnalyticsEventType.COURSE_ENROLLED) enrollments++;
        if (e.eventType === AnalyticsEventType.LESSON_COMPLETED) lessonCompletions++;
        if (e.eventType === AnalyticsEventType.QUIZ_COMPLETED) {
          quizCompleted++;
          const passed = (e.metadata as any)?.passed === true || (e.metadata as any)?.score >= 50;
          if (passed) quizCompletedPassed++;
        }
        const age = now.getTime() - new Date(e.timestamp).getTime();
        if (age <= 30 * dayMs) active30d.add(e.userId);
      }

      const passRate = quizCompleted > 0 ? (quizCompletedPassed / quizCompleted) : 0;
      const uniqueLearners = new Set(evs.map((e) => e.userId)).size;
      const avgAttemptsPerLearner = uniqueLearners > 0 ? (quizCompleted / uniqueLearners) : 0;

      stats.push({ courseId, enrollments, lessonCompletions, quizCompleted, passRate, avgAttemptsPerLearner, active30d: active30d.size });
      totalEnrollments += enrollments;
      totalActive30d += active30d.size;
    }

    return { instructorId, courseStats: stats, totals: { enrollments: totalEnrollments, active30d: totalActive30d } };
  }

  async getEventsByUser(userId: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    return this.analyticsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getEventsByUserSince(userId: string, since?: Date, limit: number = 5000): Promise<AnalyticsEvent[]> {
    const where = since ? { userId, createdAt: MoreThan(since) } : { userId };
    return this.analyticsRepository.find({
      where,
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
    return this.analyticsRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getEventsByType(eventType: AnalyticsEventType, limit: number = 100): Promise<AnalyticsEvent[]> {
    return this.analyticsRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLiveSessionSummary(sessionId: string) {
    const events = await this.analyticsRepository.find({ where: { sessionId } });

    const joined = events.filter((e) => (e.eventType as any) === 'live_session_joined').length;
    const left = events.filter((e) => (e.eventType as any) === 'live_session_left').length;
    const started = events.find((e) => (e.eventType as any) === 'live_session_started')?.createdAt;
    const ended = events.find((e) => (e.eventType as any) === 'live_session_ended')?.createdAt;
    const attendanceRecorded = events.filter((e) => (e.eventType as any) === 'live_session_attendance_recorded').length;

    return {
      sessionId,
      counts: {
        joined,
        left,
        attendanceRecorded,
      },
      startedAt: started,
      endedAt: ended,
    };
  }

  async getCourseAnalytics(courseId: string): Promise<any> {
    const events = await this.analyticsRepository.find({
      where: { 
        eventType: AnalyticsEventType.COURSE_ENROLLED,
        courseId
      },
      order: { createdAt: 'DESC' },
    });

    return {
      totalViews: events.length,
      uniqueUsers: [...new Set(events.map(e => e.userId))].length,
      events,
    };
  }

  async getUserLearningProgress(userId: string): Promise<any> {
    const events = await this.analyticsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const lessonCompletions = events.filter(e => e.eventType === AnalyticsEventType.LESSON_COMPLETED);
    const quizAttempts = events.filter(e => e.eventType === AnalyticsEventType.QUIZ_COMPLETED);

    // Compute learning streak in days (consecutive days with at least one event)
    const uniqueDays = Array.from(
      new Set(
        events.map(e => new Date(e.timestamp).toISOString().slice(0, 10))
      )
    ).sort();

    let streakDays = 0;
    if (uniqueDays.length > 0) {
      // Count backwards from today
      let current = new Date();
      current.setHours(0, 0, 0, 0);
      for (let i = uniqueDays.length - 1; i >= 0; i--) {
        const dayStr = uniqueDays[i];
        const day = new Date(dayStr);
        const diffDays = Math.round((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
          streakDays++;
          // move to previous day
          current.setDate(current.getDate() - 1);
        } else if (diffDays === 1) {
          streakDays++;
          current.setDate(current.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      totalEvents: events.length,
      lessonsCompleted: lessonCompletions.length,
      quizzesAttempted: quizAttempts.length,
      lastActivity: events[events.length - 1]?.timestamp,
      streakDays,
    };
  }

  // Enhanced Learner Progress Tracking
  async getLearnerProgressMetrics(userId: string): Promise<LearnerProgressMetrics> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course', 'course.modules', 'course.modules.lessons'],
    });

    const progress = await this.progressRepository.find({
      where: { userId },
    });

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.completedAt).length;
    const inProgressCourses = totalCourses - completedCourses;

    const allLessons = enrollments.flatMap(e => e.course.modules?.flatMap(m => m.lessons || []) || []);
    const totalLessons = allLessons.length;
    const completedLessons = progress.filter(p => p.isCompleted).length;

    const totalHours = allLessons.reduce((sum, lesson) => sum + (lesson.durationSeconds || 0) / 3600, 0);
    const completedHours = progress.reduce((sum, p) => {
      const lesson = allLessons.find(l => l.id === p.lessonId);
      return sum + ((lesson?.durationSeconds || 0) / 3600);
    }, 0);

    const averageCompletionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const lastActivity = progress.length > 0 
      ? new Date(Math.max(...progress.map(p => p.updatedAt?.getTime() || 0)))
      : new Date(0);

    const streakDays = await this.calculateStreakDays(userId, progress);

    return {
      userId,
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalLessons,
      completedLessons,
      totalHours,
      completedHours,
      averageCompletionRate,
      streakDays,
      lastActivityDate: lastActivity,
      skillProgress: await this.getSkillProgress(userId),
      learningPath: await this.getLearningPathProgress(userId),
    };
  }

  private async calculateStreakDays(userId: string, progress: LessonProgress[]): Promise<number> {
    const activityDates = progress
      .map(p => p.updatedAt?.toDateString())
      .filter(date => date)
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < activityDates.length; i++) {
      const currentDate = new Date(activityDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async getSkillProgress(userId: string): Promise<SkillProgress[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { userId },
      relations: ['course'],
    });

    const skillGroups = enrollments.reduce((groups, enrollment) => {
      const skills = enrollment.course.skills || [];
      skills.forEach(skill => {
        if (!groups[skill]) {
          groups[skill] = {
            skillName: skill,
            totalCourses: 0,
            completedCourses: 0,
          };
        }
        groups[skill].totalCourses++;
        if (enrollment.completedAt) {
          groups[skill].completedCourses++;
        }
      });
      return groups;
    }, {} as Record<string, any>);

    return Object.values(skillGroups).map((group: any) => {
      const completionRate = group.totalCourses > 0 
        ? (group.completedCourses / group.totalCourses) * 100 
        : 0;

      let proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      if (completionRate < 25) proficiency = 'beginner';
      else if (completionRate < 50) proficiency = 'intermediate';
      else if (completionRate < 75) proficiency = 'advanced';
      else proficiency = 'expert';

      return {
        ...group,
        level: Math.round(completionRate / 10),
        proficiency,
      };
    });
  }

  private async getLearningPathProgress(userId: string): Promise<LearningPathProgress> {
    const [user, enrollments, publishedCourses] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.enrollmentRepository.find({ where: { userId }, relations: ['course'] }),
      this.courseRepository.find({ where: { status: CourseStatus.PUBLISHED } }),
    ]);

    const categoryCounts = new Map<string, number>();
    const completedCategories = new Set<string>();
    for (const enrollment of enrollments) {
      const category = (enrollment.course?.category || 'uncategorized') as string;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      if (enrollment.completedAt) completedCategories.add(category);
    }

    const availableCategories = Array.from(
      new Set(publishedCourses.map((c) => (c.category || 'uncategorized') as string)),
    );
    const totalPaths = availableCategories.length || categoryCounts.size || 0;
    const completedPaths = Array.from(completedCategories).filter((c) =>
      availableCategories.length > 0 ? availableCategories.includes(c) : true,
    ).length;
    const progressPercentage = totalPaths > 0 ? (completedPaths / totalPaths) * 100 : 0;

    const topCategory =
      Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
    const currentPath = user?.jobRole ? String(user.jobRole) : topCategory;

    const nextRecommended = await this.getCourseRecommendations(userId);

    return {
      currentPath,
      totalPaths,
      completedPaths,
      nextRecommended,
      progressPercentage,
    };
  }

  private async getCourseRecommendations(userId: string): Promise<CourseRecommendation[]> {
    const [user, enrollments, allCourses] = await Promise.all([
      this.userRepository.findOne({ where: { id: userId } }),
      this.enrollmentRepository.find({ where: { userId } }),
      this.courseRepository.find({ where: { status: CourseStatus.PUBLISHED } }),
    ]);

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const interests = new Set(
      [
        ...(user?.skillInterests || []),
        ...(user?.jobRole ? [String(user.jobRole)] : []),
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase()),
    );

    const scored = allCourses
      .filter((course) => !enrolledCourseIds.has(course.id))
      .map((course) => {
        const skills = (course.skills || []).map((s) => String(s).toLowerCase());
        const tags = (course.tags || []).map((s) => String(s).toLowerCase());
        const combined = Array.from(new Set([...skills, ...tags]));
        const matches = combined.filter((s) => interests.has(s));
        const matchScore = combined.length > 0 ? (matches.length / combined.length) * 100 : 0;
        const reason =
          matches.length > 0
            ? `Matches your interests: ${matches.slice(0, 3).join(', ')}`
            : 'Based on your learning activity';

        return {
          courseId: course.id,
          title: course.title,
          reason,
          matchScore: Math.round(matchScore),
          estimatedDuration: course.estimatedDuration ? course.estimatedDuration / 60 : 0,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return scored;
  }

  // Enhanced Course Analytics
  async getCourseAnalyticsMetrics(courseId: string): Promise<CourseAnalytics> {
    const enrollments = await this.enrollmentRepository.find({
      where: { courseId },
      relations: ['user', 'course'],
    });

    const progress = await this.progressRepository.find({
      where: { courseId },
    });

    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(e => e.completedAt).length;
    const activeEnrollments = enrollments.filter(e => !e.completedAt && e.enrolledAt).length;
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    const averageCompletionTime = this.calculateAverageCompletionTime(enrollments);
    const dropOffPoints = await this.getDropOffPoints(courseId, progress);
    const engagementMetrics = await this.getEngagementMetrics(courseId, progress);
    const revenueMetrics = await this.getRevenueMetrics(courseId, enrollments);
    const feedback = await this.getFeedbackAnalytics(courseId);

    return {
      courseId,
      totalEnrollments,
      activeEnrollments,
      completionRate,
      averageCompletionTime,
      dropOffPoints,
      engagementMetrics,
      revenueMetrics,
      feedback,
    };
  }

  private calculateAverageCompletionTime(enrollments: Enrollment[]): number {
    const completedEnrollments = enrollments.filter(e => e.completedAt);
    if (completedEnrollments.length === 0) return 0;

    const totalTime = completedEnrollments.reduce((sum, e) => {
      if (e.enrolledAt && e.completedAt) {
        return sum + (e.completedAt.getTime() - e.enrolledAt.getTime());
      }
      return sum;
    }, 0);

    return totalTime / completedEnrollments.length / (1000 * 60 * 60 * 24);
  }

  private async getDropOffPoints(courseId: string, progress: LessonProgress[]): Promise<DropOffPoint[]> {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });

    if (!course) return [];

    const courseLessons = course.modules?.flatMap(m => m.lessons || []) || [];
    return courseLessons.map(lesson => {
      const lessonProgress = progress.filter(p => p.lessonId === lesson.id);
      const totalLearners = lessonProgress.length;
      const droppedLearners = lessonProgress.filter(p => !p.isCompleted).length;
      const dropOffRate = totalLearners > 0 ? (droppedLearners / totalLearners) * 100 : 0;

      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        dropOffRate,
        totalLearners,
        droppedLearners,
      };
    }).sort((a, b) => b.dropOffRate - a.dropOffRate);
  }

  private async getEngagementMetrics(courseId: string, progress: LessonProgress[]): Promise<EngagementMetrics> {
    const averageWatchTime =
      progress.length > 0
        ? progress.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / progress.length
        : 0;
    const completionRate =
      progress.length > 0 ? (progress.filter((p) => p.isCompleted).length / progress.length) * 100 : 0;

    const quizEvents = await this.analyticsRepository.find({
      where: { courseId, eventType: AnalyticsEventType.QUIZ_COMPLETED },
    });

    const scores = quizEvents
      .map((e) => Number((e.metadata as any)?.score ?? (e.metadata as any)?.percent ?? 0))
      .filter((v) => Number.isFinite(v));
    const averageScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const passed = quizEvents.filter((e) => {
      const score = Number((e.metadata as any)?.score ?? 0);
      return (e.metadata as any)?.passed === true || score >= 50;
    }).length;
    const passRate = quizEvents.length > 0 ? (passed / quizEvents.length) * 100 : 0;
    const attemptsByUser = new Map<string, number>();
    quizEvents.forEach((e) => {
      if (!e.userId) return;
      attemptsByUser.set(e.userId, (attemptsByUser.get(e.userId) || 0) + 1);
    });
    const averageAttempts =
      attemptsByUser.size > 0 ? quizEvents.length / attemptsByUser.size : 0;

    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    scores.forEach((score) => {
      if (score >= 80) difficultyDistribution.easy += 1;
      else if (score >= 50) difficultyDistribution.medium += 1;
      else difficultyDistribution.hard += 1;
    });

    const discussionEvents = await this.analyticsRepository.find({
      where: { courseId, eventType: AnalyticsEventType.DISCUSSION_POSTED },
    });
    const discussionParticipation = new Set(discussionEvents.map((e) => e.userId)).size;

    const resourceDownloads = await this.analyticsRepository.count({
      where: { courseId, eventType: AnalyticsEventType.RESOURCE_DOWNLOADED },
    });

    const lessonStartEvents = await this.analyticsRepository.find({
      where: { courseId, eventType: AnalyticsEventType.LESSON_STARTED },
    });
    const lessonStartsByUser = new Map<string, number>();
    lessonStartEvents.forEach((e) => {
      if (!e.userId) return;
      lessonStartsByUser.set(e.userId, (lessonStartsByUser.get(e.userId) || 0) + 1);
    });
    const repeatViews = Array.from(lessonStartsByUser.values()).filter((c) => c >= 2).length;

    return {
      averageWatchTime,
      completionRate,
      quizScores: {
        averageScore,
        passRate,
        averageAttempts,
        difficultyDistribution,
      },
      discussionParticipation,
      resourceDownloads,
      repeatViews,
    };
  }

  private async getRevenueMetrics(courseId: string, enrollments: Enrollment[]): Promise<RevenueMetrics> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    const price = Number(course?.price || 0);
    const totalRevenue = enrollments.length * price;
    const revenuePerEnrollment = enrollments.length > 0 ? totalRevenue / enrollments.length : 0;
    const monthlyMap = new Map<string, { revenue: number; enrollments: number }>();
    enrollments.forEach((e) => {
      const key = this.formatMonthKey(e.enrolledAt);
      const current = monthlyMap.get(key) || { revenue: 0, enrollments: 0 };
      current.revenue += price;
      current.enrollments += 1;
      monthlyMap.set(key, current);
    });

    const monthlyRevenue: MonthlyRevenue[] = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, revenue: data.revenue, enrollments: data.enrollments }));

    const recentMonths = monthlyRevenue.slice(-3);
    const recentAvg =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + m.revenue, 0) / recentMonths.length
        : 0;
    const projectedRevenue = recentAvg * 12;

    return {
      totalRevenue,
      revenuePerEnrollment,
      monthlyRevenue,
      projectedRevenue,
    };
  }

  private async getFeedbackAnalytics(courseId: string): Promise<FeedbackAnalytics> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    const averageRating = Number(course?.averageRating || 0);
    const totalReviews = Number(course?.totalRatings || 0);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (totalReviews > 0) {
      const lower = Math.max(1, Math.min(5, Math.floor(averageRating)));
      const upper = Math.max(1, Math.min(5, Math.ceil(averageRating)));
      if (lower === upper) {
        distribution[lower] = totalReviews;
      } else {
        const upperWeight = averageRating - lower;
        const upperCount = Math.round(totalReviews * upperWeight);
        distribution[upper] = upperCount;
        distribution[lower] = totalReviews - upperCount;
      }
    }

    const commonTopics = Array.from(
      new Set([...(course?.tags || []), ...(course?.skills || [])]),
    ).slice(0, 6);
    const sentimentScore = averageRating > 0 ? averageRating / 5 : 0;

    return {
      averageRating,
      totalReviews,
      ratingDistribution: distribution,
      commonTopics,
      sentimentScore,
    };
  }

  // Engagement Metrics
  async getPlatformEngagementMetrics() {
    const [dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers, totalUsers] = await Promise.all([
      this.countActiveUsers(1),
      this.countActiveUsers(7),
      this.countActiveUsers(30),
      this.userRepository.count(),
    ]);

    const totalEnrollments = await this.enrollmentRepository.count();
    const uniqueEnrolledUsers = await this.enrollmentRepository
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.user_id)', 'count')
      .getRawOne()
      .then((r) => Number(r?.count || 0));
    const coursesPerUser = uniqueEnrolledUsers > 0 ? totalEnrollments / uniqueEnrolledUsers : 0;

    const completedEnrollments = await this.enrollmentRepository.count({
      where: { completedAt: Not(IsNull()) },
    });
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    const since30 = this.daysAgo(30);
    const recentEvents = await this.analyticsRepository.find({
      where: { createdAt: MoreThan(since30) },
    });
    const sessionMap = new Map<string, { min: Date; max: Date }>();
    recentEvents.forEach((e) => {
      if (!e.sessionId || e.sessionId === 'server') return;
      const existing = sessionMap.get(e.sessionId);
      if (!existing) {
        sessionMap.set(e.sessionId, { min: e.createdAt, max: e.createdAt });
      } else {
        if (e.createdAt < existing.min) existing.min = e.createdAt;
        if (e.createdAt > existing.max) existing.max = e.createdAt;
      }
    });
    const sessionDurations = Array.from(sessionMap.values()).map(
      (s) => (s.max.getTime() - s.min.getTime()) / (1000 * 60),
    );
    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length
        : 0;

    const lessonStartedCount = recentEvents.filter(
      (e) => e.eventType === AnalyticsEventType.LESSON_STARTED,
    ).length;
    const lessonsPerSession = sessionMap.size > 0 ? lessonStartedCount / sessionMap.size : 0;

    const retentionRate = totalUsers > 0 ? (monthlyActiveUsers / totalUsers) * 100 : 0;

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionDuration,
      coursesPerUser,
      lessonsPerSession,
      completionRate,
      retentionRate,
    };
  }

  // Instructor Revenue Analytics
  async getInstructorRevenueAnalytics(instructorId: string) {
    const courses = await this.courseRepository.find({
      where: { instructorId },
      relations: ['enrollments'],
    });

    const totalRevenue = courses.reduce((sum, course) => {
      const courseRevenue = course.enrollments.length * (course.price || 0);
      return sum + courseRevenue;
    }, 0);

    const totalEnrollments = courses.reduce((sum, course) => sum + course.enrollments.length, 0);
    const revenuePerEnrollment = totalEnrollments > 0 ? totalRevenue / totalEnrollments : 0;

    return {
      instructorId,
      totalRevenue,
      totalEnrollments,
      revenuePerEnrollment,
      monthlyRevenue: await this.getMonthlyRevenueForInstructor(instructorId),
      topCourses: courses
        .map(course => ({
          courseId: course.id,
          title: course.title,
          revenue: course.enrollments.reduce((sum, e) => sum + (course.price || 0), 0),
          enrollments: course.enrollments.length,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }

  private async getMonthlyRevenueForInstructor(instructorId: string) {
    const courses = await this.courseRepository.find({
      where: { instructorId },
      relations: ['enrollments'],
    });

    const monthlyMap = new Map<string, { revenue: number; enrollments: number }>();
    for (const course of courses) {
      const price = Number(course.price || 0);
      for (const enrollment of course.enrollments || []) {
        const key = this.formatMonthKey(enrollment.enrolledAt);
        const current = monthlyMap.get(key) || { revenue: 0, enrollments: 0 };
        current.revenue += price;
        current.enrollments += 1;
        monthlyMap.set(key, current);
      }
    }

    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, revenue: data.revenue, enrollments: data.enrollments }));
  }

  // Business Intelligence Dashboard
  async getBusinessIntelligence(): Promise<BusinessIntelligence> {
    const [overview, learnerInsights, courseInsights, financialMetrics] = await Promise.all([
      this.getPlatformOverview(),
      this.getLearnerInsights(),
      this.getCourseInsights(),
      this.getFinancialMetrics(),
    ]);

    const trends = await this.getTrendAnalysis();

    return {
      overview,
      learnerInsights,
      courseInsights,
      financialMetrics,
      trends,
    };
  }

  private async getPlatformOverview(): Promise<PlatformOverview> {
    const totalUsers = await this.userRepository.count();
    const totalCourses = await this.courseRepository.count({ where: { status: CourseStatus.PUBLISHED } });
    const totalEnrollments = await this.enrollmentRepository.count();
    const completedEnrollments = await this.enrollmentRepository.count({ where: { completedAt: Not(IsNull()) } });

    const totalRevenue = await this.getTotalRevenue();
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
    const activeUsers = await this.countActiveUsers(30);

    const now = new Date();
    const last30 = this.daysAgo(30, now);
    const prev30 = this.daysAgo(60, now);
    const last30Count = await this.userRepository.count({ where: { createdAt: MoreThan(last30) } });
    const prev30Count = await this.userRepository.count({
      where: { createdAt: Between(prev30, last30) },
    });
    const monthlyGrowthRate =
      prev30Count > 0 ? ((last30Count - prev30Count) / prev30Count) * 100 : last30Count > 0 ? 100 : 0;

    return {
      totalUsers,
      activeUsers,
      totalCourses,
      totalRevenue,
      monthlyGrowthRate,
      completionRate,
    };
  }

  private async getLearnerInsights(): Promise<LearnerInsights> {
    const users = await this.userRepository.find({
      select: ['id', 'location', 'roleLevel'],
    });

    const locations: Record<string, number> = {};
    const experienceLevels: Record<string, number> = {};
    users.forEach((u) => {
      const loc = u.location || 'unknown';
      locations[loc] = (locations[loc] || 0) + 1;
      const level = (u.roleLevel as any) || 'unknown';
      experienceLevels[level] = (experienceLevels[level] || 0) + 1;
    });

    const recentEvents = await this.analyticsRepository.find({
      where: { createdAt: MoreThan(this.daysAgo(30)) },
    });
    const totalEvents = Math.max(1, recentEvents.length);
    const weekendEvents = recentEvents.filter((e) => this.isWeekend(e.createdAt)).length;
    const eveningEvents = recentEvents.filter((e) => this.isEvening(e.createdAt)).length;
    const mobileEvents = recentEvents.filter((e) => this.isMobileUserAgent(e.userAgent)).length;

    const behaviorPatterns: BehaviorPattern[] = [];
    if (recentEvents.length > 0) {
      behaviorPatterns.push({
        pattern: 'Weekend Learning',
        percentage: (weekendEvents / totalEvents) * 100,
        description: 'Most active on weekends',
      });
      behaviorPatterns.push({
        pattern: 'Evening Sessions',
        percentage: (eveningEvents / totalEvents) * 100,
        description: 'Prefer evening study times',
      });
      behaviorPatterns.push({
        pattern: 'Mobile First',
        percentage: (mobileEvents / totalEvents) * 100,
        description: 'Access primarily via mobile devices',
      });
    }

    const retentionEvents = await this.analyticsRepository.find({
      where: { createdAt: MoreThan(this.daysAgo(120)) },
      order: { createdAt: 'ASC' },
    });
    const retentionMetrics = this.calculateRetentionMetrics(retentionEvents);

    const enrollments = await this.enrollmentRepository.find({ relations: ['course'] });
    const skillMap = new Map<
      string,
      { learners: Set<string>; total: number; completed: number }
    >();
    enrollments.forEach((e) => {
      const skills = e.course?.skills || [];
      skills.forEach((skill) => {
        const key = String(skill);
        if (!skillMap.has(key)) {
          skillMap.set(key, { learners: new Set<string>(), total: 0, completed: 0 });
        }
        const entry = skillMap.get(key)!;
        entry.learners.add(e.userId);
        entry.total += 1;
        if (e.completedAt) entry.completed += 1;
      });
    });

    const skillDistribution = Array.from(skillMap.entries()).map(([skill, data]) => ({
      skill,
      learnerCount: data.learners.size,
      averageProficiency: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      demand: data.total,
    }));

    return {
      demographics: {
        ageGroups: { unknown: users.length },
        locations,
        experienceLevels,
      },
      behaviorPatterns,
      retentionMetrics,
      skillDistribution,
    };
  }

  private async getCourseInsights(): Promise<CourseInsights> {
    const courses = await this.courseRepository.find({
      relations: ['enrollments'],
      take: 100,
    });

    const coursePerformance = courses.map(course => ({
      courseId: course.id,
      title: course.title,
      enrollmentCount: course.enrollments.length,
      completionRate: this.calculateCourseCompletionRate(course.enrollments),
      revenue: course.enrollments.reduce((sum, e) => sum + (course.price || 0), 0),
      rating: Number(course.averageRating || 0),
    }));

    const sortedByPerformance = [...coursePerformance].sort((a, b) => b.completionRate - a.completionRate);

    return {
      topPerforming: sortedByPerformance.slice(0, 10),
      underperforming: sortedByPerformance.slice(-10).reverse(),
      categoryAnalysis: await this.getCategoryAnalysis(),
    };
  }

  private calculateCourseCompletionRate(enrollments: Enrollment[]): number {
    if (enrollments.length === 0) return 0;
    const completed = enrollments.filter(e => e.completedAt).length;
    return (completed / enrollments.length) * 100;
  }

  private async getCategoryAnalysis(): Promise<CategoryAnalysis[]> {
    const courses = await this.courseRepository.find({ relations: ['enrollments'] });
    const categoryMap = new Map<
      string,
      { totalCourses: number; totalEnrollments: number; completedEnrollments: number; revenue: number }
    >();

    for (const course of courses) {
      const category = (course.category || 'uncategorized') as string;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          totalCourses: 0,
          totalEnrollments: 0,
          completedEnrollments: 0,
          revenue: 0,
        });
      }
      const entry = categoryMap.get(category)!;
      entry.totalCourses += 1;
      entry.totalEnrollments += course.enrollments.length;
      entry.completedEnrollments += course.enrollments.filter((e) => e.completedAt).length;
      entry.revenue += course.enrollments.reduce((sum, e) => sum + (course.price || 0), 0);
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalCourses: data.totalCourses,
      totalEnrollments: data.totalEnrollments,
      averageCompletionRate:
        data.totalEnrollments > 0 ? (data.completedEnrollments / data.totalEnrollments) * 100 : 0,
      revenue: data.revenue,
    }));
  }

  private async getFinancialMetrics(): Promise<FinancialMetrics> {
    const totalRevenue = await this.getTotalRevenue();
    const totalUsers = await this.userRepository.count();
    const recentEnrollments = await this.enrollmentRepository.find({
      where: { enrolledAt: MoreThan(this.daysAgo(30)) },
      relations: ['course'],
    });
    const monthlyRevenue = recentEnrollments.reduce(
      (sum, e) => sum + Number(e.course?.price || 0),
      0,
    );
    const activeUsers = await this.countActiveUsers(30);
    const churnRate = totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0;

    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const customerLifetimeValue =
      churnRate > 0 ? averageRevenuePerUser * (1 / (churnRate / 100)) : averageRevenuePerUser;

    return {
      monthlyRecurringRevenue: monthlyRevenue,
      averageRevenuePerUser,
      customerLifetimeValue,
      churnRate,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const courses = await this.courseRepository.find({
      relations: ['enrollments'],
    });
    
    return courses.reduce((total, course) => {
      const courseRevenue = course.enrollments.length * (course.price || 0);
      return total + courseRevenue;
    }, 0);
  }

  private async getTrendAnalysis(): Promise<TrendAnalysis[]> {
    const start = this.daysAgo(30);
    const events = await this.analyticsRepository.find({
      where: { createdAt: MoreThan(start) },
    });
    const enrollments = await this.enrollmentRepository.find({
      where: { enrolledAt: MoreThan(start) },
      relations: ['course'],
    });

    const dayKeys = this.buildDateSeries(30);
    const activeUsersByDay = new Map<string, Set<string>>();
    const completionsByDay = new Map<string, number>();
    const revenueByDay = new Map<string, number>();

    events.forEach((e) => {
      const key = this.formatDayKey(e.createdAt);
      if (!activeUsersByDay.has(key)) activeUsersByDay.set(key, new Set());
      if (e.userId) activeUsersByDay.get(key)!.add(e.userId);
      if (e.eventType === AnalyticsEventType.COURSE_COMPLETED) {
        completionsByDay.set(key, (completionsByDay.get(key) || 0) + 1);
      }
    });

    enrollments.forEach((e) => {
      const key = this.formatDayKey(e.enrolledAt);
      const price = Number(e.course?.price || 0);
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + price);
    });

    const dailyActive = dayKeys.map((key) => ({
      date: key,
      value: activeUsersByDay.get(key)?.size || 0,
    }));
    const courseCompletions = dayKeys.map((key) => ({
      date: key,
      value: completionsByDay.get(key) || 0,
    }));
    const revenue = dayKeys.map((key) => ({
      date: key,
      value: revenueByDay.get(key) || 0,
    }));

    const dauChange = this.calculateChangePercentage(dailyActive);
    const completionChange = this.calculateChangePercentage(courseCompletions);
    const revenueChange = this.calculateChangePercentage(revenue);

    return [
      {
        metric: 'Daily Active Users',
        period: '30 days',
        trend: this.trendFromChange(dauChange),
        changePercentage: dauChange,
        dataPoints: dailyActive,
      },
      {
        metric: 'Course Completions',
        period: '30 days',
        trend: this.trendFromChange(completionChange),
        changePercentage: completionChange,
        dataPoints: courseCompletions,
      },
      {
        metric: 'Revenue',
        period: '30 days',
        trend: this.trendFromChange(revenueChange),
        changePercentage: revenueChange,
        dataPoints: revenue,
      },
    ];
  }

  private buildEventData(metadata: Record<string, any> | undefined, dto: CreateAnalyticsEventDto) {
    const eventData: Record<string, any> = { ...(metadata || {}) };
    if (dto.courseId) eventData.courseId = dto.courseId;
    if (dto.lessonId) eventData.lessonId = dto.lessonId;
    if (dto.quizId) eventData.quizId = dto.quizId;
    return Object.keys(eventData).length > 0 ? eventData : null;
  }

  private daysAgo(days: number, from: Date = new Date()): Date {
    const d = new Date(from);
    d.setDate(d.getDate() - days);
    return d;
  }

  private formatMonthKey(date: Date): string {
    return date.toISOString().slice(0, 7);
  }

  private formatDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildDateSeries(days: number): string[] {
    const series: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      series.push(this.formatDayKey(this.daysAgo(i)));
    }
    return series;
  }

  private async countActiveUsers(days: number): Promise<number> {
    const since = this.daysAgo(days);
    const result = await this.analyticsRepository
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.userId)', 'count')
      .where('e.createdAt >= :since', { since })
      .andWhere('e.userId IS NOT NULL')
      .getRawOne();
    return Number(result?.count || 0);
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private isEvening(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 18 && hour <= 23;
  }

  private isMobileUserAgent(userAgent?: string | null): boolean {
    if (!userAgent) return false;
    return /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile)/i.test(userAgent);
  }

  private calculateRetentionMetrics(events: AnalyticsEvent[]): RetentionMetrics {
    const byUser = new Map<string, Date[]>();
    events.forEach((e) => {
      if (!e.userId) return;
      if (!byUser.has(e.userId)) byUser.set(e.userId, []);
      byUser.get(e.userId)!.push(e.createdAt);
    });

    let day1 = 0;
    let day7 = 0;
    let day30 = 0;
    let day90 = 0;

    byUser.forEach((dates) => {
      const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
      const first = sorted[0];
      const hasAfter = (days: number) => {
        const target = new Date(first);
        target.setDate(target.getDate() + days);
        return sorted.some((d) => d.getTime() >= target.getTime());
      };
      if (hasAfter(1)) day1 += 1;
      if (hasAfter(7)) day7 += 1;
      if (hasAfter(30)) day30 += 1;
      if (hasAfter(90)) day90 += 1;
    });

    const totalUsers = byUser.size || 1;
    return {
      day1: (day1 / totalUsers) * 100,
      day7: (day7 / totalUsers) * 100,
      day30: (day30 / totalUsers) * 100,
      day90: (day90 / totalUsers) * 100,
    };
  }

  private calculateChangePercentage(points: DataPoint[]): number {
    if (points.length < 2) return 0;
    const first = points[0].value;
    const last = points[points.length - 1].value;
    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first) * 100;
  }

  private trendFromChange(change: number): 'up' | 'down' | 'stable' {
    if (change > 1) return 'up';
    if (change < -1) return 'down';
    return 'stable';
  }
}
