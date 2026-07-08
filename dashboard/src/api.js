import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
});

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('medai_user');
    }
    return Promise.reject(error);
  }
);

export const getDashboard = () => API.get('/dashboard/summary');
export const getForecast = () => API.get('/medicines/forecast');
export const getMedicines = () => API.get('/medicines/');
export const createMedicine = (payload) => API.post('/medicines/', payload);
export const updateStock = (payload) => API.post('/medicines/update-stock', payload);
export const getBeds = () => API.get('/beds/availability');
export const updateBeds = (payload) => API.post('/beds/update', payload);
export const getDoctors = () => API.get('/doctors/');
export const createDoctor = (payload) => API.post('/doctors/', payload);
export const getPatientStats = () => API.get('/patients/stats?days=7');
export const getPatientForecast = () => API.get('/patients/forecast');
export const recordVisit = (payload) => API.post('/patients/visit', payload);
export const getAlerts = () => API.get('/alerts/');
export const resolveAlert = (id) => API.patch(`/alerts/${id}/resolve`);
export const getDiseaseTrends = () => API.get('/ai/disease-trends');
export const askGemini = (question) => API.post('/ai/gemini-chat', { question });

export default API;
