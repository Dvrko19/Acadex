const http = require("http");

const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  });
  res.end(JSON.stringify(body));
};

const now = new Date();
const day = (amount) => new Date(now.getTime() + amount * 86400000).toISOString();
const users = [
  { id: 1, name: "Admin", lastName: "Acadex", fullName: "Admin Acadex", email: "admin@acadex.local", role: "admin", status: "active", createdAt: day(-30) },
  { id: 2, name: "Carlos", lastName: "Gomez", fullName: "Carlos Gomez", email: "carlos.gomez@acadex.local", role: "teacher", status: "active", subjectArea: "Matematica", employeeNumber: "DOC-021", createdAt: day(-8) },
  { id: 3, name: "Ana", lastName: "Rodriguez", fullName: "Ana Rodriguez", email: "ana.rodriguez@acadex.local", role: "student", status: "active", gradeLevel: "4to de secundaria", section: "A", studentNumber: "EST-104", academicYear: "2026", createdAt: day(-2) }
];
const courses = [
  { id: 1, name: "Algoritmos", description: "Pensamiento computacional y resolucion de problemas.", teacherId: 2, teacher: "Carlos Gomez", status: "active", createdAt: day(-20) },
  { id: 2, name: "Base de Datos", description: "Modelado y consultas.", teacherId: 2, teacher: "Carlos Gomez", status: "active", createdAt: day(-10) },
  { id: 3, name: "Redes", description: "Fundamentos de redes.", teacherId: 2, teacher: "Carlos Gomez", status: "active", createdAt: day(-4) }
];
const tasks = [
  { id: 1, courseId: 1, courseName: "Algoritmos", title: "Tarea 2", description: "Ordenamiento y busqueda.", dueDate: day(4), maxScore: 100, status: "published" },
  { id: 2, courseId: 2, courseName: "Base de Datos", title: "Proyecto final", description: "Modelo relacional.", dueDate: day(9), maxScore: 100, status: "published" },
  { id: 3, courseId: 3, courseName: "Redes", title: "Laboratorio 3", description: "Analisis de paquetes.", dueDate: day(12), maxScore: 100, status: "published" }
];
const events = [
  { id: 1, title: "Reunion academica", courseName: null, eventType: "meeting", startDate: day(2), endDate: day(2), createdAt: day(-1) },
  { id: 2, title: "Feria de ciencias", courseName: "Algoritmos", eventType: "general", startDate: day(6), endDate: day(6), createdAt: day(-1) }
];
const submissions = [
  { id: 1, taskId: 1, studentId: 3, taskTitle: "Tarea 2", courseId: 1, courseName: "Algoritmos", studentFullName: "Ana Rodriguez", studentEmail: "ana.rodriguez@acadex.local", originalFileName: "tarea-ana.pdf", fileExtension: ".pdf", mimeType: "application/pdf", fileSize: 140000, scanStatus: "infected", status: "submitted", submittedAt: day(-1), dueDate: day(4), maxScore: 100 }
];

http.createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/api/auth/login" && req.method === "POST") return send(res, 200, { success: true, data: { token: "visual-admin", user: { id: 1, name: "Admin Acadex", email: "admin@acadex.local", role: "admin" } } });
  if (path === "/api/dashboard") return send(res, 200, { success: true, data: { totalCourses: 3, totalTasks: 3, totalUsers: 3, unreadNotifications: 1, recentActivity: [] } });
  if (path === "/api/users") return send(res, 200, { success: true, data: users });
  if (path === "/api/users/search") return send(res, 200, { success: true, items: users.filter((item) => item.role !== "admin"), page: 1, limit: 20 });
  if (["/api/courses", "/api/courses/my-courses"].includes(path)) return send(res, 200, { success: true, data: courses });
  if (path === "/api/tasks") return send(res, 200, { success: true, data: tasks });
  if (path === "/api/events") return send(res, 200, { success: true, data: events });
  if (path === "/api/submissions") return send(res, 200, { success: true, data: submissions });
  if (path === "/api/notifications") return send(res, 200, { success: true, data: [] });
  if (path === "/api/notifications/unread-count") return send(res, 200, { success: true, total: 1 });
  return send(res, 404, { success: false, message: "No encontrado" });
}).listen(4010, "127.0.0.1", () => console.log("Visual API disponible en 4010"));
