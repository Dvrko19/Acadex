import api, { unwrap } from "./api";

export const eventService = {
  async list() {
    const response = await api.get("/events");
    return unwrap(response);
  },
  async create(payload) {
    const response = await api.post("/events", payload);
    return unwrap(response);
  },
  async remove(id) {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  }
};
