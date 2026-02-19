import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoProcessingService } from './video-processing.service';
import { VideoProcessingController } from './video-processing.controller';
import { Lesson } from '../courses/entities/lesson.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson])],
  controllers: [VideoProcessingController],
  providers: [VideoProcessingService],
  exports: [VideoProcessingService],
})
export class VideoModule {}
