// ===================== DATA =====================
const DATA = {
    ctx_lid: [
        {
            id: 'intro', num: '0', title: 'Introducción a la Auditoría',
            type: 'form',
            fields: [
                { type: 'textarea', label: 'Propósito de la Auditoría ISO 9001:2015', id: 'intro_proposito' },
                { type: 'textarea', label: 'Alcance de la Auditoría', id: 'intro_alcance' },
                { type: 'textarea', label: 'Criterios de Auditoría', id: 'intro_criterios' }
            ]
        },
        {
            id: 'cap4', num: '4', title: 'Contexto de la Organización',
            type: 'table',
            items: [
                ['4.1 Comprensión de la organización', '¿Se han determinado cuestiones internas y externas pertinentes al propósito y dirección estratégica?'],
                ['4.2 Partes interesadas', '¿Se han identificado las partes interesadas relevantes y sus requerimientos?'],
                ['4.3 Alcance del SGC', '¿El alcance del SGC está determinado, documentado y disponible, incluyendo justificación de requisitos no aplicables?'],
                ['4.4 Sistema de Gestión de Calidad', '¿Se han establecido, implementado, mantenido y mejorado los procesos necesarios y sus interacciones para el SGC?']
            ]
        },
        {
            id: 'cap5', num: '5', title: 'Liderazgo',
            type: 'table',
            items: [
                ['5.1 Liderazgo y compromiso', '¿La alta dirección demuestra liderazgo y compromiso con el SGC y el enfoque al cliente?'],
                ['5.2 Política de la calidad', '¿Existe una política de calidad adecuada al propósito, que incluya el compromiso de mejora continua y aplicabilidad de requisitos?'],
                ['5.3 Roles, responsabilidades y autoridades', '¿Se han asignado y comunicado las responsabilidades y autoridades para los roles pertinentes?']
            ]
        }
    ],
    plan_apoyo: [
        {
            id: 'cap6', num: '6', title: 'Planificación',
            type: 'table',
            items: [
                ['6.1 Acciones para riesgos y oportunidades', '¿Se han determinado los riesgos y oportunidades para asegurar que el SGC pueda lograr sus resultados previstos?'],
                ['6.2 Objetivos de calidad', '¿Hay objetivos de calidad coherentes con la política, medibles, monitoreados y comunicados?'],
                ['6.3 Planificación de cambios', '¿Los cambios en el SGC se llevan a cabo de manera planificada y sistemática?']
            ]
        },
        {
            id: 'cap7', num: '7', title: 'Apoyo',
            type: 'table',
            items: [
                ['7.1 Recursos', '¿La organización determina y proporciona los recursos necesarios (personas, infraestructura, ambiente, recursos de seguimiento)?'],
                ['7.2 Competencia', '¿Se determina la competencia necesaria del personal basándose en educación, formación o experiencia?'],
                ['7.3 Toma de conciencia', '¿El personal es consciente de la política de calidad, objetivos y su contribución al SGC?'],
                ['7.4 Comunicación', '¿Están determinadas las comunicaciones internas y externas pertinentes?'],
                ['7.5 Información documentada', '¿El SGC incluye la información documentada requerida por la norma y controlada adecuadamente?']
            ]
        }
    ],
    ope: [
        {
            id: 'cap8', num: '8', title: 'Operación',
            type: 'table',
            items: [
                ['8.1 Planificación y control operacional', '¿La organización planifica, implementa y controla los procesos necesarios para los requisitos del producto/servicio?'],
                ['8.2 Requisitos para los productos y servicios', '¿Se determinan y revisan los requisitos comunicándose adecuadamente con los clientes?'],
                ['8.3 Diseño y desarrollo', '¿Se cuenta con un proceso de diseño y desarrollo documentado adecuado? (Si no aplica, dejar fuera o No Aplica)'],
                ['8.4 Control de procesos o servicios de proveedores externos', '¿Se aseguran de que los procesos/productos/servicios suministrados externamente sean conformes a los requisitos?'],
                ['8.5 Producción y provisión del servicio', '¿Las actividades de producción se ejecutan bajo condiciones controladas, con adecuada identificación, trazabilidad y preservación?'],
                ['8.6 Liberación de los productos y servicios', '¿Existen disposiciones planificadas para verificar que se cumplen los requisitos antes de la entrega al cliente?'],
                ['8.7 Control de salidas no conformes', '¿Las salidas no conformes se identifican y controlan para prevenir su uso o entrega no intencional?']
            ]
        }
    ],
    eval_mej: [
        {
            id: 'cap9', num: '9', title: 'Evaluación del Desempeño',
            type: 'table',
            items: [
                ['9.1 Seguimiento, medición, análisis y evaluación', '¿Se ha determinado qué necesita seguimiento, métodos, momento de medición y análisis (incluyendo satisfacción del cliente)?'],
                ['9.2 Auditoría interna', '¿Se llevan a cabo auditorías internas a intervalos planificados de manera eficiente?'],
                ['9.3 Revisión por la dirección', '¿La alta dirección revisa el SGC a intervalos planificados para asegurar su conveniencia, adecuación y eficacia?']
            ]
        },
        {
            id: 'cap10', num: '10', title: 'Mejora',
            type: 'table',
            items: [
                ['10.1 Generalidades', '¿Se determinan y seleccionan oportunidades de mejora y se implementan acciones necesarias?'],
                ['10.2 No conformidad y acción correctiva', '¿Se reacciona ante la no conformidad y se implementan acciones correctivas pertinentes, documentando resultados?'],
                ['10.3 Mejora continua', '¿Se mejora continuamente la conveniencia, adecuación y eficacia del SGC?']
            ]
        }
    ]
};

