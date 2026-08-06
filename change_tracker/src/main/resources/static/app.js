const keycloakConfig = {
    url: 'http://localhost:8081',
    realm: 'change-tracker-realm',
    clientId: 'change-tracker-client'
};

let keycloak = null;
let authToken = null;

document.addEventListener('DOMContentLoaded', () => {
    initKeycloak();
});

function initKeycloak() {
    console.log('🔒 Keycloak Başlatılıyor...');

    if (typeof Keycloak === 'undefined') {
        console.warn('⚠️ Keycloak JS kütüphanesi yüklenemedi. Doğrudan Dashboard açılıyor.');
        startDashboardServices();
        return;
    }

    try {
        keycloak = new Keycloak(keycloakConfig);

        keycloak.init({
            onLoad: 'login-required',
            checkLoginIframe: false,
            pkceMethod: 'S256'
        }).then(authenticated => {
            if (authenticated) {
                console.log('✅ Keycloak İle Başarıyla Giriş Yapıldı!');
                authToken = keycloak.token;
                setupUserUI();
                startDashboardServices();
            } else {
                console.warn('🔑 Oturum açılmadı.');
                startDashboardServices();
            }
        }).catch(err => {
            console.error('⚠️ Keycloak Giriş Hatası:', err);
            startDashboardServices();
        });

        setInterval(() => {
            if (keycloak && keycloak.authenticated) {
                keycloak.updateToken(30).then(refreshed => {
                    if (refreshed) {
                        console.log('🔄 Keycloak JWT Token Yenilendi');
                        authToken = keycloak.token;
                    }
                }).catch(() => {
                    console.error('❌ Token yenilenemedi.');
                });
            }
        }, 10000);

    } catch (err) {
        console.error('Keycloak yükleme hatası:', err);
        startDashboardServices();
    }
}

function setupUserUI() {
    document.getElementById('userBadge').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'inline-flex';

    const username = keycloak.tokenParsed ? (keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.name || keycloak.tokenParsed.sub) : 'User';
    document.getElementById('usernameDisplay').innerText = username;
    document.getElementById('userInitial').innerText = username.charAt(0).toUpperCase();
    document.getElementById('authStatusText').innerText = 'Keycloak İle Doğrulandı (' + username + ')';
}

function logout() {
    if (keycloak && keycloak.authenticated) {
        keycloak.logout({
            redirectUri: window.location.origin + '/index.html'
        });
    } else {
        alert('Oturum kapatıldı.');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));

    const targetView = document.getElementById(tabId);
    if (targetView) {
        targetView.classList.add('active');
    }

    const activeBtn = Array.from(document.querySelectorAll('.nav-tab')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    if (tabId === 'tabHome') {
        loadListenerStatuses();
        loadHomeEventsPreview();
    } else if (tabId === 'tabConfigs') {
        loadConfigsTable();
    } else if (tabId === 'tabEvents') {
        loadCapturedEvents();
    }
}

async function fetchWithAuth(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }

    if (authToken) {
        options.headers['Authorization'] = 'Bearer ' + authToken;
    }

    try {
        const response = await fetch(url, options);
        return response;
    } catch (err) {
        console.error('API Bağlantı Hatası:', err);
        throw err;
    }
}

function startDashboardServices() {
    loadListenerStatuses();
    loadHomeEventsPreview();
    loadConfigsTable();
    loadCapturedEvents();

    if (!window.pollingInterval) {
        window.pollingInterval = setInterval(() => {
            const activeTab = document.querySelector('.tab-view.active');
            if (activeTab && activeTab.id === 'tabHome') {
                loadListenerStatuses();
                loadHomeEventsPreview();
            } else if (activeTab && activeTab.id === 'tabEvents') {
                loadCapturedEvents();
            }
        }, 5000);
    }
}

/* ==========================================================================
   1. DASHBOARD & LISTENERS STATUS FUNCTIONS
   ========================================================================== */

async function loadListenerStatuses() {
    const container = document.getElementById('listenersContainer');
    try {
        const res = await fetchWithAuth('/api/cdc/listeners/status');
        if (!res.ok) throw new Error('Status çekilemedi');
        
        const data = await res.json();
        container.innerHTML = '';

        const keys = Object.keys(data);
        if (keys.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Sistemde tanımlı dinleyici bulunamadı.</p>';
            return;
        }

        keys.forEach(key => {
            const status = data[key];
            const isRunning = status === 'RUNNING';

            const match = key.match(/Config ID (\d+)/);
            const configId = match ? match[1] : null;

            const item = document.createElement('div');
            item.className = 'listener-item';
            item.innerHTML = `
                <div class="listener-info">
                    <h4>${key}</h4>
                    <p>Durum: <span class="badge ${isRunning ? 'badge-running' : 'badge-stopped'}">${status}</span></p>
                </div>
                <div>
                    ${configId ? (isRunning 
                        ? `<button class="btn btn-danger btn-sm" onclick="toggleListener(${configId}, 'stop')">⏸️ Durdur</button>`
                        : `<button class="btn btn-success btn-sm" onclick="toggleListener(${configId}, 'start')">▶️ Başlat</button>`
                    ) : ''}
                </div>
            `;
            container.appendChild(item);
        });

    } catch (err) {
        container.innerHTML = '<p style="color: var(--status-danger); font-size: 0.875rem;">Dinleyici durumları alınırken hata oluştu.</p>';
    }
}

