const $=id=>document.getElementById(id);
const text=(id,value)=>{const e=$(id);if(e)e.textContent=value??""};
const visible=(id,on)=>{const e=$(id);if(e)e.classList.toggle("hidden",!on)};
const safeArray=value=>Array.isArray(value)?value:[];

function applyTheme(t={}){
  const root=document.documentElement.style;
  const vars={
    "--primary":t.primary,"--primary-dark":t.primaryDark,"--accent":t.accent,
    "--background":t.background,"--surface":t.surface,"--text":t.text,
    "--muted":t.muted,"--border":t.border,
    "--content-width":t.contentWidth?`${Number(t.contentWidth)||1120}px`:null,
    "--section-spacing":t.sectionSpacing?`${Number(t.sectionSpacing)||76}px`:null,
    "--card-radius":t.cardRadius!==undefined?`${Number(t.cardRadius)}px`:null,
    "--button-radius":t.buttonRadius!==undefined?`${Number(t.buttonRadius)}px`:null,
    "--logo-size":t.logoSize?`${Number(t.logoSize)}px`:null,
    "--banner-height":t.bannerHeight?`${Number(t.bannerHeight)}px`:null,
    "--heading-font":t.headingFont?`${t.headingFont},serif`:null,
    "--body-font":t.bodyFont?`${t.bodyFont},sans-serif`:null
  };
  Object.entries(vars).forEach(([k,v])=>{if(v)root.setProperty(k,v)});
  const shadows={none:"none",soft:"0 18px 46px rgba(52,65,38,.11)",strong:"0 25px 65px rgba(52,65,38,.22)"};
  root.setProperty("--shadow",shadows[t.shadow]||shadows.soft);
  $("siteHeader").className=`site-header ${t.headerStyle==="dark"?"dark":"light"}`;
  $("heroGrid").className=`container hero-grid ${t.heroLayout==="center"?"center":""}`;
}

function isOfferActive(offer={}){
  if(offer.enabled===false)return false;
  const today=new Date();today.setHours(0,0,0,0);
  if(offer.startDate){const start=new Date(`${offer.startDate}T00:00:00`);if(today<start)return false}
  if(offer.endDate){const end=new Date(`${offer.endDate}T23:59:59`);if(today>end)return false}
  return true;
}

async function start(){
  const response=await fetch("/api/content",{cache:"no-store"});
  if(!response.ok)throw new Error(`Content request failed: ${response.status}`);
  const c=await response.json();

  applyTheme(c.theme||{});
  text("businessName",c.businessName);text("footerName",c.businessName);
  text("qualification",c.qualification);text("tagline",c.tagline);text("intro",c.intro);
  text("location",c.location);text("bookingNote",c.bookingNote);
  text("contactLocation",c.location);text("openingHours",c.openingHours);
  document.querySelectorAll(".booking-link").forEach(a=>a.href=c.bookingUrl||"https://balancerestorecppm.setmore.com");

  const offer=c.offer||{};
  text("offerTitle",offer.title);text("offerText",offer.text);text("offerButton",offer.buttonText||"Book now");
  text("offerDates",[offer.startDate&&`From ${offer.startDate}`,offer.endDate&&`until ${offer.endDate}`].filter(Boolean).join(" "));
  visible("offerCard",isOfferActive(offer));

  const about=c.about||{};
  text("aboutHeading",about.heading);text("aboutText",about.text);
  $("qualificationList").innerHTML=safeArray(about.qualifications).map(x=>`<li>${x}</li>`).join("");
  const policies=c.policies||{};
  text("disclaimer",policies.disclaimer);text("cancellation",policies.cancellation);text("privacy",policies.privacy);

  const services=safeArray(c.services).filter(x=>x&&x.enabled!==false).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  $("serviceGrid").innerHTML=services.map(x=>`<article class="service-card ${x.featured?"featured":""}">
    <h3>${x.name||""}</h3><p>${x.description||""}</p>
    <div class="service-meta"><span>${x.duration||""}</span><span>${x.salePrice?`<s>${x.price||""}</s> <span class="sale">${x.salePrice}</span>`:(x.price||"")}</span></div>
    ${x.bookingUrl?`<p><a class="text-link" href="${x.bookingUrl}" target="_blank" rel="noopener">Book this service →</a></p>`:""}
  </article>`).join("");

  const testimonials=safeArray(c.testimonials).filter(x=>x&&x.enabled!==false);
  $("testimonialGrid").innerHTML=testimonials.map(x=>`<article class="testimonial"><p>“${x.text||""}”</p><strong>${x.name||"Client"}</strong></article>`).join("");

  const faqs=safeArray(c.faqs).filter(x=>x&&x.enabled!==false).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  $("faqList").innerHTML=faqs.map(x=>`<div class="faq-item"><button class="faq-question"><span>${x.question||""}</span><span>+</span></button><div class="faq-answer">${x.answer||""}</div></div>`).join("");
  document.querySelectorAll(".faq-question").forEach(b=>b.onclick=()=>b.parentElement.classList.toggle("open"));

  const sections=c.sections||{};
  visible("bannerSection",sections.banner!==false);visible("heroSection",sections.hero!==false);
  visible("servicesSection",sections.services!==false);visible("aboutSection",sections.about!==false);
  visible("posterWrap",sections.poster!==false);visible("testimonialsSection",sections.testimonials===true&&testimonials.length>0);
  visible("faqSection",sections.faq!==false&&faqs.length>0);visible("policiesSection",sections.policies!==false);
  visible("contactSection",sections.contact!==false);

  const links=[];
  if(c.instagramUrl)links.push(`<a href="${c.instagramUrl}" target="_blank" rel="noopener">Instagram</a>`);
  if(c.facebookUrl)links.push(`<a href="${c.facebookUrl}" target="_blank" rel="noopener">Facebook</a>`);
  if(c.whatsappUrl)links.push(`<a href="${c.whatsappUrl}" target="_blank" rel="noopener">WhatsApp</a>`);
  if(c.email)links.push(`<a href="mailto:${c.email}">Email</a>`);
  $("socialLinks").innerHTML=links.join("");

  const seo=c.seo||{};
  document.title=seo.title||`${c.businessName||"Balance & Restore"} | Hijama & Cupping Therapy`;
  $("metaDescription").content=seo.description||"";
  $("canonicalLink").href=seo.canonicalUrl||location.origin;
}
$("year").textContent=new Date().getFullYear();
$("menuButton").onclick=()=>$("mainNav").classList.toggle("open");
start().catch(error=>{console.error(error);document.body.insertAdjacentHTML("afterbegin",'<div style="padding:12px;background:#ffe8e8;text-align:center">The website content could not load. Please refresh or contact the site administrator.</div>')});
