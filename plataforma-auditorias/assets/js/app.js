import { ISO_LIBRARY } from './iso-library.js';

const STORAGE_KEY = 'oda_auditoria_v2';

const state = {
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

const dom = {
  onboarding: document.getElementById('iso-onboarding'),
  isoOptions: document.getElementById('iso-options'),
  startAudit: document.getElementById('start-audit'),
  app: document.getElementById('app'),
  activeIso: document.getElementById('active-iso'),
  changeIso: document.getElementById('change-iso'),
  checklistRoot: document.getElementById('checklist-root'),
  isoUpdatedNote: document.getElementById('iso-updated-note'),
  metrics: document.getElementById('metrics'),
  projectName: document.getElementById('project-name'),
  auditorName: document.getElementById('auditor-name'),
  auditSite: document.getElementById('audit-site'),
  auditDate: document.getElementById('audit-date'),
  auditScope: document.getElementById('audit-scope'),
  exportPdf: document.getElementById('export-pdf'),
  clearProject: document.getElementById('clear-project'),
  toast: document.getElementById('toast'),
  cameraModal: document.getElementById('camera-modal'),
  cameraVideo: document.getElementById('camera-video'),
  cameraCanvas: document.getElementById('camera-canvas'),
  capturePhoto: document.getElementById('capture-photo'),
  cancelCamera: document.getElementById('cancel-camera')
};

let toastTimer;
let cameraStream = null;
let cameraTargetClauseId = null;

init();

function init() {
  loadState();
  renderIsoOptions();
  bindEvents();

  if (state.selectedIsoId && getActiveIso()) {
    showWorkspace();
  } else {
    showOnboarding();
  }
}

function bindEvents() {
  dom.startAudit.addEventListener('click', () => {
    if (!state.selectedIsoId) {
      showToast('Selecciona una norma ISO para continuar.');
      return;
    }
    showWorkspace();
  });

  dom.changeIso.addEventListener('click', () => {
    if (confirm('Cambiar de ISO puede resetear hallazgos que no existan en la nueva norma. Continuar?')) {
      showOnboarding();
    }
  });

  [
    [dom.projectName, 'name'],
    [dom.auditorName, 'auditor'],
    [dom.auditSite, 'site'],
    [dom.auditDate, 'date'],
    [dom.auditScope, 'scope']
  ].forEach(([node, key]) => {
    node.addEventListener('input', () => {
      state.project[key] = node.value;
      saveState();
      renderMetrics();
    });
  });

  dom.checklistRoot.addEventListener('input', handleChecklistInput);
  dom.checklistRoot.addEventListener('change', handleChecklistInput);
  dom.checklistRoot.addEventListener('click', handleChecklistClick);

  dom.exportPdf.addEventListener('click', exportPdf);

  dom.clearProject.addEventListener('click', () => {
    if (!confirm('Se borrara todo el proyecto actual, hallazgos y evidencias guardadas. Continuar?')) {
      return;
    }
    clearAuditData();
  });

  dom.capturePhoto.addEventListener('click', capturePhotoFromCamera);
  dom.cancelCamera.addEventListener('click', closeCameraModal);
}

function renderIsoOptions() {
  dom.isoOptions.innerHTML = ISO_LIBRARY.map((iso) => {
    const activeClass = state.selectedIsoId === iso.id ? 'active' : '';
    return `
      <article class="iso-option ${activeClass}" data-iso="${iso.id}">
        <h4>${escapeHtml(iso.code)} <small>(${escapeHtml(iso.version)})</small></h4>
        <p>${escapeHtml(iso.focus)}</p>
        <p>${escapeHtml(iso.summary)}</p>
      </article>
    `;
  }).join('');

  dom.isoOptions.querySelectorAll('.iso-option').forEach((card) => {
    card.addEventListener('click', () => {
      state.selectedIsoId = card.dataset.iso;
      dom.startAudit.disabled = false;
      renderIsoOptions();
      saveState();
    });
  });

  dom.startAudit.disabled = !state.selectedIsoId;
}

function showOnboarding() {
  dom.onboarding.classList.remove('hidden');
  dom.app.classList.add('hidden');
  renderIsoOptions();
}

function showWorkspace() {
  const iso = getActiveIso();
  if (!iso) {
    showToast('No se encontro la norma seleccionada.');
    showOnboarding();
    return;
  }

  ensureFindingsSkeleton(iso);
  dom.onboarding.classList.add('hidden');
  dom.app.classList.remove('hidden');

  dom.activeIso.textContent = `${iso.code} ${iso.version}`;
  dom.isoUpdatedNote.textContent = `Referencia: ${iso.updatedNote}`;

  dom.projectName.value = state.project.name;
  dom.auditorName.value = state.project.auditor;
  dom.auditSite.value = state.project.site;
  dom.auditDate.value = state.project.date;
  dom.auditScope.value = state.project.scope;

  renderChecklist();
  renderMetrics();
  saveState();
}

function getActiveIso() {
  return ISO_LIBRARY.find((iso) => iso.id === state.selectedIsoId) || null;
}

function ensureFindingsSkeleton(iso) {
  const validClauseIds = new Set();

  iso.sections.forEach((section) => {
    section.clauses.forEach((clause) => {
      validClauseIds.add(clause.id);
      if (!state.findings[clause.id]) {
        state.findings[clause.id] = createEmptyFinding();
      }
    });
  });

  // Borra items que ya no correspondan a la norma elegida
  Object.keys(state.findings).forEach((clauseId) => {
    if (!validClauseIds.has(clauseId)) {
      delete state.findings[clauseId];
    }
  });
}

function createEmptyFinding() {
  return {
    status: '',
    risk: '',
    note: '',
    action: '',
    evidences: []
  };
}

function renderChecklist() {
  const iso = getActiveIso();
  if (!iso) return;

  dom.checklistRoot.innerHTML = iso.sections.map((section) => `
    <section class="section-block">
      <header class="section-head">
        <h4>${escapeHtml(section.title)}</h4>
      </header>
      <div class="findings-list">
        ${section.clauses.map(renderClauseCard).join('')}
      </div>
    </section>
  `).join('');
}

function renderClauseCard(clause) {
  const finding = state.findings[clause.id] || createEmptyFinding();
  const statusClass = statusClassFromValue(finding.status);
  const badgeText = finding.status || 'Sin evaluar';

  return `
    <article class="finding-card" data-clause-id="${clause.id}">
      <div class="finding-head">
        <div>
          <h5>${escapeHtml(clause.id)} · ${escapeHtml(clause.title)}</h5>
          <p>${escapeHtml(clause.question)}</p>
        </div>
        <span class="badge-status ${statusClass}">${escapeHtml(badgeText)}</span>
      </div>

      <div class="finding-grid">
        <label>Conformidad
          <select data-field="status" data-clause-id="${clause.id}">
            ${renderOptions(['', 'Cumple', 'Parcial', 'No cumple', 'N/A'], finding.status)}
          </select>
        </label>
        <label>Riesgo
          <select data-field="risk" data-clause-id="${clause.id}">
            ${renderOptions(['', 'Bajo', 'Medio', 'Alto', 'Critico'], finding.risk)}
          </select>
        </label>
        <label class="wide">Hallazgo / Observacion
          <textarea rows="2" data-field="note" data-clause-id="${clause.id}" placeholder="Que se encontro?">${escapeHtml(finding.note)}</textarea>
        </label>
        <label class="wide">Accion sugerida
          <textarea rows="2" data-field="action" data-clause-id="${clause.id}" placeholder="Que accion debe ejecutarse?">${escapeHtml(finding.action)}</textarea>
        </label>
      </div>

      <div class="evidence-tools">
        <button class="btn btn-secondary" data-action="open-upload" data-clause-id="${clause.id}">Subir archivo</button>
        <button class="btn btn-secondary" data-action="open-camera" data-clause-id="${clause.id}">Tomar foto</button>
        <input class="hidden" type="file" multiple data-upload-for="${clause.id}" accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.txt" />
      </div>

      <div class="evidence-list">
        ${renderEvidenceList(clause.id, finding.evidences)}
      </div>
    </article>
  `;
}

function renderEvidenceList(clauseId, evidences) {
  if (!evidences || evidences.length === 0) {
    return '<div class="evidence-item"><span class="evidence-meta">Sin evidencias adjuntas todavia.</span></div>';
  }

  return evidences.map((ev) => {
    const imagePreview = ev.dataUrl ? `<img src="${ev.dataUrl}" alt="${escapeHtml(ev.name)}" />` : '';
    return `
      <article class="evidence-item">
        ${imagePreview}
        <div class="evidence-meta">
          <strong>${escapeHtml(ev.name)}</strong><br />
          Tipo: ${escapeHtml(ev.type || 'n/d')} · ${formatBytes(ev.size || 0)} · ${escapeHtml(ev.kind)}
        </div>
        <button class="btn btn-danger" data-action="remove-evidence" data-clause-id="${clauseId}" data-evidence-id="${ev.id}">Eliminar evidencia</button>
      </article>
    `;
  }).join('');
}

function renderOptions(options, current) {
  return options.map((opt) => {
    const label = opt || 'Seleccionar';
    const selected = current === opt ? 'selected' : '';
    return `<option value="${escapeHtml(opt)}" ${selected}>${escapeHtml(label)}</option>`;
  }).join('');
}

function statusClassFromValue(value) {
  switch (value) {
    case 'Cumple':
      return 'ok';
    case 'Parcial':
      return 'warn';
    case 'No cumple':
      return 'bad';
    case 'N/A':
      return 'na';
    default:
      return 'na';
  }
}

function handleChecklistInput(event) {
  const field = event.target.dataset.field;
  const clauseId = event.target.dataset.clauseId;
  if (!field || !clauseId) {
    if (event.target.matches('input[data-upload-for]')) {
      const targetClause = event.target.dataset.uploadFor;
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        addEvidenceFromFiles(targetClause, files);
      }
      event.target.value = '';
    }
    return;
  }

  const finding = state.findings[clauseId] || createEmptyFinding();
  finding[field] = event.target.value;
  state.findings[clauseId] = finding;
  saveState();

  if (field === 'status') {
    renderChecklist();
  }
  renderMetrics();
}

