const courseService = require("../services/courses.service");
const { asyncHandler } = require("../helpers/errors");
const { requireFields, toInt } = require("../helpers/validators");

const getAllCourses = asyncHandler(async (req, res) => {
  let courses;

  if (req.user.role === "teacher") {
    courses = await courseService.getCourseByTeacher(req.user.userId);
  } else if (req.user.role === "student") {
    courses = await courseService.getCoursesByStudent(req.user.userId);
  } else {
    courses = await courseService.getCourses();
  }

  return res.status(200).json({ success: true, data: courses });
});

const getMyCourses = asyncHandler(async (req, res) => {
  const courses = req.user.role === "teacher"
    ? await courseService.getCourseByTeacher(req.user.userId)
    : await courseService.getCoursesByStudent(req.user.userId);

  return res.status(200).json({ success: true, data: courses });
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await courseService.assertCanAccessCourse(toInt(req.params.id), req.user);
  return res.status(200).json({ success: true, data: course });
});

const createCourse = asyncHandler(async (req, res) => {
  requireFields(req.body, ["name", "teacherId"]);

  const newCourse = await courseService.createCourse({
    ...req.body,
    teacherId: toInt(req.body.teacherId, "teacherId")
  });

  return res.status(201).json({
    success: true,
    message: "Curso creado correctamente",
    data: newCourse
  });
});

const updateCourse = asyncHandler(async (req, res) => {
  const result = await courseService.updateCourses(toInt(req.params.id), {
    ...req.body,
    teacherId: req.body.teacherId ? toInt(req.body.teacherId, "teacherId") : undefined
  });

  return res.status(200).json({
    success: true,
    message: "Curso actualizado correctamente",
    data: result
  });
});

const deleteCourse = asyncHandler(async (req, res) => {
  await courseService.deleteCourse(toInt(req.params.id));
  return res.status(204).send();
});

const enrollStudentInCourse = asyncHandler(async (req, res) => {
  const result = await courseService.enrollStudentInCourse({
    courseId: toInt(req.params.courseId || req.params.cursoId, "courseId"),
    studentId: toInt(req.params.studentId, "studentId")
  });

  return res.status(201).json({
    success: true,
    message: "Estudiante inscrito correctamente",
    data: result
  });
});

module.exports = {
  getAllCourses,
  getMyCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudentInCourse
};
