-- T0-05: Read-only audit of the legacy `progress` table.
-- Safe to run on production: every query is a SELECT.
-- Run with:  mysql -u root -p chitepo < scripts/audit-progress-table.sql
-- (or docker compose exec mysql mysql -u root -p chitepo < audit-progress-table.sql)

SELECT 'progress table exists' AS check_name,
       COUNT(*) AS result
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'progress';

-- Total rows, lesson-level rows, course-level rows
SELECT 'progress total rows' AS check_name, COUNT(*) AS result FROM progress;
SELECT 'progress rows with lesson_id' AS check_name, COUNT(*) AS result FROM progress WHERE lesson_id IS NOT NULL;
SELECT 'progress course-level rows (lesson_id NULL)' AS check_name, COUNT(*) AS result FROM progress WHERE lesson_id IS NULL;
SELECT 'progress distinct users' AS check_name, COUNT(DISTINCT user_id) AS result FROM progress;

-- Freshness: when was the last row written?
SELECT 'progress newest updated_at' AS check_name, MAX(updated_at) AS result FROM progress;
SELECT 'progress oldest updated_at' AS check_name, MIN(updated_at) AS result FROM progress;

-- How many rows would the backfill actually insert?
SELECT 'rows needing backfill (lesson-level)' AS check_name, COUNT(*) AS result
FROM progress p
WHERE p.lesson_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lesson_progress lp
    WHERE lp.user_id = p.user_id AND lp.lesson_id = p.lesson_id
  );

SELECT 'rows needing backfill (course-level)' AS check_name, COUNT(*) AS result
FROM progress p
WHERE p.lesson_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM lesson_progress lp
    WHERE lp.user_id = p.user_id AND lp.course_id = p.course_id AND lp.lesson_id IS NULL
  );

-- Orphan check: lesson_ids that no longer resolve
SELECT 'progress rows pointing at missing lessons' AS check_name, COUNT(*) AS result
FROM progress p
LEFT JOIN lessons l ON l.id = p.lesson_id
WHERE p.lesson_id IS NOT NULL AND l.id IS NULL;

-- Conflicts: same (user, lesson) present in both tables with different completion state
SELECT 'conflicting completion rows' AS check_name, COUNT(*) AS result
FROM progress p
JOIN lesson_progress lp ON lp.user_id = p.user_id AND lp.lesson_id = p.lesson_id
WHERE p.completed <> lp.is_completed;

-- Current lesson_progress state
SELECT 'lesson_progress total rows' AS check_name, COUNT(*) AS result FROM lesson_progress;
SELECT 'lesson_progress rows missing course_id (pre-backfill)' AS check_name, COUNT(*) AS result FROM lesson_progress WHERE course_id IS NULL;
