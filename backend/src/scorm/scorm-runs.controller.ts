import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScormRunsService } from './scorm-runs.service';

@Controller('scorm/runs')
export class ScormRunsController {
  constructor(private readonly scormRunsService: ScormRunsService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async start(@Req() req: any, @Body() body: { scormPackageId: string; courseId?: string; enrollmentId?: string }) {
    const userId = req.user?.id;
    return this.scormRunsService.startRun({
      scormPackageId: body.scormPackageId,
      userId,
      courseId: body.courseId,
      enrollmentId: body.enrollmentId,
    });
  }

  @Post(':runId/commit')
  @UseGuards(JwtAuthGuard)
  async commit(@Req() req: any, @Param('runId') runId: string, @Body() body: { cmi: any }) {
    const userId = req.user?.id;
    return this.scormRunsService.commitRun({ runId, userId, cmi: body?.cmi });
  }

  @Post(':runId/finish')
  @UseGuards(JwtAuthGuard)
  async finish(@Req() req: any, @Param('runId') runId: string, @Body() body: { cmi?: any }) {
    const userId = req.user?.id;
    return this.scormRunsService.finishRun({ runId, userId, cmi: body?.cmi });
  }
}



