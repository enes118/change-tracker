import axios from 'axios';
import keycloak from './keycloak';

const api = axios.create({
  baseURL: 'http://localhost:8080'
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
