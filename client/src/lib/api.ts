import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { emailOrPhone: string; password: string }) =>
    api.post('/auth/login', data),
};

export const resumeAPI = {
  upload: (file: File, userId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getHistory: (userId: number) =>
    api.get(`/resume/history?userId=${userId}`),
};

export const feedbackAPI = {
  getFeedback: (resumeId: number) =>
    api.get(`/feedback/${resumeId}`),
  chat: (resumeId: number, data: { chatHistory: string; userQuestion: string }) =>
    api.post(`/feedback/chat/${resumeId}`, data),
};

export default api;
