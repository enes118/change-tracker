import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import keycloak from './services/keycloak.js';
import './styles/cms-theme.css';

console.log('🔒 Keycloak Başlatıcısı (main.jsx)...');

const root = ReactDOM.createRoot(document.getElementById('root'));

keycloak.init({
  onLoad: 'login-required',
  checkLoginIframe: false,
  useNonce: false,
  enableLogging: true
}).then(authenticated => {
  console.log(`✅ Keycloak Init Tamamlandı. authenticated: ${authenticated}`);
  if (authenticated) {
    sessionStorage.removeItem('cms_explicit_logout');
  }
  root.render(
    <React.StrictMode>
      <App keycloak={keycloak} initialAuthenticated={authenticated} />
    </React.StrictMode>
  );
}).catch(err => {
  console.warn('⚠️ Keycloak Init Hatası:', err);
  root.render(
    <React.StrictMode>
      <App keycloak={keycloak} initialAuthenticated={keycloak.authenticated || false} />
    </React.StrictMode>
  );
});
