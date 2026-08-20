import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Database, CheckCircle2, Zap, History, BarChart2 } from 'lucide-react';

export default function HomePage({ configs = [] }) {
  const [chartViewMode, setChartViewMode] = useState('DAILY'); // 'DAILY' or 'MONTHLY' for Operation Chart
  const [recentConfigs, setRecentConfigs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [activeConfigCount, setActiveConfigCount] = useState(0);
  const [operationStats, setOperationStats] = useState({ insertCount: 0, updateCount: 0, deleteCount: 0, totalCount: 0 });

  const fetchRecentConfigs = async () => {
    try {
      const response = await api.get('/api/cdc/configs/recent-config');
      const activeOnly = (response.data || []).filter(c => c.active);
      setRecentConfigs(activeOnly);
    } catch (err) {
      console.warn('Recent configs fetch warning:', err);
      setRecentConfigs(configs.filter(c => c.active).reverse().slice(0, 3));
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const response = await api.get('/api/cdc/events/latest-event');
      setRecentEvents(response.data || []);
    } catch (err) {
      console.warn('Recent events fetch warning:', err);
    }
  };

  const fetchActiveConfigCount = async () => {
    try {
      const response = await api.get('/api/cdc/configs/active-count');
      setActiveConfigCount(response.data !== undefined ? response.data : 0);
    } catch (err) {
      console.warn('Active config count fetch warning:', err);
      setActiveConfigCount(configs.filter(c => c.active).length);
    }
  };

  const fetchOperationStats = async (mode) => {
    const endpoint = mode === 'DAILY' ? '/api/cdc/events/stats/daily' : '/api/cdc/events/stats/monthly';
    try {
      const response = await api.get(endpoint);
      setOperationStats(response.data || { insertCount: 0, updateCount: 0, deleteCount: 0, totalCount: 0 });
    } catch (err) {
      console.warn('Operation stats fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchRecentConfigs();
    fetchRecentEvents();
    fetchActiveConfigCount();
  }, []);

  useEffect(() => {
    fetchOperationStats(chartViewMode);
  }, [chartViewMode]);

  const getOperationChartData = () => {
    const { insertCount = 0, updateCount = 0, deleteCount = 0, totalCount = 0 } = operationStats;
    const maxCount = Math.max(insertCount, updateCount, deleteCount, 1);

    return {
      totalCount,
      maxCount,
      operations: [
        { type: 'INSERT', label: 'INSERT', count: insertCount, color: '#10b981', bgColor: '#dcfce7' },
        { type: 'UPDATE', label: 'UPDATE', count: updateCount, color: '#2563eb', bgColor: '#e0f2fe' },
        { type: 'DELETE', label: 'DELETE', count: deleteCount, color: '#ef4444', bgColor: '#fef2f2' }
      ]
    };
  };

  const opChartData = getOperationChartData();

  const getEventTypeBadge = (type) => {
    const upperType = type ? type.toUpperCase() : 'UNKNOWN';
    if (upperType === 'INSERT') return <span className="event-badge insert" style={{ fontSize: '0.725rem' }}>INSERT</span>;
    if (upperType === 'UPDATE') return <span className="event-badge update" style={{ fontSize: '0.725rem' }}>UPDATE</span>;
    if (upperType === 'DELETE') return <span className="event-badge delete" style={{ fontSize: '0.725rem' }}>DELETE</span>;
    return <span className="event-badge default" style={{ fontSize: '0.725rem' }}>{upperType}</span>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch (e) {
      return String(timestamp);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. ÜSTTEKİ BÜYÜK KART: SON AKTİFLEŞEN VERİTABANI KONFİGÜRASYONLARI */}
      <div className="cms-card" style={{ padding: '2rem' }}>
        <div className="cms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem' }}>
          <div>
            <h2 className="cms-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Zap size={22} style={{ color: '#2563eb' }} />
              Son Aktifleşen Veritabanı Konfigürasyonları
            </h2>
            <p className="cms-card-subtitle">Şu an aktif olarak çalışan ve en son yayına alınan veritabanı bağlantıları</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.45rem 1rem', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bfdbfe' }}>
            <CheckCircle2 size={18} />
            <span>Aktif {activeConfigCount} Konfigürasyon</span>
          </div>
        </div>

        {/* Son 3 Aktif Konfigürasyonun İsim Listesi */}
        {recentConfigs.length === 0 ? (
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.875rem' }}>
            Şu an aktif olan bir veritabanı konfigürasyonu bulunmuyor. Veritabanı Ayarları sekmesinden bir konfigürasyonu aktifleştirebilirsiniz.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {recentConfigs.slice(0, 3).map((config) => (
              <div key={config.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      {config.connectionName || `Config #${config.id}`}
                    </h4>
                    <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
                      {config.dbHost}:{config.dbPort} / {config.dbName}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <span className={`db-type-badge ${config.dbType === 'MYSQL' ? 'mysql' : 'postgres'}`}>
                    {config.dbType}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10b981' }}>
                    ● Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ALTTAKİ 2 İNCE KART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
        
        {/* ALT SOL İNCE KART: SON YAPILAN DEĞİŞİKLİKLER CANLI TABLOSU */}
        <div className="cms-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="cms-card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
              <h3 className="cms-card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} style={{ color: '#2563eb' }} />
                Son Yakalanan CDC Değişiklik Olayları
              </h3>
              <p className="cms-card-subtitle" style={{ fontSize: '0.8rem' }}>Sistemde gerçekleşen son 5 veritabanı hareketi</p>
            </div>

            {recentEvents.length === 0 ? (
              <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.825rem', fontStyle: 'italic', textAlign: 'center' }}>
                Henüz yakalanan bir değişiklik bulunmuyor.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="cms-table" style={{ fontSize: '0.825rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem 0.75rem' }}>ID</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Tablo</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>İşlem</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Zaman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.slice(0, 5).map((ev) => (
                      <tr key={ev.id}>
                        <td style={{ padding: '0.5rem 0.75rem' }}><strong>#{ev.id}</strong></td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{ev.tableName || '-'}</td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>{getEventTypeBadge(ev.eventType)}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748b', fontSize: '0.775rem' }}>{formatDate(ev.timestamp || ev.createdAt || ev.eventTime || ev.createdDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ALT SAĞ İNCE KART: İŞLEM TİPİ DAĞILIMI (GÜNLÜK / AYLIK BUTONLARI) */}
        <div className="cms-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="cms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <div>
              <h3 className="cms-card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={18} style={{ color: '#2563eb' }} />
                İşlem Tipi Dağılım İstatistiği
              </h3>
              <p className="cms-card-subtitle" style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#475569' }}>
                Toplam İşlem: <strong style={{ color: '#2563eb', fontSize: '0.95rem' }}>{opChartData.totalCount} Adet</strong>
              </p>
            </div>

            {/* Günlük / Aylık Filtre Butonları */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', gap: '0.2rem' }}>
              <button
                type="button"
                onClick={() => setChartViewMode('DAILY')}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.775rem',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chartViewMode === 'DAILY' ? '#ffffff' : 'transparent',
                  color: chartViewMode === 'DAILY' ? '#2563eb' : '#64748b',
                  boxShadow: chartViewMode === 'DAILY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Günlük
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('MONTHLY')}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.775rem',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chartViewMode === 'MONTHLY' ? '#ffffff' : 'transparent',
                  color: chartViewMode === 'MONTHLY' ? '#2563eb' : '#64748b',
                  boxShadow: chartViewMode === 'MONTHLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Aylık
              </button>
            </div>
          </div>

          {/* Dikey Sütun Grafiği (Pinned to Bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '150px', paddingTop: '1rem', borderBottom: '1px solid #e2e8f0', gap: '1rem' }}>
              {opChartData.operations.map((op) => {
                const heightPercent = opChartData.maxCount > 0 ? Math.max(Math.round((op.count / opChartData.maxCount) * 100), 8) : 8;
                return (
                  <div key={op.type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: op.color }}>{op.count}</span>
                    <div style={{ width: '100%', maxWidth: '44px', height: `${heightPercent}%`, backgroundColor: op.bgColor, border: `1px solid ${op.color}`, borderRadius: '6px 6px 0 0', transition: 'height 0.4s ease-in-out' }} />
                    <span style={{ fontSize: '0.725rem', fontWeight: '700', color: '#64748b' }}>{op.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
