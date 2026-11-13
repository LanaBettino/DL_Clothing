(() => {
  const $ = (id) => document.getElementById(id);
  const esc = DLStore.escape, money = DLStore.money;
  let state, pdp = {id:null,size:'',color:'',img:0}, promo = null, draftAccount = false, toastTimer;
  let cart = JSON.parse(localStorage.getItem('dl-cart') || '[]');
  let wishlist = JSON.parse(localStorage.getItem('dl-wishlist') || '[]');
  let currentUser = JSON.parse(localStorage.getItem('dl-user') || 'null');
  let searchTerm = ''; let deliveryMode = 'standard';

  const products = () => (state?.products || []).filter(p => p.published !== false);
  const availableStock = p => Object.values(p.stock || {}).reduce((a,b)=>a+(Number(b)||0),0);
  const productById = id => (state.products || []).find(p=>p.id===id);
  const cartCount = () => cart.reduce((sum,item)=>sum+item.qty,0);
  const cartTotal = () => cart.reduce((sum,item)=>sum+(Number(productById(item.id)?.price)||0)*item.qty,0);
  function toast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
  function saveCart(){ localStorage.setItem('dl-cart',JSON.stringify(cart)); renderCart(); }
  function saveWishlist(){ localStorage.setItem('dl-wishlist',JSON.stringify(wishlist)); $('wishCount').textContent=wishlist.length; renderWishlist(); }
  function renderContent(){
    const c=state.content||{};
    $('announcementBar').textContent=c.announcement||'LOCAL ROOTS. MODERN MINDS. BIGGER DREAMS.';
    $('heroEyebrow').innerHTML=`${esc(c.heroEyebrow||'THE DELEGACY COLLECTION')} <span></span>`;
    $('heroTitle').innerHTML=esc(c.heroTitle||'Move with purpose.').replace(/\n/g,'<br>').replace(/(purpose\.?|everyday\.?|movement\.?)/i,'<em>$1</em>');
    $('heroText').textContent=c.heroText||''; $('heroButton').childNodes[0].textContent=(c.heroButton||'Shop the collection')+' ';
    $('storyTitle').textContent=c.storyTitle||'More than what you wear.'; $('storyText').textContent=c.storyText||'';
    $('footerEmail').href='mailto:'+(c.contactEmail||'hello@delegacystore.co.za');
    const ig=$('footerInstagram'); if(ig) ig.href=c.instagram||'https://www.instagram.com/';
    const wa=$('footerWhatsapp'); if(wa){const digits=String(c.whatsapp||'').replace(/[^0-9]/g,'');if(digits){wa.href='https://wa.me/'+digits;wa.hidden=false;}else wa.hidden=true;}
    const foot=$('footerStatement'); if(foot) foot.innerHTML=esc(c.footerNote||'BUILT WITH PURPOSE')+' <b>DL</b>';
    $('footerEmail').textContent='Contact'; $('yearNow').textContent=new Date().getFullYear();
  }
  const FALLBACK = './tee-back-stock.png';
  const stockLabel = p => { const n=availableStock(p); return n===0?'Unavailable':n<5?'LOW STOCK':'IN STOCK'; };
  function cardHTML(p){
    const out=availableStock(p)===0, sale=p.compareAt&&p.compareAt>p.price;
    const main=DLStore.imageUrl(p.image), alt=(p.gallery&&p.gallery[1])||'';
    const href='#/product/'+encodeURIComponent(p.id);
    return `<article class="product-card" data-product="${esc(p.id)}"><a class="product-image-wrap" href="${href}" aria-label="View ${esc(p.name)}"><img class="frame-bg" src="${esc(main)}" alt="" aria-hidden="true" loading="lazy"><img class="frame-fg" src="${esc(main)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='${FALLBACK}'">${alt?`<img class="frame-fg frame-alt" src="${esc(alt)}" alt="" loading="lazy">`:''}<span class="product-flag ${sale?'sale':''}">${out?'ORDER REQUEST':sale?'SPECIAL PRICE':esc(p.subcategory||p.category)}</span><span class="quick-view">VIEW PIECE +</span></a><button class="round-action card-wish ${wishlist.includes(p.id)?'selected':''}" data-wish="${esc(p.id)}" aria-label="Save ${esc(p.name)} to wishlist">${wishlist.includes(p.id)?'♥':'♡'}</button><div class="product-info"><div class="product-meta"><span>${esc(p.category)} / ${esc(p.subcategory||'')}</span><span>${stockLabel(p)}</span></div><h3 class="product-name"><a href="${href}">${esc(p.name)}</a></h3><div class="product-bottom"><div class="product-price">${money(p.price)} ${sale?`<span class="old-price">${money(p.compareAt)}</span>`:''}</div><span class="product-meta">${(p.sizes||[]).length>1?esc(p.sizes[0])+' – '+esc(p.sizes[p.sizes.length-1]):''}</span></div></div></article>`;
  }
  function renderProducts(){
    const term=searchTerm.toLowerCase();
    const match=p=>!term||(p.name+' '+p.category+' '+p.subcategory+' '+p.description).toLowerCase().includes(term);
    const vests=products().filter(p=>p.category==='Vests'&&match(p)), tees=products().filter(p=>p.category==='Tees'&&match(p));
    const others=products().filter(p=>p.category!=='Vests'&&p.category!=='Tees'&&match(p));
    const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
    $('vestGrid').innerHTML=vests.map(cardHTML).join('');
    $('teeGrid').innerHTML=tees.concat(others).map(cardHTML).join('');
    $('vestCount').textContent=plural(vests.length,'piece'); $('teeCount').textContent=plural(tees.length+others.length,'piece');
    $('vests').hidden=!vests.length; $('tees').hidden=!(tees.length+others.length);
    $('emptyProducts').hidden=!!(vests.length+tees.length+others.length);
    const allV=products().filter(p=>p.category==='Vests').length, allT=products().filter(p=>p.category==='Tees').length;
    $('vestTileCount').textContent=`${plural(allV,'style')} · Men & Women`; $('teeTileCount').textContent=`${plural(allT,'style')} · Unisex`;
  }
  function updateCounts(){ $('cartCount').textContent=cartCount(); $('drawerCount').textContent=`(${cartCount()})`; $('wishCount').textContent=wishlist.length; }
  function openDrawer(id){ $('overlay').classList.add('active'); document.querySelectorAll('.side-drawer').forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')}); $(id).classList.add('open'); $(id).setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeDrawers(){document.querySelectorAll('.side-drawer').forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')});$('overlay').classList.remove('active');document.body.style.overflow='';}
  function openModal(id){$(id).classList.add('open');document.body.style.overflow='hidden'}
  function closeModals(){document.querySelectorAll('.modal-wrap.open').forEach(m=>m.classList.remove('open'));document.body.style.overflow=''}
  function toggleWish(id){wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];saveWishlist();renderProducts();if(pdp.id&&!$('productPage').hidden){const b=$('pdpWish');if(b)b.textContent=wishlist.includes(pdp.id)?'♥ SAVED':'♡ SAVE';}toast(wishlist.includes(id)?'Saved to your wishlist.':'Removed from your wishlist.');}
  function addToCart(id,size,color,qty=1){const p=productById(id);if(!p)return; if(!size){toast('Choose a size first.');return;} const key=`${id}|${size}|${color||''}`;const found=cart.find(x=>x.key===key); if(found) found.qty+=qty;else cart.push({key,id,size,color:color||'',qty});saveCart();toast('Added to your bag.');}
  function renderCart(){
    updateCounts();const host=$('cartItems');
    if(!cart.length){host.innerHTML='<div class="drawer-empty"><h4>Your bag is waiting.</h4><p>Find something that moves with you.</p><button class="outline-btn" data-close="cartDrawer">Continue shopping</button></div>';}
    else host.innerHTML=cart.map(item=>{const p=productById(item.id);if(!p)return '';return `<div class="cart-line"><img src="${esc(DLStore.imageUrl(p.image))}" alt="${esc(p.name)}"><div><h4>${esc(p.name)}</h4><p>${esc(item.size)}${item.color?' · '+esc(item.color):''}</p><strong>${money(p.price*item.qty)}</strong><div class="qty-control"><button data-qty="${esc(item.key)}" data-change="-1">−</button><span>${item.qty}</span><button data-qty="${esc(item.key)}" data-change="1">+</button></div></div><button class="remove-link" data-remove="${esc(item.key)}">Remove</button></div>`}).join('');
    $('cartSubtotal').textContent=money(cartTotal());const shippingBase=cartTotal()>=1000?'You qualify for complimentary delivery.':'Add '+money(1000-cartTotal())+' more for complimentary delivery.';$('shippingProgress').textContent=shippingBase+(state.content?.shippingNote?' '+state.content.shippingNote:'');
  }
  function renderWishlist(){const host=$('wishlistItems');const items=wishlist.map(productById).filter(Boolean);host.innerHTML=items.length?items.map(p=>`<div class="cart-line"><img src="${esc(DLStore.imageUrl(p.image))}" alt="${esc(p.name)}"><div><h4>${esc(p.name)}</h4><p>${esc(p.category)} · From ${money(p.price)}</p><button class="text-btn" data-open="${esc(p.id)}">View item</button></div><button class="remove-link" data-wish="${esc(p.id)}">Remove</button></div>`).join(''):'<div class="drawer-empty"><span>♡</span><h4>No saved pieces yet.</h4><p>Tap the heart on a piece to keep it here.</p></div>';}
  /* ---------- Product page ---------- */
  function productPageHTML(p){
    const gallery=(p.gallery&&p.gallery.length?p.gallery:[p.image]).map(DLStore.imageUrl);
    const i=Math.min(pdp.img,gallery.length-1);
    const sale=p.compareAt&&p.compareAt>p.price, qty=Number(p.stock?.[pdp.size])||0;
    const sizes=(p.sizes||[]).map(s=>`<button type="button" class="size-option ${s===pdp.size?'active':''}" data-size="${esc(s)}">${esc(s)}</button>`).join('');
    const colors=(p.colors||[]).map(c=>`<button type="button" class="color-option ${c===pdp.color?'active':''}" data-color="${esc(c)}"><span class="swatch-dot" style="background:${({Black:'#111',White:'#fff',Blue:'#0060f0',Pink:'#f030a0',Grey:'#999',Green:'#44674c'}[c]||'#ccc')}"></span>${esc(c)}</button>`).join('');
    const thumbs=gallery.map((g,n)=>`<button type="button" class="pdp-thumb ${n===i?'active':''}" data-pdp-img="${n}" aria-label="Show image ${n+1}"><img src="${esc(g)}" alt="" loading="lazy"></button>`).join('');
    const related=products().filter(x=>x.id!==p.id).map(cardHTML).join('');
    const group=p.category==='Tees'?'tees':'vests';
    return `<div class="pdp-wrap"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="#top">Home</a><span>/</span><a href="#${group}">${esc(p.category)}</a><span>/</span><b>${esc(p.name)}</b></nav>
    <div class="pdp-layout"><div class="pdp-gallery"><div class="pdp-thumbs">${thumbs}</div><div class="pdp-stage" id="pdpStage"><img class="frame-bg" id="pdpBg" src="${esc(gallery[i])}" alt="" aria-hidden="true"><img class="frame-fg" id="pdpMain" src="${esc(gallery[i])}" alt="${esc(p.name)} — image ${i+1}"><span class="pdp-counter" id="pdpCounter">${i+1} / ${gallery.length}</span>${gallery.length>1?'<button type="button" class="pdp-arrow prev" data-pdp-step="-1" aria-label="Previous image">‹</button><button type="button" class="pdp-arrow next" data-pdp-step="1" aria-label="Next image">›</button>':''}</div>${p.modelInfo?`<p class="pdp-caption">${esc(p.modelInfo)}</p>`:''}</div>
    <div class="pdp-info"><p class="eyebrow dark-eyebrow">${esc(p.category)} / ${esc(p.subcategory||'DELEGACY')}</p><h1>${esc(p.name)}</h1><p class="pdp-price">${money(p.price)} ${sale?`<span class="old-price">${money(p.compareAt)}</span>`:''}</p><p class="pdp-lede">${esc(p.description||'')}</p>
    <div class="quick-label"><span>Colour</span><span>${esc(pdp.color)}</span></div><div class="color-options">${colors}</div>
    <div class="quick-label"><span>Size</span><button type="button" id="openSizeGuide">Size guide</button></div><div class="size-options">${sizes}</div>
    <p class="quick-stock" id="pdpStock">${pdp.size?(qty>0?(qty<5?`Only ${qty} left in ${esc(pdp.size)}.`:`In stock in ${esc(pdp.size)}.`):`Currently out of stock. You can still submit an order request for availability confirmation.`):'Choose a size to continue.'}</p>
    <div class="quick-add"><button type="button" class="button button-dark" id="pdpAdd">Add to bag</button><button type="button" class="outline-btn" id="pdpWish">${wishlist.includes(p.id)?'♥ SAVED':'♡ SAVE'}</button></div>
    <ul class="pdp-perks"><li>${esc(state.content?.shippingNote||'Complimentary delivery on orders over R1,000.')}</li><li>Order request · Availability confirmed by our team</li></ul>
    <div class="pdp-accordion"><details open><summary>How it fits</summary><p>${esc(p.fit||'Regular')} fit. If you are between sizes, size up for a looser feel. See the <button type="button" class="text-btn inline" id="openSizeGuide2">size guide</button>.</p></details><details><summary>Product details</summary><p>${esc(p.description||'')}</p><p>${esc(p.material||'')}${p.occasion?' · '+esc(p.occasion):''}</p></details><details><summary>Care</summary><p>${esc(p.care||'Follow the garment care label.')}</p></details><details><summary>Delivery &amp; returns</summary><p>${esc(state.content?.shippingNote||'')} Read our <button type="button" class="text-btn inline" data-policy-open="returns">returns policy</button>.</p></details></div></div></div>
    ${related?`<section class="pdp-related"><h2>You may also <em>like</em></h2><div class="product-grid">${related}</div></section>`:''}</div>
    <div class="pdp-sticky"><div><b>${esc(p.name)}</b><span>${money(p.price)}</span></div><button type="button" class="button button-dark" id="pdpAddSticky">Add to bag</button></div>`;
  }
  function renderProductPage(){const p=productById(pdp.id);if(!p)return;$('productPage').innerHTML=productPageHTML(p);}
  function showProduct(p){
    if(pdp.id!==p.id){pdp={id:p.id,size:'',color:(p.colors||[])[0]||'',img:0};}
    $('homeView').hidden=true;$('productPage').hidden=false;renderProductPage();document.title=`${p.name} — DeLEGACY`;
    window.scrollTo({top:0,behavior:'instant'});
  }
  function pdpGo(n){const p=productById(pdp.id);if(!p)return;const len=(p.gallery&&p.gallery.length)||1;pdp.img=(n+len)%len;
    const src=DLStore.imageUrl((p.gallery&&p.gallery[pdp.img])||p.image);$('pdpMain').src=src;$('pdpBg').src=src;$('pdpCounter').textContent=`${pdp.img+1} / ${len}`;
    document.querySelectorAll('.pdp-thumb').forEach((b,i)=>b.classList.toggle('active',i===pdp.img));}
  function pdpAdd(){const p=productById(pdp.id);if(!p)return;addToCart(p.id,pdp.size,pdp.color);if(pdp.size){renderCart();openDrawer('cartDrawer');}}
  function showHome(hash){
    $('homeView').hidden=false;$('productPage').hidden=true;document.title='DeLEGACY — Move with purpose';pdp.id=null;
    const id=(hash||'').replace('#','');
    if(id&&!id.startsWith('/')){const el=document.getElementById(id);if(el)requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'start'}));}
    else window.scrollTo({top:0,behavior:'instant'});
  }
  function route(){
    const m=location.hash.match(/^#\/product\/(.+)$/);
    if(m){const p=productById(decodeURIComponent(m[1]));if(p&&p.published!==false){showProduct(p);return;}}
    showHome(location.hash);
  }
  function checkout(){if(!cart.length){toast('Your bag is empty.');return;}closeDrawers();promo=null;deliveryMode='standard';renderCheckout();openModal('checkoutModal');}
  function totals(){const subtotal=cartTotal();let discount=0;if(promo){discount=promo.type==='percent'?Math.round(subtotal*(promo.value/100)):Math.min(subtotal,promo.value);}const shipping=deliveryMode==='pickup'?0:deliveryMode==='express'?150:(subtotal-discount>=1000?0:85);return {subtotal,discount,shipping,total:subtotal-discount+shipping};}
  function renderCheckout(){const t=totals();$('checkoutContent').innerHTML=`<p class="eyebrow dark-eyebrow">ALMOST YOURS / SECURE CHECKOUT</p><h2 id="checkoutTitle">Let's make it yours.</h2><p class="subtext">Send your order request. Our team will contact you to confirm availability and arrange payment.</p><div class="checkout-content-grid"><form id="checkoutForm"><div class="checkout-form"><label class="span-two">Email address<input type="email" name="email" required value="${esc(currentUser?.email||'')}" ${currentUser?'readonly':''}></label><label>First name<input name="firstName" required value="${esc(currentUser?.firstName||'')}"></label><label>Last name<input name="lastName" required value="${esc(currentUser?.lastName||'')}"></label><label class="span-two">Phone number<input name="phone" type="tel" required placeholder="e.g. 082 000 0000"></label><label class="span-two">Delivery address<input name="address" required placeholder="Street and number"></label><label>City / Town<input name="city" required></label><label>Postal code<input name="postal" required></label><label class="span-two">Delivery option<select name="delivery"><option value="standard" ${deliveryMode==='standard'?'selected':''}>Standard delivery — R85</option><option value="pickup" ${deliveryMode==='pickup'?'selected':''}>Collection — Free</option><option value="express" ${deliveryMode==='express'?'selected':''}>Express delivery — R150</option></select></label><label class="span-two">Order note (optional)<input name="note" placeholder="Anything we should know?"></label><label class="span-two">Promo code<div style="display:flex;gap:8px"><input name="promo" id="promoInput" placeholder="WELCOME10" style="flex:1"><button type="button" id="applyPromo" class="outline-btn">Apply</button></div></label></div><p class="checkout-note">No online payment is taken. Your order request will be sent to the DeLEGACY team for confirmation.</p><button type="submit" class="button button-dark full-btn">Send order request</button></form><aside class="checkout-summary"><h3>Your order</h3>${cart.map(i=>{const p=productById(i.id);return p?`<div class="summary-line"><span>${esc(p.name)} × ${i.qty}<br><small>${esc(i.size)} · ${esc(i.color)}</small></span><b>${money(p.price*i.qty)}</b></div>`:''}).join('')}<div class="summary-line"><span>Subtotal</span><b>${money(t.subtotal)}</b></div><div class="summary-line"><span>Discount</span><b>−${money(t.discount)}</b></div><div class="summary-line"><span>Shipping</span><b>${money(t.shipping)}</b></div><div class="summary-line total"><span>Total</span><b>${money(t.total)}</b></div></aside></div>`;
    $('applyPromo').addEventListener('click',()=>{const code=$('promoInput').value.trim().toUpperCase();const match=(state.promoCodes||[]).find(x=>x.code.toUpperCase()===code&&x.active);if(match){promo=match;updateCheckoutSummary();toast('Promo code applied.');}else{promo=null;updateCheckoutSummary();toast('That promo code is not active.');}});
    $('checkoutForm').elements.delivery.addEventListener('change',e=>{deliveryMode=e.target.value;updateCheckoutSummary();});
    $('checkoutForm').addEventListener('submit',placeOrder);
  }
  function updateCheckoutSummary(){const t=totals();const host=document.querySelector('.checkout-summary');if(!host)return;const lines=[...host.querySelectorAll('.summary-line')];const discountLine=lines.find(x=>x.querySelector('span')?.textContent==='Discount');const shippingLine=lines.find(x=>x.querySelector('span')?.textContent==='Shipping');const totalLine=host.querySelector('.summary-line.total b');if(discountLine)discountLine.querySelector('b').textContent='−'+money(t.discount);if(shippingLine)shippingLine.querySelector('b').textContent=money(t.shipping);if(totalLine)totalLine.textContent=money(t.total);}
  async function placeOrder(e){
    e.preventDefault();
    if(!DLStore.cloudEnabled()){toast('Orders are not live yet. Firebase configuration is required.');return;}
    const waWindow=window.open('about:blank','_blank');
    const form=new FormData(e.currentTarget), t=totals();
    const items=cart.map(i=>{const p=productById(i.id);return {id:i.id,name:p?.name||'Item',size:i.size,color:i.color,qty:i.qty,price:Number(p?.price)||0};});
    const order={id:'DL-'+Date.now().toString().slice(-7),createdAt:new Date().toISOString(),status:'Order request received',paymentStatus:'No online payment',customer:{firstName:form.get('firstName'),lastName:form.get('lastName'),email:form.get('email'),phone:form.get('phone')},address:{address:form.get('address'),city:form.get('city'),postal:form.get('postal')},delivery:form.get('delivery'),items,subtotal:t.subtotal,discount:t.discount,shipping:t.shipping,total:t.total,note:form.get('note')};
    const itemLines=items.map(i=>`${i.name} | ${i.size} | ${i.color||'—'} | Qty ${i.qty} | ${money(i.price*i.qty)}`).join('\n');
    const addressLine=[order.address.address,order.address.city,order.address.postal].filter(Boolean).join(', ');
    const waText=`NEW DELEGACY ORDER REQUEST\nOrder: ${order.id}\nCustomer: ${order.customer.firstName} ${order.customer.lastName}\nEmail: ${order.customer.email}\nPhone: ${order.customer.phone}\nItems:\n${itemLines}\nDelivery: ${order.delivery}\nAddress: ${addressLine}\nTotal: ${money(order.total)}\nNote: ${order.note||'—'}\nPlease contact the customer to confirm availability and payment.`;
    try{
      await DLStore.submitOrder(order);
      state.orders.unshift(order);state.customers=state.customers||[];
      if(!state.customers.some(c=>String(c.email).toLowerCase()===String(order.customer.email).toLowerCase()))state.customers.push({...order.customer,createdAt:order.createdAt});
      await DLStore.save(state);
      let emailSent=false;
      const emailParams={to_email:DLStore.adminEmail(),order_id:order.id,customer_name:`${order.customer.firstName} ${order.customer.lastName}`,customer_email:order.customer.email,customer_phone:order.customer.phone,order_items:itemLines,order_total:money(order.total),delivery_method:order.delivery,delivery_address:addressLine,order_note:order.note||'—',reply_to:order.customer.email};
      try{if(window.emailjs){await emailjs.send('service_fbpij89','template_0spatoi',emailParams);emailSent=true;}}catch(emailError){console.error('Order email could not be sent:',emailError);}
      if(waWindow)waWindow.location.href='https://wa.me/27714767516?text='+encodeURIComponent(waText);
      cart=[];saveCart();renderProducts();
      $('checkoutContent').innerHTML=`<div class="success-view"><span class="checkmark">✓</span><p class="eyebrow dark-eyebrow" style="justify-content:center">ORDER REQUEST SENT</p><h2>Thank you.</h2><p class="subtext">Your request <b>${esc(order.id)}</b> has been saved. ${emailSent?'The admin email notification was sent.':'The order is saved, but the admin email notification could not be sent.'} WhatsApp will open with the order details ready to send. Our team will confirm availability and payment with you.</p><button class="button button-dark" id="doneCheckout">Back to the collection</button></div>`;
      $('doneCheckout').addEventListener('click',closeModals);
    }catch(err){if(waWindow)waWindow.close();console.error('Order request failed:',err);toast(err.message||'Your order could not be submitted. Please try again.');}
  }
  async function openAccount(){try{state=await DLStore.load();}catch(e){}renderAccount();openDrawer('accountDrawer');}
  function renderAccount(){const host=$('accountContent');if(currentUser){const orders=state.orders.filter(o=>o.customer?.email?.toLowerCase()===currentUser.email.toLowerCase());host.innerHTML=`<div><p>You're signed in as <b>${esc(currentUser.email)}</b>.</p><button class="text-btn" id="logoutBtn">Sign out</button><div class="account-orders"><h3 style="font:25px var(--serif)">Your orders</h3>${orders.length?orders.map(o=>`<div class="account-order"><b>${esc(o.id)} · ${money(o.total)}</b><span>${new Date(o.createdAt).toLocaleDateString()} · ${esc(o.status)}</span></div>`).join(''):'<p>No orders yet. Your next favourite might be waiting in the collection.</p>'}</div></div>`;$('logoutBtn').addEventListener('click',()=>{currentUser=null;localStorage.removeItem('dl-user');DLStore.signOut().catch(()=>{});renderAccount();toast('Signed out.');});return;}
    if(draftAccount){host.innerHTML=`<p>Create your DL account to keep your order history together on this browser.</p><form id="registerForm" class="stack-form"><label>First name<input name="firstName" required></label><label>Last name<input name="lastName" required></label><label>Email<input type="email" name="email" required></label><label>Password<input type="password" name="password" required minlength="6"></label><button type="submit" class="button button-dark full-btn">Create account</button></form><button class="text-btn" id="backLogin">Back to sign in</button>`;$('registerForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{if(DLStore.cloudEnabled()){await DLStore.register(f.get('email'),f.get('password'));state=await DLStore.load();}currentUser={firstName:f.get('firstName'),lastName:f.get('lastName'),email:f.get('email')};localStorage.setItem('dl-user',JSON.stringify(currentUser));draftAccount=false;renderAccount();toast(DLStore.cloudEnabled()?'Account created.':'Account created on this browser.');}catch(err){toast(err.message||'Account creation failed.');}});$('backLogin').addEventListener('click',()=>{draftAccount=false;renderAccount();});return;}
    host.innerHTML=`<p>Sign in to view your orders and keep your favourite pieces close.</p><form id="loginForm" class="stack-form"><label>Email<input type="email" id="loginEmail" required></label><label>Password<input type="password" id="loginPassword" required minlength="6"></label><button class="button button-dark full-btn" type="submit">Sign in</button></form><button type="button" class="text-btn" id="forgotPassword">Forgot password?</button><p class="or-line">NEW TO DELEGACY?</p><button class="outline-btn full-btn" id="showRegister">Create an account</button>`;$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('loginEmail').value.trim();try{if(DLStore.cloudEnabled()){await DLStore.signIn(email,$('loginPassword').value);state=await DLStore.load();}currentUser={email,firstName:email.split('@')[0]};localStorage.setItem('dl-user',JSON.stringify(currentUser));renderAccount();toast(DLStore.cloudEnabled()?'Signed in.':'Signed in on this browser.');}catch(err){toast(err.message||'Sign in failed.');}});$('forgotPassword').addEventListener('click',async()=>{const email=$('loginEmail').value.trim();if(!email){toast('Enter your email address first.');return;}try{await DLStore.resetPassword(email);toast('Password reset email sent.');}catch(err){toast(err.message||'Password reset unavailable.');}});$('showRegister').addEventListener('click',()=>{draftAccount=true;renderAccount();});
  }
  function showInfo(type){const content={privacy:['Privacy policy','This store uses browser storage for the shopping bag and preferences. Order requests are stored in the connected store database and customer contact details are used to respond to the request. No online payment details are collected. Publish a complete privacy policy covering the services and data processing used by the business.'],terms:['Terms of service','Orders submitted through this website are requests only. The DeLEGACY team must confirm product availability, final delivery arrangements and payment directly with the customer. Add the final business details, governing law, delivery and consumer terms before launch.'],returns:['Returns & exchanges','Add your confirmed return window, product condition requirements, exchange process, return shipping rules and refund timing here before launch. Refunds and exchanges are handled directly by the DeLEGACY team under its published returns policy.'],faq:['Frequently asked questions','How do I choose my size? Use the size guide as an illustration and check the final garment measurements.\n\nHow long does delivery take? Delivery options and charges are confirmed by the DeLEGACY team after an order request.\n\nCan I return an item? Publish your confirmed returns policy before taking live orders.\n\nHow do I contact DeLEGACY? Use the contact address shown in the footer.']};const [title,text]=content[type]||content.faq;$('infoContent').innerHTML=`<p class="eyebrow dark-eyebrow">DELEGACY / INFORMATION</p><h2>${esc(title)}</h2><p style="white-space:pre-line;line-height:1.9;color:#666;font-size:12px">${esc(text)}</p>`;openModal('infoModal');}
  function updateSuggestions(){const q=$('siteSearch').value.trim().toLowerCase();const host=$('searchSuggestions');if(!q){host.innerHTML='<div class="suggestion"><span style="font-size:10px;padding:6px;color:#777">Popular: vests · tees</span></div>';return;}const matches=products().filter(p=>(p.name+' '+p.category+' '+p.subcategory).toLowerCase().includes(q)).slice(0,5);host.innerHTML=matches.map(p=>`<a class="suggestion" href="#/product/${encodeURIComponent(p.id)}" data-suggest="${esc(p.id)}"><img src="${esc(DLStore.imageUrl(p.image))}" alt=""><span><b>${esc(p.name)}</b><br><small>${money(p.price)}</small></span></a>`).join('')||'<div class="suggestion"><small>No suggestions found.</small></div>';}

  document.addEventListener('click',e=>{
    const wish=e.target.closest('[data-wish]');if(wish){e.preventDefault();toggleWish(wish.dataset.wish);return;}
    const open=e.target.closest('[data-open]');if(open){closeDrawers();location.hash='#/product/'+encodeURIComponent(open.dataset.open);return;}
    const sc=e.target.closest('[data-scroll]');if(sc){$('mainNav').classList.remove('open');if(location.hash==='#'+sc.dataset.scroll)showHome(location.hash);return;}
    const close=e.target.closest('[data-close]');if(close){closeDrawers();return;}
    if(e.target.matches('[data-modal-close]')||e.target.closest('[data-modal-close]')){closeModals();return;}
    const rm=e.target.closest('[data-remove]');if(rm){cart=cart.filter(x=>x.key!==rm.dataset.remove);saveCart();return;}
    const qty=e.target.closest('[data-qty]');if(qty){const item=cart.find(x=>x.key===qty.dataset.qty);if(item){const direction=Number(qty.dataset.change);const p=productById(item.id);item.qty+=direction;if(item.qty<1)cart=cart.filter(x=>x!==item);saveCart();}return;}
    const suggest=e.target.closest('[data-suggest]');if(suggest){closeSearch();return;}
    const pol=e.target.closest('[data-policy-open]');if(pol){showInfo(pol.dataset.policyOpen);return;}
    if(!$('productPage').hidden){
      const thumb=e.target.closest('[data-pdp-img]');if(thumb){pdpGo(Number(thumb.dataset.pdpImg));return;}
      const step=e.target.closest('[data-pdp-step]');if(step){pdpGo(pdp.img+Number(step.dataset.pdpStep));return;}
      const size=e.target.closest('[data-size]');if(size){pdp.size=size.dataset.size;const sy=window.scrollY;renderProductPage();window.scrollTo({top:sy,behavior:'instant'});return;}
      const color=e.target.closest('[data-color]');if(color){pdp.color=color.dataset.color;const sy=window.scrollY;renderProductPage();window.scrollTo({top:sy,behavior:'instant'});return;}
      if(e.target.closest('#pdpAdd,#pdpAddSticky')){pdpAdd();return;}
      if(e.target.closest('#pdpWish')){toggleWish(pdp.id);return;}
      if(e.target.closest('#openSizeGuide,#openSizeGuide2')){openModal('sizeGuideModal');return;}
    }
  });
  function closeSearch(){ $('searchPanel').hidden=true; }
  $('resetShop').addEventListener('click',()=>{searchTerm='';$('siteSearch').value='';renderProducts();});
  $('searchToggle').addEventListener('click',()=>{$('searchPanel').hidden=!$('searchPanel').hidden;if(!$('searchPanel').hidden){$('siteSearch').focus();updateSuggestions();}});
  $('closeSearch').addEventListener('click',closeSearch);$('siteSearch').addEventListener('input',()=>{searchTerm=$('siteSearch').value.trim();updateSuggestions();renderProducts();});$('mobileMenuBtn').addEventListener('click',()=>$('mainNav').classList.toggle('open'));
  $('cartBtn').addEventListener('click',()=>{renderCart();openDrawer('cartDrawer')});$('wishlistBtn').addEventListener('click',()=>{renderWishlist();openDrawer('wishlistDrawer')});$('accountBtn').addEventListener('click',openAccount);$('overlay').addEventListener('click',closeDrawers);
  $('checkoutBtn').addEventListener('click',checkout);
  $('newsletterForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('newsletterEmail').value.trim();state.newsletter=state.newsletter||[];if(!state.newsletter.includes(email))state.newsletter.push(email);try{await DLStore.submitNewsletter(email);}catch(err){console.warn('Newsletter cloud save unavailable:',err);}await DLStore.save(state);$('newsletterMessage').textContent='You are on the list. Thanks for joining the movement.';e.target.reset();});
  document.querySelectorAll('[data-policy]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showInfo(a.dataset.policy);}));document.querySelectorAll('a[href="#faq"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showInfo('faq');}));
  $('cookieAccept').addEventListener('click',()=>{localStorage.setItem('dl-cookie-ok','1');$('cookieBanner').classList.add('hidden');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawers();closeModals();closeSearch();}});
  document.addEventListener('keydown',e=>{if($('productPage').hidden||pdp.id===null)return;if(e.key==='ArrowRight')pdpGo(pdp.img+1);if(e.key==='ArrowLeft')pdpGo(pdp.img-1);});
  (()=>{let x=null;document.addEventListener('touchstart',e=>{x=e.target.closest('#pdpStage')?e.touches[0].clientX:null;},{passive:true});document.addEventListener('touchend',e=>{if(x===null)return;const dx=e.changedTouches[0].clientX-x;x=null;if(Math.abs(dx)>45)pdpGo(pdp.img+(dx<0?1:-1));});})();
  function startReveal(){const els=document.querySelectorAll('.reveal');if(!('IntersectionObserver'in window)){els.forEach(x=>x.classList.add('visible'));return;}const obs=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('visible');obs.unobserve(en.target);}}),{threshold:.08});els.forEach(el=>obs.observe(el));}
  function cleanStored(){const ids=new Set((state.products||[]).map(p=>p.id));const c=cart.filter(i=>ids.has(i.id));if(c.length!==cart.length){cart=c;localStorage.setItem('dl-cart',JSON.stringify(cart));}const w=wishlist.filter(id=>ids.has(id));if(w.length!==wishlist.length){wishlist=w;localStorage.setItem('dl-wishlist',JSON.stringify(wishlist));}}
  function refreshAll(){renderContent();renderProducts();renderCart();renderWishlist();if(pdp.id){if(productById(pdp.id))renderProductPage();else route();}}
  async function init(){state=await DLStore.load();cleanStored();renderContent();renderProducts();renderCart();renderWishlist();if(localStorage.getItem('dl-cookie-ok'))$('cookieBanner').classList.add('hidden');startReveal();window.addEventListener('hashchange',route);route();window.addEventListener('dl-store-updated',async()=>{state=await DLStore.load();cleanStored();refreshAll();});}
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol))navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  init().catch(err=>{console.error(err);toast('Store data could not load. Refresh the page.');});
})();
