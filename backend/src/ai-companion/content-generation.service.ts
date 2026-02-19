import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Module } from '../courses/entities/module.entity';
import { Lesson } from '../courses/entities/lesson.entity';

interface GeneratedContent {
  type: 'course' | 'module' | 'lesson' | 'quiz' | 'assignment';
  title: string;
  content: string;
  metadata?: {
    difficulty: string;
    duration: number;
    tags: string[];
    learningObjectives: string[];
  };
}

interface ContentGenerationOptions {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  format: 'video' | 'text' | 'interactive' | 'mixed';
  audience: string;
  learningObjectives?: string[];
  includeQuizzes: boolean;
  includeAssignments: boolean;
}

@Injectable()
export class ContentGenerationService {
  private openai: OpenAI;
  private provider: 'openai' | 'kimi';
  private model: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Module) private readonly moduleRepo: Repository<Module>,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
  ) {
    this.provider = (this.configService.get<string>('AI_PROVIDER') || 'openai') as 'openai' | 'kimi';
    
    if (this.provider === 'kimi') {
      const kimiApiKey = this.configService.get<string>('KIMI_API_KEY');
      const kimiBaseUrl = this.configService.get<string>('KIMI_BASE_URL') || 'https://api.moonshot.cn/v1';
      this.model = this.configService.get<string>('KIMI_MODEL') || 'moonshot-v1-32k';
      
      if (kimiApiKey) {
        this.openai = new OpenAI({ apiKey: kimiApiKey, baseURL: kimiBaseUrl });
        console.log(`✅ Content Generation: Kimi AI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  Kimi API key not configured. AI content generation will be disabled.');
        this.openai = null as any;
      }
    } else {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
      
      if (apiKey) {
        this.openai = new OpenAI({ apiKey });
        console.log(`✅ Content Generation: OpenAI initialized with model: ${this.model}`);
      } else {
        console.warn('⚠️  OpenAI API key not configured. AI content generation will be disabled.');
        this.openai = null as any;
      }
    }
  }

  async generateCourseOutline(options: ContentGenerationOptions): Promise<{
    title: string;
    description: string;
    modules: Array<{
      title: string;
      description: string;
      lessons: Array<{
        title: string;
        type: 'video' | 'text' | 'interactive';
        duration: number;
        description: string;
      }>;
    }>;
    estimatedDuration: number;
    learningObjectives: string[];
  }> {
    const prompt = `Generate a comprehensive course outline for ${options.topic}.

Requirements:
- Target audience: ${options.audience}
- Difficulty level: ${options.difficulty}
- Total duration: ${options.duration} minutes
- Format: ${options.format}
- Include quizzes: ${options.includeQuizzes}
- Include assignments: ${options.includeAssignments}

Please provide:
1. An engaging course title and description
2. 4-6 modules with clear learning progression
3. 3-5 lessons per module with appropriate duration allocation
4. Clear learning objectives
5. Estimated completion time

Format the response as JSON with the following structure:
{
  "title": "Course Title",
  "description": "Course description",
  "learningObjectives": ["objective1", "objective2", ...],
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "lessons": [
        {
          "title": "Lesson Title",
          "type": "video|text|interactive",
          "duration": 15,
          "description": "Lesson description"
        }
      ]
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert instructional designer and course creator. Generate comprehensive, engaging course outlines that follow best practices in learning design.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      // Parse JSON response
      const courseOutline = JSON.parse(content);
      
      // Calculate total duration
      const estimatedDuration = courseOutline.modules.reduce((total: number, module: any) => {
        return total + module.lessons.reduce((moduleTotal: number, lesson: any) => {
          return moduleTotal + (lesson.duration || 15);
        }, 0);
      }, 0);

      return {
        ...courseOutline,
        estimatedDuration,
      };
    } catch (error) {
      console.error('Failed to generate course outline:', error);
      throw new Error('Content generation failed');
    }
  }

  async generateLessonContent(
    lessonTitle: string,
    lessonType: 'video' | 'text' | 'interactive',
    duration: number,
    difficulty: string,
    topic: string
  ): Promise<{
    script: string;
    keyPoints: string[];
    resources: string[];
    activities: string[];
    assessment: {
      quizQuestions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
      }>;
    };
  }> {
    const prompt = `Generate comprehensive lesson content for: "${lessonTitle}"

Context:
- Topic: ${topic}
- Lesson type: ${lessonType}
- Duration: ${duration} minutes
- Difficulty: ${difficulty}

Please provide:
1. A detailed script or content outline
2. Key learning points (3-5 bullet points)
3. Recommended resources or further reading
4. Interactive activities or exercises
5. A short assessment quiz with 3-5 questions

Format as JSON with this structure:
{
  "script": "Detailed lesson content/script...",
  "keyPoints": ["point1", "point2", ...],
  "resources": ["resource1", "resource2", ...],
  "activities": ["activity1", "activity2", ...],
  "assessment": {
    "quizQuestions": [
      {
        "question": "Question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": 0,
        "explanation": "Explanation of why this is correct"
      }
    ]
  }
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator and content creator. Generate engaging, informative, and pedagogically sound lesson content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate lesson content:', error);
      throw new Error('Lesson content generation failed');
    }
  }

  async generateQuizQuestions(
    topic: string,
    difficulty: string,
    questionCount: number = 5
  ): Promise<Array<{
    question: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    difficulty: number; // 1-5 scale
  }>> {
    if (!this.openai) {
      throw new Error('AI content generation is not configured');
    }

    const prompt = `Generate ${questionCount} quiz questions about ${topic}.

Requirements:
- Difficulty level: ${difficulty}
- Mix of question types: multiple choice, true/false, short answer
- Include explanations for correct answers
- Rate difficulty on a scale of 1-5

Format as JSON array:
[
  {
    "question": "Question text",
    "type": "multiple-choice|true-false|short-answer",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "correct option or answer",
    "explanation": "Explanation",
    "difficulty": 3
  }
]

IMPORTANT: Respond with ONLY a valid JSON array. Do not wrap in code blocks or markdown.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert assessment designer. Create clear, fair, and effective quiz questions that accurately test understanding.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      const parsed = this.parseJsonArray(content);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI returned no valid questions');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to generate quiz questions:', error);
      throw new Error('Quiz generation failed');
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

  async generateAssignment(
    topic: string,
    difficulty: string,
    assignmentType: 'project' | 'essay' | 'case-study' | 'practical'
  ): Promise<{
    title: string;
    description: string;
    instructions: string[];
    deliverables: string[];
    rubric: {
      criteria: Array<{
        name: string;
        description: string;
        maxPoints: number;
      }>;
    };
    estimatedTime: number;
  }> {
    const prompt = `Generate a ${assignmentType} assignment for ${topic}.

Requirements:
- Difficulty level: ${difficulty}
- Clear instructions and deliverables
- Comprehensive grading rubric
- Estimated completion time

Format as JSON:
{
  "title": "Assignment Title",
  "description": "Overview of the assignment",
  "instructions": ["step1", "step2", ...],
  "deliverables": ["deliverable1", "deliverable2", ...],
  "rubric": {
    "criteria": [
      {
        "name": "Criterion Name",
        "description": "What this criterion assesses",
        "maxPoints": 25
      }
    ]
  },
  "estimatedTime": 120
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator. Create meaningful, engaging assignments that effectively assess student learning and skills.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate assignment:', error);
      throw new Error('Assignment generation failed');
    }
  }

  async improveExistingContent(
    content: string,
    improvementType: 'clarity' | 'engagement' | 'difficulty' | 'length',
    targetAudience?: string
  ): Promise<{
    improvedContent: string;
    changes: string[];
    rationale: string;
  }> {
    const prompt = `Improve the following educational content for better ${improvementType}.

Original content:
"""
${content}
"""

${targetAudience ? `Target audience: ${targetAudience}` : ''}

Please:
1. Improve the content based on the specified focus area
2. List the specific changes made
3. Provide rationale for the improvements

Format as JSON:
{
  "improvedContent": "Improved version of the content",
  "changes": ["change1", "change2", ...],
  "rationale": "Explanation of why these improvements were made"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert content editor specializing in educational materials. Improve content while maintaining accuracy and educational value.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No content generated');
      }

      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to improve content:', error);
      throw new Error('Content improvement failed');
    }
  }

  async generateLearningPath(
    userGoals: string[],
    currentSkillLevel: string,
    timeAvailable: number // minutes per week
  ): Promise<{
    title: string;
    description: string;
    courses: Array<{
      title: string;
      description: string;
      duration: number;
      prerequisites: string[];
      order: number;
    }>;
    totalDuration: number;
    estimatedCompletion: string;
  }> {
    const prompt = `Create a personalized learning path based on the following:

User goals: ${userGoals.join(', ')}
Current skill level: ${currentSkillLevel}
Time available: ${timeAvailable} minutes per week

Please generate:
1. A coherent learning path title and description
2. 3-5 recommended courses in logical order
3. Prerequisites for each course
4. Total duration and estimated completion time

Format as JSON:
{
  "title": "Learning Path Title",
  "description": "Description of the learning path",
  "courses": [
    {
      "title": "Course Title",
      "description": "Course description",
      "duration": 480,
      "prerequisites": ["prereq1", "prereq2"],
      "order": 1
    }
  ],
  "totalDuration": 2400,
  "estimatedCompletion": "12 weeks"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert learning designer. Create personalized, effective learning paths that help users achieve their goals.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate learning path:', error);
      throw new Error('Learning path generation failed');
    }
  }
}
