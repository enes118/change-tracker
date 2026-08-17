import React, { useState } from 'react';
import { Database, CheckCircle2, Zap, History, BarChart2 } from 'lucide-react';

export default function HomePage({ configs = [], events = [] }) {
  const [chartViewMode, setChartViewMode] = useState('DAILY'); // 'DAILY' or 'MONTHLY' for Operation Chart

  const activeConfigs = configs.filter(c => c.active);

  // Take the most recent 5 events
  const recentEvents = events.slice(0, 5);

  // Calculate INSERT, UPDATE, DELETE operation counts for Chart based on Daily/Monthly
  const getOperationChartData = () => {
    const now = new Date();
    let insertCount = 0;
    let updateCount = 0;
    let deleteCount = 0;

    events.forEach(ev => {
      const rawDate = ev.timestamp || ev.createdAt || ev.eventTime || ev.createdDate;
      let includeInPeriod = true;

      if (rawDate) {
        try {
          const d = new Date(rawDate);
          if (chartViewMode === 'DAILY') {
            includeInPeriod = d.toDateString() === now.toDateString();
          } else {
            includeInPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }
        } catch (e) {
          includeInPeriod = true;
        }
      }

      if (includeInPeriod) {
        const eventType = ev.eventType ? ev.eventType.toUpperCase() : '';
        if (eventType === 'INSERT') insertCount += 1;
        else if (eventType === 'UPDATE') updateCount += 1;
        else if (eventType === 'DELETE') deleteCount += 1;
      }
    });

    const totalCount = insertCount + updateCount + deleteCount;
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

  // Take the last 3 saved database configs
  const recentConfigs = [...configs].reverse().slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. ÜSTTEKİ BÜYÜK KART: SON KAYDEDİLEN 3 VERİTABANI KONFİGÜRASYONU */}
      <div className="cms-card" style={{ padding: '2rem' }}>
        <div className="cms-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem' }}>
          <div>
            <h2 className="cms-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Zap size={22} style={{ color: '#2563eb' }} />
              Son Kaydedilen Veritabanı Konfigürasyonları
            </h2>
            <p className="cms-card-subtitle">Sisteme son eklenen veritabanı bağlantıları (Son 3 Kayıt)</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.45rem 1rem', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem', border: '1px solid #bfdbfe' }}>
            <CheckCircle2 size={18} />
            <span>Toplam {configs.length} Konfigürasyon</span>
          </div>
        </div>

        {/* Son 3 Konfigürasyonun İsim Listesi */}
        {recentConfigs.length === 0 ? (
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.875rem' }}>
            Şu an kaydedilmiş bir veritabanı konfigürasyonu bulunmuyor. Veritabanı Ayarları sekmesinden yeni bir konfigürasyon ekleyebilirsiniz.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {recentConfigs.map((config) => (
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
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: config.active ? '#10b981' : '#64748b' }}>
                    {config.active ? '● Aktif' : '○ Pasif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. ALTTAKİ 2 İNCE KART */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* ALT SOL İNCE KART: SON YAPILAN DEĞİŞİKLİKLER CANLI TABLOSU */}
        <div className="cms-card" style={{ padding: '1.5rem' }}>
          <div className="cms-card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="cms-card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} style={{ color: '#2563eb' }} />
                Son Yapılan Değişiklikler
              </h3>
              <p className="cms-card-subtitle" style={{ fontSize: '0.8rem' }}>
                Veritabanlarında saniyeler önce gerçekleşen en son canlı hareketler
              </p>
            </div>
          </div>

          {recentEvents.length === 0 ? (
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Henüz kaydedilmiş bir canlı değişiklik hareketi yok.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Tarih & Saat</th>
                    <th>Veritabanı</th>
                    <th>Tablo</th>
                    <th>İşlem Tipi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(ev.timestamp || ev.createdAt || ev.eventTime || ev.createdDate)}</td>
                      <td><strong>{ev.connectionName || ev.dbName || `Config #${ev.configId || 1}`}</strong></td>
                      <td><span className="tables-tag">{ev.tableName || 'employees'}</span></td>
                      <td>{getEventTypeBadge(ev.eventType)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ALT SAĞ İNCE KART: DİKEY SÜTUN GRAFİĞİ (COLUMN CHART) */}
        <div className="cms-card" style={{ padding: '1.5rem 1.5rem 0.85rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="cms-card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 className="cms-card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={18} style={{ color: '#2563eb' }} />
                İşlem Tipi Sütun Grafiği
              </h3>
              <p className="cms-card-subtitle" style={{ fontSize: '0.8rem' }}>
                {chartViewMode === 'DAILY' ? 'Bugün gerçekleşen INSERT, UPDATE, DELETE sütun grafiği' : 'Bu ay gerçekleşen INSERT, UPDATE, DELETE sütun grafiği'}
              </p>
            </div>

            {/* Grafiğin Günlük / Aylık Seçim Butonları */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setChartViewMode('DAILY')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.775rem',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chartViewMode === 'DAILY' ? '#ffffff' : 'transparent',
                  color: chartViewMode === 'DAILY' ? '#2563eb' : '#64748b',
                  boxShadow: chartViewMode === 'DAILY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Günlük
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('MONTHLY')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.775rem',
                  fontWeight: '700',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chartViewMode === 'MONTHLY' ? '#ffffff' : 'transparent',
                  color: chartViewMode === 'MONTHLY' ? '#2563eb' : '#64748b',
                  boxShadow: chartViewMode === 'MONTHLY' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Aylık
              </button>
            </div>
          </div>

          {/* Dikey Sütun Grafiği (Vertical Column Chart) */}
          {opChartData.totalCount === 0 ? (
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: 'auto' }}>
              Seçilen dönemde kaydedilmiş bir işlem hareketi bulunmuyor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '160px', paddingBottom: '0', borderBottom: '2px solid #cbd5e1' }}>
                {opChartData.operations.map((op) => {
                  const percentage = opChartData.totalCount > 0 ? Math.round((op.count / opChartData.totalCount) * 100) : 0;
                  const heightPercent = Math.max(Math.round((op.count / opChartData.maxCount) * 100), 8);

                  return (
                    <div key={op.type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28%', height: '100%', justifyContent: 'flex-end' }}>
                      {/* Count Badge on Top of Bar */}
                      <span style={{ fontSize: '0.825rem', fontWeight: '800', color: op.color, marginBottom: '0.35rem' }}>
                        {op.count}
                      </span>

                      {/* Bar Pillar */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '48px',
                          height: `${heightPercent}%`,
                          backgroundColor: op.color,
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.5s ease-in-out',
                          boxShadow: `0 4px 12px ${op.color}33`,
                          marginBottom: '0'
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Bottom Labels & Percentages */}
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                {opChartData.operations.map((op) => {
                  const percentage = opChartData.totalCount > 0 ? Math.round((op.count / opChartData.totalCount) * 100) : 0;

                  return (
                    <div key={op.type} style={{ width: '28%' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>{op.label}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: '600' }}>%{percentage}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