// ===================== RENDER =====================
function renderTableSection(section, pillar) {
    let rows = section.items.map((item, i) => {
        const prefix = `${pillar}_${section.id}_${i}`;
        return `<tr>
      <td>${item[0]} <button type="button" class="btn btn-sm" style="padding: 2px 6px; font-size: 0.7rem; margin-top: 8px; display: block; background: var(--bg-secondary); color: white;" onclick="askAIAuditContext(this.dataset.ctx)" data-ctx="${item[0]}" title="Pedir contexto al Asistente IA"><i class="fa-solid fa-brain"></i> Contexto</button></td>
      <td>${item[1]}</td>
      <td><select data-field="${prefix}_estado"><option value="">—</option><option value="1 Cumple">1 Cumple</option><option value="2 Parcial">2 Parcial</option><option value="3 No Cumple">3 No Cumple</option><option value="4 N/A">4 N/A</option></select></td>
      <td><select style="font-family: 'Font Awesome 6 Free', 'Inter'; font-weight: 900;" data-field="${prefix}_riesgo"><option value="">—</option><option value="Bajo">&#xf058; Bajo</option><option value="Medio">&#xf06a; Medio</option><option value="Alto">&#xf071; Alto</option><option value="Crítico">&#xf05c; Crítico</option></select></td>
      <td><select data-field="${prefix}_prioridad"><option value="">—</option><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option></select></td>
      <td><textarea data-field="${prefix}_obs" rows="2" placeholder="Hallazgos / Notas..."></textarea></td>
      <td><textarea data-field="${prefix}_mejora" rows="2" placeholder="Oportunidad..."></textarea></td>
      <td class="file-upload-cell">
        <label class="btn-file-upload" title="Adjuntar evidencia">
            <i class="fa-solid fa-paperclip"></i> Archivo
            <input type="file" multiple data-field="${prefix}_file">
        </label>
        <input type="text" placeholder="Enlace/URL..." data-field="${prefix}_link">
      </td>
    </tr>`;
    }).join('');

    return `<div class="legend-bar">
    <span><strong>Conformidad:</strong> 1 Cumple | 2 Parcial | 3 No Cumple | 4 N/A</span>
    <span><strong>Riesgo:</strong> <span style="font-family: 'Font Awesome 6 Free'; font-weight: 900;">&#xf058;</span> Bajo | <span style="font-family: 'Font Awesome 6 Free'; font-weight: 900;">&#xf06a;</span> Medio | <span style="font-family: 'Font Awesome 6 Free'; font-weight: 900;">&#xf071;</span> Alto | <span style="font-family: 'Font Awesome 6 Free'; font-weight: 900;">&#xf05c;</span> Crítico</span>
  </div>
  <table class="checklist-table"><thead><tr>
    <th>Requisito</th><th>Pregunta / Validación</th><th>Conform.</th><th>Riesgo</th><th>Prioridad</th><th>Hallazgos</th><th>Oportunidades</th><th>Evidencia (Archivo/URL)</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderFormSection(section) {
    return section.fields.map(f => {
        if (f.type === 'text') {
            return `<div class="form-group"><label>${f.label}</label><input type="text" data-field="${f.id}" placeholder="Describa aquí..."></div>`;
        } else if (f.type === 'textarea') {
            return `<div class="form-group"><label>${f.label}</label><textarea data-field="${f.id}" rows="3" placeholder="Describa aquí..."></textarea></div>`;
        } else if (f.type === 'select') {
            const opts = f.options.map(o => `<option value="${o}">${o || '— Selecciona —'}</option>`).join('');
            return `<div class="form-group"><label>${f.label}</label><select data-field="${f.id}">${opts}</select></div>`;
        } else if (f.type === 'checkgroup') {
            const checks = f.options.map((o, i) => `<label class="checkbox-item"><input type="checkbox" data-field="${f.id}_${i}"><span>${o}</span></label>`).join('');
            return `<div class="form-group"><label>${f.label}</label><div class="checkbox-grid">${checks}</div></div>`;
        }
        return '';
    }).join('');
}

function renderSections(sections, pillar, container) {
    if (!container) return;
    container.innerHTML = sections.map(s => {
        const body = s.type === 'table' ? renderTableSection(s, pillar) : renderFormSection(s);
        return `<div class="audit-section open" data-section="${s.id}">
      <div class="section-header" onclick="toggleSection(this)">
        <div class="section-title"><span class="section-num">${s.num}</span>${s.title}</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="section-progress"><div class="mini-bar"><div class="mini-fill" style="width:0%"></div></div><span class="pct-label">0%</span></div>
          <i class="fa-solid fa-chevron-down chevron"></i>
        </div>
      </div>
      <div class="section-body">${body}</div>
    </div>`;
    }).join('');
}

function toggleSection(header) {
    header.closest('.audit-section').classList.toggle('open');
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    renderSections(DATA.ctx_lid, 'ctx_lid', document.getElementById('panel-ctx-lid'));
    renderSections(DATA.plan_apoyo, 'plan_apoyo', document.getElementById('panel-plan-apoyo'));
    renderSections(DATA.ope, 'ope', document.getElementById('panel-ope'));
    renderSections(DATA.eval_mej, 'eval_mej', document.getElementById('panel-eval-mej'));

    // Load saved data
    loadData();

    // Auto-save on change
    document.addEventListener('input', () => { saveData(); updateProgress(); });
    document.addEventListener('change', () => { saveData(); updateProgress(); });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            let targetPanel = document.getElementById(btn.dataset.panel);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    updateProgress();
});

// ===================== PERSISTENCE =====================
function saveData() {
    const data = {};
    document.querySelectorAll('[data-field]').forEach(el => {
        if (el.type === 'checkbox') data[el.dataset.field] = el.checked;
        else data[el.dataset.field] = el.value;
    });
    // Also save meta fields
    document.querySelectorAll('.meta-field input, .meta-field select').forEach(el => {
        if (el.id) data['meta_' + el.id] = el.value;
    });
    const conclusions = document.getElementById('audit-conclusions');
    if (conclusions) data['audit_conclusions'] = conclusions.value;
    // Save version table
    document.querySelectorAll('.version-table input').forEach(el => {
        if (el.dataset.vid) data['ver_' + el.dataset.vid] = el.value;
    });
    localStorage.setItem('iso9001_audit_indusecc', JSON.stringify(data));
    showToast('Guardado automático');
}

function loadData() {
    const raw = localStorage.getItem('iso9001_audit_indusecc');
    if (!raw) return;
    const data = JSON.parse(raw);
    document.querySelectorAll('[data-field]').forEach(el => {
        const val = data[el.dataset.field];
        if (val === undefined) return;
        if (el.type === 'checkbox') el.checked = val;
        else el.value = val;
    });
    document.querySelectorAll('.meta-field input, .meta-field select').forEach(el => {
        if (el.id && data['meta_' + el.id] !== undefined) el.value = data['meta_' + el.id];
    });
    const conclusions = document.getElementById('audit-conclusions');
    if (conclusions && data['audit_conclusions'] !== undefined) conclusions.value = data['audit_conclusions'];
    document.querySelectorAll('.version-table input').forEach(el => {
        if (el.dataset.vid && data['ver_' + el.dataset.vid] !== undefined) el.value = data['ver_' + el.dataset.vid];
    });

    // Attempt loading signature on next tick to ensure canvas is ready
    setTimeout(() => { if (window.loadSignatures) window.loadSignatures(); }, 100);
}

function clearData() {
    if (confirm('¿Estás seguro de borrar TODOS los datos de la auditoría? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('iso9001_audit_indusecc');
        location.reload();
    }
}

// ===================== PROGRESS =====================
function updateProgress() {
    let totalFields = 0, filledFields = 0;
    document.querySelectorAll('[data-field]').forEach(el => {
        totalFields++;
        if (el.type === 'checkbox') { if (el.checked) filledFields++; }
        else if (el.value && el.value.trim() !== '') filledFields++;
    });
    const pct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    let globalFill = document.getElementById('global-fill');
    if (globalFill) globalFill.style.width = pct + '%';

    let globalPct = document.getElementById('global-pct');
    if (globalPct) globalPct.textContent = pct + '% completado (' + filledFields + '/' + totalFields + ' campos)';

    // Per-section progress
    document.querySelectorAll('.audit-section').forEach(sec => {
        let t = 0, f = 0;
        sec.querySelectorAll('[data-field]').forEach(el => {
            t++;
            if (el.type === 'checkbox') { if (el.checked) f++; }
            else if (el.value && el.value.trim() !== '') f++;
        });
        const sp = t > 0 ? Math.round((f / t) * 100) : 0;
        const fill = sec.querySelector('.mini-fill');
        const label = sec.querySelector('.pct-label');
        if (fill) fill.style.width = sp + '%';
        if (label) label.textContent = sp + '%';
    });
}


// ===================== PDF EXPORT =====================
function exportPDF() {
    const btn = document.getElementById('btn-export');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando PDF...';
    btn.disabled = true;

    setTimeout(() => {
        try {
            _buildAndPrintPDF();
        } catch (e) {
            console.error(e);
            showToast('Error: ' + e.message);
        } finally {
            btn.innerHTML = '<i class="fa-solid fa-file-pdf btn-icon"></i> Exportar a PDF';
            btn.disabled = false;
        }
    }, 200);
}

function _buildAndPrintPDF() {
    // ── 1. Capturar todos los valores del formulario ──────────────────────
    const F = {}; // field values
    document.querySelectorAll('[data-field]').forEach(el => {
        F[el.dataset.field] = el.type === 'checkbox' ? (el.checked ? '✓' : '') : (el.value || '');
    });
    const V = {}; // version table values
    document.querySelectorAll('[data-vid]').forEach(el => { V[el.dataset.vid] = el.value || ''; });

    const pname = document.getElementById('project-name')?.value || '—';
    const auditor = document.getElementById('auditor-name')?.value || '—';
    const fecha = document.getElementById('audit-date')?.value || '—';
    const ver = document.getElementById('doc-version')?.value || '—';
    const conc = document.getElementById('audit-conclusions')?.value || '';

    // Signatures as base64
    let sigAud = '', sigRep = '';
    try { sigAud = document.getElementById('sig-canvas-auditor')?.toDataURL('image/png') || ''; } catch (e) { }
    try { sigRep = document.getElementById('sig-canvas-rep')?.toDataURL('image/png') || ''; } catch (e) { }

    // ── 2. Helpers ────────────────────────────────────────────────────────
    const esc = s => String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const badge = (val) => {
        if (!val || val === '—') return `<span style="color:#999">—</span>`;
        let bg = '#e5e7eb', color = '#374151';
        if (val.includes('Cumple') && !val.includes('No')) { bg = '#d1fae5'; color = '#065f46'; }
        else if (val.includes('No Cumple')) { bg = '#fee2e2'; color = '#991b1b'; }
        else if (val.includes('Parcial')) { bg = '#fef3c7'; color = '#92400e'; }
        else if (val.includes('N/A')) { bg = '#f3f4f6'; color = '#6b7280'; }
        else if (val === 'Bajo') { bg = '#d1fae5'; color = '#065f46'; }
        else if (val === 'Medio') { bg = '#fef3c7'; color = '#92400e'; }
        else if (val === 'Alto') { bg = '#fee2e2'; color = '#991b1b'; }
        else if (val === 'Crítico') { bg = '#dc2626'; color = '#fff'; }
        return `<span style="background:${bg};color:${color};padding:2px 6px;border-radius:3px;font-size:0.7rem;font-weight:700;white-space:nowrap;">${esc(val)}</span>`;
    };

    // ── 3. Construir HTML de secciones ────────────────────────────────────
    const buildTable = (section, pillar) => {
        const rows = section.items.map((item, i) => {
            const p = `${pillar}_${section.id}_${i}`;
            return `<tr>
              <td style="font-weight:600;font-size:0.7rem;vertical-align:top;padding:5px 6px;border:1px solid #ddd;">${esc(item[0])}</td>
              <td style="font-size:0.7rem;vertical-align:top;padding:5px 6px;border:1px solid #ddd;">${esc(item[1])}</td>
              <td style="text-align:center;padding:5px 6px;border:1px solid #ddd;">${badge(F[p + '_estado'])}</td>
              <td style="text-align:center;padding:5px 6px;border:1px solid #ddd;">${badge(F[p + '_riesgo'])}</td>
              <td style="text-align:center;font-size:0.7rem;padding:5px 6px;border:1px solid #ddd;">${esc(F[p + '_prioridad'] || '—')}</td>
              <td style="font-size:0.7rem;white-space:pre-wrap;vertical-align:top;padding:5px 6px;border:1px solid #ddd;">${esc(F[p + '_obs'] || '')}</td>
              <td style="font-size:0.7rem;white-space:pre-wrap;vertical-align:top;padding:5px 6px;border:1px solid #ddd;">${esc(F[p + '_mejora'] || '')}</td>
              <td style="font-size:0.65rem;color:#555;vertical-align:top;padding:5px 6px;border:1px solid #ddd;">${esc(F[p + '_link'] || '')}</td>
            </tr>`;
        }).join('');
        return `
          <table style="width:100%;border-collapse:collapse;font-size:0.72rem;margin-top:8px;">
            <thead><tr style="background:#ebebeb;">
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:13%;">Requisito</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:21%;">Pregunta / Validación</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:center;width:9%;">Conform.</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:center;width:8%;">Riesgo</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:center;width:7%;">Prioridad</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:16%;">Hallazgos</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:16%;">Oportunidades</th>
              <th style="padding:5px 6px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:10%;">Evidencia/URL</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`;
    };

    const buildForm = (section) => {
        return section.fields.map(f => {
            const val = esc(F[f.id] || '');
            return `<div style="margin-bottom:10px;">
              <div style="font-size:0.72rem;font-weight:700;color:#333;margin-bottom:3px;">${esc(f.label)}</div>
              <div style="border:1px solid #ddd;padding:6px 8px;border-radius:3px;background:#fafafa;min-height:24px;font-size:0.78rem;white-space:pre-wrap;">${val || '&nbsp;'}</div>
            </div>`;
        }).join('');
    };

    const buildPanelHTML = (pillar, sections) => sections.map(sec => {
        const body = sec.type === 'table' ? buildTable(sec, pillar) : buildForm(sec);
        return `
        <div style="border:1px solid #ddd;border-radius:5px;margin:8px 0;page-break-inside:avoid;">
          <div style="background:#f0f0f0;padding:8px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #ddd;">
            <span style="background:#D98E04;color:#fff;width:24px;height:24px;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;flex-shrink:0;">${esc(sec.num)}</span>
            <span style="font-size:0.82rem;font-weight:700;">${esc(sec.title)}</span>
          </div>
          <div style="padding:10px 14px;">${body}</div>
        </div>`;
    }).join('');

    // ── 4. Version table rows ─────────────────────────────────────────────
    const verRows = ['v1', 'v2', 'v3'].map(v =>
        `<tr>
          <td style="padding:5px 8px;border:1px solid #ddd;">${esc(V[v + '_ver'] || '')}</td>
          <td style="padding:5px 8px;border:1px solid #ddd;">${esc(V[v + '_fecha'] || '')}</td>
          <td style="padding:5px 8px;border:1px solid #ddd;">${esc(V[v + '_autor'] || '')}</td>
          <td style="padding:5px 8px;border:1px solid #ddd;">${esc(V[v + '_desc'] || '')}</td>
        </tr>`
    ).join('');

    // ── 5. Signatures ─────────────────────────────────────────────────────
    const sigBox = (title, dataUrl) => `
      <div style="flex:1;border:1px solid #ddd;border-radius:4px;padding:10px;">
        <div style="font-weight:700;font-size:0.78rem;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #eee;">${title}</div>
        ${dataUrl && dataUrl.length > 200
            ? `<img src="${dataUrl}" style="max-height:90px;max-width:100%;display:block;margin:0 auto;">`
            : `<div style="height:80px;border-bottom:1px solid #999;margin-bottom:4px;"></div>`}
        <div style="font-size:0.62rem;color:#888;text-align:center;margin-top:6px;">Nombre, Firma y Fecha</div>
      </div>`;

    // ── 6. Panel label ────────────────────────────────────────────────────
    const panelLabel = (icon, text) =>
        `<div style="background:#5a1111;color:#fff;padding:7px 16px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:16px 0 0;">${icon} ${text}</div>`;

    // ── 7. Full HTML document ─────────────────────────────────────────────
    const concEscaped = conc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Auditoría ISO 9001:2015 — ${esc(pname)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4 landscape; margin: 10mm 8mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

<!-- BOTÓN IMPRIMIR (solo visible en pantalla, no en PDF) -->
<div class="no-print" style="position:fixed;top:10px;right:10px;z-index:9999;display:flex;gap:8px;">
  <button onclick="window.print()" style="background:#D98E04;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:0.9rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
    🖨️ Guardar como PDF
  </button>
  <button onclick="window.close()" style="background:#5a1111;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:0.9rem;font-weight:700;cursor:pointer;">
    ✕ Cerrar
  </button>
</div>

<!-- INSTRUCCIÓN (solo visible en pantalla) -->
<div class="no-print" style="background:#fef3c7;border:1px solid #D98E04;padding:10px 16px;margin-bottom:12px;font-size:0.82rem;color:#92400e;border-radius:4px;">
  <strong>💡 Para guardar como PDF:</strong> Haz clic en "Guardar como PDF" → En el diálogo de impresión selecciona <strong>"Guardar como PDF"</strong> como destino → Activa <strong>"Gráficos de fondo"</strong> en Más opciones → Clic en Guardar.
</div>

<!-- ═══ ENCABEZADO ═══ -->
<div style="background:#5a1111;color:#fff;padding:12px 20px;display:flex;align-items:center;gap:14px;">
  <img src="logo_indusecc.png" alt="INDUSECC" style="height:52px;" onerror="this.style.display='none'">
  <div>
    <div style="font-size:1.05rem;font-weight:800;color:#D98E04;letter-spacing:-0.5px;">AUDITORÍA ISO 9001:2015</div>
    <div style="font-size:0.6rem;color:#ccc;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">AUDITORÍAPP · INDUSECC</div>
  </div>
  <div style="margin-left:auto;text-align:right;font-size:0.7rem;color:#ccc;">
    <div>Fecha: <strong style="color:#fff;">${esc(fecha)}</strong></div>
    <div>Versión: <strong style="color:#fff;">${esc(ver)}</strong></div>
  </div>
</div>

<!-- ═══ META ═══ -->
<div style="background:#731616;padding:10px 20px;display:flex;gap:40px;flex-wrap:wrap;">
  <div>
    <div style="font-size:0.55rem;color:#bbb;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:2px;">Proyecto / Empresa</div>
    <div style="color:#fff;font-size:0.85rem;font-weight:700;">${esc(pname)}</div>
  </div>
  <div>
    <div style="font-size:0.55rem;color:#bbb;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:2px;">Auditor Líder</div>
    <div style="color:#fff;font-size:0.85rem;font-weight:700;">${esc(auditor)}</div>
  </div>
  <div>
    <div style="font-size:0.55rem;color:#bbb;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:2px;">Fecha de Auditoría</div>
    <div style="color:#fff;font-size:0.85rem;font-weight:700;">${esc(fecha)}</div>
  </div>
  <div>
    <div style="font-size:0.55rem;color:#bbb;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:2px;">Versión del Documento</div>
    <div style="color:#fff;font-size:0.85rem;font-weight:700;">${esc(ver)}</div>
  </div>
</div>

<!-- ═══ TABLA DE VERSIONES ═══ -->
<div style="padding:12px 20px;background:#f9f9f9;border-bottom:2px solid #e5e7eb;">
  <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#731616;margin-bottom:8px;">Control de Versiones</div>
  <table style="width:100%;border-collapse:collapse;font-size:0.75rem;">
    <thead>
      <tr style="background:#ebebeb;">
        <th style="padding:5px 8px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:10%;">Versión</th>
        <th style="padding:5px 8px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:15%;">Fecha</th>
        <th style="padding:5px 8px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;width:20%;">Autor</th>
        <th style="padding:5px 8px;border:1px solid #ccc;font-size:0.6rem;text-transform:uppercase;text-align:left;">Descripción de Cambios</th>
      </tr>
    </thead>
    <tbody>${verRows}</tbody>
  </table>
</div>

<!-- ═══ SECCIONES ═══ -->
<div style="padding:0 20px;">

  ${panelLabel('📋', 'Contexto y Liderazgo — Caps. 4-5')}
  ${buildPanelHTML('ctx_lid', DATA.ctx_lid)}

  ${panelLabel('🗺', 'Planificación y Apoyo — Caps. 6-7')}
  ${buildPanelHTML('plan_apoyo', DATA.plan_apoyo)}

  ${panelLabel('⚙', 'Operación — Cap. 8')}
  ${buildPanelHTML('ope', DATA.ope)}

  ${panelLabel('📈', 'Evaluación y Mejora — Caps. 9-10')}
  ${buildPanelHTML('eval_mej', DATA.eval_mej)}

</div>

<!-- ═══ CONCLUSIONES ═══ -->
<div style="margin:16px 20px;border:2px solid #D98E04;border-radius:5px;overflow:hidden;page-break-inside:avoid;">
  <div style="background:#D98E04;color:#fff;padding:8px 14px;font-size:0.8rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;">✍ Conclusiones de la Auditoría</div>
  <div style="padding:12px 14px;">
    <div style="border:1px solid #ddd;padding:10px;border-radius:3px;background:#fafafa;min-height:60px;font-size:0.82rem;line-height:1.7;white-space:pre-wrap;">${concEscaped || '<span style="color:#aaa;font-style:italic;">Sin conclusiones registradas.</span>'}</div>
    <div style="display:flex;gap:20px;margin-top:16px;">
      ${sigBox('Auditor Líder', sigAud)}
      ${sigBox('Representante Auditado', sigRep)}
    </div>
  </div>
</div>

<!-- ═══ FOOTER ═══ -->
<div style="text-align:center;padding:10px;font-size:0.6rem;color:#aaa;border-top:1px solid #eee;margin:8px 20px 0;">
  © 2026 INDUSECC — Todos los derechos reservados. Documento de uso interno para auditoría ISO 9001:2015.
  &nbsp;|&nbsp; Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
</div>

</body>
</html>`;

    // ── 8. Abrir ventana de impresión ─────────────────────────────────────
    const win = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!win) {
        alert('⚠️ El navegador bloqueó la ventana emergente.\nPor favor permite las ventanas emergentes para este sitio y vuelve a intentarlo.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();

    // Enfocar la nueva ventana
    win.focus();
}


// ===================== TOAST =====================
let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1500);
}

