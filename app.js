(() => {
  "use strict";

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];
  const currency = () => BookstoreData.get().settings.currency || "₹";
  const money = (n) => `${currency()}${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch]));
  const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  function toast(message) {
    let el = qs("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function cart() {
    try { return JSON.parse(localStorage.getItem("bookstore_cart") || "[]"); }
    catch { return []; }
  }
  function saveCart(items) {
    localStorage.setItem("bookstore_cart", JSON.stringify(items));
    updateCartCount();
    renderCartPage();
  }
  function updateCartCount() {
    const total = cart().reduce((sum, item) => sum + item.qty, 0);
    qsa("[data-cart-count]").forEach(el => el.textContent = total);
  }
  function addToCart(bookId, qty = 1) {
    const data = BookstoreData.get();
    const book = data.books.find(b => b.id === bookId && b.active);
    if (!book) return toast("Book is not available.");
    if (!book.stock) return toast("This book is currently out of stock.");
    const items = cart();
    const found = items.find(i => i.bookId === bookId);
    const max = Math.max(0, Number(book.stock));
    if (found) found.qty = Math.min(max, found.qty + qty);
    else items.push({ bookId, qty: Math.min(max, qty) });
    saveCart(items);
    toast(`${book.title} added to cart.`);
    track("add_to_cart", { bookId });
  }
  function removeFromCart(bookId) {
    saveCart(cart().filter(item => item.bookId !== bookId));
    toast("Removed from cart.");
  }
  function setQty(bookId, qty) {
    const data = BookstoreData.get();
    const book = data.books.find(b => b.id === bookId);
    const next = Math.max(0, Math.min(Number(book?.stock || 0), Number(qty || 0)));
    let items = cart();
    if (next === 0) items = items.filter(item => item.bookId !== bookId);
    else items = items.map(item => item.bookId === bookId ? { ...item, qty: next } : item);
    saveCart(items);
  }

  function calcTotals(items = cart()) {
    const data = BookstoreData.get();
    let subtotal = 0;
    const lines = items.map(item => {
      const book = data.books.find(b => b.id === item.bookId);
      const qty = Math.min(item.qty, Number(book?.stock || 0));
      const line = { ...item, book, qty, lineTotal: qty * Number(book?.price || 0) };
      subtotal += line.lineTotal;
      return line;
    }).filter(x => x.qty > 0 && x.book);

    const offer = data.offer?.enabled ? data.offer : null;
    let discount = 0;
    if (offer && offer.type === "percent" && subtotal >= Number(offer.minimumPurchase || 0)) {
      discount = subtotal * (Number(offer.value || 0) / 100);
    }
    if (offer && offer.type === "b1g1" && subtotal >= Number(offer.minimumPurchase || 0)) {
      const unitPrices = [];
      lines.forEach(line => {
        for (let i = 0; i < line.qty; i++) unitPrices.push(Number(line.book.price || 0));
      });
      unitPrices.sort((a,b) => a-b);
      for (let i = 1; i < unitPrices.length; i += 2) discount += unitPrices[i - 1];
      discount = Math.min(discount, subtotal);
    }
    if (offer && offer.type === "b2g1" && subtotal >= Number(offer.minimumPurchase || 0)) {
      const unitPrices = [];
      lines.forEach(line => {
        for (let i = 0; i < line.qty; i++) unitPrices.push(Number(line.book.price || 0));
      });
      unitPrices.sort((a,b) => b-a);
      for (let i = 2; i < unitPrices.length; i += 3) {
        discount += Math.min(unitPrices[i], Number(offer.freeItemPriceCap || Infinity));
      }
      discount = Math.min(discount, subtotal);
    }
    const shippingDistance = Number(sessionStorage.getItem("bookstore_delivery_distance") || 0);
    let delivery = 0;
    if (data.settings.deliveryEnabled) {
      if (subtotal < Number(data.settings.freeDeliveryThreshold || Infinity)) {
        delivery = Math.max(Number(data.settings.minimumDeliveryFee || 0), shippingDistance * Number(data.settings.deliveryPerKm || 0));
      }
    }
    return { lines, subtotal, discount, delivery, total: Math.max(0, subtotal - discount + delivery), shippingDistance };
  }

  function track(event, payload = {}) {
    const data = BookstoreData.get();
    data.analytics = Array.isArray(data.analytics) ? data.analytics : [];
    data.analytics.push({ id: uid("event"), event, payload, path: location.pathname + location.search, at: new Date().toISOString() });
    data.analytics = data.analytics.slice(-500);
    BookstoreData.save(data);
  }

  function fillGlobal() {
    const data = BookstoreData.get();
    qsa("[data-brand]").forEach(el => el.textContent = data.settings.brand);
    qsa("[data-tagline]").forEach(el => el.textContent = data.settings.tagline);
    qsa("[data-phone]").forEach(el => { el.textContent = data.settings.phone; el.href = `tel:${data.settings.phone.replace(/\s+/g, "")}`; });
    qsa("[data-whatsapp]").forEach(el => { el.href = `https://wa.me/${String(data.settings.whatsapp).replace(/\D/g, "")}`; });
    qsa("[data-location]").forEach(el => { el.textContent = data.settings.locationLabel; el.href = data.settings.mapsUrl; });
    qsa("[data-address]").forEach(el => el.textContent = data.settings.address);
    qsa("[data-support]").forEach(el => el.textContent = data.settings.supportText);
    qsa("[data-seo-title]").forEach(el => { document.title = data.settings.seoTitle; });
    const desc = qs('meta[name="description"]');
    if (desc) desc.setAttribute("content", data.settings.seoDescription);
    const heroHeading = qs("[data-hero-heading]");
    if (heroHeading) heroHeading.textContent = data.settings.heroHeading;
    const heroText = qs("[data-hero-text]");
    if (heroText) heroText.textContent = data.settings.heroText;
    const support = qs("[data-support]");
    if (support) support.textContent = data.settings.supportText;
    const offerBar = qs("#offer-bar");
    if (offerBar) {
      offerBar.classList.toggle("hidden", !data.offer?.enabled);
      const text = qs("#offer-text", offerBar);
      if (text) text.textContent = data.offer?.text || "Special offer available";
    }
    updateCartCount();
  }

  function setupMenu() {
    const toggle = qs("#menu-toggle");
    const nav = qs("#site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  function renderCatalog() {
    const root = qs("#book-grid");
    if (!root) return;
    const data = BookstoreData.get();
    const search = (qs("#search-books")?.value || "").trim().toLowerCase();
    const category = qs("#category-filter")?.value || "all";
    const maxPrice = Number(qs("#price-filter")?.value || 5000);
    const sort = qs("#sort-books")?.value || "featured";

    let books = data.books.filter(b => b.active && b.price <= maxPrice);
    if (search) books = books.filter(b => `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(search));
    if (category !== "all") books = books.filter(b => b.category === category);
    if (sort === "rating") books.sort((a,b) => b.rating - a.rating);
    if (sort === "low") books.sort((a,b) => a.price - b.price);
    if (sort === "high") books.sort((a,b) => b.price - a.price);
    if (sort === "featured") books.sort((a,b) => Number(b.featured) - Number(a.featured));

    root.innerHTML = books.length ? books.map(bookCard).join("") : `<div class="card" style="grid-column:1/-1;padding:28px;text-align:center"><h3>No books found</h3><p class="muted">Try a different filter or search term.</p></div>`;
    qsa("[data-add-cart]").forEach(btn => btn.addEventListener("click", () => addToCart(btn.dataset.addCart)));
    qsa("[data-buy-now]").forEach(btn => btn.addEventListener("click", () => { addToCart(btn.dataset.buyNow); location.href="cart.html"; }));
    qsa("[data-book-link]").forEach(a => a.addEventListener("click", () => track("book_view", { bookId:a.dataset.bookLink })));
  }

  function bookCard(book) {
    const stock = Number(book.stock || 0);
    return `<article class="card book-card">
      <a href="index.html?book=${encodeURIComponent(book.id)}" data-book-link="${esc(book.id)}" aria-label="View ${esc(book.title)}">
        <img class="book-cover" src="${esc(book.cover)}" alt="${esc(book.title)} cover" loading="lazy">
      </a>
      <div class="book-card-body">
        <div class="book-meta"><span>${esc(book.category)}</span><span class="rating">★ ${Number(book.rating).toFixed(1)}</span></div>
        <h3 class="book-title"><a href="index.html?book=${encodeURIComponent(book.id)}">${esc(book.title)}</a></h3>
        <div class="muted">by ${esc(book.author)}</div>
        <div class="book-meta"><span>${esc(book.format)}</span><span>${book.reviews || 0} reviews</span></div>
        <div class="price">${money(book.price)}</div>
        <div class="stock ${stock ? "in":"out"}">${stock ? `${stock} in stock` : "Out of stock"}</div>
        <div class="card-actions">
          <button class="btn btn-primary" ${stock ? "":"disabled"} data-add-cart="${esc(book.id)}">Add to Cart</button>
          <button class="btn btn-dark" ${stock ? "":"disabled"} data-buy-now="${esc(book.id)}">Buy Now</button>
        </div>
        ${book.amazonUrl ? `<a class="btn btn-light" href="${esc(book.amazonUrl)}" target="_blank" rel="noopener">Amazon</a>` : ""}
      </div>
    </article>`;
  }

  function renderCategories() {
    const select = qs("#category-filter");
    if (!select) return;
    const data = BookstoreData.get();
    const categories = [...new Set(data.books.filter(b => b.active).map(b => b.category).filter(Boolean))].sort();
    const current = select.value || "all";
    select.innerHTML = `<option value="all">All Categories</option>${categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}`;
    select.value = categories.includes(current) ? current : "all";
  }

  function setupCatalog() {
    if (!qs("#book-grid")) return;
    renderCategories();
    renderCatalog();
    ["#search-books", "#category-filter", "#price-filter", "#sort-books"].forEach(sel => qs(sel)?.addEventListener("input", renderCatalog));
    qs("#price-filter")?.addEventListener("input", () => { const l = qs("#price-label"); if (l) l.textContent = money(Number(qs("#price-filter").value)); });
    track("page_view", { page:"catalog" });
  }

  function renderDetail() {
    const root = qs("#book-detail");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("book");
    if (!id) { root.innerHTML = `<div class="card" style="padding:28px;text-align:center"><h2>Book not selected</h2><a class="btn btn-dark" href="#books">Browse Books</a></div>`; return; }
    const data = BookstoreData.get();
    const book = data.books.find(b => b.id === id && b.active);
    if (!book) { root.innerHTML = `<div class="card" style="padding:28px;text-align:center"><h2>Book not found</h2><p class="muted">The selected book is unavailable.</p></div>`; return; }
    document.title = `${book.title} | ${data.settings.brand}`;
    root.innerHTML = `<div class="detail">
      <div><img class="detail-cover" src="${esc(book.cover)}" alt="${esc(book.title)} cover"></div>
      <div>
        <span class="chip">${esc(book.category)}</span>
        <h1 style="font-size:clamp(2rem,4vw,3.5rem)">${esc(book.title)}</h1>
        <p class="muted">by ${esc(book.author)} · ${esc(book.format)}</p>
        <div class="rating">★ ${Number(book.rating).toFixed(1)} · ${book.reviews || 0} reviews</div>
        <div class="detail-price">${money(book.price)}</div>
        <p>${esc(book.description)}</p>
        <p class="stock ${book.stock ? "in":"out"}">${book.stock ? `${book.stock} copies available` : "Currently out of stock"}</p>
        <div class="detail-actions">
          <button class="btn btn-primary" id="detail-add" ${book.stock ? "":"disabled"}>Add to Cart</button>
          <button class="btn btn-dark" id="detail-buy" ${book.stock ? "":"disabled"}>Buy Now</button>
          ${book.amazonUrl ? `<a class="btn btn-light" href="${esc(book.amazonUrl)}" target="_blank" rel="noopener">View on Amazon</a>` : ""}
        </div>
        <div class="card" style="padding:18px"><strong>Share this book</strong><p class="muted" style="margin:.35rem 0 0">This page uses a unique query URL: <code>index.html?book=${esc(book.id)}</code></p><button class="btn btn-ghost" id="share-book" style="margin-top:10px">Share</button></div>
      </div>
    </div>`;
    qs("#detail-add")?.addEventListener("click", () => addToCart(book.id));
    qs("#detail-buy")?.addEventListener("click", () => { addToCart(book.id); location.href="cart.html"; });
    qs("#share-book")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href); toast("Book link copied."); }
      catch { toast("Copy failed. Use the URL in your browser address bar."); }
    });
    track("book_view", { bookId: book.id });
  }

  function renderCartPage() {
    const list = qs("#cart-list");
    const empty = qs("#cart-empty");
    const summary = qs("#cart-summary");
    if (!list || !empty || !summary) return;
    const totals = calcTotals();
    if (!totals.lines.length) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      summary.innerHTML = "";
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = totals.lines.map(item => `<div class="cart-item">
      <img src="${esc(item.book.cover)}" class="cart-thumb" alt="${esc(item.book.title)}">
      <div><h3 style="margin-bottom:.2rem">${esc(item.book.title)}</h3><div class="muted">${esc(item.book.author)}</div><div class="price">${money(item.book.price)}</div></div>
      <div style="display:grid;gap:8px;justify-items:end"><div class="qty"><button data-minus="${esc(item.bookId)}">−</button><span>${item.qty}</span><button data-plus="${esc(item.bookId)}">+</button></div><button class="btn btn-danger" data-remove="${esc(item.bookId)}">Remove</button></div>
    </div>`).join("");
    summary.innerHTML = summaryHtml(totals, "cart");
    qsa("[data-minus]").forEach(b => b.addEventListener("click", () => setQty(b.dataset.minus, (cart().find(i=>i.bookId===b.dataset.minus)?.qty || 1)-1)));
    qsa("[data-plus]").forEach(b => b.addEventListener("click", () => setQty(b.dataset.plus, (cart().find(i=>i.bookId===b.dataset.plus)?.qty || 0)+1)));
    qsa("[data-remove]").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
  }

  function summaryHtml(t, context) {
    return `<h3>Order Summary</h3>
      <div class="summary-row"><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div>
      <div class="summary-row"><span>Offer Discount</span><strong>− ${money(t.discount)}</strong></div>
      <div class="summary-row"><span>Delivery</span><strong>${t.delivery ? money(t.delivery) : "Free"}</strong></div>
      <div class="summary-row"><span>Distance</span><span>${t.shippingDistance || 0} km</span></div>
      <div class="summary-row summary-total"><span>Total</span><strong>${money(t.total)}</strong></div>
      ${context === "cart" ? `<a class="btn btn-dark btn-block" href="checkout.html" style="margin-top:15px">Proceed to Checkout</a>` : `<button class="btn btn-primary btn-block" id="pay-securely" style="margin-top:15px">Pay Securely</button>`}`;
  }

  function setupCheckout() {
    const form = qs("#checkout-form");
    const summary = qs("#checkout-summary");
    if (!form || !summary) return;
    const items = cart();
    if (!items.length) { location.href="cart.html"; return; }
    renderCheckoutSummary(summary);
    qs("#delivery-distance")?.addEventListener("input", () => { sessionStorage.setItem("bookstore_delivery_distance", qs("#delivery-distance").value || "0"); renderCheckoutSummary(summary); });
    const data = BookstoreData.get();
    const cod = qs("#pay-cod");
    if (cod) { cod.closest(".payment-option")?.classList.toggle("disabled", !data.settings.codEnabled); cod.disabled = !data.settings.codEnabled; if (!data.settings.codEnabled) cod.checked=false; }
    qsa("[name=payment]").forEach(input => input.addEventListener("change", () => { track("checkout_payment_select", { payment: input.value }); }));
    form.addEventListener("submit", e => {
      e.preventDefault();
      const totals = calcTotals();
      const fd = new FormData(form);
      const order = {
        id: `GLB-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        status: "Placed",
        createdAt: new Date().toISOString(),
        shipping: Object.fromEntries(fd.entries()),
        payment: fd.get("payment"),
        items: totals.lines.map(i => ({ bookId:i.bookId, title:i.book.title, price:i.book.price, qty:i.qty })),
        subtotal: totals.subtotal, discount: totals.discount, delivery: totals.delivery, total: totals.total,
        tracking: { lastUpdate: new Date().toISOString(), events:[{status:"Placed", at:new Date().toISOString(), note:"Order received in demo mode."}] }
      };
      const data = BookstoreData.get();
      const dataWithOrder = data;
      dataWithOrder.orders = Array.isArray(dataWithOrder.orders) ? dataWithOrder.orders : [];
      totals.lines.forEach(i => {
        const book = dataWithOrder.books.find(b => b.id === i.bookId);
        if (book) book.stock = Math.max(0, Number(book.stock) - i.qty);
      });
      dataWithOrder.orders.unshift(order);
      dataWithOrder.analytics.push({ id:uid("event"), event:"order", payload:{ orderId:order.id }, path:location.pathname, at:new Date().toISOString() });
      BookstoreData.save(dataWithOrder);
      localStorage.removeItem("bookstore_cart");
      sessionStorage.removeItem("bookstore_delivery_distance");
      localStorage.setItem("bookstore_last_order_id", order.id);
      track("checkout_complete", { orderId:order.id });
      location.href=`success.html?order=${encodeURIComponent(order.id)}`;
    });
  }

  function renderCheckoutSummary(summary) {
    const totals = calcTotals();
    summary.innerHTML = summaryHtml(totals, "checkout");
    qs("#pay-securely")?.addEventListener("click", () => toast("Choose a payment method and submit the order."));
  }

  function renderSuccess() {
    const root = qs("#success-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("order") || localStorage.getItem("bookstore_last_order_id");
    const data = BookstoreData.get();
    const order = data.orders.find(o => o.id === id);
    if (!order) { root.innerHTML=`<div class="card" style="padding:28px;text-align:center"><h2>No order found</h2><a class="btn btn-dark" href="index.html">Back to Store</a></div>`; return; }
    root.innerHTML = `<div class="card" style="padding:28px">
      <span class="chip">Order confirmed</span><h1 style="margin-top:12px">Thank you for your order!</h1><p>Order ID: <strong>${esc(order.id)}</strong></p>
      <div class="admin-grid" style="margin-top:20px">
        <div><h3>Items</h3>${order.items.map(i=>`<div class="summary-row"><span>${esc(i.title)} × ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div>`).join("")}</div>
        <div><h3>Shipping</h3><p>${esc(order.shipping.name)}<br>${esc(order.shipping.address)}, ${esc(order.shipping.city)}<br>${esc(order.shipping.state)} - ${esc(order.shipping.pincode)}<br>${esc(order.shipping.phone)}</p><h3 style="margin-top:20px">Tracking</h3><div class="chip">${esc(order.status)}</div><p class="muted" style="margin-top:8px">Demo tracking is stored in the browser now. Backend-connected tracking can use the same order model later.</p></div>
      </div>
      <div style="margin-top:18px;padding-top:15px;border-top:1px solid var(--line)"><div class="summary-row"><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div><div class="summary-row"><span>Discount</span><strong>− ${money(order.discount)}</strong></div><div class="summary-row"><span>Delivery</span><strong>${money(order.delivery)}</strong></div><div class="summary-row summary-total"><span>Total</span><strong>${money(order.total)}</strong></div></div>
      <div class="detail-actions"><a class="btn btn-dark" href="index.html">Continue Shopping</a><a class="btn btn-light" href="enquiry.html">Need Help?</a></div>
    </div>`;
    track("order_success_view", { orderId: order.id });
  }

  function setupEnquiry() {
    const form = qs("#enquiry-form");
    if (!form) return;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = BookstoreData.get();
      data.enquiries.unshift({ id:uid("enq"), name:fd.get("name"), phone:fd.get("phone"), email:fd.get("email"), message:fd.get("message"), status:"New", createdAt:new Date().toISOString() });
      BookstoreData.save(data);
      const message = `Book Enquiry%0AName: ${encodeURIComponent(fd.get("name"))}%0APhone: ${encodeURIComponent(fd.get("phone"))}%0AEmail: ${encodeURIComponent(fd.get("email"))}%0AMessage: ${encodeURIComponent(fd.get("message"))}`;
      const wa = String(data.settings.whatsapp).replace(/\D/g, "");
      window.open(`https://wa.me/${wa}?text=${message}`, "_blank", "noopener");
      form.reset();
      toast("Enquiry saved and WhatsApp opened.");
    });
  }

  function renderGallery() {
    const root = qs("#gallery-grid");
    if (!root) return;
    const items = BookstoreData.get().gallery || [];
    root.innerHTML = items.map(g => `<figure class="gallery-item"><img src="${esc(g.url)}" alt="${esc(g.title)}" loading="lazy"><figcaption class="gallery-caption">${esc(g.title)}</figcaption></figure>`).join("");
  }

  function init() {
    fillGlobal(); setupMenu(); setupCatalog(); renderDetail(); renderCartPage(); setupCheckout(); renderSuccess(); setupEnquiry(); renderGallery();
    qsa("[data-track]").forEach(el => el.addEventListener("click", () => track(el.dataset.track, { label:el.textContent.trim() })));
    window.addEventListener("bookstore:data-updated", () => { fillGlobal(); renderCategories(); renderCatalog(); renderCartPage(); renderGallery(); });
  }

  Object.assign(window, { BookstoreApp: { money, cart, addToCart, removeFromCart, setQty, calcTotals, toast, track, renderCatalog, renderGallery } });
  document.addEventListener("DOMContentLoaded", init);
})();
