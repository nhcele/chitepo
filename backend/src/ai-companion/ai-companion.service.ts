import { Injectable, Inject, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from '../courses/entities/lesson.entity';
import { User } from '../users/entities/user.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AiCompanionService {
  private openai: OpenAI;
  private provider: 'openai' | 'kimi';
  private model: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Progress) private readonly progressRepo: Repository<Progress>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    this.provider = (this.configService.get<string>('AI_PROVIDER') || 'openai') as 'openai' | 'kimi';
    
    if (this.provider === 'kimi') {
      // Kimi (Moonshot AI) configuration
      const kimiApiKey = this.configService.get<string>('KIMI_API_KEY');
      const kimiBaseUrl = this.configService.get<string>('KIMI_BASE_URL') || 'https://api.moonshot.cn/v1';
      this.model = this.configService.get<string>('KIMI_MODEL') || 'moonshot-v1-32k';
      
      if (kimiApiKey) {
        this.openai = new OpenAI({
          apiKey: kimiApiKey,
          baseURL: kimiBaseUrl,
        });
        console.log(`✅ Kimi AI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  Kimi API key not configured. AI companion features will be disabled.');
        this.openai = null as any;
      }
    } else {
      // OpenAI configuration (default)
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
      
      if (apiKey) {
        this.openai = new OpenAI({
          apiKey,
          baseURL: this.configService.get<string>('AZURE_OPENAI_ENDPOINT') || undefined,
        });
        console.log(`✅ OpenAI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  OpenAI API key not configured. AI companion features will be disabled.');
        this.openai = null as any;
      }
    }
  }

  async isFeatureEnabled(): Promise<boolean> {
    return this.configService.get('AI_COMPANION_ENABLED') === 'true';
  }

  // Chat with simple transcript-grounded retrieval
  async chatRag(params: {
    userId: string;
    lessonId: string;
    mode: 'answer' | 'summarize' | 'explain';
    level?: 5 | 15 | 25;
    message?: string;
  }): Promise<{ text: string; sources: string[]; remaining: number }> {
    const { userId, lessonId, mode, level = 15, message = '' } = params;
    const remaining = await this.checkRateLimit(userId);
    const lesson = await this.lessonRepo.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const transcript = lesson.transcript || '';
    const chunks = this.chunk(transcript);
    const top = mode === 'summarize' ? chunks.slice(0, 3) : this.selectRelevantChunks(chunks, message || lesson.title || '');

    const readingLevel = level === 5
      ? 'Explain like I am 5 years old.'
      : level === 25
      ? 'Explain for an experienced professional with depth.'
      : 'Explain for a high-school/early-career learner.';
    const modeInstr =
      mode === 'summarize'
        ? 'Summarize the transcript succinctly with 3-5 bullets. Include key definitions and steps.'
        : mode === 'explain'
        ? 'Explain the concept clearly with examples and analogies grounded in the provided transcript.'
        : 'Answer the user question using only the transcript facts. If unknown, say you cannot find it in the transcript.';

    const systemPrompt = `You are Mindelta AI. Be concise, cite transcript snippets when possible. Do not fabricate.`;
    const userContent = `Mode: ${mode}\n${modeInstr}\nLesson: ${lesson.title}\n${readingLevel}\n\nRelevant transcript snippets:\n---\n${top.join('\n\n---\n')}\n\nUser message: ${message}`;

    let text = '';
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 600,
      });
      text = completion.choices[0]?.message?.content || '';
    } catch (err: any) {
      // Surface a friendlier error but avoid leaking internals
      throw new HttpException(
        'AI service is unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const sources = top.slice(0, 2);
    return { text, sources, remaining };
  }

  private async checkRateLimit(userId: string): Promise<number> {
    const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `rl:${userId}:${dateKey}`;
    let current = 0;
    try {
      current = Number((await this.cache.get(key)) || 0);
    } catch (_e) {
      // If cache is unavailable, disable rate limiting instead of failing hard
      return 30; // optimistic remaining when cache fails
    }
    const limit = 30;
    if (current >= limit) {
      throw new HttpException('Daily AI Companion limit reached (30). Try again tomorrow.', HttpStatus.TOO_MANY_REQUESTS);
    }
    try {
      await this.cache.set(key, current + 1, 24 * 60 * 60 * 1000);
    } catch (_e) {
      // Ignore cache set failures
    }
    return limit - (current + 1);
  }

  async getRemainingQuota(userId: string): Promise<{ remaining: number; limit: number }> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const key = `rl:${userId}:${dateKey}`;
    let current = 0;
    try {
      current = Number((await this.cache.get(key)) || 0);
    } catch (_e) {
      // If cache unavailable, report full limit remaining
      return { remaining: 30, limit: 30 };
    }
    const limit = 30;
    return { remaining: Math.max(0, limit - current), limit };
  }

  private chunk(text: string): string[] {
    if (!text) return [];
    // Simple chunking by paragraphs, max ~800 tokens per chunk heuristic
    const paras = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
    const chunks: string[] = [];
    let buf: string[] = [];
    let len = 0;
    for (const p of paras) {
      const l = p.length;
      if (len + l > 3000 && buf.length) { // ~approx tokens
        chunks.push(buf.join('\n\n'));
        buf = [p];
        len = l;
      } else {
        buf.push(p);
        len += l;
      }
    }
    if (buf.length) chunks.push(buf.join('\n\n'));
    return chunks;
  }

  private selectRelevantChunks(chunks: string[], query: string, k = 3): string[] {
    if (!chunks.length) return [];
    const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const scored = chunks.map((c) => {
      const lc = c.toLowerCase();
      let score = 0;
      for (const t of terms) score += (lc.match(new RegExp(`\\b${t}\\b`, 'g')) || []).length;
      // length penalty (prefer mid-size)
      const L = c.length;
      const penalty = Math.abs(L - 1500) / 1500;
      return { c, s: score - penalty };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, k).map((x) => x.c);
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    if (!this.openai) {
      console.error('AI provider not initialized');
      throw new HttpException('AI service is not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const systemPrompt = `You are Mindelta AI, a helpful learning companion for the Mindelta professional learning platform. 
      You help learners understand course content, answer questions, and provide personalized guidance.
      Be encouraging, concise, and educational in your responses.`;

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
    } catch (error) {
      console.error('AI Companion error:', error);
      throw new HttpException('AI service error: ' + (error?.message || 'Unknown error'), HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async generateQuizQuestions(courseContent: string, count: number = 5): Promise<any[]> {
    const prompt = `Based on the following course content, generate ${count} multiple-choice quiz questions with 4 options each and indicate the correct answer:

    Course Content:
    ${courseContent}

    IMPORTANT: Respond with ONLY a valid JSON array, no markdown formatting, no code blocks, no explanatory text.
    
    Format the response as a JSON array of questions with this exact structure:
    [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Why this is correct"
      }
    ]`;

    try {
      const response = await this.generateResponse(prompt);
      
      // Extract JSON from markdown code blocks if present
      let jsonStr = response.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else if (jsonStr.startsWith('```')) {
        // Remove code block markers
        jsonStr = jsonStr.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
      }
      
      const questions = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!Array.isArray(questions) || questions.length === 0) {
        console.error('Invalid quiz format: not an array or empty');
        return [];
      }
      
      // Validate each question has required fields
      const validQuestions = questions.filter(q => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length >= 2 && 
        q.correctAnswer
      );
      
      if (validQuestions.length === 0) {
        console.error('No valid questions generated');
        return [];
      }
      
      return validQuestions;
    } catch (error) {
      console.error('Quiz generation error:', error);
      if (error instanceof SyntaxError) {
        console.error('JSON parsing failed. This usually means the AI response was not valid JSON.');
      }
      return [];
    }
  }

  async provideFeedback(userAnswer: string, correctAnswer: string, question: string): Promise<string> {
    const prompt = `A learner answered "${userAnswer}" to the question "${question}". The correct answer is "${correctAnswer}". 
    Provide encouraging feedback that explains why the correct answer is right and helps the learner understand the concept better.`;

    return this.generateResponse(prompt);
  }

  async suggestLearningPath(userProfile: any, completedCourses: string[]): Promise<string[]> {
    const prompt = `Based on a learner's profile and completed courses, suggest 3-5 relevant courses they should take next:
    
    User Profile: ${JSON.stringify(userProfile)}
    Completed Courses: ${completedCourses.join(', ')}
    
    Respond with just a JSON array of course titles.`;

    try {
      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Learning path suggestion error:', error);
      return [];
    }
  }

  async explainConcept(concept: string, context?: string): Promise<string> {
    const prompt = `Explain the concept "${concept}" in simple terms for a professional learner. ${context ? `Context: ${context}` : ''}
    Make it practical and include examples where possible.`;

    return this.generateResponse(prompt);
  }

  async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const progress = await this.progressRepo.find({ where: { userId } });
    
    const prompt = `Based on a learner's profile and progress, generate personalized learning recommendations:
    
    User Profile: ${JSON.stringify({
      interests: user?.skillInterests || [],
      role: user?.role || 'learner',
      jobTitle: user?.jobTitle || 'Professional'
    })}
    
    Recent Progress: ${progress.map(p => `${p.courseId}: ${p.completed ? 'completed' : 'in progress'}`).join(', ')}
    
    Generate 3-5 personalized recommendations with this JSON structure:
    {
      "type": "course" | "lesson" | "exercise" | "resource",
      "title": "Title of recommendation",
      "description": "Detailed description",
      "difficulty": "beginner" | "intermediate" | "advanced",
      "estimatedTime": "Time estimate",
      "priority": "high" | "medium" | "low",
      "reason": "Why this is recommended"
    }`;

    try {
      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Recommendations generation error:', error);
      return [];
    }
  }

  async getProgressInsights(userId: string): Promise<any[]> {
    const progress = await this.progressRepo.find({ 
      where: { userId },
      relations: ['course']
    });

    const prompt = `Analyze a learner's progress and provide insights:
    
    Progress Data: ${JSON.stringify(progress.map(p => ({
      course: p.course?.title,
      completion: p.completed ? 100 : (p.score || 0),
      timeSpent: Math.round((p.watchTime || 0) / 60), // Convert to minutes
      lastAccessed: p.lastAccessed,
      score: p.score || 0
    })))}
    
    Generate 3-4 insights with this JSON structure:
    {
      "area": "Area of learning",
      "score": 0-100,
      "trend": "improving" | "stable" | "declining",
      "recommendation": "Specific recommendation",
      "nextSteps": ["step1", "step2"]
    }`;

    try {
      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Progress insights generation error:', error);
      return [];
    }
  }

  async adaptDifficulty(userId: string, lessonId: string, performance: number): Promise<any> {
    const userHistory = await this.progressRepo.find({ where: { userId } });
    const averagePerformance = userHistory.length > 0 
      ? userHistory.reduce((sum, p) => sum + (p.score || 0), 0) / userHistory.length
      : 50;

    let adjustedLevel = 15; // Default intermediate
    let reasoning = 'Maintaining intermediate level based on current performance.';

    if (performance > 85) {
      adjustedLevel = 25; // Advanced
      reasoning = 'Increasing difficulty to advanced level due to excellent performance.';
    } else if (performance < 60 && averagePerformance < 70) {
      adjustedLevel = 5; // Beginner
      reasoning = 'Adjusting to beginner level to build stronger foundation.';
    } else if (performance > 75 && averagePerformance > 75) {
      adjustedLevel = 20; // Upper intermediate
      reasoning = 'Slightly increasing difficulty to match your improving skills.';
    }

    // Cache the difficulty adjustment for this user and lesson
    const cacheKey = `difficulty:${userId}:${lessonId}`;
    await this.cache.set(cacheKey, adjustedLevel, 24 * 60 * 60 * 1000); // 24 hours

    return {
      adjustedLevel,
      reasoning
    };
  }
}
