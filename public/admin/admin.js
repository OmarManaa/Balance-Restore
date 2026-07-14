let data,original;
const form=document.getElementById("editor"),statusEl=document.getElementById("status"),saveState=document.getElementById("saveState");
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const get=(o,path)=>path.split(".").reduce((a,k)=>a?.[k],o);
const set=(o,path,value)=>{const keys=path.split(".");let cursor=o;for(const key of keys.slice(0,-1))cursor=cursor[key]??={};cursor[keys.at(-1)]=value};
const dirty=()=>{saveState.textContent="Unsaved changes";saveState.style.color="#f4cf88"};

function serviceRow(x={},i=0){return `<div class="item service-item"><div class="item-heading"><strong>${esc(x.name||`Service ${i+1}`)}</strong><button type="button" class="remove">Remove</button></div><label>Name<input data-k="name" value="${esc(x.name)}"></label><label>Description<textarea data-k="description">${esc(x.description)}</textarea></label><div class="two"><label>Price<input data-k="price" value="${esc(x.price)}"></label><label>Sale price<input data-k="salePrice" value="${esc(x.salePrice)}"></label></div><div class="two"><label>Duration<input data-k="duration" value="${esc(x.duration)}"></label><label>Order<input type="number" data-k="order" value="${Number(x.order)||i+1}"></label></div><label>Individual booking URL<input data-k="bookingUrl" value="${esc(x.bookingUrl)}"></label><div class="two"><label class="switch"><input type="checkbox" data-k="featured" ${x.featured?"checked":""}> Featured</label><label class="switch"><input type="checkbox" data-k="enabled" ${x.enabled!==false?"checked":""}> Visible</label></div></div>`}
function faqRow(x={},i=0){return `<div class="item faq-item"><div class="item-heading"><strong>${esc(x.question||`FAQ ${i+1}`)}</strong><button type="button" class="remove">Remove</button></div><label>Question<input data-k="question" value="${esc(x.question)}"></label><label>Answer<textarea data-k="answer">${esc(x.answer)}</textarea></label><div class="two"><label>Category<input data-k="category" value="${esc(x.category)}"></label><label>Order<input type="number" data-k="order" value="${Number(x.order)||i+1}"></label></div><label class="switch"><input type="checkbox" data-k="enabled" ${x.enabled!==false?"checked":""}> Visible</label></div>`}
function testimonialRow(x={},i=0){return `<div class="item testimonial-item"><div class="item-heading"><strong>${esc(x.name||`Testimonial ${i+1}`)}</strong><button type="button" class="remove">Remove</button></div><label>Client display name<input data-k="name" value="${esc(x.name)}"></label><label>Testimonial<textarea data-k="text">${esc(x.text)}</textarea></label><label class="switch"><input type="checkbox" data-k="enabled" ${x.enabled!==false?"checked":""}> Approved and visible</label></div>`}
function qualificationRow(x=""){return `<div class="item qualification-item"><div class="item-heading"><strong>Qualification</strong><button type="button" class="remove">Remove</button></div><input data-k="value" value="${esc(x)}"></div>`}
function wire(){document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>{b.closest(".item").remove();dirty()});form.querySelectorAll("input,textarea,select").forEach(e=>e.oninput=dirty)}
function render(){
  form.querySelectorAll("[name]").forEach(e=>{const v=get(data,e.name);if(e.type==="checkbox")e.checked=!!v;else e.value=v??""});
  document.getElementById("services").innerHTML=(data.services||[]).map(serviceRow).join("");
  document.getElementById("faqs").innerHTML=(data.faqs||[]).map(faqRow).join("");
  document.getElementById("testimonials").innerHTML=(data.testimonials||[]).map(testimonialRow).join("");
  document.getElementById("qualifications").innerHTML=(data.about?.qualifications||[]).map(qualificationRow).join("");
  const sectionNames={banner:"Banner",hero:"Hero",services:"Services",about:"About",poster:"Poster",testimonials:"Testimonials",faq:"FAQ",policies:"Policies",contact:"Contact"};
  document.getElementById("sectionControls").innerHTML=Object.entries(sectionNames).map(([key,label])=>`<div class="section-row"><strong>${label}</strong><label class="switch"><input type="checkbox" data-section="${key}" ${data.sections?.[key]!==false?"checked":""}> Visible</label></div>`).join("");
  document.getElementById("summary").innerHTML=`<div class="summary">Visible services<strong>${(data.services||[]).filter(x=>x.enabled!==false).length}</strong></div><div class="summary">Published FAQs<strong>${(data.faqs||[]).filter(x=>x.enabled!==false).length}</strong></div><div class="summary">Testimonials<strong>${(data.testimonials||[]).filter(x=>x.enabled!==false).length}</strong></div><div class="summary">Promotion<strong>${data.offer?.enabled!==false?"On":"Off"}</strong></div>`;
  wire();saveState.textContent="Saved";saveState.style.color="";
}
function rows(selector){return [...document.querySelectorAll(selector)].map(row=>{const item={};row.querySelectorAll("[data-k]").forEach(e=>item[e.dataset.k]=e.type==="checkbox"?e.checked:e.type==="number"?Number(e.value):e.value.trim());return item})}
function collect(){
  form.querySelectorAll("[name]").forEach(e=>set(data,e.name,e.type==="checkbox"?e.checked:e.type==="number"?Number(e.value):e.value.trim()));
  data.services=rows(".service-item");data.faqs=rows(".faq-item");data.testimonials=rows(".testimonial-item");
  data.about.qualifications=rows(".qualification-item").map(x=>x.value).filter(Boolean);
  document.querySelectorAll("[data-section]").forEach(e=>data.sections[e.dataset.section]=e.checked);
}
async function load(){
  const response=await fetch("/api/admin/content",{cache:"no-store"});
  if(!response.ok)throw new Error(`Could not load admin content (${response.status})`);
  data=await response.json();original=clone(data);render();statusEl.textContent="Ready to edit.";statusEl.className="status ok";
}
form.onsubmit=async event=>{
  event.preventDefault();collect();statusEl.textContent="Saving and publishing…";
  const response=await fetch("/api/admin/content",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
  if(!response.ok){statusEl.textContent=`Save failed (${response.status})`;statusEl.className="status error";return}
  data=await response.json();original=clone(data);render();statusEl.textContent="Saved. The live website has been updated.";statusEl.className="status ok";
};
document.getElementById("discardButton").onclick=()=>{data=clone(original);render();statusEl.textContent="Unsaved changes discarded."};
document.getElementById("resetButton").onclick=async()=>{if(!confirm("Reset all editable website content to the recommended defaults?"))return;const response=await fetch("/api/admin/reset",{method:"POST"});if(!response.ok){statusEl.textContent="Reset failed.";return}data=await response.json();original=clone(data);render();statusEl.textContent="Recommended defaults restored and published.";statusEl.className="status ok"};
document.getElementById("addService").onclick=()=>{document.getElementById("services").insertAdjacentHTML("beforeend",serviceRow({},document.querySelectorAll(".service-item").length));wire();dirty()};
document.getElementById("addFaq").onclick=()=>{document.getElementById("faqs").insertAdjacentHTML("beforeend",faqRow({},document.querySelectorAll(".faq-item").length));wire();dirty()};
document.getElementById("addTestimonial").onclick=()=>{document.getElementById("testimonials").insertAdjacentHTML("beforeend",testimonialRow({},document.querySelectorAll(".testimonial-item").length));wire();dirty()};
document.getElementById("addQualification").onclick=()=>{document.getElementById("qualifications").insertAdjacentHTML("beforeend",qualificationRow(""));wire();dirty()};
document.querySelectorAll(".tab").forEach(button=>button.onclick=()=>{document.querySelectorAll(".tab,.panel").forEach(x=>x.classList.remove("active"));button.classList.add("active");document.querySelector(`[data-panel="${button.dataset.tab}"]`).classList.add("active")});
const presets={
  oliveGold:{primary:"#596746",primaryDark:"#344126",accent:"#b78a45",background:"#fffdf8",surface:"#f4efe3",text:"#2d3229"},
  softSage:{primary:"#73856d",primaryDark:"#465343",accent:"#c39a62",background:"#fbfaf6",surface:"#eaf0e6",text:"#303630"},
  warmCream:{primary:"#876d4b",primaryDark:"#57452f",accent:"#b88945",background:"#fffaf0",surface:"#f3e6ce",text:"#3b3228"},
  modern:{primary:"#4d5b51",primaryDark:"#26312a",accent:"#a1845c",background:"#ffffff",surface:"#f1f3f1",text:"#202521"}
};
document.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{Object.assign(data.theme,presets[b.dataset.preset]);data.theme.preset=b.dataset.preset;render();dirty()});
load().catch(error=>{statusEl.textContent=error.message;statusEl.className="status error"});
