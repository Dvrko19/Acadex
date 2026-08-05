import api, { unwrap } from "./api";

export const taskService = {
  async list() {
    const response = await api.get("/tasks");
    return unwrap(response);
  },
  async pending() {
    const response = await api.get("/tasks/pending");
    return unwrap(response);
  },
  async byCourse(courseId) {
    const response = await api.get(`/tasks/course/${courseId}`);
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/tasks", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/tasks/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};
