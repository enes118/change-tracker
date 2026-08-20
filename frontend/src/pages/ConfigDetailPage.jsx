import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { ArrowLeft, RefreshCw, Eye, History, Database, Search, Filter, Code, ChevronLeft, ChevronRight, ChevronDown, Check, X } from 'lucide-react';

export default function ConfigDetailPage({ config, onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Multi-Select Operation Types State (empty [] = All)
  const [selectedOperationTypes, setSelectedOperationTypes] = useState([]);
  const [isOpDropdownOpen, setIsOpDropdownOpen] = useState(false);
  const opDropdownRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const fetchEvents = async () => {
    if (!config || !config.id) return;
    setLoading(true);
    try {
      const response = await api.get(`/api/cdc/events/config/${config.id}`);
      setEvents(response.data || []);
    } catch (err) {
      console.error('Config events error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config) {
      fetchEvents();
    }
  }, [config]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (opDropdownRef.current && !opDropdownRef.current.contains(event.target)) {
        setIsOpDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!config) {
    return (
      <div className="cms-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Konfigürasyon seçilmedi.</p>
        <button type="button" className="btn-secondary" onClick={onBack} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Geri Dön
        </button>
      </div>
    );
  }

  const toggleOperationTypeSelection = (type) => {
    setCurrentPage(1);
    setSelectedOperationTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = !searchTerm || (ev.tableName && ev.tableName.toLowerCase().includes(searchTerm.toLowerCase()));
    const evType = ev.eventType ? ev.eventType.toUpperCase() : '';
    const matchesType = selectedOperationTypes.length === 0 || selectedOperationTypes.includes(evType);

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);

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

  const getSelectedOpTypeLabel = () => {
    if (selectedOperationTypes.length === 0 || selectedOperationTypes.length === 3) return 'Tüm İşlem Tipleri';
    return selectedOperationTypes.join(', ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Card */}
      <div className="cms-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} /> Geri Dön
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {config.connectionName || `Config #${config.id}`} Değişiklik Detayı
                </h2>
                <span className={`db-type-badge ${config.dbType === 'MYSQL' ? 'mysql' : 'postgres'}`}>
                  {config.dbType}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.65rem', borderRadius: '12px', backgroundColor: config.active ? '#dcfce7' : '#f1f5f9', color: config.active ? '#15803d' : '#64748b' }}>
                  {config.active ? '● Aktif' : '○ Pasif'}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {config.dbHost}:{config.dbPort} / Veritabanı: <strong>{config.dbName}</strong> (Kullanıcı: {config.dbUser})
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchEvents}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Verileri Yenile
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: '600', display: 'block' }}>İzlenen Tablolar</span>
            <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{config.tableIncludeList || 'Tüm Tablolar'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: '600', display: 'block' }}>Oluşturan & Tarih</span>
            <strong style={{ fontSize: '0.825rem', color: '#0284c7', display: 'block' }}>{config.createdBy || 'Admin'}</strong>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{formatDate(config.createdDate)}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: '600', display: 'block' }}>Son Düzenleyen & Tarih</span>
            <strong style={{ fontSize: '0.825rem', color: '#0f172a', display: 'block' }}>{config.updatedBy || config.createdBy || 'Admin'}</strong>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{formatDate(config.updatedDate || config.createdDate)}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: '600', display: 'block' }}>Toplam Yakalanan Olay</span>
            <strong style={{ fontSize: '1rem', color: '#2563eb' }}>{events.length} Adet Değişim</strong>
          </div>
        </div>
      </div>

      {/* Main CDC Events Table Card */}
      <div className="cms-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className="cms-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={20} style={{ color: '#2563eb' }} />
            Bu Konfigürasyona Ait Canlı Değişiklik Olayları
          </h3>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Tablo adı ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input"
                style={{ paddingLeft: '2.25rem', padding: '0.45rem 0.75rem 0.45rem 2.25rem', fontSize: '0.85rem' }}
              />
            </div>

            <div ref={opDropdownRef} style={{ position: 'relative', minWidth: '200px' }}>
              <div
                onClick={() => setIsOpDropdownOpen(!isOpDropdownOpen)}
                className="form-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  borderColor: selectedOperationTypes.length > 0 ? '#2563eb' : '#cbd5e1',
                  userSelect: 'none',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                  <Filter size={15} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: selectedOperationTypes.length > 0 ? '#2563eb' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getSelectedOpTypeLabel()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {selectedOperationTypes.length > 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOperationTypes([]);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '50%', width: '18px', height: '18px' }}
                      title="Temizle"
                    >
                      <X size={12} />
                    </span>
                  )}
                  <ChevronDown size={16} style={{ color: '#64748b', flexShrink: 0, transform: isOpDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {isOpDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    padding: '0.5rem',
                    minWidth: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedOperationTypes([]);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      backgroundColor: selectedOperationTypes.length === 0 ? '#eff6ff' : 'transparent',
                      color: selectedOperationTypes.length === 0 ? '#2563eb' : '#0f172a'
                    }}
                  >
                    <span>Tüm İşlem Tipleri</span>
                    {selectedOperationTypes.length === 0 && <Check size={15} />}
                  </div>

                  {[
                    { type: 'INSERT', label: 'INSERT (Yeni Kayıt)', color: 'insert' },
                    { type: 'UPDATE', label: 'UPDATE (Güncelleme)', color: 'update' },
                    { type: 'DELETE', label: 'DELETE (Silme)', color: 'delete' }
                  ].map((op) => {
                    const isSelected = selectedOperationTypes.includes(op.type);
                    return (
                      <div
                        key={op.type}
                        onClick={() => toggleOperationTypeSelection(op.type)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          color: isSelected ? '#2563eb' : '#0f172a'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span className={`event-badge ${op.color}`} style={{ fontSize: '0.725rem' }}>{op.type}</span>
                        </div>
                        {isSelected && <Check size={14} style={{ color: '#2563eb' }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-homepage" style={{ padding: '3rem 1.5rem' }}>
            <div className="empty-icon">
              <History size={28} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Bu Konfigürasyona Ait Değişiklik Bulunamadı
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Veritabanında (<strong>{config.dbName}</strong>) yeni bir tablo hareketi yapıldığında burada anında listelenecektir.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Olay ID</th>
                    <th>Tablo Adı</th>
                    <th>İşlem Tipi</th>
                    <th>Tarih & Saat</th>
                    <th style={{ textAlign: 'right' }}>Payload Detayı</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((ev) => (
                    <tr key={ev.id}>
                      <td><strong>#{ev.id}</strong></td>
                      <td><strong>{ev.tableName || 'Bilinmeyen Tablo'}</strong></td>
                      <td>{getEventTypeBadge(ev.eventType)}</td>
                      <td style={{ fontSize: '0.825rem', color: '#64748b' }}>{formatDate(ev.timestamp || ev.createdAt || ev.eventTime || ev.createdDate)}</td>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Toplam <strong>{filteredEvents.length}</strong> olaydan <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEvents.length)}</strong> arası gösteriliyor
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <ChevronLeft size={16} /> Önceki
                </button>

                <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem', color: '#0f172a' }}>
                  Sayfa {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  Sonraki <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payload Modal */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon">
                  <Code size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Değişiklik Detayı (Payload JSON)</h3>
                  <p className="modal-subtitle">Olay #{selectedEvent.id} - Tablo: {selectedEvent.tableName}</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1.25rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
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
