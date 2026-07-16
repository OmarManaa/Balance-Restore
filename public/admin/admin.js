let data,original,csrfToken;

let galleryImages=[];

function galleryEscape(value){
  return String(value??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function setGalleryMessage(message,type=""){
  const progress=document.getElementById("galleryUploadProgress");
  if(progress){
    progress.textContent=message;
    progress.className=`gallery-message ${type}`.trim();
  }
}

async function readGalleryJson(response){
  try{return await response.json()}catch{return {}}
}

async function loadAdminGallery(){
  const grid=document.getElementById("galleryAdminGrid");
  if(!grid)return;

  grid.innerHTML='<div class="gallery-loading">Loading existing photos…</div>';

  const response=await api("/api/admin/gallery",{
    method:"GET",
    cache:"no-store"
  });
  const payload=await readGalleryJson(response);

  if(!response.ok){
    grid.innerHTML="";
    throw new Error(payload.error||`Could not load gallery (${response.status})`);
  }

  galleryImages=Array.isArray(payload.images)?payload.images:[];
  galleryImages.sort((a,b)=>
    (Number(a.displayOrder)||0)-(Number(b.displayOrder)||0)
    || String(a.createdAt||"").localeCompare(String(b.createdAt||""))
  );

  grid.innerHTML=galleryImages.length
    ? galleryImages.map((image,index)=>`
      <article class="gallery-admin-card" data-gallery-id="${galleryEscape(image.id)}">
        <div class="gallery-admin-image-wrap">
          <img class="gallery-admin-preview"
               src="${galleryEscape(image.url)}?v=${Date.now()}"
               alt="${galleryEscape(image.altText||image.title||"Gallery photo")}">
          <span class="gallery-position">${index+1}</span>
          ${image.active?"":'<span class="gallery-hidden-badge">Hidden</span>'}
        </div>

        <div class="gallery-admin-fields">
          <label>
            Title
            <input data-gallery-field="title" value="${galleryEscape(image.title)}">
          </label>

          <label>
            Alternative text
            <input data-gallery-field="altText" value="${galleryEscape(image.altText)}">
          </label>

          <label class="switch">
            <input data-gallery-field="active" type="checkbox" ${image.active?"checked":""}>
            Show on public website
          </label>

          <div class="gallery-order-actions">
            <button type="button"
                    class="move-gallery-earlier"
                    ${index===0?"disabled":""}>
              ← Move earlier
            </button>

            <button type="button"
                    class="move-gallery-later"
                    ${index===galleryImages.length-1?"disabled":""}>
              Move later →
            </button>
          </div>

          <div class="gallery-admin-actions">
            <button type="button" class="save-gallery">Save changes</button>
            <button type="button" class="delete-gallery">Delete photo</button>
          </div>
        </div>
      </article>
    `).join("")
    : `<div class="gallery-empty-admin">
         <strong>No photos uploaded yet.</strong>
         <span>Choose photos above, then click the green “Upload photos” button.</span>
       </div>`;

  grid.querySelectorAll(".save-gallery").forEach(button=>{
    button.addEventListener("click",()=>saveGalleryCard(button.closest("[data-gallery-id]")));
  });
  grid.querySelectorAll(".delete-gallery").forEach(button=>{
    button.addEventListener("click",()=>deleteGalleryCard(button.closest("[data-gallery-id]")));
  });
  grid.querySelectorAll(".move-gallery-earlier").forEach(button=>{
    button.addEventListener("click",()=>moveGalleryCard(button.closest("[data-gallery-id]"),-1));
  });
  grid.querySelectorAll(".move-gallery-later").forEach(button=>{
    button.addEventListener("click",()=>moveGalleryCard(button.closest("[data-gallery-id]"),1));
  });
}

async function uploadGallery(){
  const input=document.getElementById("galleryFiles");
  const title=document.getElementById("galleryUploadTitle");
  const button=document.getElementById("uploadGallery");
  const files=[...(input?.files||[])];

  if(!files.length){
    setGalleryMessage("Choose one or more photos first.","error");
    return;
  }

  button.disabled=true;
  const originalLabel=button.textContent;

  try{
    let completed=0;

    for(const file of files){
      button.textContent=`Uploading ${completed+1}/${files.length}…`;
      setGalleryMessage(`Uploading ${file.name}…`,"working");

      const formData=new FormData();
      formData.append("image",file);
      formData.append(
        "title",
        title.value.trim()||file.name.replace(/\.[^.]+$/,"")
      );
      formData.append(
        "altText",
        title.value.trim()||"Balance & Restore gallery photo"
      );

      const response=await api("/api/admin/gallery/upload",{
        method:"POST",
        body:formData
      });
      const payload=await readGalleryJson(response);

      if(!response.ok){
        throw new Error(
          payload.error||
          payload.details||
          `Upload failed for ${file.name} (${response.status})`
        );
      }

      completed++;
    }

    input.value="";
    title.value="";
    setGalleryMessage(
      `Uploaded ${completed} photo${completed===1?"":"s"} successfully.`,
      "success"
    );

    await loadAdminGallery();
    statusEl.textContent="Gallery updated. The public website will show the visible photos.";
    statusEl.className="status ok";
  }catch(error){
    console.error("Gallery upload failed:",error);
    setGalleryMessage(error.message||"Gallery upload failed.","error");
    statusEl.textContent=error.message||"Gallery upload failed.";
    statusEl.className="status error";
  }finally{
    button.disabled=false;
    button.textContent=originalLabel;
  }
}

async function updateGalleryImage(image,payload){
  const response=await api(
    `/api/admin/gallery/${encodeURIComponent(image.id)}`,
    {
      method:"PUT",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(payload)
    }
  );
  const data=await readGalleryJson(response);

  if(!response.ok){
    throw new Error(data.error||`Could not update photo (${response.status})`);
  }
}

async function saveGalleryCard(card){
  const image=galleryImages.find(item=>item.id===card.dataset.galleryId);
  if(!image)return;

  const field=name=>card.querySelector(`[data-gallery-field="${name}"]`);
  const payload={
    title:field("title").value.trim(),
    altText:field("altText").value.trim(),
    displayOrder:Number(image.displayOrder)||0,
    active:field("active").checked
  };

  try{
    await updateGalleryImage(image,payload);
    statusEl.textContent="Gallery photo updated.";
    statusEl.className="status ok";
    setGalleryMessage("Photo changes saved.","success");
    await loadAdminGallery();
  }catch(error){
    statusEl.textContent=error.message;
    statusEl.className="status error";
  }
}

async function moveGalleryCard(card,direction){
  const currentIndex=galleryImages.findIndex(item=>item.id===card.dataset.galleryId);
  const otherIndex=currentIndex+direction;

  if(currentIndex<0||otherIndex<0||otherIndex>=galleryImages.length)return;

  const current=galleryImages[currentIndex];
  const other=galleryImages[otherIndex];

  let currentOrder=Number(current.displayOrder)||((currentIndex+1)*10);
  let otherOrder=Number(other.displayOrder)||((otherIndex+1)*10);

  if(currentOrder===otherOrder){
    galleryImages.forEach((item,index)=>item.displayOrder=(index+1)*10);
    currentOrder=galleryImages[currentIndex].displayOrder;
    otherOrder=galleryImages[otherIndex].displayOrder;
  }

  try{
    await Promise.all([
      updateGalleryImage(current,{
        title:current.title||"",
        altText:current.altText||"",
        displayOrder:otherOrder,
        active:current.active!==false
      }),
      updateGalleryImage(other,{
        title:other.title||"",
        altText:other.altText||"",
        displayOrder:currentOrder,
        active:other.active!==false
      })
    ]);

    statusEl.textContent=direction<0
      ?"Photo moved earlier."
      :"Photo moved later.";
    statusEl.className="status ok";
    await loadAdminGallery();
  }catch(error){
    statusEl.textContent=error.message;
    statusEl.className="status error";
  }
}

async function deleteGalleryCard(card){
  const image=galleryImages.find(item=>item.id===card.dataset.galleryId);
  if(!image)return;

  if(!confirm(`Permanently delete “${image.title||"this photo"}”?`))return;

  const response=await api(
    `/api/admin/gallery/${encodeURIComponent(image.id)}`,
    {method:"DELETE"}
  );
  const data=await readGalleryJson(response);

  if(!response.ok){
    statusEl.textContent=data.error||`Could not delete photo (${response.status})`;
    statusEl.className="status error";
    return;
  }

  statusEl.textContent="Gallery photo deleted.";
  statusEl.className="status ok";
  setGalleryMessage("Photo deleted.","success");
  await loadAdminGallery();
}

async function api(url,options={}){options.headers={...(options.headers||{}),'x-csrf-token':csrfToken||''};const r=await fetch(url,options);if(r.status===401){location.href='/admin/login/';throw Error('Login required')}return r}const form=document.getElementById('editor'),statusEl=document.getElementById('status'),saveState=document.getElementById('saveState');const clone=o=>JSON.parse(JSON.stringify(o)),esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;'),get=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o),set=(o,p,v)=>{const ks=p.split('.');let c=o;for(const k of ks.slice(0,-1))c=c[k]??={};c[ks.at(-1)]=v},dirty=()=>{if(saveState){saveState.textContent='Unsaved changes';saveState.style.color='#f4cf88'}};
function serviceRow(x={},i=0){return `<div class="item service-item"><div class="item-heading"><strong>${esc(x.name||`Service ${i+1}`)}</strong><button type="button" class="remove">Remove</button></div><label>Name<input data-k="name" value="${esc(x.name)}"></label><label>Description<textarea data-k="description">${esc(x.description)}</textarea></label><div class="two"><label>Price<input data-k="price" value="${esc(x.price)}"></label><label>Sale price<input data-k="salePrice" value="${esc(x.salePrice)}"></label></div><div class="two"><label>Duration<input data-k="duration" value="${esc(x.duration)}"></label><label>Order<input type="number" data-k="order" value="${+x.order||i+1}"></label></div><label>Individual booking URL<input data-k="bookingUrl" value="${esc(x.bookingUrl)}"></label><div class="two"><label class="switch"><input type="checkbox" data-k="featured" ${x.featured?'checked':''}> Featured</label><label class="switch"><input type="checkbox" data-k="enabled" ${x.enabled!==false?'checked':''}> Visible</label></div></div>`}
function faqRow(x={},i=0){return `<div class="item faq-item"><div class="item-heading"><strong>${esc(x.question||`FAQ ${i+1}`)}</strong><button type="button" class="remove">Remove</button></div><label>Question<input data-k="question" value="${esc(x.question)}"></label><label>Answer<textarea data-k="answer">${esc(x.answer)}</textarea></label><div class="two"><label>Category<input data-k="category" value="${esc(x.category)}"></label><label>Order<input type="number" data-k="order" value="${+x.order||i+1}"></label></div><label class="switch"><input type="checkbox" data-k="enabled" ${x.enabled!==false?'checked':''}> Visible</label></div>`}
function testimonialRow(x={},i=0){return `<div class="item testimonial-item"><div class="item-heading"><strong>${esc(x.name||`Testimonial ${i+1}`)}</strong><button type="button" class="remove">Remove</button></div><label>Client display name<input data-k="name" value="${esc(x.name)}"></label><label>Testimonial<textarea data-k="text">${esc(x.text)}</textarea></label><label class="switch"><input type="checkbox" data-k="enabled" ${x.enabled!==false?'checked':''}> Approved and visible</label></div>`}
const qualificationRow=(x='')=>`<div class="item qualification-item"><div class="item-heading"><strong>Qualification</strong><button type="button" class="remove">Remove</button></div><input data-k="value" value="${esc(x)}"></div>`;
function wire(){document.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{b.closest('.item').remove();dirty()});form.querySelectorAll('input,textarea,select').forEach(e=>e.oninput=dirty);document.querySelectorAll('input[type=range]').forEach(e=>{const o=e.parentElement.querySelector('.range-output');if(o)o.textContent=e.value+'px';e.oninput=()=>{if(o)o.textContent=e.value+'px';dirty()}})}
function render(){form.querySelectorAll('[name]').forEach(e=>{const v=get(data,e.name);if(e.type==='checkbox')e.checked=!!v;else e.value=v??''});document.getElementById('services').innerHTML=(data.services||[]).map(serviceRow).join('');document.getElementById('faqs').innerHTML=(data.faqs||[]).map(faqRow).join('');document.getElementById('testimonials').innerHTML=(data.testimonials||[]).map(testimonialRow).join('');document.getElementById('qualifications').innerHTML=(data.about?.qualifications||[]).map(qualificationRow).join('');const names={banner:'Banner',hero:'Hero',services:'Services',about:'About',poster:'Poster',testimonials:'Testimonials',faq:'FAQ',policies:'Policies',contact:'Contact'};document.getElementById('sectionControls').innerHTML=Object.entries(names).map(([k,l])=>`<div class="section-row"><strong>${l}</strong><label class="switch"><input type="checkbox" data-section="${k}" ${data.sections?.[k]!==false?'checked':''}> Visible</label></div>`).join('');document.getElementById('summary').innerHTML=`<div class="summary">Visible services<strong>${(data.services||[]).filter(x=>x.enabled!==false).length}</strong></div><div class="summary">Published FAQs<strong>${(data.faqs||[]).filter(x=>x.enabled!==false).length}</strong></div><div class="summary">Testimonials<strong>${(data.testimonials||[]).filter(x=>x.enabled!==false).length}</strong></div><div class="summary">Promotion<strong>${data.offer?.enabled!==false?'On':'Off'}</strong></div>`;wire();if(saveState){saveState.textContent='Saved';saveState.style.color=''}}
function rows(sel){return [...document.querySelectorAll(sel)].map(row=>{const o={};row.querySelectorAll('[data-k]').forEach(e=>o[e.dataset.k]=e.type==='checkbox'?e.checked:e.type==='number'?+e.value:e.value.trim());return o})}
function collect(){form.querySelectorAll('[name]').forEach(e=>set(data,e.name,e.type==='checkbox'?e.checked:(e.type==='number'||e.type==='range')?+e.value:e.value.trim()));data.services=rows('.service-item');data.faqs=rows('.faq-item');data.testimonials=rows('.testimonial-item');data.about.qualifications=rows('.qualification-item').map(x=>x.value).filter(Boolean);document.querySelectorAll('[data-section]').forEach(e=>data.sections[e.dataset.section]=e.checked)}
async function load(){const me=await fetch('/api/auth/me',{cache:'no-store'});if(!me.ok){location.href='/admin/login/';return}const user=await me.json();csrfToken=user.csrfToken;document.getElementById('currentUser').textContent=user.email;const link=document.querySelector('.users-link');if(link&&!user.canManageUsers)link.style.display='none';const r=await api('/api/admin/content',{cache:'no-store'});data=await r.json();original=clone(data);render();await loadAdminGallery();statusEl.textContent='Ready to edit.';statusEl.className='status ok'}
form.onsubmit=async e=>{e.preventDefault();collect();statusEl.textContent='Saving and publishing…';const r=await api('/api/admin/content',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(data)});if(!r.ok){statusEl.textContent=`Save failed (${r.status})`;statusEl.className='status error';return}data=await r.json();original=clone(data);render();statusEl.textContent='Saved. The live website has been updated.';statusEl.className='status ok'};
document.getElementById('discardButton').onclick=()=>{data=clone(original);render();statusEl.textContent='Unsaved changes discarded.'};document.getElementById('resetButton').onclick=async()=>{if(!confirm('Reset all editable website content to the recommended defaults?'))return;const r=await api('/api/admin/reset',{method:'POST'});if(!r.ok)return;data=await r.json();original=clone(data);render();statusEl.textContent='Recommended defaults restored.';statusEl.className='status ok'};
document.getElementById('addService').onclick=()=>{document.getElementById('services').insertAdjacentHTML('beforeend',serviceRow({},document.querySelectorAll('.service-item').length));wire();dirty()};document.getElementById('addFaq').onclick=()=>{document.getElementById('faqs').insertAdjacentHTML('beforeend',faqRow({},document.querySelectorAll('.faq-item').length));wire();dirty()};document.getElementById('addTestimonial').onclick=()=>{document.getElementById('testimonials').insertAdjacentHTML('beforeend',testimonialRow({},document.querySelectorAll('.testimonial-item').length));wire();dirty()};document.getElementById('addQualification').onclick=()=>{document.getElementById('qualifications').insertAdjacentHTML('beforeend',qualificationRow(''));wire();dirty()};document.querySelectorAll('.tab').forEach(button=>button.onclick=async()=>{
  document.querySelectorAll('.tab,.panel').forEach(element=>element.classList.remove('active'));
  button.classList.add('active');
  document.querySelector(`[data-panel="${button.dataset.tab}"]`).classList.add('active');
  if(button.dataset.tab==="gallery"){
    try{await loadAdminGallery()}
    catch(error){
      statusEl.textContent=error.message;
      statusEl.className="status error";
    }
  }
});
document.getElementById('logout').onclick=async()=>{await api('/api/auth/logout',{method:'POST'});location.href='/admin/login/'};const presets={'soft-feminine':{primary:'#66745f',primaryDark:'#354238',accent:'#c6a36b',blush:'#ead8d7',background:'#fffaf6',surface:'#f6f0ea',surfaceAlt:'#f2e7e4',text:'#2d342f'},'olive-gold':{primary:'#596746',primaryDark:'#344126',accent:'#b78a45',blush:'#e9dfd0',background:'#fffdf8',surface:'#f4efe3',surfaceAlt:'#eee7dc',text:'#2d3229'},'rose-sage':{primary:'#70806b',primaryDark:'#465345',accent:'#bf8f83',blush:'#efdeda',background:'#fffaf9',surface:'#f7efec',surfaceAlt:'#f1e2df',text:'#313733'},'modern-minimal':{primary:'#4d5b51',primaryDark:'#26312a',accent:'#a1845c',blush:'#e9e5e1',background:'#ffffff',surface:'#f3f4f2',surfaceAlt:'#ecefed',text:'#202521'}};document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{Object.assign(data.theme,presets[b.dataset.preset]);data.theme.preset=b.dataset.preset;render();dirty()});load().catch(e=>{statusEl.textContent=e.message;statusEl.className='status error'});

document.getElementById("uploadGallery")?.addEventListener("click",uploadGallery);
