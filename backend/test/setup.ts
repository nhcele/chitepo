import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../src/courses/entities/course.entity';
import { Module } from '../src/courses/entities/module.entity';
import { Lesson } from '../src/courses/entities/lesson.entity';
import { User } from '../src/users/entities/user.entity';
import { Enrollment } from '../src/courses/entities/enrollment.entity';
import { Certificate } from '../src/certificates/entities/certificate.entity';
import { InstructorApplication } from '../src/instructor/entities/instructor-application.entity';

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_NAME = 'mindelta_test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.PINECONE_API_KEY = 'test-pinecone-key';
  process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
  process.env.AWS_REGION = 'us-east-1';
  process.env.POLYGON_RPC_URL = 'https://polygon-rpc.com';
});

// Mock external services
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Test Course',
                description: 'Test Description',
                modules: [],
                learningObjectives: []
              })
            }
          }]
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      }),
    },
  })),
}));

jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      upsert: jest.fn(),
      query: jest.fn().mockResolvedValue({
        matches: []
      }),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      describeIndexStats: jest.fn().mockResolvedValue({
        dimension: 1536,
        indexFullness: 0.1,
        totalRecordCount: 0
      })
    }),
    listIndexes: jest.fn().mockResolvedValue({
      indexes: []
    }),
    createIndex: jest.fn(),
    deleteIndex: jest.fn(),
  })),
}));

jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 137 }),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0x1234567890123456789012345678901234567890',
      connect: jest.fn().mockReturnThis(),
    })),
    Contract: jest.fn().mockImplementation(() => ({
      deploy: jest.fn().mockResolvedValue({
        waitForDeployment: jest.fn().mockResolvedValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
        })
      }),
      waitForDeployment: jest.fn().mockResolvedValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
      }),
      issueCertificate: jest.fn().mockResolvedValue({
        hash: '0x1234567890123456789012345678901234567890123456789012345678901234'
      }),
      verifyCertificate: jest.fn().mockResolvedValue(true),
      ownerOf: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      tokenURI: jest.fn().mockResolvedValue('ipfs://QmHash'),
    })),
    parseEther: jest.fn().mockReturnValue('1000000000000000000'),
    formatEther: jest.fn().mockReturnValue('1.0'),
  },
}));

jest.mock('@aws-sdk/client-mediaconvert', () => ({
  MediaConvertClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      Job: {
        Id: 'test-job-id',
        Status: 'COMPLETE',
        CreatedAt: new Date(),
      }
    }),
  })),
  CreateJobCommand: jest.fn(),
  GetJobCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockImplementation((plainText: string, hashedText: string) => {
    return Promise.resolve(plainText === 'password123');
  }),
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('file content'),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedPassword',
  role: 'learner',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

global.createMockCourse = (overrides = {}) => ({
  id: 'course-123',
  title: 'Test Course',
  description: 'Test Description',
  instructorId: 'instructor-123',
  status: 'draft',
  difficulty: 'beginner',
  price: 99.99,
  tags: ['test'],
  estimatedDuration: 120,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

global.createMockEnrollment = (overrides = {}) => ({
  id: 'enrollment-123',
  userId: 'user-123',
  courseId: 'course-123',
  progressPercent: 0,
  enrolledAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Close any database connections if needed
  jest.resetAllMocks();
});
