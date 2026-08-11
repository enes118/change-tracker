import React from 'react';
import { Home } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="cms-card">
      <div className="cms-card-header">
        <h2 className="cms-card-title">Anasayfa</h2>
        <p className="cms-card-subtitle">Change Tracker Yönetim Paneli Anasayfası</p>
      </div>

      <div className="empty-homepage">
        <div className="empty-icon">
          <Home size={28} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Anasayfa İçeriği Hazırlanıyor
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '400px', lineHeight: 1.5 }}>
          Şu an anasayfa tasarım düzeniniz hazır. Yeni modüller ve bileşenler adım adım buraya eklenecektir.
        </p>
      </div>
    </div>
  );
}
