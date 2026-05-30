import API from "./axios";

// ════════════════════════════════════════════════
//  AUTH SERVICES
// ════════════════════════════════════════════════
export const authService = {
  login: (credentials) =>
    API.post("/auth/login", credentials),

  forgotPassword: (email) =>
    API.post("/auth/forgot-password", { email }),

  resetPassword: (token, password) =>
    API.post("/auth/reset-password", { token, password }),

  logout: () => {
    localStorage.clear();
    window.location.href = "/login";
  },
};

// ════════════════════════════════════════════════
//  EMPLOYEE SERVICES
// ════════════════════════════════════════════════
export const employeeService = {
  getAll: (params) =>
    API.get("/employees", { params }),

  getById: (id) =>
    API.get(`/employees/${id}`),

  create: (data) =>
    API.post("/employees", data),

  update: (id, data) =>
    API.put(`/employees/${id}`, data),

  delete: (id) =>
    API.delete(`/employees/${id}`),

  getStats: () =>
    API.get("/employees/stats"),
};

// ════════════════════════════════════════════════
//  TASK SERVICES
// ════════════════════════════════════════════════
export const taskService = {
  getAll: (params) =>
    API.get("/tasks", { params }),

  getByEmployee: (employeeId) =>
    API.get(`/tasks/employee/${employeeId}`),

  create: (data) =>
    API.post("/tasks", data),

  update: (id, data) =>
    API.put(`/tasks/${id}`, data),

  delete: (id) =>
    API.delete(`/tasks/${id}`),

  updateStatus: (id, status) =>
    API.patch(`/tasks/${id}/status`, { status }),
};

// ════════════════════════════════════════════════
//  SCREENSHOT SERVICES
// ════════════════════════════════════════════════
export const screenshotService = {
  getAll: (params) =>
    API.get("/screenshots", { params }),

  getByEmployee: (employeeId, params) =>
    API.get(`/screenshots/employee/${employeeId}`, { params }),

  delete: (id) =>
    API.delete(`/screenshots/${id}`),
};

// ════════════════════════════════════════════════
//  ACTIVITY LOG SERVICES
// ════════════════════════════════════════════════
export const activityService = {
  getAll: (params) =>
    API.get("/activity-logs", { params }),

  getByEmployee: (employeeId, params) =>
    API.get(`/activity-logs/employee/${employeeId}`, { params }),

  getMyLogs: (params) =>
    API.get("/activity-logs/me", { params }),
};

// ════════════════════════════════════════════════
//  WORK HOURS SERVICES
// ════════════════════════════════════════════════
export const workHoursService = {
  getMyHours: (params) =>
    API.get("/work-hours/me", { params }),

  getByEmployee: (employeeId, params) =>
    API.get(`/work-hours/employee/${employeeId}`, { params }),

  clockIn: () =>
    API.post("/work-hours/clock-in"),

  clockOut: () =>
    API.post("/work-hours/clock-out"),
};

// ════════════════════════════════════════════════
//  ALERT / RULES SERVICES
// ════════════════════════════════════════════════
export const alertService = {
  getAll: () =>
    API.get("/alerts"),

  create: (data) =>
    API.post("/alerts", data),

  update: (id, data) =>
    API.put(`/alerts/${id}`, data),

  delete: (id) =>
    API.delete(`/alerts/${id}`),

  getRules: () =>
    API.get("/alerts/rules"),
};

// ════════════════════════════════════════════════
//  REPORTS SERVICES
// ════════════════════════════════════════════════
export const reportService = {
  generate: (params) =>
    API.get("/reports/generate", { params }),

  download: (params) =>
    API.get("/reports/download", { params, responseType: "blob" }),
};

// ════════════════════════════════════════════════
//  ANALYTICS SERVICES
// ════════════════════════════════════════════════
export const analyticsService = {
  getTrends: (params) =>
    API.get("/analytics/trends", { params }),

  getSummary: () =>
    API.get("/analytics/summary"),
};

// ════════════════════════════════════════════════
//  PROFILE SERVICES
// ════════════════════════════════════════════════
export const profileService = {
  getMe: () =>
    API.get("/profile/me"),

  updateMe: (data) =>
    API.put("/profile/me", data),

  changePassword: (data) =>
    API.put("/profile/change-password", data),

  uploadAvatar: (formData) =>
    API.post("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ════════════════════════════════════════════════
//  SETTINGS SERVICES
// ════════════════════════════════════════════════
export const settingsService = {
  get: () =>
    API.get("/settings"),

  update: (data) =>
    API.put("/settings", data),
};
