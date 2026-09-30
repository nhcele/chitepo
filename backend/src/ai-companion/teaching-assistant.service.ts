import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';
import { Lesson } from '../courses/entities/lesson.entity';

export interface ClassAnalytics {
  courseId: string;
  totalStudents: number;
  activeStudents: number;
  averagePerformance: number;
  completionRate: number;
  averageTimeSpent: number;
  strugglingTopics: Array<{
    topic: string;
    difficulty: number;
    studentsAffected: number;
    averageScore: number;
  }>;
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    averageSessionDuration: number;
    dropOffPoints: string[];
  };
  recommendedInterventions: string[];
  topPerformers: Array<{
    userId: string;
    score: number;
    completionRate: number;
  }>;
  atRiskStudents: Array<{
    userId: string;
    riskLevel: 'high' | 'medium';
    reasons: string[];
  }>;
}

export interface ContentFeedback {
  lessonId: string;
  clarity: number; // 0-100
  engagement: number; // 0-100
  difficulty: number; // 0-100
  pacing: 'too-fast' | 'appropriate' | 'too-slow';
  suggestions: Array<{
    type: 'improvement' | 'enhancement' | 'fix';
    priority: 'high' | 'medium' | 'low';
    description: string;
    specificSection?: string;
  }>;
  studentFeedbackSummary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface DiscussionPrompt {
  topic: string;
  prompt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedResponses: string[];
  followUpQuestions: string[];
  learningObjectives: string[];
}

export interface FAQResponse {
  question: string;
  answer: string;
  confidence: number;
  relatedTopics: string[];
  suggestedResources: string[];
  needsHumanReview: boolean;
}

@Injectable()
export class TeachingAssistantService {
  private openai: OpenAI;
  private provider: 'openai' | 'kimi';
  private model: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(LessonProgress) private readonly progressRepo: Repository<LessonProgress>,
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
  ) {
    this.provider = (this.configService.get<string>('AI_PROVIDER') || 'openai') as 'openai' | 'kimi';
    
    if (this.provider === 'kimi') {
      const kimiApiKey = this.configService.get<string>('KIMI_API_KEY');
      const kimiBaseUrl = this.configService.get<string>('KIMI_BASE_URL') || 'https://api.moonshot.cn/v1';
      this.model = this.configService.get<string>('KIMI_MODEL') || 'moonshot-v1-32k';
      
      if (kimiApiKey) {
        this.openai = new OpenAI({ apiKey: kimiApiKey, baseURL: kimiBaseUrl });
        console.log(`✅ Teaching Assistant: Kimi AI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  Kimi API key not configured. AI teaching assistant will be disabled.');
        this.openai = null as any;
      }
    } else {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
      
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        console.log(`✅ Teaching Assistant: OpenAI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  OpenAI API key not configured. AI teaching assistant will be disabled.');
        this.openai = null as any;
      }
    }
  }

  /**
   * Analyze class performance and provide insights
   */
  async analyzeClassPerformance(courseId: string): Promise<ClassAnalytics> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons']
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const enrollments = await this.enrollmentRepo.find({
      where: { courseId },
      relations: ['user']
    });

    const progressRecords = await this.progressRepo.find({
      where: { courseId }
    });

    const quizAttempts = await this.attemptRepo
      .createQueryBuilder('attempt')
      .innerJoin('attempt.quiz', 'quiz')
      .innerJoin('quiz.lesson', 'lesson')
      .innerJoin('lesson.module', 'module')
      .where('module.courseId = :courseId', { courseId })
      .getMany();

    // Calculate metrics
    const totalStudents = enrollments.length;
    const activeStudents = progressRecords.filter(p =>
      p.updatedAt &&
      (Date.now() - p.updatedAt.getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length;

    const averagePerformance = progressRecords.length > 0
      ? progressRecords.reduce((sum, p) => sum + (p.bestQuizScore || p.watchPercent || 0), 0) / progressRecords.length
      : 0;

    const completionRate = enrollments.filter(e => e.completedAt).length / Math.max(1, totalStudents) * 100;

    const averageTimeSpent = progressRecords.length > 0
      ? progressRecords.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / progressRecords.length / 60
      : 0;

    // Identify struggling topics
    const strugglingTopics = await this.identifyStrugglingTopics(courseId, quizAttempts);

    // Calculate engagement metrics
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const dailyActiveUsers = progressRecords.filter(p =>
      p.updatedAt && p.updatedAt.getTime() > oneDayAgo
    ).length;

    const weeklyActiveUsers = progressRecords.filter(p =>
      p.updatedAt && p.updatedAt.getTime() > oneWeekAgo
    ).length;

    const engagementMetrics = {
      dailyActiveUsers,
      weeklyActiveUsers,
      averageSessionDuration: averageTimeSpent,
      dropOffPoints: await this.identifyDropOffPoints(courseId, progressRecords)
    };

    // Identify top performers
    const topPerformers = progressRecords
      .sort((a, b) => (b.watchPercent || 0) - (a.watchPercent || 0))
      .slice(0, 5)
      .map(p => ({
        userId: p.userId,
        score: p.bestQuizScore ?? p.watchPercent ?? 0,
        completionRate: p.isCompleted ? 100 : (p.watchPercent || 0)
      }));

    // Identify at-risk students
    const atRiskStudents = this.identifyAtRiskStudents(progressRecords, quizAttempts);

    // Generate recommendations
    const recommendedInterventions = this.generateInterventions(
      averagePerformance,
      completionRate,
      activeStudents / totalStudents,
      strugglingTopics
    );

    return {
      courseId,
      totalStudents,
      activeStudents,
      averagePerformance,
      completionRate,
      averageTimeSpent,
      strugglingTopics,
      engagementMetrics,
      recommendedInterventions,
      topPerformers,
      atRiskStudents
    };
  }

  /**
   * Generate discussion prompts for engagement
   */
  async generateDiscussionPrompts(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    count: number = 3
  ): Promise<DiscussionPrompt[]> {
    const prompt = `Generate ${count} engaging discussion prompts for the topic: "${topic}"

Difficulty Level: ${difficulty}

Requirements:
1. Prompts should encourage critical thinking and discussion
2. Include open-ended questions that don't have single correct answers
3. Relate to real-world applications
4. Encourage students to share experiences and perspectives
5. Build on each other in complexity

Format as JSON array:
[
  {
    "topic": "Specific aspect of the main topic",
    "prompt": "The discussion question",
    "difficulty": "${difficulty}",
    "expectedResponses": ["Type of response 1", "Type of response 2"],
    "followUpQuestions": ["Follow-up question 1", "Follow-up question 2"],
    "learningObjectives": ["What students should learn from this discussion"]
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator who creates engaging discussion prompts that foster deep learning and critical thinking.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No prompts generated');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Discussion prompt generation error:', error);
      throw new Error('Failed to generate discussion prompts');
    }
  }

  /**
   * Auto-respond to common student questions
   */
  async respondToFAQ(
    question: string,
    courseContext: string,
    lessonContext?: string
  ): Promise<FAQResponse> {
    const prompt = `Answer this student question about the course:

Question: ${question}
Course Context: ${courseContext}
${lessonContext ? `Lesson Context: ${lessonContext}` : ''}

Provide a helpful, accurate answer. If the question requires specific course information you don't have, indicate that the instructor should review it.

Format as JSON:
{
  "answer": "Clear, helpful answer to the question",
  "confidence": 0.85,
  "relatedTopics": ["Related topic 1", "Related topic 2"],
  "suggestedResources": ["Resource 1", "Resource 2"],
  "needsHumanReview": false
}

Guidelines:
- Be clear and concise
- Use examples when helpful
- Reference course materials when possible
- If uncertain, set needsHumanReview to true
- Provide additional resources for deeper learning`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable teaching assistant who helps students understand course material.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response generated');
      }

      const faqResponse = JSON.parse(content);
      return {
        question,
        ...faqResponse
      };
    } catch (error) {
      console.error('FAQ response error:', error);
      return {
        question,
        answer: 'I apologize, but I need the instructor to review this question to provide an accurate answer.',
        confidence: 0,
        relatedTopics: [],
        suggestedResources: [],
        needsHumanReview: true
      };
    }
  }

  /**
   * Provide feedback on lesson content quality
   */
  async analyzeContentQuality(lessonId: string): Promise<ContentFeedback> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course', 'quizzes', 'quizzes.attempts']
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const progressRecords = await this.progressRepo
      .createQueryBuilder('progress')
      .where('progress.courseId = :courseId', { courseId: lesson.module.course.id })
      .getMany();

    // Analyze quiz performance for this lesson
    const quizAttempts = lesson.quizzes?.flatMap(q => q.attempts || []) || [];
    const avgQuizScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / quizAttempts.length
      : 0;

    // Calculate engagement metrics
    const avgWatchTime = progressRecords.length > 0
      ? progressRecords.reduce((sum, p) => sum + (p.watchedSeconds || 0), 0) / progressRecords.length
      : 0;

    const content = lesson.transcript || lesson.content || '';

    const prompt = `Analyze this lesson content for quality and effectiveness:

Lesson Title: ${lesson.title}
Content Length: ${content.length} characters
Average Quiz Score: ${avgQuizScore.toFixed(1)}%
Average Watch Time: ${(avgWatchTime / 60).toFixed(1)} minutes

Content Sample:
${content.substring(0, 2000)}

Provide analysis as JSON:
{
  "clarity": 85,
  "engagement": 75,
  "difficulty": 60,
  "pacing": "appropriate",
  "suggestions": [
    {
      "type": "improvement",
      "priority": "high",
      "description": "Specific suggestion",
      "specificSection": "Which part to improve"
    }
  ],
  "studentFeedbackSummary": "Overall impression based on metrics",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"]
}

Consider:
- Content clarity and organization
- Engagement level and interactivity
- Appropriate difficulty for target audience
- Pacing and information density
- Use of examples and analogies`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an instructional design expert who evaluates educational content quality.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });

      const contentResponse = response.choices[0]?.message?.content;
      if (!contentResponse) {
        throw new Error('No analysis generated');
      }

      const feedback = JSON.parse(contentResponse);
      return {
        lessonId,
        ...feedback
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      throw new Error('Failed to analyze content quality');
    }
  }

  /**
   * Generate personalized feedback for student submissions
   */
  async generateStudentFeedback(params: {
    studentId: string;
    assignmentTitle: string;
    submission: string;
    rubric: string;
    maxScore: number;
  }): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    encouragement: string;
  }> {
    const prompt = `Provide constructive feedback on this student submission:

Assignment: ${params.assignmentTitle}
Rubric: ${params.rubric}
Max Score: ${params.maxScore}

Student Submission:
${params.submission}

Provide feedback as JSON:
{
  "score": number (0 to ${params.maxScore}),
  "feedback": "Overall feedback paragraph",
  "strengths": ["What the student did well"],
  "improvements": ["Specific areas to improve"],
  "encouragement": "Encouraging message for the student"
}

Guidelines:
- Be constructive and encouraging
- Provide specific, actionable feedback
- Recognize effort and progress
- Suggest concrete next steps
- Balance critique with praise`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a supportive educator who provides constructive feedback that helps students grow.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No feedback generated');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Feedback generation error:', error);
      throw new Error('Failed to generate feedback');
    }
  }

  // Helper methods

  private async identifyStrugglingTopics(
    courseId: string,
    quizAttempts: QuizAttempt[]
  ): Promise<ClassAnalytics['strugglingTopics']> {
    // Group attempts by quiz and calculate average scores
    const quizScores = new Map<string, { scores: number[]; quizId: string }>();

    for (const attempt of quizAttempts) {
      const key = attempt.quizId;
      if (!quizScores.has(key)) {
        quizScores.set(key, { scores: [], quizId: key });
      }
      quizScores.get(key)!.scores.push(attempt.score);
    }

    const strugglingTopics: ClassAnalytics['strugglingTopics'] = [];

    for (const [quizId, data] of quizScores.entries()) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      if (avgScore < 70) {
        strugglingTopics.push({
          topic: `Quiz ${quizId.substring(0, 8)}`, // Would map to actual topic name
          difficulty: 100 - avgScore,
          studentsAffected: data.scores.length,
          averageScore: avgScore
        });
      }
    }

    return strugglingTopics.sort((a, b) => b.difficulty - a.difficulty).slice(0, 5);
  }

  private async identifyDropOffPoints(
    courseId: string,
    progressRecords: LessonProgress[]
  ): Promise<string[]> {
    // Simplified - would analyze lesson completion patterns
    const dropOffPoints: string[] = [];

    const incompleteCourses = progressRecords.filter(p => !p.isCompleted && p.watchPercent < 50);

    if (incompleteCourses.length > progressRecords.length * 0.3) {
      dropOffPoints.push('Mid-course content appears to be a barrier');
    }

    if (progressRecords.filter(p => p.watchPercent === 0).length > progressRecords.length * 0.2) {
      dropOffPoints.push('Many students not starting the course');
    }

    return dropOffPoints;
  }

  private identifyAtRiskStudents(
    progressRecords: LessonProgress[],
    quizAttempts: QuizAttempt[]
  ): ClassAnalytics['atRiskStudents'] {
    const atRisk: ClassAnalytics['atRiskStudents'] = [];

    for (const progress of progressRecords) {
      const reasons: string[] = [];
      let riskLevel: 'high' | 'medium' | null = null;

      // Check inactivity
      if (progress.updatedAt) {
        const daysSinceAccess = (Date.now() - progress.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceAccess > 14) {
          reasons.push('Inactive for over 2 weeks');
          riskLevel = 'high';
        } else if (daysSinceAccess > 7) {
          reasons.push('Inactive for over a week');
          riskLevel = riskLevel || 'medium';
        }
      }

      // Check performance
      const studentQuizzes = quizAttempts.filter(a => a.userId === progress.userId);
      if (studentQuizzes.length > 0) {
        const avgScore = studentQuizzes.reduce((sum, a) => sum + a.score, 0) / studentQuizzes.length;
        if (avgScore < 50) {
          reasons.push('Low quiz performance');
          riskLevel = 'high';
        } else if (avgScore < 70) {
          reasons.push('Below-average quiz performance');
          riskLevel = riskLevel || 'medium';
        }
      }

      // Check progress
      if (progress.watchPercent < 25 && !progress.isCompleted) {
        reasons.push('Low course progress');
        riskLevel = riskLevel || 'medium';
      }

      if (riskLevel && reasons.length > 0) {
        atRisk.push({
          userId: progress.userId,
          riskLevel,
          reasons
        });
      }
    }

    return atRisk.sort((a, b) => 
      (b.riskLevel === 'high' ? 1 : 0) - (a.riskLevel === 'high' ? 1 : 0)
    ).slice(0, 10);
  }

  private generateInterventions(
    averagePerformance: number,
    completionRate: number,
    engagementRate: number,
    strugglingTopics: ClassAnalytics['strugglingTopics']
  ): string[] {
    const interventions: string[] = [];

    if (averagePerformance < 70) {
      interventions.push('Consider adding supplementary materials or review sessions');
      interventions.push('Break down complex topics into smaller, digestible chunks');
    }

    if (completionRate < 60) {
      interventions.push('Send motivational messages highlighting student progress');
      interventions.push('Create milestone celebrations to boost engagement');
    }

    if (engagementRate < 0.5) {
      interventions.push('Increase interactive elements and discussions');
      interventions.push('Send personalized re-engagement emails');
    }

    if (strugglingTopics.length > 0) {
      interventions.push(`Focus on improving content for: ${strugglingTopics[0].topic}`);
      interventions.push('Offer live Q&A sessions for challenging topics');
    }

    return interventions;
  }
}
