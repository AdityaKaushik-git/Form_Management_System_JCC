import api from './api.js';

export const studentService = {
  getProfile: async () => (await api.get('/student/profile')).data,
  updateProfile: async (data) => (await api.put('/student/profile', data)).data,
  getDashboard: async () => (await api.get('/student/dashboard')).data,
  getAvailableForms: async () => (await api.get('/student/forms')).data,
  getFormDetails: async (id) => (await api.get(`/student/forms/${id}`)).data,
  submitApplication: async (data) => (await api.post('/student/applications', data)).data,
  getMyApplications: async () => (await api.get('/student/applications')).data,
  getApplicationById: async (id) => (await api.get(`/student/applications/${id}`)).data,
  downloadReceipt: async (id) => {
    const res = await api.get(`/student/applications/${id}/receipt`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
