import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

<<<<<<< HEAD
// Request interceptor – attach token
=======
// For login (uses form data)
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

// For other authenticated requests
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token attached to request');
  } else {
    console.warn('⚠️ No token found');
  }
  return config;
});

<<<<<<< HEAD
// Response interceptor – handle 401
=======
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
<<<<<<< HEAD
      console.error('🔴 401 Unauthorized – token invalid or expired');
      localStorage.removeItem('access_token');
      window.location.href = '/';
=======
      localStorage.removeItem('access_token');
      localStorage.removeItem('medai_user');
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
    }
    return Promise.reject(error);
  }
);

<<<<<<< HEAD
// ---------- Login (using Axios, not fetch) ----------
export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  try {
    const response = await API.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data; // { access_token, token_type, user }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || 'Login failed');
    }
    throw new Error('Network error');
  }
};

// ---------- Register ----------
export const register = async (username, email, password) => {
  try {
    const response = await API.post('/auth/register', { username, email, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || 'Registration failed');
    }
    throw new Error('Network error');
  }
};

// ---------- Forgot Password ----------
export const forgotPassword = async (email) => {
  try {
    const response = await API.post('/auth/request-reset', { email });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || 'Request failed');
    }
    throw new Error('Network error');
  }
};

// ---------- Dashboard ----------
=======
>>>>>>> 8e2315b (MedAI Feature Updation Commit)
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
export const askGemini = (question) => API.post('/ai/gemini-chat', { question });

export default API;
