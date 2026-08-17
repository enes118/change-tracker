import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, History, RefreshCw, Code, Eye } from 'lucide-react';

export default function ConfigEventsModal({ isOpen, onClose, config }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState(null);

  const fetchConfigEvents = async () => {
    if (!config || !config.id) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/cdc/events/config/${config.id}`);
      setEvents(response.data || []);
    } catch (err) {
      console.error('Config events fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && config) {
      fetchConfigEvents();
    }
  }, [isOpen, config]);

  if (!isOpen || !config) return null;

  const getEventTypeBadge = (type) => {
    const upperType = type ? type.toUpperCase() : 'UNKNOWN';
    if (upperType === 'INSERT') return <span className="event-badge insert">INSERT</span>;
    if (upperType === 'UPDATE') return <span className="event-badge update">UPDATE</span>;
    if (upperType === 'DELETE') return <span className="event-badge delete">DELETE</span>;
    return <span className="event-badge default">{upperType}</span>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return String(timestamp);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '820px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <History size={20} />
            </div>
            <div>
              <h3 className="modal-title">
                CDC Değişiklik Tarihçesi: {config.connectionName || `Config #${config.id}`}
              </h3>
              <p className="modal-subtitle">
                {config.dbType} ({config.dbHost}:{config.dbPort} / {config.dbName}) veritabanına ait canlı değişiklikler
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>
              Toplam {events.length} Olay Bulundu
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchConfigEvents}
              disabled={loading}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Yenile
            </button>
          </div>

          {events.length === 0 ? (
            <div className="empty-homepage" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-icon">
                <History size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                Bu Konfigürasyona Ait Henüz Bir Değişiklik Yok
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
                Bu veritabanında (<strong>{config.dbName}</strong>) bir `employees` veya ilgili tabloda INSERT, UPDATE veya DELETE yapıldığında burada anında görünecektir.
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tablo Adı</th>
                    <th>İşlem Tipi</th>
                    <th>Tarih</th>
                    <th style={{ textAlign: 'right' }}>Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id}>
                      <td><strong>#{ev.id}</strong></td>
                      <td><strong>{ev.tableName || 'Tablo'}</strong></td>
                      <td>{getEventTypeBadge(ev.eventType)}</td>
                      <td style={{ fontSize: '0.825rem', color: '#64748b' }}>{formatDate(ev.timestamp || ev.createdAt || ev.eventTime)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-action edit"
                          onClick={() => setSelectedPayload(ev)}
                          title="JSON Detayı İncele"
                          style={{ padding: '0.35rem 0.5rem' }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Inner JSON Payload Viewer */}
          {selectedPayload && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '10px', color: '#38bdf8', fontSize: '0.825rem', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '0.35rem' }}>
                <span>Olay #{selectedPayload.id} - {selectedPayload.tableName} ({selectedPayload.eventType})</span>
                <button type="button" onClick={() => setSelectedPayload(null)} style={{ background: 'none', border: 'none', color: '#f1f5f9', cursor: 'pointer' }}>×</button>
              </div>
              <pre style={{ overflowX: 'auto', maxHeight: '200px' }}>{JSON.stringify(selectedPayload, null, 2)}</pre>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-primary" onClick={onClose} style={{ width: 'auto' }}>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
