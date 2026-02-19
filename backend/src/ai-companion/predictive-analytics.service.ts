import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface CompletionPrediction {
  probability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  projectedCompletionDate: Date | null;
  confidenceScore: number;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  recommendations: string[];
}

export interface SkillMasteryForecast {
  skill: string;
  currentLevel: number; // 0-100
  projectedLevel: number; // 0-100
  timeToMastery: number; // days
  confidence: number;
  milestones: Array<{
    level: number;
    estimatedDate: Date;
    requirements: string[];
  }>;
}

export interface LearnerRiskProfile {
  userId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  riskFactors: Array<{
    category: 'engagement' | 'performance' | 'time' | 'motivation';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
    urgency: number; // 1-5
  }>;
  interventionNeeded: boolean;
  suggestedInterventions: string[];
  lastUpdated: Date;
}

export interface StudyScheduleRecommendation {
  day: number;
  date: Date;
  duration: number; // minutes
  activities: Array<{
    type: 'video' | 'reading' | 'quiz' | 'practice' | 'review';
    title: string;
    estimatedTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    priority: 'high' | 'medium' | 'low';
  }>;
  goals: string[];
  tips: string[];
  energyLevel: 'high' | 'medium' | 'low';
}

@Injectable()
export class PredictiveAnalyticsService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Progress) private readonly progressRepo: Repository<Progress>,
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('⚠️  OpenAI API key not configured. AI predictive analytics will be disabled.');
      this.openai = null as any;
    }
  }

  /**
   * Predict course completion probability
   */
  async predictCompletion(userId: string, courseId: string): Promise<CompletionPrediction> {
    // Check cache first
    const cacheKey = `prediction:${userId}:${courseId}`;
    const cached = await this.cache.get<CompletionPrediction>(cacheKey);
    if (cached) return cached;

    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
      relations: ['course', 'course.modules', 'course.modules.lessons']
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const progress = await this.progressRepo.findOne({
      where: { userId, courseId }
    });

    const quizAttempts = await this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10
    });

    // Calculate metrics
    const daysSinceEnrollment = Math.floor(
      (Date.now() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const daysSinceLastAccess = progress?.lastAccessed
      ? Math.floor((Date.now() - progress.lastAccessed.getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceEnrollment;

    const completionRate = progress?.completed ? 100 : (progress?.score || 0);
    const avgQuizScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
      : 0;

    const watchTime = progress?.watchTime || 0;
    const totalLessons = enrollment.course?.modules?.reduce(
      (sum, m) => sum + (m.lessons?.length || 0), 0
    ) || 1;

    // Rule-based prediction model
    let probability = 50; // Base probability
    const factors: CompletionPrediction['factors'] = [];

    // Engagement factors
    if (daysSinceLastAccess <= 2) {
      probability += 20;
      factors.push({
        factor: 'Recent Activity',
        impact: 'positive',
        weight: 0.2,
        description: 'Active within the last 2 days'
      });
    } else if (daysSinceLastAccess <= 7) {
      probability += 10;
      factors.push({
        factor: 'Regular Activity',
        impact: 'positive',
        weight: 0.1,
        description: 'Active within the last week'
      });
    } else if (daysSinceLastAccess > 14) {
      probability -= 25;
      factors.push({
        factor: 'Inactive',
        impact: 'negative',
        weight: 0.25,
        description: `No activity for ${daysSinceLastAccess} days`
      });
    }

    // Progress factors
    if (completionRate > 75) {
      probability += 25;
      factors.push({
        factor: 'Strong Progress',
        impact: 'positive',
        weight: 0.25,
        description: `${completionRate.toFixed(0)}% complete`
      });
    } else if (completionRate > 50) {
      probability += 15;
      factors.push({
        factor: 'Good Progress',
        impact: 'positive',
        weight: 0.15,
        description: `${completionRate.toFixed(0)}% complete`
      });
    } else if (completionRate < 25 && daysSinceEnrollment > 14) {
      probability -= 20;
      factors.push({
        factor: 'Slow Progress',
        impact: 'negative',
        weight: 0.2,
        description: 'Low completion rate for time enrolled'
      });
    }

    // Performance factors
    if (avgQuizScore > 80) {
      probability += 15;
      factors.push({
        factor: 'High Quiz Performance',
        impact: 'positive',
        weight: 0.15,
        description: `Average quiz score: ${avgQuizScore.toFixed(0)}%`
      });
    } else if (avgQuizScore < 60 && quizAttempts.length > 2) {
      probability -= 15;
      factors.push({
        factor: 'Low Quiz Performance',
        impact: 'negative',
        weight: 0.15,
        description: `Average quiz score: ${avgQuizScore.toFixed(0)}%`
      });
    }

    // Time investment factors
    const avgWatchTimePerLesson = watchTime / totalLessons;
    if (avgWatchTimePerLesson > 300) { // 5 minutes per lesson
      probability += 10;
      factors.push({
        factor: 'Good Time Investment',
        impact: 'positive',
        weight: 0.1,
        description: 'Spending adequate time on lessons'
      });
    }

    // Normalize probability
    probability = Math.max(0, Math.min(100, probability));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (probability >= 70) riskLevel = 'low';
    else if (probability >= 40) riskLevel = 'medium';
    else riskLevel = 'high';

    // Generate recommendations
    const recommendations = this.generateCompletionRecommendations(
      probability,
      factors,
      completionRate,
      daysSinceLastAccess
    );

    // Project completion date
    let projectedCompletionDate: Date | null = null;
    if (completionRate > 0 && completionRate < 100) {
      const daysPerPercent = daysSinceEnrollment / completionRate;
      const remainingPercent = 100 - completionRate;
      const estimatedDaysRemaining = daysPerPercent * remainingPercent;
      projectedCompletionDate = new Date(Date.now() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
    }

    const prediction: CompletionPrediction = {
      probability,
      riskLevel,
      projectedCompletionDate,
      confidenceScore: quizAttempts.length > 3 ? 0.8 : 0.6,
      factors,
      recommendations
    };

    // Cache for 6 hours
    await this.cache.set(cacheKey, prediction, 6 * 60 * 60 * 1000);

    return prediction;
  }

  /**
   * Identify at-risk learners
   */
  async identifyAtRiskLearners(userId: string): Promise<LearnerRiskProfile> {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course']
    });

    const progressRecords = await this.progressRepo.find({
      where: { userId }
    });

    const quizAttempts = await this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20
    });

    const riskFactors: LearnerRiskProfile['riskFactors'] = [];
    let riskScore = 0;

    // Engagement risk
    const recentActivity = progressRecords.filter(p => 
      p.lastAccessed && 
      (Date.now() - p.lastAccessed.getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length;

    if (recentActivity === 0 && enrollments.length > 0) {
      riskScore += 30;
      riskFactors.push({
        category: 'engagement',
        severity: 'high',
        description: 'No activity in the past week',
        recommendation: 'Send re-engagement email with personalized content suggestions',
        urgency: 5
      });
    } else if (recentActivity < enrollments.length * 0.3) {
      riskScore += 15;
      riskFactors.push({
        category: 'engagement',
        severity: 'medium',
        description: 'Low engagement across enrolled courses',
        recommendation: 'Provide motivational nudge and highlight progress made',
        urgency: 3
      });
    }

    // Performance risk
    const recentQuizzes = quizAttempts.slice(0, 5);
    const avgRecentScore = recentQuizzes.length > 0
      ? recentQuizzes.reduce((sum, a) => sum + a.score, 0) / recentQuizzes.length
      : 0;

    if (avgRecentScore < 50 && recentQuizzes.length >= 3) {
      riskScore += 25;
      riskFactors.push({
        category: 'performance',
        severity: 'high',
        description: `Low quiz performance (${avgRecentScore.toFixed(0)}% average)`,
        recommendation: 'Offer additional support resources and tutoring',
        urgency: 4
      });
    } else if (avgRecentScore < 70 && recentQuizzes.length >= 3) {
      riskScore += 10;
      riskFactors.push({
        category: 'performance',
        severity: 'medium',
        description: 'Below-average quiz performance',
        recommendation: 'Suggest review of challenging topics',
        urgency: 2
      });
    }

    // Time management risk
    const incompleteCourses = enrollments.filter(e => !e.completedAt);
    if (incompleteCourses.length > 3) {
      riskScore += 15;
      riskFactors.push({
        category: 'time',
        severity: 'medium',
        description: `${incompleteCourses.length} incomplete courses`,
        recommendation: 'Help prioritize and create a focused study plan',
        urgency: 3
      });
    }

    // Motivation risk (declining engagement pattern)
    const sortedProgress = progressRecords
      .filter(p => p.lastAccessed)
      .sort((a, b) => b.lastAccessed!.getTime() - a.lastAccessed!.getTime());

    if (sortedProgress.length >= 3) {
      const recentGap = sortedProgress[0].lastAccessed!.getTime() - sortedProgress[1].lastAccessed!.getTime();
      const olderGap = sortedProgress[1].lastAccessed!.getTime() - sortedProgress[2].lastAccessed!.getTime();
      
      if (recentGap > olderGap * 2) {
        riskScore += 20;
        riskFactors.push({
          category: 'motivation',
          severity: 'high',
          description: 'Declining engagement pattern detected',
          recommendation: 'Reach out personally to understand barriers',
          urgency: 4
        });
      }
    }

    // Determine overall risk
    let overallRisk: LearnerRiskProfile['overallRisk'];
    if (riskScore >= 60) overallRisk = 'critical';
    else if (riskScore >= 40) overallRisk = 'high';
    else if (riskScore >= 20) overallRisk = 'medium';
    else overallRisk = 'low';

    const suggestedInterventions = this.generateInterventions(riskFactors, overallRisk);

    return {
      userId,
      overallRisk,
      riskScore,
      riskFactors,
      interventionNeeded: riskScore >= 40,
      suggestedInterventions,
      lastUpdated: new Date()
    };
  }

  /**
   * Forecast skill mastery timeline
   */
  async forecastSkillMastery(
    userId: string,
    skill: string,
    targetLevel: number = 100
  ): Promise<SkillMasteryForecast> {
    const progressRecords = await this.progressRepo.find({
      where: { userId },
      order: { lastAccessed: 'DESC' }
    });

    const quizAttempts = await this.attemptRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' }
    });

    // Calculate current level (simplified - would use more sophisticated skill tracking)
    const currentLevel = quizAttempts.length > 0
      ? quizAttempts.slice(-5).reduce((sum, a) => sum + a.score, 0) / Math.min(5, quizAttempts.length)
      : 0;

    // Calculate learning velocity
    let learningVelocity = 0;
    if (quizAttempts.length >= 3) {
      const recentScores = quizAttempts.slice(-3).map(a => a.score);
      const olderScores = quizAttempts.slice(-6, -3).map(a => a.score);
      
      if (olderScores.length > 0) {
        const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
        learningVelocity = recentAvg - olderAvg;
      }
    }

    // Project future level
    const remainingGap = targetLevel - currentLevel;
    const estimatedDays = learningVelocity > 0
      ? Math.ceil(remainingGap / (learningVelocity / 7)) // Assuming weekly improvement
      : remainingGap * 2; // Fallback estimate

    const projectedLevel = Math.min(targetLevel, currentLevel + (learningVelocity * 4)); // 4 weeks projection

    // Generate milestones
    const milestones: SkillMasteryForecast['milestones'] = [];
    const milestoneIntervals = [25, 50, 75, 90, 100];
    
    for (const level of milestoneIntervals) {
      if (level > currentLevel && level <= targetLevel) {
        const daysToMilestone = ((level - currentLevel) / remainingGap) * estimatedDays;
        milestones.push({
          level,
          estimatedDate: new Date(Date.now() + daysToMilestone * 24 * 60 * 60 * 1000),
          requirements: this.getMilestoneRequirements(level, skill)
        });
      }
    }

    return {
      skill,
      currentLevel: Math.round(currentLevel),
      projectedLevel: Math.round(projectedLevel),
      timeToMastery: Math.max(1, estimatedDays),
      confidence: quizAttempts.length >= 5 ? 0.75 : 0.5,
      milestones
    };
  }

  /**
   * Generate optimal study schedule
   */
  async generateOptimalSchedule(
    userId: string,
    courseId: string,
    targetCompletionDate: Date
  ): Promise<StudyScheduleRecommendation[]> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId, courseId },
      relations: ['course', 'course.modules', 'course.modules.lessons']
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const progress = await this.progressRepo.findOne({
      where: { userId, courseId }
    });

    const daysUntilTarget = Math.ceil(
      (targetCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const totalLessons = enrollment.course?.modules?.reduce(
      (sum, m) => sum + (m.lessons?.length || 0), 0
    ) || 0;

    const completionRate = progress?.score || 0;
    const remainingLessons = Math.ceil(totalLessons * (1 - completionRate / 100));

    const lessonsPerDay = Math.ceil(remainingLessons / Math.max(1, daysUntilTarget));
    const minutesPerDay = lessonsPerDay * 20; // Assume 20 min per lesson

    // Generate 7-day schedule
    const schedule: StudyScheduleRecommendation[] = [];
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      schedule.push({
        day: day + 1,
        date,
        duration: isWeekend ? Math.ceil(minutesPerDay * 0.7) : minutesPerDay,
        activities: this.generateDailyActivities(lessonsPerDay, day),
        goals: this.generateDailyGoals(day, lessonsPerDay),
        tips: this.generateDailyTips(day),
        energyLevel: this.determineEnergyLevel(date)
      });
    }

    return schedule;
  }

  // Helper methods

  private generateCompletionRecommendations(
    probability: number,
    factors: CompletionPrediction['factors'],
    completionRate: number,
    daysSinceLastAccess: number
  ): string[] {
    const recommendations: string[] = [];

    if (daysSinceLastAccess > 7) {
      recommendations.push('Resume learning with a short refresher lesson');
      recommendations.push('Set a specific time each day for studying');
    }

    if (completionRate < 50) {
      recommendations.push('Break down remaining content into smaller, manageable chunks');
      recommendations.push('Focus on completing one module at a time');
    }

    if (probability < 50) {
      recommendations.push('Consider adjusting your target completion date');
      recommendations.push('Connect with study groups or find an accountability partner');
      recommendations.push('Review your learning goals and motivation');
    }

    const negativeFactors = factors.filter(f => f.impact === 'negative');
    if (negativeFactors.length > 0) {
      recommendations.push(`Address key challenge: ${negativeFactors[0].description}`);
    }

    return recommendations;
  }

  private generateInterventions(
    riskFactors: LearnerRiskProfile['riskFactors'],
    overallRisk: string
  ): string[] {
    const interventions: string[] = [];

    if (overallRisk === 'critical' || overallRisk === 'high') {
      interventions.push('Schedule 1-on-1 check-in with learning advisor');
      interventions.push('Provide personalized study plan with achievable milestones');
    }

    const highUrgencyFactors = riskFactors.filter(f => f.urgency >= 4);
    highUrgencyFactors.forEach(factor => {
      interventions.push(factor.recommendation);
    });

    if (riskFactors.some(f => f.category === 'performance')) {
      interventions.push('Offer supplementary learning resources');
      interventions.push('Enable adaptive difficulty mode');
    }

    if (riskFactors.some(f => f.category === 'engagement')) {
      interventions.push('Send personalized progress report');
      interventions.push('Highlight achievements and milestones reached');
    }

    return [...new Set(interventions)]; // Remove duplicates
  }

  private getMilestoneRequirements(level: number, skill: string): string[] {
    const requirements: { [key: number]: string[] } = {
      25: ['Complete foundational lessons', 'Pass basic quizzes'],
      50: ['Complete intermediate modules', 'Achieve 70%+ on assessments'],
      75: ['Complete advanced content', 'Apply concepts in practice exercises'],
      90: ['Master all core concepts', 'Achieve 85%+ on final assessments'],
      100: ['Complete capstone project', 'Demonstrate expert-level proficiency']
    };

    return requirements[level] || ['Continue learning and practicing'];
  }

  private generateDailyActivities(
    lessonsPerDay: number,
    day: number
  ): StudyScheduleRecommendation['activities'] {
    const activities: StudyScheduleRecommendation['activities'] = [];

    // Video lessons
    for (let i = 0; i < Math.min(lessonsPerDay, 2); i++) {
      activities.push({
        type: 'video',
        title: `Lesson ${day * lessonsPerDay + i + 1}`,
        estimatedTime: 15,
        difficulty: 'intermediate',
        priority: 'high'
      });
    }

    // Reading
    if (day % 2 === 0) {
      activities.push({
        type: 'reading',
        title: 'Supplementary reading',
        estimatedTime: 10,
        difficulty: 'intermediate',
        priority: 'medium'
      });
    }

    // Quiz
    if (day % 3 === 0) {
      activities.push({
        type: 'quiz',
        title: 'Knowledge check',
        estimatedTime: 10,
        difficulty: 'intermediate',
        priority: 'high'
      });
    }

    // Practice
    activities.push({
      type: 'practice',
      title: 'Apply what you learned',
      estimatedTime: 15,
      difficulty: 'intermediate',
      priority: 'medium'
    });

    return activities;
  }

  private generateDailyGoals(day: number, lessonsPerDay: number): string[] {
    return [
      `Complete ${lessonsPerDay} lessons`,
      'Take notes on key concepts',
      'Practice with exercises',
      day % 3 === 0 ? 'Complete module quiz' : 'Review previous material'
    ];
  }

  private generateDailyTips(day: number): string[] {
    const tips = [
      ['Start with the most challenging topic while your mind is fresh', 'Take a 5-minute break every 25 minutes'],
      ['Review yesterday\'s material before starting new content', 'Use the Feynman technique: explain concepts in simple terms'],
      ['Practice active recall instead of passive reading', 'Connect new concepts to what you already know'],
      ['Test yourself frequently to strengthen memory', 'Study in a distraction-free environment'],
      ['Teach the material to someone else or write about it', 'Use visual aids and diagrams to understand complex topics'],
      ['Focus on understanding, not memorization', 'Get adequate sleep to consolidate learning'],
      ['Review the week\'s progress and identify areas for improvement', 'Celebrate your achievements, no matter how small']
    ];

    return tips[day % tips.length];
  }

  private determineEnergyLevel(date: Date): 'high' | 'medium' | 'low' {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Weekend mornings
    if ((dayOfWeek === 0 || dayOfWeek === 6) && hour >= 9 && hour < 12) {
      return 'high';
    }

    // Weekday mornings
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 8 && hour < 11) {
      return 'high';
    }

    // Afternoons
    if (hour >= 14 && hour < 17) {
      return 'medium';
    }

    // Evenings and late nights
    return 'low';
  }
}
