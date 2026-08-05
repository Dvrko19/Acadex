require("dotenv").config();

const apiUrl = (process.env.API_URL || `http://localhost:${Number(process.env.PORT) || 4000}/api`)
  .replace(/\/$/, "");

const credentials = {
  admin: {
    email: process.env.SEED_ADMIN_EMAIL || "admin@acadex.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Acadex.Admin.2026"
  },
  teacherCarlos: {
    email: "carlos.gomez@acadex.local",
    password: process.env.SEED_TEACHER_PASSWORD || "Acadex.Teacher.2026"
  },
  teacherLaura: {
    email: "laura.martinez@acadex.local",
    password: process.env.SEED_TEACHER_PASSWORD || "Acadex.Teacher.2026"
  },
  studentAna: {
    email: "ana.rodriguez@acadex.local",
    password: process.env.SEED_STUDENT_PASSWORD || "Acadex.Student.2026"
  },
  studentJuan: {
    email: "juan.perez@acadex.local",
    password: process.env.SEED_STUDENT_PASSWORD || "Acadex.Student.2026"
  }
};

const request = async (path, { token, method = "GET", body, form } = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: form || (body ? JSON.stringify(body) : undefined)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { response, data };
};

const assertStatus = ({ response, data }, expectedStatus, label) => {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label}: esperado HTTP ${expectedStatus}, recibido ${response.status}. ${JSON.stringify(data)}`
    );
  }
  console.log(`OK ${label}`);
};

const login = async ({ email, password }) => {
  const result = await request("/auth/login", {
    method: "POST",
    body: { email, password }
  });
  assertStatus(result, 200, `login ${email}`);
  return {
    token: result.data.data.token,
    user: result.data.data.user
  };
};

const getData = async (path, token, label) => {
  const result = await request(path, { token });
  assertStatus(result, 200, label);
  return result.data.data;
};

const findByEmail = (users, email) => {
  const user = users.find((item) => item.email === email);
  if (!user) {
    throw new Error(`No se encontro usuario seed: ${email}`);
  }
  return user;
};

const main = async () => {
  console.log(`Smoke tests API: ${apiUrl}`);

  assertStatus(await request("/dashboard"), 401, "dashboard requiere JWT");

  const admin = await login(credentials.admin);
  const carlos = await login(credentials.teacherCarlos);
  const laura = await login(credentials.teacherLaura);
  const ana = await login(credentials.studentAna);
  const juan = await login(credentials.studentJuan);

  await getData("/dashboard", admin.token, "dashboard admin");
  await getData("/dashboard", carlos.token, "dashboard profesor");
  await getData("/dashboard", ana.token, "dashboard estudiante");
  await getData("/courses/my-courses", ana.token, "mis cursos estudiante");
  await getData("/courses/my-courses", carlos.token, "mis cursos profesor");
  await getData("/submissions/my-submissions", ana.token, "mis entregas estudiante");

  const users = await getData("/users", admin.token, "usuarios admin");
  const carlosUser = findByEmail(users, credentials.teacherCarlos.email);
  const lauraUser = findByEmail(users, credentials.teacherLaura.email);
  const juanUser = findByEmail(users, credentials.studentJuan.email);

  assertStatus(
    await request(`/submissions/student/${juanUser.id}`, { token: ana.token }),
    403,
    "estudiante no consulta entregas de otro estudiante"
  );

  assertStatus(
    await request("/tasks", {
      token: ana.token,
      method: "POST",
      body: {
        courseId: 1,
        title: "Tarea no autorizada",
        dueDate: "2026-09-01T23:59:00.000Z"
      }
    }),
    403,
    "estudiante no crea tareas"
  );

  const allTasks = await getData("/tasks", admin.token, "tareas admin");
  const allCourses = await getData("/courses", admin.token, "cursos admin");
  const databaseCourse = allCourses.find((course) => course.name === "Base de Datos");

  if (!databaseCourse) {
    throw new Error("No se encontro el curso seed Base de Datos");
  }

  assertStatus(
    await request(`/courses/${databaseCourse.id}`, {
      token: admin.token,
      method: "PUT",
      body: {
        name: databaseCourse.name,
        description: databaseCourse.description,
        teacherId: carlosUser.id,
        status: databaseCourse.status
      }
    }),
    200,
    "admin asigna profesor a curso"
  );

  assertStatus(
    await request(`/courses/${databaseCourse.id}`, {
      token: admin.token,
      method: "PUT",
      body: {
        name: databaseCourse.name,
        description: databaseCourse.description,
        teacherId: lauraUser.id,
        status: databaseCourse.status
      }
    }),
    200,
    "admin restaura profesor del curso"
  );

  const anaCourses = await getData("/courses/my-courses", ana.token, "cursos de Ana");
  const anaCourseIds = new Set(anaCourses.map((course) => Number(course.id)));
  const taskOutsideAna = allTasks.find((task) => !anaCourseIds.has(Number(task.courseId)));

  if (!taskOutsideAna) {
    throw new Error("No hay tarea seed fuera de los cursos de Ana para probar restriccion");
  }

  const unauthorizedSubmission = new FormData();
  unauthorizedSubmission.append("taskId", String(taskOutsideAna.id));
  unauthorizedSubmission.append(
    "file",
    new Blob(["%PDF-1.4\nsmoke\n%%EOF"], { type: "application/pdf" }),
    "smoke.pdf"
  );

  assertStatus(
    await request("/submissions", {
      token: ana.token,
      method: "POST",
      form: unauthorizedSubmission
    }),
    403,
    "estudiante no entrega tarea de curso no matriculado"
  );

  const submissions = await getData("/submissions", admin.token, "entregas admin");
  const lauraSubmission = submissions.find(
    (submission) => submission.courseName === "Base de Datos"
  );

  if (!lauraSubmission) {
    throw new Error("No hay entrega seed de Base de Datos para probar calificacion");
  }

  assertStatus(
    await request(`/submissions/${lauraSubmission.id}/grade`, {
      token: carlos.token,
      method: "PATCH",
      body: { grade: 90, feedback: "Smoke test profesor incorrecto" }
    }),
    403,
    "profesor no califica entregas de otro curso"
  );

  assertStatus(
    await request(`/submissions/${lauraSubmission.id}/grade`, {
      token: laura.token,
      method: "PATCH",
      body: { grade: Number(lauraSubmission.maxScore) + 1 }
    }),
    400,
    "nota no supera maxScore"
  );

  assertStatus(
    await request(`/submissions/${lauraSubmission.id}/grade`, {
      token: laura.token,
      method: "PATCH",
      body: { grade: 95, feedback: "Validado por smoke test backend" }
    }),
    200,
    "profesor dueno califica entrega"
  );

  console.log("Smoke tests completed");
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
