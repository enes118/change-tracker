import React, { useState, useEffect } from 'react';
import { X, Database, Check, Server, Shield, Layers, Clock } from 'lucide-react';

export default function ConfigModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    id: null,
    dbType: 'POSTGRESQL',
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: '',
    dbUser: '',
    dbPassword: '',
    tables: '',
    pollIntervalMs: 1000,
    active: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || null,
        dbType: initialData.dbType || 'POSTGRESQL',
        dbHost: initialData.dbHost || 'localhost',
        dbPort: initialData.dbPort || (initialData.dbType === 'MYSQL' ? 3306 : 5432),
        dbName: initialData.dbName || '',
        dbUser: initialData.dbUser || '',
        dbPassword: initialData.dbPassword || '',
        tables: initialData.tables || '',
        pollIntervalMs: initialData.pollIntervalMs || 1000,
        active: initialData.active !== undefined ? initialData.active : true
      });
    } else {
      setFormData({
        id: null,
        dbType: 'POSTGRESQL',
        dbHost: 'localhost',
        dbPort: 5432,
        dbName: '',
        dbUser: '',
        dbPassword: '',
        tables: '',
        pollIntervalMs: 1000,
        active: true
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'dbType') {
      const defaultPort = value === 'MYSQL' ? 3306 : 5432;
      setFormData(prev => ({
        ...prev,
        dbType: value,
        dbPort: defaultPort
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.dbName || !formData.dbUser) {
      alert('Lütfen Veritabanı Adı ve Kullanıcı Adı alanlarını doldurunuz.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">
              <Database size={20} />
            </div>
            <div>
              <h3 className="modal-title">
                {formData.id ? `Konfigürasyon Düzenle (#${formData.id})` : 'Yeni Veritabanı Konfigürasyonu'}
              </h3>
              <p className="modal-subtitle">CDC dinleyicisi için veritabanı bağlantı detayları</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            {/* DB Type */}
            <div className="form-group">
              <label className="form-label">Veritabanı Tipi</label>
              <select
                name="dbType"
                value={formData.dbType}
                onChange={handleChange}
                className="form-input"
              >
                <option value="POSTGRESQL">PostgreSQL</option>
                <option value="MYSQL">MySQL</option>
              </select>
            </div>

            {/* DB Host */}
            <div className="form-group">
              <label className="form-label">Sunucu Adresi (Host)</label>
              <input
                type="text"
                name="dbHost"
                value={formData.dbHost}
                onChange={handleChange}
                placeholder="localhost veya IP"
                className="form-input"
                required
              />
            </div>

            {/* DB Port */}
            <div className="form-group">
              <label className="form-label">Port</label>
              <input
                type="number"
                name="dbPort"
                value={formData.dbPort}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            {/* DB Name */}
            <div className="form-group">
              <label className="form-label">Veritabanı Adı (Database Name)</label>
              <input
                type="text"
                name="dbName"
                value={formData.dbName}
                onChange={handleChange}
                placeholder="ör: inventory_db"
                className="form-input"
                required
              />
            </div>

            {/* DB User */}
            <div className="form-group">
              <label className="form-label">Kullanıcı Adı (User)</label>
              <input
                type="text"
                name="dbUser"
                value={formData.dbUser}
                onChange={handleChange}
                placeholder="ör: postgres veya root"
                className="form-input"
                required
              />
            </div>

            {/* DB Password */}
            <div className="form-group">
              <label className="form-label">Şifre (Password)</label>
              <input
                type="password"
                name="dbPassword"
                value={formData.dbPassword}
                onChange={handleChange}
                placeholder="Veritabanı Şifresi"
                className="form-input"
              />
            </div>
          </div>

          {/* Target Tables */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Dinlenecek Tablolar (Virgülle Ayrılmış)</label>
            <input
              type="text"
              name="tables"
              value={formData.tables}
              onChange={handleChange}
              placeholder="ör: users, orders, products (Boş ise tüm tablolar)"
              className="form-input"
            />
          </div>

          <div className="form-grid" style={{ marginTop: '1rem' }}>
            {/* Poll Interval */}
            <div className="form-group">
              <label className="form-label">Sorgu Aralığı (ms)</label>
              <input
                type="number"
                name="pollIntervalMs"
                value={formData.pollIntervalMs}
                onChange={handleChange}
                step="500"
                className="form-input"
              />
            </div>

            {/* Active Toggle */}
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <label className="form-label">CDC Dinleme Durumu</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="active" style={{ fontSize: '0.9rem', fontWeight: 600, color: formData.active ? '#10b981' : '#64748b', cursor: 'pointer' }}>
                  {formData.active ? 'Aktif (Dinleme Açık)' : 'Pasif (Kapalı)'}
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              İptal
            </button>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.65rem 1.5rem' }}>
              <Check size={18} /> {formData.id ? 'Değişiklikleri Kaydet' : 'Konfigürasyonu Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