function handleChecklistClick(event) {
  const action = event.target.dataset.action;
  const clauseId = event.target.dataset.clauseId;
  if (!action || !clauseId) return;

  if (action === 'open-upload') {
    const fileInput = dom.checklistRoot.querySelector(`input[data-upload-for="${clauseId}"]`);
    if (fileInput) fileInput.click();
    return;
  }

  if (action === 'open-camera') {
    openCameraForClause(clauseId);
    return;
  }

  if (action === 'remove-evidence') {
    const evidenceId = event.target.dataset.evidenceId;
    removeEvidence(clauseId, evidenceId);
  }
}

async function addEvidenceFromFiles(clauseId, files) {
  const finding = state.findings[clauseId] || createEmptyFinding();

  for (const file of files) {
    try {
      const evidence = await buildEvidenceFromFile(file, 'Archivo');
      finding.evidences.push(evidence);
    } catch (error) {
      showToast(`No se pudo adjuntar ${file.name}: ${error.message}`);
    }
  }

  state.findings[clauseId] = finding;
  saveState();
  renderChecklist();
  renderMetrics();
  showToast('Evidencia adjuntada.');
}

function removeEvidence(clauseId, evidenceId) {
  const finding = state.findings[clauseId] || createEmptyFinding();
  finding.evidences = (finding.evidences || []).filter((ev) => ev.id !== evidenceId);
  state.findings[clauseId] = finding;
  saveState();
  renderChecklist();
  renderMetrics();
}

