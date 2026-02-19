import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentResource, DocumentState } from './entities/document.entity';

type OcrStatus = 'skipped' | 'queued' | 'processing' | 'succeeded' | 'failed' | 'unavailable';

type OcrResult = {
  textContent: string | null;
  ocr: {
    status: OcrStatus;
    engine?: string;
    error?: string;
    updatedAt: string;
  };
};

@Injectable()
export class FilesService {
  private s3: AWS.S3;
  private mediaConvert: AWS.MediaConvert;
  private textract?: AWS.Textract;
  private bucketName: string;
  private cloudFrontDomain?: string;
  private videoOutputPrefix: string;
  private mediaConvertRoleArn?: string;
  private mediaConvertEndpoint?: string;
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(DocumentResource)
    private readonly documentRepository: Repository<DocumentResource>,
    @InjectQueue('document-ocr')
    private readonly ocrQueue: Queue,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET');

    this.cloudFrontDomain = this.configService.get('AWS_CLOUDFRONT_DOMAIN');
    this.videoOutputPrefix = this.configService.get('VIDEO_OUTPUT_PREFIX') || 'videos';
    this.mediaConvertRoleArn = this.configService.get('AWS_MEDIACONVERT_ROLE_ARN');
    this.mediaConvertEndpoint = this.configService.get('AWS_MEDIACONVERT_ENDPOINT');

    const textractRegion = this.configService.get('AWS_TEXTRACT_REGION') || this.configService.get('AWS_REGION');
    if (textractRegion) {
      this.textract = new AWS.Textract({
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        region: textractRegion,
      });
    }

