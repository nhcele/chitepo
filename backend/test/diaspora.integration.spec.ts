import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DiasporaModule } from '../src/diaspora/diaspora.module';
import { CohortsModule } from '../src/cohorts/cohorts.module';
import { AuthModule } from '../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../src/users/entities/user.entity';
import { Enrollment } from '../src/courses/entities/enrollment.entity';
import { Certificate } from '../src/certificates/entities/certificate.entity';
import { CohortEnrollment } from '../src/cohorts/entities/training-cohort.entity';

describe('Diaspora API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'diaspora@test.com',
    password: 'password123',
    name: 'Test Diaspora User',
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
          entities: [User, Enrollment, Certificate, CohortEnrollment],
          synchronize: true,
        }),
        DiasporaModule,
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Diaspora Enrollment Flow', () => {
    it('should get diaspora user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/diaspora/impact/profile/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('totalCoursesCompleted');
      expect(response.body).toHaveProperty('totalCertifications');
    });

    it('should track diaspora investment', async () => {
      const response = await request(app.getHttpServer())
        .post('/diaspora/impact/investment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10000,
          projectDescription: 'Test investment project',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should track diaspora project', async () => {
      const response = await request(app.getHttpServer())
        .post('/diaspora/impact/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectName: 'Test Project',
          projectType: 'community_development',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should track voter registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/diaspora/impact/voter-registration')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          count: 50,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Regional Impact Metrics', () => {
    it('should get regional impact metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/diaspora/impact/region/south_africa')
        .expect(200);

      expect(response.body).toHaveProperty('region');
      expect(response.body).toHaveProperty('totalMembers');
      expect(response.body).toHaveProperty('coursesCompleted');
    });

    it('should get all regional metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/diaspora/impact/regions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Diaspora Cohort Enrollment', () => {
    it('should enroll in diaspora virtual cohort', async () => {
      // Get diaspora cohorts
      const cohortsResponse = await request(app.getHttpServer())
        .get('/cohorts?track=diaspora_virtual')
        .expect(200);

      if (cohortsResponse.body.length > 0) {
        const cohortId = cohortsResponse.body[0].id;

        const enrollResponse = await request(app.getHttpServer())
          .post(`/cohorts/${cohortId}/enroll`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(enrollResponse.body).toHaveProperty('id');
        expect(enrollResponse.body.status).toBe('enrolled');
      }
    });
  });
});


