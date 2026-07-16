let csrfToken = "";

const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");
const createForm = document.getElementById("createForm");
const logoutButton = document.getElementById("logout");

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

async function api(url, options = {}) {
  const headers = new Headers(options.headers || {});

  if (csrfToken) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin"
  });

  if (response.status === 401) {
    window.location.href = "/admin/login/";
    throw new Error("Your session has expired. Please sign in again.");
  }

  return response;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadUsers() {
  setStatus("Loading users…");

  const meResponse = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "same-origin"
  });

  if (!meResponse.ok) {
    window.location.href = "/admin/login/";
    return;
  }

  const currentUser = await meResponse.json();
  csrfToken = currentUser.csrfToken || "";

  if (!currentUser.canManageUsers) {
    if (usersEl) usersEl.innerHTML = "";
    if (createForm) createForm.hidden = true;

    setStatus(
      "Only haneen.jalal@gmail.com or omar.manaa@gmail.com can manage users and reset passwords.",
      "error"
    );
    return;
  }

  const response = await api("/api/users", {
    method: "GET",
    cache: "no-store"
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      data.error || `Could not load users (${response.status}).`
    );
  }

  const users = Array.isArray(data.users) ? data.users : [];

  if (!usersEl) {
    throw new Error("The Existing users container is missing from the page.");
  }

  usersEl.innerHTML = users.length
    ? users.map(user => `
        <div class="item">
          <div class="item-heading">
            <strong>
              ${escapeHtml(user.name)} — ${escapeHtml(user.email)}
            </strong>
            <span>${escapeHtml(user.role)}</span>
          </div>

          <p>Status: ${user.active ? "Active" : "Disabled"}</p>

          <button
            type="button"
            class="reset-password"
            data-user-id="${escapeHtml(user.id)}"
            data-user-email="${escapeHtml(user.email)}">
            Reset password
          </button>

          <button
            type="button"
            class="toggle-user"
            data-user-id="${escapeHtml(user.id)}"
            data-active="${user.active ? "0" : "1"}">
            ${user.active ? "Disable" : "Enable"}
          </button>
        </div>
      `).join("")
    : "<p>No users have been created yet.</p>";

  usersEl.querySelectorAll(".reset-password").forEach(button => {
    button.addEventListener("click", () => {
      resetPassword(
        button.dataset.userId,
        button.dataset.userEmail
      );
    });
  });

  usersEl.querySelectorAll(".toggle-user").forEach(button => {
    button.addEventListener("click", () => {
      toggleUser(
        button.dataset.userId,
        button.dataset.active === "1"
      );
    });
  });

  setStatus(`Ready. ${users.length} user${users.length === 1 ? "" : "s"} found.`, "ok");
}

if (createForm) {
  createForm.addEventListener("submit", async event => {
    event.preventDefault();

    const emailInput = document.getElementById("newEmail");
    const nameInput = document.getElementById("newName");
    const roleInput = document.getElementById("newRole");
    const passwordInput = document.getElementById("newPassword");
    const submitButton = createForm.querySelector('button[type="submit"]');

    if (!emailInput || !nameInput || !roleInput || !passwordInput) {
      setStatus("One or more user form fields are missing.", "error");
      return;
    }

    const payload = {
      email: emailInput.value.trim().toLowerCase(),
      name: nameInput.value.trim(),
      role: roleInput.value,
      password: passwordInput.value
    };

    if (!payload.email || !payload.name || !payload.password) {
      setStatus("Please complete all user fields.", "error");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating…";
    }

    setStatus("Creating user…");

    try {
      const response = await api("/api/users", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data.error || `Could not create user (${response.status}).`
        );
      }

      createForm.reset();
      await loadUsers();
      setStatus("User created successfully.", "ok");
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Could not create the user.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create user";
      }
    }
  });
}

async function resetPassword(userId, userEmail) {
  const password = window.prompt(
    `Enter a new password for ${userEmail}.\n\n` +
    "Minimum 12 characters, including uppercase, lowercase and a number."
  );

  if (!password) return;

  setStatus(`Resetting password for ${userEmail}…`);

  try {
    const response = await api(
      `/api/users/${encodeURIComponent(userId)}/password`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ password })
      }
    );

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        data.error || `Password reset failed (${response.status}).`
      );
    }

    setStatus(`Password reset successfully for ${userEmail}.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Password reset failed.", "error");
  }
}

async function toggleUser(userId, active) {
  setStatus(active ? "Enabling user…" : "Disabling user…");

  try {
    const response = await api(
      `/api/users/${encodeURIComponent(userId)}/status`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ active })
      }
    );

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        data.error || `Could not update the user (${response.status}).`
      );
    }

    await loadUsers();
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Could not update the user.", "error");
  }
}

/*
 * Some deployed versions of users/index.html do not include a Logout button.
 * Only attach this handler when the element exists.
 */
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login/";
    }
  });
}

/*
 * Start loading only after all optional element handlers are safely registered.
 */
loadUsers().catch(error => {
  console.error(error);
  setStatus(
    error.message || "Could not load user management.",
    "error"
  );
});
