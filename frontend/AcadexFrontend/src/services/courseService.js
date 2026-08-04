import api, { unwrap } from "./api";

export const courseService = {
  async list() {
    const response = await api.get("/courses");
    return unwrap(response);
  },
  async myCourses() {
    const response = await api.get("/courses/my-courses");
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/courses", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/courses/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
  async enroll(courseId, studentId) {
    const response = await api.post(`/courses/${courseId}/student/${studentId}`);
    return unwrap(response);
  }
};
