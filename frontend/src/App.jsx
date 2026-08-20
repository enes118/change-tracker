import React, { useState, useEffect } from 'react';
import api from './services/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ConfigsPage from './pages/ConfigsPage';
import EventsPage from './pages/EventsPage';
import ConfigDetailPage from './pages/ConfigDetailPage';
import ConfigModal from './components/ConfigModal';
import './styles/cms-theme.css';

export default function App({ keycloak, initialAuthenticated }) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [username, setUsername] = useState(() => {
    if (keycloak && keycloak.tokenParsed) {
      return keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || keycloak.tokenParsed.sub || 'Admin User';
    }
    return 'Admin User';
  });

  useEffect(() => {
    if (keycloak && keycloak.tokenParsed) {
      const name = keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || keycloak.tokenParsed.sub || 'Admin User';
      setUsername(name);
    }
  }, [keycloak]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [configs, setConfigs] = useState([]);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedConfigForDetail, setSelectedConfigForDetail] = useState(null);

  const fetchConfigs = async () => {
    try {
      const response = await api.get('/api/cdc/configs');
      setConfigs(response.data || []);
    } catch (err) {
      console.warn('Konfigürasyon yükleme uyarısı:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/cdc/events');
      setEvents(response.data || []);
    } catch (err) {
      console.warn('Etkinlik yükleme uyarısı:', err);
    }
  };

  useEffect(() => {
    if (authenticated) {
      if (activeTab === 'configs') {
        fetchConfigs();
      } else if (activeTab === 'events') {
        fetchEvents();
      }
    }
  }, [authenticated, activeTab]);

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

  const handleOpenCreateModal = () => {
    setSelectedConfig(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (config) => {
    setSelectedConfig(config);
    setModalOpen(true);
  };

  const handleViewEvents = (config) => {
    setSelectedConfigForDetail(config);
    setActiveTab('config-detail');
  };

  const handleSaveConfig = async (formData) => {
    try {
      if (formData.id) {
        await api.put(`/api/cdc/configs/${formData.id}`, formData);
      } else {
        await api.post('/api/cdc/configs', formData);
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert('Hata: Konfigürasyon kaydedilemedi. Backend servisini kontrol ediniz.');
    }
  };

  const handleDeleteConfig = async (id) => {
    if (!window.confirm(`Config ID #${id} konfigürasyonunu silmek istediğinizden emin misiniz?`)) return;
    try {
      await api.delete(`/api/cdc/configs/${id}`);
      fetchConfigs();
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Hata: Konfigürasyon silinemedi.');
    }
  };

  const handleToggleActive = async (id, active) => {
    try {
      await api.patch(`/api/cdc/configs/${id}/status?active=${active}`);
      fetchConfigs();
    } catch (err) {
      console.error('Durum hatası:', err);
      alert('Hata: Durum değiştirilemedi.');
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'dashboard') return '📊 Anasayfa';
    if (activeTab === 'configs') return '⚙️ Veritabanı CDC Konfigürasyonları';
    if (activeTab === 'events') return '📜 CDC Değişiklik Günlüğü (Change Events)';
    if (activeTab === 'config-detail') return `🔍 ${selectedConfigForDetail?.connectionName || 'Konfigürasyon'} Değişiklik Detayı`;
    return 'CMS Panel';
  };

  return (
    <div className="cms-layout">
      <Sidebar
        activeTab={activeTab === 'config-detail' ? 'configs' : activeTab}
        setActiveTab={setActiveTab}
        username={username}
        onLogout={handleLogout}
      />

      <main className="cms-main">
        <Header title={getPageTitle()} />

        <div className="cms-content">
          {activeTab === 'dashboard' && <HomePage configs={configs} />}

          {activeTab === 'configs' && (
            <ConfigsPage
              configs={configs}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
              onToggleActive={handleToggleActive}
              onDeleteConfig={handleDeleteConfig}
              onViewEvents={handleViewEvents}
            />
          )}

          {activeTab === 'events' && (
            <EventsPage
              events={events}
              configs={configs}
              onRefresh={fetchEvents}
            />
          )}

          {activeTab === 'config-detail' && (
            <ConfigDetailPage
              config={selectedConfigForDetail}
              onBack={() => setActiveTab('configs')}
            />
          )}
        </div>
      </main>

      <ConfigModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveConfig}
        initialData={selectedConfig}
      />
    </div>
  );
}
