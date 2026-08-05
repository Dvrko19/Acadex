require("dotenv").config();

const db = require("../src/config/db");

const verify = async () => {
  const tables = [
    "users",
    "courses",
    "courseStudents",
    "tasks",
    "submissions",
    "events",
    "notifications"
  ];

  const counts = {};
  for (const table of tables) {
    const [rows] = await db.query(`SELECT COUNT(*) AS total FROM ${table}`);
    counts[table] = rows[0].total;
  }

  console.log("counts", counts);

  const expectedColumns = {
    users: ["status"],
    courses: ["status"],
    tasks: ["maxScore", "status", "createdBy"],
    submissions: ["grade", "feedback", "status", "gradedBy", "gradedAt"],
    courseStudents: ["enrolledAt", "createdAt", "updatedAt"],
    events: [
      "courseId",
      "createdBy",
      "title",
      "description",
      "startDate",
      "endDate",
      "location",
      "meetingUrl",
      "updatedAt"
    ],
    notifications: ["type", "title", "referenceId", "referenceType", "readAt"]
  };

  const columns = {};
  for (const [table, names] of Object.entries(expectedColumns)) {
    const [rows] = await db.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME IN (${names.map(() => "?").join(",")})
      ORDER BY COLUMN_NAME
      `,
      [table, ...names]
    );
    columns[table] = rows.map((row) => row.COLUMN_NAME);
  }

  console.log("columns", columns);

  const [fks] = await db.query(
    `
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND CONSTRAINT_NAME IN (
        'fkTasksCreatedBy',
        'fkSubmissionsGradedBy',
        'fkEventsCourse',
        'fkEventsCreatedBy'
      )
    ORDER BY CONSTRAINT_NAME
    `
  );

  console.log("fks", fks.map((row) => row.CONSTRAINT_NAME));

  const [triggers] = await db.query(
    `
    SELECT TRIGGER_NAME
    FROM INFORMATION_SCHEMA.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE()
      AND (
        TRIGGER_NAME LIKE '%_integrity'
        OR TRIGGER_NAME LIKE '%_role'
      )
    ORDER BY TRIGGER_NAME
    `
  );

  console.log("triggers", triggers.map((row) => row.TRIGGER_NAME));

  const [submissions] = await db.query(
    `
    SELECT
      s.id,
      s.taskId,
      s.studentId,
      s.status,
      s.grade,
      s.feedback,
      s.gradedBy,
      t.maxScore
    FROM submissions s
    INNER JOIN tasks t ON t.id = s.taskId
    ORDER BY s.id
    LIMIT 10
    `
  );

  console.log("submissions", submissions);

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    const [tasks] = await connection.query("SELECT id FROM tasks ORDER BY id LIMIT 1");
    const [students] = await connection.query(
      "SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1"
    );

    await connection.query(
      `
      INSERT INTO submissions
        (taskId, studentId, fileUrl, grade, gradedBy)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        tasks[0].id,
        students[0].id,
        "https://example.com/invalid-grade.pdf",
        101,
        null
      ]
    );

    console.log("invalidGradeTest", "FAILED");
  } catch (error) {
    console.log("invalidGradeTest", "PASSED", error.message);
  } finally {
    await connection.rollback();
    connection.release();
  }
};

verify()
  .then(async () => {
    await db.end();
    console.log("verification completed");
  })
  .catch(async (error) => {
    console.error(error);
    await db.end();
    process.exit(1);
  });
