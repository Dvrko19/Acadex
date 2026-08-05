import api, { unwrap } from "./api";

export const userService = {
  async list() {
    const response = await api.get("/users");
    return unwrap(response);
  },
  async search({ q, role, page = 1, signal }) {
    const response = await api.get("/users/search", {
      params: { q, role: role || undefined, page, limit: 20 },
      signal
    });
    return {
      items: response.data.items || [],
      page: response.data.page || page,
      limit: response.data.limit || 20
    };
  },
  async create(payload) {
    const response = await api.post("/users", payload);
    return unwrap(response);
  },
  async update(id, payload) {
    const response = await api.put(`/users/${id}`, payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
