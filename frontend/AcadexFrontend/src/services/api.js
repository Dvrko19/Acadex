import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("acadex:logout"));
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent("acadex:forbidden", {
        detail: { message: "No tienes permiso para realizar esta accion." }
      }));
    }

    return Promise.reject(error);
  }
);

export const unwrap = (response) => response.data?.data ?? response.data;

const friendlyByStatus = {
  400: "Revisa los datos ingresados e intenta nuevamente.",
  401: "Tu sesion finalizo. Vuelve a iniciar sesion.",
  403: "No tienes permiso para realizar esta accion.",
  404: "No encontramos la informacion solicitada.",
  409: "La informacion ya existe o entra en conflicto con otro registro.",
  413: "El archivo supera el tamano permitido.",
  415: "El tipo de archivo no esta permitido.",
  429: "Se realizaron demasiadas acciones. Espera un momento.",
  500: "Ocurrio un problema inesperado. Intenta nuevamente."
};

const technicalMessage = /(sql|mysql|database|query|column|constraint|stack|syntax|datetime value)/i;

export const apiMessage = (error, fallback = "No se pudo completar la operacion") => {
  if (axios.isCancel(error) || error?.code === "ERR_CANCELED") return "";
  if (!error.response) return "No pudimos comunicarnos con Acadex. Revisa tu conexion.";

  const serverMessage = error.response?.data?.message;
  if (serverMessage && !technicalMessage.test(serverMessage)) return serverMessage;
  return friendlyByStatus[error.response.status] || fallback;
};

export const createSearchController = () => new AbortController();

export async function downloadAuthenticatedFile(url, fileName, inline = false) {
  const response = await api.get(url, {
    params: inline ? { disposition: "inline" } : undefined,
    responseType: "blob"
  });
  const objectUrl = URL.createObjectURL(response.data);

  if (inline) {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return;
  }

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || "archivo";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default api;
