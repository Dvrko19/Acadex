-- Acadex database migration 20260801_001
-- Target: MySQL 9.x
-- Additive migration. It does not remove or rename existing columns or tables.
-- Existing camelCase columns are retained because the current application uses them.

SET SESSION time_zone = '+00:00';

ALTER TABLE users
  ADD COLUMN last_name VARCHAR(100) NULL AFTER name,
  ADD COLUMN date_of_birth DATE NULL AFTER email,
  ADD COLUMN phone VARCHAR(30) NULL AFTER date_of_birth,
  ADD INDEX idx_users_name (name),
  ADD INDEX idx_users_last_name (last_name),
  ADD INDEX idx_users_status (status);

CREATE TABLE student_profiles (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  student_number VARCHAR(50) NOT NULL,
  grade_level VARCHAR(50) NOT NULL,
  section VARCHAR(20) NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  guardian_name VARCHAR(150) NULL,
  guardian_phone VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_profiles_user (user_id),
  UNIQUE KEY uq_student_profiles_number (student_number),
  KEY idx_student_profiles_grade (academic_year, grade_level, section),
  CONSTRAINT fk_student_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE teacher_profiles (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  employee_number VARCHAR(50) NULL,
  subject_area VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_teacher_profiles_user (user_id),
  UNIQUE KEY uq_teacher_profiles_employee (employee_number),
  KEY idx_teacher_profiles_subject (subject_area),
  CONSTRAINT fk_teacher_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE submissions
  ADD COLUMN storage_key VARCHAR(500) NULL AFTER fileUrl,
  ADD COLUMN original_file_name VARCHAR(255) NULL AFTER storage_key,
  ADD COLUMN stored_file_name VARCHAR(255) NULL AFTER original_file_name,
  ADD COLUMN file_extension VARCHAR(20) NULL AFTER stored_file_name,
  ADD COLUMN mime_type VARCHAR(150) NULL AFTER file_extension,
  ADD COLUMN file_size BIGINT UNSIGNED NULL AFTER mime_type,
  ADD COLUMN file_hash VARCHAR(128) NULL AFTER file_size,
  ADD COLUMN scan_status ENUM(
    'pending', 'scanning', 'clean', 'infected', 'rejected', 'scan_failed'
  ) NOT NULL DEFAULT 'pending' AFTER file_hash,
  ADD COLUMN scan_result TEXT NULL AFTER scan_status,
  MODIFY COLUMN grade DECIMAL(6,2) NULL,
  ADD INDEX idx_submissions_scan_status (scan_status),
  ADD CONSTRAINT chk_submissions_grade_nonnegative
    CHECK (grade IS NULL OR grade >= 0),
  ADD CONSTRAINT chk_submissions_file_size
    CHECK (file_size IS NULL OR file_size > 0);

ALTER TABLE tasks
  ADD INDEX idx_tasks_due_date (dueDate),
  ADD INDEX idx_tasks_status (status);

ALTER TABLE events
  ADD INDEX idx_events_start_date (startDate),
  ADD CONSTRAINT chk_events_date_range
    CHECK (endDate IS NULL OR startDate IS NULL OR endDate > startDate);

ALTER TABLE courseStudents
  ADD INDEX idx_course_students_status (status);

DELIMITER $$

CREATE TRIGGER bi_student_profiles_role
BEFORE INSERT ON student_profiles
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.user_id AND role = 'student'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'student_profiles.user_id debe pertenecer a un estudiante';
  END IF;
END$$

CREATE TRIGGER bu_student_profiles_role
BEFORE UPDATE ON student_profiles
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.user_id AND role = 'student'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'student_profiles.user_id debe pertenecer a un estudiante';
  END IF;
END$$

CREATE TRIGGER bi_teacher_profiles_role
BEFORE INSERT ON teacher_profiles
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.user_id AND role = 'teacher'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'teacher_profiles.user_id debe pertenecer a un profesor';
  END IF;
END$$

CREATE TRIGGER bu_teacher_profiles_role
BEFORE UPDATE ON teacher_profiles
FOR EACH ROW
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = NEW.user_id AND role = 'teacher'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'teacher_profiles.user_id debe pertenecer a un profesor';
  END IF;
END$$

CREATE TRIGGER bi_submissions_file_security
BEFORE INSERT ON submissions
FOR EACH ROW
BEGIN
  IF NEW.file_extension IS NOT NULL THEN
    SET NEW.file_extension = LOWER(TRIM(LEADING '.' FROM NEW.file_extension));
    IF BINARY NEW.file_extension NOT IN ('pdf', 'pptx') THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo se permiten archivos PDF o PPTX sin macros';
    END IF;
  END IF;

  IF NEW.mime_type IS NOT NULL AND BINARY NEW.mime_type NOT IN (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tipo MIME no permitido para la entrega';
  END IF;

  IF NEW.file_extension = 'pdf' AND NEW.mime_type IS NOT NULL
     AND BINARY NEW.mime_type <> 'application/pdf' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La extension PDF no coincide con el tipo MIME';
  END IF;

  IF NEW.file_extension = 'pptx' AND NEW.mime_type IS NOT NULL
     AND BINARY NEW.mime_type <>
       'application/vnd.openxmlformats-officedocument.presentationml.presentation' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La extension PPTX no coincide con el tipo MIME';
  END IF;

  IF NEW.original_file_name IS NOT NULL AND (
    LOCATE('/', NEW.original_file_name) > 0
    OR LOCATE(CHAR(92), NEW.original_file_name) > 0
    OR LENGTH(NEW.original_file_name) - LENGTH(REPLACE(NEW.original_file_name, '.', '')) <> 1
    OR LOWER(SUBSTRING_INDEX(NEW.original_file_name, '.', -1)) NOT IN ('pdf', 'pptx')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Nombre de archivo inseguro o con doble extension';
  END IF;

  IF NEW.stored_file_name IS NOT NULL AND (
    LOCATE('/', NEW.stored_file_name) > 0
    OR LOCATE(CHAR(92), NEW.stored_file_name) > 0
    OR LENGTH(NEW.stored_file_name) - LENGTH(REPLACE(NEW.stored_file_name, '.', '')) <> 1
    OR LOWER(SUBSTRING_INDEX(NEW.stored_file_name, '.', -1)) NOT IN ('pdf', 'pptx')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Nombre interno inseguro o con doble extension';
  END IF;

  IF NEW.storage_key IS NOT NULL AND LOWER(NEW.storage_key) LIKE 'http%' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'storage_key debe ser una clave interna, no una URL publica';
  END IF;

  IF NEW.fileUrl IS NOT NULL
     AND NEW.fileUrl NOT LIKE '/api/submissions/%/file' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'fileUrl debe apuntar al endpoint autenticado de la entrega';
  END IF;
END$$

CREATE TRIGGER bu_submissions_file_security
BEFORE UPDATE ON submissions
FOR EACH ROW
BEGIN
  IF NEW.file_extension IS NOT NULL THEN
    SET NEW.file_extension = LOWER(TRIM(LEADING '.' FROM NEW.file_extension));
    IF BINARY NEW.file_extension NOT IN ('pdf', 'pptx') THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo se permiten archivos PDF o PPTX sin macros';
    END IF;
  END IF;

  IF NEW.mime_type IS NOT NULL AND BINARY NEW.mime_type NOT IN (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tipo MIME no permitido para la entrega';
  END IF;

  IF NEW.file_extension = 'pdf' AND NEW.mime_type IS NOT NULL
     AND BINARY NEW.mime_type <> 'application/pdf' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La extension PDF no coincide con el tipo MIME';
  END IF;

  IF NEW.file_extension = 'pptx' AND NEW.mime_type IS NOT NULL
     AND BINARY NEW.mime_type <>
       'application/vnd.openxmlformats-officedocument.presentationml.presentation' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'La extension PPTX no coincide con el tipo MIME';
  END IF;

  IF NEW.original_file_name IS NOT NULL AND (
    LOCATE('/', NEW.original_file_name) > 0
    OR LOCATE(CHAR(92), NEW.original_file_name) > 0
    OR LENGTH(NEW.original_file_name) - LENGTH(REPLACE(NEW.original_file_name, '.', '')) <> 1
    OR LOWER(SUBSTRING_INDEX(NEW.original_file_name, '.', -1)) NOT IN ('pdf', 'pptx')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Nombre de archivo inseguro o con doble extension';
  END IF;

  IF NEW.stored_file_name IS NOT NULL AND (
    LOCATE('/', NEW.stored_file_name) > 0
    OR LOCATE(CHAR(92), NEW.stored_file_name) > 0
    OR LENGTH(NEW.stored_file_name) - LENGTH(REPLACE(NEW.stored_file_name, '.', '')) <> 1
    OR LOWER(SUBSTRING_INDEX(NEW.stored_file_name, '.', -1)) NOT IN ('pdf', 'pptx')
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Nombre interno inseguro o con doble extension';
  END IF;

  IF NEW.storage_key IS NOT NULL AND LOWER(NEW.storage_key) LIKE 'http%' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'storage_key debe ser una clave interna, no una URL publica';
  END IF;

  IF NEW.fileUrl IS NOT NULL
     AND NEW.fileUrl NOT LIKE '/api/submissions/%/file' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'fileUrl debe apuntar al endpoint autenticado de la entrega';
  END IF;
END$$

CREATE TRIGGER bi_submissions_grader_teacher
BEFORE INSERT ON submissions
FOR EACH ROW
BEGIN
  IF NEW.gradedBy IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM users u
    INNER JOIN tasks t ON t.id = NEW.taskId
    INNER JOIN courses c ON c.id = t.courseId
    WHERE u.id = NEW.gradedBy
      AND u.role = 'teacher'
      AND c.teacherId = u.id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'gradedBy debe ser el profesor asignado al curso';
  END IF;
END$$

CREATE TRIGGER bu_submissions_grader_teacher
BEFORE UPDATE ON submissions
FOR EACH ROW
BEGIN
  IF NEW.gradedBy IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM users u
    INNER JOIN tasks t ON t.id = NEW.taskId
    INNER JOIN courses c ON c.id = t.courseId
    WHERE u.id = NEW.gradedBy
      AND u.role = 'teacher'
      AND c.teacherId = u.id
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'gradedBy debe ser el profesor asignado al curso';
  END IF;
END$$

DELIMITER ;

