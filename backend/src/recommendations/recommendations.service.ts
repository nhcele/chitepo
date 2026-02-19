import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { AiCompanionService } from '../ai-companion/ai-companion.service';

export interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  matchScore: number;
  reason: string;
  estimatedDuration: number;
  skills: string[];
  tags: string[];
}

export interface LearningPathRecommendation {
  courseId: string;
  title: string;
  order: number;
  reason: string;
  prerequisites: string[];
}

export interface NextBestModuleRecommendation {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  moduleOrder: number;
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  nextLesson?: {
    lessonId: string;
    title: string;
    orderIndex: number;
    type: string;
    hasQuiz: boolean;
  };
  reason: string;
  aiReason?: string;
  tips?: string[];
  source: 'rules' | 'rules+ai';
}

export interface NextBestModuleResponse {
  recommendation: NextBestModuleRecommendation | null;
  reason?: string;
}

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Progress)
    private readonly progressRepo: Repository<Progress>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepo: Repository<QuizAttempt>,
    private readonly aiCompanionService: AiCompanionService,
  ) {}

  /**
   * Get personalized course recommendations based on progress and performance
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<CourseRecommendation[]> {
    // Get user's enrollment history
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
    });

    // Get user's progress data
    const progressRecords = await this.progressRepo.find({
      where: { userId },
      relations: ['course'],
    });

    // Get user's quiz attempts for performance analysis
    const quizAttempts = await this.quizAttemptRepo.find({
      where: { userId },
      relations: ['quiz'],
    });

    // Analyze user's learning patterns
    const completedCourses = enrollments.filter((e) => e.completedAt).map((e) => e.course);
    const inProgressCourses = enrollments.filter((e) => !e.completedAt).map((e) => e.course);

    // Calculate performance metrics
    const averageScore = this.calculateAverageScore(quizAttempts, progressRecords);
    const preferredDifficulty = this.inferPreferredDifficulty(completedCourses, progressRecords);
    const skillInterests = this.extractSkillInterests(completedCourses, inProgressCourses);
    const categoryPreferences = this.extractCategoryPreferences(completedCourses);

    // Get all published courses excluding already enrolled ones
    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const availableCourses = await this.courseRepo.find({
      where: { status: 'published' as any },
    });

    const candidateCourses = availableCourses.filter((c) => !enrolledCourseIds.includes(c.id));

    // Score and rank courses
    const recommendations = candidateCourses
      .map((course) => {
        const matchScore = this.calculateMatchScore(
          course,
          {
            averageScore,
            preferredDifficulty,
            skillInterests,
            categoryPreferences,
            completedCourses,
            inProgressCourses,
          },
        );

        return {
          courseId: course.id,
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          category: course.category,
          matchScore,
          reason: this.generateRecommendationReason(course, {
            averageScore,
            preferredDifficulty,
            skillInterests,
            categoryPreferences,
          }),
          estimatedDuration: course.estimatedDuration || 0,
          skills: course.skills || [],
          tags: course.tags || [],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Get learning path recommendations based on progress
   */
  async getLearningPathRecommendations(userId: string): Promise<LearningPathRecommendation[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
    });

    const completedCourses = enrollments.filter((e) => e.completedAt).map((e) => e.course);
    const skillInterests = this.extractSkillInterests(completedCourses, []);

    // Find courses that build on completed skills
    const allCourses = await this.courseRepo.find({
      where: { status: 'published' as any },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const nextCourses = allCourses.filter((c) => !enrolledCourseIds.includes(c.id));

    // Build learning path based on prerequisites and skill progression
    const learningPath: LearningPathRecommendation[] = [];
    let order = 1;

    for (const course of nextCourses) {
      const prerequisites = this.inferPrerequisites(course, completedCourses);
      const hasPrerequisites = prerequisites.length === 0 || 
        prerequisites.every((prereq) => completedCourses.some((c) => c.id === prereq));

      if (hasPrerequisites) {
        learningPath.push({
          courseId: course.id,
          title: course.title,
          order: order++,
          reason: this.generateLearningPathReason(course, completedCourses, skillInterests),
          prerequisites,
        });
      }
    }

    return learningPath.slice(0, 10); // Limit to top 10
  }

  /**
   * Get recommendations for struggling students
   */
  async getStrugglingStudentRecommendations(userId: string): Promise<CourseRecommendation[]> {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
    });

    const progressRecords = await this.progressRepo.find({
      where: { userId },
    });

    const quizAttempts = await this.quizAttemptRepo.find({
      where: { userId },
    });

    // Identify struggling areas
    const lowScores = quizAttempts.filter((a) => a.score < 60);
    const slowProgress = progressRecords.filter(
      (p) => p.watchTime > 0 && !p.completed && p.lastAccessed && 
      new Date(p.lastAccessed) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );

    // Recommend remedial or foundational courses
    const allCourses = await this.courseRepo.find({
      where: { status: 'published' as any },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const availableCourses = allCourses.filter((c) => !enrolledCourseIds.includes(c.id));

    // Prioritize beginner-friendly courses
    const recommendations = availableCourses
      .filter((c) => c.difficulty === 'beginner')
      .map((course) => ({
        courseId: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        category: course.category,
        matchScore: 75, // High score for struggling students
        reason: 'Recommended to strengthen foundational knowledge and improve learning confidence.',
        estimatedDuration: course.estimatedDuration || 0,
        skills: course.skills || [],
        tags: course.tags || [],
      }))
      .slice(0, 5);

    return recommendations;
  }

  /**
   * Get next-best module recommendation for a user (rules + optional AI)
   */
  async getNextBestModuleRecommendation(userId: string, courseId?: string): Promise<NextBestModuleResponse> {
    if (!userId) {
      return { recommendation: null, reason: 'User not provided.' };
    }

    let targetCourseId = courseId;
    let targetEnrollment: Enrollment | null = null;

    if (!targetCourseId) {
      targetEnrollment = await this.enrollmentRepo.findOne({
        where: { userId, completedAt: IsNull() },
        order: { lastLessonSeenAt: 'DESC', enrolledAt: 'DESC' },
      });

      if (!targetEnrollment) {
        targetEnrollment = await this.enrollmentRepo.findOne({
          where: { userId },
          order: { enrolledAt: 'DESC' },
        });
      }

      targetCourseId = targetEnrollment?.courseId;
    }

    if (!targetCourseId) {
      return { recommendation: null, reason: 'No enrolled courses found.' };
    }

    if (courseId) {
      const enrollment = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
      if (!enrollment) {
        return { recommendation: null, reason: 'You are not enrolled in this course.' };
      }
    }

    const course = await this.courseRepo.findOne({
      where: { id: targetCourseId },
      relations: ['modules', 'modules.lessons'],
    });

    if (!course || !course.modules || course.modules.length === 0) {
      return { recommendation: null, reason: 'Course has no modules to recommend.' };
    }

    const progressRecords = await this.progressRepo.find({
      where: { userId, courseId: targetCourseId },
      order: { lastAccessed: 'DESC' },
    });

    const progressByLessonId = new Map<string, Progress>();
    progressRecords.forEach((p) => {
      if (p.lessonId) {
        progressByLessonId.set(p.lessonId, p);
      }
    });

    const modules = course.modules
      .map((module) => ({
        ...module,
        lessons: (module.lessons || [])
          .filter((lesson) => lesson.isPublished !== false)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
      }))
      .filter((module) => (module.lessons || []).length > 0)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    if (modules.length === 0) {
      return { recommendation: null, reason: 'No published lessons found in this course.' };
    }

    const moduleStats = modules.map((module) => {
      const lessons = module.lessons || [];
      const completedLessons = lessons.filter((lesson) => progressByLessonId.get(lesson.id)?.completed).length;
      const totalLessons = lessons.length;
      return {
        module,
        lessons,
        completedLessons,
        totalLessons,
      };
    });

    let selected = moduleStats.find(
      (m) => m.completedLessons > 0 && m.completedLessons < m.totalLessons,
    );

    if (!selected) {
      selected = moduleStats.find((m, index) => {
        if (m.completedLessons > 0) return false;
        const previousCompleted = moduleStats
          .slice(0, index)
          .every((prev) => prev.completedLessons >= prev.totalLessons);
        return previousCompleted;
      });
    }

    if (!selected) {
      selected = moduleStats[0];
    }

    if (!selected) {
      return { recommendation: null, reason: 'Unable to determine next module.' };
    }

    const nextLesson = selected.lessons.find(
      (lesson) => !progressByLessonId.get(lesson.id)?.completed,
    );

    const completionPercent =
      selected.totalLessons > 0
        ? Math.round((selected.completedLessons / selected.totalLessons) * 100)
        : 0;

    const ruleReason = this.buildModuleRuleReason({
      completedLessons: selected.completedLessons,
      totalLessons: selected.totalLessons,
      moduleTitle: selected.module.title,
    });

    const recommendation: NextBestModuleRecommendation = {
      courseId: course.id,
      courseTitle: course.title,
      moduleId: selected.module.id,
      moduleTitle: selected.module.title,
      moduleOrder: selected.module.orderIndex ?? 0,
      totalLessons: selected.totalLessons,
      completedLessons: selected.completedLessons,
      completionPercent,
      nextLesson: nextLesson
        ? {
            lessonId: nextLesson.id,
            title: nextLesson.title,
            orderIndex: nextLesson.orderIndex ?? 0,
            type: nextLesson.type,
            hasQuiz: nextLesson.hasQuiz,
          }
        : undefined,
      reason: ruleReason,
      source: 'rules',
    };

    const aiEnhancement = await this.tryEnhanceWithAi({
      courseTitle: course.title,
      moduleTitle: selected.module.title,
      moduleSummary: selected.module.summary || '',
      completionPercent,
      nextLessonTitle: nextLesson?.title || '',
    });

    if (aiEnhancement) {
      recommendation.aiReason = aiEnhancement.aiReason;
      recommendation.tips = aiEnhancement.tips;
      recommendation.source = 'rules+ai';
    }

    return { recommendation };
  }

  // Helper methods

  private calculateAverageScore(quizAttempts: any[], progressRecords: Progress[]): number {
    const scores: number[] = [];

    quizAttempts.forEach((attempt) => {
      if (attempt.score !== null && attempt.score !== undefined) {
        scores.push(Number(attempt.score));
      }
    });

    progressRecords.forEach((progress) => {
      if (progress.score !== null && progress.score !== undefined) {
        scores.push(Number(progress.score));
      }
    });

    if (scores.length === 0) return 70; // Default average
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private inferPreferredDifficulty(completedCourses: Course[], progressRecords: Progress[]): string {
    if (completedCourses.length === 0) return 'beginner';

    const difficultyCounts: Record<string, number> = {};
    completedCourses.forEach((course) => {
      difficultyCounts[course.difficulty] = (difficultyCounts[course.difficulty] || 0) + 1;
    });

    // Return most common difficulty, or next level up
    const sorted = Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'beginner';
  }

  private extractSkillInterests(completedCourses: Course[], inProgressCourses: Course[]): string[] {
    const skills = new Set<string>();

    [...completedCourses, ...inProgressCourses].forEach((course) => {
      if (course.skills) {
        course.skills.forEach((skill) => skills.add(skill));
      }
    });

    return Array.from(skills);
  }

  private extractCategoryPreferences(completedCourses: Course[]): string[] {
    const categories = new Set<string>();

    completedCourses.forEach((course) => {
      if (course.category) {
        categories.add(course.category);
      }
    });

    return Array.from(categories);
  }

  private calculateMatchScore(
    course: Course,
    userProfile: {
      averageScore: number;
      preferredDifficulty: string;
      skillInterests: string[];
      categoryPreferences: string[];
      completedCourses: Course[];
      inProgressCourses: Course[];
    },
  ): number {
    let score = 50; // Base score

    // Difficulty match
    if (course.difficulty === userProfile.preferredDifficulty) {
      score += 20;
    } else if (this.isNextDifficultyLevel(course.difficulty, userProfile.preferredDifficulty)) {
      score += 15;
    }

    // Skill interest match
    if (course.skills) {
      const matchingSkills = course.skills.filter((skill) =>
        userProfile.skillInterests.includes(skill),
      );
      score += matchingSkills.length * 10;
    }

    // Category preference match
    if (course.category && userProfile.categoryPreferences.includes(course.category)) {
      score += 15;
    }

    // Tag relevance (if tags exist)
    if (course.tags && course.tags.length > 0) {
      score += 5;
    }

    // Penalize if already in progress
    if (userProfile.inProgressCourses.some((c) => c.id === course.id)) {
      score -= 30;
    }

    // Normalize to 0-100
    return Math.min(100, Math.max(0, score));
  }

  private isNextDifficultyLevel(level1: string, level2: string): boolean {
    const levels = ['beginner', 'intermediate', 'advanced'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    return index1 === index2 + 1;
  }

  private generateRecommendationReason(
    course: Course,
    userProfile: {
      averageScore: number;
      preferredDifficulty: string;
      skillInterests: string[];
      categoryPreferences: string[];
    },
  ): string {
    const reasons: string[] = [];

    if (course.difficulty === userProfile.preferredDifficulty) {
      reasons.push(`Matches your preferred difficulty level (${userProfile.preferredDifficulty})`);
    }

    if (course.skills && course.skills.some((skill) => userProfile.skillInterests.includes(skill))) {
      reasons.push('Builds on skills you\'ve shown interest in');
    }

    if (course.category && userProfile.categoryPreferences.includes(course.category)) {
      reasons.push(`In your preferred category: ${course.category}`);
    }

    if (reasons.length === 0) {
      return 'Recommended based on your learning history and performance';
    }

    return reasons.join('. ') + '.';
  }

  private inferPrerequisites(course: Course, completedCourses: Course[]): string[] {
    // Simple heuristic: if course has skills that match completed courses, those are prerequisites
    if (!course.skills || course.skills.length === 0) return [];

    const prerequisites: string[] = [];
    completedCourses.forEach((completed) => {
      if (completed.skills && completed.skills.some((skill) => course.skills?.includes(skill))) {
        prerequisites.push(completed.id);
      }
    });

    return prerequisites;
  }

  private generateLearningPathReason(
    course: Course,
    completedCourses: Course[],
    skillInterests: string[],
  ): string {
    if (course.skills && course.skills.some((skill) => skillInterests.includes(skill))) {
      return `Builds on your existing skills and completes your learning path`;
    }
    return `Next logical step in your learning journey`;
  }

  private buildModuleRuleReason(params: {
    completedLessons: number;
    totalLessons: number;
    moduleTitle: string;
  }): string {
    const { completedLessons, totalLessons, moduleTitle } = params;
    if (totalLessons === 0) {
      return 'This module has no lessons yet.';
    }
    if (completedLessons === 0) {
      return `Start "${moduleTitle}" to build the next core concepts in sequence.`;
    }
    if (completedLessons < totalLessons) {
      return `You are already partway through "${moduleTitle}". Finishing it keeps your momentum and unlocks what follows.`;
    }
    return `You completed "${moduleTitle}". Keep progressing to the next module.`;
  }

  private async tryEnhanceWithAi(params: {
    courseTitle: string;
    moduleTitle: string;
    moduleSummary: string;
    completionPercent: number;
    nextLessonTitle: string;
  }): Promise<{ aiReason: string; tips: string[] } | null> {
    try {
      const enabled = await this.aiCompanionService.isFeatureEnabled();
      if (!enabled) return null;
    } catch {
      return null;
    }

    const prompt = `You are a learning coach. Provide a short AI rationale and 2-3 tips for a learner's next-best module.

Course: ${params.courseTitle}
Module: ${params.moduleTitle}
Module Summary: ${params.moduleSummary || 'N/A'}
Completion: ${params.completionPercent}%
Next Lesson: ${params.nextLessonTitle || 'N/A'}

Respond with ONLY valid JSON:
{
  "aiReason": "1-2 sentences",
  "tips": ["tip 1", "tip 2"]
}`;

    try {
      const response = await this.aiCompanionService.generateResponse(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
      const aiReason = typeof parsed.aiReason === 'string' ? parsed.aiReason : '';
      const tips = Array.isArray(parsed.tips) ? parsed.tips.filter((t) => typeof t === 'string') : [];
      if (!aiReason && tips.length === 0) return null;
      return { aiReason, tips: tips.slice(0, 3) };
    } catch {
      return null;
    }
  }
}

