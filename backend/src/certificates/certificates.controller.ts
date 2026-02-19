import { Controller, Get, Post, Body, Param, UseGuards, Request, Res, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from '@mindelta/shared';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificatesService.create(createCertificateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.certificatesService.findAll();
  }

  @Get('verify/:serial')
  verify(@Param('serial') serial: string) {
    return this.certificatesService.verify(serial);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  findByUser(@Param('userId') userId: string) {
    return this.certificatesService.findByUser(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req) {
    return this.certificatesService.findByUser(req.user.id);
  }

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  findByCourse(@Param('courseId') courseId: string) {
    return this.certificatesService.findByCourse(courseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async download(@Param('id') id: string, @Request() req, @Res() res: Response) {
    const cert = await this.certificatesService.findOne(id);
    if (!cert || cert.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this certificate');
    }
    const pdf = await this.certificatesService.generatePdf(cert);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.serial}.pdf"`);
    return res.send(Buffer.from(pdf));
  }

  // Dev-only issuance for testing
  @Post('dev/issue')
  @UseGuards(JwtAuthGuard)
  async devIssue(@Request() req, @Body() body: { courseId: string; finalScore?: number; skillsTags?: string[] }) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, message: 'Disabled in production' };
    }
    const cert = await this.certificatesService.create({
      userId: req.user.id,
      courseId: body.courseId,
      finalScore: body.finalScore ?? 100,
      skillsTags: body.skillsTags ?? [],
    } as any);
    return { success: true, data: cert };
  }
}
