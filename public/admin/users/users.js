
let csrfToken = "";

const statusEl = document.getElementById("status");
const usersEl = document.getElementById("users");
const createForm = document.getElementById("createForm");
const logoutButton = document.getElementById("logout");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
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
    throw new Error("Your session has expired.");
  }

  return response;
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
    createForm.hidden = true;
    usersEl.innerHTML = "";
    setStatus(
      "Only haneen.jalal@gmail.com or omar.manaa@gmail.com can manage users.",
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
    throw new Error(data.error || `Could not load users (${response.status}).`);
  }

  const users = Array.isArray(data.users) ? data.users : [];

  usersEl.innerHTML = users.length
    ? users.map(user => `
        <div class="item">
          <div class="item-heading">
            <strong>${escapeHtml(user.name)} — ${escapeHtml(user.email)}</strong>
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
      resetPassword(button.dataset.userId, button.dataset.userEmail);
    });
  });

  usersEl.querySelectorAll(".toggle-user").forEach(button => {
    button.addEventListener("click", () => {
      toggleUser(button.dataset.userId, button.dataset.active === "1");
    });
  });

  setStatus(
    `Ready. ${users.length} user${users.length === 1 ? "" : "s"} found.`,
    "ok"
  );
}

createForm.addEventListener("submit", async event => {
  event.preventDefault();
  event.stopPropagation();

  const emailInput = document.getElementById("newEmail");
  const nameInput = document.getElementById("newName");
  const roleInput = document.getElementById("newRole");
  const passwordInput = document.getElementById("newPassword");
  const submitButton = document.getElementById("createUserButton");

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

  submitButton.disabled = true;
  submitButton.textContent = "Creating…";
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
    submitButton.disabled = false;
    submitButton.textContent = "Create user";
  }

  return false;
});

async function resetPassword(userId, email) {
  const password = window.prompt(
    `Enter a new password for ${email}.\n\n` +
    "Minimum 12 characters with uppercase, lowercase and a number."
  );

  if (!password) return;

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
    setStatus(data.error || "Password reset failed.", "error");
    return;
  }

  setStatus(`Password reset successfully for ${email}.`, "ok");
}

async function toggleUser(userId, active) {
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
    setStatus(data.error || "Could not update user.", "error");
    return;
  }

  await loadUsers();
}

logoutButton.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/admin/login/";
  }
});

loadUsers().catch(error => {
  console.error(error);
  setStatus(error.message || "Could not load users.", "error");
});
