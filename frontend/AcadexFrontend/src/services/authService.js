import api, { unwrap } from "./api";

export const authService = {
  async login(credentials) {
    const response = await api.post("/auth/login", credentials);
    return unwrap(response);
  }
};
