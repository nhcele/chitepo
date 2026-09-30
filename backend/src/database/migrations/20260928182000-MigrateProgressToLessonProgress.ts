import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills lesson_progress from the legacy `progress` table.
 *
 * SAFETY: This migration only INSERTS rows that do not already exist for a
 * given (user_id, lesson_id) — or (user_id, course_id) for course-level SCORM
 * rows. It does not delete or overwrite existing lesson_progress rows, and it
 * is a no-op on databases where the legacy `progress` table does not exist.
 * Run it only after confirming in production that the `progress` rows are
 * authoritative and not stale duplicates of lesson_progress.
 */
export class MigrateProgressToLessonProgress20260928182000 implements MigrationInterface {
  name = 'MigrateProgressToLessonProgress20260928182000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count: tableExists }] = await queryRunner.query(
      `SELECT COUNT(*) AS count
         FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'progress'`,
    );
    if (Number(tableExists) === 0) {
      return;
    }

    // Per-lesson rows — includes the denormalized course_id via the lesson join.
    await queryRunner.query(
      `INSERT INTO lesson_progress (
        id,
        user_id,
        lesson_id,
        course_id,
        is_completed,
        watch_percent,
        watched_seconds,
        active_seconds,
        best_quiz_score,
        quiz_attempts,
        last_quiz_attempt_at,
        completed_at,
        created_at,
        updated_at
      )
      SELECT
        UUID(),
        p.user_id,
        p.lesson_id,
        m.course_id,
        p.completed,
        CASE WHEN p.completed = TRUE THEN 100 ELSE 0 END,
        COALESCE(p.watch_time, 0),
        COALESCE(p.watch_time, 0),
        NULLIF(p.score, 0),
        p.attempts,
        CASE WHEN p.score IS NOT NULL THEN p.last_accessed END,
        p.completion_date,
        p.created_at,
        p.updated_at
      FROM progress p
      LEFT JOIN lessons l ON l.id = p.lesson_id
      LEFT JOIN modules m ON m.id = l.module_id
      WHERE p.lesson_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM lesson_progress lp
          WHERE lp.user_id = p.user_id AND lp.lesson_id = p.lesson_id
        )`,
    );

    // Course-level rows (e.g. legacy SCORM progress with no lesson).
    await queryRunner.query(
      `INSERT INTO lesson_progress (
        id,
        user_id,
        lesson_id,
        course_id,
        is_completed,
        watch_percent,
        watched_seconds,
        active_seconds,
        best_quiz_score,
        quiz_attempts,
        last_quiz_attempt_at,
        completed_at,
        created_at,
        updated_at
      )
      SELECT
        UUID(),
        p.user_id,
        NULL,
        p.course_id,
        p.completed,
        CASE WHEN p.completed = TRUE THEN 100 ELSE 0 END,
        COALESCE(p.watch_time, 0),
        COALESCE(p.watch_time, 0),
        NULLIF(p.score, 0),
        p.attempts,
        CASE WHEN p.score IS NOT NULL THEN p.last_accessed END,
        p.completion_date,
        p.created_at,
        p.updated_at
      FROM progress p
      WHERE p.lesson_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM lesson_progress lp
          WHERE lp.user_id = p.user_id
            AND lp.course_id = p.course_id
            AND lp.lesson_id IS NULL
        )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Intentionally a no-op: removing migrated rows would require identifying
    // them, which is unsafe without preserving the source UUID mapping.
  }
}
