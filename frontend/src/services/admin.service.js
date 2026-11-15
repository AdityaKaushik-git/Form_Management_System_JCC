import api from './api.js';

export const adminService = {
  // Dashboard
  getDashboardStats: async () => (await api.get('/admin/dashboard')).data,
  getDashboardCharts: async () => (await api.get('/admin/charts')).data,
  getRecentActivity: async (limit) => (await api.get('/admin/activity', { params: { limit } })).data,

  // Students
  getStudents: async (params) => (await api.get('/admin/students', { params })).data,
  getStudentById: async (id) => (await api.get(`/admin/students/${id}`)).data,
  updateStudentStatus: async (id, isActive) => (await api.patch(`/admin/students/${id}/status`, { isActive })).data,

  // Courses
  getCourses: async () => (await api.get('/admin/courses')).data,
  getCourseById: async (id) => (await api.get(`/admin/courses/${id}`)).data,
  createCourse: async (data) => (await api.post('/admin/courses', data)).data,
  updateCourse: async (id, data) => (await api.put(`/admin/courses/${id}`, data)).data,
  deleteCourse: async (id) => (await api.delete(`/admin/courses/${id}`)).data,

  // Batches
  getBatches: async (courseId) => (await api.get('/admin/batches', { params: { courseId } })).data,
  createBatch: async (data) => (await api.post('/admin/batches', data)).data,
  updateBatch: async (id, data) => (await api.put(`/admin/batches/${id}`, data)).data,
  deleteBatch: async (id) => (await api.delete(`/admin/batches/${id}`)).data,

  // Semesters
  getSemesters: async (courseId, batchId) => (await api.get('/admin/semesters', { params: { courseId, batchId } })).data,
  createSemester: async (data) => (await api.post('/admin/semesters', data)).data,
  updateSemester: async (id, data) => (await api.put(`/admin/semesters/${id}`, data)).data,
  deleteSemester: async (id) => (await api.delete(`/admin/semesters/${id}`)).data,

  // Subjects
  getSubjects: async (params) => (await api.get('/admin/subjects', { params })).data,
  createSubject: async (data) => (await api.post('/admin/subjects', data)).data,
  updateSubject: async (id, data) => (await api.put(`/admin/subjects/${id}`, data)).data,
  deleteSubject: async (id) => (await api.delete(`/admin/subjects/${id}`)).data,
  importCurriculum: async (formData) =>
    (await api.post('/admin/curriculum/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  downloadCurriculumTemplate: async () =>
    (await api.get('/admin/curriculum/template', { responseType: 'blob' })).data,

  // Forms
  getForms: async (params) => (await api.get('/admin/forms', { params })).data,
  getFormById: async (id) => (await api.get(`/admin/forms/${id}`)).data,
  createForm: async (data) => (await api.post('/admin/forms', data)).data,
  autoGenerateForms: async (data) => (await api.post('/admin/forms/auto-generate', data)).data,
  updateForm: async (id, data) => (await api.put(`/admin/forms/${id}`, data)).data,
  publishForm: async (id) => (await api.post(`/admin/forms/${id}/publish`)).data,
  closeForm: async (id) => (await api.post(`/admin/forms/${id}/close`)).data,
  reopenForm: async (id) => (await api.post(`/admin/forms/${id}/reopen`)).data,
  deleteForm: async (id) => (await api.delete(`/admin/forms/${id}`)).data,
  provisionTestStudent: async () => (await api.post('/admin/students/provision-test')).data,

  // Submissions
  getSubmissions: async (params) => (await api.get('/admin/submissions', { params })).data,
  getSubmissionById: async (id) => (await api.get(`/admin/submissions/${id}`)).data,
  updateSubmissionStatus: async (id, data) => (await api.patch(`/admin/submissions/${id}/status`, data)).data,

  // Google Sheets
  getSheets: async (formId) => (await api.get(`/admin/forms/${formId}/sheets`)).data,
  addSheet: async (formId, data) => (await api.post(`/admin/forms/${formId}/sheets`, data)).data,
  updateSheet: async (id, data) => (await api.put(`/admin/sheets/${id}`, data)).data,
  deleteSheet: async (id) => (await api.delete(`/admin/sheets/${id}`)).data,
  testSheet: async (id) => (await api.post(`/admin/sheets/${id}/test`)).data,
  getMappings: async (id) => (await api.get(`/admin/sheets/${id}/mappings`)).data,
  updateMappings: async (id, mappings) => (await api.put(`/admin/sheets/${id}/mappings`, { mappings })).data,
  syncAll: async (id) => (await api.post(`/admin/sheets/${id}/sync-all`)).data,
  retryFailed: async (id) => (await api.post(`/admin/sheets/${id}/retry-failed`)).data,
  getSyncLogs: async (id, params) => (await api.get(`/admin/sheets/${id}/logs`, { params })).data,

  // Reports
  getReports: async (params) => (await api.get('/admin/reports', { params })).data,
  exportReportExcel: async (params) => {
    const res = await api.get('/admin/reports/export', {
      params: { ...params, format: 'excel' },
      responseType: 'blob',
    });
    return res.data;
  },
  exportReportCsv: async (params) => {
    const res = await api.get('/admin/reports/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return res.data;
  },

  // Audit Logs & Settings
  getAuditLogs: async (params) => (await api.get('/admin/audit-logs', { params })).data,
  getSettings: async () => (await api.get('/admin/settings')).data,
  updateSetting: async (key, value) => (await api.put('/admin/settings', { key, value })).data,
};
