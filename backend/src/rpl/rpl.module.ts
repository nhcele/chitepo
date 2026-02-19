import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RPLController } from './rpl.controller';
import { RPLService } from './rpl.service';
import { RPLApplication } from './entities/rpl-application.entity';
import { CertificationPathway } from '../certifications/entities/certification-pathway.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RPLApplication,
      CertificationPathway,
    ]),
  ],
  controllers: [RPLController],
  providers: [RPLService],
  exports: [RPLService],
})
export class RPLModule {}

