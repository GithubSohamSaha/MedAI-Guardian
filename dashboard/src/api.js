import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Request interceptor – attach token
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

// Response interceptor – handle 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔴 401 Unauthorized – token invalid or expired');
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

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
export const getDashboard = () => API.get('/dashboard/summary');
export const getForecast = () => API.get('/medicines/forecast');
export const askGemini = (question) => API.post('/ai/gemini-chat', { question });

export default API;