async function buildEvidenceFromFile(file, kind) {
  const isImage = file.type.startsWith('image/');
  let dataUrl = null;

  if (isImage) {
    const originalDataUrl = await fileToDataUrl(file);
    dataUrl = await compressImageDataUrl(originalDataUrl, 1400, 0.82);
  }

  return {
    id: makeId(),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    kind,
    dataUrl,
    createdAt: new Date().toISOString()
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('error leyendo archivo'));
    reader.readAsDataURL(file);
  });
}

function compressImageDataUrl(dataUrl, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = Math.max(width, height);
      if (maxDim > maxSide) {
        const ratio = maxSide / maxDim;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('imagen invalida'));
    img.src = dataUrl;
  });
}

async function openCameraForClause(clauseId) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Este navegador no permite camara en este contexto.');
    return;
  }

  try {
    cameraTargetClauseId = clauseId;
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }
      },
      audio: false
    });

    dom.cameraVideo.srcObject = cameraStream;
    dom.cameraModal.classList.remove('hidden');
    dom.cameraModal.setAttribute('aria-hidden', 'false');
  } catch (error) {
    showToast('No se pudo abrir la camara. Verifica permisos.');
    cameraTargetClauseId = null;
  }
}

async function capturePhotoFromCamera() {
  if (!cameraStream || !cameraTargetClauseId) return;

  const video = dom.cameraVideo;
  const canvas = dom.cameraCanvas;
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  const rawDataUrl = canvas.toDataURL('image/jpeg', 0.86);
  const compressed = await compressImageDataUrl(rawDataUrl, 1400, 0.82);

  const finding = state.findings[cameraTargetClauseId] || createEmptyFinding();
  finding.evidences.push({
    id: makeId(),
    name: `foto_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.jpg`,
    type: 'image/jpeg',
    size: estimateBase64Bytes(compressed),
    kind: 'Foto',
    dataUrl: compressed,
    createdAt: new Date().toISOString()
  });

  state.findings[cameraTargetClauseId] = finding;
  saveState();
  closeCameraModal();
  renderChecklist();
  renderMetrics();
  showToast('Foto de evidencia agregada.');
}

