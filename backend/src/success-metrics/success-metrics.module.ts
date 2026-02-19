import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuccessMetricsController } from './success-metrics.controller';
import { SuccessMetricsService } from './success-metrics.service';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { User } from '../users/entities/user.entity';
import { Progress } from '../assessments/entities/progress.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { UserCertification } from '../certifications/entities/user-certification.entity';
import { CertificationPathway } from '../certifications/entities/certification-pathway.entity';
import { QuizAttempt } from '../assessments/entities/quiz-attempt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      Course,
      User,
      Progress,
      Certificate,
      UserCertification,
      CertificationPathway,
      QuizAttempt,
    ]),
  ],
  controllers: [SuccessMetricsController],
  providers: [SuccessMetricsService],
  exports: [SuccessMetricsService],
})
export class SuccessMetricsModule {}

