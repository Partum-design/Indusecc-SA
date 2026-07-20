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
  var searchQuery = "";
  var vaultQuery = "";
  var connectionsQuery = "";
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
      if (dialog) dialog.showModal();
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

    on("users-table-body", "change", onUserTableChange);
    on("users-table-body", "click", onUserTableClick);
    on("vault-table-body", "click", onVaultTableClick);
    on("vault-backup-all", "click", backupAllExports);
    on("vault-wipe-data", "click", openWipeDialog);
    on("wipe-data-form", "submit", submitWipeData);
    on("wipe-confirm-input", "input", syncWipeConfirmState);
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
      sb.from("audit_exports").select("id,audit_id,actor_id,filename,storage_path,iso_code,file_size,created_at").order("created_at", { ascending: false }).limit(200),
      sb.from("login_events").select("id,user_id,email,ip,user_agent,created_at").order("created_at", { ascending: false }).limit(200)
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
    renderAll();
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
    renderUsers();
    renderActivity();
    renderVault();
    renderConnections();
  }

  function renderUsers() {
    var tbody = document.getElementById("users-table-body");
    var visible = profiles.filter(function (profile) {
      var haystack = String(profile.full_name || "") + " " + String(profile.email || "");
      return !searchQuery || haystack.toLowerCase().includes(searchQuery);
    });
    document.getElementById("users-empty").classList.toggle("hidden", Boolean(visible.length));
    tbody.innerHTML = visible.map(function (profile) {
      var userAudits = audits.filter(function (audit) { return audit.created_by === profile.id || audit.auditor_id === profile.id; }).length;
      var userExports = activity.filter(function (item) { return item.actor_id === profile.id && isExport(item); }).length;
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
        + '<td>' + formatDate(profile.last_login_at) + '</td>'
        + '<td><strong>' + userAudits + '</strong></td>'
        + '<td><strong>' + userExports + '</strong></td>'
        + '<td><div class="row-actions">'
        + '<button class="icon-button" data-action="edit" title="Editar cuenta"><i class="fa-solid fa-pen"></i></button>'
        + '<button class="icon-button" data-action="toggle" title="' + (profile.active ? "Desactivar acceso" : "Activar acceso") + '" ' + (self ? "disabled" : "") + '><i class="fa-solid ' + (profile.active ? "fa-user-lock" : "fa-user-check") + '"></i></button>'
        + '<button class="icon-button" data-action="delete" title="Eliminar usuario" ' + (self ? "disabled" : "") + '><i class="fa-solid fa-trash"></i></button>'
        + '</div></td></tr>';
    }).join("");
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
      return '<tr data-export-id="' + esc(item.id) + '" data-storage-path="' + esc(item.storage_path) + '" data-filename="' + esc(item.filename) + '">'
        + '<td><i class="fa-solid fa-file-pdf" style="color:#a6322b;margin-right:.5rem"></i>' + esc(item.filename) + '</td>'
        + '<td>' + esc(profile ? (profile.full_name || profile.email) : "—") + '</td>'
        + '<td>' + esc(item.iso_code || "—") + '</td>'
        + '<td>' + formatSize(item.file_size) + '</td>'
        + '<td>' + formatDate(item.created_at) + '</td>'
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
    if (event.target.dataset.action !== "role") return;
    var row = event.target.closest("[data-user-id]");
    await updateProfile(row.dataset.userId, { role: event.target.value }, "Rol actualizado.");
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

    var response = await fetch("/api/admin-wipe-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ confirm: input.value.trim() })
    });
    var result = await response.json();
    if (!response.ok) {
      feedback.textContent = result.error || "No se pudo completar el borrado.";
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
    form.querySelector('[name="role"]').value = profile.role;
    form.querySelector('[name="active"]').checked = Boolean(profile.active);
    form.querySelector('[name="role"]').disabled = profile.id === currentProfile.id;
    form.querySelector('[name="active"]').disabled = profile.id === currentProfile.id;
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

    var response = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({
        fullName: values.get("fullName"),
        email: values.get("email"),
        phone: values.get("phone"),
        department: values.get("department"),
        password: values.get("password") || undefined,
        role: values.get("role"),
        active: values.get("active") === "on",
        sendEmail: values.get("sendEmail") === "on"
      })
    });
    var result = await response.json();
    submit.disabled = false;
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

    var response = await fetch("/api/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({
        userId: values.get("userId"),
        fullName: values.get("fullName"),
        email: values.get("email"),
        phone: values.get("phone"),
        department: values.get("department"),
        role: values.get("role"),
        active: values.get("active") === "on"
      })
    });
    var result = await response.json();
    submit.disabled = false;
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

    var response = await fetch("/api/admin-users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ userId: userId, resetPassword: true, currentEmail: email })
    });
    var result = await response.json();
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

  function showPasswordReveal(password, note) {
    document.getElementById("password-reveal-value").textContent = password;
    document.getElementById("password-reveal-note").textContent = note;
    document.getElementById("password-reveal-dialog").showModal();
  }

  async function deleteUser(userId) {
    var response = await fetch("/api/admin-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
      body: JSON.stringify({ userId: userId })
    });
    var result = await response.json();
    if (!response.ok) return showToast(result.error || "No se pudo eliminar el usuario.");
    showToast("Usuario eliminado.");
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