function closeCameraModal() {
  dom.cameraModal.classList.add('hidden');
  dom.cameraModal.setAttribute('aria-hidden', 'true');
  cameraTargetClauseId = null;
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  dom.cameraVideo.srcObject = null;
}

function renderMetrics() {
  const iso = getActiveIso();
  if (!iso) return;

  const clauses = iso.sections.flatMap((section) => section.clauses);
  const total = clauses.length;

  let evaluated = 0;
  let ok = 0;
  let partial = 0;
  let bad = 0;
  let evidenceCount = 0;

  clauses.forEach((clause) => {
    const finding = state.findings[clause.id] || createEmptyFinding();
    const status = finding.status;
    if (status) evaluated += 1;
    if (status === 'Cumple') ok += 1;
    if (status === 'Parcial') partial += 1;
    if (status === 'No cumple') bad += 1;
    evidenceCount += (finding.evidences || []).length;
  });

  const progress = total ? Math.round((evaluated / total) * 100) : 0;

  dom.metrics.innerHTML = `
    <article class="metric"><strong>${progress}%</strong><span>avance general</span></article>
    <article class="metric"><strong>${ok}</strong><span>cumple</span></article>
    <article class="metric"><strong>${partial}</strong><span>parcial</span></article>
    <article class="metric"><strong>${bad}</strong><span>no cumple</span></article>
    <article class="metric"><strong>${evidenceCount}</strong><span>evidencias</span></article>
    <article class="metric"><strong>${total}</strong><span>requisitos</span></article>
  `;
}

function clearAuditData() {
  state.project = {
    name: '',
    auditor: '',
    site: '',
    date: '',
    scope: ''
  };
  state.findings = {};
  const iso = getActiveIso();
  if (iso) ensureFindingsSkeleton(iso);
  saveState();
  showWorkspace();
  showToast('Proyecto reiniciado.');
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);

    state.selectedIsoId = parsed.selectedIsoId || null;
    state.project = {
      ...state.project,
      ...(parsed.project || {})
    };
    state.findings = parsed.findings || {};
  } catch {
    showToast('No se pudo recuperar el estado anterior.');
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast('Storage lleno: reduce imagenes o borra evidencias pesadas.');
  }
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2200);
}

