import api, { unwrap } from "./api";

export const dashboardService = {
  async getDashboard() {
    const response = await api.get("/dashboard");
    return unwrap(response);
  }
};
