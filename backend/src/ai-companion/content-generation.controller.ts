import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  Req, 
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContentGenerationService } from './content-generation.service';
import { Request } from 'express';

@Controller('ai-content')
@UseGuards(JwtAuthGuard)
export class ContentGenerationController {
  constructor(private readonly contentGenerationService: ContentGenerationService) {}

  @Post('generate-course-outline')
  async generateCourseOutline(@Body() data: {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    format: 'video' | 'text' | 'interactive' | 'mixed';
    audience: string;
    learningObjectives?: string[];
    includeQuizzes: boolean;
    includeAssignments: boolean;
  }) {
    if (!data.topic || !data.difficulty || !data.duration || !data.format || !data.audience) {
      throw new BadRequestException('Missing required fields');
    }

    const outline = await this.contentGenerationService.generateCourseOutline(data);
    return { outline };
  }

  @Post('generate-lesson-content')
  async generateLessonContent(@Body() data: {
    lessonTitle: string;
    lessonType: 'video' | 'text' | 'interactive';
    duration: number;
    difficulty: string;
    topic: string;
  }) {
    if (!data.lessonTitle || !data.lessonType || !data.duration || !data.difficulty || !data.topic) {
      throw new BadRequestException('Missing required fields');
    }

    const content = await this.contentGenerationService.generateLessonContent(
      data.lessonTitle,
      data.lessonType,
      data.duration,
      data.difficulty,
      data.topic
    );
    return { content };
  }

  @Post('generate-quiz')
  async generateQuizQuestions(@Body() data: {
    topic: string;
    difficulty: string;
    questionCount?: number;
  }) {
    if (!data.topic || !data.difficulty) {
      throw new BadRequestException('Topic and difficulty are required');
    }

    const questions = await this.contentGenerationService.generateQuizQuestions(
      data.topic,
      data.difficulty,
      data.questionCount || 5
    );
    return { questions };
  }

  @Post('generate-assignment')
  async generateAssignment(@Body() data: {
    topic: string;
    difficulty: string;
    assignmentType: 'project' | 'essay' | 'case-study' | 'practical';
  }) {
    if (!data.topic || !data.difficulty || !data.assignmentType) {
      throw new BadRequestException('Missing required fields');
    }

    const assignment = await this.contentGenerationService.generateAssignment(
      data.topic,
      data.difficulty,
      data.assignmentType
    );
    return { assignment };
  }

  @Post('improve-content')
  async improveExistingContent(@Body() data: {
    content: string;
    improvementType: 'clarity' | 'engagement' | 'difficulty' | 'length';
    targetAudience?: string;
  }) {
    if (!data.content || !data.improvementType) {
      throw new BadRequestException('Content and improvement type are required');
    }

    const improved = await this.contentGenerationService.improveExistingContent(
      data.content,
      data.improvementType,
      data.targetAudience
    );
    return { improved };
  }

  @Post('generate-learning-path')
  async generateLearningPath(@Body() data: {
    userGoals: string[];
    currentSkillLevel: string;
    timeAvailable: number;
  }) {
    if (!data.userGoals || !data.currentSkillLevel || !data.timeAvailable) {
      throw new BadRequestException('Missing required fields');
    }

    const learningPath = await this.contentGenerationService.generateLearningPath(
      data.userGoals,
      data.currentSkillLevel,
      data.timeAvailable
    );
    return { learningPath };
  }

  @Get('content-suggestions')
  async getContentSuggestions(@Query() query: {
    topic?: string;
    difficulty?: string;
    format?: string;
  }) {
    // Predefined content suggestions based on popular topics
    const suggestions = [
      {
        topic: 'Introduction to Data Science',
        difficulty: 'beginner',
        format: 'mixed',
        estimatedDuration: 480,
        description: 'Learn the fundamentals of data science, including statistics, programming, and machine learning basics.',
      },
      {
        topic: 'Advanced JavaScript Concepts',
        difficulty: 'advanced',
        format: 'interactive',
        estimatedDuration: 360,
        description: 'Master advanced JavaScript patterns, async programming, and modern framework concepts.',
      },
      {
        topic: 'Digital Marketing Fundamentals',
        difficulty: 'beginner',
        format: 'video',
        estimatedDuration: 300,
        description: 'Comprehensive introduction to digital marketing strategies, SEO, and social media marketing.',
      },
      {
        topic: 'Machine Learning with Python',
        difficulty: 'intermediate',
        format: 'mixed',
        estimatedDuration: 600,
        description: 'Practical machine learning course using Python, scikit-learn, and TensorFlow.',
      },
      {
        topic: 'Project Management Professional',
        difficulty: 'intermediate',
        format: 'text',
        estimatedDuration: 420,
        description: 'Prepare for PMP certification with comprehensive project management methodologies.',
      },
    ];

    let filteredSuggestions = suggestions;

    if (query.topic) {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.topic.toLowerCase().includes(query.topic!.toLowerCase())
      );
    }

    if (query.difficulty) {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.difficulty === query.difficulty
      );
    }

    if (query.format) {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.format === query.format
      );
    }

    return { suggestions: filteredSuggestions };
  }

  @Get('generation-stats')
  async getGenerationStats(@Req() req: Request) {
    // Mock statistics for content generation usage
    const stats = {
      totalGenerated: 1250,
      thisMonth: 89,
      byType: {
        courses: 23,
        lessons: 156,
        quizzes: 234,
        assignments: 67,
        improvements: 45,
      },
      popularTopics: [
        { topic: 'Data Science', count: 45 },
        { topic: 'Web Development', count: 38 },
        { topic: 'Business', count: 32 },
        { topic: 'Design', count: 28 },
        { topic: 'Marketing', count: 24 },
      ],
    };

    return { stats };
  }
}
