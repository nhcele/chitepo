import { 
  Controller, 
  Get, 
  Post, 
  Body,
  Query, 
  Req, 
  UseGuards,
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PayoutService, PayoutCalculation, CoursePayout } from './payout.service';
import { Request } from 'express';

@Controller('instructor/payouts')
@UseGuards(JwtAuthGuard)
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get('calculate')
  async calculatePayout(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('platformFeePercentage') platformFeePercentage?: number,
    @Query('minimumPayoutAmount') minimumPayoutAmount?: number,
  ) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const settings = platformFeePercentage || minimumPayoutAmount ? {
      platformFeePercentage,
      minimumPayoutAmount,
    } : undefined;

    const payout = await this.payoutService.calculateInstructorPayout(
      instructorId,
      start,
      end,
      settings
    );

    return { payout };
  }

  @Get('summary')
  async getEarningsSummary(
    @Req() req: Request,
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    const summary = await this.payoutService.getInstructorEarningsSummary(
      instructorId,
      period
    );

    return { summary };
  }

  @Get('top-courses')
  async getTopPerformingCourses(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month'
  ) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    const courses = await this.payoutService.getTopPerformingCourses(
      instructorId,
      limit ? parseInt(limit) : 5,
      period
    );

    return { courses };
  }

  @Get('report')
  async generatePayoutReport(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const report = await this.payoutService.generatePayoutReport(
      instructorId,
      start,
      end
    );

    return { report };
  }

  @Post('validate')
  async validatePayoutAmount(
    @Req() req: Request,
    @Body() data: { amount: number }
  ) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    if (!data.amount || data.amount <= 0) {
      throw new BadRequestException('Valid payout amount is required');
    }

    const validation = await this.payoutService.validatePayoutAmount(
      instructorId,
      data.amount
    );

    return { validation };
  }

  @Get('current-month')
  async getCurrentMonthPayout(@Req() req: Request) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payout = await this.payoutService.calculateInstructorPayout(
      instructorId,
      monthStart,
      monthEnd
    );

    return { 
      period: {
        start: monthStart,
        end: monthEnd,
      },
      payout 
    };
  }

  @Get('dashboard')
  async getPayoutDashboard(@Req() req: Request) {
    const instructorId = (req as any).user?.id;
    
    if (!instructorId) {
      throw new BadRequestException('Instructor ID is required');
    }

    const [monthlySummary, topCourses, currentMonth] = await Promise.all([
      this.payoutService.getInstructorEarningsSummary(instructorId, 'month'),
      this.payoutService.getTopPerformingCourses(instructorId, 3, 'month'),
      this.getCurrentMonthPayout(req),
    ]);

    return {
      monthlySummary,
      topCourses,
      currentMonth: currentMonth.payout,
    };
  }
}
