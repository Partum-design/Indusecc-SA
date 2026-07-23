(function () {
  "use strict";

  var PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

  var sb;
  var session;
  var currentProfile;
  var profiles = [];
  var audits = [];
  var activity = [];
  var exports = [];
  var connections = [];
  var organizations = [];
  var searchQuery = "";
  var vaultQuery = "";
  var connectionsQuery = "";
  var orgSearchQuery = "";
  var userOrgFilter = "";
  var expandedOrgIds = {};
  var toastTimer;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!window.supabase || !window.SUPABASE_CONFIG) return redirectToLogin();
    sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    var sessionResult = await sb.auth.getSession();
    session = sessionResult.data && sessionResult.data.session;
    if (!session) return redirectToLogin();

    var profileResult = await sb.from("profiles").select("*").eq("id", session.user.id).single();
    currentProfile = profileResult.data;
    if (profileResult.error || !currentProfile || !currentProfile.active || currentProfile.role !== "admin") {
      window.location.replace("index.html");
      return;
    }

    bindEvents();
    document.getElementById("admin-identity").textContent = currentProfile.email;
    document.getElementById("admin-loading").classList.add("hidden");
    document.getElementById("admin-app").classList.remove("hidden");
    await loadDashboard();
    touchPresence();
    window.setInterval(touchPresence, 60000);
    window.setInterval(loadDashboard, 120000);
  }

  function on(id, event, handler) {
    var node = document.getElementById(id);
    if (node) node.addEventListener(event, handler);
    return node;
  }

  function bindEvents() {
    on("admin-logout", "click", async function () {
      await sb.auth.signOut();
      redirectToLogin();
    });
    on("refresh-admin", "click", loadDashboard);
    on("open-create-user", "click", function () {
      var form = document.getElementById("create-user-form");
      var feedback = document.getElementById("create-user-feedback");
      var dialog = document.getElementById("create-user-dialog");
      if (form) form.reset();
      if (feedback) feedback.textContent = "";
      syncAuditLimitField(form);
      if (dialog) dialog.showModal();
    });

    document.querySelectorAll(".audit-unlimited-toggle").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        syncAuditLimitField(checkbox.closest("form"));
      });
    });

    document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", function () {
        var dialog = button.closest("dialog");
        if (dialog) dialog.close();
      });
    });

    on("create-user-form", "submit", createUser);
    on("edit-user-form", "submit", saveUserEdits);
    on("edit-user-reset-password", "click", resetUserPassword);

    var generateButton = document.querySelector('[data-generate-password]');
    if (generateButton) {
      generateButton.addEventListener("click", function () {
        var form = document.getElementById("create-user-form");
        var field = form && form.querySelector('[name="password"]');
        if (field) field.value = generatePasswordClient();
      });
    }

    on("password-reveal-copy", "click", function () {
      var valueNode = document.getElementById("password-reveal-value");
      var value = valueNode ? valueNode.textContent : "";
      if (!value) return;
      navigator.clipboard.writeText(value).then(function () {
        showToast("Contraseña copiada.");
      });
    });

    on("user-search", "input", function (event) {
      searchQuery = event.target.value.trim().toLowerCase();
      renderUsers();
    });
    on("vault-search", "input", function (event) {
      vaultQuery = event.target.value.trim().toLowerCase();
      renderVault();
    });
    on("connections-search", "input", function (event) {
      connectionsQuery = event.target.value.trim().toLowerCase();
      renderConnections();
    });
    on("user-org-filter", "change", function (event) {
      userOrgFilter = event.target.value;
      renderUsers();
    });
    on("resend-all-access", "click", resendAllAccess);
    on("org-search", "input", function (event) {
      orgSearchQuery = event.target.value.trim().toLowerCase();
      renderOrganizations();
    });

    on("users-table-body", "change", onUserTableChange);
    on("users-table-body", "click", onUserTableClick);
    on("vault-table-body", "click", onVaultTableClick);
    on("vault-backup-all", "click", backupAllExports);
    on("vault-wipe-data", "click", openWipeDialog);
    on("wipe-data-form", "submit", submitWipeData);
    on("wipe-confirm-input", "input", syncWipeConfirmState);

    on("open-create-organization", "click", function () {
      var form = document.getElementById("create-organization-form");
      var feedback = document.getElementById("create-organization-feedback");
      var dialog = document.getElementById("create-organization-dialog");
      if (form) form.reset();
      if (feedback) feedback.textContent = "";
      if (dialog) dialog.showModal();
    });
    on("create-organization-form", "submit", createOrganization);
    on("edit-organization-form", "submit", saveOrganizationEdits);
    on("organizations-table-body", "click", onOrganizationTableClick);
  }

  async function apiRequest(path, options) {
    try {
      var response = await fetch(path, options);
      var data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = { error: "El servidor respondió de forma inesperada. Intenta otra vez." };
      }
      return { ok: response.ok, status: response.status, data: data };
    } catch (networkError) {
      return { ok: false, status: 0, data: { error: "No se pudo conectar con el servidor. Revisa tu conexión e intenta otra vez." } };
    }
  }

  function syncAuditLimitField(form) {
    if (!form) return;
    var checkbox = form.querySelector('[name="auditUnlimited"]');
    var input = form.querySelector('[name="auditLimit"]');
    if (!checkbox || !input) return;
    input.disabled = checkbox.checked;
    if (checkbox.checked) input.value = "";
  }

  function generatePasswordClient() {
    var out = "";
    var i;
    for (i = 0; i < 14; i += 1) {
      out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
    }
    return out;
  }

  async function touchPresence() {
    if (!sb) return;
    await sb.rpc("touch_presence");
  }

  async function loadDashboard() {
    setSyncing(true);
    var results = await Promise.all([
      sb.from("profiles").select("*").order("created_at", { ascending: false }),
      sb.from("audits").select("id,created_by,auditor_id,status,created_at"),
      sb.from("audit_activity_log").select("id,actor_id,audit_id,action,detail,created_at").order("created_at", { ascending: false }).limit(250),
      sb.from("audit_exports").select("id,audit_id,actor_id,filename,storage_path,iso_code,file_size,progress,created_at,expires_at").order("created_at", { ascending: false }).limit(200),
      sb.from("login_events").select("id,user_id,email,ip,user_agent,created_at").order("created_at", { ascending: false }).limit(200),
      sb.from("organizations").select("*").order("name", { ascending: true })
    ]);
    setSyncing(false);

    var error = results.find(function (result) { return result.error; });
    if (error) {
      showToast("No se pudo actualizar el panel. Revisa que la migración administrativa esté aplicada.");
      return;
    }
    profiles = results[0].data || [];
    audits = results[1].data || [];
    activity = results[2].data || [];
    exports = results[3].data || [];
    connections = results[4].data || [];
    organizations = results[5].data || [];
    renderAll();
    purgeExpiredExports();
  }

  async function purgeExpiredExports() {
    var nowIso = new Date().toISOString();
    var expired = exports.filter(function (item) { return item.expires_at && item.expires_at < nowIso; });
    if (!expired.length) return;

    var i;
    for (i = 0; i < expired.length; i += 1) {
      var item = expired[i];
      if (item.storage_path) await sb.storage.from("audit-exports").remove([item.storage_path]);
      await sb.from("audit_exports").delete().eq("id", item.id);
    }
    exports = exports.filter(function (item) { return !expired.some(function (gone) { return gone.id === item.id; }); });
    renderVault();
  }

  function renderAll() {
    var online = profiles.filter(isOnline).length;
    var activeCount = profiles.filter(function (profile) { return profile.active; }).length;
    var exportCount = activity.filter(isExport).length;
    document.getElementById("metric-users").textContent = profiles.length;
    document.getElementById("metric-active-users").textContent = activeCount + " cuentas activas";
    document.getElementById("metric-online").textContent = online;
    document.getElementById("metric-audits").textContent = audits.length;
    document.getElementById("metric-completed").textContent = audits.filter(function (audit) { return audit.status === "completed"; }).length + " concluidas";
    document.getElementById("metric-exports").textContent = exportCount;
    populateOrganizationSelects();
    renderUsers();
    renderOrganizations();
    renderActivity();
    renderVault();
    renderConnections();
  }

  function populateOrganizationSelects() {
    var optionsHtml = '<option value="">Sin empresa</option>' + organizations.map(function (org) {
      return '<option value="' + esc(org.id) + '">' + esc(org.name) + (org.active ? '' : ' (archivada)') + '</option>';
    }).join("");

    document.querySelectorAll(".organization-select").forEach(function (select) {
      var previous = select.value;
      select.innerHTML = optionsHtml;
      if (previous) select.value = previous;
    });

    var filter = document.getElementById("user-org-filter");
    if (filter) {
      var previousFilter = filter.value;
      filter.innerHTML = '<option value="">Todas las empresas</option><option value="__none__">Sin empresa</option>'
        + organizations.map(function (org) { return '<option value="' + esc(org.id) + '">' + esc(org.name) + '</option>'; }).join("");
      filter.value = previousFilter;
    }
  }

  function renderUsers() {
    var tbody = document.getElementById("users-table-body");
    var visible = profiles.filter(function (profile) {
      var haystack = String(profile.full_name || "") + " " + String(profile.email || "");
      var matchesSearch = !searchQuery || haystack.toLowerCase().includes(searchQuery);
      var matchesOrg = !userOrgFilter
        || (userOrgFilter === "__none__" ? !profile.organization_id : profile.organization_id === userOrgFilter);
      return matchesSearch && matchesOrg;
    });
    document.getElementById("users-empty").classList.toggle("hidden", Boolean(visible.length));
    tbody.innerHTML = visible.map(function (profile) {
      var userAudits = audits.filter(function (audit) { return audit.created_by === profile.id || audit.auditor_id === profile.id; }).length;
      var userExports = activity.filter(function (item) { return item.actor_id === profile.id && isExport(item); }).length;
      var auditLimit = profile.audit_limit;
      var unlimited = auditLimit == null || profile.role === "admin";
      var atLimit = !unlimited && userAudits >= auditLimit;
      var auditUsage = '<span class="audit-usage' + (atLimit ? " at-limit" : "") + '"><strong>' + userAudits + '</strong><small>'
        + (unlimited ? "ilimitadas" : "/ " + auditLimit) + '</small></span>';
      var status = !profile.active
        ? '<span class="status-pill inactive">Inactivo</span>'
        : isOnline(profile)
          ? '<span class="status-pill online">En línea</span>'
          : '<span class="status-pill">Desconectado</span>';
      var self = profile.id === currentProfile.id;
      return '<tr data-user-id="' + esc(profile.id) + '">'
        + '<td><div class="person-cell"><span class="person-avatar">' + initials(profile) + '</span><span><strong>' + esc(profile.full_name || "Sin nombre") + '</strong><small>' + esc(profile.email) + '</small></span></div></td>'
        + '<td>' + status + '</td>'
        + '<td><select class="role-select" data-action="role" ' + (self ? "disabled" : "") + '>'
        + roleOption("admin", "Administrador", profile.role)
        + roleOption("auditor", "Auditor", profile.role)
        + roleOption("viewer", "Solo lectura", profile.role)
        + '</select></td>'
        + '<td><select class="role-select" data-action="organization">' + organizationOptionsHtml(profile.organization_id) + '</select></td>'
        + '<td>' + formatDate(profile.last_login_at) + '</td>'
        + '<td>' + auditUsage + '</td>'
        + '<td><strong>' + userExports + '</strong></td>'
        + '<td><div class="row-actions">'
        + '<button class="icon-button" data-action="edit" title="Editar cuenta"><i class="fa-solid fa-pen"></i></button>'
        + '<button class="icon-button" data-action="resend" title="' + (profile.active ? "Reenviar correo de acceso" : "Activa el acceso antes de reenviar el correo") + '" ' + (profile.active ? "" : "disabled") + '><i class="fa-solid fa-paper-plane"></i></button>'
        + '<button class="icon-button" data-action="toggle" title="' + (profile.active ? "Desactivar acceso" : "Activar acceso") + '" ' + (self ? "disabled" : "") + '><i class="fa-solid ' + (profile.active ? "fa-user-lock" : "fa-user-check") + '"></i></button>'
        + '<button class="icon-button" data-action="delete" title="Eliminar usuario" ' + (self ? "disabled" : "") + '><i class="fa-solid fa-trash"></i></button>'
        + '</div></td></tr>';
    }).join("");
  }

  function organizationOptionsHtml(selectedId) {
    var html = '<option value=""' + (selectedId ? "" : " selected") + '>Sin empresa</option>';
    html += organizations.map(function (org) {
      return '<option value="' + esc(org.id) + '"' + (org.id === selectedId ? " selected" : "") + '>' + esc(org.name) + '</option>';
    }).join("");
    return html;
  }

  function renderOrganizations() {
    var tbody = document.getElementById("organizations-table-body");
    if (!tbody) return;
    var visible = organizations.filter(function (org) {
      return !orgSearchQuery || String(org.name || "").toLowerCase().includes(orgSearchQuery);
    });
    document.getElementById("organizations-empty").classList.toggle("hidden", Boolean(visible.length));
    tbody.innerHTML = visible.map(function (org) {
      var members = profiles.filter(function (profile) { return profile.organization_id === org.id; });
      var activeMembers = members.filter(function (profile) { return profile.active; });
      var status = org.active
        ? '<span class="status-pill online">Activa</span>'
        : '<span class="status-pill inactive">Archivada</span>';
      var expanded = Boolean(expandedOrgIds[org.id]);
      var rows = '<tr data-org-id="' + esc(org.id) + '" class="' + (expanded ? "is-expanded" : "") + '">'
        + '<td><strong>' + esc(org.name) + '</strong>' + (org.notes ? '<br><small>' + esc(org.notes) + '</small>' : '') + '</td>'
        + '<td>' + status + '</td>'
        + '<td><button type="button" class="member-count-toggle" data-action="toggle-members" ' + (members.length ? "" : "disabled") + '><strong>' + members.length + '</strong> <i class="fa-solid fa-chevron-' + (expanded ? "up" : "down") + '"></i></button></td>'
        + '<td><strong>' + activeMembers.length + '</strong></td>'
        + '<td><div class="row-actions">'
        + '<button class="icon-button" data-action="edit" title="Editar empresa"><i class="fa-solid fa-pen"></i></button>'
        + '<button class="icon-button warning" data-action="revoke-all" title="' + (activeMembers.length ? "Revocar acceso a todas sus personas" : "No hay accesos activos que revocar") + '" ' + (activeMembers.length ? "" : "disabled") + '><i class="fa-solid fa-user-slash"></i></button>'
        + '<button class="icon-button danger" data-action="delete" title="' + (members.length ? "Reasigna o quita a las personas de esta empresa antes de eliminarla" : "Eliminar empresa") + '" ' + (members.length ? "disabled" : "") + '><i class="fa-solid fa-trash"></i></button>'
        + '</div></td></tr>';

      if (expanded && members.length) {
        rows += '<tr class="org-members-row"><td colspan="5"><div class="member-chip-list">'
          + members.map(function (member) {
            var dotClass = member.active ? "online" : "inactive";
            return '<span class="member-chip"><span class="status-pill ' + dotClass + '"></span><span><strong>' + esc(member.full_name || member.email) + '</strong><small>' + esc(member.email) + ' &middot; ' + esc(roleLabelEs(member.role)) + '</small></span></span>';
          }).join("")
          + '</div></td></tr>';
      }
      return rows;
    }).join("");
  }

  function roleLabelEs(role) {
    if (role === "admin") return "Administrador";
    if (role === "auditor") return "Auditor";
    return "Solo lectura";
  }

  function renderVault() {
    var tbody = document.getElementById("vault-table-body");
    if (!tbody) return;
    var visible = exports.filter(function (item) {
      var profile = profiles.find(function (candidate) { return candidate.id === item.actor_id; });
      var haystack = String(item.filename || "") + " " + String(profile ? (profile.full_name || profile.email) : "");
      return !vaultQuery || haystack.toLowerCase().includes(vaultQuery);
    });
    document.getElementById("vault-empty").classList.toggle("hidden", Boolean(visible.length));
    tbody.innerHTML = visible.map(function (item) {
      var profile = profiles.find(function (candidate) { return candidate.id === item.actor_id; });
      var progressBadge = typeof item.progress === "number"
        ? '<span class="status-pill' + (item.progress >= 100 ? " online" : "") + '">' + (item.progress >= 100 ? "Completada" : item.progress + "%") + '</span>'
        : "—";
      return '<tr data-export-id="' + esc(item.id) + '" data-storage-path="' + esc(item.storage_path) + '" data-filename="' + esc(item.filename) + '">'
        + '<td><i class="fa-solid fa-file-pdf" style="color:#a6322b;margin-right:.5rem"></i>' + esc(item.filename) + '</td>'
        + '<td>' + esc(profile ? (profile.full_name || profile.email) : "—") + '</td>'
        + '<td>' + esc(item.iso_code || "—") + '</td>'
        + '<td>' + progressBadge + '</td>'
        + '<td>' + formatSize(item.file_size) + '</td>'
        + '<td>' + formatDate(item.created_at) + '</td>'
        + '<td>' + formatExpiry(item.expires_at) + '</td>'
        + '<td><div class="row-actions">'
        + '<button class="icon-button" data-action="download" title="Descargar"><i class="fa-solid fa-download"></i></button>'
        + '<button class="icon-button" data-action="delete-export" title="Eliminar archivo"><i class="fa-solid fa-trash"></i></button>'
        + '</div></td></tr>';
    }).join("");
  }

  function renderConnections() {
    var tbody = document.getElementById("connections-table-body");
    if (!tbody) return;
    var visible = connections.filter(function (item) {
      var haystack = String(item.email || "") + " " + String(item.ip || "");
      return !connectionsQuery || haystack.toLowerCase().includes(connectionsQuery);
    });
    document.getElementById("connections-empty").classList.toggle("hidden", Boolean(visible.length));
    tbody.innerHTML = visible.map(function (item) {
      var profile = profiles.find(function (candidate) { return candidate.id === item.user_id; });
      return '<tr>'
        + '<td><div class="person-cell"><span class="person-avatar">' + initials(profile || { email: item.email }) + '</span><span><strong>' + esc(profile ? (profile.full_name || profile.email) : (item.email || "Desconocido")) + '</strong></span></div></td>'
        + '<td>' + esc(item.ip || "—") + '</td>'
        + '<td>' + esc(describeUserAgent(item.user_agent)) + '</td>'
        + '<td>' + formatDate(item.created_at) + '</td></tr>';
    }).join("");
  }

  function renderActivity() {
    var list = document.getElementById("activity-list");
    var recent = activity.slice(0, 12);
    if (!recent.length) {
      list.innerHTML = '<div class="empty-state">La actividad registrada aparecerá aquí.</div>';
      return;
    }
    list.innerHTML = recent.map(function (item) {
      var profile = profiles.find(function (candidate) { return candidate.id === item.actor_id; });
      return '<article class="activity-item">'
        + '<span class="activity-icon"><i class="fa-solid ' + activityIcon(item.action) + '"></i></span>'
        + '<p><strong>' + esc(profile ? (profile.full_name || profile.email) : "Usuario del sistema") + '</strong>' + esc(activityLabel(item.action)) + '</p>'
        + '<time>' + formatDate(item.created_at) + '</time></article>';
    }).join("");
  }

  async function onUserTableChange(event) {
    var action = event.target.dataset.action;
    if (action !== "role" && action !== "organization") return;
    var row = event.target.closest("[data-user-id]");
    if (action === "role") {
      await updateProfile(row.dataset.userId, { role: event.target.value }, "Rol actualizado.");
      return;
    }
    await updateProfile(row.dataset.userId, { organization_id: event.target.value || null }, "Empresa actualizada.");
  }

  async function onUserTableClick(event) {
    var button = event.target.closest("[data-action]");
    if (!button || button.tagName !== "BUTTON") return;
    var row = button.closest("[data-user-id]");
    var profile = profiles.find(function (item) { return item.id === row.dataset.userId; });
    if (!profile) return;

    if (button.dataset.action === "edit") {
      openEditDialog(profile);
    }
    if (button.dataset.action === "resend") {
      await resendUserAccess(profile);
    }
    if (button.dataset.action === "toggle") {
      await updateProfile(profile.id, { active: !profile.active }, profile.active ? "Acceso desactivado." : "Acceso activado.");
    }
    if (button.dataset.action === "delete") {
      if (!window.confirm("¿Eliminar la cuenta de " + (profile.full_name || profile.email) + "? Esta acción no se puede deshacer.")) return;
      await deleteUser(profile.id);
    }
  }

  async function onVaultTableClick(event) {
    var button = event.target.closest("[data-action]");
    if (!button || button.tagName !== "BUTTON") return;
    var row = button.closest("[data-storage-path]");
    if (!row) return;

    if (button.dataset.action === "download") {
      await downloadExportFile(row.dataset.storagePath, row.dataset.filename);
    }
    if (button.dataset.action === "delete-export") {
      if (!window.confirm("¿Eliminar este archivo de la bóveda? Esta acción no se puede deshacer.")) return;
      var removeResult = await sb.storage.from("audit-exports").remove([row.dataset.storagePath]);
      if (removeResult.error) return showToast("No se pudo eliminar el archivo.");
      await sb.from("audit_exports").delete().eq("id", row.dataset.exportId);
      showToast("Archivo eliminado de la bóveda.");
      await loadDashboard();
    }
  }

  async function downloadExportFile(storagePath, filename) {
    var result = await sb.storage.from("audit-exports").createSignedUrl(storagePath, 300);
    if (result.error || !result.data) {
      showToast("No se pudo generar el enlace de descarga.");
      return false;
    }
    var link = document.createElement("a");
    link.href = result.data.signedUrl;
    link.download = filename || "auditoria.pdf";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }

  async function backupAllExports() {
    if (!exports.length) return showToast("No hay archivos en la bóveda todavía.");
    showToast("Preparando " + exports.length + " descarga(s)...");
    var i;
    for (i = 0; i < exports.length; i += 1) {
      await downloadExportFile(exports[i].storage_path, exports[i].filename);
      await new Promise(function (resolve) { window.setTimeout(resolve, 350); });
    }
  }

  function openWipeDialog() {
    var form = document.getElementById("wipe-data-form");
    if (form) form.reset();
    document.getElementById("wipe-data-feedback").textContent = "";
    syncWipeConfirmState();
    document.getElementById("wipe-data-dialog").showModal();
  }

  function syncWipeConfirmState() {
    var input = document.getElementById("wipe-confirm-input");
    var submit = document.getElementById("wipe-data-submit");
    if (!input || !submit) return;
    submit.disabled = input.value.trim() !== "BORRAR TODO";
  }

  async function submitWipeData(event) {
    event.preventDefault();
    var feedback = document.getElementById("wipe-data-feedback");
    var submit = document.getElementById("wipe-data-submit");
    var input = document.getElementById("wipe-confirm-input");
    submit.disabled = true;
    feedback.textContent = "Borrando todos los datos y archivos…";

    var result = await apiRequest("/api/admin-wipe-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ confirm: input.value.trim() })
    });

    if (!result.ok) {
      feedback.textContent = (result.data && result.data.error) || "No se pudo completar el borrado.";
      syncWipeConfirmState();
      return;
    }
    feedback.textContent = "";
    document.getElementById("wipe-data-dialog").close();
    showToast("Todos los datos y archivos fueron eliminados.");
    await loadDashboard();
  }

  function openEditDialog(profile) {
    var form = document.getElementById("edit-user-form");
    form.reset();
    document.getElementById("edit-user-feedback").textContent = "";
    form.querySelector('[name="userId"]').value = profile.id;
    form.querySelector('[name="fullName"]').value = profile.full_name || "";
    form.querySelector('[name="email"]').value = profile.email || "";
    form.querySelector('[name="phone"]').value = profile.phone || "";
    form.querySelector('[name="department"]').value = profile.department || "";
    form.querySelector('[name="organizationId"]').value = profile.organization_id || "";
    form.querySelector('[name="role"]').value = profile.role;
    form.querySelector('[name="active"]').checked = Boolean(profile.active);
    form.querySelector('[name="role"]').disabled = profile.id === currentProfile.id;
    form.querySelector('[name="active"]').disabled = profile.id === currentProfile.id;
    form.querySelector('[name="auditLimit"]').value = profile.audit_limit || "";
    form.querySelector('[name="auditUnlimited"]').checked = profile.audit_limit == null;
    syncAuditLimitField(form);
    document.getElementById("edit-user-dialog").showModal();
  }

  async function updateProfile(userId, patch, successMessage) {
    var result = await sb.from("profiles").update(patch).eq("id", userId);
    if (result.error) return showToast("No se pudo actualizar el acceso.");
    showToast(successMessage);
    await loadDashboard();
  }

  async function createUser(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var feedback = document.getElementById("create-user-feedback");
    var submit = form.querySelector('[type="submit"]');
    var values = new FormData(form);
    submit.disabled = true;
    feedback.textContent = "Creando acceso…";

    var response = await apiRequest("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({
        fullName: values.get("fullName"),
        email: values.get("email"),
        phone: values.get("phone"),
        department: values.get("department"),
        organizationId: values.get("organizationId") || null,
        password: values.get("password") || undefined,
        role: values.get("role"),
        active: values.get("active") === "on",
        sendEmail: values.get("sendEmail") === "on",
        auditLimit: values.get("auditUnlimited") === "on" ? null : (values.get("auditLimit") || null)
      })
    });
    submit.disabled = false;
    var result = response.data;
    if (!response.ok) {
      feedback.textContent = result.error || "No se pudo crear el acceso.";
      return;
    }
    feedback.textContent = "";
    form.reset();
    document.getElementById("create-user-dialog").close();
    showToast("Acceso creado correctamente.");
    if (result.tempPassword) {
      showPasswordReveal(result.tempPassword, result.emailSent
        ? "Se está enviando un correo a " + values.get("email") + " para que configure su acceso. Esta es la contraseña temporal por si la necesitas."
        : "No se envió correo automático (opción desactivada). Comparte esta contraseña temporal de forma segura.");
    }
    await loadDashboard();
  }

  async function saveUserEdits(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var feedback = document.getElementById("edit-user-feedback");
    var submit = form.querySelector('[type="submit"]');
    var values = new FormData(form);
    submit.disabled = true;
    feedback.textContent = "Guardando…";

    var response = await apiRequest("/api/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({
        userId: values.get("userId"),
        fullName: values.get("fullName"),
        email: values.get("email"),
        phone: values.get("phone"),
        department: values.get("department"),
        organizationId: values.get("organizationId") || null,
        auditLimit: values.get("auditUnlimited") === "on" ? null : (values.get("auditLimit") || null),
        role: values.get("role"),
        active: values.get("active") === "on"
      })
    });
    submit.disabled = false;
    var result = response.data;
    if (!response.ok) {
      feedback.textContent = result.error || "No se pudo guardar la cuenta.";
      return;
    }
    feedback.textContent = "";
    document.getElementById("edit-user-dialog").close();
    showToast("Cuenta actualizada.");
    await loadDashboard();
  }

  async function resetUserPassword() {
    var form = document.getElementById("edit-user-form");
    var userId = form.querySelector('[name="userId"]').value;
    var email = form.querySelector('[name="email"]').value;
    if (!userId) return;
    if (!window.confirm("¿Generar una nueva contraseña temporal para " + email + "?")) return;

    var feedback = document.getElementById("edit-user-feedback");
    feedback.textContent = "Generando nueva contraseña…";

    var response = await apiRequest("/api/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ userId: userId, resetPassword: true, currentEmail: email })
    });
    var result = response.data;
    feedback.textContent = "";
    if (!response.ok) {
      feedback.textContent = result.error || "No se pudo restablecer la contraseña.";
      return;
    }
    document.getElementById("edit-user-dialog").close();
    showPasswordReveal(result.tempPassword, result.emailSent
      ? "Se está enviando un correo a " + email + " para que configure su nueva contraseña. Esta es la temporal por si la necesitas."
      : "Comparte esta contraseña temporal de forma segura.");
  }

  async function resendUserAccess(profile) {
    var response = await apiRequest("/api/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ userId: profile.id, resendAccessEmail: true, currentEmail: profile.email })
    });
    if (!response.ok) {
      showToast((response.data && response.data.error) || "No se pudo reenviar el correo.");
      return false;
    }
    showToast("Correo de acceso reenviado a " + profile.email + ".");
    return true;
  }

  async function resendAllAccess() {
    var targets = profiles.filter(function (profile) { return profile.active; });
    if (!targets.length) return showToast("No hay personas activas a quienes reenviar el acceso.");
    if (!window.confirm("¿Reenviar el correo de acceso a las " + targets.length + " persona(s) activa(s)? No cambia sus contraseñas actuales.")) return;

    showToast("Reenviando acceso a " + targets.length + " persona(s)…");
    var sent = 0;
    var i;
    for (i = 0; i < targets.length; i += 1) {
      if (await resendUserAccess(targets[i])) sent += 1;
      await new Promise(function (resolve) { window.setTimeout(resolve, 350); });
    }
    showToast("Listo: correo de acceso reenviado a " + sent + " de " + targets.length + " persona(s).");
  }

  function showPasswordReveal(password, note) {
    document.getElementById("password-reveal-value").textContent = password;
    document.getElementById("password-reveal-note").textContent = note;
    document.getElementById("password-reveal-dialog").showModal();
  }

  async function deleteUser(userId) {
    var response = await apiRequest("/api/admin-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ userId: userId })
    });
    if (!response.ok) return showToast((response.data && response.data.error) || "No se pudo eliminar el usuario.");
    showToast("Usuario eliminado.");
    await loadDashboard();
  }

  async function createOrganization(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var feedback = document.getElementById("create-organization-feedback");
    var submit = form.querySelector('[type="submit"]');
    var values = new FormData(form);
    var name = values.get("name").trim();
    if (!name) return;

    submit.disabled = true;
    feedback.textContent = "Creando empresa…";

    var result = await sb.from("organizations").insert({
      name: name,
      notes: values.get("notes").trim() || null,
      created_by: currentProfile.id
    });
    submit.disabled = false;

    if (result.error) {
      feedback.textContent = result.error.code === "23505"
        ? "Ya existe una empresa con ese nombre."
        : "No se pudo crear la empresa.";
      return;
    }
    feedback.textContent = "";
    form.reset();
    document.getElementById("create-organization-dialog").close();
    showToast("Empresa creada.");
    await loadDashboard();
  }

  function openEditOrganizationDialog(org) {
    var form = document.getElementById("edit-organization-form");
    form.reset();
    document.getElementById("edit-organization-feedback").textContent = "";
    form.querySelector('[name="organizationId"]').value = org.id;
    form.querySelector('[name="name"]').value = org.name || "";
    form.querySelector('[name="notes"]').value = org.notes || "";
    form.querySelector('[name="active"]').checked = Boolean(org.active);
    document.getElementById("edit-organization-dialog").showModal();
  }

  async function saveOrganizationEdits(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var feedback = document.getElementById("edit-organization-feedback");
    var submit = form.querySelector('[type="submit"]');
    var values = new FormData(form);
    var name = values.get("name").trim();
    if (!name) return;

    submit.disabled = true;
    feedback.textContent = "Guardando…";

    var result = await sb.from("organizations").update({
      name: name,
      notes: values.get("notes").trim() || null,
      active: values.get("active") === "on"
    }).eq("id", values.get("organizationId"));
    submit.disabled = false;

    if (result.error) {
      feedback.textContent = result.error.code === "23505"
        ? "Ya existe una empresa con ese nombre."
        : "No se pudo guardar la empresa.";
      return;
    }
    feedback.textContent = "";
    document.getElementById("edit-organization-dialog").close();
    showToast("Empresa actualizada.");
    await loadDashboard();
  }

  async function onOrganizationTableClick(event) {
    var button = event.target.closest("[data-action]");
    if (!button || button.tagName !== "BUTTON" || button.disabled) return;
    var row = button.closest("[data-org-id]");
    var org = organizations.find(function (item) { return item.id === row.dataset.orgId; });
    if (!org) return;

    if (button.dataset.action === "edit") {
      openEditOrganizationDialog(org);
    }
    if (button.dataset.action === "revoke-all") {
      await revokeOrganizationAccess(org);
    }
    if (button.dataset.action === "delete") {
      await deleteOrganization(org);
    }
    if (button.dataset.action === "toggle-members") {
      expandedOrgIds[org.id] = !expandedOrgIds[org.id];
      renderOrganizations();
    }
  }

  async function revokeOrganizationAccess(org) {
    var activeMembers = profiles.filter(function (profile) { return profile.organization_id === org.id && profile.active; });
    if (!activeMembers.length) return;
    if (!window.confirm("¿Revocar el acceso de " + activeMembers.length + " persona(s) activa(s) de \"" + org.name + "\"? Podrás reactivarlas una por una después desde Personas y accesos.")) return;

    var result = await sb.from("profiles").update({ active: false }).eq("organization_id", org.id).eq("active", true);
    if (result.error) return showToast("No se pudo revocar el acceso de la empresa.");
    showToast("Acceso revocado para " + activeMembers.length + " persona(s) de " + org.name + ".");
    await loadDashboard();
  }

  async function deleteOrganization(org) {
    var members = profiles.filter(function (profile) { return profile.organization_id === org.id; });
    if (members.length) return showToast("Reasigna o quita a las " + members.length + " persona(s) de esta empresa antes de eliminarla.");
    if (!window.confirm("¿Eliminar la empresa \"" + org.name + "\"? Esta acción no se puede deshacer.")) return;

    var result = await sb.from("organizations").delete().eq("id", org.id);
    if (result.error) return showToast("No se pudo eliminar la empresa.");
    showToast("Empresa eliminada.");
    await loadDashboard();
  }

  function isOnline(profile) {
    return Boolean(profile.active && profile.last_seen_at && Date.now() - new Date(profile.last_seen_at).getTime() < 180000);
  }
  function isExport(item) { return item.action === "pdf_exported" || item.action === "export_pdf"; }
  function roleOption(value, label, selected) { return '<option value="' + value + '" ' + (value === selected ? "selected" : "") + '>' + label + '</option>'; }
  function initials(profile) {
    var source = (profile && (profile.full_name || profile.email)) || "IN";
    return esc(source.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase());
  }
  function formatDate(value) {
    if (!value) return "Sin registro";
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  function formatExpiry(value) {
    if (!value) return "—";
    var daysLeft = Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000));
    if (daysLeft <= 0) return '<span class="danger-text">Hoy</span>';
    if (daysLeft === 1) return '<span class="danger-text">Mañana</span>';
    return daysLeft + " días";
  }
  function formatSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  function describeUserAgent(ua) {
    var text = String(ua || "");
    if (!text) return "—";
    var browser = /Edg\//.test(text) ? "Edge" : /Chrome\//.test(text) ? "Chrome" : /Firefox\//.test(text) ? "Firefox" : /Safari\//.test(text) ? "Safari" : "Navegador";
    var platform = /Android/.test(text) ? "Android" : /iPhone|iPad/.test(text) ? "iOS" : /Windows/.test(text) ? "Windows" : /Mac OS/.test(text) ? "macOS" : /Linux/.test(text) ? "Linux" : "";
    return [browser, platform].filter(Boolean).join(" · ");
  }
  function activityLabel(action) {
    var labels = {
      pdf_exported: " exportó un informe PDF.",
      export_pdf: " exportó un informe PDF.",
      audit_created: " creó una auditoría.",
      audit_archived: " concluyó una auditoría.",
      evidence_uploaded: " agregó evidencia.",
      user_created: " creó un acceso."
    };
    return labels[action] || " registró actividad en la plataforma.";
  }
  function activityIcon(action) {
    if (isExport({ action: action })) return "fa-file-arrow-down";
    if (action && action.includes("evidence")) return "fa-paperclip";
    if (action && action.includes("audit")) return "fa-clipboard-check";
    return "fa-shield-halved";
  }
  function setSyncing(active) {
    var state = document.getElementById("sync-state");
    if (!state) return;
    state.innerHTML = active ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Actualizando' : '<i class="fa-solid fa-circle"></i> Sincronizado';
  }
  function showToast(message) {
    var toast = document.getElementById("admin-toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 3600);
  }
  function redirectToLogin() { window.location.replace("login.html"); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
}());
