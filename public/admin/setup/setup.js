const form = document.getElementById("setupForm");
const message = document.getElementById("message");
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = "Creating…";
  message.textContent = "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("/api/auth/setup", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        token: document.getElementById("token").value.trim(),
        email: document.getElementById("email").value.trim(),
        name: document.getElementById("name").value.trim(),
        password: document.getElementById("password").value
      }),
      signal: controller.signal
    });

    const responseText = await response.text();

    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Unexpected server response:", responseText);
    }

    if (!response.ok) {
      throw new Error(
        result.error || `Setup failed with HTTP ${response.status}.`
      );
    }

    message.textContent = "Administrator created successfully.";

    setTimeout(() => {
      window.location.href = "/admin/login/";
    }, 800);
  } catch (error) {
    if (error.name === "AbortError") {
      message.textContent =
        "The setup request timed out. Check the Cloudflare Worker logs.";
    } else {
      message.textContent = error.message || "Setup failed.";
    }

    console.error(error);
  } finally {
    clearTimeout(timeout);
    submitButton.disabled = false;
    submitButton.textContent = "Create administrator";
  }
});