require("dotenv").config();

const db = require("../src/config/db");

const query = async (sql, params = []) => db.query(sql, params);

const columnExists = async (table, column) => {
  const [rows] = await query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  return rows.length > 0;
};

const indexExists = async (table, indexName) => {
  const [rows] = await query(
    `
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    `,
    [table, indexName]
  );

  return rows.length > 0;
};

const foreignKeyExists = async (constraintName) => {
  const [rows] = await query(
    `
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME = ?
    `,
    [constraintName]
  );

  return rows.length > 0;
};

const triggerExists = async (triggerName) => {
  const [rows] = await query(
    `
    SELECT TRIGGER_NAME
    FROM INFORMATION_SCHEMA.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE()
      AND TRIGGER_NAME = ?
    `,
    [triggerName]
  );

  return rows.length > 0;
};

const addColumn = async (table, column, definition) => {
  if (await columnExists(table, column)) {
    console.log(`skip column ${table}.${column}`);
    return;
  }

  await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`added column ${table}.${column}`);
};

const addIndex = async (table, indexName, definition) => {
  if (await indexExists(table, indexName)) {
    console.log(`skip index ${table}.${indexName}`);
    return;
  }

  await query(`ALTER TABLE ${table} ADD ${definition}`);
  console.log(`added index ${table}.${indexName}`);
};

const addForeignKey = async (constraintName, table, definition) => {
  if (await foreignKeyExists(constraintName)) {
    console.log(`skip fk ${constraintName}`);
    return;
  }

  await query(`ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} ${definition}`);
  console.log(`added fk ${constraintName}`);
};

const replaceTrigger = async (triggerName, sql) => {
  if (await triggerExists(triggerName)) {
    await query(`DROP TRIGGER ${triggerName}`);
  }

  await query(sql);
  console.log(`created trigger ${triggerName}`);
};

