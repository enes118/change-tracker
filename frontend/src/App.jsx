import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import { LogIn, ShieldAlert } from 'lucide-react';
import './styles/cms-theme.css';

export default function App({ keycloak, initialAuthenticated }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [username, setUsername] = useState(() => {
    if (keycloak && keycloak.tokenParsed) {
      return keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || keycloak.tokenParsed.sub || 'Admin User';
    }
    return 'Admin User';
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    console.log('🔑 Keycloak Şifre Ekranına Yönlendiriliyor (Forced Login Form)...');
    sessionStorage.removeItem('cms_explicit_logout');
    if (keycloak) {
      keycloak.login({
        prompt: 'login' // Standard OIDC: Force Username/Password input form page every single time
      });
    }
  };

  const handleLogout = () => {
    console.log('🚪 Keycloak Oturumu Kapatılıyor...');
    sessionStorage.setItem('cms_explicit_logout', 'true');
    setAuthenticated(false);
    if (keycloak && keycloak.authenticated) {
      keycloak.logout();
    } else {
      window.location.reload();
    }
  };

  // Unauthenticated Guard: Shows Light Theme Login Prompt Card
  if (!authenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1.5rem' }}>
        <div className="auth-card" style={{ maxWidth: '440px' }}>
          <div className="auth-icon-wrapper">
            <ShieldAlert size={30} />
          </div>
          <h1 className="auth-title">Oturum Kapalı</h1>
          <p className="auth-subtitle">Change Tracker CMS Paneline erişmek için Keycloak ile giriş yapmanız gerekmektedir.</p>

          <div className="badge-group">
            <span className="badge">Keycloak OIDC</span>
            <span className="badge">Açık Tema CMS</span>
          </div>

          <button type="button" className="btn-primary" onClick={handleLogin}>
            <LogIn size={18} /> Keycloak İle Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (activeTab === 'dashboard') return '📊 Anasayfa';
    if (activeTab === 'configs') return '⚙️ Veritabanı Ayarları';
    if (activeTab === 'events') return '📜 CDC Değişiklik Günlüğü';
    return 'CMS Panel';
  };

  return (
    <div className="cms-layout">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={username}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="cms-main">
        <Header title={getPageTitle()} />

        <div className="cms-content">
          {activeTab === 'dashboard' && <HomePage />}

          {activeTab === 'configs' && (
            <div className="cms-card">
              <h2 className="cms-card-title">⚙️ Veritabanı Ayarları</h2>
              <p className="cms-card-subtitle">Bu modül sıradaki komutunuzla eklenecektir.</p>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="cms-card">
              <h2 className="cms-card-title">📜 CDC Değişiklik Günlüğü</h2>
              <p className="cms-card-subtitle">Bu modül sıradaki komutunuzla eklenecektir.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
