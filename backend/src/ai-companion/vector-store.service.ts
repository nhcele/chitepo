import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from '../courses/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';

interface VectorMetadata {
  [key: string]: any;
  id: string;
  type: 'lesson' | 'course' | 'transcript';
  title: string;
  courseId?: string;
  lessonId?: string;
  difficulty: string;
  tags: string[];
  duration?: number;
  chunkIndex?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  score: number;
  metadata: any;
  content?: string;
}

@Injectable()
export class VectorStoreService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
  ) {
    // Initialize Pinecone client only if API key is provided
    const pineconeApiKey = this.configService.get<string>('PINECONE_API_KEY');
    if (pineconeApiKey) {
      this.pinecone = new Pinecone({
        apiKey: pineconeApiKey,
      });
      this.indexName = this.configService.get<string>('PINECONE_INDEX_NAME', 'mindelta-embeddings');
    }
    
    // Initialize OpenAI client only if API key is provided
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    }
  }

  async initializeIndex(): Promise<void> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, skipping index initialization');
      return;
    }
    try {
      // Check if index exists
      const { indexes } = await this.pinecone.listIndexes();
      const indexExists = indexes.some(index => index.name === this.indexName);
      
      if (!indexExists) {
        // Create index with appropriate dimensions for text-embedding-ada-002
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        console.log(`Created Pinecone index: ${this.indexName}`);
      }
      
      console.log(`Pinecone index ${this.indexName} is ready`);
    } catch (error) {
      console.error('Failed to initialize Pinecone index:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      console.log('OpenAI not configured, returning empty embedding');
      return new Array(1536).fill(0); // Return zero vector with correct dimensions
    }
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.replace(/\n/g, ' ').trim(),
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async indexLesson(lessonId: string): Promise<void> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, skipping lesson indexing');
      return;
    }
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course'],
    });
    
    if (!lesson) throw new Error('Lesson not found');

    // Combine lesson content for embedding
    const contentText = [
      lesson.title,
      lesson.content || '',
      lesson.transcript || '',
    ].filter(Boolean).join(' ');

    // Split content into chunks for better retrieval
    const chunks = this.chunkText(contentText, 1000);
    
    const index = this.pinecone.Index(this.indexName);
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await this.generateEmbedding(chunks[i]);
      
      vectors.push({
        id: `${lessonId}-chunk-${i}`,
        values: embedding,
        metadata: {
          id: lessonId,
          type: 'lesson',
          title: lesson.title,
          courseId: lesson.module?.course?.id,
          lessonId: lessonId,
          difficulty: lesson.module?.course?.difficulty || 'beginner',
          tags: lesson.module?.course?.tags || [],
          duration: lesson.durationSeconds,
          chunkIndex: i,
          totalChunks: chunks.length,
        } as VectorMetadata,
      });
    }

    // Upsert vectors in batches
    await index.upsert(vectors);
    console.log(`Indexed lesson ${lesson.title} with ${chunks.length} chunks`);
  }

  async indexCourse(courseId: string): Promise<void> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, skipping course indexing');
      return;
    }
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons'],
    });
    
    if (!course) throw new Error('Course not found');

    // Index course overview
    const courseText = [
      course.title,
      course.subtitle || '',
      course.description,
      course.tags?.join(' ') || '',
    ].filter(Boolean).join(' ');

    const embedding = await this.generateEmbedding(courseText);
    const index = this.pinecone.Index(this.indexName);

    await index.upsert([{
      id: `course-${courseId}`,
      values: embedding,
      metadata: {
        id: courseId,
        type: 'course',
        title: course.title,
        courseId: courseId,
        difficulty: course.difficulty,
        tags: course.tags || [],
        estimatedDuration: course.estimatedDuration,
      } as VectorMetadata,
    }]);

    // Index all lessons in the course
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        await this.indexLesson(lesson.id);
      }
    }

    console.log(`Indexed course ${course.title} and all its lessons`);
  }

  async searchContent(
    query: string,
    filters?: {
      type?: 'lesson' | 'course';
      difficulty?: string;
      courseId?: string;
      tags?: string[];
    },
    limit: number = 10
  ): Promise<SearchResult[]> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, returning empty search results');
      return [];
    }
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const index = this.pinecone.Index(this.indexName);

      const pineconeFilters: any = {};
      if (filters?.type) pineconeFilters.type = filters.type;
      if (filters?.difficulty) pineconeFilters.difficulty = filters.difficulty;
      if (filters?.courseId) pineconeFilters.courseId = filters.courseId;
      if (filters?.tags?.length) pineconeFilters.tags = { $in: filters.tags };

      const response = await index.query({
        vector: queryEmbedding,
        filter: Object.keys(pineconeFilters).length > 0 ? pineconeFilters : undefined,
        topK: limit,
        includeMetadata: true,
      });

      const results: SearchResult[] = response.matches?.map(match => ({
        id: match.id,
        title: (match.metadata?.title as string) || 'Untitled',
        type: (match.metadata?.type as string) || 'unknown',
        score: match.score || 0,
        metadata: match.metadata,
      })) || [];

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async findSimilarContent(
    contentId: string,
    contentType: 'lesson' | 'course',
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, returning empty similar content results');
      return [];
    }
    try {
      const index = this.pinecone.Index(this.indexName);
      
      // Get the vector for the reference content
      const vectorId = contentType === 'course' ? `course-${contentId}` : `${contentId}-chunk-0`;
      const response = await index.query({
        id: vectorId,
        topK: limit + 1, // +1 to exclude the original content
        includeMetadata: true,
      });

      // Filter out the original content
      const results: SearchResult[] = response.matches
        ?.filter(match => match.id !== vectorId)
        .map(match => ({
          id: match.id,
          title: (match.metadata?.title as string) || 'Untitled',
          type: (match.metadata?.type as string) || 'unknown',
          score: match.score || 0,
          metadata: match.metadata,
        })) || [];

      return results.slice(0, limit);
    } catch (error) {
      console.error('Similar content search failed:', error);
      return [];
    }
  }

  async recommendCourses(
    userId: string,
    completedCourses: string[] = [],
    userInterests: string[] = []
  ): Promise<SearchResult[]> {
    // Build a query based on user's interests and learning history
    const interestsText = userInterests.join(' ');
    const query = interestsText || 'professional development skills career growth';

    const results = await this.searchContent(
      query,
      { type: 'course' },
      20
    );

    // Filter out completed courses
    const recommendations = results.filter(result => 
      !completedCourses.includes(result.metadata?.id)
    );

    return recommendations.slice(0, 10);
  }

  async deleteFromIndex(contentId: string, contentType: 'lesson' | 'course'): Promise<void> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, skipping delete from index');
      return;
    }
    try {
      const index = this.pinecone.Index(this.indexName);
      
      if (contentType === 'course') {
        await index.deleteOne(`course-${contentId}`);
      } else {
        // Delete all chunks for a lesson - in new API we need to know the IDs
        // For now, we'll delete a range of possible chunk IDs
        const idsToDelete = [];
        for (let i = 0; i < 50; i++) { // Assume max 50 chunks per lesson
          idsToDelete.push(`${contentId}-chunk-${i}`);
        }
        await index.deleteMany(idsToDelete);
      }
      
      console.log(`Deleted ${contentType} ${contentId} from vector index`);
    } catch (error) {
      console.error('Failed to delete from index:', error);
      throw new Error('Failed to delete from index');
    }
  }

  private chunkText(text: string, maxChunkSize: number): string[] {
    if (!text) return [];
    
    const chunks: string[] = [];
    const sentences = text.split('. ').filter(s => s.trim().length > 0);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  async getIndexPath(): Promise<void> {
    if (!this.pinecone) {
      console.log('Pinecone not configured, skipping index stats');
      return;
    }
    try {
      const index = this.pinecone.Index(this.indexName);
      const stats = await index.describeIndexStats();
      console.log('Index Statistics:', { 
        dimension: stats.dimension, 
        indexFullness: stats.indexFullness,
        totalVectorCount: stats.totalRecordCount 
      });
    } catch (error) {
      console.error('Failed to get index stats:', error);
    }
  }
}
