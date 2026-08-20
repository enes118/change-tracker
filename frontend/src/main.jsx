import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import keycloak from './services/keycloak.js';
import './styles/cms-theme.css';

console.log('🔒 Keycloak Resmi OIDC Başlatıcısı (main.jsx)...');

const hasAuthCodeInUrl = typeof window !== 'undefined' && (
  window.location.search.includes('code=') ||
  window.location.hash.includes('code=')
);

keycloak.init({
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256'
}).then(authenticated => {
  const isUserAuthenticated = (authenticated || keycloak.authenticated) && !sessionStorage.getItem('cms_explicit_logout');
  console.log(`✅ Keycloak Init Tamamlandı. Oturum: ${isUserAuthenticated ? 'Aktif' : 'Kapalı'}`);

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App keycloak={keycloak} initialAuthenticated={isUserAuthenticated} />
    </React.StrictMode>
  );
}).catch(err => {
  console.warn('⚠️ Keycloak Init Bilgisi:', err);
  const isUserAuthenticated = hasAuthCodeInUrl && !sessionStorage.getItem('cms_explicit_logout');

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App keycloak={keycloak} initialAuthenticated={isUserAuthenticated} />
    </React.StrictMode>
  );
});
