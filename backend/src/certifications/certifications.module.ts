import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationsController } from './certifications.controller';
import { CertificationsService } from './certifications.service';
import { CertificationPathway } from './entities/certification-pathway.entity';
import { UserCertification } from './entities/user-certification.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../courses/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CertificationPathway,
      UserCertification,
      Course,
      Enrollment,
    ]),
  ],
  controllers: [CertificationsController],
  providers: [CertificationsService],
  exports: [CertificationsService],
})
export class CertificationsModule {}

