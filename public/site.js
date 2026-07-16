const $ = id => document.getElementById(id);
const text = (id, value) => {
  const element = $(id);
  if (element) element.textContent = value ?? "";
};
const visible = (id, enabled) => {
  const element = $(id);
  if (element) element.classList.toggle("hidden", !enabled);
};
const asArray = value => Array.isArray(value) ? value : [];

function escapeMarkup(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function applyTheme(theme = {}) {
  const root = document.documentElement.style;
  const variables = {
    "--primary": theme.primary,
    "--primary-dark": theme.primaryDark,
    "--accent": theme.accent,
    "--blush": theme.blush,
    "--background": theme.background,
    "--surface": theme.surface,
    "--surface-alt": theme.surfaceAlt,
    "--text": theme.text,
    "--muted": theme.muted,
    "--border": theme.border,
    "--content-width": theme.contentWidth ? `${Number(theme.contentWidth)}px` : null,
    "--section-spacing": theme.sectionSpacing ? `${Number(theme.sectionSpacing)}px` : null,
    "--card-radius": theme.cardRadius !== undefined ? `${Number(theme.cardRadius)}px` : null,
    "--button-radius": theme.buttonRadius !== undefined ? `${Number(theme.buttonRadius)}px` : null,
    "--logo-size": theme.logoSize ? `${Number(theme.logoSize)}px` : null,
    "--banner-height": theme.bannerHeight ? `${Number(theme.bannerHeight)}px` : null,
    "--hero-title-size": theme.heroTitleSize ? `${Number(theme.heroTitleSize)}px` : null,
    "--about-title-size": theme.aboutTitleSize ? `${Number(theme.aboutTitleSize)}px` : null,
    "--section-title-size": theme.sectionTitleSize ? `${Number(theme.sectionTitleSize)}px` : null,
    "--body-size": theme.bodySize ? `${Number(theme.bodySize)}px` : null,
    "--heading-font": theme.headingFont ? `"${theme.headingFont}", serif` : null,
    "--body-font": theme.bodyFont ? `"${theme.bodyFont}", sans-serif` : null
  };

  Object.entries(variables).forEach(([name, value]) => {
    if (value) root.setProperty(name, value);
  });

  const shadows = {
    none: "none",
    soft: "0 20px 55px rgba(53,66,56,.12)",
    strong: "0 28px 70px rgba(53,66,56,.22)"
  };
  root.setProperty("--shadow", shadows[theme.shadow] || shadows.soft);

  const header = $("siteHeader");
  if (header) {
    header.className = `site-header ${theme.headerStyle === "dark" ? "dark" : "light"}`;
  }

  const hero = $("heroGrid");
  if (hero) {
    hero.className = `container hero-grid ${theme.heroLayout === "center" ? "center" : ""}`;
  }
}

function offerIsActive(offer = {}) {
  if (offer.enabled === false) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (offer.startDate && today < new Date(`${offer.startDate}T00:00:00`)) {
    return false;
  }
  if (offer.endDate && today > new Date(`${offer.endDate}T23:59:59`)) {
    return false;
  }
  return true;
}

const icons = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.8 13.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.2-3.5-.7-2.9-1.1-4.8-4-5-4.3-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.7-.4.9-.4h.7c.2 0 .5-.1.7.5l.9 2.1c.1.3.1.5 0 .7l-.5.8c-.2.2-.4.4-.2.7.2.4.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.8.4.2.6.1.8-.1l1.1-1.3c.3-.3.5-.3.9-.2l2 .9c.4.2.7.3.8.5.1.2.1.7-.1 1.3Z"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2 9 5.7L21 6H3Zm18 12V8.4l-8.5 5.3a1 1 0 0 1-1 0L3 8.4V18h18Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.5 1.6-1.5H17V4a25 25 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2H8v3h2.6v9h2.9Z"/></svg>'
};

let galleryItems = [];
let galleryIndex = 0;

