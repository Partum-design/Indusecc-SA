(function () {
  'use strict';

  var TUTORIAL_KEY = 'sg_audit_tutorial_seen_v1';
  var LAST_ISO_KEY = 'sg_audit_last_iso_v1';
  var EVIDENCE_BUCKET = 'audit-evidence';
  var SIGNATURE_BUCKET = 'audit-signatures';
  var EXPORTS_BUCKET = 'audit-exports';
  var ROUTES = getRoutes();

  var sb = null;
  var currentUser = null;
  var currentProfile = null;
  var currentAudit = null;
  var saveDebounceTimer = null;
  var syncedNoraCount = 0;
  var syncedSignatureSource = '';

  var ISO_LIBRARY = [];
  var dom = {};
  var toastTimer = null;
  var logoDataUrl = '';
  var signatureCtx = null;
  var isDrawing = false;
  var threeState = {
    scene: null,
    camera: null,
    renderer: null,
    group: null,
    ring: null,
    particles: null,
    cursorLight: null,
    canvas: null,
    pointerX: 0,
    pointerY: 0,
    ready: false,
    motionDisabled: false,
    rafId: 0
  };
  var FRAMEWORK_FILTERS = [
    { id: 'all', label: 'Todas', icon: 'fa-solid fa-table-cells' },
    { id: 'calidad', label: 'Calidad', icon: 'fa-solid fa-award' },
    { id: 'seguridad', label: 'Seguridad', icon: 'fa-solid fa-shield-halved' },
    { id: 'alimentos', label: 'Alimentos', icon: 'fa-solid fa-utensils' },
    { id: 'medioambiente', label: 'Medioambiente', icon: 'fa-solid fa-leaf' }
  ];
  var uiFilters = {
    query: '',
    sectionId: 'all',
    status: 'all',
    risk: 'all',
    frameworkQuery: '',
    frameworkCategory: 'all'
  };

  var state = createInitialState();

  document.addEventListener('DOMContentLoaded', init);

  function createInitialState() {
    return {
      selectedIsoId: null,
      project: {
        name: '',
        auditor: '',
        site: '',
        date: '',
        scope: '',
        docVersion: '',
        auditedRep: ''
      },
      history: getEmptyHistoryRows(),
      findings: {},
      noraHistory: [],
      signature: {
        drawnDataUrl: '',
        uploadedDataUrl: '',
        uploadedName: ''
      }
    };
  }

  async function init() {
    if (!window.supabase || !window.SUPABASE_CONFIG) {
      window.location.replace(ROUTES.login);
      return;
    }

    sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

    var sessionResult = await sb.auth.getSession();
    var session = sessionResult.data && sessionResult.data.session;
    if (!session) {
      window.location.replace(ROUTES.login);
      return;
    }
    currentUser = session.user;

    var profileResult = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
    if (profileResult.error || !profileResult.data || !profileResult.data.active) {
      await sb.auth.signOut();
      window.location.replace(ROUTES.login);
      return;
    }
    currentProfile = profileResult.data;

    touchPresence();
    window.setInterval(touchPresence, 60000);

    sb.auth.onAuthStateChange(function (event) {
      if (event === 'SIGNED_OUT') window.location.replace(ROUTES.login);
    });

    cacheDom();
    ISO_LIBRARY = normalizeLibrary(window.ISO_LIBRARY);

    if (!ISO_LIBRARY.length) {
      showToast('No se pudo cargar el catálogo ISO. Recarga la página.');
      return;
    }

    applyDefaultIso();
    bindEvents();
    setupSignatureCanvas();
    renderFrameworkTabs();
    syncFilterControls();
    renderIsoOptions();
    renderIsoQuickSelector();
    renderIsoDetailCard(findIsoById(state.selectedIsoId));

    await loadCurrentAudit();

    syncProjectForm();
    renderSignaturePreview();
    ensureNoraConversation();
    renderNoraPanel();
    cacheLogoDataUrl();
    startSplashSequence();
    applyRoleRestrictions();
    renderSessionInfo();
    maybeShowProfileSetup();
  }

  function maybeShowProfileSetup() {
    if (!currentProfile || currentProfile.onboarded_at || !dom.profileSetupModal) return;
    if (dom.setupFullName) dom.setupFullName.value = currentProfile.full_name || '';
    if (dom.setupPhone) dom.setupPhone.value = currentProfile.phone || '';
    if (dom.setupDepartment) dom.setupDepartment.value = currentProfile.department || '';
    dom.profileSetupModal.classList.remove('hidden');
    dom.profileSetupModal.setAttribute('aria-hidden', 'false');
  }

  function closeProfileSetup() {
    if (!dom.profileSetupModal) return;
    dom.profileSetupModal.classList.add('hidden');
    dom.profileSetupModal.setAttribute('aria-hidden', 'true');
  }

  async function onProfileSetupSubmit(event) {
    event.preventDefault();
    if (!sb || !currentUser) return;
    var patch = {
      full_name: String((dom.setupFullName && dom.setupFullName.value) || '').trim(),
      phone: String((dom.setupPhone && dom.setupPhone.value) || '').trim(),
      department: String((dom.setupDepartment && dom.setupDepartment.value) || '').trim(),
      onboarded_at: new Date().toISOString()
    };
    if (!patch.full_name) {
      if (dom.profileSetupFeedback) dom.profileSetupFeedback.textContent = 'Escribe tu nombre completo para continuar.';
      return;
    }
    var result = await sb.from('profiles').update(patch).eq('id', currentUser.id);
    if (result.error) {
      if (dom.profileSetupFeedback) dom.profileSetupFeedback.textContent = 'No se pudo guardar. Intenta otra vez.';
      return;
    }
    currentProfile = Object.assign({}, currentProfile, patch);
    closeProfileSetup();
    showToast('Datos guardados. ¡Bienvenido a INDUSECC!');
  }

  async function onProfileSetupSkip() {
    if (!sb || !currentUser) return;
    await sb.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', currentUser.id);
    currentProfile = Object.assign({}, currentProfile, { onboarded_at: new Date().toISOString() });
    closeProfileSetup();
  }

  function renderSessionInfo() {
    if (dom.sessionUser && currentProfile) {
      dom.sessionUser.textContent = currentProfile.email + ' · ' + roleLabel(currentProfile.role);
    }
    if (dom.openAdminPanel && currentProfile && currentProfile.role === 'admin') {
      dom.openAdminPanel.classList.remove('hidden');
    }
  }

  async function touchPresence() {
    if (!sb) return;
    await sb.rpc('touch_presence');
  }

  function roleLabel(role) {
    if (role === 'admin') return 'Administrador';
    if (role === 'auditor') return 'Auditor';
    return 'Solo lectura';
  }

  function applyRoleRestrictions() {
    if (!currentProfile || currentProfile.role !== 'viewer') return;

    var i;
    var readOnlySelectors = [
      '#project-name', '#auditor-name', '#audit-site', '#audit-date', '#audit-scope',
      '#doc-version', '#audited-rep', '[data-history-row]', '#clear-project', '#floating-clear',
      '#clear-signature', '#signature-file'
    ];
    for (i = 0; i < readOnlySelectors.length; i += 1) {
      var nodes = document.querySelectorAll(readOnlySelectors[i]);
      var n;
      for (n = 0; n < nodes.length; n += 1) {
        nodes[n].disabled = true;
        nodes[n].setAttribute('readonly', 'readonly');
      }
    }

    if (dom.signatureCanvas) {
      dom.signatureCanvas.style.pointerEvents = 'none';
    }

    showToast('Tu cuenta es de solo lectura: puedes ver la auditoría pero no editarla.');
  }

  async function logoutApp() {
    if (!sb) return;
    await sb.auth.signOut();
    window.location.replace(ROUTES.login);
  }

  function cacheDom() {
    dom.splash = document.getElementById('app-splash');
    dom.splashProgressFill = document.getElementById('splash-progress-fill');
    dom.onboarding = document.getElementById('iso-onboarding');
    dom.onboardingIsoDetail = document.getElementById('onboarding-iso-detail');
    dom.isoOptions = document.getElementById('iso-options');
    dom.frameworkSearch = document.getElementById('framework-search');
    dom.frameworkTabs = document.getElementById('framework-tabs');
    dom.startAudit = document.getElementById('start-audit');
    dom.app = document.getElementById('app');

    dom.activeIso = document.getElementById('active-iso');
    dom.changeIso = document.getElementById('change-iso');
    dom.openTutorialOnboarding = document.getElementById('open-tutorial-onboarding');
    dom.openTutorialApp = document.getElementById('open-tutorial-app');
    dom.closeTutorial = document.getElementById('close-tutorial');
    dom.tutorialModal = document.getElementById('tutorial-modal');

    dom.checklistRoot = document.getElementById('checklist-root');
    dom.isoUpdatedNote = document.getElementById('iso-updated-note');
    dom.metrics = document.getElementById('metrics');
    dom.clauseSearch = document.getElementById('clause-search');
    dom.statusFilter = document.getElementById('status-filter');
    dom.riskFilter = document.getElementById('risk-filter');
    dom.sectionTabs = document.getElementById('section-tabs');
    dom.isoQuickSelect = document.getElementById('iso-quick-select');
    dom.isoDetailCard = document.getElementById('iso-detail-card');

    dom.projectName = document.getElementById('project-name');
    dom.auditorName = document.getElementById('auditor-name');
    dom.auditSite = document.getElementById('audit-site');
    dom.auditDate = document.getElementById('audit-date');
    dom.auditScope = document.getElementById('audit-scope');
    dom.docVersion = document.getElementById('doc-version');
    dom.auditedRep = document.getElementById('audited-rep');
    dom.historyInputs = document.querySelectorAll('[data-history-row][data-history-field]');

    dom.globalProgressFill = document.getElementById('global-progress-fill');
    dom.globalProgressLabel = document.getElementById('global-progress-label');

    dom.signatureCanvas = document.getElementById('signature-canvas');
    dom.clearSignature = document.getElementById('clear-signature');
    dom.signatureFile = document.getElementById('signature-file');
    dom.signaturePreview = document.getElementById('signature-preview');

    dom.exportPdf = document.getElementById('export-pdf');
    dom.clearProject = document.getElementById('clear-project');
    dom.floatingExport = document.getElementById('floating-export');
    dom.floatingClear = document.getElementById('floating-clear');
    dom.floatingProgressBubble = document.getElementById('floating-progress-bubble');
    dom.floatingProgressValue = document.getElementById('floating-progress-value');
    dom.navGoFrameworks = document.getElementById('nav-go-frameworks');
    dom.navOpenReports = document.getElementById('nav-open-reports');
    dom.navOpenProfile = document.getElementById('nav-open-profile');
    dom.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    dom.mobileOpenTutorial = document.getElementById('mobile-open-tutorial');
    dom.mobileOpenProfile = document.getElementById('mobile-open-profile');
    dom.mobileOffcanvas = document.getElementById('mobile-offcanvas');
    dom.mobileOffcanvasOverlay = document.getElementById('mobile-offcanvas-overlay');
    dom.mobileMenuGoMetrics = document.getElementById('mobile-menu-go-metrics');
    dom.mobileMenuGoChecklist = document.getElementById('mobile-menu-go-checklist');
    dom.mobileMenuExport = document.getElementById('mobile-menu-export');
    dom.mobileMenuClear = document.getElementById('mobile-menu-clear');
    dom.mobileMenuTutorial = document.getElementById('mobile-menu-tutorial');
    dom.mobileMenuChangeIso = document.getElementById('mobile-menu-change-iso');
    dom.openNoraPanel = document.getElementById('open-nora-panel');
    dom.noraToggle = document.getElementById('nora-toggle');
    dom.noraPanel = document.getElementById('nora-panel');
    dom.closeNoraPanel = document.getElementById('close-nora-panel');
    dom.noraMode = document.getElementById('nora-mode');
    dom.noraMessages = document.getElementById('nora-messages');
    dom.noraForm = document.getElementById('nora-form');
    dom.noraInput = document.getElementById('nora-input');
    dom.noraSend = document.getElementById('nora-send');
    dom.toast = document.getElementById('toast');
    dom.headerLogo = document.querySelector('.project-panel .brand-logo') || document.querySelector('.hero-logo');
    dom.sessionUser = document.getElementById('session-user');
    dom.logoutApp = document.getElementById('logout-app');
    dom.openAdminPanel = document.getElementById('open-admin-panel');

    dom.profileSetupModal = document.getElementById('profile-setup-modal');
    dom.profileSetupForm = document.getElementById('profile-setup-form');
    dom.setupFullName = document.getElementById('setup-full-name');
    dom.setupPhone = document.getElementById('setup-phone');
    dom.setupDepartment = document.getElementById('setup-department');
    dom.profileSetupFeedback = document.getElementById('profile-setup-feedback');
    dom.profileSetupSkip = document.getElementById('profile-setup-skip');
  }

  function normalizeLibrary(list) {
    if (!list || Object.prototype.toString.call(list) !== '[object Array]') return [];

    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      var iso = list[i] || {};
      if (!iso.id || !iso.code) continue;
      iso.sections = normalizeSections(iso.sections);
      if (!iso.sections.length) continue;
      out.push(iso);
    }
    return out;
  }

  function normalizeSections(sections) {
    if (!sections || Object.prototype.toString.call(sections) !== '[object Array]') return [];

    var out = [];
    var i;
    for (i = 0; i < sections.length; i += 1) {
      var section = sections[i] || {};
      if (!section.id || !section.title) continue;
      section.clauses = normalizeClauses(section.clauses);
      if (!section.clauses.length) continue;
      out.push(section);
    }
    return out;
  }

  function normalizeClauses(clauses) {
    if (!clauses || Object.prototype.toString.call(clauses) !== '[object Array]') return [];

    var out = [];
    var i;
    for (i = 0; i < clauses.length; i += 1) {
      var clause = clauses[i] || {};
      if (!clause.id || !clause.title || !clause.question) continue;
      if (!clause.definition) clause.definition = 'Punto de control de la norma.';
      if (!clause.evidence || Object.prototype.toString.call(clause.evidence) !== '[object Array]') {
        clause.evidence = [];
      }
      out.push(clause);
    }
    return out;
  }

  function applyDefaultIso() {
    var lastId = readLocal(LAST_ISO_KEY);
    var preferred = findIsoById('iso27001');
    if (lastId && findIsoById(lastId)) {
      state.selectedIsoId = lastId;
    } else if (!state.selectedIsoId || !findIsoById(state.selectedIsoId)) {
      state.selectedIsoId = preferred ? preferred.id : ISO_LIBRARY[0].id;
    }
  }

  function bindEvents() {
    if (dom.startAudit) {
      dom.startAudit.addEventListener('click', function () {
        applyDefaultIso();
        openAuditWorkspace();
      });
    }

    if (dom.changeIso) {
      dom.changeIso.addEventListener('click', showOnboarding);
    }

    if (dom.navGoFrameworks) {
      dom.navGoFrameworks.addEventListener('click', showOnboarding);
    }

    if (dom.mobileMenuToggle) {
      dom.mobileMenuToggle.addEventListener('click', function () {
        openMobileOffcanvas();
      });
    }

    if (dom.mobileOffcanvasOverlay) {
      dom.mobileOffcanvasOverlay.addEventListener('click', closeMobileOffcanvas);
    }

    if (dom.mobileOpenTutorial) {
      dom.mobileOpenTutorial.addEventListener('click', openTutorial);
    }

    if (dom.mobileOpenProfile) {
      dom.mobileOpenProfile.addEventListener('click', openTutorial);
    }

    if (dom.navOpenReports) {
      dom.navOpenReports.addEventListener('click', function () {
        exportReportPdf();
      });
    }

    if (dom.mobileMenuExport) {
      dom.mobileMenuExport.addEventListener('click', function () {
        closeMobileOffcanvas();
        exportReportPdf();
      });
    }

    if (dom.navOpenProfile) {
      dom.navOpenProfile.addEventListener('click', openTutorial);
    }

    if (dom.mobileMenuTutorial) {
      dom.mobileMenuTutorial.addEventListener('click', function () {
        closeMobileOffcanvas();
        openTutorial();
      });
    }

    if (dom.mobileMenuChangeIso) {
      dom.mobileMenuChangeIso.addEventListener('click', function () {
        closeMobileOffcanvas();
        showOnboarding();
      });
    }

    if (dom.openTutorialOnboarding) {
      dom.openTutorialOnboarding.addEventListener('click', openTutorial);
    }

    if (dom.openTutorialApp) {
      dom.openTutorialApp.addEventListener('click', openTutorial);
    }

    if (dom.openNoraPanel) {
      dom.openNoraPanel.addEventListener('click', openNoraPanel);
    }

    if (dom.noraToggle) {
      dom.noraToggle.addEventListener('click', toggleNoraPanel);
    }

    if (dom.closeNoraPanel) {
      dom.closeNoraPanel.addEventListener('click', closeNoraPanel);
    }

    if (dom.noraPanel) {
      dom.noraPanel.addEventListener('click', function (event) {
        var button = event.target.closest ? event.target.closest('button[data-nora-prompt]') : null;
        if (!button) return;
        sendNoraQuestion(String(button.getAttribute('data-nora-prompt') || ''), { mode: 'chat' });
      });
    }

    if (dom.noraForm) {
      dom.noraForm.addEventListener('submit', function (event) {
        if (event) event.preventDefault();
        if (!dom.noraInput) return;
        sendNoraQuestion(String(dom.noraInput.value || ''), { mode: 'chat' });
      });
    }

    if (dom.closeTutorial) {
      dom.closeTutorial.addEventListener('click', closeTutorial);
    }

    if (dom.tutorialModal) {
      dom.tutorialModal.addEventListener('click', function (event) {
        if (event.target === dom.tutorialModal) closeTutorial();
      });
    }

    bindProjectField(dom.projectName, 'name');
    bindProjectField(dom.auditorName, 'auditor');
    bindProjectField(dom.auditSite, 'site');
    bindProjectField(dom.auditDate, 'date');
    bindProjectField(dom.auditScope, 'scope');
    bindProjectField(dom.docVersion, 'docVersion');
    bindProjectField(dom.auditedRep, 'auditedRep');
    bindHistoryFields();

    if (dom.isoQuickSelect) {
      dom.isoQuickSelect.addEventListener('change', function () {
        setSelectedIso(String(dom.isoQuickSelect.value || ''));
      });
    }

    if (dom.frameworkSearch) {
      dom.frameworkSearch.addEventListener('input', function () {
        uiFilters.frameworkQuery = normalizeSearchText(dom.frameworkSearch.value || '');
        renderIsoOptions();
      });
    }

    if (dom.frameworkTabs) {
      dom.frameworkTabs.addEventListener('click', function (event) {
        var target = event.target;
        if (!target) return;
        var button = target.closest('button[data-framework]');
        if (!button) return;
        uiFilters.frameworkCategory = String(button.getAttribute('data-framework') || 'all');
        renderFrameworkTabs();
        renderIsoOptions();
      });
    }

    if (dom.clauseSearch) {
      dom.clauseSearch.addEventListener('input', function () {
        uiFilters.query = normalizeSearchText(dom.clauseSearch.value || '');
        var activeIso = findIsoById(state.selectedIsoId);
        if (activeIso) renderChecklist(activeIso);
      });
    }

    if (dom.statusFilter) {
      dom.statusFilter.addEventListener('change', function () {
        uiFilters.status = String(dom.statusFilter.value || 'all');
        var activeIso = findIsoById(state.selectedIsoId);
        if (activeIso) renderChecklist(activeIso);
      });
    }

    if (dom.riskFilter) {
      dom.riskFilter.addEventListener('change', function () {
        uiFilters.risk = String(dom.riskFilter.value || 'all');
        var activeIso = findIsoById(state.selectedIsoId);
        if (activeIso) renderChecklist(activeIso);
      });
    }

    if (dom.checklistRoot) {
      dom.checklistRoot.addEventListener('input', onChecklistInput);
      dom.checklistRoot.addEventListener('change', onChecklistInput);
      dom.checklistRoot.addEventListener('click', onChecklistClick);
    }

    if (dom.exportPdf) {
      dom.exportPdf.addEventListener('click', exportReportPdf);
    }

    if (dom.clearProject) {
      dom.clearProject.addEventListener('click', function () {
        if (isReadOnlyUser()) return;
        if (!window.confirm('Se archivará esta auditoría y se abrirá una nueva en blanco. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.mobileMenuClear) {
      dom.mobileMenuClear.addEventListener('click', function () {
        closeMobileOffcanvas();
        if (isReadOnlyUser()) return;
        if (!window.confirm('Se archivará esta auditoría y se abrirá una nueva en blanco. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.mobileMenuGoMetrics) {
      dom.mobileMenuGoMetrics.addEventListener('click', function () {
        closeMobileOffcanvas();
        scrollToPanel('.project-panel');
      });
    }

    if (dom.mobileMenuGoChecklist) {
      dom.mobileMenuGoChecklist.addEventListener('click', function () {
        closeMobileOffcanvas();
        scrollToPanel('.checklist-panel');
      });
    }

    if (dom.floatingExport) {
      dom.floatingExport.addEventListener('click', function () {
        if (dom.exportPdf) {
          dom.exportPdf.click();
          return;
        }
        exportReportPdf();
      });
    }

    if (dom.floatingClear) {
      dom.floatingClear.addEventListener('click', function () {
        if (dom.clearProject) {
          dom.clearProject.click();
          return;
        }
        if (isReadOnlyUser()) return;
        if (!window.confirm('Se archivará esta auditoría y se abrirá una nueva en blanco. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.clearSignature) {
      dom.clearSignature.addEventListener('click', function () {
        if (isReadOnlyUser()) return;
        clearSignatureCanvas();
        state.signature.drawnDataUrl = '';
        saveState();
        renderSignaturePreview();
      });
    }

    if (dom.signatureFile) {
      dom.signatureFile.addEventListener('change', onSignatureFileChange);
    }

    if (dom.logoutApp) {
      dom.logoutApp.addEventListener('click', logoutApp);
    }

    if (dom.profileSetupForm) {
      dom.profileSetupForm.addEventListener('submit', onProfileSetupSubmit);
    }
    if (dom.profileSetupSkip) {
      dom.profileSetupSkip.addEventListener('click', onProfileSetupSkip);
    }
  }

  function isReadOnlyUser() {
    return Boolean(currentProfile && currentProfile.role === 'viewer');
  }

  function bindProjectField(input, key) {
    if (!input) return;
    input.addEventListener('input', function () {
      if (isReadOnlyUser()) return;
      state.project[key] = input.value;
      saveState();
    });
  }

  function bindHistoryFields() {
    if (!dom.historyInputs || !dom.historyInputs.length) return;

    var i;
    for (i = 0; i < dom.historyInputs.length; i += 1) {
      dom.historyInputs[i].addEventListener('input', function () {
        if (isReadOnlyUser()) return;
        var row = Number(this.getAttribute('data-history-row'));
        var field = this.getAttribute('data-history-field');
        if (row < 0 || row > 2 || !field) return;
        if (!state.history[row]) state.history[row] = { version: '', date: '', author: '', description: '' };
        state.history[row][field] = this.value;
        saveState();
      });
    }
  }

  function setupSignatureCanvas() {
    if (!dom.signatureCanvas) return;

    signatureCtx = dom.signatureCanvas.getContext('2d');
    if (!signatureCtx) return;

    signatureCtx.lineWidth = 2.4;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
    signatureCtx.strokeStyle = '#2a1a17';

    dom.signatureCanvas.addEventListener('pointerdown', onSignaturePointerDown);
    dom.signatureCanvas.addEventListener('pointermove', onSignaturePointerMove);
    dom.signatureCanvas.addEventListener('pointerup', onSignaturePointerUp);
    dom.signatureCanvas.addEventListener('pointerleave', onSignaturePointerUp);
    dom.signatureCanvas.addEventListener('pointercancel', onSignaturePointerUp);
  }

  function onSignaturePointerDown(event) {
    if (!signatureCtx || !dom.signatureCanvas || isReadOnlyUser()) return;
    event.preventDefault();
    isDrawing = true;
    var pos = getCanvasPointerPosition(event);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
    if (dom.signatureCanvas.setPointerCapture && event.pointerId != null) {
      dom.signatureCanvas.setPointerCapture(event.pointerId);
    }
  }

  function onSignaturePointerMove(event) {
    if (!signatureCtx || !isDrawing) return;
    event.preventDefault();
    var pos = getCanvasPointerPosition(event);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
  }

  function onSignaturePointerUp(event) {
    if (!signatureCtx || !isDrawing) return;
    event.preventDefault();
    isDrawing = false;
    signatureCtx.closePath();
    state.signature.drawnDataUrl = dom.signatureCanvas.toDataURL('image/png');
    saveState();
    renderSignaturePreview();
  }

  function getCanvasPointerPosition(event) {
    var rect = dom.signatureCanvas.getBoundingClientRect();
    var scaleX = dom.signatureCanvas.width / rect.width;
    var scaleY = dom.signatureCanvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function clearSignatureCanvas() {
    if (!signatureCtx || !dom.signatureCanvas) return;
    signatureCtx.clearRect(0, 0, dom.signatureCanvas.width, dom.signatureCanvas.height);
  }

  function onSignatureFileChange(event) {
    if (isReadOnlyUser()) return;
    var input = event.target;
    var file = input && input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      state.signature.uploadedDataUrl = String(loadEvent.target && loadEvent.target.result ? loadEvent.target.result : '');
      state.signature.uploadedName = file.name || 'firma';
      saveState();
      renderSignaturePreview();
      showToast('Firma cargada correctamente.');
    };
    reader.onerror = function () {
      showToast('No se pudo cargar el archivo de firma.');
    };
    reader.readAsDataURL(file);
  }

  function syncProjectForm() {
    if (dom.projectName) dom.projectName.value = state.project.name || '';
    if (dom.auditorName) dom.auditorName.value = state.project.auditor || '';
    if (dom.auditSite) dom.auditSite.value = state.project.site || '';
    if (dom.auditDate) dom.auditDate.value = state.project.date || '';
    if (dom.auditScope) dom.auditScope.value = state.project.scope || '';
    if (dom.docVersion) dom.docVersion.value = state.project.docVersion || '';
    if (dom.auditedRep) dom.auditedRep.value = state.project.auditedRep || '';

    if (dom.historyInputs && dom.historyInputs.length) {
      var i;
      for (i = 0; i < dom.historyInputs.length; i += 1) {
        var row = Number(dom.historyInputs[i].getAttribute('data-history-row'));
        var field = dom.historyInputs[i].getAttribute('data-history-field');
        var value = '';
        if (state.history[row] && field) value = state.history[row][field] || '';
        dom.historyInputs[i].value = value;
      }
    }

    if (state.signature.drawnDataUrl) {
      drawSignatureDataUrlOnCanvas(state.signature.drawnDataUrl);
    } else {
      clearSignatureCanvas();
    }
  }

  function syncFilterControls() {
    if (dom.statusFilter) dom.statusFilter.value = uiFilters.status || 'all';
    if (dom.riskFilter) dom.riskFilter.value = uiFilters.risk || 'all';
    if (dom.frameworkSearch) dom.frameworkSearch.value = uiFilters.frameworkQuery || '';
  }

  function renderFrameworkTabs() {
    if (!dom.frameworkTabs) return;

    var html = '';
    var i;
    for (i = 0; i < FRAMEWORK_FILTERS.length; i += 1) {
      var filter = FRAMEWORK_FILTERS[i];
      var activeClass = filter.id === uiFilters.frameworkCategory ? ' active' : '';
      html += ''
        + '<button type="button" class="framework-tab' + activeClass + '" data-framework="' + esc(filter.id) + '">'
        + '  <i class="' + esc(filter.icon) + '"></i>'
        + '  ' + esc(filter.label)
        + '</button>';
    }
    dom.frameworkTabs.innerHTML = html;
  }

  function drawSignatureDataUrlOnCanvas(dataUrl) {
    if (!signatureCtx || !dom.signatureCanvas || !dataUrl) return;
    var image = new Image();
    image.onload = function () {
      clearSignatureCanvas();
      signatureCtx.drawImage(image, 0, 0, dom.signatureCanvas.width, dom.signatureCanvas.height);
    };
    image.src = dataUrl;
  }

  function renderIsoOptions() {
    if (!dom.isoOptions) return;

    var visibleIsos = getVisibleIsoCards();
    if (visibleIsos.length && !arrayIncludesIso(visibleIsos, state.selectedIsoId)) {
      state.selectedIsoId = visibleIsos[0].id;
      saveState();
    }

    if (dom.startAudit) dom.startAudit.disabled = visibleIsos.length === 0;

    var html = '';
    var i;

    for (i = 0; i < visibleIsos.length; i += 1) {
      var iso = visibleIsos[i];
      var activeClass = iso.id === state.selectedIsoId ? ' active' : '';
      var icon = iso.icon || 'fa-solid fa-clipboard-check';
      var pressed = iso.id === state.selectedIsoId ? 'true' : 'false';
      var selectedBadge = iso.id === state.selectedIsoId
        ? '<span class="iso-selected-badge"><i class="fa-solid fa-circle-check"></i> Seleccionada</span>'
        : '';

      html += ''
        + '<button type="button" class="iso-option' + activeClass + '" data-iso="' + esc(iso.id) + '" aria-pressed="' + pressed + '" style="--iso-order:' + i + '">'
        + '  <div class="iso-option-head">'
        + '    <h4><i class="' + esc(icon) + '"></i> ' + esc(iso.code) + ' <small>(' + esc(iso.version || '') + ')</small></h4>'
        +      selectedBadge
        + '  </div>'
        + '  <p>' + esc(textEs(iso.focus || '')) + '</p>'
        + '  <p>' + esc(textEs(iso.summary || '')) + '</p>'
        + '  <p class="iso-tag">' + esc(String(countClauses(iso))) + ' puntos auditables</p>'
        + '</button>';
    }

    if (!html) {
      html = '<div class="empty-results"><i class="fa-solid fa-filter-circle-xmark"></i><br />No se encontraron marcos normativos con ese filtro.</div>';
    }

    dom.isoOptions.innerHTML = html;

    var cards = dom.isoOptions.querySelectorAll('.iso-option');
    for (i = 0; i < cards.length; i += 1) {
      cards[i].addEventListener('click', function () {
        var isoId = String(this.getAttribute('data-iso') || '');
        if (!isoId) return;
        setSelectedIso(isoId);
      });

      cards[i].addEventListener('keydown', function (event) {
        if (!event) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        var isoId = String(this.getAttribute('data-iso') || '');
        if (!isoId) return;
        setSelectedIso(isoId);
      });
    }

    focusActiveIsoCard();
  }

  function renderIsoQuickSelector() {
    if (!dom.isoQuickSelect) return;

    var options = '';
    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      var iso = ISO_LIBRARY[i];
      var selected = iso.id === state.selectedIsoId ? ' selected' : '';
      options += '<option value="' + esc(iso.id) + '"' + selected + '>' + esc(iso.code + ' (' + (iso.version || 'N/D') + ')') + '</option>';
    }
    dom.isoQuickSelect.innerHTML = options;
  }

  function buildIsoDetailMarkup(iso) {
    if (!iso) {
      return '<p>No se encontró información del estándar seleccionado.</p>';
    }

    var totalClauses = countClauses(iso);
    var sections = iso.sections ? iso.sections.length : 0;
    var icon = iso.icon || 'fa-solid fa-shield-halved';

    return ''
      + '<h4><i class="' + esc(icon) + '"></i> ' + esc(iso.code) + ' <small>(' + esc(iso.version || 'N/D') + ')</small></h4>'
      + '<p>' + esc(textEs(iso.summary || '')) + '</p>'
      + '<p>' + esc(textEs(iso.focus || '')) + '</p>'
      + '<div class="iso-detail-meta">'
      + '  <span class="iso-detail-badge">' + esc(String(totalClauses)) + ' puntos auditables</span>'
      + '  <span class="iso-detail-badge">' + esc(String(sections)) + ' secciones</span>'
      + '</div>';
  }

  function renderIsoDetailCard(iso) {
    var markup = buildIsoDetailMarkup(iso);

    if (dom.isoDetailCard) {
      dom.isoDetailCard.innerHTML = markup;
    }

    if (dom.onboardingIsoDetail) {
      dom.onboardingIsoDetail.innerHTML = markup;
    }

    if (!iso) return;

    if (dom.activeIso) {
      dom.activeIso.textContent = iso.code + ' ' + (iso.version || '');
    }
  }

  async function setSelectedIso(isoId) {
    var iso = findIsoById(isoId);
    if (!iso) return;

    state.selectedIsoId = iso.id;
    writeLocal(LAST_ISO_KEY, iso.id);

    renderIsoOptions();
    renderIsoQuickSelector();
    renderIsoDetailCard(iso);

    if (!dom.app || dom.app.classList.contains('hidden')) return;

    await loadCurrentAudit();
    ensureFindingsSkeleton(iso);
    ensureActiveSection(iso);
    syncProjectForm();
    renderSectionTabs(iso);
    renderChecklist(iso);
    renderMetrics(iso);
    renderSignaturePreview();
    ensureNoraConversation();
    renderNoraPanel();
    if (dom.isoUpdatedNote) dom.isoUpdatedNote.textContent = textEs(iso.updatedNote || '');
  }

  function countClauses(iso) {
    var total = 0;
    var s;
    for (s = 0; s < iso.sections.length; s += 1) {
      total += iso.sections[s].clauses.length;
    }
    return total;
  }

  function showOnboarding() {
    closeMobileOffcanvas();
    closeNoraPanel();
    renderFrameworkTabs();
    renderIsoOptions();
    setActiveScreen(dom.onboarding, dom.app);
  }

  async function openAuditWorkspace() {
    closeMobileOffcanvas();
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('No se encontró la ISO seleccionada.');
      return;
    }

    await loadCurrentAudit();
    ensureFindingsSkeleton(iso);
    setActiveScreen(dom.app, dom.onboarding);

    if (dom.isoUpdatedNote) dom.isoUpdatedNote.textContent = textEs(iso.updatedNote || '');

    renderIsoQuickSelector();
    renderIsoDetailCard(iso);
    ensureActiveSection(iso);
    syncProjectForm();
    renderSectionTabs(iso);
    renderChecklist(iso);
    renderMetrics(iso);
    renderSignaturePreview();
  }

  function setActiveScreen(showElement, hideElement) {
    if (hideElement) {
      hideElement.classList.remove('is-active');
      hideElement.classList.add('hidden');
      hideElement.setAttribute('aria-hidden', 'true');
    }

    if (!showElement) return;
    showElement.classList.remove('hidden');
    window.requestAnimationFrame(function () {
      showElement.classList.add('is-active');
    });
    showElement.setAttribute('aria-hidden', 'false');
  }

  function openMobileOffcanvas() {
    if (!dom.mobileOffcanvas) return;
    dom.mobileOffcanvas.classList.remove('hidden');
    if (dom.mobileOffcanvasOverlay) dom.mobileOffcanvasOverlay.classList.remove('hidden');
    window.requestAnimationFrame(function () {
      dom.mobileOffcanvas.classList.add('open');
    });
  }

  function closeMobileOffcanvas() {
    if (!dom.mobileOffcanvas) return;
    dom.mobileOffcanvas.classList.remove('open');
    window.setTimeout(function () {
      if (dom.mobileOffcanvas) dom.mobileOffcanvas.classList.add('hidden');
      if (dom.mobileOffcanvasOverlay) dom.mobileOffcanvasOverlay.classList.add('hidden');
    }, 260);
  }

  function scrollToPanel(selector) {
    var element = document.querySelector(selector);
    if (!element || typeof element.scrollIntoView !== 'function') return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function startSplashSequence() {
    if (!dom.splash) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dom.splash.classList.add('hidden');
      dom.splash.setAttribute('aria-hidden', 'true');
      handlePostSplashState();
      return;
    }

    var duration = 1200;
    var startTime = Date.now();

    function tick() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(100, Math.round((elapsed / duration) * 100));
      if (dom.splashProgressFill) dom.splashProgressFill.style.width = progress + '%';

      if (elapsed < duration) {
        window.requestAnimationFrame(tick);
        return;
      }

      dom.splash.classList.add('hide');
      window.setTimeout(function () {
        dom.splash.classList.add('hidden');
        dom.splash.setAttribute('aria-hidden', 'true');
        handlePostSplashState();
      }, 520);
    }

    tick();
  }

  function handlePostSplashState() {
    showOnboarding();
    if (!readLocal(TUTORIAL_KEY)) {
      window.setTimeout(openTutorial, 420);
    }
  }

  function ensureActiveSection(iso) {
    if (uiFilters.sectionId === 'all') return;

    var i;
    for (i = 0; i < iso.sections.length; i += 1) {
      if (iso.sections[i].id === uiFilters.sectionId) return;
    }
    uiFilters.sectionId = 'all';
  }

  function renderSectionTabs(iso) {
    if (!dom.sectionTabs) return;

    var html = '<button type="button" class="' + (uiFilters.sectionId === 'all' ? 'active' : '') + '" data-tab="all"><i class="fa-solid fa-table-cells"></i>Todas</button>';
    var i;
    for (i = 0; i < iso.sections.length; i += 1) {
      var section = iso.sections[i];
      var activeClass = uiFilters.sectionId === section.id ? 'active' : '';
      var icon = section.icon || 'fa-solid fa-layer-group';
      html += '<button type="button" class="' + activeClass + '" data-tab="' + esc(section.id) + '"><i class="' + esc(icon) + '"></i>' + esc(textEs(section.title)) + '</button>';
    }

    dom.sectionTabs.innerHTML = html;
    var tabs = dom.sectionTabs.querySelectorAll('button[data-tab]');
    for (i = 0; i < tabs.length; i += 1) {
      tabs[i].addEventListener('click', function () {
        uiFilters.sectionId = this.getAttribute('data-tab') || 'all';
        renderSectionTabs(iso);
        renderChecklist(iso);
      });
    }
  }

  function ensureFindingsSkeleton(iso) {
    var valid = {};
    var s;
    var c;

    for (s = 0; s < iso.sections.length; s += 1) {
      var section = iso.sections[s];
      for (c = 0; c < section.clauses.length; c += 1) {
        var clause = section.clauses[c];
        valid[clause.id] = true;

        if (!state.findings[clause.id]) {
          state.findings[clause.id] = newEmptyFinding();
        } else {
          hydrateFinding(state.findings[clause.id]);
        }
      }
    }

    var keys = Object.keys(state.findings);
    for (s = 0; s < keys.length; s += 1) {
      if (!valid[keys[s]]) delete state.findings[keys[s]];
    }
  }

  function newEmptyFinding() {
    return {
      status: '',
      risk: '',
      note: '',
      action: '',
      attachments: []
    };
  }

  function hydrateFinding(finding) {
    if (!finding.status) finding.status = '';
    if (!finding.risk) finding.risk = '';
    finding.risk = normalizeRiskValue(finding.risk);
    if (!finding.note) finding.note = '';
    if (!finding.action) finding.action = '';

    if (!finding.attachments || Object.prototype.toString.call(finding.attachments) !== '[object Array]') {
      finding.attachments = [];
      return;
    }

    var normalized = [];
    var i;
    for (i = 0; i < finding.attachments.length; i += 1) {
      var item = finding.attachments[i];
      if (typeof item === 'string') {
        normalized.push({
          id: makeId(),
          name: item,
          size: 0,
          type: 'desconocido',
          createdAt: new Date().toISOString()
        });
      } else if (item && item.name) {
        normalized.push({
          id: item.id || makeId(),
          name: item.name,
          size: item.size || 0,
          type: item.type || 'desconocido',
          createdAt: item.createdAt || new Date().toISOString()
        });
      }
    }
    finding.attachments = normalized;
  }

  function renderChecklist(iso) {
    if (!dom.checklistRoot) return;

    var html = '';
    var visibleSections = 0;
    var s;

    for (s = 0; s < iso.sections.length; s += 1) {
      var section = iso.sections[s];
      if (uiFilters.sectionId !== 'all' && uiFilters.sectionId !== section.id) continue;

      var filteredClauses = [];
      var c;
      for (c = 0; c < section.clauses.length; c += 1) {
        if (clauseMatchesFilter(section.clauses[c])) filteredClauses.push(section.clauses[c]);
      }

      if (!filteredClauses.length) continue;

      visibleSections += 1;
      html += renderSection(section, filteredClauses);
    }

    if (!visibleSections) {
      html = '<div class="empty-results"><i class="fa-solid fa-filter-circle-xmark"></i><br />No hay resultados para este filtro. Ajusta búsqueda o pestaña.</div>';
    }

    dom.checklistRoot.innerHTML = html;
  }

  function clauseMatchesFilter(clause) {
    var finding = state.findings[clause.id] || newEmptyFinding();

    if (uiFilters.status === 'evaluadas' && !finding.status) return false;
    if (uiFilters.status === 'sin_evaluar' && finding.status) return false;

    if (uiFilters.risk !== 'all') {
      var riskKey = riskToFilterKey(finding.risk);
      if (riskKey !== uiFilters.risk) return false;
    }

    if (!uiFilters.query) return true;
    var textBag = [clause.id, clause.title, clause.definition, clause.question];
    if (clause.evidence && clause.evidence.length) textBag = textBag.concat(clause.evidence);
    return normalizeSearchText(textBag.join(' ')).indexOf(uiFilters.query) !== -1;
  }

  function riskToFilterKey(value) {
    var risk = normalizeRiskValue(value);
    if (!risk) return '';
    var key = String(risk).toLowerCase();
    if (key === 'crítico') return 'critico';
    return key;
  }

  function ensureNoraConversation() {
    state.noraHistory = normalizeNoraHistory(state.noraHistory);
    if (state.noraHistory.length) return;
    state.noraHistory.push(createNoraMessage('assistant', buildNoraWelcomeMessage()));
  }

  function normalizeNoraHistory(history) {
    if (Object.prototype.toString.call(history) !== '[object Array]') return [];

    var normalized = [];
    var i;
    for (i = 0; i < history.length; i += 1) {
      var item = history[i] || {};
      if (!item.role || !item.text) continue;
      normalized.push({
        id: item.id || makeId(),
        role: item.role === 'user' ? 'user' : 'assistant',
        text: String(item.text || '').trim(),
        createdAt: item.createdAt || new Date().toISOString()
      });
    }

    if (normalized.length > 24) {
      normalized = normalized.slice(normalized.length - 24);
    }
    return normalized;
  }

  function createNoraMessage(role, text) {
    return {
      id: makeId(),
      role: role === 'user' ? 'user' : 'assistant',
      text: String(text || '').trim(),
      createdAt: new Date().toISOString()
    };
  }

  function buildNoraWelcomeMessage() {
    var iso = getActiveIso();
    var intro = isNoraRemoteConfigured()
      ? 'Hola, soy NORA. Puedo ayudarte a entender y llenar cada punto de la norma.'
      : 'Hola, soy NORA. Puedo ayudarte con esta norma, sus puntos y las evidencias.';
    if (!iso) return intro;
    return intro + '\n\nAhora mismo estás trabajando con ' + iso.code + ' (' + (iso.version || 'N/D') + '): ' + textEs(iso.summary || iso.focus || 'marco normativo activo') + '.';
  }

  function getActiveIso() {
    return findIsoById(state.selectedIsoId);
  }

  function renderNoraPanel() {
    if (!dom.noraPanel || !dom.noraMessages) return;

    ensureNoraConversation();

    if (dom.noraMode) {
      dom.noraMode.textContent = getNoraModeLabel();
    }

    dom.noraMessages.innerHTML = renderNoraMessagesHtml();
    if (dom.noraPanel.classList.contains('hidden')) {
      updateNoraToggleState(false);
    }
    window.requestAnimationFrame(scrollNoraMessagesToBottom);
  }

  function renderNoraMessagesHtml() {
    var html = '';
    var history = normalizeNoraHistory(state.noraHistory);
    var i;

    for (i = 0; i < history.length; i += 1) {
      var item = history[i];
      var roleClass = item.role === 'user' ? 'user' : 'assistant';
      var roleLabel = item.role === 'user' ? 'Tú' : 'NORA';
      html += ''
        + '<article class="nora-message ' + roleClass + '">'
        + '  <span class="nora-message-role">' + esc(roleLabel) + '</span>'
        + '  <div class="nora-message-bubble">' + formatNoraText(item.text) + '</div>'
        + '</article>';
    }

    if (dom.noraSend && dom.noraSend.disabled) {
      html += ''
        + '<article class="nora-message assistant is-typing">'
        + '  <span class="nora-message-role">NORA</span>'
        + '  <div class="nora-message-bubble">Analizando tu pregunta...</div>'
        + '</article>';
    }

    return html;
  }

  function formatNoraText(text) {
    return esc(String(text || '')).replace(/\n/g, '<br />');
  }

  function getNoraModeLabel() {
    if (isNoraRemoteConfigured()) {
      return 'Conectada a Gemini y lista para ayudarte.';
    }
    return 'Modo local de apoyo con la guía normativa INDUSECC.';
  }

  function isNoraRemoteConfigured() {
    return Boolean(window.NORA_CONFIG && typeof window.NORA_CONFIG.request === 'function');
  }

  function updateNoraToggleState(isOpen) {
    if (dom.noraToggle) {
      dom.noraToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      dom.noraToggle.classList.toggle('is-open', isOpen);
    }
  }

  function openNoraPanel() {
    if (!dom.noraPanel) return;
    renderNoraPanel();
    dom.noraPanel.classList.remove('hidden');
    dom.noraPanel.setAttribute('aria-hidden', 'false');
    updateNoraToggleState(true);
    if (dom.noraInput) {
      window.requestAnimationFrame(function () {
        dom.noraInput.focus();
      });
    }
  }

  function closeNoraPanel() {
    if (!dom.noraPanel) return;
    dom.noraPanel.classList.add('hidden');
    dom.noraPanel.setAttribute('aria-hidden', 'true');
    updateNoraToggleState(false);
  }

  function toggleNoraPanel() {
    if (!dom.noraPanel) return;
    if (dom.noraPanel.classList.contains('hidden')) {
      openNoraPanel();
      return;
    }
    closeNoraPanel();
  }

  function scrollNoraMessagesToBottom() {
    if (!dom.noraMessages) return;
    dom.noraMessages.scrollTop = dom.noraMessages.scrollHeight;
  }

  function appendNoraMessage(role, text) {
    if (!String(text || '').trim()) return;
    ensureNoraConversation();
    state.noraHistory.push(createNoraMessage(role, text));
    state.noraHistory = normalizeNoraHistory(state.noraHistory);
    saveState();
    renderNoraPanel();
  }

  function setNoraBusy(isBusy) {
    if (dom.noraPanel) {
      dom.noraPanel.classList.toggle('is-loading', Boolean(isBusy));
    }
    if (dom.noraSend) {
      dom.noraSend.disabled = Boolean(isBusy);
    }
    if (dom.noraMessages) {
      if (isBusy) {
        dom.noraMessages.setAttribute('data-loading', 'true');
      } else {
        dom.noraMessages.removeAttribute('data-loading');
      }
    }
    renderNoraPanel();
  }

  function sendNoraQuestion(question, options) {
    var cleaned = String(question || '').trim();
    if (!cleaned) {
      showToast('Escribe una pregunta para NORA.');
      if (dom.noraInput) dom.noraInput.focus();
      return;
    }

    openNoraPanel();
    if (dom.noraInput) dom.noraInput.value = '';

    appendNoraMessage('user', cleaned);
    setNoraBusy(true);

    askNora(cleaned, options || { mode: 'chat' })
      .then(function (answer) {
        appendNoraMessage('assistant', answer);
      })
      .catch(function () {
        appendNoraMessage('assistant', 'No pude responder con la integración externa, pero puedo seguir ayudándote con la base normativa cargada.');
      })
      .finally(function () {
        setNoraBusy(false);
      });
  }

  function requestClauseHelp(button, mode) {
    var clauseId = String(button.getAttribute('data-clause-id') || '');
    var clause = findClauseById(clauseId);
    var card = button.closest ? button.closest('.finding-card') : null;
    var target = card && card.querySelector ? card.querySelector('[data-nora-response]') : null;
    if (!clause || !target) return;

    target.classList.remove('hidden');
    target.innerHTML = '<div class="nora-inline-state"><i class="fa-solid fa-spinner fa-spin"></i> NORA está analizando este punto...</div>';
    button.disabled = true;

    askNora(buildClausePrompt(clause, mode), {
      mode: 'clause',
      intent: mode,
      clauseId: clause.id,
      clause: clause
    }).then(function (answer) {
      target.innerHTML = '<div class="nora-inline-answer"><strong>NORA</strong><p>' + formatNoraText(answer) + '</p></div>';
    }).catch(function () {
      target.innerHTML = '<div class="nora-inline-answer"><strong>NORA</strong><p>No pude resolver este punto en este momento.</p></div>';
    }).finally(function () {
      button.disabled = false;
    });
  }

  function buildClausePrompt(clause, mode) {
    var iso = getActiveIso();
    if (mode === 'fill') {
      return 'Explícame cómo llenar el punto ' + clause.id + ' de ' + (iso ? iso.code : 'la norma activa') + '.';
    }
    return 'Explícame qué significa el punto ' + clause.id + ' de ' + (iso ? iso.code : 'la norma activa') + '.';
  }

  function askNora(question, options) {
    var payload = buildNoraPayload(question, options || {});

    if (isNoraRemoteConfigured()) {
      return Promise.resolve(window.NORA_CONFIG.request(payload)).then(function (result) {
        var remoteText = extractNoraText(result);
        if (remoteText) return remoteText;
        return buildLocalNoraAnswer(question, options, 'Gemini respondió vacío, así que te comparto la guía interna.');
      }).catch(function () {
        return buildLocalNoraAnswer(question, options, 'No pude conectar con Gemini, así que te respondo con la guía interna.');
      });
    }

    return Promise.resolve(buildLocalNoraAnswer(question, options));
  }

  function buildNoraPayload(question, options) {
    var iso = getActiveIso();
    var intent = inferNoraIntent(question, options || {});
    var clause = (options && options.clause) || findClauseById(options && options.clauseId) || findRelevantClause(question, iso);
    var finding = clause ? (state.findings[clause.id] || newEmptyFinding()) : null;
    var conversation = normalizeNoraHistory(state.noraHistory).slice(-12).map(function (item) {
      return {
        role: item.role,
        text: item.text
      };
    });

    return {
      assistant: 'NORA',
      question: question,
      mode: options && options.mode ? options.mode : 'chat',
      intent: intent,
      activeIso: iso ? {
        id: iso.id,
        code: iso.code,
        version: iso.version,
        focus: iso.focus,
        summary: iso.summary
      } : null,
      clause: clause ? {
        id: clause.id,
        title: clause.title,
        definition: clause.definition,
        question: clause.question,
        evidence: clause.evidence || []
      } : null,
      finding: finding,
      project: state.project,
      conversation: conversation
    };
  }

  function extractNoraText(result) {
    if (!result) return '';
    if (typeof result === 'string') return result.trim();
    if (typeof result.text === 'string') return result.text.trim();
    if (typeof result.answer === 'string') return result.answer.trim();
    if (typeof result.reply === 'string') return result.reply.trim();
    if (typeof result.message === 'string') return result.message.trim();
    if (result.content && typeof result.content === 'string') return result.content.trim();
    return '';
  }

  function buildLocalNoraAnswer(question, options, note) {
    var normalized = normalizeSearchText(question || '');
    var iso = getActiveIso();
    var clause = (options && options.clause) || findClauseById(options && options.clauseId) || findRelevantClause(question, iso);
    var intent = inferNoraIntent(question, options || {});
    var answer = '';

    if (intent === 'fill' && clause) {
      answer = buildClauseGuidance(clause, 'fill');
    } else if (intent === 'explain' && clause) {
      answer = buildClauseGuidance(clause, 'explain');
    } else if (normalized.indexOf('como lleno') !== -1 || normalized.indexOf('como llenar') !== -1 || normalized.indexOf('llenarlo') !== -1 || normalized.indexOf('que pongo') !== -1) {
      answer = clause ? buildClauseGuidance(clause, 'fill') : buildChecklistGuidance(iso);
    } else if (normalized.indexOf('evidencia') !== -1) {
      answer = clause ? buildClauseEvidenceAnswer(clause) : buildGeneralEvidenceAnswer(iso);
    } else if (normalized.indexOf('a que se refiere') !== -1 || normalized.indexOf('de que trata') !== -1 || normalized.indexOf('que significa esta norma') !== -1 || normalized.indexOf('que es esta norma') !== -1) {
      answer = buildNormOverview(iso);
    } else if (clause) {
      answer = buildClauseGuidance(clause, 'explain');
    } else {
      answer = buildGeneralNoraFallback(iso);
    }

    if (note) {
      answer += '\n\nNota: ' + note;
    }
    return answer;
  }

  function buildNormOverview(iso) {
    if (!iso) {
      return 'Primero selecciona una norma y yo te explico su enfoque, lo que busca controlar y cómo conviene auditarla.';
    }

    return ''
      + iso.code + ' (' + (iso.version || 'N/D') + ')\n'
      + 'Enfoque: ' + textEs(iso.focus || 'Sistema de gestión activo') + '.\n'
      + 'Resumen: ' + textEs(iso.summary || 'Marco normativo seleccionado') + '.\n\n'
      + 'Cuando llenes el checklist, piensa en tres cosas:\n'
      + '1. Qué exige el requisito.\n'
      + '2. Qué evidencia objetiva demuestra cumplimiento.\n'
      + '3. Qué hallazgo y acción debes documentar si hay brechas.';
  }

  function buildChecklistGuidance(iso) {
    var prefix = iso ? 'Para llenar ' + iso.code + ' trabaja así:\n' : 'Para llenar el checklist trabaja así:\n';
    return prefix
      + '1. Lee la definición del punto y la pregunta de auditoría.\n'
      + '2. En Conformidad marca Cumple, Parcial, No cumple o N/A según la evidencia real.\n'
      + '3. En Riesgo registra el impacto que tendría la brecha.\n'
      + '4. En Hallazgo/observación escribe hechos verificables, no opiniones.\n'
      + '5. En Acción o plan de mejora documenta qué se debe corregir, de preferencia con responsable y plazo.\n'
      + '6. Adjunta evidencia trazable: documentos, registros, fotos, actas o reportes.';
  }

  function buildClauseGuidance(clause, mode) {
    var finding = state.findings[clause.id] || newEmptyFinding();
    var evidence = (clause.evidence && clause.evidence.length)
      ? '- ' + clause.evidence.map(function (item) { return textEs(item); }).join('\n- ')
      : '- Evidencia objetiva del cumplimiento de este requisito.';

    if (mode === 'fill') {
      return ''
        + clause.id + ' - ' + textEs(clause.title) + '\n'
        + 'Qué pide este punto: ' + textEs(clause.definition) + '.\n'
        + 'Qué debe validar el auditor: ' + textEs(clause.question) + '.\n\n'
        + 'Cómo llenarlo:\n'
        + '1. Conformidad: usa Cumple si la evidencia es suficiente y vigente; Parcial si existe pero está incompleta; No cumple si la práctica no existe o falla; N/A si no aplica y puedes justificarlo.\n'
        + '2. Hallazgo/observación: describe lo observado con hechos, por ejemplo documento, registro, entrevista o condición detectada.\n'
        + '3. Acción o plan de mejora: indica la corrección o mejora esperada y, si es posible, responsable y plazo.\n'
        + '4. Evidencia sugerida:\n' + evidence + '\n\n'
        + 'Puedes escribir algo como:\n'
        + '- Conformidad: Parcial, si existe evidencia pero falta actualizarla o demostrar su uso.\n'
        + '- Hallazgo/observación: Se revisó la evidencia disponible para el punto ' + clause.id + ', pero falta confirmar vigencia, responsable o trazabilidad completa.\n'
        + '- Acción o plan de mejora: Actualizar la evidencia del punto, asignar responsable y conservar registros verificables para la próxima revisión.\n\n'
        + 'Lo que ya llevas en este punto:\n'
        + '- Estado: ' + (finding.status || 'Sin registrar') + '\n'
        + '- Riesgo: ' + (normalizeRiskValue(finding.risk) || 'Sin registrar') + '\n'
        + '- Hallazgo: ' + (finding.note || 'Sin registrar') + '\n'
        + '- Acción: ' + (finding.action || 'Sin registrar');
    }

    return ''
      + clause.id + ' - ' + textEs(clause.title) + '\n'
      + 'Qué significa: ' + textEs(clause.definition) + '.\n'
      + 'Qué revisa el auditor: ' + textEs(clause.question) + '.\n'
      + 'Evidencia útil para demostrarlo:\n' + evidence + '\n\n'
      + 'Consejo de auditoría: busca evidencia vigente, trazable y coherente entre documentos, práctica real y entrevistas.';
  }

  function buildClauseEvidenceAnswer(clause) {
    var evidence = clause.evidence && clause.evidence.length
      ? clause.evidence.map(function (item) { return '- ' + textEs(item); }).join('\n')
      : '- Evidencia documental o registros que prueben la ejecución real del punto.';
    return ''
      + clause.id + ' - ' + textEs(clause.title) + '\n'
      + 'Para este punto conviene adjuntar evidencia como:\n'
      + evidence + '\n\n'
      + 'Además, intenta que la evidencia tenga fecha, responsable y relación directa con el requisito auditado.';
  }

  function buildGeneralEvidenceAnswer(iso) {
    var target = iso ? iso.code : 'la norma activa';
    return ''
      + 'Para ' + target + ' prioriza evidencia objetiva y trazable.\n'
      + 'Ejemplos útiles:\n'
      + '- Políticas, procedimientos y matrices.\n'
      + '- Registros operativos, bitácoras y reportes.\n'
      + '- Actas, minutas y aprobaciones.\n'
      + '- Indicadores, dashboards o resultados de seguimiento.\n'
      + '- Entrevistas y observación en sitio, respaldadas con notas o fotografías.';
  }

  function buildGeneralNoraFallback(iso) {
    var target = iso ? iso.code + ' (' + (iso.version || 'N/D') + ')' : 'la norma que selecciones';
    return ''
      + 'Puedo ayudarte con ' + target + '.\n'
      + 'Pregúntame cosas como:\n'
      + '- ¿A qué se refiere esta norma?\n'
      + '- ¿Qué significa el punto 9001-8.4?\n'
      + '- ¿Cómo lleno el punto 27001-6.1.2?\n'
      + '- ¿Qué evidencia debería adjuntar?';
  }

  function inferNoraIntent(question, options) {
    if (options && options.intent) return options.intent;
    var normalized = normalizeSearchText(question || '');
    if (
      normalized.indexOf('llenar') !== -1 ||
      normalized.indexOf('lleno') !== -1 ||
      normalized.indexOf('llenarlo') !== -1 ||
      normalized.indexOf('que pongo') !== -1 ||
      normalized.indexOf('redacta') !== -1 ||
      normalized.indexOf('escribir') !== -1
    ) {
      return 'fill';
    }
    if (normalized.indexOf('evidencia') !== -1 || normalized.indexOf('adjuntar') !== -1) return 'evidence';
    if (normalized.indexOf('explica') !== -1 || normalized.indexOf('significa') !== -1 || normalized.indexOf('refiere') !== -1) return 'explain';
    return '';
  }

  function findClauseById(clauseId) {
    if (!clauseId) return null;
    var i;
    var s;
    var c;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      for (s = 0; s < ISO_LIBRARY[i].sections.length; s += 1) {
        for (c = 0; c < ISO_LIBRARY[i].sections[s].clauses.length; c += 1) {
          var clause = ISO_LIBRARY[i].sections[s].clauses[c];
          if (clause.id === clauseId) return clause;
        }
      }
    }
    return null;
  }

  function findRelevantClause(query, preferredIso) {
    var normalized = normalizeSearchText(query || '');
    if (!normalized) return null;

    var ranked = [];
    if (preferredIso) ranked = ranked.concat(flattenClauses(preferredIso));

    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      if (preferredIso && ISO_LIBRARY[i].id === preferredIso.id) continue;
      ranked = ranked.concat(flattenClauses(ISO_LIBRARY[i]));
    }

    var bestClause = null;
    var bestScore = 0;
    for (i = 0; i < ranked.length; i += 1) {
      var score = scoreClauseMatch(ranked[i], normalized);
      if (score > bestScore) {
        bestScore = score;
        bestClause = ranked[i];
      }
    }

    return bestScore >= 14 ? bestClause : null;
  }

  function scoreClauseMatch(clause, normalizedQuery) {
    var clauseId = normalizeSearchText(clause.id);
    var title = normalizeSearchText(clause.title);
    var definition = normalizeSearchText(clause.definition);
    var question = normalizeSearchText(clause.question);
    var evidence = normalizeSearchText((clause.evidence || []).join(' '));
    var score = 0;

    if (normalizedQuery.indexOf(clauseId) !== -1) score += 120;
    if (normalizedQuery.indexOf(title) !== -1) score += 60;

    var tokens = normalizedQuery.split(' ');
    var stopwords = {
      a: true, al: true, como: true, con: true, cual: true, de: true, del: true, el: true, en: true,
      esta: true, este: true, la: true, las: true, lo: true, los: true, me: true, norma: true,
      para: true, punto: true, que: true, se: true, una: true, uno: true, y: true
    };
    var i;
    for (i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      if (!token || token.length < 3 || stopwords[token]) continue;
      if (clauseId.indexOf(token) !== -1) score += 18;
      if (title.indexOf(token) !== -1) score += 10;
      if (definition.indexOf(token) !== -1) score += 5;
      if (question.indexOf(token) !== -1) score += 4;
      if (evidence.indexOf(token) !== -1) score += 2;
    }

    return score;
  }

  function renderSection(section, clauses) {
    var html = '';
    var icon = section.icon || 'fa-solid fa-layer-group';

    html += '<section class="section-block">';
    html += '<header class="section-head"><h4><i class="' + esc(icon) + '"></i> ' + esc(textEs(section.title)) + '</h4></header>';
    html += '<div class="findings-list">';

    var i;
    for (i = 0; i < clauses.length; i += 1) {
      html += renderClauseCard(clauses[i]);
    }

    html += '</div>';
    html += '</section>';
    return html;
  }

  function renderClauseCard(clause) {
    var finding = state.findings[clause.id] || newEmptyFinding();
    finding.risk = normalizeRiskValue(finding.risk);
    var statusClass = getStatusClass(finding.status);

    var html = '';
    html += '<article class="finding-card" data-clause-id="' + esc(clause.id) + '">';
    html += '  <div class="finding-head">';
    html += '    <div>';
    html += '      <h5>' + esc(clause.id) + ' - ' + esc(textEs(clause.title)) + '</h5>';
    html += '      <p>' + esc(textEs(clause.question)) + '</p>';
    html += '    </div>';
    html += '    <div class="finding-head-tags">';
    html += '      <span class="badge-status ' + esc(statusClass) + '">' + esc(finding.status || 'Sin evaluar') + '</span>';
    html += renderRiskPill(finding.risk);
    html += '    </div>';
    html += '  </div>';

    html += '  <p class="clause-definition"><strong>Definición del punto:</strong> ' + esc(textEs(clause.definition)) + '</p>';
    html += renderEvidenceGuide(clause.evidence);
    html += '  <div class="nora-clause-tools">';
    html += '    <button type="button" class="btn btn-secondary btn-nora-inline" data-action="nora-explain-clause" data-clause-id="' + esc(clause.id) + '"><i class="fa-solid fa-robot"></i> NORA explica este punto</button>';
    html += '    <button type="button" class="btn btn-secondary btn-nora-inline" data-action="nora-fill-clause" data-clause-id="' + esc(clause.id) + '"><i class="fa-solid fa-wand-magic-sparkles"></i> NORA cómo llenarlo</button>';
    html += '  </div>';
    html += '  <div class="nora-clause-response hidden" data-nora-response="true" aria-live="polite"></div>';

    html += '  <div class="finding-grid">';
    html += '    <label>Conformidad';
    html += '      <select data-field="status" data-clause-id="' + esc(clause.id) + '">';
    html += renderSelectOptions(['', 'Cumple', 'Parcial', 'No cumple', 'N/A'], finding.status);
    html += '      </select>';
    html += '    </label>';

    html += '    <label>Riesgo';
    html += '      <select data-field="risk" data-clause-id="' + esc(clause.id) + '">';
    html += renderSelectOptions(['', 'Bajo', 'Medio', 'Alto', 'Crítico'], finding.risk);
    html += '      </select>';
    html += '    </label>';

    html += '    <label class="wide">Hallazgo/observación';
    html += '      <textarea rows="2" data-field="note" data-clause-id="' + esc(clause.id) + '" placeholder="¿Qué se encontró en este punto?">' + esc(finding.note || '') + '</textarea>';
    html += '    </label>';

    html += '    <label class="wide">Acción o plan de mejora';
    html += '      <textarea rows="2" data-field="action" data-clause-id="' + esc(clause.id) + '" placeholder="¿Qué acción correctiva/recomendación se propone?">' + esc(finding.action || '') + '</textarea>';
    html += '    </label>';
    html += '  </div>';

    html += '  <div class="evidence-tools">';
    html += '    <label class="upload-label">';
    html += '      <i class="fa-solid fa-paperclip"></i> Agregar archivo para este punto';
    html += '      <input type="file" multiple data-field="attachment" data-clause-id="' + esc(clause.id) + '" />';
    html += '    </label>';
    html += '  </div>';

    html += '  <div class="evidence-list">';
    html += renderAttachments(finding.attachments, clause.id);
    html += '  </div>';
    html += '</article>';
    return html;
  }

  function renderEvidenceGuide(evidenceItems) {
    if (!evidenceItems || !evidenceItems.length) {
      return '<ul class="clause-guide"><li>Captura evidencia del cumplimiento de este punto.</li></ul>';
    }

    var html = '<ul class="clause-guide">';
    var i;
    for (i = 0; i < evidenceItems.length; i += 1) {
      html += '<li><strong>Evidencia sugerida:</strong> ' + esc(textEs(evidenceItems[i])) + '</li>';
    }
    html += '</ul>';
    return html;
  }

  function renderSelectOptions(options, selected) {
    var html = '';
    var i;
    for (i = 0; i < options.length; i += 1) {
      var value = options[i];
      var selectedAttr = selected === value ? ' selected' : '';
      html += '<option value="' + esc(value) + '"' + selectedAttr + '>' + esc(value || 'Seleccionar') + '</option>';
    }
    return html;
  }

  function renderAttachments(attachments, clauseId) {
    if (!attachments || !attachments.length) {
      return '<div class="evidence-item"><span class="evidence-meta">Sin archivos adjuntos para este punto.</span></div>';
    }

    var html = '';
    var i;
    for (i = 0; i < attachments.length; i += 1) {
      var file = attachments[i];
      html += ''
        + '<article class="evidence-item">'
        + '  <div class="evidence-meta">'
        + '    <strong>' + esc(file.name) + '</strong><br />'
        + '    Tipo: ' + esc(file.type || 'N/D') + ' | Tamaño: ' + esc(formatBytes(file.size || 0))
        + '  </div>'
        + (file.storagePath ? '  <button class="btn btn-secondary" data-action="download-attachment" data-path="' + esc(file.storagePath) + '"><i class="fa-solid fa-download"></i> Descargar</button>' : '')
        + '  <button class="btn btn-danger" data-action="remove-attachment" data-clause-id="' + esc(clauseId) + '" data-file-id="' + esc(file.id) + '"><i class="fa-solid fa-trash"></i> Quitar</button>'
        + '</article>';
    }
    return html;
  }

  function onChecklistInput(event) {
    var target = event.target;
    var field = target.getAttribute('data-field');
    var clauseId = target.getAttribute('data-clause-id');
    if (!field || !clauseId) return;

    if (!state.findings[clauseId]) state.findings[clauseId] = newEmptyFinding();

    if (field === 'attachment') {
      addAttachmentsToClause(clauseId, target.files || []);
      target.value = '';
      return;
    }

    if (field === 'risk') {
      state.findings[clauseId][field] = normalizeRiskValue(target.value);
    } else {
      state.findings[clauseId][field] = target.value;
    }
    saveState();

    if (field === 'status') {
      var card = target.closest ? target.closest('.finding-card') : null;
      if (card) {
        var badge = card.querySelector('.badge-status');
        if (badge) {
          badge.className = 'badge-status ' + getStatusClass(target.value);
          badge.textContent = target.value || 'Sin evaluar';
        }
      }
    }

    if (field === 'risk') {
      var riskCard = target.closest ? target.closest('.finding-card') : null;
      if (riskCard) {
        var pill = riskCard.querySelector('.risk-pill');
        if (pill) {
          var normalized = normalizeRiskValue(target.value);
          var riskClass = getRiskClass(normalized);
          pill.className = 'risk-pill' + (riskClass ? ' ' + riskClass : '');
          pill.textContent = normalized || 'Sin riesgo';
        }
      }
    }

    var iso = findIsoById(state.selectedIsoId);
    if (iso) renderMetrics(iso);
  }

  function onChecklistClick(event) {
    var button = event.target.closest ? event.target.closest('button[data-action]') : null;
    if (!button) return;
    var action = String(button.getAttribute('data-action') || '');
    if (action === 'remove-attachment') {
      if (isReadOnlyUser()) return;
      removeAttachment(button.getAttribute('data-clause-id'), button.getAttribute('data-file-id'));
      return;
    }
    if (action === 'download-attachment') {
      downloadAttachment(button.getAttribute('data-path'));
      return;
    }
    if (action === 'nora-explain-clause') {
      requestClauseHelp(button, 'explain');
      return;
    }
    if (action === 'nora-fill-clause') {
      requestClauseHelp(button, 'fill');
    }
  }

  async function downloadAttachment(path) {
    if (!path || !sb) return;
    var result = await sb.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, 300);
    if (result.error || !result.data) {
      showToast('No se pudo generar el enlace de descarga.');
      return;
    }
    window.open(result.data.signedUrl, '_blank', 'noopener');
  }

  async function addAttachmentsToClause(clauseId, fileList) {
    if (isReadOnlyUser() || !sb || !currentAudit || !currentUser) return;
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) return;

    var findingResult = await sb.from('audit_findings').upsert({
      audit_id: currentAudit.id,
      clause_id: clauseId,
      status: (state.findings[clauseId] && state.findings[clauseId].status) || '',
      risk: (state.findings[clauseId] && state.findings[clauseId].risk) || '',
      note: (state.findings[clauseId] && state.findings[clauseId].note) || '',
      action: (state.findings[clauseId] && state.findings[clauseId].action) || '',
      updated_by: currentUser.id
    }, { onConflict: 'audit_id,clause_id' }).select().single();

    if (findingResult.error) {
      showToast('No se pudo guardar el hallazgo antes de subir el archivo.');
      return;
    }

    var findingId = findingResult.data.id;
    var finding = state.findings[clauseId] || newEmptyFinding();
    var i;

    for (i = 0; i < fileList.length; i += 1) {
      var file = fileList[i];
      var path = currentUser.id + '/' + currentAudit.id + '/' + clauseId + '/' + Date.now() + '_' + Math.floor(Math.random() * 100000) + '_' + file.name;

      var uploadResult = await sb.storage.from(EVIDENCE_BUCKET).upload(path, file, {
        contentType: file.type || 'application/octet-stream'
      });

      if (uploadResult.error) {
        showToast('No se pudo subir "' + file.name + '" al servidor.');
        continue;
      }

      var evidenceResult = await sb.from('audit_evidence').insert({
        finding_id: findingId,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        uploaded_by: currentUser.id
      }).select().single();

      if (evidenceResult.error) {
        showToast('El archivo se subió pero no se pudo registrar.');
        continue;
      }

      finding.attachments = finding.attachments || [];
      finding.attachments.push({
        id: evidenceResult.data.id,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        storagePath: path,
        createdAt: evidenceResult.data.created_at
      });
    }

    state.findings[clauseId] = finding;

    renderChecklist(iso);
    renderMetrics(iso);
    showToast('Archivo(s) agregado(s) al punto ' + clauseId + '.');
  }

  async function removeAttachment(clauseId, fileId) {
    if (!sb) return;
    var finding = state.findings[clauseId] || newEmptyFinding();
    var attachments = finding.attachments || [];
    var target = null;
    var filtered = [];
    var i;

    for (i = 0; i < attachments.length; i += 1) {
      if (attachments[i].id === fileId) {
        target = attachments[i];
      } else {
        filtered.push(attachments[i]);
      }
    }

    if (target && target.storagePath) {
      await sb.storage.from(EVIDENCE_BUCKET).remove([target.storagePath]);
    }
    await sb.from('audit_evidence').delete().eq('id', fileId);

    finding.attachments = filtered;
    state.findings[clauseId] = finding;

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      renderChecklist(iso);
      renderMetrics(iso);
    }
  }

  function renderMetrics(iso) {
    if (!dom.metrics) return;

    var summary = calculateMetrics(iso);
    dom.metrics.innerHTML = ''
      + metricCard(summary.progress + '%', 'avance')
      + metricCard(String(summary.ok), 'cumple')
      + metricCard(String(summary.partial), 'parcial')
      + metricCard(String(summary.bad), 'no cumple')
      + metricCard(String(summary.evidenceTotal), 'archivos')
      + metricCard(String(summary.total), 'puntos ISO');

    if (dom.globalProgressFill) dom.globalProgressFill.style.width = summary.progress + '%';
    if (dom.globalProgressLabel) dom.globalProgressLabel.textContent = summary.progress + '% completado (' + summary.evaluated + '/' + summary.total + ' puntos)';
    if (dom.floatingProgressValue) dom.floatingProgressValue.textContent = summary.progress + '%';
    if (dom.floatingProgressBubble) dom.floatingProgressBubble.style.setProperty('--floating-progress', String(summary.progress));
  }

  function calculateMetrics(iso) {
    var clauses = flattenClauses(iso);
    var summary = {
      total: clauses.length,
      evaluated: 0,
      ok: 0,
      partial: 0,
      bad: 0,
      evidenceTotal: 0,
      progress: 0
    };

    var i;
    for (i = 0; i < clauses.length; i += 1) {
      var finding = state.findings[clauses[i].id] || newEmptyFinding();
      var status = finding.status || '';

      if (status) summary.evaluated += 1;
      if (status === 'Cumple') summary.ok += 1;
      if (status === 'Parcial') summary.partial += 1;
      if (status === 'No cumple') summary.bad += 1;
      summary.evidenceTotal += (finding.attachments || []).length;
    }

    summary.progress = summary.total > 0 ? Math.round((summary.evaluated / summary.total) * 100) : 0;
    return summary;
  }

  function metricCard(value, label) {
    return '<article class="metric"><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span></article>';
  }

  function flattenClauses(iso) {
    var out = [];
    var s;
    var c;
    for (s = 0; s < iso.sections.length; s += 1) {
      for (c = 0; c < iso.sections[s].clauses.length; c += 1) {
        out.push(iso.sections[s].clauses[c]);
      }
    }
    return out;
  }

  function renderSignaturePreview() {
    if (!dom.signaturePreview) return;

    var dataUrl = getEffectiveSignatureDataUrl();
    if (!dataUrl) {
      dom.signaturePreview.textContent = 'Sin firma cargada.';
      return;
    }

    var label = state.signature.uploadedDataUrl ? ('Archivo: ' + (state.signature.uploadedName || 'firma')) : 'Firma trazada en lienzo';
    dom.signaturePreview.innerHTML = '<div><img src="' + esc(dataUrl) + '" alt="Firma del auditor" /><p>' + esc(label) + '</p></div>';
  }

  function getEffectiveSignatureDataUrl() {
    if (state.signature.uploadedDataUrl) return state.signature.uploadedDataUrl;
    if (state.signature.drawnDataUrl) return state.signature.drawnDataUrl;
    return '';
  }

  async function exportReportPdf() {
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('Selecciona una norma primero.');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('No se pudo cargar el motor PDF.');
      return;
    }

    try {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ unit: 'pt', format: 'a4' });
      var margin = 36;
      var width = 523;
      var y = 42;
      var summary = calculateMetrics(iso);

      drawTitle(doc, iso, y);
      y = 118;

      y = writeLine(doc, 'Proyecto / Empresa', state.project.name || 'N/D', y, margin);
      y = writeLine(doc, 'Auditor', state.project.auditor || 'N/D', y, margin);
      y = writeLine(doc, 'Representante auditado', state.project.auditedRep || 'N/D', y, margin);
      y = writeLine(doc, 'Sitio', state.project.site || 'N/D', y, margin);
      y = writeLine(doc, 'Fecha de auditoría', state.project.date || 'N/D', y, margin);
      y = writeLine(doc, 'Versión del documento', state.project.docVersion || 'N/D', y, margin);
      y = writeLine(doc, 'Progreso global', summary.progress + '% (' + summary.evaluated + '/' + summary.total + ' puntos)', y, margin);
      y = writeParagraph(doc, 'Alcance', state.project.scope || 'N/D', y + 4, margin, width);

      y = ensureSpace(doc, y, 94);
      y = writeHistoryTable(doc, y, margin, width);
      y = writeSignatureBlock(doc, y, margin, width);

      var sections = iso.sections;
      var s;
      var c;
      for (s = 0; s < sections.length; s += 1) {
        y = ensureSpace(doc, y, 50);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(textEs(sections[s].title), margin, y);
        y += 16;

        for (c = 0; c < sections[s].clauses.length; c += 1) {
          var clause = sections[s].clauses[c];
          var finding = state.findings[clause.id] || newEmptyFinding();
          var attachmentNames = attachmentsToText(finding.attachments);

          y = ensureSpace(doc, y, 122);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(clause.id + ' - ' + textEs(clause.title), margin + 4, y);
          y += 12;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          y = writeWrapped(doc, 'Definición: ' + textEs(clause.definition), margin + 8, y, width - 20, 11);
          y = writeWrapped(doc, 'Revisión: ' + textEs(clause.question), margin + 8, y, width - 20, 11);
          y = writeWrapped(doc, 'Estado: ' + (finding.status || 'Sin evaluar') + ' | Riesgo: ' + (normalizeRiskValue(finding.risk) || 'N/D'), margin + 8, y, width - 20, 11);
          y = writeWrapped(doc, 'Hallazgo: ' + (finding.note || 'N/D'), margin + 8, y, width - 20, 11);
          y = writeWrapped(doc, 'Acción: ' + (finding.action || 'N/D'), margin + 8, y, width - 20, 11);
          y = writeWrapped(doc, 'Archivos: ' + attachmentNames, margin + 8, y, width - 20, 11);
          y += 8;
        }
      }

      var filename = 'Auditoria_' + iso.code.replace(/[^a-zA-Z0-9]/g, '') + '_' + formatDateName(new Date()) + '.pdf';
      doc.save(filename);
      logActivity('pdf_exported', { filename: filename, iso_code: iso.code });
      showToast('PDF exportado correctamente.');
      uploadExportToVault(doc, filename, iso.code);
    } catch (err) {
      showToast('Error al exportar PDF.');
    }
  }

  async function uploadExportToVault(doc, filename, isoCode) {
    if (!sb || !currentUser) return;
    try {
      var blob = doc.output('blob');
      var path = currentUser.id + '/' + Date.now() + '_' + filename;
      var uploadResult = await sb.storage.from(EXPORTS_BUCKET).upload(path, blob, {
        contentType: 'application/pdf',
        upsert: false
      });
      if (uploadResult.error) return;
      await sb.from('audit_exports').insert({
        audit_id: currentAudit ? currentAudit.id : null,
        actor_id: currentUser.id,
        filename: filename,
        storage_path: path,
        iso_code: isoCode,
        file_size: blob.size
      });
    } catch (err) {
      // La bóveda es un respaldo adicional: si falla, la descarga local ya ocurrió.
    }
  }

  async function logActivity(action, detail) {
    if (!sb || !currentUser) return;
    await sb.from('audit_activity_log').insert({
      audit_id: currentAudit ? currentAudit.id : null,
      actor_id: currentUser.id,
      action: action,
      detail: detail || {}
    });
  }

  function drawTitle(doc, iso) {
    doc.setFillColor(91, 17, 31);
    doc.rect(0, 0, 595, 94, 'F');

    doc.setTextColor(250, 241, 219);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);

    var textStart = 36;
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 36, 16, 62, 62);
        textStart = 108;
      } catch (err) {
        textStart = 36;
      }
    }

    doc.text('Plataforma de Gestión de Auditorías - INDUSECC', textStart, 38);
    doc.setFontSize(12);
    doc.text(iso.code + ' ' + (iso.version || ''), textStart, 62);
    doc.setTextColor(33, 33, 33);
  }

  function writeHistoryTable(doc, y, margin, width) {
    var rowHeight = 18;
    var colA = 68;
    var colB = 82;
    var colC = 96;
    var colD = width - colA - colB - colC;
    var x = margin;
    var i;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Control de versiones', margin, y);
    y += 10;

    doc.setFillColor(245, 236, 220);
    doc.rect(x, y, width, rowHeight, 'F');
    doc.setDrawColor(220, 199, 157);
    doc.rect(x, y, width, rowHeight);

    doc.setFontSize(8);
    doc.text('Versión', x + 4, y + 12);
    doc.text('Fecha', x + colA + 4, y + 12);
    doc.text('Autor', x + colA + colB + 4, y + 12);
    doc.text('Descripción de cambios', x + colA + colB + colC + 4, y + 12);
    y += rowHeight;

    for (i = 0; i < 3; i += 1) {
      var row = state.history[i] || {};
      var version = row.version || '';
      var date = row.date || '';
      var author = row.author || '';
      var description = row.description || '';

      doc.rect(x, y, width, rowHeight);
      doc.line(x + colA, y, x + colA, y + rowHeight);
      doc.line(x + colA + colB, y, x + colA + colB, y + rowHeight);
      doc.line(x + colA + colB + colC, y, x + colA + colB + colC, y + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(version), x + 4, y + 12);
      doc.text(String(date), x + colA + 4, y + 12);
      doc.text(String(author), x + colA + colB + 4, y + 12);
      doc.text(String(description), x + colA + colB + colC + 4, y + 12, { maxWidth: colD - 8 });
      y += rowHeight;
    }

    return y + 12;
  }

  function writeSignatureBlock(doc, y, margin, width) {
    y = ensureSpace(doc, y, 120);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Firma del auditor:', margin, y);
    y += 8;

    var signatureDataUrl = getEffectiveSignatureDataUrl();
    if (!signatureDataUrl) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('N/D', margin + 94, y);
      return y + 12;
    }

    try {
      var properties = doc.getImageProperties(signatureDataUrl);
      var maxW = width * 0.42;
      var maxH = 72;
      var ratio = properties.width / properties.height;
      var drawW = maxW;
      var drawH = drawW / ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }

      doc.setDrawColor(220, 199, 157);
      doc.rect(margin + 94, y - 10, maxW + 12, maxH + 12);
      doc.addImage(signatureDataUrl, properties.fileType || 'PNG', margin + 100, y - 4, drawW, drawH);
      return y + maxH + 16;
    } catch (err) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('No se pudo renderizar la firma.', margin + 94, y);
      return y + 12;
    }
  }

  function writeLine(doc, label, value, y, margin) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 132, y);
    return y + 14;
  }

  function writeParagraph(doc, label, value, y, margin, width) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    var lines = doc.splitTextToSize(String(value), width - 132);
    doc.text(lines, margin + 132, y);
    return y + (lines.length * 11) + 8;
  }

  function writeWrapped(doc, text, x, y, maxWidth, lineHeight) {
    var lines = doc.splitTextToSize(String(text), maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  }

  function ensureSpace(doc, y, required) {
    if (y + required > 805) {
      doc.addPage();
      return 42;
    }
    return y;
  }

  function attachmentsToText(attachments) {
    if (!attachments || !attachments.length) return 'Sin archivos';
    var parts = [];
    var i;
    for (i = 0; i < attachments.length; i += 1) {
      parts.push(attachments[i].name);
    }
    return parts.join('; ');
  }

  async function clearCurrentAudit() {
    if (isReadOnlyUser() || !sb) return;

    // No se destruye la auditoría existente: se archiva (status = completed) y se
    // abre una nueva en blanco. Así nunca se pierde información ya capturada.
    if (currentAudit) {
      await sb.from('audits').update({ status: 'completed' }).eq('id', currentAudit.id);
    }

    currentAudit = null;
    var iso = findIsoById(state.selectedIsoId);
    await loadCurrentAudit();

    clearSignatureCanvas();
    if (dom.signatureFile) dom.signatureFile.value = '';

    if (iso) {
      ensureFindingsSkeleton(iso);
      renderSectionTabs(iso);
      renderChecklist(iso);
      renderMetrics(iso);
    }

    syncProjectForm();
    renderSignaturePreview();
    ensureNoraConversation();
    renderNoraPanel();
    showToast('Auditoría archivada. Se abrió una nueva en blanco.');
  }

  function findIsoById(id) {
    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      if (ISO_LIBRARY[i].id === id) return ISO_LIBRARY[i];
    }
    return null;
  }

  function getVisibleIsoCards() {
    var out = [];
    var query = uiFilters.frameworkQuery || '';
    var category = uiFilters.frameworkCategory || 'all';
    var i;

    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      var iso = ISO_LIBRARY[i];
      var isoCategory = mapIsoToFramework(iso.id);
      if (category !== 'all' && isoCategory !== category) continue;
      if (query && !isoMatchesQuery(iso, query)) continue;
      out.push(iso);
    }

    return out;
  }

  function isoMatchesQuery(iso, query) {
    var bag = normalizeSearchText([iso.code, iso.version, iso.focus, iso.summary].join(' '));
    return bag.indexOf(query) !== -1;
  }

  function normalizeSearchText(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function mapIsoToFramework(isoId) {
    if (isoId === 'iso9001') return 'calidad';
    if (isoId === 'iso22000') return 'alimentos';
    if (isoId === 'iso14001' || isoId === 'iso50001') return 'medioambiente';
    return 'seguridad';
  }

  function arrayIncludesIso(items, isoId) {
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (items[i].id === isoId) return true;
    }
    return false;
  }

  function focusActiveIsoCard() {
    if (!dom.isoOptions || typeof dom.isoOptions.querySelector !== 'function') return;
    if ((window.innerWidth || 0) >= 1080) return;
    var active = dom.isoOptions.querySelector('.iso-option.active');
    if (!active || typeof active.scrollIntoView !== 'function') return;
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function getRoutes() {
    return {
      login: 'login.html',
      app: 'index.html'
    };
  }

  function getStatusClass(status) {
    if (status === 'Cumple') return 'ok';
    if (status === 'Parcial') return 'warn';
    if (status === 'No cumple') return 'bad';
    return 'na';
  }

  function getRiskClass(risk) {
    var value = String(risk || '').toLowerCase();
    if (value === 'bajo') return 'bajo';
    if (value === 'medio') return 'medio';
    if (value === 'alto') return 'alto';
    if (value === 'crítico' || value === 'critico') return 'critico';
    return '';
  }

  function renderRiskPill(risk) {
    var normalized = normalizeRiskValue(risk);
    var klass = getRiskClass(normalized);
    return '<span class="risk-pill' + (klass ? ' ' + klass : '') + '">' + esc(normalized || 'Sin riesgo') + '</span>';
  }

  function normalizeRiskValue(value) {
    if (!value) return '';
    if (value === 'Critico') return 'Crítico';
    return value;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    var units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes;
    var unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size = size / 1024;
      unit += 1;
    }
    return size.toFixed(unit === 0 ? 0 : 1) + ' ' + units[unit];
  }

  function makeId() {
    return 'f_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  }

  function formatDateName(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function openTutorial() {
    if (!dom.tutorialModal) return;
    dom.tutorialModal.classList.remove('hidden');
    dom.tutorialModal.setAttribute('aria-hidden', 'false');
  }

  function closeTutorial() {
    if (!dom.tutorialModal) return;
    dom.tutorialModal.classList.add('hidden');
    dom.tutorialModal.setAttribute('aria-hidden', 'true');
    writeLocal(TUTORIAL_KEY, '1');
  }

  // ---------------------------------------------------------------------
  // Persistencia real contra Supabase (reemplaza el antiguo localStorage).
  // ---------------------------------------------------------------------

  async function loadCurrentAudit() {
    var iso = findIsoById(state.selectedIsoId);
    if (!iso || !sb || !currentUser) return;

    if (currentAudit && currentAudit.iso_code === iso.id) return;

    var query = sb.from('audits')
      .select('*')
      .eq('iso_code', iso.id)
      .eq('status', 'in_progress')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    var result = await query.maybeSingle();

    if (result.error) {
      showToast('No se pudo leer la auditoría desde el servidor.');
      return;
    }

    var row = result.data;

    if (!row && !isReadOnlyUser()) {
      var insertResult = await sb.from('audits').insert({
        iso_code: iso.id,
        iso_version: iso.version || '',
        created_by: currentUser.id,
        auditor_id: currentUser.id
      }).select().single();

      if (insertResult.error) {
        showToast('No se pudo crear la auditoría en el servidor.');
        return;
      }
      row = insertResult.data;
    }

    currentAudit = row || null;
    syncedNoraCount = 0;
    syncedSignatureSource = '';

    state.project = {
      name: (currentAudit && currentAudit.name) || '',
      auditor: (currentAudit && currentAudit.auditor_name) || '',
      site: (currentAudit && currentAudit.site) || '',
      date: (currentAudit && currentAudit.audit_date) || '',
      scope: (currentAudit && currentAudit.scope) || '',
      docVersion: (currentAudit && currentAudit.doc_version) || '',
      auditedRep: (currentAudit && currentAudit.audited_rep) || ''
    };
    state.history = getEmptyHistoryRows();
    if (currentAudit && Object.prototype.toString.call(currentAudit.history) === '[object Array]') {
      var h;
      for (h = 0; h < state.history.length && h < currentAudit.history.length; h += 1) {
        var src = currentAudit.history[h] || {};
        state.history[h].version = src.version || '';
        state.history[h].date = src.date || '';
        state.history[h].author = src.author || '';
        state.history[h].description = src.description || '';
      }
    }
    state.findings = {};
    state.noraHistory = [];
    state.signature = { drawnDataUrl: '', uploadedDataUrl: '', uploadedName: '' };

    if (!currentAudit) return;

    var findingsResult = await sb.from('audit_findings').select('*').eq('audit_id', currentAudit.id);
    var findingRows = findingsResult.data || [];
    var findingIdByClause = {};
    var i;
    for (i = 0; i < findingRows.length; i += 1) {
      var f = findingRows[i];
      findingIdByClause[f.clause_id] = f.id;
      state.findings[f.clause_id] = {
        status: f.status || '',
        risk: f.risk || '',
        note: f.note || '',
        action: f.action || '',
        attachments: []
      };
    }

    var findingIds = findingRows.map(function (f) { return f.id; });
    if (findingIds.length) {
      var evidenceResult = await sb.from('audit_evidence').select('*').in('finding_id', findingIds);
      var evidenceRows = evidenceResult.data || [];
      var clauseByFindingId = {};
      var keys = Object.keys(findingIdByClause);
      for (i = 0; i < keys.length; i += 1) clauseByFindingId[findingIdByClause[keys[i]]] = keys[i];

      for (i = 0; i < evidenceRows.length; i += 1) {
        var ev = evidenceRows[i];
        var clauseId = clauseByFindingId[ev.finding_id];
        if (!clauseId || !state.findings[clauseId]) continue;
        state.findings[clauseId].attachments.push({
          id: ev.id,
          name: ev.file_name,
          size: ev.size_bytes || 0,
          type: ev.mime_type || 'application/octet-stream',
          storagePath: ev.storage_path,
          createdAt: ev.created_at
        });
      }
    }

    var noraResult = await sb.from('nora_conversations').select('*').eq('audit_id', currentAudit.id).order('created_at', { ascending: true });
    var noraRows = noraResult.data || [];
    for (i = 0; i < noraRows.length; i += 1) {
      state.noraHistory.push({
        id: noraRows[i].id,
        role: noraRows[i].role === 'user' ? 'user' : 'assistant',
        text: noraRows[i].message,
        createdAt: noraRows[i].created_at
      });
    }
    syncedNoraCount = state.noraHistory.length;

    var signatureResult = await sb.from('audit_signatures').select('*').eq('audit_id', currentAudit.id).maybeSingle();
    if (signatureResult.data && signatureResult.data.storage_path) {
      var signedUrlResult = await sb.storage.from(SIGNATURE_BUCKET).createSignedUrl(signatureResult.data.storage_path, 3600);
      if (signedUrlResult.data && signedUrlResult.data.signedUrl) {
        var signatureDataUrl = await urlToDataUrl(signedUrlResult.data.signedUrl);
        if (signatureDataUrl) {
          state.signature.drawnDataUrl = signatureDataUrl;
          syncedSignatureSource = signatureDataUrl;
        }
      }
    }
  }

  async function urlToDataUrl(url) {
    try {
      var response = await fetch(url);
      var blob = await response.blob();
      return await new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '')); };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return '';
    }
  }

  function saveState() {
    state.noraHistory = normalizeNoraHistory(state.noraHistory);
    if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer);
    saveDebounceTimer = window.setTimeout(persistStateToSupabase, 700);
  }

  async function persistStateToSupabase() {
    if (!sb || !currentAudit || !currentUser || isReadOnlyUser()) return;

    try {
      await sb.from('audits').update({
        name: state.project.name || '',
        auditor_name: state.project.auditor || '',
        site: state.project.site || '',
        audit_date: state.project.date || '',
        scope: state.project.scope || '',
        doc_version: state.project.docVersion || '',
        audited_rep: state.project.auditedRep || '',
        history: state.history
      }).eq('id', currentAudit.id);

      var clauseIds = Object.keys(state.findings);
      if (clauseIds.length) {
        var rows = clauseIds.map(function (clauseId) {
          var f = state.findings[clauseId];
          return {
            audit_id: currentAudit.id,
            clause_id: clauseId,
            status: f.status || '',
            risk: f.risk || '',
            note: f.note || '',
            action: f.action || '',
            updated_by: currentUser.id
          };
        });
        await sb.from('audit_findings').upsert(rows, { onConflict: 'audit_id,clause_id' });
      }

      if (state.noraHistory.length > syncedNoraCount) {
        var newMessages = state.noraHistory.slice(syncedNoraCount).map(function (item) {
          return {
            audit_id: currentAudit.id,
            role: item.role === 'user' ? 'user' : 'model',
            message: item.text
          };
        });
        await sb.from('nora_conversations').insert(newMessages);
        syncedNoraCount = state.noraHistory.length;
      }

      var activeSignature = state.signature.drawnDataUrl || state.signature.uploadedDataUrl;
      if (activeSignature && activeSignature.indexOf('data:') === 0 && activeSignature !== syncedSignatureSource) {
        await uploadSignature(activeSignature);
        syncedSignatureSource = activeSignature;
      }
    } catch (err) {
      showToast('No se pudo sincronizar con el servidor.');
    }
  }

  async function uploadSignature(dataUrl) {
    var blob = dataUrlToBlob(dataUrl);
    if (!blob) return;
    var path = currentUser.id + '/' + currentAudit.id + '.png';

    var uploadResult = await sb.storage.from(SIGNATURE_BUCKET).upload(path, blob, {
      contentType: 'image/png',
      upsert: true
    });
    if (uploadResult.error) {
      showToast('No se pudo guardar la firma en el servidor.');
      return;
    }

    await sb.from('audit_signatures').upsert({
      audit_id: currentAudit.id,
      storage_path: path,
      signed_by: currentUser.id,
      signed_at: new Date().toISOString()
    }, { onConflict: 'audit_id' });
  }

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || '').split(',');
    if (parts.length < 2) return null;
    var match = /data:(.*?);base64/.exec(parts[0]);
    var mime = match ? match[1] : 'image/png';
    var binary = window.atob(parts[1]);
    var bytes = new Uint8Array(binary.length);
    var i;
    for (i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function readLocal(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function writeLocal(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      // ignore quota errors
    }
  }

  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      dom.toast.classList.remove('show');
    }, 2200);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getEmptyHistoryRows() {
    return [
      { version: '', date: '', author: '', description: '' },
      { version: '', date: '', author: '', description: '' },
      { version: '', date: '', author: '', description: '' }
    ];
  }

  function cacheLogoDataUrl() {
    if (!dom.headerLogo) return;

    var img = dom.headerLogo;
    var assignDataUrl = function () {
      logoDataUrl = imageToDataUrl(img);
    };

    if (img.complete && img.naturalWidth > 0) {
      assignDataUrl();
      return;
    }

    img.addEventListener('load', assignDataUrl, { once: true });
  }

  function imageToDataUrl(image) {
    if (!image || !image.naturalWidth || !image.naturalHeight) return '';

    try {
      var canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      var ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (err) {
      return '';
    }
  }

  function textEs(value) {
    var text = String(value == null ? '' : value);
    var pairs = [
      ['Gestion', 'Gestión'],
      ['gestion', 'gestión'],
      ['Auditoria', 'Auditoría'],
      ['auditoria', 'auditoría'],
      ['Auditorias', 'Auditorías'],
      ['auditorias', 'auditorías'],
      ['Informacion', 'Información'],
      ['informacion', 'información'],
      ['Organizacion', 'Organización'],
      ['organizacion', 'organización'],
      ['Direccion', 'Dirección'],
      ['direccion', 'dirección'],
      ['Analisis', 'Análisis'],
      ['analisis', 'análisis'],
      ['Revision', 'Revisión'],
      ['revision', 'revisión'],
      ['Accion', 'Acción'],
      ['accion', 'acción'],
      ['Politica', 'Política'],
      ['politica', 'política'],
      ['Comunicacion', 'Comunicación'],
      ['comunicacion', 'comunicación'],
      ['Medicion', 'Medición'],
      ['medicion', 'medición'],
      ['Satisfaccion', 'Satisfacción'],
      ['satisfaccion', 'satisfacción'],
      ['Diseno', 'Diseño'],
      ['diseno', 'diseño'],
      ['Produccion', 'Producción'],
      ['produccion', 'producción'],
      ['Provision', 'Provisión'],
      ['provision', 'provisión'],
      ['Desempeno', 'Desempeño'],
      ['desempeno', 'desempeño'],
      ['Retencion', 'Retención'],
      ['retencion', 'retención'],
      ['Catalogo', 'Catálogo'],
      ['catalogo', 'catálogo'],
      ['Pagina', 'Página'],
      ['pagina', 'página'],
      ['Despues', 'Después'],
      ['despues', 'después'],
      ['Que', 'Qué'],
      ['Duenos', 'Dueños'],
      ['duenos', 'dueños'],
      ['Critico', 'Crítico'],
      ['critico', 'crítico']
    ];

    var i;
    for (i = 0; i < pairs.length; i += 1) {
      text = text.replace(new RegExp('\\b' + pairs[i][0] + '\\b', 'g'), pairs[i][1]);
    }
    return text;
  }
})();
