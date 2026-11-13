/* Shared browser data layer. Uses IndexedDB so uploaded product photos are not squeezed into localStorage. */
(function () {
  const DB_NAME = 'dl-legacy-store';
  const STORE = 'records';
  const KEY = 'store-state';
  const P = './';
  const seedProducts = [
    {id:'dl-mens-vest',name:"DL Men's Vest",category:'Vests',subcategory:"Men's",brand:'DeLEGACY',price:300,compareAt:0,material:'Performance blend',fit:'Regular',occasion:'Training',
      description:"A lightweight vest built for training days and easy everyday wear. Clean black with the DE LEGACY mark on the chest and the DL mark across the back.",
      care:'Wash cold, inside out. Do not iron directly on the print. Line dry.',modelInfo:'',
      sizes:['S','M','L','XL','XXL'],colors:['Black'],stock:{S:0,M:0,L:0,XL:0,XXL:0},
      image:P+'vest-men-front.jpg',gallery:[P+'vest-men-front.jpg',P+'vest-men-back.jpg',P+'vests-lineup.png'],
      rating:0,reviews:0,featured:true,published:true,placeholder:false,createdAt:Date.now()-300000},
    {id:'dl-womens-vest',name:"DL Women's Vest",category:'Vests',subcategory:"Women's",brand:'DeLEGACY',price:300,compareAt:0,material:'Performance blend',fit:'Fitted',occasion:'Training',
      description:"A racerback vest cut for movement. Clean black with the DE LEGACY mark on the chest and the DL mark between the shoulder blades.",
      care:'Wash cold, inside out. Do not iron directly on the print. Line dry.',modelInfo:'',
      sizes:['XS','S','M','L','XL'],colors:['Black'],stock:{XS:0,S:0,M:0,L:0,XL:0},
      image:P+'vest-women-front.jpg',gallery:[P+'vest-women-front.jpg',P+'vest-women-back.jpg',P+'vests-lineup.png'],
      rating:0,reviews:0,featured:true,published:true,placeholder:false,createdAt:Date.now()-200000},
    {id:'dl-tee',name:'DL Tee',category:'Tees',subcategory:'Unisex',brand:'DeLEGACY',price:300,compareAt:0,material:'Cotton blend',fit:'Regular',occasion:'Everyday',
      description:'The DL tee. Black, with the DE LEGACY mark on the chest and the slanted DL mark with its blue and pink bars across the back.',
      care:'Wash inside out with similar colours. Do not iron directly on the print.',modelInfo:'Shown on our brand ambassador.',
      sizes:['XS','S','M','L','XL','XXL'],colors:['Black'],stock:{XS:0,S:0,M:0,L:0,XL:0,XXL:0},
      image:P+'tee-back-stock.png',gallery:[P+'tee-back-stock.png',P+'tee-front-detail.jpg',P+'ambassador-walk.png',P+'ambassador-run.jpg',P+'tee-back-worn.jpg'],
      rating:0,reviews:0,featured:true,published:true,placeholder:false,createdAt:Date.now()-100000}
  ];
  const CATALOG_VERSION = 3;
  const defaults = {
    catalogVersion: CATALOG_VERSION,
    products: seedProducts,
    orders: [],
    customers: [],
    promoCodes: [{code:'WELCOME10',type:'percent',value:10,active:true}],
    content: {
      brandName:'DELEGACY', announcement:'LOCAL ROOTS. MODERN MINDS. BIGGER DREAMS.',
      heroEyebrow:'THE DELEGACY COLLECTION', heroTitle:'Move with purpose.',
      heroText:'Built for the everyday journey. Discover the pieces that carry the DL spirit.',
      heroButton:'Shop the collection', storyTitle:'More than what you wear.',
      storyText:'DeLEGACY is about the journey, the community and the confidence to keep moving. Local roots. Modern minds. Bigger dreams.',
      contactEmail:'hello@delegacystore.co.za', whatsapp:'27714767516', instagram:'https://www.instagram.com/',
      shippingNote:'Complimentary delivery on orders over R1,000.', currency:'ZAR',
      footerNote:'Local roots. Modern minds. Bigger dreams.'
    }
  };
  let firebaseApp=null, firebaseAuth=null, firestore=null, storage=null, cloudListener=null, orderListener=null, newsletterListener=null;
  function cloudConfigured(){ const c=window.DL_FIREBASE_CONFIG||{}; return !!(c.apiKey&&c.authDomain&&c.projectId&&c.appId&&window.firebase); }
  function initCloud(){
    if(!cloudConfigured()) return false;
    if(!firebaseApp){
      firebaseApp=window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(window.DL_FIREBASE_CONFIG);
      firebaseAuth=window.firebase.auth(); firestore=window.firebase.firestore(); storage=window.firebase.storage();
      firebaseAuth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
    }
    return true;
  }
  function openDB(){ return new Promise((resolve,reject)=>{ const req=indexedDB.open(DB_NAME,1); req.onupgradeneeded=()=>req.result.createObjectStore(STORE); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
  async function getRaw(){
    try { const db=await openDB(); return await new Promise((resolve,reject)=>{ const tx=db.transaction(STORE,'readonly'); const r=tx.objectStore(STORE).get(KEY); r.onsuccess=()=>resolve(r.result||null); r.onerror=()=>reject(r.error); }); }
    catch(e){ try { return JSON.parse(localStorage.getItem('dl-store-state')||'null'); } catch(_){ return null; } }
  }
  async function setRaw(value){
    try { const db=await openDB(); await new Promise((resolve,reject)=>{ const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).put(value,KEY); tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error); }); }
    catch(e){ localStorage.setItem('dl-store-state',JSON.stringify(value)); }
  }
  async function load(){
    let state=null;
    if(initCloud()){
      try{ const snap=await firestore.collection('storefront').doc('main').get(); if(snap.exists&&snap.data().state) state=snap.data().state; }catch(err){ console.warn('Firebase storefront read unavailable; using this browser cache.',err); }
    }
    if(!state) state=await getRaw();
    if(!state) state=structuredClone(defaults);
    if((state.catalogVersion||0)<CATALOG_VERSION){ state.products=structuredClone(seedProducts); state.catalogVersion=CATALOG_VERSION; }
    state.content=state.content||structuredClone(defaults.content); if(!state.content.whatsapp)state.content.whatsapp='27714767516';
    if(initCloud()&&firebaseAuth?.currentUser){
      try{
        let ordersQuery=firestore.collection('orders');
        if(firebaseAuth.currentUser.email?.toLowerCase()===(window.DL_ADMIN_EMAIL||'').toLowerCase()) ordersQuery=ordersQuery.orderBy('createdAt','desc');
        else ordersQuery=ordersQuery.where('customer.email','==',firebaseAuth.currentUser.email);
        const ordersSnap=await ordersQuery.get();state.orders=ordersSnap.docs.map(d=>d.data());
        if(firebaseAuth.currentUser.email?.toLowerCase()===(window.DL_ADMIN_EMAIL||'').toLowerCase()){const nl=await firestore.collection('newsletter').orderBy('createdAt','desc').get();state.newsletter=nl.docs.map(d=>({email:d.data().email,createdAt:d.data().createdAt?.toDate?.().toISOString()||''}));}
      }catch(err){console.warn('Orders collection unavailable; showing local orders.',err);}
    }
    await setRaw(state);
    if(initCloud()&&!cloudListener){
      try{cloudListener=firestore.collection('storefront').doc('main').onSnapshot(snap=>{if(snap.exists&&snap.data().state){setRaw(snap.data().state).then(()=>window.dispatchEvent(new CustomEvent('dl-store-updated')));}});}catch(err){console.warn('Live catalogue updates unavailable.',err);}
    }
    if(initCloud()&&firebaseAuth?.currentUser&&firebaseAuth.currentUser.email?.toLowerCase()===(window.DL_ADMIN_EMAIL||'').toLowerCase()){
      if(!orderListener){orderListener=firestore.collection('orders').orderBy('createdAt','desc').onSnapshot(async snap=>{const cached=await getRaw()||structuredClone(defaults);cached.orders=snap.docs.map(d=>d.data());await setRaw(cached);window.dispatchEvent(new CustomEvent('dl-store-updated'));},err=>console.warn('Live order updates unavailable.',err));}
      if(!newsletterListener){newsletterListener=firestore.collection('newsletter').orderBy('createdAt','desc').onSnapshot(async snap=>{const cached=await getRaw()||structuredClone(defaults);cached.newsletter=snap.docs.map(d=>({email:d.data().email,createdAt:d.data().createdAt?.toDate?.().toISOString()||''}));await setRaw(cached);window.dispatchEvent(new CustomEvent('dl-store-updated'));},err=>console.warn('Live newsletter updates unavailable.',err));}
    }
    return state;
  }
  async function save(state){
    await setRaw(state);
    if(initCloud()&&firebaseAuth?.currentUser&&firebaseAuth.currentUser.email?.toLowerCase()===(window.DL_ADMIN_EMAIL||'').toLowerCase()){
      const publicState={...state,orders:[],customers:[],newsletter:[]};
      await firestore.collection('storefront').doc('main').set({state:publicState,updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()});
    }
    window.dispatchEvent(new CustomEvent('dl-store-updated')); return state;
  }
  async function uploadImage(file){
    if(!file) return '';
    if(file.size>8*1024*1024) throw new Error('Please choose an image smaller than 8 MB.');
    if(initCloud()&&firebaseAuth?.currentUser&&firebaseAuth.currentUser.email?.toLowerCase()===(window.DL_ADMIN_EMAIL||'').toLowerCase()){
      const safe=file.name.replace(/[^a-z0-9._-]/gi,'-'); const path=`products/${Date.now()}-${safe}`; const ref=storage.ref().child(path); await ref.put(file,{contentType:file.type||'image/jpeg'}); return await ref.getDownloadURL();
    }
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
  }
  async function deleteImage(url){
    if(!url||!url.includes('firebasestorage.googleapis.com')||!initCloud()||!firebaseAuth?.currentUser)return;
    try{await storage.refFromURL(url).delete();}catch(err){console.warn('Could not remove stored image:',err);}
  }
  async function signIn(email,password){ if(!initCloud()) return null; const result=await firebaseAuth.signInWithEmailAndPassword(email,password); return result.user; }
  async function register(email,password){ if(!initCloud()) return null; const result=await firebaseAuth.createUserWithEmailAndPassword(email,password); return result.user; }
  async function signOut(){ if(initCloud()&&firebaseAuth){if(orderListener){orderListener();orderListener=null;}if(newsletterListener){newsletterListener();newsletterListener=null;}await firebaseAuth.signOut();} }
  async function resetPassword(email){if(!initCloud())throw new Error('Password reset is available after Firebase is configured.');return firebaseAuth.sendPasswordResetEmail(email);}
  async function submitOrder(order){if(initCloud()){await firestore.collection('orders').doc(order.id).set(order);return true;}return false;}
  async function updateOrder(order){if(initCloud()&&firebaseAuth?.currentUser&&firebaseAuth.currentUser.email?.toLowerCase()===(window.DL_ADMIN_EMAIL||'').toLowerCase()){await firestore.collection('orders').doc(order.id).set(order,{merge:true});return true;}return false;}
  async function submitNewsletter(email){if(initCloud()){await firestore.collection('newsletter').add({email,createdAt:window.firebase.firestore.FieldValue.serverTimestamp()});return true;}return false;}
  function cloudEnabled(){ return initCloud(); }
  function adminEmail(){return window.DL_ADMIN_EMAIL||'tltech353@gmail.com';}
  function money(value){ return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(Number(value)||0); }
  function escape(value=''){ return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function imageUrl(value){ return value || './tee-back-stock.png'; }
  window.DLStore={defaults,load,save,money,escape,imageUrl,uploadImage,deleteImage,signIn,register,signOut,resetPassword,submitOrder,updateOrder,submitNewsletter,cloudEnabled,adminEmail};
})();
