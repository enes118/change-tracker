import axios from 'axios';
import keycloak from './keycloak';

const api = axios.create({
  baseURL: '' // Use relative URL so Vite proxy forwards /api to http://localhost:8080 cleanly without CORS errors
});

// Request Interceptor: Attach Keycloak Bearer Token if available
api.interceptors.request.use(async (config) => {
  if (keycloak && keycloak.authenticated && keycloak.token) {
    try {
      await keycloak.updateToken(30);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    } catch (e) {
      console.warn('Token update warning:', e);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
