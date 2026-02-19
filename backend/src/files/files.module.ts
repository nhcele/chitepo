import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentResource } from './entities/document.entity';
import { DocumentOcrProcessor } from './document-ocr.processor';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FilesController } from './files.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule, TypeOrmModule.forFeature([DocumentResource]), BullModule.registerQueue({ name: 'document-ocr' }), AnalyticsModule],
  controllers: [FilesController],
  providers: [FilesService, DocumentOcrProcessor],
  exports: [FilesService],
})
export class FilesModule {}

