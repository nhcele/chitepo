import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { OfficialPosition, ComplianceAlert } from './entities/official-position.entity';
import { UserCertification } from '../certifications/entities/user-certification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfficialPosition,
      ComplianceAlert,
      UserCertification,
    ]),
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}

