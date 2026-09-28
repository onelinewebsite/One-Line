(function(){
  "use strict";
  const S=window.OneLineStore,B=window.OneLineBackend,I=S.icon,root=document.getElementById('app');
  const clone=v=>typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v));
  const state={
    screen:'home',products:S.getProducts(),categories:S.getCategories(),customCatalogCategories:S.getCustomCatalogCategories?.()||[],customCatalogItems:S.getCustomCatalogItems?.()||[],customCategoryId:'',customItemId:'',enquiryBusyId:'',enquirySuccessId:'',cart:[],orders:[],settings:S.getSettings(),
    filterCategories:[],filterSubs:[],filterOptions:[],filterOpen:false,filterDraft:null,selected:null,previewImage:'',color:'',size:'',subItem:false,subColor:'',subSize:'',menu:false,
    bulkQty:{},subBulkQty:{},selectedSubitems:{},
    teamType:'Sportswear',teamArtwork:'',teamFileName:'',teamRows:[{name:'',number:'',size:'M'}],pendingCustomItem:null,
    authModal:false,authStep:'phone',authPhone:'',authOtp:'',authName:'',authBusy:false,authError:'',pendingAction:'',customer:B?.customerSession?.()||null,
    backendReady:false,backendError:'',catalogQuery:'',profileEditing:false,accountLoaded:false,accountSyncing:false,cartVersion:0,cartUpdatedAt:'',ordersStamp:'',profileUpdatedAt:'',
    toast:'',legal:'',checkoutStep:1,details:{name:'',phone:'',address:'',business:''},delivery:'Courier',payment:'Cash on delivery',paymentDemo:false,
    orderPlaced:false,orderReference:'',installPrompt:null,zoomImage:'',zoomAlt:'',zoomImages:[],zoomIndex:0,zoomScale:1,zoomX:0,zoomY:0,b2bAuthed:sessionStorage.getItem('one-line-b2b-auth')==='1',b2bError:''
  };
  const filterKey='one-line-catalog-filters-v1';
  try{const saved=JSON.parse(localStorage.getItem(filterKey)||'null');if(saved){state.filterCategories=Array.isArray(saved.categories)?saved.categories:[];state.filterSubs=Array.isArray(saved.subs)?saved.subs:[];state.filterOptions=Array.isArray(saved.options)?saved.options:[];}}catch(_){}
  const legalCopy={
    'About':[
      'OneLine is a custom apparel and bulk garment ordering platform for T-shirts, polos, sportswear, uniforms and ready-made products. Customers can create a design in the browser, upload a finished team jersey design, or order catalogue products in multiple sizes.',
      'Catalogue products, linked subitems and available stock are managed from the OneLine admin system. Empty categories stay hidden until an active product is available.',
      'For team orders, customers can upload one approved design and submit each member’s name, number and size as separate rows.'
    ],
    'Terms & Conditions':[
      'Please verify garment type, colour, size quantities, names, numbers, artwork and print placement before confirming an order. Production follows the submitted order details and approved artwork.',
      'Stock is checked again when an order is submitted. An item or size shown earlier may become unavailable if stock changes before final confirmation.',
      'Customized, printed, embroidered or team-personalized goods are made specifically for the customer and normally cannot be cancelled or returned after production has started, except where the delivered goods are defective or materially different from the confirmed order.',
      'Images and screen colours are references. Small differences in fabric shade, print colour, placement or production batches can occur.',
      'Customers must have permission to use any logo, artwork, name, photograph or trademark they upload for printing.'
    ],
    'Privacy Policy':[
      'OneLine asks for a mobile number only when a customer tries to add an item or design to cart. OTP verification is used to confirm the phone number before ordering.',
      'We store the details needed to manage the order, such as verified phone number, customer name, delivery information, selected products, size quantities and submitted design data.',
      'Uploaded artwork is used for the requested customization and order handling. Account and order information is not intended to be sold as marketing data.',
      'Administrative access is separated by role for admin, management, staff and order-receiving workflows.'
    ],
    'Shipping & Returns':[
      'Available delivery methods are shown during checkout. Delivery timing depends on stock, customization work, order quantity and the selected delivery method.',
      'Bulk and customized orders may require production time before dispatch. Any delivery charge or special transport arrangement is confirmed with the order.',
      'For a manufacturing defect or an item materially different from the confirmed order, contact OneLine with the order reference and supporting photos so the issue can be reviewed.',
      'Because personalized products are produced to the submitted design and size quantities, change-of-mind returns are generally not available after production begins.'
    ]
  };
  const WHATSAPP_LOGO='https://upload.wikimedia.org/wikipedia/commons/4/4c/WhatsApp_Logo_green.svg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original';
  const whatsappLogo=()=>'<img class="whatsapp-logo" src="'+WHATSAPP_LOGO+'" alt="" aria-hidden="true">';

  const totalQty=()=>state.cart.reduce((n,x)=>n+(Array.isArray(x.bulkLines)?x.bulkLines.reduce((a,l)=>a+Number(l.qty||0),0)+(x.subitems||[]).reduce((a,si)=>a+(si.lines||[]).reduce((b,l)=>b+Number(l.qty||0),0),0):Number(x.qty||0)),0);
  const subtotal=()=>state.cart.reduce((n,x)=>n+(x.total!=null?Number(x.total||0):Number(x.price||0)*Number(x.qty||0)),0);
  const retailProducts=()=>state.products.filter(p=>(p.audience||'retail')!=='b2b');
  const b2bProducts=()=>state.products.filter(p=>p.audience==='b2b');
  const img=(src,alt,cls,fallback)=>'<img src="'+S.esc(src||fallback||'assets/product-placeholder.svg')+'" alt="'+S.esc(alt||'')+'" class="'+S.esc(cls||'')+'" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\''+S.esc(fallback||'assets/product-placeholder.svg')+'\'">';
  function logo(compact){return '<div class="brand" aria-label="One-Line"><img class="brand-mark" src="one-line-logo.webp" alt="">'+(compact?'':'<span class="brand-copy"><b>One-Line</b><small>CUSTOM APPAREL STUDIO</small></span>')+'</div>';}
  const QUARTZ_SITE='https://quartzsolution.netlify.app/';
  function developerCredit(extraClass){return '<div class="developer-credit '+S.esc(extraClass||'')+'">Developed by <a href="'+QUARTZ_SITE+'" target="_blank" rel="noopener noreferrer">Quartz Web Solutions</a></div>';}
  function clearMenuModalState(){if(!state.menu)return;try{if(history.state?.oneLineModal==='menu'){const next={...(history.state||{})};delete next.oneLineModal;history.replaceState(next,'',location.href);}}catch(_){}state.menu=false;root.querySelector('.site-header nav.open')?.classList.remove('open');root.querySelector('.menu-scrim')?.remove();syncModalScrollLock();}
  function showToast(text){state.toast=text;render();setTimeout(()=>{if(state.toast===text){state.toast='';render();}},2200);}
  function rememberScroll(){
    try{if(history.state?.oneLine)history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);}catch(_){}
  }
  function go(screen,options){
    options=options||{};
    if(state.menu&&history.state?.oneLineModal==='menu'){try{const next={...(history.state||{})};delete next.oneLineModal;history.replaceState(next,'',location.href);}catch(_){}}
    state.menu=false;state.filterOpen=false;state.filterDraft=null;
    if(screen===state.screen&&!options.force){window.scrollTo(0,0);render();return;}
    rememberScroll();state.screen=screen;
    if(!options.fromHistory){try{history.pushState({oneLine:true,oneLineGuard:true,screen,scrollY:0},'',location.pathname+location.search+'#'+screen);}catch(_){}}
    window.scrollTo(0,0);render();
  }
  function navigateBack(fallback){
    if(state.screen==='home'){window.scrollTo(0,0);return;}
    if(history.state?.oneLine){history.back();return;}
    go(fallback||'home');
  }
  let cartMutationQueue=Promise.resolve(),cartMutationsPending=0,cartSyncError='',accountPollBusy=false,accountChannel=null;
  try{if('BroadcastChannel' in window){accountChannel=new BroadcastChannel('one-line-account-v41');accountChannel.onmessage=()=>pollCustomerAccount(true);}}catch(_){}
  function broadcastAccountSync(reason){try{accountChannel?.postMessage({reason:reason||'update',at:Date.now()});}catch(_){}}
  function ensureCartKey(item){if(!item.key)item.key=(item.itemType||'item')+'-'+(crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2));return String(item.key);}
  function applyServerCart(cart){
    const items=Array.isArray(cart?.items)?cart.items:[];
    state.cart=items.map(raw=>{const item=clone(raw);ensureCartKey(item);return item;});
    state.cartVersion=Number(cart?.version||0);state.cartUpdatedAt=String(cart?.updatedAt||'');
  }
  function mapServerOrders(rows){return (rows||[]).map(o=>({id:o.order_code||o.id,customer:o.customer_name||'',phone:o.phone||'',total:Number(o.total||0),items:(o.order_items||[]).reduce((n,x)=>n+Number(x.qty||0),0),delivery:o.delivery||'',payment:o.payment||'',status:o.status||'Confirmed',time:o.created_at?new Date(o.created_at).toLocaleString():'',address:o.address||'',orderItems:(o.order_items||[]).map(x=>({name:x.item_name||'Item',code:x.item_code||'',color:x.color||'',size:x.size||'',qty:Number(x.qty||0),price:Number(x.unit_price||0),itemType:x.item_type||'product',custom:x.item_type!=='product'&&x.item_type!=='subitem',customDesign:x.item_type==='custom_design'?(x.design_json||null):null,image:x.design_json?.artworkUrl||''}))}));}
  const orderMetaStamp=meta=>String(meta?.count||0)+'|'+String(meta?.updatedAt||'');
  function applyServerCustomer(customer){
    if(!customer)return false;const before=JSON.stringify([state.customer?.name||'',state.customer?.businessName||'',state.customer?.jobTitle||'',state.customer?.phone||'',state.profileUpdatedAt||'']);
    const sess=B?.customerSession?.()||{},next={...(state.customer||{}),...sess,customerId:customer.id||state.customer?.customerId||sess.customerId,phone:customer.phone||state.customer?.phone||sess.phone||'',name:customer.name||'',businessName:customer.businessName||'',jobTitle:customer.jobTitle||''};
    state.customer=next;state.profileUpdatedAt=String(customer.updatedAt||'');
    state.details.name=next.name||'';state.details.business=next.businessName||'';state.details.phone=next.phone||'';
    return before!==JSON.stringify([next.name||'',next.businessName||'',next.jobTitle||'',next.phone||'',state.profileUpdatedAt||'']);
  }
  async function refreshCustomerAccount(renderAfter=false){
    const current={...(state.customer||{}),...(B?.customerSession?.()||{})};if(!current?.token)return null;
    try{
      const data=await B.customerAccount();if(!data?.customer)return null;
      applyServerCustomer(data.customer);applyServerCart(data.cart||null);state.orders=mapServerOrders(data.orders||[]);state.ordersStamp=orderMetaStamp(data.ordersMeta||{count:(data.orders||[]).length,updatedAt:(data.orders||[]).reduce((m,o)=>String(o.updated_at||'')>m?String(o.updated_at||''):m,'')});state.accountLoaded=true;
      if(renderAfter)render();return data;
    }catch(err){if(/session expired/i.test(String(err?.message||''))){B?.clearCustomerSession?.();state.customer=null;state.cart=[];state.orders=[];state.accountLoaded=false;}return null;}
  }
  function queueCartMutation(operation,itemKey,item){
    const key=String(itemKey||item?.key||'');cartMutationsPending++;
    cartMutationQueue=cartMutationQueue.then(async()=>{
      const result=await B.mutateCustomerCart(operation,key,item?clone(item):null);cartSyncError='';if(result?.cart)applyServerCart(result.cart);broadcastAccountSync('cart');
      if(state.screen==='cart'||state.screen==='profile')render();return result;
    }).catch(async err=>{cartSyncError=err?.message||'Could not sync cart';showToast(cartSyncError);await refreshCustomerAccount(true);return null;}).finally(()=>{cartMutationsPending=Math.max(0,cartMutationsPending-1);});
    return cartMutationQueue;
  }
  async function pollCustomerAccount(force=false){
    if(accountPollBusy||cartMutationsPending>0||document.hidden)return;const sess=B?.customerSession?.();if(!sess?.token)return;accountPollBusy=true;
    try{
      const data=await B.customerSync();if(!data?.customer)return;const profileChanged=applyServerCustomer(data.customer);
      const remoteCartVersion=Number(data.cart?.version||0),remoteOrderStamp=orderMetaStamp(data.ordersMeta);
      const needFull=remoteCartVersion!==Number(state.cartVersion||0)||remoteOrderStamp!==String(state.ordersStamp||'');
      if(needFull)await refreshCustomerAccount(false);else state.accountLoaded=true;
      if((force||profileChanged||needFull)&&state.screen!=='customize'&&!state.profileEditing&&!state.authBusy){if(state.screen==='checkout'&&state.checkoutStep===1){const form=root.querySelector('[data-checkout-form]');if(form){const fd=new FormData(form);state.details={...state.details,...Object.fromEntries(fd.entries())};}}render();}
    }catch(err){if(/session expired/i.test(String(err?.message||''))){B?.clearCustomerSession?.();state.customer=null;state.cart=[];state.orders=[];state.accountLoaded=false;render();}}finally{accountPollBusy=false;}
  }
  function addCart(item,navigate){
    ensureCartKey(item);state.cart.push(item);queueCartMutation('upsert',item.key,item);B?.customerEvent?.('cart_add',{item:{productId:item.productId||null,name:item.name,code:item.code||'',qty:item.qty||1,itemType:item.itemType||'product'}});if(navigate)go('cart');else showToast('Added to your cart');
  }
  function requireCustomer(action){
    const sess=B?.customerSession?.();if(sess?.token)state.customer={...(state.customer||{}),...sess};
    const verified=!!state.customer?.token,name=String(state.customer?.name||'').trim();
    if(verified&&state.accountLoaded&&name.length>=2)return true;
    if(verified&&!state.accountLoaded&&!state.accountSyncing){state.pendingAction=action||'';state.accountSyncing=true;refreshCustomerAccount(false).then(()=>{state.accountSyncing=false;const n=String(state.customer?.name||'').trim();if(n.length>=2)continuePendingAction();else{state.authModal=true;state.authStep='name';state.authName=n;render();}});return false;}
    state.pendingAction=action||'';state.authModal=true;state.authError='';
    if(verified){state.authStep='name';state.authName=name;}else{state.authStep='phone';state.authPhone='';state.authOtp='';state.authName='';}
    render();return false;
  }
  function closeAuth(){if(state.authBusy)return;state.authModal=false;state.authError='';state.pendingAction='';render();}
  function openMenu(){
    if(state.menu)return;state.menu=true;
    try{history.pushState({...(history.state||{}),oneLine:true,oneLineGuard:true,screen:state.screen,scrollY:window.scrollY,oneLineModal:'menu'},'',location.href);}catch(_){}
    render();
  }
  function closeMenu(fromHistory){
    if(!state.menu)return;
    if(!fromHistory&&history.state?.oneLineModal==='menu'){history.back();return;}
    state.menu=false;render();
  }
  function openLegal(name){state.legal=name;try{history.pushState({...(history.state||{}),oneLine:true,oneLineGuard:true,screen:state.screen,scrollY:window.scrollY,oneLineModal:'legal',legal:name},'',location.href);}catch(_){}render();}
  function closeLegal(fromHistory){state.legal='';if(!fromHistory&&history.state?.oneLineModal==='legal'){history.back();return;}render();}
  function productVariants(p){return Array.isArray(p?.variants)?p.variants.filter(v=>v.active!==false):[];}
  function selectedVariants(p){const rows=productVariants(p);if(!rows.length)return[];const hasColors=rows.some(v=>v.color);return hasColors&&state.color?rows.filter(v=>String(v.color||'')===String(state.color||'')):rows;}
  function variantKey(v){return String(v.id||((v.color||'')+'|'+(v.size||'')));}
  function selectedBulkLines(p){
    const rows=selectedVariants(p);if(rows.length)return rows.map(v=>({variantId:v.id||'',color:v.color||'',size:v.size||'',stock:Number(v.stock||0),unitPrice:Number(v.price??p.price??0),qty:Math.max(0,Number(state.bulkQty[variantKey(v)]||0))})).filter(x=>x.qty>0);
    const qty=Math.max(0,Number(state.bulkQty.simple||0));return qty?[{variantId:'',color:state.color||'',size:'',stock:Number(p.stock||0),unitPrice:Number(p.price||0),qty}]:[];
  }
  function subitemRows(si){return Array.isArray(si?.variants)?si.variants.filter(v=>v.active!==false):[];}
  function selectedSubitemLines(si){const map=state.subBulkQty[si.id]||{};return subitemRows(si).map(v=>({variantId:v.id||'',color:v.color||'',size:v.size||'',stock:Number(v.stock||0),unitPrice:Number(v.price??si.price??0),qty:Math.max(0,Number(map[variantKey(v)]||0))})).filter(x=>x.qty>0);}
  function bulkTotalQty(lines){return (lines||[]).reduce((n,x)=>n+Number(x.qty||0),0);}
  function bulkTotalPrice(lines){return (lines||[]).reduce((n,x)=>n+Number(x.qty||0)*Number(x.unitPrice||0),0);}
  function productSubitems(p){if(Array.isArray(p?.subItems))return p.subItems;return p?.subItem?[{...p.subItem,id:p.subItem.id||'legacy-subitem'}]:[];}
  function validateLines(lines,label){for(const line of lines){if(line.qty<1)continue;if(Number.isFinite(line.stock)&&line.qty>line.stock)throw new Error((label||'Item')+' only has '+line.stock+' available for '+(line.size||line.color||'this option')+'.');}}
  function addSelectedProductToCart(){
    const p=state.selected;if(!p)return;const lines=selectedBulkLines(p);if(!lines.length){showToast('Enter a quantity for at least one available size');return;}
    try{validateLines(lines,p.name);}catch(e){showToast(e.message);return;}
    const subs=productSubitems(p).filter(si=>state.selectedSubitems[si.id]).map(si=>{const lines=selectedSubitemLines(si);validateLines(lines,si.name);return{subitemId:si.id,name:si.name,code:si.code||'',lines};}).filter(x=>x.lines.length);
    const qty=bulkTotalQty(lines),price=qty?bulkTotalPrice(lines)/qty:Number(p.price||0),total=bulkTotalPrice(lines)+subs.reduce((n,x)=>n+bulkTotalPrice(x.lines),0);
    addCart({key:'bulk-'+p.id+'-'+Date.now(),itemType:'product',productId:p.id,code:p.code||p.sku||'',name:p.name||'Item',image:selectedProductImage(p),price,total,qty,bulkLines:lines,subitems:subs,color:state.color||'',detail:lines.map(x=>(x.size||x.color||'Item')+' × '+x.qty).join(' · ')},true);
    state.bulkQty={};state.subBulkQty={};state.selectedSubitems={};
  }
  function optionValues(p){return S.productOptions(p);}
  function filterPool(audience){return audience==='b2b'?b2bProducts():retailProducts();}
  function filtered(audience){
    const q=String(state.catalogQuery||'').trim().toLowerCase();
    return filterPool(audience).filter(p=>{
      if(q&&![p.name,p.code,p.barcode,p.category,p.subcategory,p.description].join(' ').toLowerCase().includes(q))return false;
      if(state.filterCategories.length&&!state.filterCategories.includes(p.category))return false;
      if(state.filterSubs.length&&!state.filterSubs.includes(p.subcategory))return false;
      if(state.filterOptions.length&&!optionValues(p).some(v=>state.filterOptions.includes(v)))return false;
      return true;
    });
  }
  function filterChoices(audience){
    const pool=filterPool(audience);
    const cats=[...new Set(pool.map(p=>p.category).filter(Boolean))];
    const scopedCat=state.filterDraft?.categories?.length?state.filterDraft.categories:state.filterCategories;
    const catPool=scopedCat.length?pool.filter(p=>scopedCat.includes(p.category)):pool;
    const subs=[...new Set(catPool.map(p=>p.subcategory).filter(Boolean))].sort();
    const scopedSubs=state.filterDraft?.subs?.length?state.filterDraft.subs:state.filterSubs;
    const subPool=scopedSubs.length?catPool.filter(p=>scopedSubs.includes(p.subcategory)):catPool;
    const options=[...new Set(subPool.flatMap(optionValues).filter(Boolean))];
    return{cats,subs,options};
  }
  function saveFilters(){try{localStorage.setItem(filterKey,JSON.stringify({categories:state.filterCategories,subs:state.filterSubs,options:state.filterOptions}));}catch(_){}}
  function shareUrl(kind,value,extra){
    const url=new URL(location.href);url.searchParams.delete('product');url.searchParams.delete('category');url.searchParams.delete('subcategory');url.searchParams.delete('audience');url.searchParams.delete('section');url.searchParams.delete('customCategory');url.searchParams.delete('customItem');
    if(kind==='product'){url.searchParams.set('product',String(value));if(extra==='b2b')url.searchParams.set('audience','b2b');url.hash=extra==='b2b'?'b2bProduct':'product';}
    else if(kind==='category'){url.searchParams.set('category',String(value));url.hash='catalog';}
    else if(kind==='subcategory'){if(extra)url.searchParams.set('category',String(extra));url.searchParams.set('subcategory',String(value));url.hash='catalog';}
    else if(kind==='section'){url.searchParams.set('section',String(value));url.hash='home';}
    else if(kind==='designer'){url.hash='customize';}
    else if(kind==='custom-catalog'){url.hash='customCatalog';}
    else if(kind==='custom-category'){url.searchParams.set('customCategory',String(value));url.hash='customCategory';}
    else if(kind==='custom-item'){url.searchParams.set('customItem',String(value));url.hash='customItem';}
    else{url.hash='catalog';}
    return url.toString();
  }
  async function shareItem(kind,value,label,extra){
    const url=shareUrl(kind,value,extra),title=label||'One-Line catalogue';
    try{if(navigator.share){await navigator.share({title,text:title,url});return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);showToast('Share link copied');return;}}catch(err){if(err?.name==='AbortError')return;}
    try{const ta=document.createElement('textarea');ta.value=url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Share link copied');}catch(_){showToast('Copy this page URL to share');}
  }
  function resetFilters(category){state.filterCategories=category&&category!=='All'?[category]:[];state.filterSubs=[];state.filterOptions=[];saveFilters();}
  function commitFilterDraft(){if(!state.filterDraft)return;state.filterCategories=clone(state.filterDraft.categories||[]);state.filterSubs=clone(state.filterDraft.subs||[]);state.filterOptions=clone(state.filterDraft.options||[]);saveFilters();}
  function closeFilter(applyDraft){if(applyDraft===true)commitFilterDraft();state.filterOpen=false;state.filterDraft=null;render();}
  function openProduct(id,audience){
    const p=state.products.find(x=>String(x.id)===String(id));if(!p)return;
    state.selected=p;state.previewImage='';state.color=p.colors?.[0]||p.colorVariants?.[0]?.color||'';state.bulkQty={};state.subBulkQty={};state.selectedSubitems={};
    const sizes=state.color?p.colorVariants?.find(v=>v.color===state.color)?.sizes:p.sizes;state.size=(sizes||p.sizes||[])[0]||'';
    state.subItem=false;state.subColor=p.subItem?.colors?.[0]||p.subItem?.colorVariants?.[0]?.color||'';
    const subSizes=state.subColor?p.subItem?.colorVariants?.find(v=>String(v.color).toLowerCase()===String(state.subColor).toLowerCase())?.sizes:p.subItem?.sizes;
    state.subSize=(subSizes||p.subItem?.sizes||[])[0]||'';
    go(audience==='b2b'?'b2bProduct':'product');
  }
  function selectedProductImage(p){return state.previewImage||(state.color?S.productImageForColor(p,state.color):(p.images?.[0]||p.image));}
  function currentSizes(p){const row=p.colorVariants?.find(v=>String(v.color).toLowerCase()===String(state.color).toLowerCase());return row?.sizes?.length?row.sizes:(p.sizes||[]);}
  function currentSubSizes(p){const sub=p?.subItem;if(!sub)return[];const row=sub.colorVariants?.find(v=>String(v.color).toLowerCase()===String(state.subColor).toLowerCase());return row?.sizes?.length?row.sizes:(sub.sizes||[]);}
  function currentSubImage(p){const sub=p?.subItem;if(!sub)return'';const row=sub.colorVariants?.find(v=>String(v.color).toLowerCase()===String(state.subColor).toLowerCase());return row?.image||sub.image||sub.images?.[0]||p.image||'assets/crew-tee.webp';}
  function productImages(p){
    if(!p)return ['assets/product-placeholder.svg'];
    const images=[p.image,...(Array.isArray(p.images)?p.images:[]),...(Array.isArray(p.colorVariants)?p.colorVariants.map(v=>v&&v.image):[]),...(Array.isArray(p.variants)?p.variants.map(v=>v&&v.image):[])].filter(Boolean);
    return [...new Set(images)].slice(0,10);
  }
  function productGallery(p){const preferred=state.color?S.productImageForColor(p,state.color):selectedProductImage(p);return [...new Set([preferred,...productImages(p)].filter(Boolean))];}
  function resetZoomState(){state.zoomImage='';state.zoomAlt='';state.zoomImages=[];state.zoomIndex=0;state.zoomScale=1;state.zoomX=0;state.zoomY=0;}
  function openZoom(src,alt){
    const custom=state.screen==='customItem'?state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId)):null;
    const gallery=custom?[...(custom.images||[])].filter(Boolean):(state.selected?productGallery(state.selected):[src]);
    const images=(gallery||[]).filter(Boolean);let index=Math.max(0,images.indexOf(src));if(index<0)index=0;
    state.zoomImages=images.length?images:[src];state.zoomIndex=index;state.zoomImage=state.zoomImages[index]||src;state.zoomAlt=alt||'Product image';state.zoomScale=1;state.zoomX=0;state.zoomY=0;
    try{
      if(history.state?.oneLineZoom)history.replaceState({...history.state,zoomIndex:index,zoomSrc:state.zoomImage,zoomAlt:state.zoomAlt},'',location.href);
      else{history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);history.pushState({...history.state,oneLine:true,oneLineGuard:true,oneLineZoom:true,screen:state.screen,scrollY:window.scrollY,zoomIndex:index,zoomSrc:state.zoomImage,zoomAlt:state.zoomAlt},'',location.href);}
    }catch(_){}
    render();
  }
  function changeZoomImage(step){
    const images=state.zoomImages||[];if(images.length<2)return;
    state.zoomIndex=(state.zoomIndex+step+images.length)%images.length;state.zoomImage=images[state.zoomIndex];state.zoomAlt=(state.selected?.name||'Product image')+' '+(state.zoomIndex+1);state.zoomScale=1;state.zoomX=0;state.zoomY=0;
    try{if(history.state?.oneLineZoom)history.replaceState({...history.state,zoomIndex:state.zoomIndex,zoomSrc:state.zoomImage,zoomAlt:state.zoomAlt},'',location.href);}catch(_){}
    render();
  }
  function closeZoom(){if(history.state?.oneLineZoom){history.back();return;}resetZoomState();render();}
  function detailSlider(images,name){
    images=(images||[]).filter(Boolean);if(!images.length)images=['assets/product-placeholder.svg'];
    return '<div class="detail-slider" data-detail-slider><div class="detail-slider-frame"><div class="product-slide-track detail-slide-track">'+images.map((src,i)=>'<div class="product-slide detail-slide" data-detail-index="'+i+'"><button type="button" class="detail-zoom-target" data-zoom-image="'+S.esc(src)+'" data-zoom-alt="'+S.esc(name+' '+(i+1))+'" aria-label="Open product image">'+img(src,name+' '+(i+1),'product-image','assets/crew-tee.webp')+'<span>'+I('zoom')+'</span></button></div>').join('')+'</div></div>'+(images.length>1?'<div class="product-slide-progress detail-slide-progress">'+images.map((_,i)=>'<i class="'+(i===0?'active':'')+'"></i>').join('')+'</div>':'<div class="product-slide-progress detail-slide-progress single"><i class="active"></i></div>')+'</div>';
  }
  function productCard(p,audience){
    const isB2B=audience==='b2b',slides=productImages(p),discount=p.mrp&&p.price?Math.max(0,Math.round((p.mrp-p.price)/p.mrp*100)):0;
    const label=String(p.name||p.subcategory||p.category||'Product').trim()||'Product';
    const imageOnly=!String(p.name||'').trim()&&!String(p.description||'').trim()&&!Number(p.price||0)&&!Number(p.mrp||0);
    const info=imageOnly?'':'<div class="product-info">'+(p.subcategory||p.category?'<p>'+S.esc(p.subcategory||p.category)+'</p>':'')+(p.name?'<h3>'+S.esc(p.name)+'</h3>':'')+(isB2B?'<div class="ask-price-row"><strong>Ask for price</strong><span>Wholesale enquiry</span></div>':(Number(p.price||0)||Number(p.mrp||0)?'<div class="price-row"><strong>'+S.money(p.price)+'</strong>'+(p.mrp?'<s>'+S.money(p.mrp)+'</s>':'')+'</div>':''))+'</div>';
    return '<article class="product-card wellone-card '+(imageOnly?'image-only-card':'')+'" tabindex="0" data-open-product="'+S.esc(p.id)+'" data-audience="'+(isB2B?'b2b':'retail')+'"><button type="button" class="card-share-button" data-share-kind="product" data-share-value="'+S.esc(p.id)+'" data-share-extra="'+(isB2B?'b2b':'retail')+'" data-share-label="'+S.esc(label)+'" aria-label="Share '+S.esc(label)+'">'+I('share')+'</button><div class="product-image-wrap ratio-3x4 product-card-slider" data-card-slider="'+S.esc(p.id)+'" data-slider-audience="'+(isB2B?'b2b':'retail')+'"><div class="product-slide-track">'+slides.map((src,i)=>'<div class="product-slide" data-slide-index="'+i+'">'+img(src,label+' '+(i+1),'product-image')+'</div>').join('')+'</div>'+(discount?'<span class="discount-tag">-'+discount+'%</span>':'')+'</div>'+(slides.length>1?'<div class="product-slide-progress" aria-hidden="true">'+slides.map((_,i)=>'<i class="'+(i===0?'active':'')+'"></i>').join('')+'</div>':'<div class="product-slide-progress single" aria-hidden="true"><i class="active"></i></div>')+info+'</article>';
  }
  function orderedCategoryNames(list){
    const available=[...new Set(list.map(p=>p.category).filter(Boolean))],configured=state.categories.map(c=>c.name).filter(n=>available.includes(n));
    available.forEach(n=>{if(!configured.includes(n))configured.push(n);});
    return configured.sort((a,b)=>{const at=/t[- ]?shirts?/i.test(a)?0:1,bt=/t[- ]?shirts?/i.test(b)?0:1;return at-b;});
  }
  function groupedProductSections(list,audience){
    return orderedCategoryNames(list).map((name,index)=>{const items=list.filter(p=>p.category===name);if(!items.length)return'';const subs=[...new Set(items.map(p=>p.subcategory).filter(Boolean))];return '<section class="catalog-category-group '+(index===0?'first-category-group':'')+'"><div class="catalog-category-heading"><div><span class="eyebrow">'+(index===0?'FIRST CATEGORY':'CATEGORY '+String(index+1).padStart(2,'0'))+'</span><h2>'+S.esc(name)+'</h2>'+(subs.length?'<p class="category-subline">'+subs.map(S.esc).join(' · ')+'</p>':'')+'</div><div class="category-heading-actions"><small>'+items.length+' item'+(items.length===1?'':'s')+'</small></div></div><div class="product-grid catalog-grid responsive-catalog-grid">'+items.map(p=>productCard(p,audience)).join('')+'</div></section>';}).join('');
  }
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  function header(){
    const customer=state.customer||B?.customerSession?.()||null,verified=!!customer?.token;
    const activeScreen=(...screens)=>screens.includes(state.screen)?' active-menu':'';
    const item=(screen,label,icon,screens)=>'<button class="drawer-item'+activeScreen(...(screens||[screen]))+'" data-go="'+screen+'"><span class="drawer-icon">'+I(icon)+'</span><span>'+label+'</span>'+I('chevron')+'</button>';
    const installNav=isStandalone()?'':'<button class="drawer-item nav-install" data-action="install"><span class="drawer-icon">'+I('download')+'</span><span>Install app</span>'+I('chevron')+'</button>';
    const installHead=isStandalone()?'':'<button class="install-link" data-action="install" aria-label="Install app">'+I('download')+'<span>Install</span></button>';
    const account=verified?'<button class="drawer-account" data-go="profile"><span class="drawer-account-icon">'+I('user')+'</span><span><b>'+S.esc(customer?.name||'My profile')+'</b><small>'+S.esc(String(customer?.phone||'').replace(/^91(?=\d{10}$)/,'+91 '))+'</small></span>'+I('chevron')+'</button>':'<button class="drawer-account" data-action="profile-login"><span class="drawer-account-icon">'+I('user')+'</span><span><b>Sign in / Sign up</b><small>Save designs, track orders and more.</small></span>'+I('chevron')+'</button>';
    const drawer='<div class="drawer-top"><button class="drawer-brand-button" data-go="home">'+logo(false)+'</button><button class="drawer-close" data-action="close-menu" aria-label="Close menu">'+I('close')+'</button></div><div class="drawer-links">'+
      item('home','Home','home')+item('categories','Categories','filter',['categories','product'])+item('customCatalog','Custom Catalogue','sparkle',['customCatalog','customCategory','customItem'])+item('customize','Customize','type')+item('teamUpload','Team Orders','image')+item('b2b','Bulk / B2B','package',['b2b','b2bProduct'])+item('catalog','Ready Made','tag',['catalog','product'])+
      '<span class="drawer-divider" aria-hidden="true"></span>'+item('cart','My Cart','cart',['cart','checkout'])+item('orders','My Orders','orders')+item('profile','My Profile','user')+
      '<button class="drawer-item" data-action="whatsapp" data-message="Hi, I need help with One-Line."><span class="drawer-icon">'+I('contact')+'</span><span>Help & Support</span>'+I('chevron')+'</button>'+installNav+'<button class="drawer-item" data-legal="About"><span class="drawer-icon">'+I('shield')+'</span><span>About OneLine</span>'+I('chevron')+'</button></div>'+account;
    return '<div class="announcement"><span>CUSTOM APPAREL · BULK ORDERS · TEAM KITS</span><b>ONE DESIGN. EVERY SIZE.</b></div><header class="site-header"><button class="mobile-menu" data-action="menu" aria-label="Open menu">'+I('menu')+'</button><button class="logo-button" data-go="home">'+logo(false)+'</button><nav class="'+(state.menu?'open':'')+'">'+drawer+'</nav><div class="header-actions"><button class="b2b-head-link" data-go="b2b">B2B</button>'+installHead+'<button data-go="profile" class="profile-head-link'+(['profile','orders'].includes(state.screen)?' active':'')+'" aria-label="Open profile">'+I('user')+'</button><button data-go="cart" class="cart-head-link" aria-label="Open cart">'+I('cart')+'</button></div></header>'+(state.menu?'<button class="menu-scrim" data-action="close-menu" aria-label="Close menu"></button>':'');
  }
  function footer(){return '<footer><div class="footer-main">'+logo(false)+'<p>Design custom apparel, upload a finished T-shirt, sportswear or polo design for the whole team, or order ready-made garments in exact size quantities.</p><div><b>SHOP</b><button data-go="catalog">Ready-made catalogue</button><button data-go="customCatalog">Customization catalogue</button><button data-go="customize">Custom designer</button><button data-go="teamUpload">Team order</button><button data-go="b2b">B2B catalogue</button></div><div><b>INFORMATION</b>'+Object.keys(legalCopy).map(x=>'<button data-legal="'+x+'">'+x+'</button>').join('')+'</div><div><b>ACCOUNT</b><button data-go="profile">Profile</button><button data-go="cart">Cart</button><button data-go="orders">Orders</button></div></div><div class="footer-bottom"><span>© 2026 OneLine</span><span>Custom apparel · team orders · bulk size quantities</span><span>Developed by <a class="developer-credit-inline" href="'+QUARTZ_SITE+'" target="_blank" rel="noopener noreferrer">Quartz Web Solutions</a></span></div></footer>';}
  function bottom(){
    const accountActive=['profile','cart','orders','checkout'].includes(state.screen);
    return '<nav class="mobile-bottom"><button data-go="home" class="'+(state.screen==='home'?'active':'')+'">'+I('home')+'Home</button><button data-go="categories" class="'+(['categories','catalog','product'].includes(state.screen)?'active':'')+'">'+I('filter')+'Categories</button><button data-go="customize" class="create-only '+(state.screen==='customize'?'active':'')+'" aria-label="Create custom apparel">'+I('plus')+'</button><button data-go="teamUpload" class="'+(state.screen==='teamUpload'?'active':'')+'">'+I('image')+'Team</button><button data-go="profile" class="'+(accountActive?'active':'')+'">'+I('user')+'Profile</button></nav>';
  }
  function visibleCustomCatalogItems(){return (state.customCatalogItems||[]).filter(x=>x.active!==false);}
  function customItemsForCategory(categoryId){return visibleCustomCatalogItems().filter(x=>String(x.category_id)===String(categoryId));}
  function visibleCustomCatalogCategories(){const ids=new Set(visibleCustomCatalogItems().map(x=>String(x.category_id)));return (state.customCatalogCategories||[]).filter(x=>x.active!==false&&ids.has(String(x.id))).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.name||'').localeCompare(String(b.name||'')));}
  function customCategoryCard(c,index,homeCard){const count=customItemsForCategory(c.id).length;return '<article class="custom-catalog-category '+(homeCard?'home-custom-category':'')+'" data-open-custom-category="'+S.esc(c.id)+'" tabindex="0"><button type="button" class="card-share-button custom-category-share" data-share-kind="custom-category" data-share-value="'+S.esc(c.id)+'" data-share-label="'+S.esc(c.name||'Customization category')+'" aria-label="Share '+S.esc(c.name||'category')+'">'+I('share')+'</button><div class="custom-category-image">'+img(c.image_url,c.name,'','assets/category-placeholder.svg')+'</div><div class="custom-category-copy"><span>'+String(index+1).padStart(2,'0')+' · '+count+' IDEA'+(count===1?'':'S')+'</span><h3>'+S.esc(c.name||'Customization')+'</h3>'+(c.description?'<p>'+S.esc(c.description)+'</p>':'')+'</div><b class="custom-category-arrow">'+I('arrow')+'</b></article>';}
  function customCatalogHomeSection(){const cats=visibleCustomCatalogCategories().slice(0,4);if(!cats.length)return'';return '<section class="custom-catalog-home section-wrap"><div class="section-heading"><div><span class="eyebrow">CUSTOMIZATION CATALOGUE</span><h2>Choose an idea. Make it yours.</h2><p>Browse design references and enquire to customize one for your team, business or event.</p></div><div class="section-heading-actions"><button type="button" class="inline-share-button" data-share-kind="custom-catalog" data-share-label="One-Line Customization Catalogue" aria-label="Share customization catalogue">'+I('share')+'</button><button data-go="customCatalog">View catalogue '+I('arrow')+'</button></div></div><div class="custom-category-grid home-custom-category-grid">'+cats.map((c,i)=>customCategoryCard(c,i,true)).join('')+'</div></section>';}
  function customCatalog(){const cats=visibleCustomCatalogCategories();return '<main class="custom-catalog-page section-wrap screen screen-enter"><div class="catalog-title custom-catalog-title"><div><span class="eyebrow">CUSTOMIZATION IDEAS / '+String(cats.length).padStart(2,'0')+'</span><h1>Custom Catalogue</h1><p>These are customization references, not ready-made stock. Open a category, choose an idea and send an enquiry.</p></div><button type="button" class="inline-share-button custom-catalog-main-share" data-share-kind="custom-catalog" data-share-label="One-Line Customization Catalogue" aria-label="Share full customization catalogue">'+I('share')+' <span>Share catalogue</span></button></div>'+(cats.length?'<div class="custom-category-grid full-custom-category-grid">'+cats.map((c,i)=>customCategoryCard(c,i,false)).join('')+'</div>':'<div class="empty-state clean-empty"><h2>No customization ideas yet</h2><p>New categories will appear here after the admin adds catalogue items.</p></div>')+'</main>';}
  function customIdeaCard(item){const category=state.customCatalogCategories.find(c=>String(c.id)===String(item.category_id)),images=(item.images||[]).filter(Boolean);return '<article class="product-card wellone-card custom-idea-card" tabindex="0" data-open-custom-item="'+S.esc(item.id)+'"><button type="button" class="card-share-button" data-share-kind="custom-item" data-share-value="'+S.esc(item.id)+'" data-share-label="'+S.esc(item.title||'Customization idea')+'" aria-label="Share '+S.esc(item.title||'customization idea')+'">'+I('share')+'</button><div class="product-image-wrap ratio-3x4 product-card-slider" data-card-slider="custom-'+S.esc(item.id)+'"><div class="product-slide-track">'+(images.length?images:['assets/product-placeholder.svg']).map((src,i)=>'<div class="product-slide" data-slide-index="'+i+'">'+img(src,item.title+' '+(i+1),'product-image')+'</div>').join('')+'</div></div>'+((images.length||1)>1?'<div class="product-slide-progress" aria-hidden="true">'+images.map((_,i)=>'<i class="'+(i===0?'active':'')+'"></i>').join('')+'</div>':'<div class="product-slide-progress single" aria-hidden="true"><i class="active"></i></div>')+'<div class="product-info custom-idea-info">'+(category?'<p>'+S.esc(category.name)+'</p>':'')+'<h3>'+S.esc(item.title||'Customization idea')+'</h3>'+(item.rate!==null&&item.rate!==undefined&&item.rate!==''?'<b class="custom-catalog-rate">'+S.money(item.rate)+'</b>':'')+(item.description?'<span>'+S.esc(item.description)+'</span>':'')+'<div class="custom-enquire-label">Enquire '+I('arrow')+'</div></div></article>';}
  function customCategory(){const c=state.customCatalogCategories.find(x=>String(x.id)===String(state.customCategoryId));if(!c)return customCatalog();const items=customItemsForCategory(c.id);return '<main class="custom-category-page section-wrap screen screen-enter"><div class="catalog-title custom-category-title"><div><span class="eyebrow">CUSTOMIZATION CATEGORY</span><h1>'+S.esc(c.name)+'</h1>'+(c.description?'<p>'+S.esc(c.description)+'</p>':'')+'</div><div class="catalog-title-actions"><button type="button" class="inline-share-button" data-share-kind="custom-category" data-share-value="'+S.esc(c.id)+'" data-share-label="'+S.esc(c.name)+'" aria-label="Share category">'+I('share')+'</button><button class="back-button" data-action="nav-back" data-fallback="customCatalog">'+I('back')+' Back</button></div></div>'+(items.length?'<div class="product-grid catalog-grid responsive-catalog-grid custom-idea-grid">'+items.map(customIdeaCard).join('')+'</div>':'<div class="empty-state clean-empty"><h2>No ideas in this category yet</h2></div>')+'</main>';}
  function customItem(){const item=state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId));if(!item||item.active===false)return customCatalog();const c=state.customCatalogCategories.find(x=>String(x.id)===String(item.category_id)),images=(item.images||[]).filter(Boolean),busy=state.enquiryBusyId===String(item.id),sent=state.enquirySuccessId===String(item.id),logged=!!B?.customerSession?.()?.token,hasRate=item.rate!==null&&item.rate!==undefined&&item.rate!=='';return '<main class="product-fullscreen custom-item-page screen screen-enter"><div class="product-full-back"><button class="back-button" data-action="nav-back" data-fallback="customCategory">'+I('back')+' Back</button><button type="button" class="inline-share-button custom-item-share" data-share-kind="custom-item" data-share-value="'+S.esc(item.id)+'" data-share-label="'+S.esc(item.title||'Customization idea')+'" aria-label="Share item">'+I('share')+' <span>Share</span></button></div><div class="product-full-inner custom-item-inner"><section class="product-full-media">'+detailSlider(images,item.title||'Customization idea')+'</section><section class="product-full-info custom-item-info"><span class="eyebrow">CUSTOM CATALOGUE'+(c?' / '+S.esc(c.name):'')+'</span><h1>'+S.esc(item.title||'Customization idea')+'</h1>'+(hasRate?'<div class="custom-item-rate">'+S.money(item.rate)+'</div>':'')+'<p>'+S.esc(item.description||'Ask us to customize this reference for your team, business or event.')+'</p><div class="custom-enquiry-note"><b>'+(logged?'Send this enquiry':'Create account to enquire')+'</b><span>'+(logged?'Your saved name and verified contact details will be sent with this item.':'Verify your mobile number and add your name once. Then this enquiry will be sent automatically.')+'</span></div><button class="primary wide custom-catalog-enquiry-button '+(sent?'sent':'')+'" data-action="custom-catalog-enquiry" data-item-id="'+S.esc(item.id)+'" '+(busy||sent?'disabled':'')+'>'+(sent?'Enquiry sent '+I('check'):busy?'Sending…':'Enquire '+I('arrow'))+'</button></section></div></main>';}
  async function submitCustomCatalogEnquiry(itemId){const item=state.customCatalogItems.find(x=>String(x.id)===String(itemId||state.customItemId));if(!item)return;const c=state.customCatalogCategories.find(x=>String(x.id)===String(item.category_id));state.enquiryBusyId=String(item.id);state.enquirySuccessId='';render();try{await B.customerEnquiry({itemId:item.id,itemTitle:item.title||'',itemDescription:item.description||'',itemRate:(item.rate===null||item.rate===undefined||item.rate==='')?null:Number(item.rate),categoryId:c?.id||item.category_id||'',categoryName:c?.name||'',image:(item.images||[])[0]||'',images:(item.images||[]).slice(0,8),shareUrl:shareUrl('custom-item',item.id),source:'customization_catalogue'});state.enquiryBusyId='';state.enquirySuccessId=String(item.id);showToast('Enquiry sent successfully');}catch(err){state.enquiryBusyId='';state.enquirySuccessId='';showToast(err.message||'Could not send enquiry');}}
  function fastUniformSection(){
    const colours=[['#20f12e','Green'],['#1473e6','Blue'],['#ef233c','Red'],['#7b2cbf','Purple'],['#ff8c1a','Orange'],['#f4d03f','Yellow'],['#121212','Black'],['#f5f5f5','White']];
    return '<section class="fast-uniform-section section-wrap" data-fast-uniform><div class="section-heading"><div><span class="eyebrow">FAST UNIFORM CUSTOMIZE</span><h2>Choose the shirt colour.</h2><p>Preview shirt colours instantly while the fabric texture, folds, lighting and the rest of the uniform stay natural.</p></div><div class="fast-uniform-heading-actions"><button type="button" class="fast-uniform-share" data-share-kind="section" data-share-value="shirt-colour" data-share-label="One-Line shirt colour customizer" aria-label="Share shirt colour customizer">'+I('share')+'</button><button type="button" class="fast-uniform-enquire" data-action="uniform-enquiry"><span>Enquire Now</span>'+I('arrow')+'</button></div></div><div class="fast-uniform-card"><div class="fast-uniform-preview"><canvas data-fast-uniform-canvas aria-label="Live uniform colour preview"></canvas></div><div class="fast-uniform-controls"><div class="fast-uniform-control-head"><div><span class="eyebrow">LIVE PREVIEW</span><h3>Shirt colour</h3></div><button type="button" class="fast-uniform-reset" data-fast-uniform-reset>Reset</button></div><div class="fast-uniform-swatches">'+colours.map((x,i)=>'<button type="button" class="fast-uniform-swatch '+(i===0?'active':'')+'" data-fast-uniform-colour="'+x[0]+'" style="background:'+x[0]+'" aria-label="'+x[1]+'"></button>').join('')+'<button type="button" class="fast-uniform-custom-swatch" data-fast-uniform-open aria-label="Choose any colour"></button></div><button type="button" class="fast-uniform-any" data-fast-uniform-open><span><i data-fast-uniform-dot></i>Choose any colour</span><b>›</b></button><p class="fast-uniform-hint">Only the shirt pixels are recoloured; the original cloth texture and lighting remain visible.</p></div></div><div class="fast-colour-overlay" data-fast-picker aria-hidden="true"><div class="fast-colour-sheet" role="dialog" aria-modal="true" aria-label="Choose any colour"><div class="fast-colour-head"><strong>Choose any colour</strong><button type="button" data-fast-picker-close aria-label="Close">×</button></div><div class="fast-sv-wrap"><canvas width="640" height="360" data-fast-sv></canvas><i data-fast-sv-cursor></i></div><input class="fast-hue" data-fast-hue type="range" min="0" max="360" value="120" aria-label="Hue"><div class="fast-picker-bottom"><i data-fast-colour-preview></i><label><span>#</span><input data-fast-hex value="20F12E" maxlength="6" inputmode="text" aria-label="Hex colour"></label><button type="button" data-fast-picker-apply>Apply</button></div></div></div></section>';
  }
  function home(){
    const popular=retailProducts().filter(p=>p.active!==false&&p.customerVisible!==false).slice(0,6);
    return '<main class="screen screen-enter"><section class="hero"><div class="hero-copy"><span class="eyebrow">MADE FOR YOUR NAME, TEAM OR BUSINESS</span><h1>Wear your<br><em>own idea.</em></h1><p>Customize garments, upload one final team design, or order bulk ready-made products with exact size quantities.</p><div class="hero-actions"><button class="primary" data-go="customize">Start customizing '+I('arrow')+'</button><button class="secondary" data-go="categories">Browse categories</button></div><div class="hero-proof"><span>'+I('shield')+' Exact print position saved</span><span>'+I('package')+' Bulk size quantities supported</span></div></div><div class="hero-visual legacy-home-customizer" data-click-go="customize" tabindex="0" role="button" aria-label="Open custom apparel designer"><div class="hero-grid-label">ONE-LINE CUSTOM STUDIO</div><div class="hero-product-orbit"><div class="orbit-ring"></div><img src="assets/crew-tee.webp" alt="Premium blank T-shirt"><div class="hero-brand-badge"><img src="one-line-logo.webp" alt=""><span>BUILD YOUR OWN</span></div></div><div class="floating-tool tool-a">'+I('type')+'<span>Add text</span></div><div class="floating-tool tool-b">'+I('image')+'<span>Upload image</span></div><div class="floating-tool tool-c">'+I('sparkle')+'<span>Choose print</span></div><button class="visual-cta" data-go="customize"><span>OPEN DESIGNER</span>'+I('arrow')+'</button></div></section>'+categoriesSection()+customCatalogHomeSection()+teamUploadSection()+processSection()+fastUniformSection()+(popular.length?'<section class="products-section section-wrap"><div class="section-heading"><div><span class="eyebrow">READY TO ORDER</span><h2>Available essentials.</h2></div><button data-go="catalog">See full catalogue '+I('arrow')+'</button></div><div class="product-grid home-product-grid">'+popular.map(p=>productCard(p,'retail')).join('')+'</div></section>':'')+'</main>';
  }
  function availableCategories(){
    const visible=retailProducts().filter(p=>p.active!==false&&p.customerVisible!==false),names=new Set(visible.map(p=>p.category).filter(Boolean));
    return state.categories.filter(c=>c.active!==false&&names.has(c.name)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  }
  function categoriesSection(){
    const cats=availableCategories();
    return '<section class="category-section section-wrap borderless-categories"><div class="section-heading"><div><span class="eyebrow">SHOP BY CATEGORY</span><h2>Ready-made catalogue.</h2></div><div class="section-heading-actions"><button class="catalog-view-button" data-go="categories">View all categories '+I('arrow')+'</button></div></div>'+(cats.length?'<div class="category-grid real-category-grid equal-category-grid">'+cats.map((c,i)=>'<article class="category-block real-category-card" data-category="'+S.esc(c.name)+'" tabindex="0"><span class="category-code">'+String(i+1).padStart(2,'0')+'</span><div class="category-photo">'+img(c.image,c.name,'','assets/category-placeholder.svg')+'</div><div><h3>'+S.esc(c.name)+'</h3><p>'+S.esc(c.sub||'Available products')+'</p></div><span class="category-arrow">'+I('arrow')+'</span></article>').join('')+'</div>':'<div class="empty-state clean-empty"><h2>No categories available yet</h2><p>A category appears here only after it contains at least one active item.</p></div>')+'</section>';
  }
  function categoriesPage(){
    const cats=availableCategories();
    return '<main class="categories-page categories-only-page section-wrap screen screen-enter">'+(cats.length?'<div class="category-grid real-category-grid equal-category-grid full-category-grid categories-only-grid">'+cats.map((c,i)=>'<article class="category-block real-category-card category-name-only" data-category="'+S.esc(c.name)+'" tabindex="0"><span class="category-code">'+String(i+1).padStart(2,'0')+'</span><div class="category-photo">'+img(c.image,c.name,'','assets/category-placeholder.svg')+'</div><div><h3>'+S.esc(c.name)+'</h3></div><span class="category-arrow">'+I('arrow')+'</span></article>').join('')+'</div>':'<div class="empty-state clean-empty"><h2>No categories available</h2></div>')+'</main>';
  }
  function teamUploadSection(){
    const cards=[
      ['T-Shirt','assets/team-tshirt-user.jpg','Upload your T-shirt design'],
      ['Sportswear','assets/team-sportswear-user.jpg','Upload your sportswear design'],
      ['Polo','assets/team-polo-user.jpg','Upload your polo design']
    ];
    return '<section class="team-upload-home section-wrap"><div class="section-heading team-section-heading"><div><span class="eyebrow">UPLOAD YOUR TEAM DESIGN</span><h2>Send one design. Add the whole team.</h2><p>Choose T-shirt, sportswear or polo, upload one finished design, then add every person with name, number and size.</p></div><button class="team-open-button" data-go="teamUpload"><span>Open team order</span>'+I('arrow')+'</button></div><div class="team-type-preview real-team-preview">'+cards.map(([name,src,caption])=>'<button type="button" data-team-open="'+name+'"><span>'+img(src,caption,'','assets/product-placeholder.svg')+'</span><div><b>'+name+'</b><small>'+caption+'</small></div></button>').join('')+'</div></section>';
  }
  function processSection(){const rows=[['sliders','Choose','Select apparel type, cloth quality, garment colour and size.'],['move','Create','Move only your print layers while the garment stays locked.'],['sparkle','Print','Select the print method; sublimation is disabled on dark garments.'],['truck','Receive','Add the exact saved design to cart and complete the order.']];return '<section class="process-section"><div class="section-wrap"><span class="eyebrow light">CUSTOM ORDER PROCESS</span><h2>From blank garment<br>to finished piece.</h2><div class="process-grid">'+rows.map((x,i)=>'<article><b>0'+(i+1)+'</b>'+I(x[0])+'<h3>'+x[1]+'</h3><p>'+x[2]+'</p></article>').join('')+'</div><button class="acid-button" data-go="customize">Design an apparel now '+I('arrow')+'</button></div></section>';}
  function activeFilterChips(){const all=[...state.filterCategories.map(v=>['category',v]),...state.filterSubs.map(v=>['sub',v]),...state.filterOptions.map(v=>['option',v])];return all.length?'<div class="active-filter-chips">'+all.map(([k,v])=>'<button data-remove-filter="'+k+'" data-value="'+S.esc(v)+'">'+S.esc(v)+' <b>×</b></button>').join('')+'</div>':'';}
  function catalog(){
    const list=filtered('retail');
    const selectedCategory=state.filterCategories.length===1?state.filterCategories[0]:'';
    const categoryShare=selectedCategory?'<button type="button" class="inline-share-button selected-category-share" data-share-kind="category" data-share-value="'+S.esc(selectedCategory)+'" data-share-label="'+S.esc(selectedCategory)+' category" aria-label="Share '+S.esc(selectedCategory)+' category">'+I('share')+'</button>':'';
    return '<main class="catalog-page section-wrap screen screen-enter wellone-catalog grouped-catalog"><div class="catalog-title compact-catalog-title"><div><span class="eyebrow">READY-MADE / '+String(list.length).padStart(2,'0')+'</span><h1>'+(selectedCategory?S.esc(selectedCategory):'Ready-made')+'</h1><p>Search by product name, category, barcode or item code.</p></div><div class="catalog-title-actions">'+categoryShare+'<button class="filter-button wellone-filter-button" data-action="open-filter">'+I('filter')+' Filter '+((state.filterCategories.length+state.filterSubs.length+state.filterOptions.length)?'<b>'+(state.filterCategories.length+state.filterSubs.length+state.filterOptions.length)+'</b>':'')+'</button></div></div><div class="catalog-code-search"><input data-catalog-search type="search" value="'+S.esc(state.catalogQuery)+'" placeholder="Search item code, barcode or product name"><span>'+I('search')+'</span></div>'+activeFilterChips()+(list.length?groupedProductSections(list,'retail'):'<div class="empty-state">'+I('filter')+'<h2>No matching items</h2><p>Clear a filter and try again.</p><button data-action="clear-filters">Clear filters</button></div>')+'</main>';
  }
  function bulkMatrix(p){
    const rows=selectedVariants(p);
    if(!rows.length){const stock=Number(p.stock||0);return '<div class="bulk-order-box"><div class="bulk-order-head"><div><span class="eyebrow">BULK QUANTITY</span><h3>How many pieces?</h3></div><small>'+stock+' available</small></div><div class="bulk-size-row"><span><b>Quantity</b><small>Available '+stock+'</small></span><input type="number" min="0" max="'+stock+'" inputmode="numeric" data-bulk-key="simple" value="'+Number(state.bulkQty.simple||0)+'" placeholder="0"></div></div>';}
    return '<div class="bulk-order-box"><div class="bulk-order-head"><div><span class="eyebrow">BULK SIZE QUANTITY</span><h3>Enter pieces for each size</h3></div><small>Use only the sizes you need</small></div><div class="bulk-size-list">'+rows.map(v=>{const k=variantKey(v),stock=Number(v.stock||0);return '<label class="bulk-size-row"><span><b>'+S.esc(v.size||v.color||'Option')+'</b>'+(v.color?'<small>'+S.esc(v.color)+' · '+stock+' available</small>':'<small>'+stock+' available</small>')+'</span><input type="number" min="0" max="'+stock+'" inputmode="numeric" data-bulk-key="'+S.esc(k)+'" value="'+Number(state.bulkQty[k]||0)+'" placeholder="0"></label>';}).join('')+'</div></div>';
  }
  function subitemPanel(p){
    const list=productSubitems(p);if(!list.length)return'';
    return '<div class="bulk-subitems"><div class="bulk-subitems-title"><span class="eyebrow">OPTIONAL SUBITEMS</span><h3>Add matching items</h3><p>Each selected item gets its own size/quantity breakdown.</p></div>'+list.map(si=>{const active=!!state.selectedSubitems[si.id],rows=subitemRows(si),map=state.subBulkQty[si.id]||{};return '<article class="bulk-subitem-card '+(active?'active':'')+'"><label class="bulk-subitem-toggle"><input type="checkbox" data-subitem-id="'+S.esc(si.id)+'" '+(active?'checked':'')+'><span><b>'+S.esc(si.name)+'</b><small>'+S.esc(si.code||'Matching subitem')+'</small></span><strong>'+S.money(si.price||0)+'</strong></label>'+(active?'<div class="bulk-size-list">'+rows.map(v=>{const k=variantKey(v),stock=Number(v.stock||0);return '<label class="bulk-size-row"><span><b>'+S.esc(v.size||v.color||'Option')+'</b><small>'+S.esc(v.color||'')+(v.color?' · ':'')+stock+' available</small></span><input type="number" min="0" max="'+stock+'" inputmode="numeric" data-sub-bulk-id="'+S.esc(si.id)+'" data-sub-bulk-key="'+S.esc(k)+'" value="'+Number(map[k]||0)+'" placeholder="0"></label>';}).join('')+'</div>':'')+'</article>';}).join('')+'</div>';
  }
  function product(){
    const p=state.selected;if(!p)return catalog();const gallery=productGallery(p),label=String(p.name||p.category||'Product').trim()||'Product';
    const colors=[...new Set(productVariants(p).map(v=>v.color).filter(Boolean))];const lines=selectedBulkLines(p),subs=productSubitems(p).filter(si=>state.selectedSubitems[si.id]).flatMap(si=>selectedSubitemLines(si));const q=bulkTotalQty(lines)+bulkTotalQty(subs),total=bulkTotalPrice(lines)+bulkTotalPrice(subs);
    return '<main class="product-fullscreen screen screen-enter bulk-product-page"><div class="product-full-back"><button class="back-button" data-action="nav-back" data-fallback="catalog">'+I('back')+' Back</button></div><div class="product-full-inner"><section class="product-full-media">'+detailSlider(gallery,label)+'</section><section class="product-full-info"><div class="product-title-tools"><span class="eyebrow">'+[p.category,p.subcategory].filter(Boolean).map(S.esc).join(' / ')+'</span><button type="button" class="inline-share-button" data-share-kind="product" data-share-value="'+S.esc(p.id)+'" data-share-label="'+S.esc(label)+'" aria-label="Share product">'+I('share')+'</button></div><h1>'+S.esc(label)+'</h1><div class="product-code-line"><span>ITEM CODE</span><b>'+S.esc(p.code||p.barcode||'------')+'</b></div>'+(Number(p.price||0)?'<div class="detail-price"><strong>From '+S.money(p.price)+'</strong>'+(p.mrp?'<s>'+S.money(p.mrp)+'</s>':'')+'</div>':'')+(p.description?'<p>'+S.esc(p.description)+'</p>':'')+(colors.length?'<div class="selection-block"><label>Colour <b>'+S.esc(state.color||colors[0])+'</b></label><div class="colour-options">'+colors.map(c=>'<button class="'+((state.color||colors[0])===c?'active':'')+'" data-product-color="'+S.esc(c)+'"><span style="background:'+(S.palette[c]||c||'#ddd')+'"></span>'+S.esc(c)+'</button>').join('')+'</div></div>':'')+bulkMatrix(p)+subitemPanel(p)+'<div class="bulk-live-summary"><span><b>'+q+'</b> piece'+(q===1?'':'s')+' selected</span><strong>'+S.money(total)+'</strong></div><div class="product-action-row"><button class="primary detail-add" data-action="add-product">Add bulk order to cart '+I('cart')+'</button><button class="custom-enquiry-btn" data-action="whatsapp" data-message="Hi, I want to know about '+S.esc(label)+' (item code '+S.esc(p.code||'')+').">'+whatsappLogo()+'<span>Contact to customize</span></button></div><div class="ready-made-note"><b>OTP only when you add to cart</b><span>You can browse freely. Phone verification starts only when you try to cart an item or design.</span></div></section></div></main>';
  }
  function customCartPreview(item){const faces=S.designedSurfaces(item.customDesign||{});const face=faces[0]||'front';return '<div class="cart-custom-preview">'+S.designPreview(item.customDesign,face,'cart-design-preview')+'<span>'+face.replace('Sleeve',' sleeve')+'</span></div>';}
  function cartBreakdown(item){
    let rows=[];(item.bulkLines||[]).forEach(l=>rows.push('<span>'+S.esc([l.color,l.size].filter(Boolean).join(' · ')||'Item')+' <b>× '+Number(l.qty||0)+'</b></span>'));(item.subitems||[]).forEach(si=>(si.lines||[]).forEach(l=>rows.push('<span>'+S.esc(si.name)+' · '+S.esc([l.color,l.size].filter(Boolean).join(' · ')||'Item')+' <b>× '+Number(l.qty||0)+'</b></span>')));if(item.itemType==='team_design'&&item.design?.roster)rows=item.design.roster.map(r=>'<span>'+S.esc(r.name||'No name')+' · #'+S.esc(r.number||'—')+' · '+S.esc(r.size||'—')+'</span>');if(item.itemType==='custom_design'&&item.sizeQuantities){rows=Object.entries(item.sizeQuantities).filter(([,q])=>Number(q)>0).map(([size,q])=>'<span>'+S.esc(size)+' <b>× '+Number(q)+'</b></span>');}return rows.length?'<div class="cart-bulk-breakdown">'+rows.join('')+'</div>':'';
  }
  function cartItem(item){
    const thumb=item.customDesign?customCartPreview(item):'<div class="cart-ready-preview">'+img(item.image||item.design?.artworkDataUrl,item.name,'','assets/product-placeholder.svg')+'</div>',fixed=!!(item.bulkLines||item.itemType==='team_design'||item.itemType==='custom_design'||item.custom);
    return '<article class="cart-item improved-cart-item">'+thumb+'<div class="cart-item-info"><span>'+(item.itemType==='team_design'?'TEAM DESIGN':item.custom?'YOUR CUSTOM DESIGN':'BULK READY-MADE')+'</span><h3>'+S.esc(item.name)+'</h3><p>'+[item.code?('Code '+item.code):'',item.detail].filter(Boolean).map(S.esc).join(' · ')+'</p>'+cartBreakdown(item)+(item.customDesign?'<div class="cart-design-meta"><b>'+S.esc(item.customDesign.printType)+'</b><span>'+S.designedSurfaces(item.customDesign).length+' print area'+(S.designedSurfaces(item.customDesign).length===1?'':'s')+'</span></div>':'')+'<strong>'+(Number(item.total??item.price)>0?S.money(item.total??Number(item.price||0)*Number(item.qty||0)):'Price after review')+'</strong></div>'+(fixed?'<div class="qty-static"><b>'+Number(item.qty||0)+'</b><small>pcs</small></div>':'<div class="qty-control"><button data-qty="-1" data-key="'+S.esc(item.key)+'">'+I('minus')+'</button><span>'+item.qty+'</span><button data-qty="1" data-key="'+S.esc(item.key)+'">'+I('plus')+'</button></div>')+'<button class="remove-item" data-remove-key="'+S.esc(item.key)+'" aria-label="Remove item">'+I('trash')+'</button></article>';
  }
  function cart(){
    return '<main class="cart-page section-wrap screen screen-enter improved-cart-page simple-cart-page"><div class="catalog-title cart-title"><div><span class="eyebrow">YOUR SELECTIONS</span><h1>Cart</h1><p>Review products, size quantities and saved custom designs before checkout.</p></div><button class="back-button" data-action="nav-back" data-fallback="profile">'+I('back')+' Back</button></div>'+(state.cart.length?'<div class="cart-layout"><section class="cart-list">'+state.cart.map(cartItem).join('')+'</section><aside class="order-summary clean-order-summary"><span class="eyebrow">SUMMARY</span><div class="summary-line"><span>Selected pieces</span><b>'+totalQty()+'</b></div><div class="summary-line"><span>Products / designs</span><b>'+state.cart.length+'</b></div><div class="summary-total"><span>Estimated total</span><strong>'+S.money(subtotal())+'</strong></div><small>Final delivery charges, if any, are confirmed at checkout.</small><button class="primary wide" data-action="checkout">Continue to checkout '+I('arrow')+'</button><button class="secondary wide cart-edit-design" data-go="customize">Continue designing</button></aside></div>':'<div class="empty-state cart-empty">'+I('cart')+'<h2>Your cart is empty</h2><p>Add a ready-made product, custom design or team jersey order.</p><div><button class="primary" data-go="customize">Open customizer</button><button class="secondary" data-go="catalog">Browse products</button></div></div>')+'</main>';
  }
  function checkout(){
    if(state.orderPlaced)return success();const deliveries=S.getDelivery().filter(x=>x.active);
    if(!state.cart.length)return cart();
    return '<main class="checkout-page section-wrap screen screen-enter"><div class="checkout-head"><button class="back-button" data-action="nav-back" data-fallback="cart">'+I('back')+' Back</button>'+logo(true)+'<span>Secure checkout '+I('shield')+'</span></div><div class="checkout-steps two-steps"><span class="'+(state.checkoutStep>=1?'active':'')+'"><b>1</b>Details</span><i></i><span class="'+(state.checkoutStep>=2?'active':'')+'"><b>2</b>Delivery & payment</span></div><div class="checkout-layout"><section class="checkout-card">'+(state.checkoutStep===1?'<div><span class="eyebrow">STEP 01</span><h1>Your details</h1><p>Enter the contact and delivery details for this order.</p><form class="checkout-form" data-checkout-form><label>Name<input required name="name" value="'+S.esc(state.details.name||state.customer?.name||'')+'"></label><label>Verified phone<input required readonly name="phone" inputmode="tel" value="'+S.esc(state.customer?.phone||state.details.phone||'')+'"></label><label class="full">Business / institution name <small>optional</small><input name="business" value="'+S.esc(state.details.business||state.customer?.businessName||'')+'"></label><label class="full">Address<textarea required name="address" rows="4">'+S.esc(state.details.address)+'</textarea></label><button type="button" class="primary wide" data-action="delivery-step">Continue '+I('arrow')+'</button></form></div>':'<div><span class="eyebrow">STEP 02</span><h1>Delivery & payment</h1><div class="checkout-options"><b>Delivery method</b>'+deliveries.map(d=>'<button data-delivery="'+S.esc(d.name)+'" class="'+(state.delivery===d.name?'active':'')+'">'+I(d.name.toLowerCase().includes('pickup')?'package':d.name.toLowerCase().includes('bus')?'box':'truck')+'<span><b>'+S.esc(d.name)+'</b><small>'+S.esc(d.note)+'</small></span>'+(state.delivery===d.name?I('check'):'')+'</button>').join('')+'</div><div class="checkout-options"><b>Payment</b>'+['Cash on delivery','Pay at pickup'].map(p=>'<button data-payment="'+p+'" class="'+(state.payment===p?'active':'')+'">'+I('card')+'<span><b>'+p+'</b><small>Confirmed with order</small></span>'+(state.payment===p?I('check'):'')+'</button>').join('')+'</div><button class="primary wide" data-action="submit-order">Place order · '+S.money(subtotal())+'</button></div>')+'</section><aside class="order-summary checkout-summary"><span class="eyebrow">YOUR ORDER</span>'+state.cart.map(i=>'<div><span>'+i.qty+' × '+S.esc(i.name)+'</span><b>'+(Number(i.total??(i.price*i.qty))>0?S.money(i.total??(i.price*i.qty)):'Quote')+'</b></div>').join('')+'<hr><div class="summary-total"><span>Total</span><strong>'+S.money(subtotal())+'</strong></div></aside></div></main>';
  }
  function success(){return '<main class="success-page section-wrap screen screen-enter"><div class="success-card">'+I('check')+'<span class="eyebrow">ORDER CONFIRMED</span><h1>Thank you.</h1><p>Your order and exact custom design data were saved.</p><div class="success-order"><span>Order reference</span><b>#'+S.esc(state.orderReference)+'</b></div><div><button class="primary" data-action="view-order">View my order</button><button class="secondary" data-go="home">Back to home</button></div></div></main>';}
  function orderItem(item){const faces=item.customDesign?S.designedSurfaces(item.customDesign):[];const previews=item.customDesign?'<div class="design-surface-gallery">'+(faces.length?faces:['front']).map(face=>'<figure>'+S.designPreview(item.customDesign,face)+'<figcaption>'+face.replace('Sleeve',' sleeve')+'</figcaption></figure>').join('')+'</div>':'<div class="cart-ready-preview">'+img(item.image,item.name,'','assets/crew-tee.webp')+'</div>';return '<div class="ordered-item">'+previews+'<div><span>'+(item.custom?'CUSTOMIZED ITEM':'READY-MADE ITEM')+'</span><h3>'+S.esc(item.name)+'</h3><p>'+[item.color,item.size,'Qty '+item.qty].filter(Boolean).map(S.esc).join(' · ')+'</p>'+(item.customDesign?'<dl><div><dt>Print</dt><dd>'+S.esc(item.customDesign.printType)+'</dd></div><div><dt>Print areas</dt><dd>'+faces.length+'</dd></div></dl>':'')+'</div><strong>'+S.money(item.price*item.qty)+'</strong></div>';}
  function orders(){return '<main class="customer-orders-page section-wrap screen screen-enter"><div class="catalog-title"><div><span class="eyebrow">CUSTOMER ORDER HISTORY</span><h1>My orders</h1></div><button class="back-button" data-action="nav-back" data-fallback="home">'+I('back')+' Back</button></div><div class="customer-order-list">'+(state.orders.length?state.orders.map(o=>'<article class="customer-order-card"><div class="customer-order-head"><div><span>ORDER #'+S.esc(o.id)+'</span><h2>'+S.esc(o.status)+'</h2></div><div><small>'+S.esc(o.time)+'</small><strong>'+S.money(o.total)+'</strong></div></div><div class="customer-order-items">'+(o.orderItems?.length?o.orderItems.map(orderItem).join(''):'<div class="legacy-order-note">'+I('package')+'<span><b>'+o.items+' ordered items</b><small>Older demo order</small></span></div>')+'</div><div class="customer-order-foot"><span>'+I('truck')+' '+S.esc(o.delivery)+'</span><span>'+I('card')+' '+S.esc(o.payment)+'</span><span>'+I('map')+' '+S.esc(o.address)+'</span></div></article>').join(''):'<div class="empty-state"><h2>No orders yet</h2><p>Your confirmed orders appear here.</p></div>')+'</div></main>';}
  function profile(){
    const customer=state.customer||B?.customerSession?.()||null,verified=!!customer?.token,name=String(customer?.name||'').trim(),businessName=String(customer?.businessName||'').trim(),jobTitle=String(customer?.jobTitle||'').trim();
    const rawPhone=String(customer?.phone||'').trim();
    const phone=rawPhone.replace(/^91(?=\d{10}$)/,'+91 ');
    let profileCard='';
    if(verified){
      const details=[jobTitle,businessName].filter(Boolean);
      const body=(state.profileEditing||!name)?'<form class="profile-name-form profile-full-form" data-profile-name><label><small>Name</small><input name="name" required minlength="2" maxlength="120" value="'+S.esc(name)+'" placeholder="Your name"></label><label><small>Business / institution <i>optional</i></small><input name="businessName" maxlength="160" value="'+S.esc(businessName)+'" placeholder="Company, shop, school, team…"></label><label><small>Your post / role <i>optional</i></small><input name="jobTitle" maxlength="120" value="'+S.esc(jobTitle)+'" placeholder="Manager, Owner, Coach…"></label><div class="profile-edit-phone profile-phone-fixed"><small>Verified mobile</small><b>'+S.esc(phone)+'</b><span>Connected to this account</span></div><div><button class="primary" type="submit">Save profile</button>'+(name?'<button class="secondary" type="button" data-action="profile-cancel-edit">Cancel</button>':'')+'</div></form>':'<h1>'+S.esc(name||'Your profile')+'</h1><p class="profile-phone-line">'+S.esc(phone)+'</p>'+(details.length?'<div class="profile-extra-lines">'+details.map(x=>'<span>'+S.esc(x)+'</span>').join('')+'</div>':'')+'<button class="profile-edit-button" data-action="profile-edit">'+I('edit')+' Edit profile</button>';
      profileCard='<section class="profile-identity"><div class="profile-avatar profile-avatar-icon">'+I('user')+'</div><div class="profile-identity-copy"><span class="eyebrow">VERIFIED CUSTOMER</span>'+body+'</div></section>';
    }else{
      profileCard='<section class="profile-identity guest-profile"><div class="profile-avatar profile-avatar-icon">'+I('user')+'</div><div class="profile-identity-copy"><span class="eyebrow">ONE LINE ACCOUNT</span><h1>Your profile</h1><button class="primary" data-action="profile-login">Verify mobile number</button></div></section>';
    }
    return '<main class="profile-page section-wrap screen screen-enter"><div class="profile-page-head"><span class="eyebrow">ACCOUNT</span><h1>Profile</h1></div>'+profileCard+'<section class="profile-action-grid"><button data-go="cart"><span class="profile-action-icon">'+I('cart')+'</span><span><b>Cart</b><small>'+totalQty()+' selected piece'+(totalQty()===1?'':'s')+'</small></span>'+I('arrow')+'</button><button data-go="orders"><span class="profile-action-icon">'+I('orders')+'</span><span><b>Orders</b><small>Synced to your verified number</small></span>'+I('arrow')+'</button><button data-go="customize"><span class="profile-action-icon">'+I('plus')+'</span><span><b>Custom designer</b><small>Create your own apparel</small></span>'+I('arrow')+'</button><button data-go="teamUpload"><span class="profile-action-icon">'+I('image')+'</span><span><b>Team order</b><small>Upload one design for the whole team</small></span>'+I('arrow')+'</button></section><section class="profile-info-card"><h2>Help & information</h2><div class="profile-info-links"><button data-legal="About">About OneLine '+I('arrow')+'</button><button data-legal="Terms & Conditions">Terms & Conditions '+I('arrow')+'</button><button data-legal="Privacy Policy">Privacy Policy '+I('arrow')+'</button><button data-legal="Shipping & Returns">Shipping & Returns '+I('arrow')+'</button></div>'+(verified?'<button class="profile-logout" data-action="profile-logout">Sign out on this device</button>':'')+'</section></main>';
  }
  function b2b(){
    if(!state.b2bAuthed)return '<main class="b2b-login-page section-wrap screen screen-enter"><section class="b2b-login-card"><span class="eyebrow">WHOLESALE ACCESS</span><h1>B2B login</h1><p>Use the single B2B login supplied by the admin. Wholesale prices are not displayed; each item goes to WhatsApp for a quotation.</p><form data-b2b-login><label>Login ID<input name="id" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label>'+(state.b2bError?'<p class="b2b-error">'+S.esc(state.b2bError)+'</p>':'')+'<button class="primary wide" type="submit">Open B2B catalogue '+I('arrow')+'</button></form></section></main>';
    const list=filtered('b2b');return '<main class="catalog-page section-wrap screen screen-enter wellone-catalog b2b-catalog grouped-catalog"><div class="catalog-title compact-catalog-title"><div><span class="eyebrow">B2B ONLY / '+String(list.length).padStart(2,'0')+'</span><h1>Wholesale catalogue</h1><p>No fixed rate is shown. Select an item and ask for the current wholesale price on WhatsApp.</p></div><div class="b2b-actions"><button class="filter-button wellone-filter-button" data-action="open-filter">'+I('filter')+' Filter</button><button class="secondary" data-action="b2b-logout">Logout</button></div></div>'+activeFilterChips()+(list.length?groupedProductSections(list,'b2b'):'<div class="empty-state"><h2>No matching B2B items</h2><button data-action="clear-filters">Clear filters</button></div>')+'</main>';
  }
  function b2bProduct(){const p=state.selected;if(!p||p.audience!=='b2b')return b2b();return '<main class="product-fullscreen screen screen-enter b2b-product"><div class="product-full-back"><button class="back-button" data-action="nav-back" data-fallback="b2b">'+I('back')+' Back</button></div><div class="product-full-inner"><section class="product-full-media">'+detailSlider([p.image],p.name)+'</section><section class="product-full-info"><span class="eyebrow">B2B / '+S.esc(p.category)+'</span><h1>'+S.esc(p.name)+'</h1><div class="b2b-price-label">ASK FOR PRICE</div><p>'+S.esc(p.description)+'</p>'+(p.sizes?.length?'<div class="selection-block"><label>'+S.esc(p.optionTitle||'Available options')+'</label><div class="size-options">'+p.sizes.map(v=>'<button class="'+(state.size===v?'active':'')+'" data-product-size="'+S.esc(v)+'">'+S.esc(v)+'</button>').join('')+'</div></div>':'')+'<button class="custom-enquiry-btn b2b-enquiry" data-action="whatsapp" data-message="Hi, I need the B2B price for '+S.esc(p.name)+(state.size?' - '+S.esc(state.size):'')+'. Please send the current wholesale rate and minimum quantity.">'+whatsappLogo()+'<span>Ask for price on WhatsApp</span></button></section></div></main>';}
  function filterModal(audience){
    if(!state.filterOpen)return'';const draft=state.filterDraft||{categories:clone(state.filterCategories),subs:clone(state.filterSubs),options:clone(state.filterOptions)};state.filterDraft=draft;const choices=filterChoices(audience);
    const choice=(kind,val,active)=>'<button type="button" class="catalog-filter-choice '+(active?'is-selected':'')+'" data-filter-choice="'+kind+'" data-value="'+S.esc(val)+'"><span class="filter-check">'+(active?I('check'):'')+'</span><span>'+S.esc(val)+'</span></button>';
    return '<div class="catalog-filter-overlay open"><aside class="catalog-filter-drawer"><header><div><p>'+(audience==='b2b'?'B2B catalogue':'Ready-made catalogue')+'</p><h2>Filters</h2></div><button class="filter-drawer-close" data-action="close-filter" aria-label="Close">×</button></header><div class="catalog-filter-body"><section class="filter-drawer-group"><div class="filter-group-title"><span>Category</span><small>Select one or more</small></div><div class="filter-choice-grid">'+choices.cats.map(v=>choice('categories',v,draft.categories.includes(v))).join('')+'</div></section>'+(choices.subs.length?'<section class="filter-drawer-group"><div class="filter-group-title"><span>Subcategory</span><small>Available for selected categories</small></div><div class="filter-choice-grid">'+choices.subs.map(v=>choice('subs',v,draft.subs.includes(v))).join('')+'</div></section>':'')+(choices.options.length?'<section class="filter-drawer-group"><div class="filter-group-title"><span>Size / option</span><small>Only available values are shown</small></div><div class="filter-choice-grid option-choice-grid">'+choices.options.map(v=>choice('options',v,draft.options.includes(v))).join('')+'</div></section>':'')+'</div><footer><div><button class="filter-reset-button" data-action="reset-filter-draft">Clear</button><small>'+(draft.categories.length+draft.subs.length+draft.options.length)+' selected</small></div><button class="filter-apply-button" data-action="apply-filter">Apply filters</button></footer></aside></div>';
  }
  function teamUpload(){
    const types=['T-Shirt','Sportswear','Polo'],sizes=['XS','S','M','L','XL','XXL','3XL'];
    const teamMeta={
      'T-Shirt':{label:'T-shirt',upload:'Upload your T-shirt design'},
      'Sportswear':{label:'Sportswear',upload:'Upload your sportswear design'},
      'Polo':{label:'Polo',upload:'Upload your polo design'}
    }[state.teamType]||{label:'Team wear',upload:'Upload your design'};
    return '<main class="team-upload-page section-wrap screen screen-enter"><div class="catalog-title"><div><span class="eyebrow">UPLOAD YOUR TEAM DESIGN</span><h1>Team order</h1><p>Choose the garment, upload the final design and add one required row per person.</p></div><button class="back-button" data-action="nav-back" data-fallback="home">'+I('back')+' Back</button></div><section class="team-builder"><div class="team-design-side"><div class="team-type-tabs">'+types.map(t=>'<button type="button" data-team-type="'+t+'" class="'+(state.teamType===t?'active':'')+'">'+S.esc(t)+'</button>').join('')+'</div><label class="team-artwork-drop '+(state.teamArtwork?'has-image':'')+'"><input type="file" accept="image/png,image/jpeg,image/webp" data-team-artwork><span class="team-artwork-preview">'+(state.teamArtwork?'<img src="'+S.esc(state.teamArtwork)+'" alt="Uploaded '+S.esc(teamMeta.label)+' design">':I('image')+'<b>'+S.esc(teamMeta.upload)+'</b><small>PNG, JPG or WebP · tap to choose</small>')+'</span></label>'+(state.teamFileName?'<p class="team-file-name">'+S.esc(state.teamFileName)+'</p>':'')+'</div><div class="team-roster-side"><div class="team-roster-head"><div><span class="eyebrow">NAME / NUMBER / SIZE</span><h2>Team list</h2></div><button type="button" class="secondary" data-action="team-add-row">'+I('plus')+' Add row</button></div><div class="team-roster-list">'+state.teamRows.map((r,i)=>'<div class="team-roster-row"><span class="row-number">'+String(i+1).padStart(2,'0')+'</span><label><small>Name</small><input required data-team-row="'+i+'" data-team-field="name" value="'+S.esc(r.name)+'" placeholder="Name"></label><label><small>Number</small><input required data-team-row="'+i+'" data-team-field="number" value="'+S.esc(r.number)+'" inputmode="numeric" placeholder="10"></label><label><small>Size</small><select required data-team-row="'+i+'" data-team-field="size">'+sizes.map(sz=>'<option '+(r.size===sz?'selected':'')+'>'+sz+'</option>').join('')+'</select></label><button type="button" class="team-row-remove" data-team-remove="'+i+'" aria-label="Remove row">'+I('trash')+'</button></div>').join('')+'</div><div class="team-roster-footer"><span><b>'+state.teamRows.length+'</b> row'+(state.teamRows.length===1?'':'s')+'</span><button type="button" class="primary" data-action="team-add-cart">Add team order to cart '+I('cart')+'</button></div></div></section></main>';
  }
  function addTeamToCart(){
    const rows=state.teamRows.map(r=>({name:String(r.name||'').trim(),number:String(r.number||'').trim(),size:String(r.size||'').trim()}));
    if(!state.teamArtwork){showToast('Upload the design first');return;}
    if(!rows.length||rows.some(r=>!r.name||!r.number||!r.size)){showToast('Name, number and size are required for every team row');return;}
    addCart({key:'team-'+Date.now(),itemType:'team_design',name:state.teamType+' team order',code:'CUSTOM',price:0,total:0,qty:rows.length,image:state.teamArtwork,detail:rows.length+' team rows',design:{type:state.teamType,artworkDataUrl:state.teamArtwork,artworkName:state.teamFileName,roster:rows}},true);
  }
  async function compressTeamArtwork(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{const max=1100,scale=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',.78));};im.src=reader.result;};reader.readAsDataURL(file);});}
  function authModal(){
    if(!state.authModal)return'';let body='',title='';
    if(state.authStep==='phone'){
      const enquiryAccount=state.pendingAction==='custom-catalog-enquiry';
      title=enquiryAccount?'Create account to enquire':'Mobile number';
      body=(enquiryAccount?'<p class="auth-intro">Enter your mobile number. We will verify it by OTP and ask your name only if needed.</p>':'')+'<form data-auth-phone><label><span>Phone</span><input name="phone" inputmode="numeric" autocomplete="tel" maxlength="10" pattern="[0-9]{10}" value="'+S.esc(String(state.authPhone||'').replace(/^91/,''))+'" placeholder="10-digit mobile number" required></label><button class="primary wide" type="submit" '+(state.authBusy?'disabled':'')+'>'+(state.authBusy?'Sending…':'Send OTP')+'</button></form>';
    }else if(state.authStep==='otp'){
      title='Enter OTP';
      body='<form data-auth-otp><p class="auth-mini">Sent to +'+S.esc(B?.cleanPhone?.(state.authPhone)||state.authPhone)+'</p><label><span>OTP</span><input name="otp" inputmode="numeric" autocomplete="one-time-code" minlength="4" maxlength="8" pattern="[0-9]{4,8}" value="'+S.esc(state.authOtp)+'" placeholder="OTP" required></label><button class="primary wide" type="submit" '+(state.authBusy?'disabled':'')+'>'+(state.authBusy?'Verifying…':'Verify OTP')+'</button><div class="auth-inline-actions"><button class="text-button" type="button" data-action="auth-resend" '+(state.authBusy?'disabled':'')+'>Resend</button><button class="text-button" type="button" data-action="auth-change-phone">Change number</button></div></form>';
    }else{
      title='Your name';
      body='<form data-auth-name><label><span>Name</span><input name="name" autocomplete="name" minlength="2" maxlength="80" value="'+S.esc(state.authName)+'" placeholder="Full name" required></label><button class="primary wide" type="submit" '+(state.authBusy?'disabled':'')+'>Continue</button></form>';
    }
    return '<div class="auth-overlay"><section class="auth-card simple-auth-card"><button type="button" class="close" data-action="close-auth">'+I('close')+'</button><h2>'+title+'</h2>'+body+(state.authError?'<p class="auth-error">'+S.esc(state.authError)+'</p>':'')+'</section></div>';
  }
  async function continuePendingAction(){const a=state.pendingAction;state.pendingAction='';if(a==='add-product')addSelectedProductToCart();else if(a==='team-add')addTeamToCart();else if(a==='custom-add'&&state.pendingCustomItem){const item=state.pendingCustomItem;state.pendingCustomItem=null;item.itemType='custom_design';addCart(item,true);}else if(a==='checkout'){state.checkoutStep=1;state.orderPlaced=false;go('checkout');}else if(a==='profile-login'){go('profile');}else if(a==='custom-catalog-enquiry'){await submitCustomCatalogEnquiry(state.customItemId);}else render();}
  function legal(){const lines=legalCopy[state.legal]||legalCopy.About;return '<div class="overlay"><div class="legal-panel"><div class="legal-head-actions"><button class="legal-back" data-action="close-legal">'+I('back')+'<span>Back</span></button><button class="close" data-action="close-legal">'+I('close')+'</button></div><span class="eyebrow">STORE INFORMATION</span><h2>'+S.esc(state.legal)+'</h2>'+lines.map(x=>'<p>'+S.esc(x)+'</p>').join('')+'</div></div>';}
  function imageZoomModal(){if(!state.zoomImage)return'';const many=(state.zoomImages||[]).length>1,count=(state.zoomImages||[]).length||1;return '<div class="image-zoom-overlay" data-zoom-overlay><div class="image-zoom-shell" role="dialog" aria-modal="true" aria-label="Product image viewer"><button type="button" class="zoom-close" data-action="close-zoom" aria-label="Close image">'+I('close')+'</button>'+(many?'<button type="button" class="zoom-nav zoom-prev" data-action="zoom-prev" aria-label="Previous image">'+I('back')+'</button><button type="button" class="zoom-nav zoom-next" data-action="zoom-next" aria-label="Next image">'+I('arrow')+'</button>':'')+'<div class="zoom-image-stage" data-zoom-stage><img data-zoom-view src="'+S.esc(state.zoomImage)+'" alt="'+S.esc(state.zoomAlt||'Product image')+'" style="transform:translate3d('+state.zoomX+'px,'+state.zoomY+'px,0) scale('+state.zoomScale+')"></div><div class="zoom-controls"><button type="button" data-action="zoom-out" aria-label="Zoom out">'+I('minus')+'</button><span data-zoom-label>'+Math.round(state.zoomScale*100)+'%</span><span class="zoom-count">'+(state.zoomIndex+1)+' / '+count+'</span><button type="button" data-action="zoom-in" aria-label="Zoom in">'+I('plus')+'</button></div></div></div>'; }
  function paymentModal(){return '<div class="overlay"><div class="payment-modal"><button class="close" data-action="close-payment">'+I('close')+'</button><div class="demo-tag">ORDER CONFIRMATION</div>'+I('card')+'<h2>'+S.money(subtotal())+'</h2><p>Online payment gateway can be connected after the client supplies the selected payment provider credentials.</p><button class="primary wide" data-action="complete-order">Confirm order</button><button class="text-button" data-action="close-payment">Cancel</button></div></div>';}
  function toast(){return state.toast?'<div class="toast">'+I('check')+S.esc(state.toast)+'<button data-go="cart">View cart</button></div>':'';}
  function whatsappFloat(){if(state.screen==='customize')return'';return '<button class="whatsapp-float whatsapp-icon-only contact-float" data-whatsapp-float aria-label="Contact enquiry"><img src="assets/contact-support.webp" alt="Contact"></button>';}
  function page(){return({home,categories:categoriesPage,catalog,product,customCatalog,customCategory,customItem,cart,checkout,orders,profile,teamUpload,b2b,b2bProduct})[state.screen]?.()||home();}

  function render(){
    state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=S.getCustomCatalogCategories?.()||state.customCatalogCategories||[];state.customCatalogItems=S.getCustomCatalogItems?.()||state.customCatalogItems||[];state.settings=S.getSettings();const sess=B?.customerSession?.();if(sess?.token)state.customer={...(state.customer||{}),...sess};
    if(state.screen==='customize'){root.innerHTML='<div class="customizer-screen-wrap"><div id="designer-root"></div>'+footer()+'</div>'+authModal()+toast();window.OneLineDesigner.mount(document.getElementById('designer-root'),{onBack:()=>navigateBack('home'),onAdd:item=>{item.itemType='custom_design';if(!(B?.customerSession?.()?.token)){state.pendingCustomItem=item;state.pendingAction='custom-add';state.authModal=true;state.authStep='phone';state.authError='';render();return;}addCart(item,false);go('cart');}});syncModalScrollLock();bind();return;}
    const audience=state.screen.startsWith('b2b')?'b2b':'retail';
    root.innerHTML='<div class="view-root">'+header()+page()+footer()+bottom()+filterModal(audience)+(state.legal?legal():'')+(state.paymentDemo?paymentModal():'')+authModal()+imageZoomModal()+toast()+whatsappFloat()+'</div>';syncModalScrollLock();bind();bindZoomViewer();positionWhatsapp();
  }
  async function completeOrder(){
    if(!state.cart.length)return;const orderCart=clone(state.cart),orderTotal=subtotal();state.authBusy=true;render();
    const payload={customerName:state.details.name||state.customer?.name||'',phone:state.customer?.phone||state.details.phone||'',address:state.details.address||'',business:state.details.business||'',delivery:state.delivery,payment:state.payment,items:orderCart.map(item=>item.itemType==='team_design'||item.itemType==='custom_design'?{itemType:item.itemType,name:item.name,code:item.code||'CUSTOM',qty:item.qty||1,unitPrice:Number(item.price||0),design:item.design||item.customDesign||{}}:{itemType:'product',productId:item.productId,name:item.name,code:item.code||'',lines:item.bulkLines||[],subitems:item.subitems||[]})};
    try{await cartMutationQueue;if(cartSyncError){state.authBusy=false;showToast('Cart is not fully synced yet. '+cartSyncError);return;}B?.customerEvent?.('order_submit_attempt',{delivery:state.delivery,payment:state.payment,items:orderCart.map(i=>({name:i.name,code:i.code||'',itemType:i.itemType||'product',qty:i.qty||1}))});const r=await B.placeOrder(payload);state.orderReference=r.orderCode||r.id||'ORDER';state.orderPlaced=true;state.paymentDemo=false;state.cart=[];state.cartVersion=Number(state.cartVersion||0)+1;broadcastAccountSync('order');await B.hydrate();await refreshCustomerAccount(false);}
    catch(e){state.authBusy=false;showToast(e.message||'Could not place order');return;}
    state.authBusy=false;render();
  }
  function whatsAppUrl(message){const number=String(state.settings.whatsapp||'').replace(/\D/g,'');const text=encodeURIComponent(message||'Hi, I need a customization quotation.');return number?'https://wa.me/'+number+'?text='+text:'https://wa.me/?text='+text;}
  function openWhatsApp(message){window.open(whatsAppUrl(message),'_blank','noopener');}
  function removeFilter(kind,value){const key=kind==='category'?'filterCategories':kind==='sub'?'filterSubs':'filterOptions';state[key]=state[key].filter(v=>v!==value);saveFilters();render();}
  function positionWhatsapp(){
    const el=root.querySelector('[data-whatsapp-float]');if(!el)return;
    const width=el.offsetWidth||52,height=el.offsetHeight||52;
    let left=Math.max(8,window.innerWidth-width-17),top=Math.max(72,window.innerHeight-height-88);
    try{
      const p=JSON.parse(localStorage.getItem('one-line-wa-position')||'null');
      if(p&&Number.isFinite(p.left)&&Number.isFinite(p.top)){left=p.left;top=p.top;}
    }catch(_){}
    left=Math.max(8,Math.min(window.innerWidth-width-8,left));
    top=Math.max(72,Math.min(window.innerHeight-height-76,top));
    el.style.left=left+'px';el.style.top=top+'px';el.style.right='auto';el.style.bottom='auto';
  }
  function bindWhatsappDrag(){const el=root.querySelector('[data-whatsapp-float]');if(!el)return;let drag=null,moved=false;el.addEventListener('pointerdown',e=>{moved=false;const r=el.getBoundingClientRect();drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top,startX:e.clientX,startY:e.clientY};el.setPointerCapture(e.pointerId);});el.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const left=Math.max(8,Math.min(window.innerWidth-el.offsetWidth-8,e.clientX-drag.dx)),top=Math.max(72,Math.min(window.innerHeight-el.offsetHeight-90,e.clientY-drag.dy));if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)moved=true;el.style.left=left+'px';el.style.top=top+'px';el.style.right='auto';el.style.bottom='auto';});el.addEventListener('pointerup',e=>{if(!drag)return;const r=el.getBoundingClientRect();localStorage.setItem('one-line-wa-position',JSON.stringify({left:r.left,top:r.top}));drag=null;if(!moved)openWhatsApp('Hi, I need a custom apparel quotation.');});el.addEventListener('pointercancel',()=>{drag=null;});}
  function bindHorizontalSlider(track,onChange,onActivate){
    if(!track)return;
    let raf=0;
    const sync=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;onChange?.();});};
    track.addEventListener('scroll',sync,{passive:true});
    if('onscrollend' in track)track.addEventListener('scrollend',sync,{passive:true});
    if(onActivate)track.addEventListener('click',e=>{e.stopPropagation();onActivate(e);});
    sync();
  }

  function bindProductSliders(){
    root.querySelectorAll('[data-card-slider]').forEach(slider=>{
      const track=slider.querySelector('.product-slide-track'),card=slider.closest('[data-open-product],[data-open-custom-item]'),bars=card?.querySelectorAll('.product-slide-progress i');if(!track||!card)return;
      const sync=()=>{const w=track.clientWidth||1,idx=Math.max(0,Math.min((bars?.length||1)-1,Math.round(track.scrollLeft/w)));bars?.forEach((b,i)=>b.classList.toggle('active',i===idx));};
      bindHorizontalSlider(track,sync,()=>{if(card.dataset.openCustomItem){state.customItemId=card.dataset.openCustomItem;const idea=state.customCatalogItems.find(i=>String(i.id)===String(state.customItemId));if(idea?.category_id)state.customCategoryId=idea.category_id;go('customItem');}else openProduct(card.dataset.openProduct,card.dataset.audience);});
    });
  }
  function bindDetailSliders(){
    root.querySelectorAll('[data-detail-slider]').forEach(slider=>{
      const track=slider.querySelector('.detail-slide-track'),bars=slider.querySelectorAll('.detail-slide-progress i');if(!track)return;
      const sync=()=>{const w=track.clientWidth||1,idx=Math.max(0,Math.min((bars?.length||1)-1,Math.round(track.scrollLeft/w)));bars?.forEach((b,i)=>b.classList.toggle('active',i===idx));};
      bindHorizontalSlider(track,sync,null);
    });
  }
  function bindFastUniformCustomizer(){
    const box=root.querySelector('[data-fast-uniform]');if(!box)return;
    const canvas=box.querySelector('[data-fast-uniform-canvas]'),ctx=canvas?.getContext('2d',{willReadFrequently:true});
    const overlay=box.querySelector('[data-fast-picker]'),sv=box.querySelector('[data-fast-sv]'),svCtx=sv?.getContext('2d'),cursor=box.querySelector('[data-fast-sv-cursor]'),hue=box.querySelector('[data-fast-hue]'),hex=box.querySelector('[data-fast-hex]'),preview=box.querySelector('[data-fast-colour-preview]'),dot=box.querySelector('[data-fast-uniform-dot]');
    if(!canvas||!ctx||!overlay||!sv||!svCtx)return;
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const hexToRgb=value=>{let h=String(value||'').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];};
    const rgbToHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
    const rgbToHsl=(r,g,b)=>{r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h=0,s=0,l=(max+min)/2;if(max!==min){const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);if(max===r)h=(g-b)/d+(g<b?6:0);else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return[h*360,s,l];};
    const hslToRgb=(h,s,l)=>{h/=360;let r,g,b;if(!s)r=g=b=l;else{const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;r=f(p,q,h+1/3);g=f(p,q,h);b=f(p,q,h-1/3);}return[r*255,g*255,b*255];};
    const hsvToRgb=(h,s,v)=>{h=((h%360)+360)%360;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return[(r+m)*255,(g+m)*255,(b+m)*255];};
    const rgbToHsv=(r,g,b)=>{r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}if(h<0)h+=360;return[h,max===0?0:d/max,max];};
    let original=null,shirtMask=null,current='#20f12e',pickerH=120,pickerS=.87,pickerV=.945,imgReady=false,maskReady=false;
    const shirt=new Image(),mask=new Image();
    const drawColour=value=>{if(!original||!shirtMask)return;const data=new ImageData(new Uint8ClampedArray(original.data),original.width,original.height),d=data.data,[tr,tg,tb]=hexToRgb(value),[targetH,targetS,targetL]=rgbToHsl(tr,tg,tb);for(let p=0;p<shirtMask.length;p++){if(!shirtMask[p])continue;const i=p*4,[,,l]=rgbToHsl(d[i],d[i+1],d[i+2]);let outS=targetS,outL;if(targetS<.12){outS=0;outL=clamp(targetL+(l-.50)*.55,.035,.965);}else{outS=clamp(targetS*.94,.18,1);outL=clamp(l*.78+targetL*.22,.055,.95);}const[nr,ng,nb]=hslToRgb(targetH,outS,outL);d[i]=nr;d[i+1]=ng;d[i+2]=nb;}ctx.putImageData(data,0,0);};
    const setColour=(value,custom=false)=>{if(!/^#[0-9a-f]{6}$/i.test(value))return;current=value.toLowerCase();if(dot)dot.style.background=current;if(preview)preview.style.background=current;box.querySelectorAll('[data-fast-uniform-colour]').forEach(b=>b.classList.toggle('active',b.dataset.fastUniformColour.toLowerCase()===current));box.querySelector('.fast-uniform-custom-swatch')?.classList.toggle('active',custom||![...box.querySelectorAll('[data-fast-uniform-colour]')].some(b=>b.dataset.fastUniformColour.toLowerCase()===current));drawColour(current);};
    const maybeInit=()=>{if(!imgReady||!maskReady)return;canvas.width=shirt.naturalWidth;canvas.height=shirt.naturalHeight;ctx.drawImage(shirt,0,0);original=ctx.getImageData(0,0,canvas.width,canvas.height);const mc=document.createElement('canvas');mc.width=canvas.width;mc.height=canvas.height;const mx=mc.getContext('2d',{willReadFrequently:true});mx.drawImage(mask,0,0,mc.width,mc.height);const md=mx.getImageData(0,0,mc.width,mc.height).data;shirtMask=new Uint8Array(canvas.width*canvas.height);for(let i=0,p=0;i<md.length;i+=4,p++)shirtMask[p]=md[i]>127?1:0;setColour(current,false);};
    const drawSV=()=>{const w=sv.width,h=sv.height,[rr,gg,bb]=hsvToRgb(pickerH,1,1);svCtx.fillStyle=rgbToHex(rr,gg,bb);svCtx.fillRect(0,0,w,h);let g=svCtx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');svCtx.fillStyle=g;svCtx.fillRect(0,0,w,h);g=svCtx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'#000');svCtx.fillStyle=g;svCtx.fillRect(0,0,w,h);if(cursor){cursor.style.left=(pickerS*100)+'%';cursor.style.top=((1-pickerV)*100)+'%';}};
    const syncHSV=(live=true)=>{const c=rgbToHex(...hsvToRgb(pickerH,pickerS,pickerV));if(hex)hex.value=c.slice(1).toUpperCase();if(preview)preview.style.background=c;drawSV();if(live)setColour(c,true);};
    const syncHex=value=>{if(!/^#[0-9a-f]{6}$/i.test(value))return false;const[h,s,v]=rgbToHsv(...hexToRgb(value));pickerH=h;pickerS=s;pickerV=v;if(hue)hue.value=Math.round(h);drawSV();if(preview)preview.style.background=value;return true;};
    const open=()=>{syncHex(current);if(hex)hex.value=current.slice(1).toUpperCase();if(overlay.parentElement!==document.body){overlay.dataset.fastPickerFloating='1';document.body.appendChild(overlay);}overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.documentElement.classList.add('fast-picker-lock');document.body.classList.add('fast-picker-lock');};
    const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.documentElement.classList.remove('fast-picker-lock');document.body.classList.remove('fast-picker-lock');if(box.isConnected&&overlay.parentElement!==box){delete overlay.dataset.fastPickerFloating;box.appendChild(overlay);}};
    const pick=e=>{const r=sv.getBoundingClientRect(),x=clamp(e.clientX-r.left,0,r.width),y=clamp(e.clientY-r.top,0,r.height);pickerS=x/r.width;pickerV=1-y/r.height;syncHSV(true);};
    shirt.onload=()=>{imgReady=true;maybeInit();};mask.onload=()=>{maskReady=true;maybeInit();};shirt.src='assets/fast-uniform/shirt-preview.webp';mask.src='assets/fast-uniform/shirt-mask.png';
    box.querySelectorAll('[data-fast-uniform-colour]').forEach(b=>b.addEventListener('click',()=>setColour(b.dataset.fastUniformColour,false)));
    box.querySelectorAll('[data-fast-uniform-open]').forEach(b=>b.addEventListener('click',open));
    box.querySelector('[data-fast-uniform-reset]')?.addEventListener('click',()=>setColour('#20f12e',false));
    box.querySelector('[data-fast-picker-close]')?.addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    box.querySelector('[data-fast-picker-apply]')?.addEventListener('click',()=>{const value='#'+String(hex?.value||'').trim();if(syncHex(value))setColour(value,true);close();});
    hue?.addEventListener('input',e=>{pickerH=+e.target.value;syncHSV(true);});
    hex?.addEventListener('input',e=>{const v=e.target.value.replace(/[^0-9a-f]/gi,'').slice(0,6);e.target.value=v.toUpperCase();if(v.length===6){const value='#'+v;syncHex(value);setColour(value,true);}});
    sv.addEventListener('pointerdown',e=>{try{sv.setPointerCapture(e.pointerId);}catch(_){}pick(e);});
    sv.addEventListener('pointermove',e=>{if(e.buttons)pick(e);});
  }
  function bind(){
    root.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',()=>go(x.dataset.go)));
    root.querySelectorAll('[data-click-go]').forEach(x=>{const open=()=>go(x.dataset.clickGo);x.addEventListener('click',open);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
    root.querySelectorAll('[data-team-open]').forEach(x=>x.addEventListener('click',()=>{state.teamType=x.dataset.teamOpen;go('teamUpload');}));
    root.querySelectorAll('[data-open-product]').forEach(x=>x.addEventListener('click',e=>{if(e.target.closest('.product-slide-track'))return;e.stopPropagation();openProduct(x.dataset.openProduct,x.dataset.audience);}));
    root.querySelectorAll('[data-category]').forEach(x=>{x.addEventListener('click',e=>{if(e.target.closest('[data-share-kind]'))return;resetFilters(x.dataset.category);go('catalog');});x.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-share-kind]')){e.preventDefault();resetFilters(x.dataset.category);go('catalog');}});});
    root.querySelectorAll('[data-open-custom-category]').forEach(x=>{const open=e=>{if(e?.target?.closest?.('[data-share-kind]'))return;state.customCategoryId=x.dataset.openCustomCategory;go('customCategory');};x.addEventListener('click',open);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}});});
    root.querySelectorAll('[data-open-custom-item]').forEach(x=>x.addEventListener('click',e=>{if(e.target.closest('.product-slide-track,[data-share-kind]'))return;state.customItemId=x.dataset.openCustomItem;const idea=state.customCatalogItems.find(i=>String(i.id)===String(state.customItemId));if(idea?.category_id)state.customCategoryId=idea.category_id;go('customItem');}));
    root.querySelectorAll('[data-legal]').forEach(x=>x.addEventListener('click',()=>{if(x.closest('.site-header nav')&&state.menu)clearMenuModalState();openLegal(x.dataset.legal);}));
    const catalogSearch=root.querySelector('[data-catalog-search]');if(catalogSearch)catalogSearch.addEventListener('input',e=>{state.catalogQuery=e.target.value;render();requestAnimationFrame(()=>{const n=root.querySelector('[data-catalog-search]');if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length);}catch(_){}}});});
    root.querySelectorAll('[data-product-color]').forEach(x=>x.addEventListener('click',()=>{state.color=x.dataset.productColor;state.previewImage='';state.bulkQty={};render();}));
    root.querySelectorAll('[data-product-image]').forEach(x=>x.addEventListener('click',()=>{if(state.selected)state.previewImage=x.dataset.productImage;render();}));
    root.querySelectorAll('[data-bulk-key]').forEach(x=>x.addEventListener('change',()=>{state.bulkQty[x.dataset.bulkKey]=Math.max(0,Number(x.value||0));render();}));
    root.querySelectorAll('[data-subitem-id]').forEach(x=>x.addEventListener('change',()=>{state.selectedSubitems[x.dataset.subitemId]=x.checked;if(!state.subBulkQty[x.dataset.subitemId])state.subBulkQty[x.dataset.subitemId]={};render();}));
    root.querySelectorAll('[data-sub-bulk-id]').forEach(x=>x.addEventListener('change',()=>{const id=x.dataset.subBulkId;if(!state.subBulkQty[id])state.subBulkQty[id]={};state.subBulkQty[id][x.dataset.subBulkKey]=Math.max(0,Number(x.value||0));render();}));
    root.querySelectorAll('[data-qty]').forEach(x=>x.addEventListener('click',()=>{const item=state.cart.find(i=>i.key===x.dataset.key);if(item){item.qty=Math.max(1,item.qty+Number(x.dataset.qty));queueCartMutation('upsert',item.key,item);}render();}));
    root.querySelectorAll('[data-remove-key]').forEach(x=>x.addEventListener('click',()=>{const item=state.cart.find(i=>i.key===x.dataset.removeKey);state.cart=state.cart.filter(i=>i.key!==x.dataset.removeKey);queueCartMutation('remove',x.dataset.removeKey,null);B?.customerEvent?.('cart_remove',{item:{name:item?.name||'',code:item?.code||''}});render();}));
    root.querySelectorAll('[data-delivery]').forEach(x=>x.addEventListener('click',()=>{state.delivery=x.dataset.delivery;render();}));
    root.querySelectorAll('[data-payment]').forEach(x=>x.addEventListener('click',()=>{state.payment=x.dataset.payment;render();}));
    root.querySelectorAll('[data-remove-filter]').forEach(x=>x.addEventListener('click',()=>removeFilter(x.dataset.removeFilter,x.dataset.value)));
    root.querySelectorAll('[data-share-kind]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shareItem(x.dataset.shareKind,x.dataset.shareValue||'',x.dataset.shareLabel||'',x.dataset.shareExtra||'');}));
    root.querySelectorAll('[data-zoom-image]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openZoom(x.dataset.zoomImage,x.dataset.zoomAlt||'');}));
    root.querySelectorAll('[data-team-type]').forEach(x=>x.addEventListener('click',()=>{state.teamType=x.dataset.teamType;render();}));
    root.querySelectorAll('[data-team-row]').forEach(x=>x.addEventListener('input',()=>{const i=Number(x.dataset.teamRow);if(state.teamRows[i])state.teamRows[i][x.dataset.teamField]=x.value;}));
    root.querySelectorAll('[data-team-row] select').forEach(()=>{});
    root.querySelectorAll('select[data-team-row]').forEach(x=>x.addEventListener('change',()=>{const i=Number(x.dataset.teamRow);if(state.teamRows[i])state.teamRows[i][x.dataset.teamField]=x.value;}));
    root.querySelectorAll('[data-team-remove]').forEach(x=>x.addEventListener('click',()=>{if(state.teamRows.length===1)state.teamRows=[{name:'',number:'',size:'M'}];else state.teamRows.splice(Number(x.dataset.teamRemove),1);render();}));
    const artwork=root.querySelector('[data-team-artwork]');if(artwork)artwork.addEventListener('change',async()=>{const file=artwork.files?.[0];if(!file)return;try{state.teamArtwork=await compressTeamArtwork(file);state.teamFileName=file.name;render();}catch(_){showToast('Could not read that image');}});
    const b2bForm=root.querySelector('[data-b2b-login]');if(b2bForm)b2bForm.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(b2bForm);const settings=S.getSettings();if(String(fd.get('id')).trim()===String(settings.b2bId)&&String(fd.get('password'))===String(settings.b2bPassword)){state.b2bAuthed=true;state.b2bError='';sessionStorage.setItem('one-line-b2b-auth','1');render();}else{state.b2bError='Invalid B2B login ID or password.';render();}});
    root.querySelectorAll('[data-filter-choice]').forEach(x=>x.addEventListener('click',()=>{const d=state.filterDraft,k=x.dataset.filterChoice,v=x.dataset.value;const arr=d[k];const i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else arr.push(v);if(k==='categories'){const allowedSubs=filterPool(state.screen.startsWith('b2b')?'b2b':'retail').filter(p=>!d.categories.length||d.categories.includes(p.category)).map(p=>p.subcategory);d.subs=d.subs.filter(s=>allowedSubs.includes(s));}render();}));

    const phoneForm=root.querySelector('[data-auth-phone]');if(phoneForm)phoneForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(phoneForm);state.authPhone=String(fd.get('phone')||'').trim();state.authError='';state.authBusy=true;render();try{await B.requestOtp(state.authPhone);state.authStep='otp';state.authOtp='';}catch(err){state.authError=err.message||'Could not send OTP';}finally{state.authBusy=false;render();}});
    const otpForm=root.querySelector('[data-auth-otp]');if(otpForm)otpForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(otpForm);state.authOtp=String(fd.get('otp')||'').trim();state.authError='';state.authBusy=true;render();try{const r=await B.verifyOtp(state.authPhone,state.authOtp,'');state.customer=r.session||B.customerSession();state.accountLoaded=false;state.authName=state.customer?.name||'';if(String(state.customer?.name||'').trim().length>=2){state.authModal=false;await refreshCustomerAccount(false);state.authBusy=false;broadcastAccountSync('login');await continuePendingAction();return;}state.accountLoaded=true;state.authStep='name';}catch(err){state.authError=err.message||'Invalid OTP';}finally{state.authBusy=false;render();}});
    const nameForm=root.querySelector('[data-auth-name]');if(nameForm)nameForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(nameForm);state.authName=String(fd.get('name')||'').trim();if(!state.authName)return;state.authBusy=true;state.authError='';render();try{const saved=await B.updateCustomerProfile({name:state.authName,businessName:state.customer?.businessName||'',jobTitle:state.customer?.jobTitle||''});state.customer={...(B.customerSession()||state.customer||{}),name:saved?.name||state.authName,businessName:saved?.businessName||'',jobTitle:saved?.jobTitle||''};B.setCustomerSession(state.customer);state.accountLoaded=true;state.authModal=false;broadcastAccountSync('profile');await refreshCustomerAccount(false);state.authBusy=false;await continuePendingAction();}catch(err){state.authBusy=false;state.authError=err.message||'Could not save name';render();}});

    const profileNameForm=root.querySelector('[data-profile-name]');if(profileNameForm)profileNameForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(profileNameForm),profile={name:String(fd.get('name')||'').trim(),businessName:String(fd.get('businessName')||'').trim(),jobTitle:String(fd.get('jobTitle')||'').trim()};if(profile.name.length<2)return;try{const saved=await B.updateCustomerProfile(profile);state.customer={...(B?.customerSession?.()||state.customer||{}),name:saved?.name||profile.name,businessName:saved?.businessName||profile.businessName,jobTitle:saved?.jobTitle||profile.jobTitle};B?.setCustomerSession?.(state.customer);state.details.name=state.customer.name;state.details.business=state.customer.businessName||'';state.profileEditing=false;broadcastAccountSync('profile');render();showToast('Profile saved');}catch(err){showToast(err.message||'Could not save profile');}});

    root.querySelectorAll('[data-action]').forEach(x=>x.addEventListener('click',async()=>{
      const a=x.dataset.action,fromDrawer=!!x.closest('.site-header nav');
      if(fromDrawer&&state.menu&&a!=='close-menu'&&a!=='menu')clearMenuModalState();
      if(a==='menu'){if(state.menu)closeMenu(false);else openMenu();}
      else if(a==='close-menu'){closeMenu(false);}
      else if(a==='nav-back')navigateBack(x.dataset.fallback||'home');
      else if(a==='install'){await install();if(fromDrawer)render();}
      else if(a==='open-filter'){state.filterDraft={categories:clone(state.filterCategories),subs:clone(state.filterSubs),options:clone(state.filterOptions)};state.filterOpen=true;render();}
      else if(a==='close-filter')closeFilter(false);
      else if(a==='reset-filter-draft'){state.filterDraft={categories:[],subs:[],options:[]};render();}
      else if(a==='apply-filter'){commitFilterDraft();state.filterOpen=false;state.filterDraft=null;render();}
      else if(a==='clear-filters'){resetFilters();render();}
      else if(a==='add-product'){if(requireCustomer('add-product'))addSelectedProductToCart();}
      else if(a==='team-add-row'){state.teamRows.push({name:'',number:'',size:'M'});render();}
      else if(a==='team-add-cart'){if(requireCustomer('team-add'))addTeamToCart();}
      else if(a==='close-auth')closeAuth();
      else if(a==='auth-resend'){state.authBusy=true;state.authError='';render();try{await B.retryOtp();showToast('OTP resent');}catch(err){state.authError=err.message||'Could not resend OTP';}finally{state.authBusy=false;render();}}
      else if(a==='auth-change-phone'){window.OneLineOTP?.reset?.();state.authStep='phone';state.authOtp='';state.authError='';render();}
      else if(a==='profile-login'){requireCustomer('profile-login');}
      else if(a==='profile-edit'){state.profileEditing=true;render();}
      else if(a==='profile-cancel-edit'){state.profileEditing=false;render();}
      else if(a==='profile-logout'){B?.clearCustomerSession?.();state.customer=null;state.cart=[];state.orders=[];state.cartVersion=0;state.ordersStamp='';state.accountLoaded=false;state.profileEditing=false;window.OneLineOTP?.reset?.();broadcastAccountSync('logout');render();}
      else if(a==='checkout'){if(!state.customer?.token){requireCustomer('checkout');return;}B?.customerEvent?.('checkout_started',{cartItems:state.cart.length,pieces:totalQty(),items:state.cart.map(i=>({name:i.name,code:i.code||'',itemType:i.itemType||'product',qty:i.qty||1}))});state.checkoutStep=1;state.orderPlaced=false;go('checkout');}
      else if(a==='delivery-step'){const form=root.querySelector('[data-checkout-form]');if(form?.reportValidity()){const fd=new FormData(form);state.details=Object.fromEntries(fd.entries());state.checkoutStep=2;render();}}
      else if(a==='submit-order')await completeOrder();
      else if(a==='close-payment'){state.paymentDemo=false;render();}
      else if(a==='complete-order')await completeOrder();
      else if(a==='close-legal'){closeLegal(false);}
      else if(a==='view-order'){state.orderPlaced=false;go('orders');}
      else if(a==='whatsapp'){openWhatsApp(x.dataset.message||'Hi, I need a custom apparel quotation.');if(fromDrawer)render();}
      else if(a==='uniform-enquiry')openWhatsApp('Hi, I need a fast uniform customization quote. Please share options for garment colour, logo/text, sizes and quantity.');
      else if(a==='custom-catalog-enquiry'){state.customItemId=x.dataset.itemId||state.customItemId;if(requireCustomer('custom-catalog-enquiry'))await submitCustomCatalogEnquiry(state.customItemId);}
      else if(a==='close-zoom')closeZoom();
      else if(a==='zoom-prev')changeZoomImage(-1);
      else if(a==='zoom-next')changeZoomImage(1);
      else if(a==='zoom-in'){state.zoomScale=Math.min(4,Math.round((state.zoomScale+.25)*100)/100);if(state.zoomScale===1){state.zoomX=0;state.zoomY=0;}render();}
      else if(a==='zoom-out'){state.zoomScale=Math.max(1,Math.round((state.zoomScale-.25)*100)/100);if(state.zoomScale===1){state.zoomX=0;state.zoomY=0;}render();}
      else if(a==='b2b-logout'){state.b2bAuthed=false;sessionStorage.removeItem('one-line-b2b-auth');state.b2bError='';render();}
    }));
    const overlay=root.querySelector('.catalog-filter-overlay');if(overlay)overlay.addEventListener('click',e=>{if(e.target===overlay)closeFilter(false);});
    const zoomOverlay=root.querySelector('[data-zoom-overlay]');if(zoomOverlay)zoomOverlay.addEventListener('click',e=>{if(e.target===zoomOverlay)closeZoom();});
    bindWhatsappDrag();bindProductSliders();bindDetailSliders();bindFastUniformCustomizer();
  }
  function syncModalScrollLock(){
    const locked=!!(state.menu||state.filterOpen||state.zoomImage||state.authModal);
    document.documentElement.classList.toggle('modal-scroll-lock',locked);
    document.body.classList.toggle('modal-scroll-lock',locked);
  }
  function bindZoomViewer(){
    const stage=root.querySelector('[data-zoom-stage]'),image=root.querySelector('[data-zoom-view]'),label=root.querySelector('[data-zoom-label]');
    if(!stage||!image)return;
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    let pinchStart=0,pinchScale=state.zoomScale,panStart=null,swipeStart=null,lastTap=0,gestureMoved=false;
    const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    const limits=()=>({x:Math.max(0,(stage.clientWidth*(state.zoomScale-1))/2),y:Math.max(0,(stage.clientHeight*(state.zoomScale-1))/2)});
    const apply=()=>{
      const lim=limits();state.zoomX=clamp(state.zoomX,-lim.x,lim.x);state.zoomY=clamp(state.zoomY,-lim.y,lim.y);
      image.style.transform='translate3d('+state.zoomX+'px,'+state.zoomY+'px,0) scale('+state.zoomScale+')';if(label)label.textContent=Math.round(state.zoomScale*100)+'%';
    };
    stage.addEventListener('touchstart',e=>{
      gestureMoved=false;
      if(e.touches.length===2){e.preventDefault();pinchStart=distance(e.touches);pinchScale=state.zoomScale;panStart=null;swipeStart=null;}
      else if(e.touches.length===1){const t=e.touches[0];if(state.zoomScale>1)panStart={x:t.clientX,y:t.clientY,ox:state.zoomX,oy:state.zoomY};else swipeStart={x:t.clientX,y:t.clientY};}
    },{passive:false});
    stage.addEventListener('touchmove',e=>{
      if(e.touches.length===2&&pinchStart){e.preventDefault();gestureMoved=true;state.zoomScale=clamp(pinchScale*(distance(e.touches)/pinchStart),1,5);if(state.zoomScale<=1.01){state.zoomScale=1;state.zoomX=0;state.zoomY=0;}apply();}
      else if(e.touches.length===1&&panStart&&state.zoomScale>1){e.preventDefault();gestureMoved=true;const t=e.touches[0];state.zoomX=panStart.ox+(t.clientX-panStart.x);state.zoomY=panStart.oy+(t.clientY-panStart.y);apply();}
      else if(e.touches.length===1&&swipeStart&&state.zoomScale===1){const t=e.touches[0],dx=t.clientX-swipeStart.x,dy=t.clientY-swipeStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>8)gestureMoved=true;e.preventDefault();}
    },{passive:false});
    stage.addEventListener('touchend',e=>{
      if(e.touches.length<2){pinchStart=0;pinchScale=state.zoomScale;}
      if(e.touches.length===0){
        const end=e.changedTouches?.[0],start=swipeStart;panStart=null;swipeStart=null;
        if(state.zoomScale===1&&start&&end){const dx=end.clientX-start.x,dy=end.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.15&&(state.zoomImages||[]).length>1){changeZoomImage(dx<0?1:-1);return;}}
        const now=Date.now();if(!gestureMoved&&now-lastTap<320){state.zoomScale=state.zoomScale>1?1:2;state.zoomX=0;state.zoomY=0;apply();lastTap=0;}else if(!gestureMoved){lastTap=now;}
      }
    },{passive:true});
    stage.addEventListener('dblclick',e=>{e.preventDefault();state.zoomScale=state.zoomScale>1?1:2;state.zoomX=0;state.zoomY=0;apply();});
    apply();
  }
  async function install(){if(state.installPrompt){await state.installPrompt.prompt();state.installPrompt=null;}else showToast('Use your browser menu and choose “Install app”');}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;render();});
  window.addEventListener('appinstalled',()=>{state.installPrompt=null;render();});
  window.addEventListener('storage',e=>{state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=S.getCustomCatalogCategories?.()||[];state.customCatalogItems=S.getCustomCatalogItems?.()||[];state.settings=S.getSettings();if(e.key===(window.ONE_LINE_CONFIG?.CUSTOMER_SESSION_KEY||'one-line-customer-session-v1')){const sess=B?.customerSession?.();if(sess?.token){state.customer={...(state.customer||{}),...sess};state.accountLoaded=false;refreshCustomerAccount(true);}else{state.customer=null;state.cart=[];state.orders=[];state.accountLoaded=false;render();}}else render();});
  window.addEventListener('one-line-change',()=>{state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=S.getCustomCatalogCategories?.()||[];state.customCatalogItems=S.getCustomCatalogItems?.()||[];state.settings=S.getSettings();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pollCustomerAccount(true);});
  document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('dragstart',e=>{if(!e.target.closest('input[type=file]'))e.preventDefault();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.zoomImage){closeZoom();}else if(e.key==='Escape'&&state.filterOpen){closeFilter(false);}else if(e.key==='Escape'&&state.menu){closeMenu(false);}if((e.ctrlKey||e.metaKey)&&['+','-','=','0'].includes(e.key))e.preventDefault();});document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
  try{
    const valid=['home','categories','catalog','product','customCatalog','customCategory','customItem','cart','checkout','orders','profile','customize','teamUpload','b2b','b2bProduct'];const hash=location.hash.replace('#','');const params=new URLSearchParams(location.search);let initial=valid.includes(hash)?hash:'home';
    const sharedCategory=params.get('category'),sharedSub=params.get('subcategory'),sharedProduct=params.get('product'),sharedAudience=params.get('audience'),sharedSection=params.get('section'),sharedCustomCategory=params.get('customCategory'),sharedCustomItem=params.get('customItem');
    if(sharedCategory){state.filterCategories=[sharedCategory];state.filterSubs=sharedSub?[sharedSub]:[];state.filterOptions=[];saveFilters();initial='catalog';}
    if(sharedProduct){const p=state.products.find(x=>String(x.id)===String(sharedProduct));if(p){state.selected=p;state.previewImage='';state.color=p.colors?.[0]||p.colorVariants?.[0]?.color||'';const sizes=state.color?p.colorVariants?.find(v=>v.color===state.color)?.sizes:p.sizes;state.size=(sizes||p.sizes||[])[0]||'';state.subItem=false;state.subColor=p.subItem?.colors?.[0]||p.subItem?.colorVariants?.[0]?.color||'';const subSizes=state.subColor?p.subItem?.colorVariants?.find(v=>String(v.color).toLowerCase()===String(state.subColor).toLowerCase())?.sizes:p.subItem?.sizes;state.subSize=(subSizes||p.subItem?.sizes||[])[0]||'';initial=(sharedAudience==='b2b'||p.audience==='b2b')?'b2bProduct':'product';}}
    if(sharedCustomItem){state.customItemId=sharedCustomItem;initial='customItem';}else if(sharedCustomCategory){state.customCategoryId=sharedCustomCategory;initial='customCategory';}
    state.screen=initial;state.sharedSection=sharedSection||'';
    if(!history.state?.oneLineGuard){history.replaceState({oneLine:true,oneLineGuard:true,guardBase:true,screen:'home',scrollY:0},'',location.pathname+location.search+'#home');history.pushState({oneLine:true,oneLineGuard:true,screen:initial,scrollY:0},'',location.pathname+location.search+'#'+initial);}else history.replaceState({...history.state,oneLine:true,oneLineGuard:true,screen:initial},'',location.pathname+location.search+'#'+initial);
  }catch(_){}
  window.addEventListener('popstate',e=>{
    if(state.menu){state.menu=false;state.filterOpen=false;state.filterDraft=null;syncModalScrollLock();render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||window.scrollY||0)));return;}
    if(e.state?.guardBase){state.screen='home';state.menu=false;state.filterOpen=false;state.filterDraft=null;state.legal='';resetZoomState();syncModalScrollLock();render();requestAnimationFrame(()=>window.scrollTo(0,0));setTimeout(()=>{try{history.pushState({oneLine:true,oneLineGuard:true,screen:'home',scrollY:0},'',location.pathname+location.search+'#home');}catch(_){}},0);return;}
    const next=e.state?.oneLine?e.state.screen:'home';
    if(e.state?.oneLineModal==='legal'){state.screen=next||state.screen;state.legal=e.state.legal||'About';state.menu=false;state.filterOpen=false;state.filterDraft=null;render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||0)));return;}
    if(state.legal && !e.state?.oneLineModal){state.legal='';state.screen=next||state.screen;state.menu=false;state.filterOpen=false;state.filterDraft=null;render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||0)));return;}
    if(e.state?.oneLineZoom){state.screen=next||state.screen;const gallery=state.selected?productGallery(state.selected):[];state.zoomImages=gallery.length?gallery:[e.state.zoomSrc].filter(Boolean);state.zoomIndex=Math.max(0,Math.min(state.zoomImages.length-1,Number(e.state.zoomIndex||0)));state.zoomImage=e.state.zoomSrc||state.zoomImages[state.zoomIndex]||'';state.zoomAlt=e.state.zoomAlt||'Product image';state.zoomScale=1;state.zoomX=0;state.zoomY=0;render();return;}
    resetZoomState();state.legal='';state.screen=next||'home';state.menu=false;state.filterOpen=false;state.filterDraft=null;render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||0)));
  });
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=47').catch(()=>{});render();B?.ready?.().then(async r=>{state.backendReady=true;if(r?.error)state.backendError=r.error.message||String(r.error);state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=S.getCustomCatalogCategories?.()||r?.customCategories||[];state.customCatalogItems=S.getCustomCatalogItems?.()||r?.customItems||[];state.settings=S.getSettings();const cqp=new URLSearchParams(location.search);if(cqp.get('customItem')){state.customItemId=cqp.get('customItem');const sharedIdea=state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId));if(sharedIdea?.category_id)state.customCategoryId=sharedIdea.category_id;state.screen='customItem';}else if(cqp.get('customCategory')){state.customCategoryId=cqp.get('customCategory');state.screen='customCategory';}if(B?.customerSession?.()?.token)await refreshCustomerAccount(false);const qp=new URLSearchParams(location.search).get('product');if(qp&&!state.selected){const p=state.products.find(x=>String(x.id)===String(qp));if(p){state.selected=p;state.color=p.colors?.[0]||'';state.screen=p.audience==='b2b'?'b2bProduct':'product';}}render();setInterval(()=>pollCustomerAccount(false),2500);}).catch(e=>{state.backendReady=true;state.backendError=e.message||String(e);render();});if(state.sharedSection==='shirt-colour'){setTimeout(()=>document.querySelector('[data-fast-uniform]')?.scrollIntoView({behavior:'auto',block:'start'}),120);}
})();
