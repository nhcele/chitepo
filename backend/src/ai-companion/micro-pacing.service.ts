import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface LearningProfile {
  userId: string;
  preferredPace: 'fast' | 'moderate' | 'slow';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
  timeAvailable: number; // minutes per day
  completionRate: number;
  averageQuizScore: number;
  lastActiveDate: Date;
}

export interface PacingRecommendation {
  recommendedStudyTime: number; // minutes
  suggestedDifficulty: string;
  contentAdjustments: {
    videoSpeed: number; // 0.5x to 2.0x
    readingDensity: 'light' | 'medium' | 'dense';
    quizFrequency: number; // quizzes per lesson
  };
  motivationalMessage: string;
  nextMilestone: string;
}

@Injectable()
export class MicroPacingService {
  private openai: OpenAI;
  private provider: 'openai' | 'kimi';
  private model: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    this.provider = (this.configService.get<string>('AI_PROVIDER') || 'openai') as 'openai' | 'kimi';
    
    if (this.provider === 'kimi') {
      const kimiApiKey = this.configService.get<string>('KIMI_API_KEY');
      const kimiBaseUrl = this.configService.get<string>('KIMI_BASE_URL') || 'https://api.moonshot.cn/v1';
      this.model = this.configService.get<string>('KIMI_MODEL') || 'moonshot-v1-32k';
      
      if (kimiApiKey) {
        this.openai = new OpenAI({ apiKey: kimiApiKey, baseURL: kimiBaseUrl });
        console.log(`✅ Micro-Pacing: Kimi AI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  Kimi API key not configured. AI micro-pacing will be disabled.');
        this.openai = null as any;
      }
    } else {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
      
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        console.log(`✅ Micro-Pacing: OpenAI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  OpenAI API key not configured. AI micro-pacing will be disabled.');
        this.openai = null as any;
      }
    }
  }

  async analyzeLearningProfile(userId: string): Promise<LearningProfile> {
    // Check cache first
    const cacheKey = `profile:${userId}`;
    const cached = await this.cache.get<LearningProfile>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Get enrollment data
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
    });

    // Calculate learning metrics
    const completedCourses = enrollments.filter(e => e.completedAt).length;
    const totalCourses = enrollments.length;
    const completionRate = totalCourses > 0 ? completedCourses / totalCourses : 0;

    // Analyze activity patterns (simplified - in production would use detailed analytics)
    const daysSinceLastActive = Math.floor(
      (Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine learning patterns based on available data
    const profile: LearningProfile = {
      userId,
      preferredPace: this.determinePace(completionRate, daysSinceLastActive),
      learningStyle: 'visual', // Default - would be determined from user behavior
      difficultyPreference: 'intermediate', // Default - would be adaptive
      timeAvailable: 30, // Default - would be user preference
      completionRate,
      averageQuizScore: 75, // Default - would be calculated from quiz data
      lastActiveDate: user.updatedAt,
    };

    // Cache for 1 hour
    await this.cache.set(cacheKey, profile, 60 * 60 * 1000);
    return profile;
  }

  async generatePacingRecommendation(userId: string): Promise<PacingRecommendation> {
    const profile = await this.analyzeLearningProfile(userId);
    
    const prompt = `Based on this learner profile, generate a personalized pacing recommendation:

Learner Profile:
- Completion Rate: ${(profile.completionRate * 100).toFixed(1)}%
- Preferred Pace: ${profile.preferredPace}
- Time Available: ${profile.timeAvailable} minutes/day
- Days Since Last Active: ${Math.floor((Date.now() - profile.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))}
- Average Quiz Score: ${profile.averageQuizScore}%

Generate a JSON response with:
{
  "recommendedStudyTime": number (minutes),
  "suggestedDifficulty": "beginner|intermediate|advanced",
  "contentAdjustments": {
    "videoSpeed": number (0.5-2.0),
    "readingDensity": "light|medium|dense",
    "quizFrequency": number (1-5)
  },
  "motivationalMessage": "string",
  "nextMilestone": "string"
}

Consider:
- If completion rate is low (<50%), suggest shorter sessions and easier content
- If they haven't been active recently, suggest a gentle re-entry
- Adjust video speed based on their pace preference
- Provide encouraging, personalized motivation`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning analyst who creates personalized study recommendations. Be encouraging and practical.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Pacing recommendation error:', error);
      // Fallback recommendation
      return {
        recommendedStudyTime: 25,
        suggestedDifficulty: 'intermediate',
        contentAdjustments: {
          videoSpeed: 1.0,
          readingDensity: 'medium',
          quizFrequency: 2,
        },
        motivationalMessage: 'Welcome back! Let\'s continue your learning journey with a manageable study session.',
        nextMilestone: 'Complete your next lesson to stay on track',
      };
    }
  }

  async adaptContentDifficulty(
    userId: string, 
    currentContent: string, 
    userPerformance: number
  ): Promise<string> {
    const profile = await this.analyzeLearningProfile(userId);
    
    let adaptationInstruction = '';
    if (userPerformance < 60) {
      adaptationInstruction = 'Simplify this content significantly. Use simpler language, shorter sentences, and more examples.';
    } else if (userPerformance > 90) {
      adaptationInstruction = 'Make this content more challenging. Add advanced concepts, technical details, and complex scenarios.';
    } else {
      adaptationInstruction = 'Keep the difficulty level appropriate for an intermediate learner.';
    }

    const prompt = `${adaptationInstruction}

Original content:
${currentContent}

Adapt the content based on the learner's performance score of ${userPerformance}/100 and their ${profile.learningStyle} learning style.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert content adapter who personalizes learning materials based on individual performance.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || currentContent;
    } catch (error) {
      console.error('Content adaptation error:', error);
      return currentContent;
    }
  }

  async generateStudyPlan(
    userId: string, 
    courseId: string, 
    targetCompletionDate: Date
  ): Promise<any[]> {
    const profile = await this.analyzeLearningProfile(userId);
    
    const prompt = `Create a personalized study plan for a learner with:
- Preferred pace: ${profile.preferredPace}
- Time available: ${profile.timeAvailable} minutes/day
- Learning style: ${profile.learningStyle}
- Target completion date: ${targetCompletionDate.toISOString()}

Generate a JSON array of study sessions with this structure:
{
  "day": number,
  "duration": number (minutes),
  "activities": [
    {
      "type": "video|reading|quiz|practice",
      "title": "string",
      "estimatedTime": number (minutes),
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "goals": ["string"],
  "tips": ["string"]
}

Create 7 days of study sessions.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer who creates personalized study plans.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      return content ? JSON.parse(content) : [];
    } catch (error) {
      console.error('Study plan generation error:', error);
      return [];
    }
  }

  private determinePace(completionRate: number, daysSinceLastActive: number): 'fast' | 'moderate' | 'slow' {
    if (completionRate > 0.8 && daysSinceLastActive < 3) return 'fast';
    if (completionRate > 0.5 && daysSinceLastActive < 7) return 'moderate';
    return 'slow';
  }
}
