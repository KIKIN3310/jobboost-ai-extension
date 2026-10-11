document.addEventListener('DOMContentLoaded', async () => {
  // Tabs
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const statusPill = document.getElementById('statusPill');

  // Profile
  const userNameInput = document.getElementById('userName');
  const userRoleInput = document.getElementById('userRole');
  const userSkillsInput = document.getElementById('userSkills');
  const userSummaryInput = document.getElementById('userSummary');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const profileFeedback = document.getElementById('profileFeedback');

  // Tracker
  const statusFilter = document.getElementById('statusFilter');
  const trackerCount = document.getElementById('trackerCount');
  const trackerList = document.getElementById('trackerList');

  // Settings
  const apiKeyInput = document.getElementById('apiKey');
  const outputLanguageSelect = document.getElementById('outputLanguage');
  const toneStyleSelect = document.getElementById('toneStyle');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingsFeedback = document.getElementById('settingsFeedback');

  // License & Metrics
  const quotaDisplay = document.getElementById('quotaDisplay');
  const quotaProgress = document.getElementById('quotaProgress');
  const licenseKeyInput = document.getElementById('licenseKey');
  const activateLicenseBtn = document.getElementById('activateLicenseBtn');
  const licenseFeedback = document.getElementById('licenseFeedback');

  let storedApplications = [];

  // 1. Gestión de Pestañas
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');

      // Si entra a la pestaña de Tracker, refrescar lista
      if (targetId === 'tabTracker') {
        renderTrackerList();
      }
    });
  });

  // 2. Carga reactiva de chrome.storage.local
  const data = await chrome.storage.local.get([
    'userName',
    'userRole',
    'userSkills',
    'userSummary',
    'apiKey',
    'outputLanguage',
    'toneStyle',
    'creditsRemaining',
    'isPro',
    'applications'
  ]);

  if (data.userName) userNameInput.value = data.userName;
  if (data.userRole) userRoleInput.value = data.userRole;
  if (data.userSkills) userSkillsInput.value = data.userSkills;
  if (data.userSummary) userSummaryInput.value = data.userSummary;

  if (data.apiKey) apiKeyInput.value = data.apiKey;
  if (data.outputLanguage) outputLanguageSelect.value = data.outputLanguage;
  if (data.toneStyle) toneStyleSelect.value = data.toneStyle;

  storedApplications = Array.isArray(data.applications) ? data.applications : [];

  const isPro = !!data.isPro;
  const creditsRemaining = data.creditsRemaining !== undefined ? data.creditsRemaining : 5;
  updateQuotaUI(isPro, creditsRemaining);

  renderTrackerList();

  // 3. Guardar Perfil
  saveProfileBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({
      userName: userNameInput.value.trim(),
      userRole: userRoleInput.value.trim(),
      userSkills: userSkillsInput.value.trim(),
      userSummary: userSummaryInput.value.trim()
    });

    displayFeedback(profileFeedback, 'Perfil actualizado correctamente.', 'success');
  });

  // 4. Guardar Ajustes
  saveSettingsBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({
      apiKey: apiKeyInput.value.trim(),
      outputLanguage: outputLanguageSelect.value,
      toneStyle: toneStyleSelect.value
    });

    displayFeedback(settingsFeedback, 'Ajustes guardados correctamente.', 'success');
  });

  // 5. Activar Licencia Pro
  activateLicenseBtn.addEventListener('click', async () => {
    const key = licenseKeyInput.value.trim().toUpperCase();
    if (!key) {
      displayFeedback(licenseFeedback, 'Ingresa una clave de licencia válida.', 'error');
      return;
    }

    if (key === 'PRO-VIP-2026' || key.startsWith('JB-PRO-')) {
      await chrome.storage.local.set({ isPro: true });
      updateQuotaUI(true, 999);
      displayFeedback(licenseFeedback, 'Licencia Pro verificada y activada.', 'success');
      licenseKeyInput.value = '';
    } else {
      displayFeedback(licenseFeedback, 'Clave inválida. Utiliza PRO-VIP-2026 para testing.', 'error');
    }
  });

  // 6. Tracker: Filtros y Eventos
  statusFilter.addEventListener('change', () => {
    renderTrackerList();
  });

  function renderTrackerList() {
    const filter = statusFilter.value;
    const filtered = filter === 'ALL'
      ? storedApplications
      : storedApplications.filter(a => a.status === filter);

    trackerCount.textContent = `${storedApplications.length} guardada${storedApplications.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      trackerList.innerHTML = `
        <div class="empty-tracker">
          ${filter === 'ALL'
            ? 'No tienes postulaciones guardadas aún.<br>Abre cualquier empleo en LinkedIn y pulsa <strong>"Guardar en Tracker"</strong>.'
            : `No hay postulaciones con el estado <strong>"${filter}"</strong>.`}
        </div>
      `;
      return;
    }

    trackerList.innerHTML = filtered.map(item => {
      const health = item.healthScore || 'Verde / Equilibrado';
      let healthClass = 'green';
      if (health.includes('Amarillo') || health.includes('Precaución')) healthClass = 'yellow';
      if (health.includes('Rojo') || health.includes('Riesgo')) healthClass = 'red';

      return `
        <div class="tracker-item" data-id="${item.id}">
          <div class="tracker-item-head">
            <div>
              <a href="${item.url || '#'}" target="_blank" class="tracker-item-title">${escapeHtml(item.title)}</a>
              <div class="tracker-item-company">${escapeHtml(item.company)} · ${escapeHtml(item.date || '')}</div>
            </div>
            <button class="tracker-delete-btn" data-delete="${item.id}" title="Eliminar de la lista">✕</button>
          </div>

          <div class="tracker-item-foot">
            <div class="tracker-badges">
              <span class="badge-ats">${item.atsScore || 75}% ATS</span>
              <span class="badge-health ${healthClass}">${escapeHtml(health.split('/')[0].trim())}</span>
            </div>

            <select class="status-dropdown" data-status-id="${item.id}">
              <option value="Guardada" ${item.status === 'Guardada' ? 'selected' : ''}>Guardada</option>
              <option value="Postulado" ${item.status === 'Postulado' ? 'selected' : ''}>Postulado</option>
              <option value="Entrevista" ${item.status === 'Entrevista' ? 'selected' : ''}>Entrevista</option>
              <option value="Oferta" ${item.status === 'Oferta' ? 'selected' : ''}>Oferta</option>
              <option value="Rechazado" ${item.status === 'Rechazado' ? 'selected' : ''}>Rechazado</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    // Manejar cambios de estado
    trackerList.querySelectorAll('.status-dropdown').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-status-id');
        const newStatus = e.target.value;
        const targetApp = storedApplications.find(a => a.id === id);
        if (targetApp) {
          targetApp.status = newStatus;
          await chrome.storage.local.set({ applications: storedApplications });
          // Si el filtro actual ya no coincide, volver a renderizar
          if (statusFilter.value !== 'ALL' && statusFilter.value !== newStatus) {
            renderTrackerList();
          }
        }
      });
    });

    // Manejar eliminaciones
    trackerList.querySelectorAll('.tracker-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-delete');
        storedApplications = storedApplications.filter(a => a.id !== id);
        await chrome.storage.local.set({ applications: storedApplications });
        renderTrackerList();
      });
    });
  }

  function updateQuotaUI(isProActive, remaining) {
    if (isProActive) {
      statusPill.textContent = 'Licencia Pro';
      statusPill.classList.add('is-pro');
      quotaDisplay.textContent = 'Postulaciones ilimitadas';
      quotaProgress.style.width = '100%';
      quotaProgress.style.backgroundColor = '#f59e0b';
    } else {
      const consumed = Math.max(0, 5 - remaining);
      statusPill.textContent = `${remaining} / 5 libres`;
      statusPill.classList.remove('is-pro');
      quotaDisplay.textContent = `${consumed} / 5 consumidas`;
      const pct = (consumed / 5) * 100;
      quotaProgress.style.width = `${pct}%`;
      quotaProgress.style.backgroundColor = pct >= 80 ? '#ef4444' : '#2563eb';
    }
  }

  function displayFeedback(el, message, type) {
    el.textContent = message;
    el.className = `status-message ${type}`;
    setTimeout(() => {
      el.textContent = '';
      el.className = 'status-message';
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
