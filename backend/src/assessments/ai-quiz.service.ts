import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { Lesson } from '../courses/entities/lesson.entity';
import { Module as CourseModule } from '../courses/entities/module.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface AIQuizGenerationOptions {
  lessonId: string;
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[];
  focusAreas?: string[];
  avoidTopics?: string[];
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

export interface IntelligentFeedback {
  isCorrect: boolean;
  explanation: string;
  hints: string[];
  relatedResources: string[];
  commonMisconception?: string;
  confidenceScore: number;
  nextSteps: string[];
}

export interface AdaptiveQuizParams {
  userId: string;
  lessonId: string;
  previousPerformance?: number;
  targetDifficulty?: number;
  questionCount?: number;
}

export interface GradingResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  partialCredit: Array<{
    criterion: string;
    points: number;
    maxPoints: number;
    feedback: string;
  }>;
}

@Injectable()
export class AIQuizService {
  private openai: OpenAI;
  private provider: 'openai' | 'kimi';
  private model: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Quiz) private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Question) private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuizAttempt) private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(CourseModule) private readonly moduleRepo: Repository<CourseModule>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    this.provider = (this.configService.get<string>('AI_PROVIDER') || 'openai') as 'openai' | 'kimi';
    
    if (this.provider === 'kimi') {
      const kimiApiKey = this.configService.get<string>('KIMI_API_KEY');
      const kimiBaseUrl = this.configService.get<string>('KIMI_BASE_URL') || 'https://api.moonshot.cn/v1';
      this.model = this.configService.get<string>('KIMI_MODEL') || 'moonshot-v1-32k';
      
      if (kimiApiKey) {
        this.openai = new OpenAI({ apiKey: kimiApiKey, baseURL: kimiBaseUrl });
        console.log(`✅ AI Quiz: Kimi AI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  Kimi API key not configured. AI quiz generation will be disabled.');
        this.openai = null as any;
      }
    } else {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
      
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        console.log(`✅ AI Quiz: OpenAI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  OpenAI API key not configured. AI quiz generation will be disabled.');
        this.openai = null as any;
      }
    }
  }

  /**
   * Generate quiz questions using AI based on lesson content
   */
  async generateAdaptiveQuiz(options: AIQuizGenerationOptions): Promise<any[]> {
    if (!this.openai) {
      throw new Error('AI quiz generation is not configured');
    }

    const lesson = await this.lessonRepo.findOne({ 
      where: { id: options.lessonId },
      relations: ['module', 'module.course']
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const content = lesson.transcript || lesson.content || '';
    const courseContext = lesson.module?.course?.title || '';

    if (!content.trim()) {
      throw new Error(
        'This lesson has no text content (transcript or written content) to generate a quiz from. Add a transcript or lesson text first.',
      );
    }

    const prompt = `Generate ${options.questionCount} quiz questions based on this lesson content.

Lesson: ${lesson.title}
Course: ${courseContext}
Difficulty: ${options.difficulty}
Question Types: ${options.questionTypes.join(', ')}
${options.bloomLevel ? `Bloom's Taxonomy Level: ${options.bloomLevel}` : ''}
${options.focusAreas?.length ? `Focus on: ${options.focusAreas.join(', ')}` : ''}
${options.avoidTopics?.length ? `Avoid: ${options.avoidTopics.join(', ')}` : ''}

Content:
${content.substring(0, 3000)}

Requirements:
1. Questions must be clear, unambiguous, and directly related to the content
2. For multiple-choice: Include 4 options with plausible distractors
3. For true-false: Ensure statements are clearly true or false, not opinion-based
4. For short-answer: Require specific, verifiable answers
5. Include detailed explanations for correct answers
6. Rate each question's difficulty (1-5 scale)
7. Align with Bloom's taxonomy level: ${options.bloomLevel || 'understand'}

Format as JSON array:
[
  {
    "type": "multiple-choice|true-false|short-answer",
    "question": "Question text",
    "options": ["A", "B", "C", "D"], // for multiple-choice only
    "correctAnswer": "correct option or answer",
    "explanation": "Why this is correct and what concept it tests",
    "difficulty": 3,
    "bloomLevel": "understand",
    "keyConceptTested": "Main concept this question assesses",
    "commonMistakes": ["Common wrong answer 1", "Common wrong answer 2"]
  }
]

IMPORTANT: Respond with ONLY a valid JSON array. Do not wrap in code blocks or markdown.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert assessment designer specializing in educational technology. 
            Create fair, effective quiz questions that accurately test understanding without being tricky or misleading.
            Follow best practices in assessment design and learning science.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: Math.min(4000, 600 + options.questionCount * 280),
      });

      const content_response = response.choices[0]?.message?.content;
      if (!content_response) {
        throw new Error('No response from AI');
      }

      const parsed = this.parseJsonArray(content_response);
      const questions = this.normalizeGeneratedQuestions(parsed);

      if (!questions.length) {
        throw new Error('AI returned no valid questions');
      }

      return questions;
    } catch (error) {
      console.error('AI quiz generation error:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  async generateModuleQuizFromModule(options: {
    moduleId: string;
    questionCount: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questionTypes: ('multiple-choice' | 'true-false' | 'short-answer')[];
    focusAreas?: string[];
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }): Promise<any[]> {
    if (!this.openai) {
      throw new Error('AI quiz generation is not configured');
    }

    const module = await this.moduleRepo.findOne({
      where: { id: options.moduleId },
      relations: ['lessons', 'course'],
    });

    if (!module) {
      throw new Error('Module not found');
    }

    const lessons = (module.lessons || []).slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const lessonContent = lessons
      .map((lesson) => {
        const raw =
          lesson.transcript ||
          lesson.content ||
          (lesson as any).summary ||
          (lesson as any).description ||
          '';
        const trimmed = String(raw).trim();
        if (!trimmed) return '';
        return `Lesson: ${lesson.title}\n${trimmed.slice(0, 2000)}`;
      })
      .filter(Boolean)
      .join('\n\n');

    if (!lessonContent) {
      throw new Error('Module has no lesson content to generate a quiz.');
    }

    const prompt = `Generate ${options.questionCount} quiz questions based on this module content.

Module: ${module.title}
Course: ${module.course?.title || ''}
Difficulty: ${options.difficulty}
Question Types: ${options.questionTypes.join(', ')}
${options.bloomLevel ? `Bloom's Taxonomy Level: ${options.bloomLevel}` : ''}
${options.focusAreas?.length ? `Focus on: ${options.focusAreas.join(', ')}` : ''}

Content:
${lessonContent.substring(0, 8000)}

Requirements:
1. Questions must be clear, unambiguous, and directly related to the content
2. For multiple-choice: Include 4 options with plausible distractors
3. For true-false: Ensure statements are clearly true or false, not opinion-based
4. For short-answer: Require specific, verifiable answers
5. Include detailed explanations for correct answers
6. Rate each question's difficulty (1-5 scale)
7. Align with Bloom's taxonomy level: ${options.bloomLevel || 'understand'}

Format as JSON array:
[
  {
    "type": "multiple-choice|true-false|short-answer",
    "question": "Question text",
    "options": ["A", "B", "C", "D"], // for multiple-choice only
    "correctAnswer": "correct option or answer",
    "explanation": "Why this is correct and what concept it tests",
    "difficulty": 3,
    "bloomLevel": "understand",
    "keyConceptTested": "Main concept this question assesses",
    "commonMistakes": ["Common wrong answer 1", "Common wrong answer 2"]
  }
]

IMPORTANT: Respond with ONLY a valid JSON array. Do not wrap in code blocks or markdown.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert assessment designer specializing in educational technology.
            Create fair, effective quiz questions that accurately test understanding without being tricky or misleading.
            Follow best practices in assessment design and learning science.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: Math.min(4000, 600 + options.questionCount * 280),
      });

      const content_response = response.choices[0]?.message?.content;
      if (!content_response) {
        throw new Error('No response from AI');
      }

      const parsed = this.parseJsonArray(content_response);
      const questions = this.normalizeGeneratedQuestions(parsed);

      if (!questions.length) {
        throw new Error('AI returned no valid questions');
      }

      return questions;
    } catch (error) {
      console.error('AI module quiz generation error:', error);
      throw new Error('Failed to generate module quiz questions');
    }
  }

  private parseJsonArray(raw: string): any[] {
    let text = raw.trim();
    if (!text) {
      throw new Error('Empty AI response');
    }

    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch?.[1]) {
      text = codeBlockMatch[1].trim();
    }

    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      text = text.slice(firstBracket, lastBracket + 1);
    }

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not a JSON array');
    }
    return parsed;
  }

  private parseJsonObject(raw: string): any {
    let text = (raw || '').trim();
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch?.[1]) {
      text = codeBlockMatch[1].trim();
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      text = text.slice(first, last + 1);
    }
    return JSON.parse(text);
  }

  private resolveOptionText(value: string, options?: string[]): string {
    if (options && options.length && /^\d+$/.test(String(value).trim())) {
      const i = Number(value);
      if (i >= 0 && i < options.length) return String(options[i]);
    }
    return String(value ?? '');
  }

  private normalizeGeneratedQuestions(raw: any[]): any[] {
    return (raw || [])
      .map((q: any) => {
        const type = q.type || q.questionType || q.question_type || 'multiple-choice';
        const question = q.question || q.stem || q.questionText || '';
        const options = Array.isArray(q.options) ? q.options : undefined;
        const correctAnswer = q.correctAnswer ?? q.correct_answer ?? q.answer;
        const explanation = q.explanation ?? q.rationale;
        return {
          type,
          question,
          options,
          correctAnswer,
          explanation,
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel || q.bloom_level,
          keyConceptTested: q.keyConceptTested || q.key_concept_tested,
          commonMistakes: Array.isArray(q.commonMistakes)
            ? q.commonMistakes
            : Array.isArray(q.common_mistakes)
            ? q.common_mistakes
            : undefined,
        };
      })
      .filter((q: any) => {
        if (!q.question || q.correctAnswer == null) return false;
        if (q.type === 'multiple-choice') {
          return Array.isArray(q.options) && q.options.length >= 2;
        }
        return true;
      });
  }

  /**
   * Provide intelligent feedback for quiz answers
   */
  async provideIntelligentFeedback(params: {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    questionText: string;
    questionType: string;
    lessonContext?: string;
  }): Promise<IntelligentFeedback> {
    // Resolve the authoritative correct answer from the DB (never trust a
    // client-supplied answer key) and convert option indices to readable text.
    let questionText = params.questionText;
    let questionType = params.questionType;
    let correctAnswer = params.correctAnswer;
    let userAnswer = params.userAnswer;
    if (params.questionId) {
      const q = await this.questionRepo.findOne({ where: { id: params.questionId } });
      if (q) {
        const options = Array.isArray(q.options) ? q.options : undefined;
        questionText = q.questionText || questionText;
        questionType = String(q.questionType) || questionType;
        correctAnswer = this.resolveOptionText(String(q.correctAnswer), options);
        userAnswer = this.resolveOptionText(String(params.userAnswer), options);
      }
    }

    const isCorrect = this.checkAnswerCorrectness(userAnswer, correctAnswer, questionType);

    const prompt = `Provide detailed, encouraging feedback for this quiz question:

Question: ${questionText}
Question Type: ${questionType}
Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}
${params.lessonContext ? `Lesson Context: ${params.lessonContext}` : ''}

Provide feedback as JSON:
{
  "explanation": "Clear explanation of why the answer is correct/incorrect",
  "hints": ["Progressive hint 1", "Progressive hint 2", "Progressive hint 3"],
  "relatedResources": ["Specific section to review", "Related concept to study"],
  "commonMisconception": "If incorrect, what misconception does this reveal?",
  "confidenceScore": 0.85,
  "nextSteps": ["What to do next", "How to improve understanding"]
}

Guidelines:
- Be encouraging and constructive
- Explain the underlying concept, not just the answer
- Provide actionable next steps
- If correct, reinforce understanding and suggest advanced topics
- If incorrect, identify the gap in understanding without being discouraging`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a supportive educational AI that provides constructive feedback to help learners improve.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No feedback generated');
      }

      const feedback = this.parseJsonObject(content);
      return {
        isCorrect,
        ...feedback
      };
    } catch (error) {
      console.error('Feedback generation error:', error);
      // Fallback feedback
      return {
        isCorrect,
        explanation: isCorrect 
          ? 'Correct! You understood this concept well.' 
          : 'Not quite right. Review the lesson material for this topic.',
        hints: ['Review the key concepts', 'Try breaking down the problem', 'Consider the context'],
        relatedResources: ['Lesson materials'],
        confidenceScore: 0.5,
        nextSteps: ['Review the lesson', 'Try similar questions']
      };
    }
  }

  /**
   * Calculate adaptive difficulty for next question
   */
  async calculateAdaptiveDifficulty(params: {
    userId: string;
    currentDifficulty: number;
    recentPerformance: number[];
    timeSpent: number[];
  }): Promise<{
    nextDifficulty: number;
    reasoning: string;
    confidence: number;
  }> {
    const avgPerformance = params.recentPerformance.reduce((a, b) => a + b, 0) / params.recentPerformance.length;
    const avgTime = params.timeSpent.reduce((a, b) => a + b, 0) / params.timeSpent.length;
    
    let nextDifficulty = params.currentDifficulty;
    let reasoning = '';
    
    // Performance-based adjustment
    if (avgPerformance > 85 && avgTime < 30) {
      nextDifficulty = Math.min(5, params.currentDifficulty + 1);
      reasoning = 'Increasing difficulty due to strong performance and quick responses';
    } else if (avgPerformance < 60) {
      nextDifficulty = Math.max(1, params.currentDifficulty - 1);
      reasoning = 'Decreasing difficulty to build confidence and understanding';
    } else if (avgPerformance > 75 && avgTime > 60) {
      nextDifficulty = Math.min(5, params.currentDifficulty + 0.5);
      reasoning = 'Slight increase - good performance but taking time to think';
    } else {
      reasoning = 'Maintaining current difficulty level';
    }

    return {
      nextDifficulty: Math.round(nextDifficulty * 10) / 10,
      reasoning,
      confidence: avgPerformance / 100
    };
  }

  /**
   * Grade short answer questions using AI
   */
  async gradeShortAnswer(params: {
    question: string;
    studentAnswer: string;
    modelAnswer: string;
    rubric?: string;
    maxPoints: number;
  }): Promise<GradingResult> {
    const prompt = `Grade this short answer question:

Question: ${params.question}
Student Answer: ${params.studentAnswer}
Model Answer: ${params.modelAnswer}
${params.rubric ? `Rubric: ${params.rubric}` : ''}
Maximum Points: ${params.maxPoints}

Provide grading as JSON:
{
  "score": number (0 to ${params.maxPoints}),
  "percentage": number (0-100),
  "feedback": "Overall feedback on the answer",
  "strengths": ["What the student did well"],
  "improvements": ["What could be improved"],
  "partialCredit": [
    {
      "criterion": "Criterion name",
      "points": number,
      "maxPoints": number,
      "feedback": "Specific feedback"
    }
  ]
}

Grading Guidelines:
- Award partial credit for partially correct answers
- Be fair and consistent
- Recognize different valid approaches
- Provide constructive feedback
- Consider semantic similarity, not just exact matches`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an experienced educator who grades student work fairly and provides constructive feedback.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for consistent grading
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No grading result generated');
      }

      const result = this.parseJsonObject(content);
      return {
        maxScore: params.maxPoints,
        ...result
      };
    } catch (error) {
      console.error('Grading error:', error);
      throw new Error('Failed to grade answer');
    }
  }

  /**
   * Detect common misconceptions from wrong answers
   */
  async detectMisconceptions(params: {
    questionId: string;
    wrongAnswers: Array<{ answer: string; frequency: number }>;
    correctAnswer: string;
    questionText: string;
  }): Promise<Array<{
    misconception: string;
    explanation: string;
    remediation: string;
    affectedStudents: number;
  }>> {
    const prompt = `Analyze these wrong answers to identify common misconceptions:

Question: ${params.questionText}
Correct Answer: ${params.correctAnswer}

Wrong Answers (with frequency):
${params.wrongAnswers.map(wa => `- "${wa.answer}" (${wa.frequency} students)`).join('\n')}

Identify common misconceptions as JSON array:
[
  {
    "misconception": "What misunderstanding led to this wrong answer",
    "explanation": "Why students might think this way",
    "remediation": "How to address this misconception",
    "affectedStudents": number
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an educational psychologist who identifies learning gaps and misconceptions.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      return this.parseJsonArray(content);
    } catch (error) {
      console.error('Misconception detection error:', error);
      return [];
    }
  }

  /**
   * Generate hints without giving away the answer
   */
  async generateProgressiveHints(params: {
    questionText: string;
    correctAnswer: string;
    hintLevel: 1 | 2 | 3;
  }): Promise<string> {
    const hintInstructions = {
      1: 'Provide a very subtle hint that points to the general concept without revealing the answer',
      2: 'Provide a more direct hint that narrows down the possibilities',
      3: 'Provide a strong hint that almost reveals the answer but requires the student to make the final connection'
    };

    const prompt = `Generate a hint for this question:

Question: ${params.questionText}
Correct Answer: ${params.correctAnswer}
Hint Level: ${params.hintLevel} (1=subtle, 2=moderate, 3=strong)

${hintInstructions[params.hintLevel]}

Provide just the hint text, nothing else.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful tutor who provides hints that guide learning without giving away answers.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || 'Think about the key concepts from the lesson.';
    } catch (error) {
      console.error('Hint generation error:', error);
      return 'Review the relevant section of the lesson for guidance.';
    }
  }

  /**
   * Check if answer is correct (with fuzzy matching for text answers)
   */
  private checkAnswerCorrectness(
    userAnswer: string,
    correctAnswer: string,
    questionType: string
  ): boolean {
    if (questionType === 'multiple-choice' || questionType === 'true-false') {
      return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }

    // For short answers, use fuzzy matching
    const userNormalized = userAnswer.toLowerCase().trim();
    const correctNormalized = correctAnswer.toLowerCase().trim();

    // Exact match
    if (userNormalized === correctNormalized) {
      return true;
    }

    // Check if user answer contains the correct answer
    if (userNormalized.includes(correctNormalized) || correctNormalized.includes(userNormalized)) {
      return true;
    }

    // Check similarity (simple Levenshtein-like check)
    const similarity = this.calculateSimilarity(userNormalized, correctNormalized);
    return similarity > 0.8;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
