import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CoursesModule } from '../src/courses/courses.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Course } from '../src/courses/entities/course.entity';
import { Module } from '../src/courses/entities/module.entity';
import { Lesson } from '../src/courses/entities/lesson.entity';
import { User } from '../src/users/entities/user.entity';

describe('Courses API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let instructorId: string;
  let createdCourseId: string;

  const testUser = {
    email: 'instructor@test.com',
    password: 'password123',
    name: 'Tendai Moyo',
  };

  const testCourse = {
    title: 'Integration Test Course',
    description: 'A course for integration testing',
    difficulty: 'beginner',
    price: 99.99,
    tags: ['testing', 'integration'],
    estimatedDuration: 120,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'password',
          database: 'mindelta_test',
          entities: [Course, Module, Lesson, User],
          synchronize: true,
        }),
        CoursesModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login test user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    instructorId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdCourseId) {
      await request(app.getHttpServer())
        .delete(`/courses/${createdCourseId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }

    await request(app.getHttpServer())
      .delete(`/auth/profile`)
      .set('Authorization', `Bearer ${authToken}`);

    await app.close();
  });

  describe('POST /courses', () => {
    it('should create a new course', async () => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCourse)
        .expect(201);

      createdCourseId = response.body.id;

      expect(response.body).toMatchObject({
        ...testCourse,
        instructorId,
        status: 'draft',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .send(testCourse)
        .expect(401);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /courses', () => {
    it('should return all published courses', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should not include draft courses
      expect(response.body.every((course: any) => course.status === 'published')).toBe(true);
    });

    it('should support search functionality', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses?search=Integration')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /courses/instructor', () => {
    it('should return instructor courses', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses/instructor')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((course: any) => course.id === createdCourseId)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/courses/instructor')
        .expect(401);
    });
  });

  describe('GET /courses/:id', () => {
    it('should return a specific course', async () => {
      const response = await request(app.getHttpServer())
        .get(`/courses/${createdCourseId}`)
        .expect(200);

      expect(response.body).toMatchObject(testCourse);
      expect(response.body.id).toBe(createdCourseId);
    });

    it('should return 404 for non-existent course', async () => {
      await request(app.getHttpServer())
        .get('/courses/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /courses/:id', () => {
    const updateData = {
      title: 'Updated Test Course',
      description: 'Updated description',
    };

    it('should update a course', async () => {
      const response = await request(app.getHttpServer())
        .put(`/courses/${createdCourseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/courses/${createdCourseId}`)
        .send(updateData)
        .expect(401);
    });

    it('should validate ownership', async () => {
      // Create another user and try to update the course
      const anotherUser = {
        email: 'another@test.com',
        password: 'password123',
        name: 'Another User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(anotherUser)
        .expect(201);

      const anotherLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: anotherUser.email,
          password: anotherUser.password,
        })
        .expect(200);

      await request(app.getHttpServer())
        .put(`/courses/${createdCourseId}`)
        .set('Authorization', `Bearer ${anotherLoginResponse.body.access_token}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe('POST /courses/:id/publish', () => {
    it('should publish a course', async () => {
      // First create a module and lesson to satisfy publishing requirements
      const moduleResponse = await request(app.getHttpServer())
        .post('/courses/modules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId: createdCourseId,
          title: 'Test Module',
          orderIndex: 1,
        })
        .expect(201);

      const moduleId = moduleResponse.body.id;

      await request(app.getHttpServer())
        .post('/courses/lessons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId,
          title: 'Test Lesson',
          type: 'video',
          durationSeconds: 600,
          orderIndex: 1,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/courses/${createdCourseId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('published');
    });

    it('should require modules before publishing', async () => {
      // Create a new course without modules
      const newCourseResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testCourse,
          title: 'Course Without Modules',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/courses/${newCourseResponse.body.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('DELETE /courses/:id', () => {
    it('should delete a draft course', async () => {
      const draftCourseResponse = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testCourse,
          title: 'Draft Course to Delete',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/courses/${draftCourseResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should not delete published courses', async () => {
      await request(app.getHttpServer())
        .delete(`/courses/${createdCourseId}`) // This course is published
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /courses/search', () => {
    it('should search courses by query', async () => {
      const response = await request(app.getHttpServer())
        .get('/courses/search?q=Updated')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((course: any) => course.title.includes('Updated'))).toBe(true);
    });
  });
});
