import api from './api.js';

export const authService = {
  studentRegister: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  studentLogin: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  adminLogin: async (credentials) => {
    const res = await api.post('/auth/admin/login', credentials);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  verifyEmail: async (token) => {
    const res = await api.post('/auth/verify-email', { token });
    return res.data;
  },
};
