import React, { useState } from 'react';
import { History, RefreshCw, Filter, Search, Eye, Code, ArrowRight } from 'lucide-react';

export default function EventsPage({ events, onRefresh }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = events.filter(ev => {
    const matchesType = filterType === 'ALL' || (ev.eventType && ev.eventType.toUpperCase() === filterType);
    const matchesSearch = !searchTerm ||
      (ev.tableName && ev.tableName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.id && ev.id.toString().includes(searchTerm));
    return matchesType && matchesSearch;
  });

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
    <div className="cms-card">
      <div className="cms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cms-card-title">📜 CDC Değişiklik Olay Günlüğü (Change Events)</h2>
          <p className="cms-card-subtitle">Veritabanlarında gerçekleşen gerçek zamanlı INSERT, UPDATE ve DELETE olayları</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Verileri Yenile
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Tablo adı veya ID ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>İşlem Tipi:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-input"
            style={{ width: 'auto', padding: '0.55rem 0.85rem' }}
          >
            <option value="ALL">Tümü</option>
            <option value="INSERT">INSERT (Yeni Kayıt)</option>
            <option value="UPDATE">UPDATE (Güncelleme)</option>
            <option value="DELETE">DELETE (Silme)</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="empty-homepage" style={{ padding: '3rem 1.5rem' }}>
          <div className="empty-icon">
            <History size={28} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Henüz CDC Değişiklik Olayı Bulunmuyor
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Eklenen veritabanlarında tablo değişiklikleri gerçekleştiğinde CDC yakaladığı tüm olayları burada anlık olarak listeleyecektir.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Olay ID</th>
                <th>Config ID</th>
                <th>Tablo Adı</th>
                <th>İşlem Tipi (Operation)</th>
                <th>Tarih & Zaman</th>
                <th style={{ textAlign: 'right' }}>Payload Detayı</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr key={ev.id}>
                  <td><strong>#{ev.id}</strong></td>
                  <td><span className="tables-tag">Config #{ev.configId || ev.cdcConfigId || 1}</span></td>
                  <td><strong>{ev.tableName || 'Bilinmeyen Tablo'}</strong></td>
                  <td>{getEventTypeBadge(ev.eventType)}</td>
                  <td style={{ fontSize: '0.825rem', color: '#64748b' }}>{formatDate(ev.timestamp || ev.createdAt || ev.eventTime)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-action edit"
                      onClick={() => setSelectedEvent(ev)}
                      title="Detayı İncele"
                      style={{ padding: '0.4rem 0.55rem' }}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Payload Modal */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon">
                  <Code size={20} />
                </div>
                <div>
                  <h3 className="modal-title">CDC Değişiklik Detayı (#{selectedEvent.id})</h3>
                  <p className="modal-subtitle">
                    {selectedEvent.tableName} tablosu - {getEventTypeBadge(selectedEvent.eventType)}
                  </p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1.25rem', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', maxHeight: '350px' }}>
                <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-primary" onClick={() => setSelectedEvent(null)} style={{ width: 'auto' }}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
