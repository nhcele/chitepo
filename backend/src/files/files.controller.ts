import { Controller, Post, Delete, Get, Param, UseInterceptors, UploadedFile, UseGuards, ForbiddenException, Body, Query, Patch, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { AdminService } from '../admin/admin.service';
import { DocumentState } from './entities/document.entity';
import { UserRole, AnalyticsEventType } from '@mindelta/shared';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly adminService: AdminService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private async ensurePreDownloadEnabled() {
    const res = await this.adminService.getSettings();
    const enabled = !!res?.settings?.['feature.preDownloadEnabled'];
    if (!enabled) throw new ForbiddenException('Pre-download is disabled by admin');
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.filesService.uploadFile(file);
    return { fileUrl };
  }

  @Post('documents/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Req() req, @Body() body: any) {
    const scanIntake = this.parseBoolean(body.scanIntake);
    const tags = this.normalizeArray(body.tags);
    const accessRoles = this.normalizeArray(body.accessRoles);
    const accessDepartments = this.normalizeArray(body.accessDepartments);
    const doc = await this.filesService.uploadDocumentResource(file, {
      title: body.title,
      description: body.description,
      tags,
      department: body.department,
      retentionUntil: body.retentionUntil ? new Date(body.retentionUntil) : null,
      classification: body.classification,
      accessRoles,
      accessDepartments,
      tenantId: req.user?.tenantId,
      ownerId: req.user?.id,
      source: 'upload',
      extra: body.metadata,
    }, { scanIntake });
    return { success: true, data: doc };
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard)
  async listDocuments(
    @Req() req,
    @Query('q') q?: string,
    @Query('tags') tags?: string,
    @Query('state') state?: DocumentState,
    @Query('department') department?: string,
  ) {
    const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
    const docs = await this.filesService.listDocuments(req.user?.tenantId, {
      q,
      tags: tagList,
      state,
      department,
      accessRoles: [req.user?.role],
    });
    return { success: true, data: docs };
  }

  @Patch('documents/:id')
  @UseGuards(JwtAuthGuard)
  async updateDocument(@Param('id') id: string, @Req() req, @Body() body: any) {
    const doc = await this.filesService.updateDocumentWithAccessCheck(id, req.user, {
      title: body.title,
      description: body.description,
      tags: body.tags,
      department: body.department,
      classification: body.classification,
      retentionUntil: body.retentionUntil ? new Date(body.retentionUntil) : undefined,
      state: body.state,
    });
    return { success: true, data: doc };
  }

  @Post('documents/:id/archive')
  @UseGuards(JwtAuthGuard)
  async archiveDocument(@Param('id') id: string, @Req() req) {
    const doc = await this.filesService.updateDocumentWithAccessCheck(id, req.user, { state: DocumentState.ARCHIVED });
    return { success: true, data: doc };
  }

  @Post('documents/:id/reindex')
  @UseGuards(JwtAuthGuard)
  async reindexDocument(@Param('id') id: string, @Req() req) {
    const doc = await this.filesService.reindexDocument(id, req.user);
    return { success: true, data: doc };
  }

  @Post('upload/video')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const result = await this.filesService.uploadVideo(file);
    return result;
  }

  @Get('video/status/:jobId')
  @UseGuards(JwtAuthGuard)
  async getVideoProcessingStatus(@Param('jobId') jobId: string) {
    return this.filesService.getVideoProcessingStatus(jobId);
  }

  @Delete(':fileUrl')
  @UseGuards(JwtAuthGuard)
  async deleteFile(@Param('fileUrl') fileUrl: string) {
    await this.filesService.deleteFile(decodeURIComponent(fileUrl));
    return { message: 'File deleted successfully' };
  }

  @Get('signed-url/:key')
  @UseGuards(JwtAuthGuard)
  async getSignedUrl(@Param('key') key: string, @Req() req, @Query('courseId') courseId?: string) {
    await this.ensurePreDownloadEnabled();
    const signedUrl = await this.filesService.getSignedUrl(key);
    try {
      const doc = await this.filesService.findDocumentByFileKey(key);
      const resolvedCourseId = courseId || (doc?.metadata as any)?.courseId;
      await this.analyticsService.trackEvent({
        eventType: AnalyticsEventType.RESOURCE_DOWNLOADED,
        userId: req.user?.id,
        courseId: resolvedCourseId,
        sessionId: 'server',
        metadata: {
          fileKey: key,
          documentId: doc?.id || null,
          title: doc?.title || null,
          tags: doc?.tags || null,
          department: doc?.department || null,
          classification: doc?.classification || null,
          courseId: resolvedCourseId || null,
          tenantId: doc?.tenantId || req.user?.tenantId || null,
        },
      });
    } catch {}
    return { signedUrl };
  }

  private normalizeArray(value: any): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  }

  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
    return false;
  }
}
