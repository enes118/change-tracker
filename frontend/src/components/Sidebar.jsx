import React from 'react';
import { LayoutDashboard, Database, History, LogOut, Activity } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, username, onLogout }) {
  return (
    <aside className="cms-sidebar">
      <div>
        {/* Logo / Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <span className="brand-title">Change Tracker</span>
        </div>

        {/* Navigation Menu */}
        <ul className="sidebar-menu">
          <li
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Anasayfa (Dashboard)</span>
          </li>
          <li
            className={`menu-item ${activeTab === 'configs' ? 'active' : ''}`}
            onClick={() => setActiveTab('configs')}
          >
            <Database size={18} />
            <span>Veritabanı Ayarları</span>
          </li>
          <li
            className={`menu-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <History size={18} />
            <span>CDC Değişiklik Günlüğü</span>
          </li>
        </ul>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {username ? username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="user-details">
            <span className="user-name">{username || 'Admin User'}</span>
            <span className="user-role">Keycloak Yetkili</span>
          </div>
        </div>

        <button type="button" className="btn-logout" onClick={onLogout}>
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
