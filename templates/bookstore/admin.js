(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;", "'":"&#39;", '"':"&quot;"}[c]));
  const uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
  let data = null;

  function money(n){ return `${data.settings.currency}${Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0})}`; }
  function toast(msg){ let t=$("#admin-toast"); if(!t){t=document.createElement("div");t.id="admin-toast";t.className="toast";document.body.appendChild(t);} t.textContent=msg; t.classList.add("show"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),2400); }
  function load(){ data=BookstoreData.get(); }
  function save(){ BookstoreData.save(data); renderAll(); }

  function show(section){
    $$(".admin-section").forEach(s=>s.classList.toggle("active",s.id===`admin-${section}`));
    $$("[data-admin-section]").forEach(b=>b.classList.toggle("active",b.dataset.adminSection===section));
    location.hash=section;
  }

  function renderDashboard(){
    const totalBooks=data.books.length, stock=data.books.filter(b=>b.stock>0 && b.active).length;
    $("#stat-books").textContent=totalBooks; $("#stat-stock").textContent=stock; $("#stat-orders").textContent=data.orders.length; $("#stat-enquiries").textContent=data.enquiries.length;
    $("#recent-orders").innerHTML=data.orders.slice(0,6).map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.shipping?.name||"")}</td><td>${esc(o.status)}</td><td>${money(o.total)}</td></tr>`).join("") || `<tr><td colspan="4" class="muted">No orders yet.</td></tr>`;
  }

  function renderAnalytics(){
    const counts={page_view:0,book_view:0,add_to_cart:0,checkout_payment_select:0,order:0};
    (data.analytics||[]).forEach(e=>{if(counts[e.event]!=null) counts[e.event]++;});
    Object.entries(counts).forEach(([k,v])=>{const el=$(`[data-analytic="${k}"]`); if(el) el.textContent=v;});
    const popularity={}; (data.analytics||[]).filter(e=>e.event==="book_view").forEach(e=>{const id=e.payload?.bookId; if(id) popularity[id]=(popularity[id]||0)+1;});
    const rows=Object.entries(popularity).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([id,n])=>{const b=data.books.find(x=>x.id===id);return `<tr><td>${esc(b?.title||id)}</td><td>${n}</td></tr>`}).join("");
    $("#popular-books").innerHTML=rows || `<tr><td colspan="2" class="muted">No book-view analytics yet.</td></tr>`;
  }

  function renderHome(){
    ["brand","tagline","heroHeading","heroText","supportText","phone","whatsapp","locationLabel","mapsUrl","address","seoTitle","seoDescription","seoKeywords","socialImage"].forEach(k=>{const el=$(`[name="${k}"]`); if(el) el.value=data.settings[k]||"";});
    $("[name=offerEnabled]").checked=!!data.offer.enabled; $("[name=offerType]").value=data.offer.type; $("[name=offerValue]").value=data.offer.value; $("[name=offerMinimum]").value=data.offer.minimumPurchase; $("[name=freeItemPriceCap]").value=data.offer.freeItemPriceCap; $("[name=offerText]").value=data.offer.text;
    $("[name=deliveryEnabled]").checked=!!data.settings.deliveryEnabled; $("[name=deliveryPerKm]").value=data.settings.deliveryPerKm; $("[name=minimumDeliveryFee]").value=data.settings.minimumDeliveryFee; $("[name=freeDeliveryThreshold]").value=data.settings.freeDeliveryThreshold; $("[name=codEnabled]").checked=!!data.settings.codEnabled;
    $("#admin-pin").value=data.admin.pin||"1234";
  }

  function renderBooks(){
    $("#books-admin").innerHTML=data.books.map(b=>`<tr><td><strong>${esc(b.title)}</strong><br><span class="muted">${esc(b.author)}</span></td><td>${money(b.price)}</td><td>${b.stock}</td><td>${b.rating}</td><td>${b.active?"Active":"Hidden"}</td><td><button class="btn btn-light" data-edit-book="${esc(b.id)}">Edit</button> <button class="btn btn-danger" data-delete-book="${esc(b.id)}">Delete</button></td></tr>`).join("");
    $$("[data-edit-book]").forEach(b=>b.onclick=()=>editBook(b.dataset.editBook)); $$("[data-delete-book]").forEach(b=>b.onclick=()=>{if(confirm("Delete this book from the demo store?")){data.books=data.books.filter(x=>x.id!==b.dataset.deleteBook);save();toast("Book deleted.");}});
  }

  function editBook(id){
    const b=data.books.find(x=>x.id===id); if(!b) return;
    $("[name=bookId]").value=b.id; ["title","author","price","format","category","stock","rating","reviews","amazonUrl","cover","description"].forEach(k=>{const el=$(`[name="book-${k}"]`); if(el) el.value=b[k]??"";}); $("[name=book-active]").checked=!!b.active; $("[name=book-featured]").checked=!!b.featured; show("books-form");
  }
  function clearBookForm(){ $$("#book-editor input,#book-editor textarea").forEach(el=>{if(el.type!=="checkbox")el.value=""}); $("[name=bookId]").value=""; $("[name=book-active]").checked=true; $("[name=book-featured]").checked=false; }

  function renderOrders(){
    $("#orders-admin").innerHTML=data.orders.map(o=>`<tr><td>${esc(o.id)}</td><td>${esc(o.shipping?.name||"")}<br>${esc(o.shipping?.phone||"")}</td><td>${esc(o.shipping?.city||"")}</td><td>${money(o.total)}</td><td><select class="control" data-order-status="${esc(o.id)}">${["Placed","Confirmed","Packed","Shipped","Delivered","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("") || `<tr><td colspan="5" class="muted">No orders yet.</td></tr>`;
    $$('[data-order-status]').forEach(sel=>sel.onchange=()=>{const o=data.orders.find(x=>x.id===sel.dataset.orderStatus); if(!o)return; o.status=sel.value; o.tracking=o.tracking||{events:[]}; o.tracking.lastUpdate=new Date().toISOString(); o.tracking.events.unshift({status:o.status,at:new Date().toISOString(),note:"Status updated from admin demo."}); save(); toast("Order status updated.");});
  }

  function renderEnquiries(){ $("#enquiries-admin").innerHTML=data.enquiries.map(e=>`<tr><td>${esc(e.name)}</td><td>${esc(e.phone)}</td><td>${esc(e.email)}</td><td>${esc(e.message)}</td><td>${esc(e.status)}</td><td><button class="btn btn-light" data-enquiry-status="${esc(e.id)}">Mark Callback</button></td></tr>`).join("") || `<tr><td colspan="6" class="muted">No enquiries yet.</td></tr>`; $$("[data-enquiry-status]").forEach(btn=>btn.onclick=()=>{const e=data.enquiries.find(x=>x.id===btn.dataset.enquiryStatus);if(e){e.status="Callback";save();toast("Enquiry updated.");}}); }

  function renderGallery(){ $("#gallery-admin").innerHTML=(data.gallery||[]).map(g=>`<tr><td><img src="${esc(g.url)}" alt="" style="width:80px;height:60px;object-fit:cover;border-radius:8px"></td><td>${esc(g.title)}</td><td><button class="btn btn-danger" data-delete-gallery="${esc(g.id)}">Delete</button></td></tr>`).join("") || `<tr><td colspan="3" class="muted">No gallery items yet.</td></tr>`; $$("[data-delete-gallery]").forEach(b=>b.onclick=()=>{data.gallery=data.gallery.filter(g=>g.id!==b.dataset.deleteGallery);save();toast("Gallery item deleted.");}); }

  function renderAll(){ load(); renderDashboard(); renderAnalytics(); renderHome(); renderBooks(); renderOrders(); renderEnquiries(); renderGallery(); }

  function bind(){
    $$("[data-admin-section]").forEach(btn=>btn.onclick=()=>show(btn.dataset.adminSection));
    $("#home-form").onsubmit=e=>{e.preventDefault(); const fd=new FormData(e.target); Object.keys(data.settings).forEach(k=>{if(fd.has(k))data.settings[k]=fd.get(k)}); data.settings.deliveryEnabled=fd.get("deliveryEnabled")==="on"; data.settings.codEnabled=fd.get("codEnabled")==="on"; data.settings.deliveryPerKm=Number(fd.get("deliveryPerKm")||0); data.settings.minimumDeliveryFee=Number(fd.get("minimumDeliveryFee")||0); data.settings.freeDeliveryThreshold=Number(fd.get("freeDeliveryThreshold")||0); data.offer={enabled:fd.get("offerEnabled")==="on",type:fd.get("offerType"),value:Number(fd.get("offerValue")||0),minimumPurchase:Number(fd.get("offerMinimum")||0),freeItemPriceCap:Number(fd.get("freeItemPriceCap")||0),text:fd.get("offerText")||""}; save();toast("Store settings saved.");};
    $("#book-editor").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);const base={id:fd.get("bookId")||String(fd.get("book-title")).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||uid("book"),title:fd.get("book-title"),author:fd.get("book-author"),price:Number(fd.get("book-price")||0),format:fd.get("book-format"),category:fd.get("book-category"),stock:Number(fd.get("book-stock")||0),rating:Number(fd.get("book-rating")||0),reviews:Number(fd.get("book-reviews")||0),amazonUrl:fd.get("book-amazonUrl"),cover:fd.get("book-cover"),description:fd.get("book-description"),active:fd.get("book-active")==="on",featured:fd.get("book-featured")==="on"}; const idx=data.books.findIndex(x=>x.id===base.id); if(idx>=0)data.books[idx]=base;else data.books.unshift(base);save();clearBookForm();show("books");toast("Book saved.");};
    $("#clear-book").onclick=clearBookForm;
    $("#delivery-form").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);data.settings.deliveryEnabled=fd.get("deliveryEnabled")==="on";data.settings.codEnabled=fd.get("codEnabled")==="on";data.settings.deliveryPerKm=Number(fd.get("deliveryPerKm")||0);data.settings.minimumDeliveryFee=Number(fd.get("minimumDeliveryFee")||0);data.settings.freeDeliveryThreshold=Number(fd.get("freeDeliveryThreshold")||0);data.offer={enabled:fd.get("offerEnabled")==="on",type:fd.get("offerType"),value:Number(fd.get("offerValue")||0),minimumPurchase:Number(fd.get("offerMinimum")||0),freeItemPriceCap:Number(fd.get("freeItemPriceCap")||0),text:fd.get("offerText")||""};save();toast("Delivery and offer rules saved.");};
    $("#seo-form").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);["seoTitle","seoDescription","seoKeywords","socialImage","whatsapp","phone","locationLabel","mapsUrl","address"].forEach(k=>{if(fd.has(k))data.settings[k]=fd.get(k)});save();toast("SEO and contact settings saved.");};
    $("#gallery-form").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);let url=fd.get("url")||"";const file=fd.get("file");if(file && file.size){url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}if(!url){toast("Add an image URL or choose an image file.");return;}data.gallery.unshift({id:uid("g"),title:fd.get("title"),url});save();e.target.reset();toast("Gallery item added.");};
    $("#reset-store").onclick=()=>{if(confirm("Reset the demo store to the starter data?")){data=BookstoreData.reset();renderAll();toast("Demo store reset.");}};
    $("#save-pin").onclick=()=>{data.admin.pin=$("#admin-pin").value || "1234"; save(); toast("Demo PIN saved.");};
    $("#export-data").onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="bookstore-data.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }

  document.addEventListener("DOMContentLoaded",()=>{load();bind();renderAll();const initial=location.hash.slice(1);if(initial && $("#admin-${initial}"))show(initial);else show("dashboard");});
})();
