import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Search, Filter, RefreshCw, Eye, Code, History, ChevronLeft, ChevronRight, Database, ChevronDown, Check, X } from 'lucide-react';

export default function EventsPage({ events = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localConfigs, setLocalConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 1. Multi-Select State for Config Selection
  const [selectedConfigIds, setSelectedConfigIds] = useState([]);
  const [configSearchQuery, setConfigSearchQuery] = useState('');
  const [isConfigDropdownOpen, setIsConfigDropdownOpen] = useState(false);
  const configDropdownRef = useRef(null);

  // 2. Multi-Select State for Operation Types
  const [selectedOperationTypes, setSelectedOperationTypes] = useState([]);
  const [isOpDropdownOpen, setIsOpDropdownOpen] = useState(false);
  const opDropdownRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  const handleConfigDropdownToggle = async () => {
    const nextState = !isConfigDropdownOpen;
    setIsConfigDropdownOpen(nextState);

    if (nextState && localConfigs.length === 0 && !loadingConfigs) {
      setLoadingConfigs(true);
      try {
        const response = await api.get('/api/cdc/configs');
        setLocalConfigs(response.data || []);
      } catch (err) {
        console.warn('On-demand configs fetch error:', err);
      } finally {
        setLoadingConfigs(false);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target)) {
        setIsConfigDropdownOpen(false);
      }
      if (opDropdownRef.current && !opDropdownRef.current.contains(event.target)) {
        setIsOpDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleConfigSelection = (id) => {
    setCurrentPage(1);
    setSelectedConfigIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleOperationTypeSelection = (type) => {
    setCurrentPage(1);
    setSelectedOperationTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const filteredConfigOptions = localConfigs.filter((cfg) => {
    const q = configSearchQuery.toLowerCase();
    const connName = (cfg.connectionName || '').toLowerCase();
    const dbName = (cfg.dbName || '').toLowerCase();
    const dbType = (cfg.dbType || '').toLowerCase();
    const idStr = String(cfg.id);
    return connName.includes(q) || dbName.includes(q) || dbType.includes(q) || idStr.includes(q);
  });

  const filteredEvents = events.filter((ev) => {
    const matchesTable = !searchTerm || (ev.tableName && ev.tableName.toLowerCase().includes(searchTerm.toLowerCase()));
    const evType = ev.eventType ? ev.eventType.toUpperCase() : '';
    const matchesType = selectedOperationTypes.length === 0 || selectedOperationTypes.includes(evType);
    const evConfigId = String(ev.configId || ev.cdcConfigId || '');
    const matchesConfig = selectedConfigIds.length === 0 || selectedConfigIds.map(String).includes(evConfigId);

    return matchesTable && matchesType && matchesConfig;
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

  const getSelectedConfigLabel = () => {
    if (selectedConfigIds.length === 0) return 'Tüm Veritabanları';
    if (selectedConfigIds.length === 1) {
      const found = localConfigs.find(c => String(c.id) === String(selectedConfigIds[0]));
      return found ? `#${found.id} - ${found.connectionName || found.dbName}` : `Config #${selectedConfigIds[0]}`;
    }
    return `${selectedConfigIds.length} Veritabanı Seçili`;
  };

  const getSelectedOpTypeLabel = () => {
    if (selectedOperationTypes.length === 0 || selectedOperationTypes.length === 3) return 'Tüm İşlem Tipleri';
    return selectedOperationTypes.join(', ');
  };

  return (
    <div className="cms-card">
      <div className="cms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="cms-card-title">📜 CDC Değişiklik Olay Günlüğü</h2>
          <p className="cms-card-subtitle">Veritabanlarında gerçekleşen canlı INSERT, UPDATE ve DELETE olayları (Toplam {events.length} Kayıt)</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Verileri Yenile
        </button>
      </div>

      {/* Multi-Select Filter Toolbar Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* 1. Tablo Adı Arama Kutusu */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Tablo adı ara (Örn: employees)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* 2. VERİTABANI ÇOKLU SEÇİM FİLTRESİ */}
        <div ref={configDropdownRef} style={{ position: 'relative', minWidth: '270px' }}>
          <div
            onClick={handleConfigDropdownToggle}
            className="form-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              borderColor: selectedConfigIds.length > 0 ? '#2563eb' : '#cbd5e1',
              userSelect: 'none',
              padding: '0.55rem 0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <Database size={15} style={{ color: '#2563eb', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: selectedConfigIds.length > 0 ? '#2563eb' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getSelectedConfigLabel()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {selectedConfigIds.length > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConfigIds([]);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '50%', width: '18px', height: '18px' }}
                  title="Temizle"
                >
                  <X size={12} />
                </span>
              )}
              <ChevronDown size={16} style={{ color: '#64748b', flexShrink: 0, transform: isConfigDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </div>

          {isConfigDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 50,
                padding: '0.5rem',
                minWidth: '280px',
                maxHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Config ID, veritabanı veya tür yaz..."
                  value={configSearchQuery}
                  onChange={(e) => setConfigSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="form-input"
                  style={{ paddingLeft: '2rem', padding: '0.35rem 0.65rem 0.35rem 2rem', fontSize: '0.8rem', backgroundColor: '#f8fafc' }}
                  autoFocus
                />
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '220px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div
                  onClick={() => {
                    setSelectedConfigIds([]);
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
                    backgroundColor: selectedConfigIds.length === 0 ? '#eff6ff' : 'transparent',
                    color: selectedConfigIds.length === 0 ? '#2563eb' : '#0f172a'
                  }}
                >
                  <span>Tüm Veritabanları (Tümü)</span>
                  {selectedConfigIds.length === 0 && <Check size={15} />}
                </div>

                {loadingConfigs ? (
                  <div style={{ padding: '0.65rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={14} className="spin" /> Veritabanları yükleniyor...
                  </div>
                ) : filteredConfigOptions.length === 0 ? (
                  <div style={{ padding: '0.5rem', fontSize: '0.775rem', color: '#94a3b8', textAlign: 'center' }}>
                    Eşleşen veritabanı bulunamadı.
                  </div>
                ) : (
                  filteredConfigOptions.map((cfg) => {
                    const isSelected = selectedConfigIds.includes(cfg.id);
                    return (
                      <div
                        key={cfg.id}
                        onClick={() => toggleConfigSelection(cfg.id)}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                          color: isSelected ? '#2563eb' : '#0f172a',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: '700' }}>#{cfg.id}</span>
                          <span>{cfg.connectionName || cfg.dbName}</span>
                          <span className={`db-type-badge ${cfg.dbType === 'MYSQL' ? 'mysql' : 'postgres'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {cfg.dbType}
                          </span>
                        </div>
                        {isSelected && <Check size={14} style={{ color: '#2563eb' }} />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. İŞLEM TİPİ ÇOKLU SEÇİM FİLTRESİ */}
        <div ref={opDropdownRef} style={{ position: 'relative', minWidth: '220px' }}>
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
              padding: '0.55rem 0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
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
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 50,
                padding: '0.5rem',
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

      {filteredEvents.length === 0 ? (
        <div className="empty-homepage" style={{ padding: '3rem 1.5rem' }}>
          <div className="empty-icon">
            <History size={28} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Aramanızla Eşleşen CDC Değişiklik Olayı Bulunamadı
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Seçtiğiniz veritabanı veya işlem tipi filtrelerini değiştirmeyi ya da temizlemeyi deneyebilirsiniz.
          </p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Olay ID</th>
                  <th>Config ID</th>
                  <th>Tablo Adı</th>
                  <th>İşlem Tipi</th>
                  <th>Tarih & Zaman</th>
                  <th style={{ textAlign: 'right' }}>Payload Detayı</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((ev) => (
                  <tr key={ev.id}>
                    <td><strong>#{ev.id}</strong></td>
                    <td><span className="tables-tag">Config #{ev.configId || ev.cdcConfigId || 1}</span></td>
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

          {/* Sayfalama (Pagination Bar) */}
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
