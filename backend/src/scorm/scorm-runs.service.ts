import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScormRun } from './entities/scorm-run.entity';
import { ScormPackage } from './entities/scorm-package.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { LessonProgress } from '../courses/entities/lesson-progress.entity';

function parseScorm12TimeToSeconds(totalTime: string | null | undefined): number {
  // SCORM 1.2 total_time format: "HH:MM:SS" or "HH:MM:SS.ss" (also sometimes "H:MM:SS")
  if (!totalTime) return 0;
  const s = String(totalTime).trim();
  const m = s.match(/^(\d+):(\d{1,2}):(\d{1,2})(?:\.(\d+))?$/);
  if (!m) return 0;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = Number(m[3]);
  return Math.max(0, Math.floor(h * 3600 + min * 60 + sec));
}

@Injectable()
export class ScormRunsService {
  constructor(
    @InjectRepository(ScormRun)
    private readonly scormRunRepo: Repository<ScormRun>,
    @InjectRepository(ScormPackage)
    private readonly scormPackageRepo: Repository<ScormPackage>,
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async startRun(params: { scormPackageId: string; userId: string; courseId?: string; enrollmentId?: string }) {
    const pkg = await this.scormPackageRepo.findOne({ where: { id: params.scormPackageId } });
    if (!pkg) throw new HttpException('SCORM package not found', HttpStatus.NOT_FOUND);

    const run = await this.scormRunRepo.save(
      this.scormRunRepo.create({
        scormPackageId: params.scormPackageId,
        userId: params.userId,
        courseId: params.courseId ?? pkg.courseId ?? null,
        enrollmentId: params.enrollmentId ?? null,
        status: 'in_progress',
        startedAt: new Date(),
        cmi: {},
      }),
    );

    return {
      id: run.id,
      scormPackageId: run.scormPackageId,
      courseId: run.courseId,
      enrollmentId: run.enrollmentId,
      status: run.status,
      cmi: run.cmi,
      startedAt: run.startedAt,
    };
  }

  async commitRun(params: { runId: string; userId: string; cmi: any }) {
    const run = await this.scormRunRepo.findOne({ where: { id: params.runId } });
    if (!run) throw new HttpException('SCORM run not found', HttpStatus.NOT_FOUND);
    if (run.userId !== params.userId) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    const incoming = params.cmi ?? {};
    run.cmi = { ...(run.cmi || {}), ...incoming };

    const lessonStatus = incoming?.['cmi.core.lesson_status'] ?? incoming?.lesson_status ?? null;
    if (lessonStatus) run.lessonStatus = String(lessonStatus);

    const raw = incoming?.['cmi.core.score.raw'] ?? incoming?.score_raw;
    const min = incoming?.['cmi.core.score.min'] ?? incoming?.score_min;
    const max = incoming?.['cmi.core.score.max'] ?? incoming?.score_max;

    if (raw !== undefined && raw !== null && raw !== '') run.scoreRaw = Number(raw);
    if (min !== undefined && min !== null && min !== '') run.scoreMin = Number(min);
    if (max !== undefined && max !== null && max !== '') run.scoreMax = Number(max);

    const totalTime = incoming?.['cmi.core.total_time'] ?? incoming?.total_time;
    const seconds = parseScorm12TimeToSeconds(totalTime);
    if (seconds > 0) run.totalTimeSeconds = Math.max(run.totalTimeSeconds || 0, seconds);

    const saved = await this.scormRunRepo.save(run);

    return {
      id: saved.id,
      status: saved.status,
      lessonStatus: saved.lessonStatus,
      scoreRaw: saved.scoreRaw,
      scoreMin: saved.scoreMin,
      scoreMax: saved.scoreMax,
      totalTimeSeconds: saved.totalTimeSeconds,
      updatedAt: saved.updatedAt,
    };
  }

  async finishRun(params: { runId: string; userId: string; cmi?: any }) {
    if (params.cmi) {
      await this.commitRun({ runId: params.runId, userId: params.userId, cmi: params.cmi });
    }

    const run = await this.scormRunRepo.findOne({ where: { id: params.runId } });
    if (!run) throw new HttpException('SCORM run not found', HttpStatus.NOT_FOUND);
    if (run.userId !== params.userId) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    run.status = 'completed';
    run.completedAt = new Date();
    const saved = await this.scormRunRepo.save(run);

    const normalizedStatus = String(saved.lessonStatus || '').trim().toLowerCase();
    const isCompleted = normalizedStatus === 'completed' || normalizedStatus === 'passed';

    // Persist course-level progress for reporting (A1: SCORM package is the course)
    if (saved.courseId) {
      const existingProgress = await this.progressRepo.findOne({
        where: {
          userId: params.userId,
          courseId: saved.courseId,
          lessonId: null as any,
        } as any,
      });

      const p: LessonProgress = existingProgress
        ? existingProgress
        : (this.progressRepo.create({
            userId: params.userId,
            courseId: saved.courseId,
            lessonId: null,
            isCompleted: false,
            watchedSeconds: 0,
            quizAttempts: 0,
          } as any) as any);

      p.watchedSeconds = Math.max(Number(p.watchedSeconds || 0), Number(saved.totalTimeSeconds || 0));
      if (typeof saved.scoreRaw === 'number' && !Number.isNaN(saved.scoreRaw)) {
        p.bestQuizScore = Math.round(Number(saved.scoreRaw));
      }
      p.quizAttempts = Number(p.quizAttempts || 0) + 1;
      p.isCompleted = !!isCompleted;
      if (isCompleted) {
        p.completedAt = new Date();
      }

      await this.progressRepo.save(p as any);
    }

    // Update enrollment + certificates (A1)
    if (isCompleted && saved.courseId) {
      let enrollmentId = saved.enrollmentId;
      if (!enrollmentId) {
        const enrollment = await this.enrollmentsService.getMyEnrollmentForCourse(params.userId, saved.courseId);
        enrollmentId = enrollment?.id;
      }

      if (enrollmentId) {
        await this.enrollmentsService.updateProgress(
          enrollmentId,
          params.userId,
          new Date(),
        );
      }
    }

    return {
      id: saved.id,
      status: saved.status,
      lessonStatus: saved.lessonStatus,
      scoreRaw: saved.scoreRaw,
      totalTimeSeconds: saved.totalTimeSeconds,
      completedAt: saved.completedAt,
    };
  }
}


