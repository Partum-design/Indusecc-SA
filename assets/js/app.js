(function () {
  'use strict';

  var STORAGE_KEY = 'sg_audit_state_v4';
  var TUTORIAL_KEY = 'sg_audit_tutorial_seen_v1';

  var ISO_LIBRARY = [];
  var dom = {};
  var toastTimer = null;
  var logoDataUrl = '';
  var signatureCtx = null;
  var isDrawing = false;
  var FRAMEWORK_FILTERS = [
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
    frameworkCategory: 'seguridad'
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
      signature: {
        drawnDataUrl: '',
        uploadedDataUrl: '',
        uploadedName: ''
      }
    };
  }

  function init() {
    cacheDom();
    ISO_LIBRARY = normalizeLibrary(window.ISO_LIBRARY);

    if (!ISO_LIBRARY.length) {
      showToast('No se pudo cargar el catálogo ISO. Recarga la página.');
      return;
    }

    loadState();
    applyDefaultIso();
    bindEvents();
    setupSignatureCanvas();
    syncProjectForm();
    renderFrameworkTabs();
    syncFilterControls();
    renderIsoOptions();
    renderIsoQuickSelector();
    renderIsoDetailCard(findIsoById(state.selectedIsoId));
    renderSignaturePreview();
    cacheLogoDataUrl();

    if (!readLocal(TUTORIAL_KEY)) openTutorial();

    saveState();
  }

  function cacheDom() {
    dom.onboarding = document.getElementById('iso-onboarding');
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
    dom.toast = document.getElementById('toast');
    dom.headerLogo = document.querySelector('.project-panel .brand-logo') || document.querySelector('.hero-logo');
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
    var preferred = findIsoById('iso27001');
    if (!state.selectedIsoId || !findIsoById(state.selectedIsoId)) {
      state.selectedIsoId = preferred ? preferred.id : ISO_LIBRARY[0].id;
    }
    uiFilters.frameworkCategory = mapIsoToFramework(state.selectedIsoId);
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

    if (dom.openTutorialOnboarding) {
      dom.openTutorialOnboarding.addEventListener('click', openTutorial);
    }

    if (dom.openTutorialApp) {
      dom.openTutorialApp.addEventListener('click', openTutorial);
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
        uiFilters.frameworkQuery = String(dom.frameworkSearch.value || '').trim().toLowerCase();
        renderIsoOptions();
      });
    }

    if (dom.frameworkTabs) {
      dom.frameworkTabs.addEventListener('click', function (event) {
        var target = event.target;
        if (!target) return;
        var button = target.closest('button[data-framework]');
        if (!button) return;
        uiFilters.frameworkCategory = String(button.getAttribute('data-framework') || 'seguridad');
        renderFrameworkTabs();
        renderIsoOptions();
      });
    }

    if (dom.clauseSearch) {
      dom.clauseSearch.addEventListener('input', function () {
        uiFilters.query = String(dom.clauseSearch.value || '').trim().toLowerCase();
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
        if (!window.confirm('Se limpiará toda la información de esta auditoría. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.clearSignature) {
      dom.clearSignature.addEventListener('click', function () {
        clearSignatureCanvas();
        state.signature.drawnDataUrl = '';
        saveState();
        renderSignaturePreview();
      });
    }

    if (dom.signatureFile) {
      dom.signatureFile.addEventListener('change', onSignatureFileChange);
    }
  }

  function bindProjectField(input, key) {
    if (!input) return;
    input.addEventListener('input', function () {
      state.project[key] = input.value;
      saveState();
    });
  }

  function bindHistoryFields() {
    if (!dom.historyInputs || !dom.historyInputs.length) return;

    var i;
    for (i = 0; i < dom.historyInputs.length; i += 1) {
      dom.historyInputs[i].addEventListener('input', function () {
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
    if (!signatureCtx || !dom.signatureCanvas) return;
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

      html += ''
        + '<article class="iso-option' + activeClass + '" data-iso="' + esc(iso.id) + '">'
        + '  <h4><i class="' + esc(icon) + '"></i> ' + esc(iso.code) + ' <small>(' + esc(iso.version || '') + ')</small></h4>'
        + '  <p>' + esc(textEs(iso.focus || '')) + '</p>'
        + '  <p>' + esc(textEs(iso.summary || '')) + '</p>'
        + '  <p class="iso-tag">' + esc(String(countClauses(iso))) + ' puntos auditables</p>'
        + '</article>';
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
        state.selectedIsoId = isoId;
        uiFilters.frameworkCategory = mapIsoToFramework(isoId);
        saveState();
        renderFrameworkTabs();
        renderIsoOptions();
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

  function renderIsoDetailCard(iso) {
    if (!dom.isoDetailCard) return;
    if (!iso) {
      dom.isoDetailCard.innerHTML = '<p>No se encontró información del estándar seleccionado.</p>';
      return;
    }

    var totalClauses = countClauses(iso);
    var sections = iso.sections ? iso.sections.length : 0;
    var icon = iso.icon || 'fa-solid fa-shield-halved';

    dom.isoDetailCard.innerHTML = ''
      + '<h4><i class="' + esc(icon) + '"></i> ' + esc(iso.code) + ' <small>(' + esc(iso.version || 'N/D') + ')</small></h4>'
      + '<p>' + esc(textEs(iso.summary || '')) + '</p>'
      + '<p>' + esc(textEs(iso.focus || '')) + '</p>'
      + '<div class="iso-detail-meta">'
      + '  <span class="iso-detail-badge">' + esc(String(totalClauses)) + ' puntos auditables</span>'
      + '  <span class="iso-detail-badge">' + esc(String(sections)) + ' secciones</span>'
      + '</div>';

    if (dom.activeIso) {
      dom.activeIso.textContent = iso.code + ' ' + (iso.version || '');
    }
  }

  function setSelectedIso(isoId) {
    var iso = findIsoById(isoId);
    if (!iso) return;

    state.selectedIsoId = iso.id;
    uiFilters.frameworkCategory = mapIsoToFramework(iso.id);
    saveState();

    renderFrameworkTabs();
    renderIsoOptions();
    renderIsoQuickSelector();
    renderIsoDetailCard(iso);

    if (!dom.app || dom.app.classList.contains('hidden')) return;

    ensureFindingsSkeleton(iso);
    ensureActiveSection(iso);
    renderSectionTabs(iso);
    renderChecklist(iso);
    renderMetrics(iso);
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
    renderFrameworkTabs();
    renderIsoOptions();
    if (dom.onboarding) dom.onboarding.classList.remove('hidden');
    if (dom.app) dom.app.classList.add('hidden');
  }

  function openAuditWorkspace() {
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('No se encontró la ISO seleccionada.');
      return;
    }

    ensureFindingsSkeleton(iso);
    if (dom.onboarding) dom.onboarding.classList.add('hidden');
    if (dom.app) dom.app.classList.remove('hidden');

    if (dom.isoUpdatedNote) dom.isoUpdatedNote.textContent = textEs(iso.updatedNote || '');

    renderIsoQuickSelector();
    renderIsoDetailCard(iso);
    ensureActiveSection(iso);
    syncProjectForm();
    renderSectionTabs(iso);
    renderChecklist(iso);
    renderMetrics(iso);
    renderSignaturePreview();
    saveState();
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
    return textBag.join(' ').toLowerCase().indexOf(uiFilters.query) !== -1;
  }

  function riskToFilterKey(value) {
    var risk = normalizeRiskValue(value);
    if (!risk) return '';
    var key = String(risk).toLowerCase();
    if (key === 'crítico') return 'critico';
    return key;
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
    var button = event.target.closest ? event.target.closest('button[data-action="remove-attachment"]') : null;
    if (!button) return;
    removeAttachment(button.getAttribute('data-clause-id'), button.getAttribute('data-file-id'));
  }

  function addAttachmentsToClause(clauseId, fileList) {
    var finding = state.findings[clauseId] || newEmptyFinding();
    var attachments = finding.attachments || [];
    var i;

    for (i = 0; i < fileList.length; i += 1) {
      var file = fileList[i];
      attachments.push({
        id: makeId(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString()
      });
    }

    finding.attachments = attachments;
    state.findings[clauseId] = finding;
    saveState();

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      renderChecklist(iso);
      renderMetrics(iso);
    }

    showToast('Archivo(s) agregado(s) al punto ' + clauseId + '.');
  }

  function removeAttachment(clauseId, fileId) {
    var finding = state.findings[clauseId] || newEmptyFinding();
    var attachments = finding.attachments || [];
    var filtered = [];
    var i;

    for (i = 0; i < attachments.length; i += 1) {
      if (attachments[i].id !== fileId) filtered.push(attachments[i]);
    }

    finding.attachments = filtered;
    state.findings[clauseId] = finding;
    saveState();

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

  function exportReportPdf() {
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
      showToast('PDF exportado correctamente.');
    } catch (err) {
      showToast('Error al exportar PDF.');
    }
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

  function clearCurrentAudit() {
    state.project = {
      name: '',
      auditor: '',
      site: '',
      date: '',
      scope: '',
      docVersion: '',
      auditedRep: ''
    };
    state.history = getEmptyHistoryRows();
    state.findings = {};
    state.signature = {
      drawnDataUrl: '',
      uploadedDataUrl: '',
      uploadedName: ''
    };

    clearSignatureCanvas();
    renderSignaturePreview();
    if (dom.signatureFile) dom.signatureFile.value = '';

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      ensureFindingsSkeleton(iso);
      renderSectionTabs(iso);
      renderChecklist(iso);
      renderMetrics(iso);
    }

    syncProjectForm();
    saveState();
    showToast('Proyecto limpio.');
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
    var category = uiFilters.frameworkCategory || 'seguridad';
    var i;

    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      var iso = ISO_LIBRARY[i];
      var isoCategory = mapIsoToFramework(iso.id);
      if (category && isoCategory !== category) continue;
      if (query && !isoMatchesQuery(iso, query)) continue;
      out.push(iso);
    }

    return out;
  }

  function isoMatchesQuery(iso, query) {
    var bag = [iso.code, iso.version, iso.focus, iso.summary].join(' ').toLowerCase();
    return bag.indexOf(query) !== -1;
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
    var active = dom.isoOptions.querySelector('.iso-option.active');
    if (!active || typeof active.scrollIntoView !== 'function') return;
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

  function loadState() {
    var raw = readLocal(STORAGE_KEY);
    if (!raw) return;

    try {
      var parsed = JSON.parse(raw);
      if (!parsed) return;

      if (parsed.selectedIsoId) state.selectedIsoId = parsed.selectedIsoId;

      if (parsed.project && typeof parsed.project === 'object') {
        state.project.name = parsed.project.name || '';
        state.project.auditor = parsed.project.auditor || '';
        state.project.site = parsed.project.site || '';
        state.project.date = parsed.project.date || '';
        state.project.scope = parsed.project.scope || '';
        state.project.docVersion = parsed.project.docVersion || '';
        state.project.auditedRep = parsed.project.auditedRep || '';
      }

      if (parsed.history && Object.prototype.toString.call(parsed.history) === '[object Array]') {
        state.history = getEmptyHistoryRows();
        var i;
        for (i = 0; i < state.history.length; i += 1) {
          var source = parsed.history[i] || {};
          state.history[i].version = source.version || '';
          state.history[i].date = source.date || '';
          state.history[i].author = source.author || '';
          state.history[i].description = source.description || '';
        }
      }

      if (parsed.findings && typeof parsed.findings === 'object') {
        state.findings = parsed.findings;
      }

      if (parsed.signature && typeof parsed.signature === 'object') {
        state.signature.drawnDataUrl = parsed.signature.drawnDataUrl || '';
        state.signature.uploadedDataUrl = parsed.signature.uploadedDataUrl || '';
        state.signature.uploadedName = parsed.signature.uploadedName || '';
      }
    } catch (err) {
      state = createInitialState();
    }
  }

  function saveState() {
    try {
      writeLocal(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      showToast('No se pudo guardar el estado local.');
    }
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
