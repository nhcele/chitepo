import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@mindelta/shared';
import { ScormService } from './scorm.service';

@Controller('scorm')
export class ScormController {
  constructor(private readonly scormService: ScormService) {}

  @Post('packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('file'))
  async importPackage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { courseId?: string; version?: string },
  ) {
    return this.scormService.importPackage({ file, courseId: body?.courseId, version: body?.version });
  }

  @Get('packages/:id')
  @UseGuards(JwtAuthGuard)
  async getPackage(@Param('id') id: string) {
    return this.scormService.getPackage(id);
  }
}
