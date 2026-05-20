(function () {
  'use strict';

  var STORAGE_KEY = 'sg_audit_state_v1';

  var state = {
    selectedIsoId: null,
    project: {
      name: '',
      auditor: '',
      site: '',
      date: '',
      scope: ''
    },
    findings: {}
  };

  var dom = {};
  var ISO_LIBRARY = [];

  var FALLBACK_ISO_LIBRARY = [
    {
      id: 'iso9001',
      code: 'ISO 9001',
      version: '2015',
      focus: 'Calidad',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '9001-a',
          title: 'Contexto y Liderazgo',
          clauses: [
            { id: '9001-4.1', title: 'Contexto', question: 'Se entiende el contexto interno y externo del SGC?' },
            { id: '9001-5.1', title: 'Liderazgo', question: 'La direccion demuestra liderazgo y compromiso?' }
          ]
        },
        {
          id: '9001-b',
          title: 'Operacion y Mejora',
          clauses: [
            { id: '9001-8.1', title: 'Operacion', question: 'Se controlan los procesos operativos planificados?' },
            { id: '9001-10.2', title: 'Accion correctiva', question: 'Se tratan no conformidades y causas raiz?' }
          ]
        }
      ]
    },
    {
      id: 'iso27001',
      code: 'ISO/IEC 27001',
      version: '2022',
      focus: 'Seguridad de la informacion',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '27001-a',
          title: 'Riesgo y Controles',
          clauses: [
            { id: '27001-6.1.2', title: 'Evaluacion de riesgos', question: 'Existe metodologia de riesgos y resultados vigentes?' },
            { id: '27001-6.1.3', title: 'Tratamiento de riesgos', question: 'Hay plan de tratamiento y declaracion de aplicabilidad?' }
          ]
        },
        {
          id: '27001-b',
          title: 'Revision y Mejora',
          clauses: [
            { id: '27001-9.2', title: 'Auditoria interna', question: 'Se ejecuta programa de auditoria del SGSI?' },
            { id: '27001-10.1', title: 'Mejora', question: 'Se aplican acciones de mejora continua del SGSI?' }
          ]
        }
      ]
    },
    {
      id: 'iso37001',
      code: 'ISO 37001',
      version: '2025',
      focus: 'Antisoborno',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '37001-a',
          title: 'Riesgo y Gobernanza',
          clauses: [
            { id: '37001-4.5', title: 'Riesgo de soborno', question: 'Se evalua el riesgo de soborno periodicamente?' },
            { id: '37001-5.3', title: 'Funcion de cumplimiento', question: 'Existe funcion antisoborno independiente y con autoridad?' }
          ]
        },
        {
          id: '37001-b',
          title: 'Canal y Mejora',
          clauses: [
            { id: '37001-8.9', title: 'Canal de denuncias', question: 'El canal es confiable y protege a denunciantes?' },
            { id: '37001-10.2', title: 'Accion correctiva', question: 'Se corrigen desviaciones con eficacia comprobada?' }
          ]
        }
      ]
    },
    {
      id: 'iso14001',
      code: 'ISO 14001',
      version: '2015',
      focus: 'Gestion ambiental',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '14001-a',
          title: 'Aspectos y Cumplimiento',
          clauses: [
            { id: '14001-6.1.2', title: 'Aspectos ambientales', question: 'Se identifican aspectos e impactos significativos?' },
            { id: '14001-6.1.3', title: 'Cumplimiento', question: 'Se controlan requisitos legales ambientales?' }
          ]
        }
      ]
    },
    {
      id: 'iso45001',
      code: 'ISO 45001',
      version: '2018',
      focus: 'Seguridad y salud ocupacional',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '45001-a',
          title: 'Peligros y Controles',
          clauses: [
            { id: '45001-6.1.2', title: 'Peligros', question: 'Se identifican peligros y evalua riesgo SST?' },
            { id: '45001-8.1', title: 'Control operacional', question: 'Hay controles definidos para actividades criticas?' }
          ]
        }
      ]
    },
    {
      id: 'iso22000',
      code: 'ISO 22000',
      version: '2018',
      focus: 'Inocuidad alimentaria',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '22000-a',
          title: 'PRP y HACCP',
          clauses: [
            { id: '22000-7.2', title: 'PRP', question: 'Se controlan programas prerrequisito de inocuidad?' },
            { id: '22000-8.5', title: 'Peligros', question: 'Se analiza peligros y define controles?' }
          ]
        }
      ]
    },
    {
      id: 'iso50001',
      code: 'ISO 50001',
      version: '2018',
      focus: 'Gestion energetica',
      updatedNote: 'Referencia cargada localmente',
      sections: [
        {
          id: '50001-a',
          title: 'Desempeno energetico',
          clauses: [
            { id: '50001-6.3', title: 'Revision energetica', question: 'Se identifican usos significativos de energia?' },
            { id: '50001-9.1', title: 'Seguimiento', question: 'Se monitorea desempeno energetico con indicadores?' }
          ]
        }
      ]
    }
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    ISO_LIBRARY = getLibrary();

    if (!ISO_LIBRARY || !ISO_LIBRARY.length) {
      ISO_LIBRARY = FALLBACK_ISO_LIBRARY;
    }

    loadState();

    if (!state.selectedIsoId || !findIsoById(state.selectedIsoId)) {
      state.selectedIsoId = ISO_LIBRARY[0].id;
    }

    renderIsoOptions();
    bindEvents();
    saveState();
  }

  function cacheDom() {
    dom.onboarding = document.getElementById('iso-onboarding');
    dom.isoOptions = document.getElementById('iso-options');
    dom.startAudit = document.getElementById('start-audit');
    dom.app = document.getElementById('app');
    dom.activeIso = document.getElementById('active-iso');
    dom.changeIso = document.getElementById('change-iso');
    dom.checklistRoot = document.getElementById('checklist-root');
    dom.isoUpdatedNote = document.getElementById('iso-updated-note');
    dom.metrics = document.getElementById('metrics');
    dom.projectName = document.getElementById('project-name');
    dom.auditorName = document.getElementById('auditor-name');
    dom.auditSite = document.getElementById('audit-site');
    dom.auditDate = document.getElementById('audit-date');
    dom.auditScope = document.getElementById('audit-scope');
    dom.exportPdf = document.getElementById('export-pdf');
    dom.clearProject = document.getElementById('clear-project');
    dom.toast = document.getElementById('toast');
  }

  function getLibrary() {
    if (window.ISO_LIBRARY && Object.prototype.toString.call(window.ISO_LIBRARY) === '[object Array]') {
      return window.ISO_LIBRARY;
    }
    return FALLBACK_ISO_LIBRARY;
  }

  function bindEvents() {
    if (dom.startAudit) {
      dom.startAudit.disabled = false;
      dom.startAudit.addEventListener('click', function () {
        if (!state.selectedIsoId && ISO_LIBRARY.length) {
          state.selectedIsoId = ISO_LIBRARY[0].id;
        }
        openAuditWorkspace();
      });
    }

    if (dom.changeIso) {
      dom.changeIso.addEventListener('click', function () {
        showOnboarding();
      });
    }

    bindProjectField(dom.projectName, 'name');
    bindProjectField(dom.auditorName, 'auditor');
    bindProjectField(dom.auditSite, 'site');
    bindProjectField(dom.auditDate, 'date');
    bindProjectField(dom.auditScope, 'scope');

    if (dom.checklistRoot) {
      dom.checklistRoot.addEventListener('change', onChecklistChange);
      dom.checklistRoot.addEventListener('input', onChecklistChange);
    }

    if (dom.exportPdf) {
      dom.exportPdf.addEventListener('click', exportReport);
    }

    if (dom.clearProject) {
      dom.clearProject.addEventListener('click', function () {
        if (!window.confirm('Se eliminara la informacion capturada del proyecto actual. Continuar?')) {
          return;
        }
        clearProject();
      });
    }
  }

  function bindProjectField(input, key) {
    if (!input) return;
    input.value = state.project[key] || '';
    input.addEventListener('input', function () {
      state.project[key] = input.value;
      saveState();
      renderMetrics();
    });
  }

  function renderIsoOptions() {
    if (!dom.isoOptions) return;

    var html = '';
    var i;

    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      var iso = ISO_LIBRARY[i];
      var activeClass = state.selectedIsoId === iso.id ? ' active' : '';
      html += '<article class="iso-option' + activeClass + '" data-iso="' + esc(iso.id) + '">'
        + '<h4>' + esc(iso.code) + ' <small>(' + esc(iso.version || '') + ')</small></h4>'
        + '<p>' + esc(iso.focus || '') + '</p>'
        + '<p>' + esc((iso.summary || iso.updatedNote || '')) + '</p>'
        + '</article>';
    }

    dom.isoOptions.innerHTML = html;

    var cards = dom.isoOptions.querySelectorAll('.iso-option');
    for (i = 0; i < cards.length; i += 1) {
      cards[i].addEventListener('click', function () {
        state.selectedIsoId = this.getAttribute('data-iso');
        saveState();
        renderIsoOptions();
      });
    }
  }

  function openAuditWorkspace() {
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('No se encontro la norma seleccionada.');
      return;
    }

    ensureFindingsForIso(iso);

    if (dom.onboarding) dom.onboarding.classList.add('hidden');
    if (dom.app) dom.app.classList.remove('hidden');
    if (dom.activeIso) dom.activeIso.textContent = iso.code + ' ' + (iso.version || '');
    if (dom.isoUpdatedNote) dom.isoUpdatedNote.textContent = iso.updatedNote || '';

    renderChecklist(iso);
    renderMetrics();
    saveState();
  }

  function showOnboarding() {
    if (dom.onboarding) dom.onboarding.classList.remove('hidden');
    if (dom.app) dom.app.classList.add('hidden');
  }

  function findIsoById(id) {
    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      if (ISO_LIBRARY[i].id === id) return ISO_LIBRARY[i];
    }
    return null;
  }

  function ensureFindingsForIso(iso) {
    var valid = {};
    var s;
    var c;

    for (s = 0; s < iso.sections.length; s += 1) {
      for (c = 0; c < iso.sections[s].clauses.length; c += 1) {
        var clause = iso.sections[s].clauses[c];
        valid[clause.id] = true;
        if (!state.findings[clause.id]) {
          state.findings[clause.id] = {
            status: '',
            risk: '',
            note: '',
            action: '',
            evidences: []
          };
        }
      }
    }

    var keys = Object.keys(state.findings);
    for (s = 0; s < keys.length; s += 1) {
      if (!valid[keys[s]]) {
        delete state.findings[keys[s]];
      }
    }
  }

  function renderChecklist(iso) {
    if (!dom.checklistRoot) return;

    var html = '';
    var s;
    var c;

    for (s = 0; s < iso.sections.length; s += 1) {
      var section = iso.sections[s];
      html += '<section class="section-block">';
      html += '<header class="section-head"><h4>' + esc(section.title) + '</h4></header>';
      html += '<div class="findings-list">';

      for (c = 0; c < section.clauses.length; c += 1) {
        var clause = section.clauses[c];
        var finding = state.findings[clause.id] || {
          status: '', risk: '', note: '', action: '', evidences: []
        };

        html += renderClauseCard(clause, finding);
      }

      html += '</div></section>';
    }

    dom.checklistRoot.innerHTML = html;
  }

  function renderClauseCard(clause, finding) {
    var evidences = finding.evidences || [];
    var evidenceHtml = '';
    var i;

    if (!evidences.length) {
      evidenceHtml = '<div class="evidence-item"><span class="evidence-meta">Sin evidencias adjuntas.</span></div>';
    } else {
      for (i = 0; i < evidences.length; i += 1) {
        evidenceHtml += '<article class="evidence-item">'
          + '<div class="evidence-meta"><strong>' + esc(evidences[i]) + '</strong></div>'
          + '</article>';
      }
    }

    return '<article class="finding-card" data-clause-id="' + esc(clause.id) + '">'
      + '<div class="finding-head">'
      + '<div><h5>' + esc(clause.id) + ' · ' + esc(clause.title) + '</h5><p>' + esc(clause.question) + '</p></div>'
      + '<span class="badge-status ' + statusClass(finding.status) + '">' + esc(finding.status || 'Sin evaluar') + '</span>'
      + '</div>'
      + '<div class="finding-grid">'
      + '<label>Conformidad'
      + '<select data-field="status" data-clause-id="' + esc(clause.id) + '">'
      + optionTag('', finding.status)
      + optionTag('Cumple', finding.status)
      + optionTag('Parcial', finding.status)
      + optionTag('No cumple', finding.status)
      + optionTag('N/A', finding.status)
      + '</select>'
      + '</label>'
      + '<label>Riesgo'
      + '<select data-field="risk" data-clause-id="' + esc(clause.id) + '">'
      + optionTag('', finding.risk)
      + optionTag('Bajo', finding.risk)
      + optionTag('Medio', finding.risk)
      + optionTag('Alto', finding.risk)
      + optionTag('Critico', finding.risk)
      + '</select>'
      + '</label>'
      + '<label class="wide">Hallazgo'
      + '<textarea rows="2" data-field="note" data-clause-id="' + esc(clause.id) + '">' + esc(finding.note || '') + '</textarea>'
      + '</label>'
      + '<label class="wide">Accion sugerida'
      + '<textarea rows="2" data-field="action" data-clause-id="' + esc(clause.id) + '">' + esc(finding.action || '') + '</textarea>'
      + '</label>'
      + '</div>'
      + '<div class="evidence-tools">'
      + '<input type="file" multiple data-field="evidence" data-clause-id="' + esc(clause.id) + '" />'
      + '</div>'
      + '<div class="evidence-list">' + evidenceHtml + '</div>'
      + '</article>';
  }

  function optionTag(value, selected) {
    var label = value || 'Seleccionar';
    var sel = value === selected ? ' selected' : '';
    return '<option value="' + esc(value) + '"' + sel + '>' + esc(label) + '</option>';
  }

  function statusClass(status) {
    if (status === 'Cumple') return 'ok';
    if (status === 'Parcial') return 'warn';
    if (status === 'No cumple') return 'bad';
    return 'na';
  }

  function onChecklistChange(event) {
    var target = event.target;
    var clauseId = target.getAttribute('data-clause-id');
    var field = target.getAttribute('data-field');

    if (!clauseId || !field) return;

    if (!state.findings[clauseId]) {
      state.findings[clauseId] = {
        status: '', risk: '', note: '', action: '', evidences: []
      };
    }

    if (field === 'evidence') {
      var files = target.files || [];
      var names = [];
      var i;
      for (i = 0; i < files.length; i += 1) {
        names.push(files[i].name);
      }
      state.findings[clauseId].evidences = names;
      saveState();
      var iso = findIsoById(state.selectedIsoId);
      if (iso) renderChecklist(iso);
      renderMetrics();
      return;
    }

    state.findings[clauseId][field] = target.value;
    saveState();
    renderMetrics();

    if (field === 'status') {
      var card = target.closest ? target.closest('.finding-card') : null;
      if (card) {
        var badge = card.querySelector('.badge-status');
        if (badge) {
          badge.className = 'badge-status ' + statusClass(target.value);
          badge.textContent = target.value || 'Sin evaluar';
        }
      }
    }
  }

  function renderMetrics() {
    if (!dom.metrics) return;
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      dom.metrics.innerHTML = '';
      return;
    }

    var clauses = flattenClauses(iso);
    var total = clauses.length;
    var evaluated = 0;
    var ok = 0;
    var partial = 0;
    var bad = 0;
    var evidences = 0;
    var i;

    for (i = 0; i < clauses.length; i += 1) {
      var finding = state.findings[clauses[i].id] || {};
      var status = finding.status || '';
      if (status) evaluated += 1;
      if (status === 'Cumple') ok += 1;
      if (status === 'Parcial') partial += 1;
      if (status === 'No cumple') bad += 1;
      evidences += (finding.evidences || []).length;
    }

    var progress = total ? Math.round((evaluated / total) * 100) : 0;

    dom.metrics.innerHTML = ''
      + metricCard(progress + '%', 'avance general')
      + metricCard(String(ok), 'cumple')
      + metricCard(String(partial), 'parcial')
      + metricCard(String(bad), 'no cumple')
      + metricCard(String(evidences), 'evidencias')
      + metricCard(String(total), 'requisitos');
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

  function exportReport() {
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('Selecciona una norma para exportar.');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }

    try {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ unit: 'pt', format: 'a4' });
      var y = 44;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Plataforma de Gestion de Auditorias', 40, y);
      y += 22;

      doc.setFontSize(12);
      doc.text(iso.code + ' ' + (iso.version || ''), 40, y);
      y += 22;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Proyecto: ' + (state.project.name || 'N/D'), 40, y); y += 14;
      doc.text('Auditor: ' + (state.project.auditor || 'N/D'), 40, y); y += 14;
      doc.text('Sitio: ' + (state.project.site || 'N/D'), 40, y); y += 14;
      doc.text('Fecha: ' + (state.project.date || 'N/D'), 40, y); y += 18;

      var clauses = flattenClauses(iso);
      var i;
      for (i = 0; i < clauses.length; i += 1) {
        var f = state.findings[clauses[i].id] || {};
        if (y > 770) {
          doc.addPage();
          y = 44;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(clauses[i].id + ' - ' + clauses[i].title, 40, y); y += 12;
        doc.setFont('helvetica', 'normal');
        doc.text('Estado: ' + (f.status || 'Sin evaluar') + ' | Riesgo: ' + (f.risk || 'N/D'), 46, y); y += 12;
        var note = 'Hallazgo: ' + (f.note || 'N/D');
        var lines = doc.splitTextToSize(note, 520);
        doc.text(lines, 46, y);
        y += (lines.length * 11) + 6;
      }

      var date = new Date();
      var fileName = 'Auditoria_' + iso.code.replace(/[^a-zA-Z0-9]/g, '') + '_' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '.pdf';
      doc.save(fileName);
      showToast('PDF generado.');
    } catch (e) {
      showToast('Error al exportar PDF.');
    }
  }

  function clearProject() {
    state.project = { name: '', auditor: '', site: '', date: '', scope: '' };
    state.findings = {};

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      ensureFindingsForIso(iso);
      renderChecklist(iso);
    }

    if (dom.projectName) dom.projectName.value = '';
    if (dom.auditorName) dom.auditorName.value = '';
    if (dom.auditSite) dom.auditSite.value = '';
    if (dom.auditDate) dom.auditDate.value = '';
    if (dom.auditScope) dom.auditScope.value = '';

    renderMetrics();
    saveState();
    showToast('Proyecto limpio.');
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (!parsed) return;

      if (parsed.selectedIsoId) state.selectedIsoId = parsed.selectedIsoId;
      if (parsed.project) {
        state.project.name = parsed.project.name || '';
        state.project.auditor = parsed.project.auditor || '';
        state.project.site = parsed.project.site || '';
        state.project.date = parsed.project.date || '';
        state.project.scope = parsed.project.scope || '';
      }
      if (parsed.findings && typeof parsed.findings === 'object') {
        state.findings = parsed.findings;
      }
    } catch (e) {
      state.selectedIsoId = null;
      state.findings = {};
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast('No se pudo guardar en navegador.');
    }
  }

  function showToast(msg) {
    if (!dom.toast) return;
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    window.setTimeout(function () {
      dom.toast.classList.remove('show');
    }, 1800);
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
