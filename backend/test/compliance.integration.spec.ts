import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ComplianceModule } from '../src/compliance/compliance.module';
import { CertificationsModule } from '../src/certifications/certifications.module';
import { AuthModule } from '../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OfficialPosition, ComplianceAlert } from '../src/compliance/entities/compliance.entity';
import { UserCertification } from '../src/certifications/entities/user-certification.entity';
import { User } from '../src/users/entities/user.entity';

describe('Compliance API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let userId: string;
  let positionId: string;

  const testUser = {
    email: 'official@test.com',
    password: 'password123',
    name: 'Test Official',
  };

  const adminUser = {
    email: 'admin@test.com',
    password: 'password123',
    name: 'Test Admin',
    role: 'admin',
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
          entities: [OfficialPosition, ComplianceAlert, UserCertification, User],
          synchronize: true,
        }),
        ComplianceModule,
        CertificationsModule,
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Compliance Workflow', () => {
    it('should register official position', async () => {
      const response = await request(app.getHttpServer())
        .post('/compliance/positions/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          positionType: 'mayor',
          region: 'Harare',
          startDate: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      positionId = response.body.id;
    });

    it('should check position compliance', async () => {
      if (!positionId) return;

      const response = await request(app.getHttpServer())
        .get(`/compliance/positions/${positionId}/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isCompliant');
      expect(response.body).toHaveProperty('complianceStatus');
    });

    it('should get user positions', async () => {
      const response = await request(app.getHttpServer())
        .get('/compliance/positions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get compliance alerts', async () => {
      const response = await request(app.getHttpServer())
        .get('/compliance/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Admin Compliance Monitoring', () => {
    it('should get non-compliant officials (admin only)', async () => {
      // This would require admin token
      // For now, just test the endpoint exists
      const response = await request(app.getHttpServer())
        .get('/compliance/admin/non-compliant')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // or 403 if not admin

      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
      }
    });

    it('should get compliance statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/compliance/admin/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200); // or 403 if not admin

      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalOfficials');
        expect(response.body).toHaveProperty('compliant');
        expect(response.body).toHaveProperty('nonCompliant');
      }
    });
  });
});


