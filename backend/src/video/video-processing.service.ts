import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  MediaConvertClient, 
  CreateJobCommand,
  GetJobCommand,
  DescribeEndpointsCommand
} from '@aws-sdk/client-mediaconvert';
import { 
  S3Client, 
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Lesson } from '../courses/entities/lesson.entity';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface VideoJob {
  id: string;
  lessonId: string;
  status: 'SUBMITTED' | 'PROGRESSING' | 'COMPLETE' | 'CANCELED' | 'ERROR';
  inputPath: string;
  outputPath: string;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  outputs?: VideoOutput[];
}

interface VideoOutput {
  preset: 'HLS' | 'DASH' | 'MP4';
  uri: string;
  duration: number;
  resolution: string;
  bitrate: string;
}

export interface TranscodingOptions {
  format: 'HLS' | 'DASH' | 'MP4';
  resolutions: string[];
  bitrate?: string;
  frameRate?: number;
}

@Injectable()
export class VideoProcessingService {
  private mediaConvert: MediaConvertClient;
  private s3: S3Client;
  private bucketName: string;
  private roleArn: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
  ) {
    // Initialize MediaConvert client
    this.mediaConvert = new MediaConvertClient({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
      endpoint: this.configService.get<string>('AWS_MEDIACONVERT_ENDPOINT'),
    });

    // Initialize S3 client
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET')!;
    this.roleArn = this.configService.get<string>('AWS_MEDIACONVERT_ROLE_ARN')!;
  }

  async uploadVideo(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const key = `uploads/${Date.now()}-${fileName}`;
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3.send(command);
      
      // Return the S3 URI
      return `s3://${this.bucketName}/${key}`;
    } catch (error) {
      console.error('Video upload failed:', error);
      throw new Error('Failed to upload video to S3');
    }
  }

  async createTranscodingJob(
    inputPath: string,
    lessonId: string,
    options: TranscodingOptions = { format: 'HLS', resolutions: ['720p', '1080p'] }
  ): Promise<VideoJob> {
    try {
      // Generate output path
      const outputPath = `videos/${lessonId}/${Date.now()}/`;
      
      // Create MediaConvert job
      const jobSettings = this.buildJobSettings(inputPath, outputPath, options);
      
      const command = new CreateJobCommand({
        Role: this.roleArn,
        Settings: jobSettings,
        UserMetadata: {
          lessonId,
          inputPath,
          outputPath,
        },
      });

      const response = await this.mediaConvert.send(command);
      
      const job: VideoJob = {
        id: response.Job?.Id!,
        lessonId,
        status: response.Job?.Status as any,
        inputPath,
        outputPath,
        createdAt: new Date(),
      };

      // Store job metadata in lesson (or create a separate job tracking table)
      await this.lessonRepo.update(lessonId, {
        videoUrl: this.getOutputUrl(outputPath, options.format),
        durationSeconds: 0, // Will be updated when job completes
      });

      return job;
    } catch (error) {
      console.error('Failed to create transcoding job:', error);
      throw new Error('Failed to create transcoding job');
    }
  }

  async getJobStatus(jobId: string): Promise<VideoJob> {
    try {
      const command = new GetJobCommand({ Id: jobId });
      const response = await this.mediaConvert.send(command);
      
      const job = response.Job;
      if (!job) throw new Error('Job not found');

      return {
        id: job.Id!,
        lessonId: job.UserMetadata?.lessonId || '',
        status: job.Status as any,
        inputPath: job.UserMetadata?.inputPath || '',
        outputPath: job.UserMetadata?.outputPath || '',
        createdAt: new Date(job.CreatedAt!),
        completedAt: undefined, // Will be set when job is COMPLETE
        errorMessage: job.Status === 'ERROR' ? 'Job failed' : undefined,
        outputs: this.parseJobOutputs(job),
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw new Error('Failed to get job status');
    }
  }

  async generateHLSPlaylist(outputPath: string): Promise<string> {
    // Generate master playlist URL for HLS
    const playlistKey = `${outputPath}hls/master.m3u8`;
    return `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${playlistKey}`;
  }

  async generateSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteVideo(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw new Error('Failed to delete video');
    }
  }

  async getVideoMetadata(key: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3.send(command);
      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Failed to get video metadata:', error);
      throw new Error('Failed to get video metadata');
    }
  }

  private buildJobSettings(inputPath: string, outputPath: string, options: TranscodingOptions): any {
    const settings: any = {
      Inputs: [
        {
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT',
            },
          },
          VideoSelector: {
            ColorSpace: 'FOLLOW',
          },
          FilterEnable: 'AUTO',
          PsiControl: 'USE_PSI',
          TimecodeSource: 'EMBEDDED',
          FileInput: inputPath,
        },
      ],
      OutputGroups: [],
    };

    // Build output group based on format
    if (options.format === 'HLS') {
      settings.OutputGroups.push({
        Name: 'HLS Output Group',
        OutputGroupSettings: {
          Type: 'HLS_GROUP_SETTINGS',
          HlsGroupSettings: {
            SegmentLength: 10,
            MinSegmentLength: 0,
            Destination: `s3://${this.bucketName}/${outputPath}hls/`,
            SegmentControl: 'SEGMENTED_FILES',
          },
        },
        Outputs: this.buildHLSOutputs(options.resolutions),
      });
    } else if (options.format === 'MP4') {
      settings.OutputGroups.push({
        Name: 'MP4 Output Group',
        OutputGroupSettings: {
          Type: 'FILE_GROUP_SETTINGS',
          FileGroupSettings: {
            Destination: `s3://${this.bucketName}/${outputPath}mp4/`,
          },
        },
        Outputs: this.buildMP4Outputs(options.resolutions),
      });
    }

    return settings;
  }

  private buildHLSOutputs(resolutions: string[]): any[] {
    const outputs = [];
    
    const outputSettings = {
      '720p': { width: 1280, height: 720, bitrate: '5000000' },
      '1080p': { width: 1920, height: 1080, bitrate: '8000000' },
      '480p': { width: 854, height: 480, bitrate: '2500000' },
      '360p': { width: 640, height: 360, bitrate: '1000000' },
    };

    for (const resolution of resolutions) {
      const settings = outputSettings[resolution];
      if (!settings) continue;

      outputs.push({
        ContainerSettings: {
          Container: 'M3U8',
        },
        VideoDescription: {
          CodecSettings: {
            Codec: 'H_264',
            H264Settings: {
              RateControlMode: 'QVBR',
              QvbrSettings: {
                QvbrQualityLevel: 7,
              },
              MaxBitrate: parseInt(settings.bitrate),
              SceneChangeDetect: 'ENABLED',
              AdaptiveQuantization: 'ENABLED',
            },
          },
          Width: settings.width,
          Height: settings.height,
        },
        AudioDescriptions: [
          {
            CodecSettings: {
              Codec: 'AAC',
              AacSettings: {
                AudioDescriptionBroadcasterMix: 'NORMAL',
                RateControlMode: 'CBR',
                CodecProfile: 'LC',
                CodingMode: 'CODING_MODE_2_0',
                SampleRate: 48000,
                Bitrate: 128000,
              },
            },
          },
        ],
        NameModifier: `_${resolution}`,
      });
    }

    return outputs;
  }

  private buildMP4Outputs(resolutions: string[]): any[] {
    const outputs = [];
    
    const outputSettings = {
      '720p': { width: 1280, height: 720, bitrate: '5000000' },
      '1080p': { width: 1920, height: 1080, bitrate: '8000000' },
      '480p': { width: 854, height: 480, bitrate: '2500000' },
    };

    for (const resolution of resolutions) {
      const settings = outputSettings[resolution];
      if (!settings) continue;

      outputs.push({
        ContainerSettings: {
          Container: 'MP4',
        },
        VideoDescription: {
          CodecSettings: {
            Codec: 'H_264',
            H264Settings: {
              RateControlMode: 'QVBR',
              QvbrSettings: {
                QvbrQualityLevel: 7,
              },
              MaxBitrate: parseInt(settings.bitrate),
              SceneChangeDetect: 'ENABLED',
              AdaptiveQuantization: 'ENABLED',
            },
          },
          Width: settings.width,
          Height: settings.height,
        },
        AudioDescriptions: [
          {
            CodecSettings: {
              Codec: 'AAC',
              AacSettings: {
                AudioDescriptionBroadcasterMix: 'NORMAL',
                RateControlMode: 'CBR',
                CodecProfile: 'LC',
                CodingMode: 'CODING_MODE_2_0',
                SampleRate: 48000,
                Bitrate: 128000,
              },
            },
          },
        ],
        NameModifier: `_${resolution}`,
      });
    }

    return outputs;
  }

  private getOutputUrl(outputPath: string, format: string): string {
    const baseUrl = `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/`;
    
    if (format === 'HLS') {
      return `${baseUrl}${outputPath}hls/master.m3u8`;
    } else if (format === 'MP4') {
      return `${baseUrl}${outputPath}mp4/output_720p.mp4`;
    }
    
    return `${baseUrl}${outputPath}`;
  }

  private parseJobOutputs(job: any): VideoOutput[] {
    const outputs: VideoOutput[] = [];
    
    if (job.OutputGroupDetails) {
      for (const group of job.OutputGroupDetails) {
        for (const outputDetail of group.OutputDetails || []) {
          outputs.push({
            preset: 'HLS', // Would need to determine from output settings
            uri: outputDetail.OutputFilePaths?.[0] || '',
            duration: outputDetail.DurationInMs ? outputDetail.DurationInMs / 1000 : 0,
            resolution: `${outputDetail.VideoDetails?.WidthInPx}x${outputDetail.VideoDetails?.HeightInPx}`,
            bitrate: outputDetail.VideoDetails?.Bitrate || '0',
          });
        }
      }
    }
    
    return outputs;
  }

  async processVideoUpload(file: Buffer, fileName: string, lessonId: string): Promise<VideoJob> {
    // Upload original video
    const inputPath = await this.uploadVideo(file, fileName, 'video/mp4');
    
    // Create transcoding job
    const job = await this.createTranscodingJob(inputPath, lessonId, {
      format: 'HLS',
      resolutions: ['720p', '1080p'],
    });
    
    return job;
  }
}
