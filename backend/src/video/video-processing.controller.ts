import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Post, 
  Query, 
  Req, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VideoProcessingService, TranscodingOptions } from './video-processing.service';
import { Request } from 'express';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoProcessingController {
  constructor(private readonly videoProcessingService: VideoProcessingService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('lessonId') lessonId: string,
    @Body('format') format?: 'HLS' | 'DASH' | 'MP4',
    @Body('resolutions') resolutions?: string
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    if (!lessonId) {
      throw new BadRequestException('Lesson ID is required');
    }

    const options: TranscodingOptions = {
      format: format || 'HLS',
      resolutions: resolutions ? resolutions.split(',') : ['720p', '1080p'],
    };

    const job = await this.videoProcessingService.processVideoUpload(
      file.buffer,
      file.originalname,
      lessonId
    );

    return { 
      message: 'Video uploaded and processing started',
      job 
    };
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await this.videoProcessingService.getJobStatus(jobId);
    return { job };
  }

  @Post('transcode')
  async createTranscodingJob(
    @Body() data: {
      inputPath: string;
      lessonId: string;
      format?: 'HLS' | 'DASH' | 'MP4';
      resolutions?: string[];
    }
  ) {
    const options: TranscodingOptions = {
      format: data.format || 'HLS',
      resolutions: data.resolutions || ['720p', '1080p'],
    };

    const job = await this.videoProcessingService.createTranscodingJob(
      data.inputPath,
      data.lessonId,
      options
    );

    return { 
      message: 'Transcoding job created',
      job 
    };
  }

  @Get('playlist/:outputPath')
  async getHLSPlaylist(@Param('outputPath') outputPath: string) {
    const playlistUrl = await this.videoProcessingService.generateHLSPlaylist(outputPath);
    return { playlistUrl };
  }

  @Get('download/:key')
  async getSignedDownloadUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: string
  ) {
    const url = await this.videoProcessingService.generateSignedDownloadUrl(
      key,
      expiresIn ? parseInt(expiresIn) : 3600
    );
    return { downloadUrl: url };
  }

  @Get('metadata/:key')
  async getVideoMetadata(@Param('key') key: string) {
    const metadata = await this.videoProcessingService.getVideoMetadata(key);
    return { metadata };
  }

  @Delete(':key')
  async deleteVideo(@Param('key') key: string) {
    await this.videoProcessingService.deleteVideo(key);
    return { message: 'Video deleted successfully' };
  }

  @Post('upload-raw')
  @UseInterceptors(FileInterceptor('video'))
  async uploadRawVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName?: string
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    const inputPath = await this.videoProcessingService.uploadVideo(
      file.buffer,
      fileName || file.originalname,
      file.mimetype
    );

    return { 
      message: 'Video uploaded successfully',
      inputPath 
    };
  }
}
