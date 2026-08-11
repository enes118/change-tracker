import React from 'react';
import { Plus, Edit2, Trash2, Database, Power, CheckCircle, XCircle } from 'lucide-react';

export default function ConfigsPage({ configs, onOpenCreateModal, onOpenEditModal, onToggleActive, onDeleteConfig }) {
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
                <th>Veritabanı Tipi</th>
                <th>Sunucu Adresi</th>
                <th>Veritabanı Adı</th>
                <th>Kullanıcı</th>
                <th>İzlenen Tablolar</th>
                <th>Aralık (ms)</th>
                <th>Durum</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id}>
                  <td><strong>#{config.id}</strong></td>
                  <td>
                    <span className={`db-type-badge ${config.dbType === 'MYSQL' ? 'mysql' : 'postgres'}`}>
                      {config.dbType}
                    </span>
                  </td>
                  <td>{config.dbHost}:{config.dbPort}</td>
                  <td><strong>{config.dbName}</strong></td>
                  <td>{config.dbUser}</td>
                  <td>
                    <span className="tables-tag">
                      {config.tables || 'Tüm Tablolar'}
                    </span>
                  </td>
                  <td>{config.pollIntervalMs || 1000} ms</td>
                  <td>
                    <button
                      type="button"
                      className={`status-badge-btn ${config.active ? 'active' : 'inactive'}`}
                      onClick={() => onToggleActive(config.id, !config.active)}
                      title="Durumu Değiştirmek İçin Tıklayın"
                    >
                      {config.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {config.active ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-action edit"
                        onClick={() => onOpenEditModal(config)}
                        title="Düzenle"
                      >
                        <Edit2 size={15} /> Düzenle
                      </button>
                      <button
                        type="button"
                        className="btn-action delete"
                        onClick={() => onDeleteConfig(config.id)}
                        title="Sil"
                      >
                        <Trash2 size={15} /> Sil
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
