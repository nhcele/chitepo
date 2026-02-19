import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiasporaImpactController } from './diaspora-impact.controller';
import { DiasporaImpactService } from './diaspora-impact.service';
import { User } from '../users/entities/user.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';
import { Certificate } from '../certificates/entities/certificate.entity';
import { CohortEnrollment } from '../cohorts/entities/training-cohort.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Enrollment, Certificate, CohortEnrollment]),
  ],
  controllers: [DiasporaImpactController],
  providers: [DiasporaImpactService],
  exports: [DiasporaImpactService],
})
export class DiasporaModule {}

