(function () {
    "use strict";

    var sb = (window.SUPABASE_CONFIG && window.supabase)
        ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
        : null;

    var form = document.getElementById("reset-form");
    var newPassword = document.getElementById("newPassword");
    var confirmPassword = document.getElementById("confirmPassword");
    var submitButton = document.getElementById("reset-submit");
    var feedback = document.getElementById("reset-feedback");
    var hasRecoverySession = false;

    function showFeedback(message, isError) {
        feedback.textContent = message || "";
        feedback.style.color = isError ? "#a6322b" : "#23845b";
    }

    if (!sb) {
        showFeedback("El acceso no está configurado. Revisa la conexión con Supabase.", true);
        submitButton.disabled = true;
        return;
    }

    sb.auth.onAuthStateChange(function (event) {
        if (event === "PASSWORD_RECOVERY") hasRecoverySession = true;
    });

    sb.auth.getSession().then(function (result) {
        if (result.data && result.data.session) hasRecoverySession = true;
        if (!hasRecoverySession) {
            showFeedback("Este enlace no es válido o ya expiró. Solicita uno nuevo desde la pantalla de acceso.", true);
        }
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var passwordValue = String(newPassword.value || "");
        var confirmValue = String(confirmPassword.value || "");

        if (passwordValue.length < 8) {
            showFeedback("La contraseña debe tener al menos 8 caracteres.", true);
            return;
        }
        if (passwordValue !== confirmValue) {
            showFeedback("Las contraseñas no coinciden.", true);
            return;
        }

        submitButton.disabled = true;
        showFeedback("Guardando...", false);

        var result = await sb.auth.updateUser({ password: passwordValue });
        if (result.error) {
            submitButton.disabled = false;
            showFeedback("No se pudo guardar la contraseña. Solicita un nuevo enlace.", true);
            return;
        }

        showFeedback("Contraseña actualizada. Redirigiendo a tu acceso...", false);
        try {
            sessionStorage.setItem("indusecc:passwordReset", "1");
        } catch (e) {}
        await sb.auth.signOut();
        window.setTimeout(function () {
            window.location.href = "login.html";
        }, 900);
    });
}());