async function toggleListener(configId, action) {
    try {
        const res = await fetchWithAuth(`/api/cdc/listeners/${configId}/${action}`, {
            method: 'POST'
        });
        if (res.ok) {
            loadListenerStatuses();
        } else {
            alert(`Hata: Dinleyici ${action} işlemi başarısız.`);
        }
    } catch (err) {
        alert('Bağlantı hatası oluştu.');
    }
}

async function loadHomeEventsPreview() {
    const previewContainer = document.getElementById('homeEventsPreview');
    try {
        const res = await fetchWithAuth('/api/cdc/events');
        if (!res.ok) throw new Error('Olaylar çekilemedi');

        const events = await res.json();
        if (!events || events.length === 0) {
            previewContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Henüz yakalanmış bir veri değişikliği bulunmuyor.</p>';
            return;
        }

        const recent = events.slice(0, 3);
        let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';

        recent.forEach(ev => {
            let badgeClass = 'badge-insert';
            if (ev.eventType === 'UPDATE') badgeClass = 'badge-update';
            if (ev.eventType === 'DELETE') badgeClass = 'badge-delete';

            html += `
                <div style="background: rgba(255,255,255,0.02); padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span class="badge ${badgeClass}">${ev.eventType}</span>
                        <span style="font-weight: 600; margin-left: 0.5rem;">${ev.tableName || 'all'}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">(${ev.dbType})</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.8rem;">
                        ${ev.createdDate ? new Date(ev.createdDate).toLocaleTimeString('tr-TR') : ''}
                    </div>
                </div>`;
        });
        html += '</div>';
        previewContainer.innerHTML = html;

    } catch (err) {
        previewContainer.innerHTML = '<p style="color: var(--status-danger); font-size: 0.875rem;">Ön izleme yüklenemedi.</p>';
    }
}

/* ==========================================================================
   2. CDC CONFIGURATION CRUD FUNCTIONS
   ========================================================================== */

