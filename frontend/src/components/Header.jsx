import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Header({ title }) {
  return (
    <header className="cms-header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <div className="status-indicator">
          <span className="live-dot"></span>
          <span>Keycloak Bağlı</span>
        </div>
      </div>
    </header>
  );
}