function renderGalleryImage(index) {
  if (!galleryItems.length) return;

  galleryIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[galleryIndex];

  const image = $("galleryLargeImage");
  const caption = $("galleryCaption");
  const dialog = $("galleryDialog");

  if (image) {
    image.src = item.url;
    image.alt = item.altText || item.title || "Balance & Restore gallery image";
  }
  if (caption) caption.textContent = item.title || "";
  if (dialog && !dialog.open && typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

async function loadGallery() {
  const grid = $("galleryGrid");
  const empty = $("galleryEmpty");
  if (!grid || !empty) return;

  try {
    const response = await fetch(`/api/gallery?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Gallery request failed (${response.status})`);
    }

    const payload = await response.json();
    galleryItems = asArray(payload.images).filter(item => item && item.active !== false);

    grid.innerHTML = galleryItems.map((item, index) => `
      <button
        class="gallery-card"
        type="button"
        data-gallery-index="${index}"
        aria-label="Open ${escapeMarkup(item.title || "gallery image")}">
        <img
          src="${escapeMarkup(item.url)}"
          alt="${escapeMarkup(item.altText || item.title || "Balance & Restore gallery image")}"
          loading="lazy">
        <span class="gallery-overlay">
          <span class="gallery-title">${escapeMarkup(item.title || "")}</span>
          <span class="gallery-zoom" aria-hidden="true">↗</span>
        </span>
      </button>
    `).join("");

    empty.classList.toggle("hidden", galleryItems.length > 0);

    grid.querySelectorAll("[data-gallery-index]").forEach(button => {
      button.addEventListener("click", () => {
        renderGalleryImage(Number(button.dataset.galleryIndex));
      });
    });
  } catch (error) {
    console.error("Gallery loading failed:", error);
    galleryItems = [];
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    empty.textContent = "The gallery could not load. Please refresh the page.";
  }
}

function wireNavigation() {
  document.querySelectorAll(".js-scroll").forEach(control => {
    control.addEventListener("click", event => {
      const target = document.getElementById(control.dataset.target);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${control.dataset.target}`);

      const nav = $("mainNav");
      if (nav) nav.classList.remove("open");
    });
  });
}

function wireGalleryDialog() {
  $("galleryClose")?.addEventListener("click", () => $("galleryDialog")?.close());
  $("galleryPrevious")?.addEventListener("click", () => renderGalleryImage(galleryIndex - 1));
  $("galleryNext")?.addEventListener("click", () => renderGalleryImage(galleryIndex + 1));

  $("galleryDialog")?.addEventListener("click", event => {
    if (event.target === $("galleryDialog")) $("galleryDialog").close();
  });

  document.addEventListener("keydown", event => {
    const dialog = $("galleryDialog");
    if (!dialog?.open) return;
    if (event.key === "ArrowLeft") renderGalleryImage(galleryIndex - 1);
    if (event.key === "ArrowRight") renderGalleryImage(galleryIndex + 1);
  });
}

async function start() {
  const response = await fetch(`/api/content?t=${Date.now()}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Content request failed (${response.status})`);

  const content = await response.json();
  applyTheme(content.theme || {});

  [
    "businessName",
    "qualification",
    "tagline",
    "intro",
    "location",
    "bookingNote"
  ].forEach(key => text(key, content[key]));

  text("footerName", content.businessName);
  text("contactLocation", content.location);
  text("openingHours", content.openingHours);

  const bookingUrl = content.bookingUrl || "https://balancerestorecppm.setmore.com";
  document.querySelectorAll(".booking-link").forEach(link => {
    link.href = bookingUrl;
  });

  const offer = content.offer || {};
  text("offerTitle", offer.title);
  text("offerText", offer.text);
  text("offerButton", offer.buttonText || "Book now");
  text(
    "offerDates",
    [
      offer.startDate && `From ${offer.startDate}`,
      offer.endDate && `until ${offer.endDate}`
    ].filter(Boolean).join(" ")
  );
  visible("offerCard", offerIsActive(offer));

  const about = content.about || {};
  text("aboutEyebrow", about.eyebrow || "About Balance & Restore");
  text("aboutHeading", about.heading);
  text("aboutText", about.text);
  $("qualificationList").innerHTML = asArray(about.qualifications)
    .map(item => `<li>${escapeMarkup(item)}</li>`)
    .join("");

  const policies = content.policies || {};
  text("disclaimer", policies.disclaimer);
  text("cancellation", policies.cancellation);
  text("privacy", policies.privacy);

  const services = asArray(content.services)
    .filter(item => item && item.enabled !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  $("serviceGrid").innerHTML = services.map(service => {
    const serviceBookingUrl = service.bookingUrl || bookingUrl;
    return `
      <article class="service-card ${service.featured ? "featured" : ""}">
        <h3>${escapeMarkup(service.name || "")}</h3>
        <p>${escapeMarkup(service.description || "")}</p>
        <div class="service-meta">
          <span>${escapeMarkup(service.duration || "")}</span>
          <span>
            ${service.salePrice
              ? `<s>${escapeMarkup(service.price || "")}</s> <span class="sale">${escapeMarkup(service.salePrice)}</span>`
              : escapeMarkup(service.price || "")}
          </span>
        </div>
        <p>
          <a class="text-link" href="${escapeMarkup(serviceBookingUrl)}" target="_blank" rel="noopener">
            Book this service →
          </a>
        </p>
      </article>
    `;
  }).join("");

  const testimonials = asArray(content.testimonials)
    .filter(item => item && item.enabled !== false);

  $("testimonialGrid").innerHTML = testimonials.map(item => `
    <article class="testimonial">
      <p>“${escapeMarkup(item.text || "")}”</p>
      <strong>${escapeMarkup(item.name || "Client")}</strong>
    </article>
  `).join("");

  const faqs = asArray(content.faqs)
    .filter(item => item && item.enabled !== false)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  $("faqList").innerHTML = faqs.map(item => `
    <div class="faq-item">
      <button class="faq-question" type="button">
        <span>${escapeMarkup(item.question || "")}</span>
        <span>+</span>
      </button>
      <div class="faq-answer">${escapeMarkup(item.answer || "")}</div>
    </div>
  `).join("");

  document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
      button.parentElement.classList.toggle("open");
    });
  });

  const sections = content.sections || {};
  visible("bannerSection", sections.banner !== false);
  visible("heroSection", sections.hero !== false);
  visible("services", sections.services !== false);
  visible("about", sections.about !== false);
  visible("posterWrap", sections.poster !== false);
  visible("testimonialsSection", sections.testimonials === true && testimonials.length > 0);
  visible("faq", sections.faq !== false && faqs.length > 0);
  visible("policiesSection", sections.policies !== false);
  visible("contactSection", sections.contact !== false);
  visible("gallery", sections.gallery !== false);

  text("galleryHeading", content.gallery?.heading || "A calm glimpse into Balance & Restore");
  text(
    "galleryIntro",
    content.gallery?.intro || "Photos from our treatment space, equipment and wellbeing practice."
  );

  const contactLinks = [];
  if (content.instagramUrl) {
    contactLinks.push(`<a class="social-link" href="${escapeMarkup(content.instagramUrl)}" target="_blank" rel="noopener">${icons.instagram}<span>Instagram</span></a>`);
  }
  if (content.whatsappUrl) {
    contactLinks.push(`<a class="social-link" href="${escapeMarkup(content.whatsappUrl)}" target="_blank" rel="noopener">${icons.whatsapp}<span>WhatsApp</span></a>`);
  }
  if (content.email) {
    contactLinks.push(`<a class="social-link" href="mailto:${escapeMarkup(content.email)}">${icons.email}<span>Email</span></a>`);
  }
  if (content.facebookUrl) {
    contactLinks.push(`<a class="social-link" href="${escapeMarkup(content.facebookUrl)}" target="_blank" rel="noopener">${icons.facebook}<span>Facebook</span></a>`);
  }
  $("socialLinks").innerHTML = contactLinks.join("");

  await loadGallery();

  const seo = content.seo || {};
  document.title = seo.title || content.businessName || "Balance & Restore";
  $("metaDescription").content = seo.description || "";
  $("canonicalLink").href = seo.canonicalUrl || location.origin;
}

$("year").textContent = new Date().getFullYear();

$("menuButton")?.addEventListener("click", () => {
  const nav = $("mainNav");
  const open = nav.classList.toggle("open");
  $("menuButton").setAttribute("aria-expanded", String(open));
});

wireNavigation();
wireGalleryDialog();

start()
  .then(() => {
    if (location.hash) {
      setTimeout(() => {
        document.getElementById(location.hash.slice(1))
          ?.scrollIntoView({ block: "start" });
      }, 100);
    }
  })
  .catch(error => {
    console.error("Website initialisation failed:", error);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div style="padding:12px;background:#ffe8e8;text-align:center">The website could not load completely. Please refresh the page.</div>'
    );
  });
