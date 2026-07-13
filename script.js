async function loadContent(){
  const r=await fetch("content.json",{cache:"no-store"});
  const c=await r.json();
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&v)e.textContent=v};
  set("businessName",c.business_name);set("footerName",c.business_name);set("qualification",c.qualification);
  set("tagline",c.tagline);set("intro",c.intro);set("location",c.location);set("bookingNote",c.booking_note);
  set("offerTitle",c.offer_title);set("offerText",c.offer_text);set("quote",c.quote);set("disclaimer",c.disclaimer);
  ["navBook","heroBook","offerBook","aboutBook","footerBook"].forEach(id=>document.getElementById(id).href=c.booking_url);
  document.getElementById("navLogo").src=c.logo;document.getElementById("heroLogo").src=c.logo;document.getElementById("aboutLogo").src=c.logo;
  document.getElementById("bannerImage").src=c.banner;document.getElementById("posterImage").src=c.poster;
  document.getElementById("serviceGrid").innerHTML=c.services.map(x=>`<div class="service">${x}</div>`).join("");
  document.getElementById("expectList").innerHTML=c.expectations.map(x=>`<li>${x}</li>`).join("");
  document.title=`${c.business_name} | Hijama & Cupping Therapy`;
}
document.getElementById("year").textContent=new Date().getFullYear();
loadContent().catch(console.error);
