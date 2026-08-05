import api, { unwrap } from "./api";

export const notificationService = {
  async list() {
    const response = await api.get("/notifications");
    return unwrap(response);
  },
  async unreadCount() {
    const response = await api.get("/notifications/unread-count");
    return unwrap(response);
  },
  async markRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return unwrap(response);
  },
  async markAllRead() {
    const response = await api.patch("/notifications/read-all");
    return unwrap(response);
  }
};
