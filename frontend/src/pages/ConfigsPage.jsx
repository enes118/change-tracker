import React from 'react';
import { Plus, Edit2, Trash2, Database, CheckCircle, XCircle, History, User, Calendar } from 'lucide-react';

export default function ConfigsPage({ configs, onOpenCreateModal, onOpenEditModal, onToggleActive, onDeleteConfig, onViewEvents }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(timestamp);
    }
  };

  return (
    <div className="cms-card">
      <div className="cms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cms-card-title">⚙️ Veritabanı CDC Konfigürasyonları</h2>
          <p className="cms-card-subtitle">Değişiklikleri (CDC) izlenecek veritabanı bağlantılarının listesi ve yönetimi</p>
        </div>
        <button type="button" className="btn-primary" onClick={onOpenCreateModal} style={{ width: 'auto', padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
          <Plus size={18} /> Yeni Konfigürasyon Ekle
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="empty-homepage" style={{ padding: '3rem 1.5rem' }}>
          <div className="empty-icon">
            <Database size={28} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Henüz Veritabanı Konfigürasyonu Eklenmedi
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
            CDC dinleyicisinin çalışması için yeni bir PostgreSQL veya MySQL veritabanı ekleyin.
          </p>
          <button type="button" className="btn-primary" onClick={onOpenCreateModal} style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
            <Plus size={16} /> İlk Konfigürasyonu Oluştur
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cms-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bağlantı Adı</th>
                <th>Veritabanı Tipi</th>
                <th>Sunucu Adresi</th>
                <th>Veritabanı Adı</th>
                <th>Kullanıcı</th>
                <th>Oluşturan / Güncelleyen</th>
                <th>Oluşturulma & Güncellenme Tarihi</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id}>
                  <td><strong>#{config.id}</strong></td>
                  <td><strong>{config.connectionName || `Config-${config.id}`}</strong></td>
                  <td>
                    <span className={`db-type-badge ${config.dbType === 'MYSQL' ? 'mysql' : 'postgres'}`}>
                      {config.dbType}
                    </span>
                  </td>
                  <td>{config.dbHost}:{config.dbPort}</td>
                  <td><strong>{config.dbName}</strong></td>
                  <td>{config.dbUser}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.775rem' }}>
                      <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={12} /> Ekle: {config.createdBy || 'Admin'}
                      </span>
                      {config.updatedBy && (
                        <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User size={12} /> Düzenle: {config.updatedBy}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.775rem', color: '#64748b' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} /> Eklenme: {formatDate(config.createdDate)}
                      </span>
                      {config.updatedDate && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                          <Calendar size={12} /> Güncelleme: {formatDate(config.updatedDate)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`status-badge-btn ${config.active ? 'active' : 'inactive'}`}
                      onClick={() => onToggleActive(config.id, !config.active)}
                      title={config.active ? "Aktif (Pasifleştirmek için tıklayın)" : "Pasif (Aktifleştirmek için tıklayın)"}
                      style={{ padding: '0.4rem 0.55rem' }}
                    >
                      {config.active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-action edit"
                        onClick={() => onViewEvents(config)}
                        title="Bu Konfigürasyona Ait Değişiklikleri Gör"
                        style={{ padding: '0.4rem 0.55rem', backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                      >
                        <History size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-action edit"
                        onClick={() => onOpenEditModal(config)}
                        title="Düzenle"
                        style={{ padding: '0.4rem 0.55rem' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-action delete"
                        onClick={() => onDeleteConfig(config.id)}
                        title="Sil"
                        style={{ padding: '0.4rem 0.55rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
