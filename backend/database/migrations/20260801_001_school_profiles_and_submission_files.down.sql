-- Rollback for Acadex database migration 20260801_001.
-- WARNING: this removes data stored in the new profile tables and file metadata columns.
-- Run only on a backup-restorable environment after confirming that data loss is acceptable.

SET SESSION time_zone = '+00:00';

DROP TRIGGER IF EXISTS bu_submissions_grader_teacher;
DROP TRIGGER IF EXISTS bi_submissions_grader_teacher;
DROP TRIGGER IF EXISTS bu_submissions_file_security;
DROP TRIGGER IF EXISTS bi_submissions_file_security;
DROP TRIGGER IF EXISTS bu_teacher_profiles_role;
DROP TRIGGER IF EXISTS bi_teacher_profiles_role;
DROP TRIGGER IF EXISTS bu_student_profiles_role;
DROP TRIGGER IF EXISTS bi_student_profiles_role;

ALTER TABLE courseStudents
  DROP INDEX idx_course_students_status;

ALTER TABLE events
  DROP CHECK chk_events_date_range,
  DROP INDEX idx_events_start_date;

ALTER TABLE tasks
  DROP INDEX idx_tasks_status,
  DROP INDEX idx_tasks_due_date;

ALTER TABLE submissions
  DROP CHECK chk_submissions_file_size,
  DROP CHECK chk_submissions_grade_nonnegative,
  DROP INDEX idx_submissions_scan_status,
  DROP COLUMN scan_result,
  DROP COLUMN scan_status,
  DROP COLUMN file_hash,
  DROP COLUMN file_size,
  DROP COLUMN mime_type,
  DROP COLUMN file_extension,
  DROP COLUMN stored_file_name,
  DROP COLUMN original_file_name,
  DROP COLUMN storage_key,
  MODIFY COLUMN grade DECIMAL(5,2) NULL;

DROP TABLE IF EXISTS teacher_profiles;
DROP TABLE IF EXISTS student_profiles;

ALTER TABLE users
  DROP INDEX idx_users_status,
  DROP INDEX idx_users_last_name,
  DROP INDEX idx_users_name,
  DROP COLUMN phone,
  DROP COLUMN date_of_birth,
  DROP COLUMN last_name;

