import api, { downloadAuthenticatedFile, unwrap } from "./api";

const multipart = (taskId, file) => {
  const form = new FormData();
  if (taskId) form.append("taskId", taskId);
  form.append("file", file);
  return form;
};

export const submissionService = {
  async list() {
    const response = await api.get("/submissions");
    return unwrap(response);
  },
  async mySubmissions() {
    const response = await api.get("/submissions/my-submissions");
    return unwrap(response);
  },
  async byTask(taskId, status) {
    const response = await api.get(`/tasks/${taskId}/submissions`, {
      params: status ? { status } : {}
    });
    return unwrap(response);
  },
  async create({ taskId, file, onProgress }) {
    const response = await api.post("/submissions", multipart(taskId, file), {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
      }
    });
    return unwrap(response);
  },
  async update(id, { file, onProgress }) {
    const response = await api.patch(`/submissions/${id}`, multipart(null, file), {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
      }
    });
    return unwrap(response);
  },
  async grade(id, payload) {
    const response = await api.patch(`/submissions/${id}/grade`, payload);
    return unwrap(response);
  },
  async openFile(submission) {
    const isPdf = submission.mimeType === "application/pdf" || submission.fileExtension === ".pdf";
    return downloadAuthenticatedFile(
      `/submissions/${submission.id}/file`,
      submission.originalFileName,
      isPdf
    );
  }
};