    if (this.mediaConvertEndpoint) {
      this.mediaConvert = new AWS.MediaConvert({
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        region: this.configService.get('AWS_REGION'),
        endpoint: this.mediaConvertEndpoint,
      });
    } else {
      // Lazy initialize later if endpoint is discovered at runtime
      this.mediaConvert = new AWS.MediaConvert({
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        region: this.configService.get('AWS_REGION'),
      });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    // Check if AWS S3 is configured
    if (!this.bucketName) {
      this.logger.warn('AWS S3 bucket not configured, using local file storage');
      return this.uploadFileLocally(file, folder);
    }

    const key = `${folder}/${uuidv4()}-${file.originalname}`;
    
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    try {
      const result = await this.s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error.message}, falling back to local storage`);
      return this.uploadFileLocally(file, folder);
    }
  }

  private async uploadFileLocally(file: Express.Multer.File, folder: string = 'uploads'): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filename = `${uuidv4()}-${file.originalname}`;
    const filepath = path.join(uploadDir, filename);
    
    await fs.writeFile(filepath, file.buffer);
    
    // Return a URL that can be served by the backend
    const baseUrl = this.configService.get('API_URL') || 'http://localhost:3001';
    return `${baseUrl}/uploads/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(fileUrl);
    
    const deleteParams = {
      Bucket: this.bucketName,
      Key: key,
    };

    await this.s3.deleteObject(deleteParams).promise();
  }

  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: expires,
    });
  }

  async findDocumentByFileKey(fileKey: string): Promise<DocumentResource | null> {
    if (!fileKey) return null;
    return this.documentRepository.findOne({ where: { fileKey } });
  }

  private extractKeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return url.pathname.substring(1); // Remove leading slash
  }

  // Library document helpers
  async uploadDocumentResource(
    file: Express.Multer.File,
    metadata: {
      title: string;
      description?: string;
      tags?: string[];
      department?: string;
      retentionUntil?: Date | null;
      classification?: string;
      accessRoles?: string[];
      accessDepartments?: string[];
      tenantId?: string;
      ownerId?: string;
      source?: string;
      extra?: Record<string, any>;
    },
    options?: {
      scanIntake?: boolean;
    },
  ): Promise<DocumentResource> {
    if (!metadata?.title) {
      throw new BadRequestException('Title is required');
    }

    const fileUrl = await this.uploadFile(file, 'documents');
    const fileKey = this.bucketName ? this.extractKeyFromUrl(fileUrl) : null;
    const scanIntake = !!options?.scanIntake;
    let extraction: OcrResult = { textContent: null, ocr: this.buildOcrMeta('skipped') };
    let queueOcr = false;

    if (this.isPlainTextMimeType(file.mimetype) && file.buffer) {
      const textContent = file.buffer.toString('utf-8').slice(0, 50000);
      extraction = { textContent, ocr: this.buildOcrMeta('skipped', 'plain-text') };
    } else if (!scanIntake) {
      extraction = { textContent: null, ocr: this.buildOcrMeta('skipped') };
    } else if (!this.canRunOcr(file.mimetype, fileKey)) {
      extraction = {
        textContent: null,
        ocr: this.buildOcrMeta(
          'unavailable',
          'textract',
          this.textract ? 'OCR unavailable for this file type' : 'Textract not configured',
        ),
      };
    } else {
      extraction = { textContent: null, ocr: this.buildOcrMeta('queued', 'textract') };
      queueOcr = true;
    }

    const ocrMeta = extraction.ocr;
    const mergedMetadata = {
      ...(metadata.extra || {}),
      scanIntake,
      ocr: ocrMeta,
    };
    const doc = this.documentRepository.create({
      tenantId: metadata.tenantId,
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      department: metadata.department,
      retentionUntil: metadata.retentionUntil || null,
      classification: metadata.classification,
      ownerId: metadata.ownerId,
      accessRoles: metadata.accessRoles as any,
      accessDepartments: metadata.accessDepartments,
      fileUrl,
      fileKey,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      source: metadata.source,
      metadata: mergedMetadata,
      state: DocumentState.ACTIVE,
      version: 1,
      textContent: extraction.textContent,
    });

    const saved = await this.documentRepository.save(doc);
    if (queueOcr) {
      await this.queueDocumentOcr(saved.id);
    }
    return saved;
  }

  private async extractTextForSearch(input: {
    mimeType?: string;
    buffer?: Buffer;
    scanIntake?: boolean;
    fileKey?: string | null;
  }): Promise<OcrResult> {
    const updatedAt = new Date().toISOString();
    try {
      if (this.isPlainTextMimeType(input.mimeType || '') && input.buffer) {
        const textContent = input.buffer.toString('utf-8').slice(0, 50000);
        return { textContent, ocr: { status: 'skipped', engine: 'plain-text', updatedAt } };
      }
      if (!input.scanIntake) {
        return { textContent: null, ocr: { status: 'skipped', updatedAt } };
      }

      if (!this.textract) {
        return {
          textContent: null,
          ocr: { status: 'unavailable', engine: 'textract', error: 'Textract not configured', updatedAt },
        };
      }

      const mimeType = input.mimeType || '';
      if (this.isImageMimeType(mimeType) && input.buffer) {
        const textContent = await this.runTextractForImage(input.buffer);
        return { textContent: textContent?.slice(0, 50000) || null, ocr: { status: 'succeeded', engine: 'textract', updatedAt } };
      }

      if (this.isPdfMimeType(mimeType)) {
        if (!this.bucketName || !input.fileKey) {
          return {
            textContent: null,
            ocr: { status: 'unavailable', engine: 'textract', error: 'PDF OCR requires S3 storage', updatedAt },
          };
        }
        const textContent = await this.runTextractForPdfS3(input.fileKey);
        return { textContent: textContent?.slice(0, 50000) || null, ocr: { status: 'succeeded', engine: 'textract', updatedAt } };
      }

      return { textContent: null, ocr: { status: 'skipped', updatedAt } };
    } catch {
      return {
        textContent: null,
        ocr: { status: 'failed', engine: 'textract', error: 'OCR extraction failed', updatedAt },
      };
    }
  }

  private isPdfMimeType(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  private isImageMimeType(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isPlainTextMimeType(mimeType: string): boolean {
    return mimeType.startsWith('text/');
  }

  private canRunOcr(mimeType: string, fileKey?: string | null): boolean {
    if (!this.textract) return false;
    if (this.isImageMimeType(mimeType)) return true;
    if (this.isPdfMimeType(mimeType)) {
      return !!this.bucketName && !!fileKey;
    }
    return false;
  }

  private buildOcrMeta(status: OcrStatus, engine?: string, error?: string): OcrResult['ocr'] {
    const payload: OcrResult['ocr'] = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (engine) payload.engine = engine;
    if (error) payload.error = error;
    return payload;
  }

  private async runTextractForImage(buffer: Buffer): Promise<string | null> {
    if (!this.textract) return null;
    const res = await this.textract
      .detectDocumentText({
        Document: { Bytes: buffer },
      })
      .promise();
    return this.extractLinesFromBlocks(res.Blocks || []);
  }

  private async runTextractForPdfS3(fileKey: string): Promise<string | null> {
    if (!this.textract || !this.bucketName) return null;
    const start = await this.textract
      .startDocumentTextDetection({
        DocumentLocation: { S3Object: { Bucket: this.bucketName, Name: fileKey } },
      })
      .promise();
    const jobId = start.JobId;
    if (!jobId) {
      throw new Error('Textract job could not be started');
    }

    const deadline = Date.now() + 20000;
    let nextToken: string | undefined;
    let blocks: AWS.Textract.Block[] = [];

    while (true) {
      const res = await this.textract
        .getDocumentTextDetection({
          JobId: jobId,
          NextToken: nextToken,
        })
        .promise();

      const status = res.JobStatus;
      if (status === 'FAILED') {
        throw new Error(res.StatusMessage || 'Textract job failed');
      }

      if (status === 'IN_PROGRESS') {
        if (Date.now() > deadline) {
          throw new Error('Textract job timed out');
        }
        await this.sleep(1000);
        continue;
      }

      if (res.Blocks?.length) {
        blocks = blocks.concat(res.Blocks);
      }

      if (!res.NextToken) {
        break;
      }
      nextToken = res.NextToken;
    }

    return this.extractLinesFromBlocks(blocks);
  }

  private extractLinesFromBlocks(blocks: AWS.Textract.Block[]): string {
    return blocks
      .filter((block) => block.BlockType === 'LINE' && block.Text)
      .map((block) => block.Text)
      .join('\n');
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async loadDocumentBuffer(doc: DocumentResource): Promise<Buffer | null> {
    if (this.bucketName && doc.fileKey) {
      const res = await this.s3.getObject({ Bucket: this.bucketName, Key: doc.fileKey }).promise();
      if (res.Body && Buffer.isBuffer(res.Body)) return res.Body;
      if (res.Body) return Buffer.from(res.Body as any);
    }

    try {
      const url = new URL(doc.fileUrl);
      if (url.pathname.startsWith('/uploads/')) {
        const fs = require('fs').promises;
        const path = require('path');
        const localPath = path.join(process.cwd(), url.pathname.replace('/uploads/', 'uploads/'));
        return await fs.readFile(localPath);
      }
    } catch {
      // ignore invalid URL
    }

    return null;
  }

  async reindexDocument(
    id: string,
    user: { id: string; role: string; tenantId?: string },
  ): Promise<DocumentResource> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new BadRequestException('Document not found');
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const hasRoleAccess = !doc.accessRoles || doc.accessRoles.length === 0 || doc.accessRoles.includes(user.role as any);
    if (!(isAdmin || doc.ownerId === user.id || hasRoleAccess)) {
      throw new ForbiddenException('Not allowed to reindex document');
    }

    if (!doc.mimeType) {
      return doc;
    }

    if (!this.isPlainTextMimeType(doc.mimeType) && !this.canRunOcr(doc.mimeType, doc.fileKey)) {
      doc.metadata = {
        ...(doc.metadata || {}),
        scanIntake: true,
        ocr: this.buildOcrMeta(
          'unavailable',
          'textract',
          this.textract ? 'OCR unavailable for this file type' : 'Textract not configured',
        ),
      };
      return this.documentRepository.save(doc);
    }

    doc.metadata = {
      ...(doc.metadata || {}),
      scanIntake: true,
      ocr: this.buildOcrMeta('queued', this.isPlainTextMimeType(doc.mimeType) ? 'plain-text' : 'textract'),
    };

    const saved = await this.documentRepository.save(doc);
    await this.queueDocumentOcr(saved.id);
    return saved;
  }

  private async queueDocumentOcr(docId: string): Promise<void> {
    if (!this.ocrQueue) return;
    await this.ocrQueue.add(
      'extract',
      { docId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async processDocumentOcr(docId: string): Promise<void> {
    const doc = await this.documentRepository.findOne({ where: { id: docId } });
    if (!doc) return;

    doc.metadata = {
      ...(doc.metadata || {}),
      scanIntake: doc.metadata?.scanIntake ?? true,
      ocr: this.buildOcrMeta('processing', this.isPlainTextMimeType(doc.mimeType || '') ? 'plain-text' : 'textract'),
    };
    await this.documentRepository.save(doc);

    const buffer = await this.loadDocumentBuffer(doc);
    const extraction = await this.extractTextForSearch({
      mimeType: doc.mimeType,
      buffer: buffer || undefined,
      scanIntake: true,
      fileKey: doc.fileKey,
    });

    doc.textContent = extraction.textContent;
    doc.metadata = {
      ...(doc.metadata || {}),
      scanIntake: true,
      ocr: extraction.ocr,
    };

    await this.documentRepository.save(doc);
  }

  async listDocuments(
    tenantId: string | undefined,
    query?: { q?: string; tags?: string[]; state?: DocumentState; department?: string; accessRoles?: string[] },
  ): Promise<DocumentResource[]> {
    const qb = this.documentRepository.createQueryBuilder('doc');
    qb.orderBy('doc.createdAt', 'DESC');
    if (tenantId) qb.andWhere('doc.tenantId = :tenantId', { tenantId });
    if (query?.state) qb.andWhere('doc.state = :state', { state: query.state });
    if (query?.department) qb.andWhere('doc.department = :department', { department: query.department });
    if (query?.q) {
      const q = `%${query.q.toLowerCase()}%`;
      qb.andWhere('(LOWER(doc.title) LIKE :q OR LOWER(doc.textContent) LIKE :q)', { q });
    }
    if (query?.tags?.length) {
      const tagConds = query.tags.map((_, idx) => `FIND_IN_SET(:tag${idx}, doc.tags)`);
      tagConds.forEach((cond, idx) => qb.orWhere(cond, { [`tag${idx}`]: query.tags![idx] }));
    }

    const docs = await qb.getMany();

    // Simple access filter: if accessRoles set on doc, require overlap
    if (query?.accessRoles?.length) {
      return docs.filter((d) => {
        if (!d.accessRoles || d.accessRoles.length === 0) return true;
        return d.accessRoles.some((role) => query.accessRoles.includes(role as any));
      });
    }

    return docs;
  }

  async updateDocument(
    id: string,
    updates: Partial<Pick<DocumentResource, 'title' | 'description' | 'tags' | 'department' | 'classification' | 'retentionUntil' | 'state'>>,
  ): Promise<DocumentResource> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new BadRequestException('Document not found');
    }

    Object.assign(doc, updates);
    return this.documentRepository.save(doc);
  }

  async updateDocumentWithAccessCheck(
    id: string,
    user: { id: string; role: string; tenantId?: string },
    updates: Partial<Pick<DocumentResource, 'title' | 'description' | 'tags' | 'department' | 'classification' | 'retentionUntil' | 'state'>>,
  ): Promise<DocumentResource> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new BadRequestException('Document not found');
    }

    // Basic access control: owner or admin roles can edit; otherwise require doc accessRoles to include user role
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const hasRoleAccess = !doc.accessRoles || doc.accessRoles.length === 0 || doc.accessRoles.includes(user.role as any);
    if (!(isAdmin || doc.ownerId === user.id || hasRoleAccess)) {
      throw new ForbiddenException('Not allowed to update document');
    }

    return this.updateDocument(id, updates);
  }

  async uploadVideo(file: Express.Multer.File): Promise<{ fileUrl: string; jobId: string }> {
    // 1) Upload source to S3 under uploads/videos
    const fileUrl = await this.uploadFile(file, 'uploads/videos');

    // If AWS is not configured, return the uploaded file URL without processing
    if (!this.bucketName || !this.mediaConvertRoleArn) {
      this.logger.warn('AWS MediaConvert not configured, returning raw video URL without transcoding');
      return { 
        fileUrl, 
        jobId: 'local-' + uuidv4() 
      };
    }

    // 2) Submit MediaConvert job to produce HLS outputs
    const source = this.toS3UrlParts(fileUrl);
    const jobToken = uuidv4();
    const destinationS3 = `s3://${this.bucketName}/${this.videoOutputPrefix}/${jobToken}/`;

    // Ensure endpoint is configured (for first-time usage)
    if (!this.mediaConvert.config.endpoint) {
      try {
        const endpoints = await this.mediaConvert.describeEndpoints({ MaxResults: 1 }).promise();
        const endpointUrl = endpoints.Endpoints?.[0]?.Url;
        if (endpointUrl) {
          this.mediaConvert.config.endpoint = endpointUrl;
        }
      } catch (e) {
        this.logger.warn(`Unable to auto-discover MediaConvert endpoint: ${e}`);
      }
    }

    if (!this.mediaConvertRoleArn) {
      this.logger.warn('AWS_MEDIACONVERT_ROLE_ARN not configured, skipping video transcoding');
      return { 
        fileUrl, 
        jobId: 'no-transcode-' + uuidv4() 
      };
    }

    // Use a broad type to avoid verbose AWS MediaConvert type gymnastics; runtime validation occurs server-side.
    const params: any = {
      Role: this.mediaConvertRoleArn,
      UserMetadata: {
        app: 'mindelta',
        jobToken,
      },
      Settings: {
        TimecodeConfig: { Source: 'ZEROBASED' },
        Inputs: [
          {
            FileInput: `s3://${source.bucket}/${source.key}`,
            TimecodeSource: 'ZEROBASED',
            VideoSelector: {},
            AudioSelectors: {
              'Audio Selector 1': { DefaultSelection: 'DEFAULT' },
            },
          },
        ],
        OutputGroups: [
          {
            Name: 'HLS Group',
            OutputGroupSettings: {
              Type: 'HLS_GROUP_SETTINGS',
              HlsGroupSettings: {
                Destination: destinationS3,
                SegmentLength: 6,
                MinSegmentLength: 0,
                ManifestDurationFormat: 'INTEGER',
                OutputSelection: 'MANIFESTS_AND_SEGMENTS',
                StreamInfResolution: 'INCLUDE',
                ClientCache: 'ENABLED',
                DirectoryStructure: 'SINGLE_DIRECTORY',
                ManifestCompression: 'GZIP',
                TimedMetadataId3Frame: 'PRIV',
              },
            },
            Outputs: [
              {
                NameModifier: '_1080p',
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      QvbrQualityLevel: 7,
                      MaxBitrate: 6000000,
                    },
                  },
                  Height: 1080,
                  Width: 1920,
                },
                AudioDescriptions: [
                  {
                    CodecSettings: { Codec: 'AAC', AacSettings: { Bitrate: 128000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 } },
                  },
                ],
                ContainerSettings: { Container: 'M3U8' },
              },
              {
                NameModifier: '_720p',
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      QvbrQualityLevel: 7,
                      MaxBitrate: 3000000,
                    },
                  },
                  Height: 720,
                  Width: 1280,
                },
                AudioDescriptions: [
                  {
                    CodecSettings: { Codec: 'AAC', AacSettings: { Bitrate: 128000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 } },
                  },
                ],
                ContainerSettings: { Container: 'M3U8' },
              },
              {
                NameModifier: '_480p',
                VideoDescription: {
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      QvbrQualityLevel: 7,
                      MaxBitrate: 1200000,
                    },
                  },
                  Height: 480,
                  Width: 854,
                },
                AudioDescriptions: [
                  {
                    CodecSettings: { Codec: 'AAC', AacSettings: { Bitrate: 96000, CodingMode: 'CODING_MODE_2_0', SampleRate: 48000 } },
                  },
                ],
                ContainerSettings: { Container: 'M3U8' },
              },
            ],
          },
        ],
      },
    };

    const job = await this.mediaConvert.createJob(params).promise();
    const jobId = job.Job?.Id || jobToken;

    this.logger.log(`Submitted MediaConvert job ${jobId} for source ${source.key}`);

    return { fileUrl, jobId };
  }

  async getVideoProcessingStatus(jobId: string): Promise<any> {
    try {
      const res = await this.mediaConvert.getJob({ Id: jobId }).promise();
      const status = res.Job?.Status || 'UNKNOWN';

      // Construct expected HLS manifest URL via CloudFront if configured, else S3 website
      const basePath = `${this.videoOutputPrefix}/${jobId}`;
      const playlist = 'master.m3u8';
      const hlsUrl = this.cloudFrontDomain
        ? `https://${this.cloudFrontDomain}/${basePath}/${playlist}`
        : `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${basePath}/${playlist}`;

      return {
        jobId,
        status,
        outputUrls: {
          hls: hlsUrl,
        },
      };
    } catch (e) {
      this.logger.error(`Failed to get MediaConvert job status for ${jobId}: ${e}`);
      throw e;
    }
  }

  private toS3UrlParts(fileUrl: string): { bucket: string; key: string } {
    // fileUrl may be https://s3... or https://<bucket>.s3.<region>.amazonaws.com/key
    // We rely on our uploadFile which uses this.bucketName, so parse accordingly
    const url = new URL(fileUrl);
    let bucket = this.bucketName;
    let key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

    // Handle virtual-hosted-style URL
    const host = url.hostname;
    const vhMatch = host.match(/^([^.]+)\.s3[.-][a-z0-9-]+\.amazonaws\.com$/);
    if (vhMatch) {
      bucket = vhMatch[1];
    }
    return { bucket, key };
  }
}
