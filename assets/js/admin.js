(function () {
  "use strict";

  var sb;
  var session;
  var currentProfile;
  var profiles = [];
  var audits = [];
  var activity = [];
  var searchQuery = "";
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

  function bindEvents() {
    document.getElementById("admin-logout").addEventListener("click", async function () {
      await sb.auth.signOut();
      redirectToLogin();
    });
    document.getElementById("refresh-admin").addEventListener("click", loadDashboard);
    document.getElementById("open-create-user").addEventListener("click", function () {
      document.getElementById("create-user-dialog").showModal();
    });
    document.querySelector("[data-close-dialog]").addEventListener("click", function () {
      document.getElementById("create-user-dialog").close();
    });
    document.getElementById("create-user-form").addEventListener("submit", createUser);
    document.getElementById("user-search").addEventListener("input", function (event) {
      searchQuery = event.target.value.trim().toLowerCase();
      renderUsers();
    });
    document.getElementById("users-table-body").addEventListener("change", onUserTableChange);
    document.getElementById("users-table-body").addEventListener("click", onUserTableClick);
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
      sb.from("audit_activity_log").select("id,actor_id,audit_id,action,detail,created_at").order("created_at", { ascending: false }).limit(250)
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
    renderAll();
  }

  function renderAll() {
    var online = profiles.filter(isOnline).length;
    var activeCount = profiles.filter(function (profile) { return profile.active; }).length;
    var exports = activity.filter(isExport).length;
    document.getElementById("metric-users").textContent = profiles.length;
    document.getElementById("metric-active-users").textContent = activeCount + " cuentas activas";
    document.getElementById("metric-online").textContent = online;
    document.getElementById("metric-audits").textContent = audits.length;
    document.getElementById("metric-completed").textContent = audits.filter(function (audit) { return audit.status === "completed"; }).length + " concluidas";
    document.getElementById("metric-exports").textContent = exports;
    renderUsers();
    renderActivity();
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
      var exports = activity.filter(function (item) { return item.actor_id === profile.id && isExport(item); }).length;
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
        + '<td><strong>' + exports + '</strong></td>'
        + '<td><div class="row-actions">'
        + '<button class="icon-button" data-action="toggle" title="' + (profile.active ? "Desactivar acceso" : "Activar acceso") + '" ' + (self ? "disabled" : "") + '><i class="fa-solid ' + (profile.active ? "fa-user-lock" : "fa-user-check") + '"></i></button>'
        + '<button class="icon-button" data-action="delete" title="Eliminar usuario" ' + (self ? "disabled" : "") + '><i class="fa-solid fa-trash"></i></button>'
        + '</div></td></tr>';
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

    if (button.dataset.action === "toggle") {
      await updateProfile(profile.id, { active: !profile.active }, profile.active ? "Acceso desactivado." : "Acceso activado.");
    }
    if (button.dataset.action === "delete") {
      if (!window.confirm("¿Eliminar la cuenta de " + (profile.full_name || profile.email) + "? Esta acción no se puede deshacer.")) return;
      await deleteUser(profile.id);
    }
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
        password: values.get("password"),
        role: values.get("role"),
        active: values.get("active") === "on"
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
    await loadDashboard();
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
    var source = profile.full_name || profile.email || "IN";
    return esc(source.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase());
  }
  function formatDate(value) {
    if (!value) return "Sin registro";
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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