async function loadConfigsTable() {
    const tbody = document.getElementById('configsTableBody');
    try {
        const res = await fetchWithAuth('/api/cdc/configs');
        if (!res.ok) throw new Error('Konfigürasyonlar çekilemedi');

        const configs = await res.json();
        tbody.innerHTML = '';

        if (!configs || configs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: var(--text-muted);">
                        Sistemde tanımlı bir veritabanı konfigürasyonu bulunmuyor.
                    </td>
                </tr>`;
            return;
        }

        configs.forEach(config => {
            const tr = document.createElement('tr');
            const isActive = config.active !== false;

            tr.innerHTML = `
                <td>#${config.id}</td>
                <td><strong>${escapeHtml(config.connectionName || '')}</strong></td>
                <td><span style="color: var(--accent-secondary); font-weight: 600;">${config.dbType || ''}</span></td>
                <td>${config.dbHost || ''}:${config.dbPort || ''}</td>
                <td>${config.dbName || ''}</td>
                <td>${config.dbUser || ''}</td>
                <td>${config.tableIncludeList || 'tümü'}</td>
                <td>
                    <span class="badge ${isActive ? 'badge-running' : 'badge-stopped'}">
                        ${isActive ? 'AKTİF' : 'PASİF'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.4rem;">
                        <button class="btn btn-secondary btn-sm" onclick="openEditConfigModal(${config.id})">✏️ Düzenle</button>
                        <button class="btn ${isActive ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleConfigActiveAction(${config.id}, ${!isActive})">
                            ${isActive ? '⏸️ Pasif Yap' : '▶️ Aktif Yap'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteConfigAction(${config.id})">🗑️ Sil</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--status-danger);">
                    Konfigürasyonlar yüklenirken hata oluştu.
                </td>
            </tr>`;
    }
}

// Modal Form Controls
function openNewConfigModal() {
    document.getElementById('configForm').reset();
    document.getElementById('configId').value = '';
    document.getElementById('modalTitle').innerText = '➕ Yeni Veritabanı Konfigürasyonu Ekle';
    document.getElementById('configModal').classList.add('active');
}

async function openEditConfigModal(id) {
    try {
        const res = await fetchWithAuth(`/api/cdc/configs/${id}`);
        if (!res.ok) throw new Error('Konfigürasyon okunamadı');

        const config = await res.json();
        document.getElementById('configId').value = config.id;
        document.getElementById('connectionName').value = config.connectionName || '';
        document.getElementById('dbType').value = config.dbType || 'POSTGRESQL';
        document.getElementById('dbHost').value = config.dbHost || '';
        document.getElementById('dbPort').value = config.dbPort || '';
        document.getElementById('dbName').value = config.dbName || '';
        document.getElementById('dbUser').value = config.dbUser || '';
        document.getElementById('dbPassword').value = '';
        document.getElementById('tableIncludeList').value = config.tableIncludeList || '';
        document.getElementById('additionalPropertiesJson').value = config.additionalPropertiesJson || '';

        document.getElementById('modalTitle').innerText = `✏️ Konfigürasyonu Düzenle (ID #${config.id})`;
        document.getElementById('configModal').classList.add('active');

    } catch (err) {
        alert('Konfigürasyon detayları çekilemedi.');
    }
}

function closeConfigModal() {
    document.getElementById('configModal').classList.remove('active');
}

async function handleConfigFormSubmit(event) {
    event.preventDefault();

    const configId = document.getElementById('configId').value;
    const isEdit = !!configId;

    const payload = {
        connectionName: document.getElementById('connectionName').value,
        dbType: document.getElementById('dbType').value,
        dbHost: document.getElementById('dbHost').value,
        dbPort: parseInt(document.getElementById('dbPort').value),
        dbName: document.getElementById('dbName').value,
        dbUser: document.getElementById('dbUser').value,
        dbPassword: document.getElementById('dbPassword').value,
        tableIncludeList: document.getElementById('tableIncludeList').value,
        additionalPropertiesJson: document.getElementById('additionalPropertiesJson').value,
        active: true
    };

    const url = isEdit ? `/api/cdc/configs/${configId}` : '/api/cdc/configs';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetchWithAuth(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeConfigModal();
            loadConfigsTable();
            loadListenerStatuses();
        } else {
            alert('Hata: Konfigürasyon kaydedilemedi.');
        }
    } catch (err) {
        alert('Bağlantı hatası oluştu.');
    }
}

async function deleteConfigAction(id) {
    if (!confirm(`Config ID #${id} konfigürasyonunu silmek istediğinizden emin misiniz?`)) {
        return;
    }

    try {
        const res = await fetchWithAuth(`/api/cdc/configs/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            loadConfigsTable();
            loadListenerStatuses();
        } else {
            alert('Hata: Konfigürasyon silinemedi.');
        }
    } catch (err) {
        alert('Bağlantı hatası oluştu.');
    }
}

async function toggleConfigActiveAction(id, active) {
    try {
        const res = await fetchWithAuth(`/api/cdc/configs/${id}/status?active=${active}`, {
            method: 'PATCH'
        });
        if (res.ok) {
            loadConfigsTable();
            loadListenerStatuses();
        } else {
            alert('Hata: Durum değiştirilemedi.');
        }
    } catch (err) {
        alert('Bağlantı hatası oluştu.');
    }
}

/* ==========================================================================
   3. CAPTURED CDC EVENTS HISTORY FUNCTIONS
   ========================================================================== */

async function loadCapturedEvents() {
    const tbody = document.getElementById('eventsTableBody');
    const filterType = document.getElementById('eventFilterType') ? document.getElementById('eventFilterType').value : 'ALL';

    try {
        const res = await fetchWithAuth('/api/cdc/events');
        if (!res.ok) throw new Error('Olaylar çekilemedi');

        let events = await res.json();
        tbody.innerHTML = '';

        if (!events || events.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted);">
                        Henüz yakalanmış bir veri değişikliği bulunmuyor.
                    </td>
                </tr>`;
            return;
        }

        if (filterType !== 'ALL') {
            events = events.filter(e => e.eventType === filterType);
        }

        if (events.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--text-muted);">
                        Filtreye uyan veri değişikliği bulunamadı (${filterType}).
                    </td>
                </tr>`;
            return;
        }

        events.forEach(event => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-insert';
            if (event.eventType === 'UPDATE') badgeClass = 'badge-update';
            if (event.eventType === 'DELETE') badgeClass = 'badge-delete';

            const formattedDate = event.createdDate ? new Date(event.createdDate).toLocaleString('tr-TR') : '-';

            tr.innerHTML = `
                <td>#${event.id}</td>
                <td><span style="color: var(--accent-secondary); font-weight: 600;">ID ${event.cdcConfigId || '-'}</span></td>
                <td>${event.dbType || '-'}</td>
                <td><strong>${event.tableName || 'all'}</strong></td>
                <td><span class="badge ${badgeClass}">${event.eventType || 'UNKNOWN'}</span></td>
                <td><div class="code-box">${escapeHtml(event.oldDataJson || '-')}</div></td>
                <td><div class="code-box">${escapeHtml(event.newDataJson || '-')}</div></td>
                <td style="color: var(--text-muted); font-size: 0.8rem;">${formattedDate}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--status-danger);">
                    Olaylar yüklenirken hata oluştu.
                </td>
            </tr>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}
