const db = require("../config/db");
const notificationService = require("./notifications.service");

const getAdminDashboard = async (userId) => {
  const [[courses], [tasks], [users], unreadNotifications, [recentActivity]] =
    await Promise.all([
      db.query("SELECT COUNT(*) AS totalCourses FROM courses WHERE deletedAt IS NULL"),
      db.query("SELECT COUNT(*) AS totalTasks FROM tasks WHERE deletedAt IS NULL"),
      db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE deletedAt IS NULL"),
      notificationService.countUnreadByUser(userId),
      db.query(
        `
        SELECT id, eventType, title, description, createdAt
        FROM events
        ORDER BY createdAt DESC
        LIMIT 8
        `
      )
    ]);

  return {
    totalCourses: courses[0].totalCourses,
    totalTasks: tasks[0].totalTasks,
    totalUsers: users[0].totalUsers,
    unreadNotifications,
    recentActivity
  };
};

const getTeacherDashboard = async (teacherId) => {
  const [
    [courses],
    [createdTasks],
    [pendingReviews],
    [submissions],
    unreadNotifications,
    [pendingReviewTasks]
  ] =
    await Promise.all([
      db.query(
        `
        SELECT COUNT(*) AS myCourses
        FROM courses
        WHERE teacherId = ?
          AND status = 'active'
          AND deletedAt IS NULL
        `,
        [teacherId]
      ),
      db.query(
        `
        SELECT COUNT(*) AS createdTasks
        FROM tasks t
        INNER JOIN courses c ON c.id = t.courseId
        WHERE t.createdBy = ?
          AND c.teacherId = ?
          AND t.deletedAt IS NULL
          AND c.deletedAt IS NULL
        `,
        [teacherId, teacherId]
      ),
      db.query(
        `
        SELECT COUNT(*) AS pendingReviews
        FROM submissions s
        INNER JOIN tasks t ON s.taskId = t.id
        INNER JOIN courses c ON t.courseId = c.id
        WHERE c.teacherId = ?
          AND s.status IN ('submitted', 'late')
          AND s.scan_status = 'clean'
          AND s.deletedAt IS NULL
        `,
        [teacherId]
      ),
      db.query(
        `
        SELECT COUNT(*) AS receivedSubmissions
        FROM submissions s
        INNER JOIN tasks t ON s.taskId = t.id
        INNER JOIN courses c ON t.courseId = c.id
        WHERE c.teacherId = ?
          AND s.deletedAt IS NULL
        `,
        [teacherId]
      ),
      notificationService.countUnreadByUser(teacherId),
      db.query(
        `
        SELECT
          t.id,
          t.title,
          c.name AS courseName,
          COUNT(s.id) AS pendingReviews
        FROM submissions s
        INNER JOIN tasks t ON s.taskId = t.id
        INNER JOIN courses c ON t.courseId = c.id
        WHERE c.teacherId = ?
          AND s.status IN ('submitted', 'late')
          AND s.scan_status = 'clean'
          AND s.deletedAt IS NULL
        GROUP BY t.id
        ORDER BY pendingReviews DESC, t.dueDate ASC
        LIMIT 8
        `,
        [teacherId]
      )
    ]);

  return {
    myCourses: courses[0].myCourses,
    createdTasks: createdTasks[0].createdTasks,
    receivedSubmissions: submissions[0].receivedSubmissions,
    pendingReviews: pendingReviews[0].pendingReviews,
    unreadNotifications,
    pendingReviewTasks
  };
};

const getStudentDashboard = async (studentId) => {
  const [[courses], [pendingTasks], [submissions], unreadNotifications, [upcomingTasks]] =
    await Promise.all([
      db.query(
        `
        SELECT COUNT(*) AS myCourses
        FROM courseStudents
        WHERE studentId = ?
          AND status = 'active'
          AND deletedAt IS NULL
        `,
        [studentId]
      ),
      db.query(
        `
        SELECT COUNT(*) AS pendingTasks
        FROM tasks t
        INNER JOIN courses c ON t.courseId = c.id
        INNER JOIN courseStudents cs ON cs.courseId = c.id
        LEFT JOIN submissions s
          ON s.taskId = t.id
          AND s.studentId = cs.studentId
          AND s.deletedAt IS NULL
        WHERE cs.studentId = ?
          AND cs.status = 'active'
          AND cs.deletedAt IS NULL
          AND t.deletedAt IS NULL
          AND s.id IS NULL
        `,
        [studentId]
      ),
      db.query(
        `
        SELECT COUNT(*) AS totalSubmissions
        FROM submissions
        WHERE studentId = ?
          AND deletedAt IS NULL
        `,
        [studentId]
      ),
      notificationService.countUnreadByUser(studentId),
      db.query(
        `
        SELECT
          t.id,
          t.title,
          t.dueDate,
          c.name AS courseName
        FROM tasks t
        INNER JOIN courses c ON t.courseId = c.id
        INNER JOIN courseStudents cs ON cs.courseId = c.id
        LEFT JOIN submissions s
          ON s.taskId = t.id
          AND s.studentId = cs.studentId
          AND s.deletedAt IS NULL
        WHERE cs.studentId = ?
          AND cs.status = 'active'
          AND cs.deletedAt IS NULL
          AND t.deletedAt IS NULL
          AND s.id IS NULL
        ORDER BY t.dueDate ASC
        LIMIT 8
        `,
        [studentId]
      )
    ]);

  return {
    myCourses: courses[0].myCourses,
    pendingTasks: pendingTasks[0].pendingTasks,
    totalSubmissions: submissions[0].totalSubmissions,
    unreadNotifications,
    upcomingTasks
  };
};

const getDashboard = async (user) => {
  if (user.role === "admin") return getAdminDashboard(user.userId);
  if (user.role === "teacher") return getTeacherDashboard(user.userId);
  return getStudentDashboard(user.userId);
};

module.exports = {
  getDashboard
};