async function exportPdf() {
  const iso = getActiveIso();
  if (!iso) {
    showToast('Selecciona una norma para exportar.');
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('No se cargo la libreria PDF.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const page = {
    width: 595,
    height: 842,
    margin: 42
  };

  let y = page.margin;

  const ensureSpace = (spaceNeeded) => {
    if (y + spaceNeeded > page.height - page.margin) {
      doc.addPage();
      y = page.margin;
    }
  };

  const writeLabelValue = (label, value) => {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${label}:`, page.margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'N/D'), page.margin + 90, y);
    y += 16;
  };

  doc.setFillColor(17, 60, 102);
  doc.rect(0, 0, page.width, 92, 'F');
  doc.setTextColor(241, 248, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Plataforma de Gestion de Auditorias', page.margin, 40);
  doc.setFontSize(12);
  doc.text(`${iso.code} ${iso.version}`, page.margin, 64);

  doc.setTextColor(20, 35, 52);
  y = 120;

  writeLabelValue('Empresa/Proyecto', state.project.name || 'Sin nombre');
  writeLabelValue('Auditor lider', state.project.auditor || 'Sin definir');
  writeLabelValue('Sitio', state.project.site || 'Sin definir');
  writeLabelValue('Fecha', state.project.date || 'Sin definir');

  ensureSpace(66);
  doc.setFont('helvetica', 'bold');
  doc.text('Alcance', page.margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  const scopeText = doc.splitTextToSize(state.project.scope || 'Sin alcance registrado.', page.width - page.margin * 2);
  doc.text(scopeText, page.margin, y);
  y += scopeText.length * 13 + 12;

  const clauses = iso.sections.flatMap((section) => section.clauses);
  const summary = buildSummary(clauses);

  ensureSpace(76);
  doc.setDrawColor(200, 216, 232);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(page.margin, y, page.width - page.margin * 2, 60, 8, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text(`Avance: ${summary.progress}%`, page.margin + 12, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cumple: ${summary.ok}  |  Parcial: ${summary.partial}  |  No cumple: ${summary.bad}`, page.margin + 12, y + 38);
  doc.text(`Evidencias totales: ${summary.evidenceCount}`, page.margin + 12, y + 54);
  y += 80;

  for (const section of iso.sections) {
    ensureSpace(30);
    doc.setFillColor(37, 104, 162);
    doc.rect(page.margin, y, page.width - page.margin * 2, 20, 'F');
    doc.setTextColor(248, 252, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(section.title, page.margin + 10, y + 14);
    y += 28;
    doc.setTextColor(20, 35, 52);

    for (const clause of section.clauses) {
      const finding = state.findings[clause.id] || createEmptyFinding();
      const status = finding.status || 'Sin evaluar';
      const risk = finding.risk || 'Sin definir';

      const questionLines = doc.splitTextToSize(`${clause.id} - ${clause.question}`, page.width - page.margin * 2 - 20);
      const noteLines = doc.splitTextToSize(`Hallazgo: ${finding.note || 'N/D'}`, page.width - page.margin * 2 - 20);
      const actionLines = doc.splitTextToSize(`Accion: ${finding.action || 'N/D'}`, page.width - page.margin * 2 - 20);
      const blockHeight = 22 + (questionLines.length + noteLines.length + actionLines.length) * 11;

      ensureSpace(blockHeight + 10);
      doc.setDrawColor(211, 224, 237);
      doc.roundedRect(page.margin, y, page.width - page.margin * 2, blockHeight, 6, 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Estado: ${status} | Riesgo: ${risk}`, page.margin + 10, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(questionLines, page.margin + 10, y + 28);
      let localY = y + 28 + questionLines.length * 11;
      doc.text(noteLines, page.margin + 10, localY);
      localY += noteLines.length * 11;
      doc.text(actionLines, page.margin + 10, localY);
      y += blockHeight + 10;
    }
  }

  // Anexo de evidencias
  ensureSpace(42);
  doc.addPage();
  y = page.margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Anexo de Evidencias', page.margin, y);
  y += 24;

  for (const section of iso.sections) {
    for (const clause of section.clauses) {
      const finding = state.findings[clause.id] || createEmptyFinding();
      const evidences = finding.evidences || [];
      if (evidences.length === 0) continue;

      ensureSpace(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${clause.id} - ${clause.title}`, page.margin, y);
      y += 12;

      for (const evidence of evidences) {
        const meta = `${evidence.name} | ${evidence.type || 'n/d'} | ${formatBytes(evidence.size || 0)} | ${evidence.kind}`;
        const metaLines = doc.splitTextToSize(meta, page.width - page.margin * 2);

        ensureSpace(metaLines.length * 11 + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(metaLines, page.margin + 6, y);
        y += metaLines.length * 11 + 4;

        if (evidence.dataUrl) {
          const image = await loadImageElement(evidence.dataUrl);
          const maxWidth = page.width - page.margin * 2 - 18;
          const maxHeight = 220;
          const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
          const drawW = Math.max(90, image.width * ratio);
          const drawH = Math.max(90, image.height * ratio);

          ensureSpace(drawH + 12);

          const format = evidence.dataUrl.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(evidence.dataUrl, format, page.margin + 9, y, drawW, drawH);
          y += drawH + 10;
        }
      }

      y += 8;
    }
  }

  const fileNameDate = (state.project.date || new Date().toISOString().slice(0, 10)).replaceAll('/', '-');
  const fileName = `Auditoria_${iso.code.replace(/[^a-zA-Z0-9]/g, '')}_${fileNameDate}.pdf`;
  doc.save(fileName);
  showToast('PDF exportado correctamente.');
}

function buildSummary(clauses) {
  let evaluated = 0;
  let ok = 0;
  let partial = 0;
  let bad = 0;
  let evidenceCount = 0;

  clauses.forEach((clause) => {
    const finding = state.findings[clause.id] || createEmptyFinding();
    if (finding.status) evaluated += 1;
    if (finding.status === 'Cumple') ok += 1;
    if (finding.status === 'Parcial') partial += 1;
    if (finding.status === 'No cumple') bad += 1;
    evidenceCount += (finding.evidences || []).length;
  });

  const total = clauses.length;

  return {
    evaluated,
    total,
    ok,
    partial,
    bad,
    evidenceCount,
    progress: total ? Math.round((evaluated / total) * 100) : 0
  };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('imagen no valida para PDF'));
    img.src = src;
  });
}

function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function estimateBase64Bytes(dataUrl) {
  const payload = dataUrl.split(',')[1] || '';
  return Math.floor((payload.length * 3) / 4);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}