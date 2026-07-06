import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// For login (uses form data)
export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

// For other authenticated requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDashboard = () => API.get('/dashboard/summary');
export const getForecast = () => API.get('/medicines/forecast');
export const askGemini = (question) => API.post('/ai/gemini-chat', { question });

export default API;