const migrate = async () => {
  await addColumn(
    "users",
    "status",
    "ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER role"
  );

  await addColumn(
    "courses",
    "status",
    "ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER teacherId"
  );

  await addColumn(
    "tasks",
    "maxScore",
    "DECIMAL(5,2) NOT NULL DEFAULT 100.00 AFTER dueDate"
  );
  await addColumn(
    "tasks",
    "status",
    "ENUM('draft','published','closed') NOT NULL DEFAULT 'published' AFTER maxScore"
  );
  await addColumn("tasks", "createdBy", "INT NULL AFTER status");

  await addColumn("submissions", "grade", "DECIMAL(5,2) NULL AFTER fileUrl");
  await addColumn("submissions", "feedback", "TEXT NULL AFTER grade");
  await addColumn(
    "submissions",
    "status",
    "ENUM('pending','submitted','reviewed','graded','late') NOT NULL DEFAULT 'submitted' AFTER feedback"
  );
  await addColumn("submissions", "gradedBy", "INT NULL AFTER status");
  await addColumn("submissions", "gradedAt", "DATETIME NULL AFTER gradedBy");

  await query(
    `
    ALTER TABLE courseStudents
    MODIFY status ENUM('active','pending','inactive','enrolled','completed','withdrawn','suspended')
    NOT NULL DEFAULT 'active'
    `
  );
  await query("UPDATE courseStudents SET status = 'active' WHERE status = 'enrolled'");
  console.log("normalized courseStudents.status");

  await addColumn("courseStudents", "enrolledAt", "DATETIME NULL AFTER status");
  await addColumn(
    "courseStudents",
    "createdAt",
    "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER enrolledAt"
  );
  await addColumn(
    "courseStudents",
    "updatedAt",
    "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt"
  );
  await query("UPDATE courseStudents SET enrolledAt = COALESCE(enrolledAt, registeredAt)");

  await addColumn("events", "courseId", "INT NULL AFTER id");
  await addColumn("events", "createdBy", "INT NULL AFTER userId");
  await addColumn("events", "title", "VARCHAR(255) NULL AFTER createdBy");
  await addColumn("events", "description", "TEXT NULL AFTER title");
  await addColumn("events", "startDate", "DATETIME NULL AFTER eventType");
  await addColumn("events", "endDate", "DATETIME NULL AFTER startDate");
  await addColumn("events", "location", "VARCHAR(255) NULL AFTER endDate");
  await addColumn("events", "meetingUrl", "VARCHAR(500) NULL AFTER location");
  await addColumn(
    "events",
    "updatedAt",
    "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt"
  );

  await addColumn(
    "notifications",
    "type",
    "ENUM('task_created','submission_created','submission_graded','course_updated','general') NOT NULL DEFAULT 'general' AFTER userId"
  );
  await addColumn("notifications", "title", "VARCHAR(255) NULL AFTER type");
  await addColumn("notifications", "referenceId", "INT NULL AFTER message");
  await addColumn("notifications", "referenceType", "VARCHAR(80) NULL AFTER referenceId");
  await addColumn("notifications", "readAt", "DATETIME NULL AFTER isRead");

  await addIndex("users", "idxUsersRoleStatus", "INDEX idxUsersRoleStatus (role, status)");
  await addIndex("courses", "idxCoursesTeacherStatus", "INDEX idxCoursesTeacherStatus (teacherId, status)");
  await addIndex("tasks", "idxTasksCourseStatus", "INDEX idxTasksCourseStatus (courseId, status)");
  await addIndex("tasks", "idxTasksCreatedBy", "INDEX idxTasksCreatedBy (createdBy)");
  await addIndex("submissions", "idxSubmissionsStatus", "INDEX idxSubmissionsStatus (status)");
  await addIndex("submissions", "idxSubmissionsGradedBy", "INDEX idxSubmissionsGradedBy (gradedBy)");
  await addIndex("events", "idxEventsCourse", "INDEX idxEventsCourse (courseId)");
  await addIndex("events", "idxEventsCreatedBy", "INDEX idxEventsCreatedBy (createdBy)");
  await addIndex("notifications", "idxNotificationsRead", "INDEX idxNotificationsRead (userId, isRead)");

  await addForeignKey(
    "fkTasksCreatedBy",
    "tasks",
    "FOREIGN KEY (createdBy) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL"
  );
  await addForeignKey(
    "fkSubmissionsGradedBy",
    "submissions",
    "FOREIGN KEY (gradedBy) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL"
  );
  await addForeignKey(
    "fkEventsCourse",
    "events",
    "FOREIGN KEY (courseId) REFERENCES courses(id) ON UPDATE CASCADE ON DELETE CASCADE"
  );
  await addForeignKey(
    "fkEventsCreatedBy",
    "events",
    "FOREIGN KEY (createdBy) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL"
  );

  await replaceTrigger(
    "bi_courses_teacher_role",
    `
    CREATE TRIGGER bi_courses_teacher_role
    BEFORE INSERT ON courses
    FOR EACH ROW
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.teacherId
          AND role = 'teacher'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El teacherId debe pertenecer a un profesor activo';
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bu_courses_teacher_role",
    `
    CREATE TRIGGER bu_courses_teacher_role
    BEFORE UPDATE ON courses
    FOR EACH ROW
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.teacherId
          AND role = 'teacher'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El teacherId debe pertenecer a un profesor activo';
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bi_courseStudents_student_role",
    `
    CREATE TRIGGER bi_courseStudents_student_role
    BEFORE INSERT ON courseStudents
    FOR EACH ROW
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.studentId
          AND role = 'student'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'studentId debe pertenecer a un estudiante activo';
      END IF;
      SET NEW.enrolledAt = COALESCE(NEW.enrolledAt, NOW());
    END
    `
  );

  await replaceTrigger(
    "bu_courseStudents_student_role",
    `
    CREATE TRIGGER bu_courseStudents_student_role
    BEFORE UPDATE ON courseStudents
    FOR EACH ROW
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.studentId
          AND role = 'student'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'studentId debe pertenecer a un estudiante activo';
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bi_tasks_integrity",
    `
    CREATE TRIGGER bi_tasks_integrity
    BEFORE INSERT ON tasks
    FOR EACH ROW
    BEGIN
      IF NEW.maxScore <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'maxScore debe ser mayor que cero';
      END IF;
      IF NEW.createdBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bu_tasks_integrity",
    `
    CREATE TRIGGER bu_tasks_integrity
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    BEGIN
      IF NEW.maxScore <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'maxScore debe ser mayor que cero';
      END IF;
      IF NEW.createdBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        LEFT JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bi_submissions_integrity",
    `
    CREATE TRIGGER bi_submissions_integrity
    BEFORE INSERT ON submissions
    FOR EACH ROW
    BEGIN
      DECLARE course_id_value INT;
      DECLARE max_score_value DECIMAL(5,2);
      SELECT courseId, maxScore INTO course_id_value, max_score_value
      FROM tasks
      WHERE id = NEW.taskId;

      IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.studentId
          AND role = 'student'
          AND deletedAt IS NULL
          AND COALESCE(status, 'active') = 'active'
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'studentId debe pertenecer a un estudiante activo';
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM courseStudents
        WHERE courseId = course_id_value
          AND studentId = NEW.studentId
          AND status IN ('active', 'enrolled')
          AND deletedAt IS NULL
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El estudiante no esta matriculado en el curso de la tarea';
      END IF;

      IF NEW.grade IS NOT NULL AND (NEW.grade < 0 OR NEW.grade > max_score_value) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La calificacion debe estar entre 0 y maxScore';
      END IF;

      IF NEW.gradedBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = course_id_value
        WHERE u.id = NEW.gradedBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'gradedBy debe ser admin o profesor asignado al curso';
      END IF;

      IF NEW.grade IS NOT NULL THEN
        SET NEW.status = 'graded';
        SET NEW.gradedAt = COALESCE(NEW.gradedAt, NOW());
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bu_submissions_integrity",
    `
    CREATE TRIGGER bu_submissions_integrity
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    BEGIN
      DECLARE course_id_value INT;
      DECLARE max_score_value DECIMAL(5,2);
      SELECT courseId, maxScore INTO course_id_value, max_score_value
      FROM tasks
      WHERE id = NEW.taskId;

      IF NEW.grade IS NOT NULL AND (NEW.grade < 0 OR NEW.grade > max_score_value) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La calificacion debe estar entre 0 y maxScore';
      END IF;

      IF NEW.gradedBy IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = course_id_value
        WHERE u.id = NEW.gradedBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'gradedBy debe ser admin o profesor asignado al curso';
      END IF;

      IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
        SET NEW.status = 'graded';
        SET NEW.gradedAt = COALESCE(NEW.gradedAt, NOW());
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bi_events_integrity",
    `
    CREATE TRIGGER bi_events_integrity
    BEFORE INSERT ON events
    FOR EACH ROW
    BEGIN
      IF NEW.createdBy IS NOT NULL AND NEW.courseId IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END
    `
  );

  await replaceTrigger(
    "bu_events_integrity",
    `
    CREATE TRIGGER bu_events_integrity
    BEFORE UPDATE ON events
    FOR EACH ROW
    BEGIN
      IF NEW.createdBy IS NOT NULL AND NEW.courseId IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN courses c ON c.id = NEW.courseId
        WHERE u.id = NEW.createdBy
          AND u.role IN ('admin', 'teacher')
          AND (u.role = 'admin' OR c.teacherId = u.id)
      ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'createdBy debe ser admin o profesor asignado al curso';
      END IF;
    END
    `
  );
};

migrate()
  .then(async () => {
    await db.end();
    console.log("migration completed");
  })
  .catch(async (error) => {
    console.error(error);
    await db.end();
    process.exit(1);
  });