/* ===================== SIGNATURE PADS ===================== */
const pads = {};
document.addEventListener('DOMContentLoaded', () => {
    ['auditor', 'rep'].forEach(id => {
        const canvas = document.getElementById(`sig-canvas-${id}`);
        if (canvas) {
            canvas.width = canvas.parentElement.clientWidth || 300;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 2;
            pads[id] = { canvas, ctx, drawing: false };

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: (e.clientX || e.touches[0].clientX) - rect.left,
                    y: (e.clientY || e.touches[0].clientY) - rect.top
                };
            };

            const startDraw = (e) => {
                e.preventDefault();
                pads[id].drawing = true;
                const pos = getPos(e);
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
            };

            const doDraw = (e) => {
                e.preventDefault();
                if (!pads[id].drawing) return;
                const pos = getPos(e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            };

            const endDraw = () => {
                if (pads[id].drawing) {
                    pads[id].drawing = false;
                    saveSignatures();
                }
            };

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', doDraw);
            canvas.addEventListener('mouseup', endDraw);
            canvas.addEventListener('mouseleave', endDraw);

            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove', doDraw, { passive: false });
            canvas.addEventListener('touchend', endDraw);
        }
    });

    // Handle resize
    window.addEventListener('resize', () => {
        ['auditor', 'rep'].forEach(id => {
            if (pads[id]) {
                const oldData = pads[id].canvas.toDataURL();
                pads[id].canvas.width = pads[id].canvas.parentElement.clientWidth || 300;
                const img = new Image();
                img.onload = () => pads[id].ctx.drawImage(img, 0, 0);
                img.src = oldData;
            }
        });
    });
});

