/**
 * JobBoost AI - Content Script (Manifest V3)
 * Arquitectura 100% aislada mediante Closed Shadow DOM para LinkedIn Jobs.
 * Interfaz nativa y minimalista libre de emojis, con iconos SVG monocromáticos.
 */

(() => {
  if (window.__jobboost_injected) return;
  window.__jobboost_injected = true;

  // Iconos SVG minimalistas (14x14)
  const ICONS = {
    copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    bookmark: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
    refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    spark: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
  };

  // 1. Inicialización del Host y Closed Shadow Root
  const host = document.createElement('div');
  host.id = 'jobboost-isolated-host';
  host.style.cssText = 'all: initial; position: fixed; bottom: 0; right: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
  (document.documentElement || document.body).appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'closed' });

  // 2. Estilos encapsulados dentro del Shadow DOM
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    :host {
      all: initial;
    }

    /* Botón flotante sobrio */
    .jb-floating-trigger {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 10px 17px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
    }

    .jb-floating-trigger.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .jb-floating-trigger:hover {
      background: #1e293b;
      border-color: #475569;
      transform: translateY(-2px);
      box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.6);
    }

    .jb-trigger-icon {
      color: #3b82f6;
      display: flex;
      align-items: center;
    }

    /* Overlay del Panel */
    .jb-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .jb-overlay.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    /* Modal / Panel lateral */
    .jb-panel {
      width: 90%;
      max-width: 700px;
      max-height: 88vh;
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 12px;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      transform: scale(0.98);
      transition: transform 0.2s ease;
    }

    .jb-overlay.active .jb-panel {
      transform: scale(1);
    }

    /* Cabecera minimalista */
    .jb-header {
      padding: 14px 18px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .jb-header-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .jb-badge {
      display: inline-flex;
      align-items: center;
      font-size: 10.5px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .jb-title {
      font-size: 15px;
      font-weight: 600;
      color: #f8fafc;
      margin-top: 2px;
    }

    .jb-sub {
      font-size: 12px;
      color: #94a3b8;
    }

    .jb-close-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .jb-close-btn:hover {
      background: #1e293b;
      color: #f8fafc;
      border-color: #334155;
    }

    /* Barra de Selector de Tono minimalista */
    .jb-tone-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 18px;
      background: #090d16;
      border-bottom: 1px solid #1e293b;
    }

    .jb-tone-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .jb-segmented-ctrl {
      display: flex;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }

    .jb-seg-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .jb-seg-btn:hover {
      color: #f8fafc;
    }

    .jb-seg-btn.active {
      background: #2563eb;
      color: #ffffff;
    }

    /* Navegación por pestañas */
    .jb-nav {
      display: flex;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 0 16px;
      gap: 6px;
    }

    .jb-tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 12.5px;
      font-weight: 600;
      padding: 11px 14px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
    }

    .jb-tab-btn:hover {
      color: #e2e8f0;
    }

    .jb-tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    /* Cuerpo del panel */
    .jb-body {
      padding: 18px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .jb-tab-content {
      display: none;
      flex-direction: column;
      gap: 14px;
    }

    .jb-tab-content.active {
      display: flex;
    }

    /* Tarjetas de contenido */
    .jb-card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #cbd5e1;
    }

    .jb-letter-text {
      white-space: pre-wrap;
      color: #f1f5f9;
      font-size: 13.5px;
      line-height: 1.65;
    }

    .jb-meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #1e293b;
    }

    /* Botones de acción minimalistas */
    .jb-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 2px;
    }

    .jb-actions-right {
      display: flex;
      gap: 8px;
    }

    .jb-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s;
    }

    .jb-btn svg {
      display: block;
    }

    .jb-btn-primary {
      background: #2563eb;
      color: #ffffff;
    }

    .jb-btn-primary:hover {
      background: #1d4ed8;
    }

    .jb-btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }

    .jb-btn-secondary:hover {
      background: #334155;
      color: #f8fafc;
    }

    /* ATS & Health Overview */
    .jb-ats-overview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
    }

    .jb-score-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .jb-ats-score-box {
      display: flex;
      align-items: baseline;
      gap: 3px;
    }

    .jb-ats-score-val {
      font-size: 28px;
      font-weight: 700;
      color: #10b981;
    }

    .jb-ats-score-denom {
      font-size: 13px;
      color: #64748b;
    }

    /* Píldora de salud de la vacante */
    .jb-health-pill {
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .health-green {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .health-yellow {
      background: rgba(245, 158, 11, 0.12);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .health-red {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .jb-tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .jb-pill {
      font-size: 11.5px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .jb-pill-match {
      background: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .jb-pill-miss {
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .jb-bullet-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .jb-bullet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
    }

    .jb-bullet-code {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px;
      font-size: 12.5px;
      color: #f1f5f9;
      line-height: 1.5;
    }

    /* Red flags item sin emojis */
    .jb-flag-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 9px 12px;
      font-size: 12px;
      color: #cbd5e1;
      line-height: 1.45;
    }

    .jb-flag-tag {
      font-size: 9.5px;
      font-weight: 700;
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }

    /* Interview STAR styles */
    .jb-star-item {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .jb-star-q {
      font-size: 13px;
      font-weight: 600;
      color: #f8fafc;
    }

    .jb-star-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.5;
    }

    .jb-star-row strong {
      color: #3b82f6;
      font-weight: 600;
    }

    /* Paywall / Not configured alert */
    .jb-alert-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 18px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }

    .jb-alert-card h4 {
      font-size: 14px;
      color: #f8fafc;
    }

    .jb-alert-card p {
      font-size: 12.5px;
      color: #94a3b8;
      max-width: 480px;
    }
  `;
  shadowRoot.appendChild(styleEl);

  // 3. Crear el botón flotante dentro del Shadow DOM
  let logoUrl = '';
  try {
    if (isExtensionValid()) {
      logoUrl = chrome.runtime.getURL('icons/icon-48.png');
    }
  } catch (e) {}

  const floatBtn = document.createElement('button');
  floatBtn.className = 'jb-floating-trigger';
  floatBtn.innerHTML = `
    ${logoUrl ? `<img src="${logoUrl}" width="18" height="18" style="border-radius: 4px; display: block; flex-shrink: 0;" alt="JobBoost">` : `<span class="jb-trigger-icon">${ICONS.spark}</span>`}
    <span>JobBoost AI</span>
  `;
  floatBtn.addEventListener('click', () => onTriggerAnalysis());
  shadowRoot.appendChild(floatBtn);

  // 4. Crear el Overlay y Panel dentro del Shadow DOM
  const overlay = document.createElement('div');
  overlay.className = 'jb-overlay';
  overlay.innerHTML = `
    <div class="jb-panel">
      <div class="jb-header">
        <div class="jb-header-info">
          <div style="display: flex; align-items: center; gap: 7px; margin-bottom: 2px;">
            ${logoUrl ? `<img src="${logoUrl}" width="18" height="18" style="border-radius: 4px; flex-shrink: 0;" alt="JobBoost">` : ''}
            <span class="jb-badge">JobBoost Copilot</span>
          </div>
          <h3 class="jb-title" id="jbJobTitle">Puesto de trabajo</h3>
          <span class="jb-sub" id="jbJobCompany">Empresa</span>
        </div>
        <button class="jb-close-btn" id="jbCloseBtn" title="Cerrar panel">✕</button>
      </div>

      <!-- Selector de Tono / Cultura (sin emojis) -->
      <div class="jb-tone-bar">
        <span class="jb-tone-label">Tono:</span>
        <div class="jb-segmented-ctrl" id="jbToneSelector">
          <button class="jb-seg-btn active" data-tone="startup" title="Ágil, directo, orientado a impacto">Startup</button>
          <button class="jb-seg-btn" data-tone="corporate" title="Formal, estructurado, gobierno y métricas">Corporativo</button>
          <button class="jb-seg-btn" data-tone="concise" title="2 párrafos breves + 3 bullets cuantitativos">Conciso</button>
        </div>
      </div>

      <nav class="jb-nav">
        <button class="jb-tab-btn active" data-tab="letter">Carta de Presentación</button>
        <button class="jb-tab-btn" data-tab="ats">Compatibilidad & Riesgos</button>
        <button class="jb-tab-btn" data-tab="interview">Preguntas de Entrevista</button>
      </nav>

      <div class="jb-body">
        <!-- Tab 1: Carta -->
        <div class="jb-tab-content active" id="tab-letter">
          <div class="jb-card">
            <div id="jbLetterBody" class="jb-letter-text">Cargando...</div>
            <div class="jb-meta-bar">
              <span id="jbWordCount">0 palabras</span>
              <span id="jbToneDisplay">Tono: Startup</span>
            </div>
          </div>

          <!-- Tarjeta de InMail / Reclutador (sin emojis) -->
          <div class="jb-card" id="jbRecruiterCard" style="display: none; padding: 12px 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 600; font-size: 11.5px; color: #f8fafc;" id="jbRecruiterTitle">
                Nota InMail para Reclutador
              </span>
              <button class="jb-btn jb-btn-secondary" id="jbCopyRecruiterBtn" style="padding: 4px 9px; font-size: 11px;">
                ${ICONS.copy}
                <span>Copiar Nota</span>
              </button>
            </div>
            <div id="jbRecruiterNote" style="font-size: 12.5px; color: #cbd5e1; line-height: 1.45; background: #090d16; padding: 10px; border-radius: 6px; border: 1px solid #1e293b;"></div>
          </div>

          <div class="jb-actions">
            <button class="jb-btn jb-btn-secondary" id="jbSaveTrackerBtn">
              ${ICONS.bookmark}
              <span>Guardar en Tracker</span>
            </button>
            <div class="jb-actions-right">
              <button class="jb-btn jb-btn-secondary" id="jbRegenerateBtn">
                ${ICONS.refresh}
                <span>Regenerar</span>
              </button>
              <button class="jb-btn jb-btn-primary" id="jbCopyLetterBtn">
                ${ICONS.copy}
                <span>Copiar Carta</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 2: ATS & Riesgos -->
        <div class="jb-tab-content" id="tab-ats">
          <div id="jbAtsContainer"></div>
        </div>

        <!-- Tab 3: Entrevista -->
        <div class="jb-tab-content" id="tab-interview">
          <div id="jbInterviewContainer" style="display: flex; flex-direction: column; gap: 12px;"></div>
        </div>
      </div>
    </div>
  `;
  shadowRoot.appendChild(overlay);

  let currentActiveJob = null;
  let currentActiveInsights = null;
  let activeTone = 'startup';

  const closeBtn = overlay.querySelector('#jbCloseBtn');
  closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });

  // Selector de tono
  const toneBtns = overlay.querySelectorAll('.jb-seg-btn');
  toneBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      toneBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTone = btn.getAttribute('data-tone');
      await chrome.storage.local.set({ toneStyle: activeTone });
      onTriggerAnalysis(activeTone);
    });
  });

  // Botón regenerar
  const regenBtn = overlay.querySelector('#jbRegenerateBtn');
  regenBtn.addEventListener('click', () => {
    onTriggerAnalysis(activeTone);
  });

  // Pestañas del modal
  const tabBtns = overlay.querySelectorAll('.jb-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      overlay.querySelectorAll('.jb-tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.getAttribute('data-tab')}`;
      const targetEl = overlay.querySelector(`#${targetId}`);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // Copiar carta (sin emojis en el feedback)
  const copyLetterBtn = overlay.querySelector('#jbCopyLetterBtn');
  copyLetterBtn.addEventListener('click', () => {
    const text = overlay.querySelector('#jbLetterBody').innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyLetterBtn.innerHTML = `${ICONS.check} <span>Copiado</span>`;
      setTimeout(() => {
        copyLetterBtn.innerHTML = `${ICONS.copy} <span>Copiar Carta</span>`;
      }, 2000);
    });
  });

  // Copiar nota InMail (sin emojis en el feedback)
  const copyRecruiterBtn = overlay.querySelector('#jbCopyRecruiterBtn');
  copyRecruiterBtn.addEventListener('click', () => {
    const text = overlay.querySelector('#jbRecruiterNote').innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyRecruiterBtn.innerHTML = `${ICONS.check} <span>Copiado</span>`;
      setTimeout(() => {
        copyRecruiterBtn.innerHTML = `${ICONS.copy} <span>Copiar Nota</span>`;
      }, 2000);
    });
  });

  // Guardar en Tracker (sin emojis en el feedback)
  const saveTrackerBtn = overlay.querySelector('#jbSaveTrackerBtn');
  saveTrackerBtn.addEventListener('click', async () => {
    if (!currentActiveJob) return;

    try {
      const { applications = [] } = await chrome.storage.local.get('applications');

      const existingIdx = applications.findIndex(
        app => app.title === currentActiveJob.title && app.company === currentActiveJob.company
      );

      const entry = {
        id: 'app_' + Date.now(),
        title: currentActiveJob.title,
        company: currentActiveJob.company,
        date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        atsScore: currentActiveInsights?.ats_analysis?.match_percentage || 78,
        healthScore: currentActiveInsights?.job_health_score || 'Equilibrado',
        status: 'Guardada',
        url: window.location.href
      };

      if (existingIdx >= 0) {
        applications[existingIdx] = { ...applications[existingIdx], ...entry };
      } else {
        applications.unshift(entry);
      }

      await chrome.storage.local.set({ applications });
      saveTrackerBtn.innerHTML = `${ICONS.check} <span>Guardado</span>`;
      setTimeout(() => {
        saveTrackerBtn.innerHTML = `${ICONS.bookmark} <span>Guardar en Tracker</span>`;
      }, 2200);
    } catch (err) {
      console.warn('[JobBoost AI] Error al guardar en tracker:', err);
    }
  });

  // 5. Extracción Limpia y Completa de la Oferta
  function extractActiveJob() {
    const isJobUrl = window.location.pathname.includes('/jobs') || window.location.href.includes('/jobs');
    if (!isJobUrl) return null;

    // Título de la vacante
    const titleSelectors = [
      'h1.top-card-layout__title',
      'h1.topcard__title',
      '.top-card-layout__entity-info h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      '.jobs-details__main-content h1',
      'h1[class*="job-title"]',
      'h1.t-24',
      'h1'
    ];
    let title = '';
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        title = el.innerText.trim();
        break;
      }
    }

    // Nombre de la empresa
    const companySelectors = [
      'a.topcard__org-name-link',
      '.topcard__flavor--black-link',
      'a[data-tracking-control-name*="org-name"]',
      '.top-card-layout__first-subline a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description a',
      'a[href*="/company/"]',
      '.topcard__flavor'
    ];
    let company = '';
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        company = el.innerText.trim();
        break;
      }
    }
    if (!company) company = 'Empresa';

    // Detección de reclutador
    const recruiterSelectors = [
      '.hirer-card__hirer-information .jobs-poster__name',
      '.jobs-poster__name',
      '.hirer-card .jobs-poster__name',
      '.message-the-recruiter a',
      '.hirer-card a[href*="/in/"]',
      'a[data-tracking-control-name*="recruiter"]'
    ];
    let recruiterName = '';
    for (const sel of recruiterSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim()) {
        recruiterName = el.innerText.trim().split('\n')[0].trim();
        break;
      }
    }

    // Expandir si está contraída ("Ver más / Show more")
    try {
      const moreButtons = document.querySelectorAll(
        '.show-more-less-html__button--more, button.show-more-less-html__button--more, .jobs-description__footer-button, button[aria-label*="Show more"], button[aria-label*="Ver más"], button[data-tracking-control-name*="show_more"]'
      );
      moreButtons.forEach(btn => {
        if (btn && typeof btn.click === 'function') {
          btn.click();
        }
      });
    } catch (e) {}

    // Buscar en todos los selectores y seleccionar el contenedor más completo
    const descSelectors = [
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.show-more-less-html__markup',
      '.description__text',
      'section.show-more-less-html',
      '.decorated-job-posting__details',
      '.jobs-box__html-content',
      'article',
      'main'
    ];

    let description = '';
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > description.length) {
          description = text;
        }
      }
    }

    if (!description && document.body) {
      description = document.body.innerText.trim();
    }

    if (!title) {
      title = document.title ? document.title.split('|')[0].split('-')[0].trim() : 'Vacante en LinkedIn';
    }

    return { title, company, description, recruiterName };
  }

  function isExtensionValid() {
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  // 6. Detección reactiva de vista de vacante cargada
  function checkJobView() {
    if (!isExtensionValid()) {
      if (observer) observer.disconnect();
      if (pollTimer) clearInterval(pollTimer);
      return;
    }
    const isJobPage = window.location.pathname.includes('/jobs') || window.location.href.includes('/jobs');
    if (isJobPage) {
      floatBtn.classList.add('visible');
    } else {
      floatBtn.classList.remove('visible');
    }
  }

  let observer = null;
  try {
    observer = new MutationObserver(() => {
      checkJobView();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  checkJobView();
  const pollTimer = setInterval(checkJobView, 2500);

  // 7. Flujo principal de análisis
  async function onTriggerAnalysis(forcedTone) {
    if (!isExtensionValid()) {
      alert('JobBoost AI se ha actualizado. Por favor recarga esta pestaña de LinkedIn (F5).');
      return;
    }

    const job = extractActiveJob();
    if (!job) return;
    currentActiveJob = job;

    overlay.querySelector('#jbJobTitle').textContent = job.title;
    overlay.querySelector('#jbJobCompany').textContent = job.company;
    overlay.classList.add('active');

    const letterBody = overlay.querySelector('#jbLetterBody');
    const wordCount = overlay.querySelector('#jbWordCount');
    const toneDisplay = overlay.querySelector('#jbToneDisplay');
    const atsContainer = overlay.querySelector('#jbAtsContainer');
    const interviewContainer = overlay.querySelector('#jbInterviewContainer');
    const recruiterCard = overlay.querySelector('#jbRecruiterCard');
    const recruiterNoteEl = overlay.querySelector('#jbRecruiterNote');
    const recruiterTitleEl = overlay.querySelector('#jbRecruiterTitle');

    let data = {};
    try {
      data = await chrome.storage.local.get([
        'userName',
        'userRole',
        'userSkills',
        'userSummary',
        'apiKey',
        'outputLanguage',
        'toneStyle',
        'creditsRemaining',
        'isPro'
      ]);
    } catch (storageErr) {
      console.warn('[JobBoost AI] Error al leer almacenamiento:', storageErr);
      alert('La extensión se actualizó recientemente. Por favor recarga esta pestaña con F5.');
      return;
    }

    const isPro = !!data.isPro;
    let credits = data.creditsRemaining !== undefined ? data.creditsRemaining : 5;

    activeTone = forcedTone || data.toneStyle || 'startup';
    toneBtns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tone') === activeTone);
    });

    const toneNames = {
      startup: 'Startup',
      corporate: 'Corporativo',
      concise: 'Conciso'
    };
    toneDisplay.textContent = `Tono: ${toneNames[activeTone] || activeTone}`;

    if (!data.userName && !data.userSummary) {
      letterBody.innerHTML = `
        <div class="jb-alert-card">
          <h4>Configura tu perfil profesional</h4>
          <p>Para personalizar tu postulación con tu trayectoria real, abre el icono de <strong>JobBoost AI</strong> en las extensiones de tu navegador y guarda tu perfil.</p>
        </div>
      `;
      wordCount.textContent = '0 palabras';
      atsContainer.innerHTML = '';
      interviewContainer.innerHTML = '';
      recruiterCard.style.display = 'none';
      return;
    }

    if (!isPro && credits <= 0) {
      letterBody.innerHTML = `
        <div class="jb-alert-card">
          <h4>Límite gratuito completado</h4>
          <p>Has alcanzado el límite de 5 postulaciones del plan de prueba. Abre el popup de JobBoost AI para activar tu clave de licencia Pro.</p>
        </div>
      `;
      wordCount.textContent = '0 palabras';
      atsContainer.innerHTML = '';
      interviewContainer.innerHTML = '';
      recruiterCard.style.display = 'none';
      return;
    }

    if (!isPro) {
      credits = Math.max(0, credits - 1);
      await chrome.storage.local.set({ creditsRemaining: credits });
    }

    letterBody.textContent = `Analizando vacante en tono "${toneNames[activeTone]}" y generando postulación...`;
    atsContainer.innerHTML = '<p style="color:#94a3b8; font-size:13px;">Analizando palabras clave ATS y evaluando posibles riesgos...</p>';
    interviewContainer.innerHTML = '<p style="color:#94a3b8; font-size:13px;">Preparando preguntas con metodología STAR...</p>';
    recruiterCard.style.display = 'none';

    try {
      const insights = await window.JobBoostAIService.generateJobInsights({
        jobData: job,
        userProfile: data,
        apiKey: data.apiKey,
        toneStyle: activeTone,
        language: 'auto'
      });

      currentActiveInsights = insights;

      // Renderizar Carta de Presentación
      letterBody.textContent = insights.cover_letter;
      const count = insights.cover_letter.trim().split(/\s+/).length;
      wordCount.textContent = `${count} palabras`;

      // Renderizar Nota InMail para Reclutador (sin emojis)
      if (insights.recruiter_note) {
        recruiterCard.style.display = 'block';
        recruiterNoteEl.textContent = insights.recruiter_note;
        const charCount = insights.recruiter_note.length;
        recruiterTitleEl.textContent = `Nota InMail para ${job.recruiterName || 'el Reclutador'} (${charCount} / 280 caracteres)`;
      } else {
        recruiterCard.style.display = 'none';
      }

      // Renderizar ATS y Red Flags
      renderATSAndFlags(atsContainer, insights);

      // Renderizar Preguntas de Entrevista
      renderInterview(interviewContainer, insights.interview_prep);

    } catch (err) {
      console.error('[JobBoost AI] Error en análisis:', err);
      letterBody.textContent = 'Ocurrió un error al procesar la vacante. Por favor intenta nuevamente.';
    }
  }

  function renderATSAndFlags(container, insights) {
    const ats = insights.ats_analysis || {};
    const health = insights.job_health_score || 'Equilibrado';
    const flags = insights.red_flags || [];

    let healthClass = 'health-green';
    if (health.includes('Amarillo') || health.includes('Caution') || health.includes('Precaución')) healthClass = 'health-yellow';
    if (health.includes('Rojo') || health.includes('Risk') || health.includes('Riesgo')) healthClass = 'health-red';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="jb-ats-overview">
          <div>
            <div style="font-size: 14px; font-weight: 600; color: #f8fafc;">Afinidad Estimada de ATS</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Coincidencia de requerimientos y palabras clave</div>
          </div>
          <div class="jb-score-group">
            <span class="jb-health-pill ${healthClass}">${health}</span>
            <div class="jb-ats-score-box">
              <span class="jb-ats-score-val">${ats.match_percentage || 78}</span>
              <span class="jb-ats-score-denom">/ 100</span>
            </div>
          </div>
        </div>

        <!-- Sección de Red Flags sin emojis -->
        <div class="jb-card">
          <div style="font-size: 12px; font-weight: 600; color: #f8fafc; margin-bottom: 8px;">
            Análisis de Riesgos y Señales de Alerta:
          </div>
          ${flags.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${flags.map(f => `
                <div class="jb-flag-item">
                  <span class="jb-flag-tag">Aviso</span>
                  <span>${f}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size: 12px; color: #34d399; display: flex; align-items: center; gap: 8px;">
              <span style="font-size:9.5px; font-weight:700; color:#34d399; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); padding:1px 5px; border-radius:3px; text-transform:uppercase;">Correcto</span>
              <span>Sin advertencias relevantes de sobrecarga o ambigüedad detectadas en la oferta.</span>
            </div>
          `}
        </div>

        <!-- Palabras Clave ATS -->
        <div class="jb-card">
          <div style="font-size: 12px; font-weight: 600; color: #34d399;">Términos clave presentes en tu perfil:</div>
          <div class="jb-tags-list">
            ${(ats.matched_keywords || []).map(k => `<span class="jb-pill jb-pill-match">${k}</span>`).join('')}
          </div>

          <div style="font-size: 12px; font-weight: 600; color: #fbbf24; margin-top: 14px;">Términos clave solicitados para incorporar a tu CV:</div>
          <div class="jb-tags-list">
            ${(ats.missing_keywords || []).map(k => `<span class="jb-pill jb-pill-miss">${k}</span>`).join('')}
          </div>
        </div>

        ${ats.recommended_bullet ? `
          <div class="jb-bullet-box">
            <div class="jb-bullet-header">
              <span>Viñeta recomendada para tu CV:</span>
              <button class="jb-btn jb-btn-secondary" id="jbCopyBulletBtn" style="padding: 4px 10px; font-size: 11px;">
                ${ICONS.copy}
                <span>Copiar</span>
              </button>
            </div>
            <div class="jb-bullet-code" id="jbBulletText">${ats.recommended_bullet}</div>
          </div>
        ` : ''}
      </div>
    `;

    const copyBulletBtn = container.querySelector('#jbCopyBulletBtn');
    if (copyBulletBtn) {
      copyBulletBtn.addEventListener('click', () => {
        const bulletText = container.querySelector('#jbBulletText').innerText;
        navigator.clipboard.writeText(bulletText).then(() => {
          copyBulletBtn.innerHTML = `${ICONS.check} <span>Copiado</span>`;
          setTimeout(() => {
            copyBulletBtn.innerHTML = `${ICONS.copy} <span>Copiar</span>`;
          }, 2000);
        });
      });
    }
  }

  function renderInterview(container, prepList) {
    if (!prepList || !prepList.length) return;
    container.innerHTML = prepList.map((item, idx) => `
      <div class="jb-star-item">
        <div class="jb-star-q">${idx + 1}. ${item.question}</div>
        <div class="jb-star-grid">
          <div class="jb-star-row"><strong>S (Situación):</strong> ${item.star_response.situation}</div>
          <div class="jb-star-row"><strong>T (Tarea):</strong> ${item.star_response.task}</div>
          <div class="jb-star-row"><strong>A (Acción):</strong> ${item.star_response.action}</div>
          <div class="jb-star-row"><strong>R (Resultado):</strong> ${item.star_response.result}</div>
        </div>
      </div>
    `).join('');
  }

})();
