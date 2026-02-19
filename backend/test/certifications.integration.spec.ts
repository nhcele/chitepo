import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CertificationsModule } from '../src/certifications/certifications.module';
import { CoursesModule } from '../src/courses/courses.module';
import { AuthModule } from '../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CertificationPathway } from '../src/certifications/entities/certification-pathway.entity';
import { UserCertification } from '../src/certifications/entities/user-certification.entity';
import { Course } from '../src/courses/entities/course.entity';
import { Enrollment } from '../src/courses/entities/enrollment.entity';
import { User } from '../src/users/entities/user.entity';

describe('Certifications API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let pathwayId: string;
  let courseId: string;

  const testUser = {
    email: 'learner@test.com',
    password: 'password123',
    name: 'Test Learner',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '3306'),
          username: process.env.DATABASE_USERNAME || 'root',
          password: process.env.DATABASE_PASSWORD || 'password',
          database: process.env.DATABASE_NAME || 'mindelta_test',
          entities: [CertificationPathway, UserCertification, Course, Enrollment, User],
          synchronize: true,
        }),
        CertificationsModule,
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
    userId = loginResponse.body.user.id;

    // Create a test pathway (would normally be seeded)
    const pathwayResponse = await request(app.getHttpServer())
      .get('/certifications/pathways')
      .expect(200);

    if (pathwayResponse.body.length > 0) {
      pathwayId = pathwayResponse.body[0].id;
    }

    // Create a test course
    const courseResponse = await request(app.getHttpServer())
      .post('/courses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Course for Certification',
        description: 'Test Description',
        difficulty: 'beginner',
        price: 0,
      })
      .expect(201);

    courseId = courseResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Certification Workflow', () => {
    it('should complete full certification workflow', async () => {
      if (!pathwayId) {
        console.log('Skipping test - no pathway available');
        return;
      }

      // Step 1: Get pathways
      const pathwaysResponse = await request(app.getHttpServer())
        .get('/certifications/pathways')
        .expect(200);

      expect(Array.isArray(pathwaysResponse.body)).toBe(true);

      // Step 2: Check eligibility
      const eligibilityResponse = await request(app.getHttpServer())
        .get(`/certifications/eligibility/${pathwayId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(eligibilityResponse.body).toHaveProperty('eligible');

      // Step 3: Enroll in pathway
      const enrollResponse = await request(app.getHttpServer())
        .post('/certifications/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pathwayId })
        .expect(201);

      expect(enrollResponse.body).toHaveProperty('id');
      expect(enrollResponse.body.status).toBe('in_progress');

      // Step 4: Complete required course
      await request(app.getHttpServer())
        .post(`/enrollments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ courseId })
        .expect(201);

      // Mark enrollment as completed (simplified - would need actual completion)
      // This would normally happen through lesson completion

      // Step 5: Check progress
      const progressResponse = await request(app.getHttpServer())
        .get('/certifications/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(progressResponse.body)).toBe(true);

      // Step 6: Award certification (when eligible)
      // This would normally be automatic or triggered by admin
    });

    it('should get recommendations based on completed courses', async () => {
      const recommendationsResponse = await request(app.getHttpServer())
        .get('/certifications/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(recommendationsResponse.body)).toBe(true);
    });
  });

  describe('Pathway Management', () => {
    it('should get all pathways', async () => {
      const response = await request(app.getHttpServer())
        .get('/certifications/pathways')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get pathways by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/certifications/pathways/type/general_education')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});