window.clearSignature = function (id) {
    const p = pads[id];
    p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
    saveSignatures();
};

window.loadSignature = function (input, id) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const p = pads[id];
                p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
                // Keep aspect ratio
                const scale = Math.min(p.canvas.width / img.width, p.canvas.height / img.height);
                const x = (p.canvas.width / 2) - (img.width / 2) * scale;
                const y = (p.canvas.height / 2) - (img.height / 2) * scale;
                p.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                saveSignatures();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

function saveSignatures() {
    if (!pads.auditor) return;
    const sigs = {
        auditor: pads.auditor.canvas.toDataURL(),
        rep: pads.rep.canvas.toDataURL()
    };
    localStorage.setItem('iso9001_audit_sigs', JSON.stringify(sigs));
}

window.loadSignatures = function () {
    const raw = localStorage.getItem('iso9001_audit_sigs');
    if (raw && pads.auditor) {
        const sigs = JSON.parse(raw);
        ['auditor', 'rep'].forEach(id => {
            if (sigs[id]) {
                const img = new Image();
                img.onload = () => pads[id].ctx.drawImage(img, 0, 0);
                img.src = sigs[id];
            }
        });
    }
};

/* ===================== AI ASSISTANT ===================== */
const AIChat = {
    apiKey: "REMOVIDA_POR_SEGURIDAD",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",

    async ask(question) {
        const systemPrompt = `Eres N.O.R.A. (Núcleo de Operaciones y Revisión Automatizada), un asistente inteligente y amigable experto en la norma ISO 9001:2015.
REGLAS ESTRICTAS:
1. NUNCA des la información de la norma de forma literal ni recites los artículos. Exprésalo siempre con palabras simples y fáciles de entender.
2. SIEMPRE da EJEMPLOS PRÁCTICOS reales de cómo se revisa o cumple este punto en una empresa (documentos, evidencias, situaciones).
3. Usa un tono profesional pero interactivo.
4. ESTRUCTURA tu respuesta usando viñetas (usando el símbolo *) y negritas (usando asteriscos dobles **) para que la lectura sea increíble. Hazlo conciso (máximo 4 párrafos cortos).`;

        try {
            const res = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: question }
                    ],
                    max_tokens: 600,
                    temperature: 0.7
                })
            });

            const data = await res.json();

            if (data?.error) {
                console.error("OpenAI error:", data.error.message);
                return `⚠️ Error de la API: ${data.error.message}`;
            }

            if (!data?.choices?.[0]?.message?.content) {
                console.error("Respuesta inesperada:", JSON.stringify(data));
                return "⚠️ N.O.R.A. no pudo generar una respuesta. Intenta de nuevo.";
            }

            return data.choices[0].message.content;

        } catch (e) {
            console.error("AIChat error:", e);
            return `⚠️ Error de conexión: ${e.message}`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('ai-chat-btn');
    if (chatBtn) {
        chatBtn.addEventListener('click', () => {
            document.getElementById('ai-chat-window').classList.toggle('hidden');
        });
        document.getElementById('ai-chat-close').addEventListener('click', () => {
            document.getElementById('ai-chat-window').classList.add('hidden');
        });

        document.getElementById('ai-chat-send').addEventListener('click', () => sendAiMessage());
        document.getElementById('ai-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendAiMessage();
        });
    }
});

async function sendAiMessage(forcedMsg = null) {
    const input = document.getElementById('ai-chat-input');
    const msg = forcedMsg || input.value.trim();
    if (!msg) return;

    if (!forcedMsg) input.value = '';

    const messages = document.getElementById('ai-chat-messages');
    messages.innerHTML += `<div class="message user-msg">${msg}</div>`;

    const loadingId = 'loading-' + Date.now();
    messages.innerHTML += `<div class="message ai-msg" id="${loadingId}"><i class="fa-solid fa-spinner fa-spin"></i> Auditando consulta...</div>`;
    messages.scrollTop = messages.scrollHeight;

    if (forcedMsg) document.getElementById('ai-chat-window').classList.remove('hidden');

    const response = await AIChat.ask(msg);
    const lg = document.getElementById(loadingId);
    if (lg) lg.remove();

    // Simple markdown formatting for UI elegance
    let formatResponse = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<br>• <em>$1</em> ')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');

    messages.innerHTML += `<div class="message ai-msg">${formatResponse}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

window.askAIAuditContext = function (clause) {
    sendAiMessage(`Explicame qué debo revisar exactamente en el punto: ${clause}. Ayúdame con ejemplos prácticos de lo que le preguntaría al auditado o qué documentos le pediría.`);
};
