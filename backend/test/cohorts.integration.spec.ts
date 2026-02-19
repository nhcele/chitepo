import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CohortsModule } from '../src/cohorts/cohorts.module';
import { AuthModule } from '../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TrainingCohort, CohortEnrollment } from '../src/cohorts/entities/training-cohort.entity';
import { User } from '../src/users/entities/user.entity';

describe('Cohorts API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let cohortId: string;

  const testUser = {
    email: 'cohortuser@test.com',
    password: 'password123',
    name: 'Test Cohort User',
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
          entities: [TrainingCohort, CohortEnrollment, User],
          synchronize: true,
        }),
        CohortsModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login
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

    // Get an existing cohort (would normally be seeded)
    const cohortsResponse = await request(app.getHttpServer())
      .get('/cohorts/upcoming')
      .expect(200);

    if (cohortsResponse.body.length > 0) {
      cohortId = cohortsResponse.body[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cohort Lifecycle', () => {
    it('should complete full cohort lifecycle', async () => {
      if (!cohortId) {
        console.log('Skipping test - no cohort available');
        return;
      }

      // Step 1: Get cohort details
      const cohortResponse = await request(app.getHttpServer())
        .get(`/cohorts/${cohortId}`)
        .expect(200);

      expect(cohortResponse.body).toHaveProperty('id');
      expect(cohortResponse.body).toHaveProperty('name');

      // Step 2: Get statistics
      const statsResponse = await request(app.getHttpServer())
        .get(`/cohorts/${cohortId}/statistics`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('statistics');

      // Step 3: Enroll in cohort (if open)
      if (cohortResponse.body.status === 'open_for_enrollment') {
        const enrollResponse = await request(app.getHttpServer())
          .post(`/cohorts/${cohortId}/enroll`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(enrollResponse.body).toHaveProperty('id');
        expect(enrollResponse.body.status).toBe('enrolled');

        // Step 4: Get user enrollments
        const userEnrollmentsResponse = await request(app.getHttpServer())
          .get('/cohorts/user/enrollments')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(userEnrollmentsResponse.body)).toBe(true);
        expect(userEnrollmentsResponse.body.some((e: any) => e.cohortId === cohortId)).toBe(true);

        // Step 5: Withdraw from cohort
        await request(app.getHttpServer())
          .delete(`/cohorts/${cohortId}/withdraw`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    });

    it('should get cohorts by filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/cohorts?track=dcc_training')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get upcoming cohorts', async () => {
      const response = await request(app.getHttpServer())
        .get('/cohorts/upcoming')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get calendar view', async () => {
      const response = await request(app.getHttpServer())
        .get('/cohorts/calendar/2025')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Graduation Workflow', () => {
    it('should check graduation eligibility', async () => {
      if (!cohortId) return;

      const response = await request(app.getHttpServer())
        .get(`/cohorts/${cohortId}/graduation/eligibility/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('eligible');
      expect(response.body).toHaveProperty('attendancePercentage');
    });

    it('should get graduation statistics', async () => {
      if (!cohortId) return;

      const response = await request(app.getHttpServer())
        .get(`/cohorts/${cohortId}/graduation/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('totalEnrolled');
      expect(response.body).toHaveProperty('eligible');
    });
  });
});


