(function(){
  "use strict";
  const S=window.OneLineStore,B=window.OneLineBackend,I=S.icon,root=document.getElementById('app');
  const clone=v=>typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v));
  const state={
    screen:'home',products:S.getProducts(),categories:S.getCategories(),customCatalogCategories:S.getCustomCatalogCategories?.()||[],customCatalogItems:S.getCustomCatalogItems?.()||[],customCatalogFabrics:S.getCustomCatalogFabrics?.()||[],customSportswearFabrics:S.getCustomSportswearFabrics?.()||[],customSportswearTypes:S.getCustomSportswearTypes?.()||[],customPrintTypes:S.getCustomPrintTypes?.()||[],printableIncludePrint:false,printablePrintQty:{},printableSelectedPrintIds:[],printableActivePrintId:'',printableActivePrintSize:'',printInfoId:'',fabricPricingLoading:false,fabricPricingError:'',customCategoryId:'',customItemId:'',customFabricId:'',customQuality:'',customSportswearTypeId:'',sportswearSizeQty:{},uniformTopId:'',uniformBottomId:'',uniformOptionIds:[],uniformSizeQty:{},uniformGalleryVariantId:'',enquiryBusyId:'',enquirySuccessId:'',cart:[],orders:[],enquiries:[],settings:S.getSettings(),
    filterCategories:[],filterSubs:[],filterOptions:[],filterOpen:false,filterDraft:null,selected:null,previewImage:'',color:'',size:'',menu:false,
    bulkQty:{},
    teamStep:1,teamUnlockedStep:1,teamFront:{background:'',fileName:'',layers:[]},teamBack:{background:'',fileName:'',layers:[{id:'team-name',type:'fixedText',text:'NAME',x:50,y:24,sizePct:7},{id:'team-number',type:'fixedText',text:'99',x:50,y:55,sizePct:22}]},teamRows:[{name:'',number:'',size:'M'}],teamActiveLayer:'',teamCrop:null,teamEnquiryBusy:false,teamEnquirySuccess:false,pendingCustomItem:null,
    authModal:false,authStep:'phone',authPhone:'',authOtp:'',authName:'',authBusy:false,authError:'',pendingAction:'',customer:B?.customerSession?.()||null,
    backendReady:false,backendError:'',catalogQuery:'',catalogueShown:{},catalogueSearchQueries:{custom:'',ready:''},headerSearchQuery:'',headerSearchOpen:false,addresses:[],addressEditor:null,selectedAddressId:'',orderDetailId:'',accountLoaded:false,accountSyncing:false,cartVersion:0,cartUpdatedAt:'',ordersStamp:'',enquiriesStamp:'',profileUpdatedAt:'',
    toast:'',legal:'',checkoutStep:1,details:{name:'',phone:'',address:'',business:''},delivery:'Courier',payment:'Cash on delivery',paymentDemo:false,remarks:'',redeemInput:'',redeemApplied:null,redeemBusy:false,redeemError:'',
    orderPlaced:false,orderReference:'',orderSubmitting:false,directOrderItem:null,installPrompt:null,zoomImage:'',zoomAlt:'',zoomImages:[],zoomIndex:0,zoomScale:1,zoomX:0,zoomY:0
  };
  state.customCatalogCategories=(state.customCatalogCategories||[]).map(c=>['uniform','kids uniform'].includes(String(c.name||'').trim().toLowerCase())?{...c,name:'Uniform'}:c);
  // Preserve unfinished customer forms when the browser backgrounds, reloads, or re-renders.
  const customerDraftId=()=>String(state.customer?.customerId||state.customer?.phone||B?.customerSession?.()?.customerId||B?.customerSession?.()?.phone||'');
  const draftKey=kind=>{const id=customerDraftId();return id?'one-line-'+kind+'-draft-v1-'+id:'';};
  function readDraft(kind){try{const key=draftKey(kind);return key?JSON.parse(localStorage.getItem(key)||'null'):null;}catch(_){return null;}}
  function writeDraft(kind,data){try{const key=draftKey(kind);if(key)localStorage.setItem(key,JSON.stringify(data));}catch(_){}}
  function clearDraft(kind){try{const key=draftKey(kind);if(key)localStorage.removeItem(key);}catch(_){}}
  function saveAddressDraft(){const form=root.querySelector('[data-saved-address-form]');if(state.addressEditor===null||!form)return;writeDraft('address',{editorId:String(state.addressEditor),values:Object.fromEntries(new FormData(form).entries()),isDefault:!!form.elements.isDefault?.checked});}
  const savedAddressDraft=readDraft('address');
  if(savedAddressDraft&&typeof savedAddressDraft.editorId==='string')state.addressEditor=savedAddressDraft.editorId;
  const filterKey='one-line-catalog-filters-v1';
  try{const saved=JSON.parse(localStorage.getItem(filterKey)||'null');if(saved){state.filterCategories=Array.isArray(saved.categories)?saved.categories:[];state.filterSubs=Array.isArray(saved.subs)?saved.subs:[];state.filterOptions=Array.isArray(saved.options)?saved.options:[];}}catch(_){}
  const legalCopy={
    'About':[
      'OneLine is a custom apparel and bulk garment ordering platform for T-shirts, polos, sportswear, uniforms. Customers can create a design in the browser, upload separate front and back creative designs for a team enquiry, or order catalogue products in multiple sizes.',
      'Catalogue products and available stock are managed from the OneLine admin system. Empty categories stay hidden until an active product is available.',
      'For team enquiries, customers can upload front and back artwork, place extra logos and fixed NAME / 99 references, then submit each player’s name, number and size as separate rows.'
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
      'Administrative access is separated by role for admin, management and staff workflows.'
    ],
    'Shipping & Returns':[
      'Available delivery methods are shown during checkout. Delivery timing depends on stock, customization work, order quantity and the selected delivery method.',
      'Bulk and customized orders may require production time before dispatch. Any delivery charge or special transport arrangement is confirmed with the order.',
      'For a manufacturing defect or an item materially different from the confirmed order, contact OneLine with the order reference and supporting photos so the issue can be reviewed.',
      'Because personalized products are produced to the submitted design and size quantities, change-of-mind returns are generally not available after production begins.'
    ]
  };
  const WHATSAPP_NUMBER='919562886917';
  const WHATSAPP_LOGO='https://upload.wikimedia.org/wikipedia/commons/4/4c/WhatsApp_Logo_green.svg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original';
  const whatsappLogo=()=>'<img class="whatsapp-logo" src="'+WHATSAPP_LOGO+'" alt="" aria-hidden="true">';

  // Keep a direct Buy Now selection separate from the saved Cart, including after OTP / page reload.
  const DIRECT_ORDER_KEY='one-line-direct-checkout-v160';
  try{const saved=JSON.parse(sessionStorage.getItem(DIRECT_ORDER_KEY)||'null');if(saved?.item&&Date.now()-Number(saved.at||0)<45*60*1000)state.directOrderItem=saved.item;else sessionStorage.removeItem(DIRECT_ORDER_KEY);}catch(_){try{sessionStorage.removeItem(DIRECT_ORDER_KEY);}catch(__){}}
  function clearDirectCheckout(){state.directOrderItem=null;try{sessionStorage.removeItem(DIRECT_ORDER_KEY);}catch(_){}}
  function startDirectCheckout(item){
    ensureCartKey(item);state.directOrderItem=item;state.checkoutStep=1;state.orderPlaced=false;state.redeemInput='';state.redeemApplied=null;state.redeemError='';
    try{sessionStorage.setItem(DIRECT_ORDER_KEY,JSON.stringify({at:Date.now(),item}));}catch(_){}
    go('checkout');
  }
  const checkoutItems=()=>state.directOrderItem?[state.directOrderItem]:state.cart;
  const totalQty=(items=state.cart)=>items.reduce((n,x)=>n+(Array.isArray(x.bulkLines)?x.bulkLines.reduce((a,l)=>a+Number(l.qty||0),0):Number(x.qty||0)),0);
  const subtotal=(items=state.cart)=>items.reduce((n,x)=>n+(x.total!=null?Number(x.total||0):Number(x.price||0)*Number(x.qty||0)),0);
  const retailProducts=()=>[];
  const img=(src,alt,cls,fallback)=>{
    const original=String(src||fallback||'assets/product-placeholder.svg');
    const optimized=S.cdnImageUrl?.(original)||original;
    const defaultSrc=String(fallback||'assets/product-placeholder.svg');
    // If a Pages Function is not deployed yet, retry the original public image URL.
    return '<img src="'+S.esc(optimized)+'" data-origin-src="'+S.esc(original)+'" alt="'+S.esc(alt||'')+'" class="'+S.esc(cls||'')+'" loading="lazy" decoding="async" fetchpriority="low" onerror="if(!this.dataset.originRetried && this.dataset.originSrc && this.dataset.originSrc!==this.getAttribute(\'src\')){this.dataset.originRetried=\'1\';this.src=this.dataset.originSrc;return;}this.onerror=null;this.src=\''+S.esc(defaultSrc)+'\'">';
  };
  function logo(compact){return '<div class="brand" aria-label="One-Line"><img class="brand-mark" src="one-line-logo.webp" alt="">'+(compact?'':'<span class="brand-copy"><b>One-Line</b><small>TOUCH SHOPPING</small></span>')+'</div>';}
  const QUARTZ_SITE='https://quartzwebsolutions.com';
  let uniformActionDockHandler=null;
  
  function clearMenuModalState(){if(!state.menu)return;try{if(history.state?.oneLineModal==='menu'){const next={...(history.state||{})};delete next.oneLineModal;history.replaceState(next,'',location.href);}}catch(_){}state.menu=false;root.querySelector('.site-header nav.open')?.classList.remove('open');root.querySelector('.menu-scrim')?.remove();syncModalScrollLock();}
  function showToast(text){state.toast=text;render();setTimeout(()=>{if(state.toast===text){state.toast='';render();}},2200);}
  function rememberScroll(){
    try{if(history.state?.oneLine)history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);}catch(_){}
  }
  const routeParams=['product','category','subcategory','audience','section','customCategory','customItem'];
  function routeUrl(screen){
    const url=/^\/share\//.test(location.pathname)?new URL('/',location.origin):new URL(location.href);routeParams.forEach(k=>url.searchParams.delete(k));
    if(screen==='product'){if(state.selected?.id)url.searchParams.set('product',String(state.selected.id));}
    else if(screen==='catalog'){if(state.filterCategories.length===1)url.searchParams.set('category',state.filterCategories[0]);if(state.filterSubs.length===1)url.searchParams.set('subcategory',state.filterSubs[0]);}
    else if(screen==='customCategory'){if(state.customCategoryId)url.searchParams.set('customCategory',String(state.customCategoryId));}
    else if(screen==='customItem'){if(state.customItemId)url.searchParams.set('customItem',String(state.customItemId));if(state.customCategoryId)url.searchParams.set('customCategory',String(state.customCategoryId));}
    url.hash=screen;return url.pathname+(url.search||'')+url.hash;
  }
  function routeState(screen,scrollY){return{oneLine:true,screen,scrollY:Number(scrollY||0),productId:screen==='product'?(state.selected?.id||''):'',customCategoryId:(screen==='customCategory'||screen==='customItem')?(state.customCategoryId||''):'',customItemId:screen==='customItem'?(state.customItemId||''):'',filterCategories:screen==='catalog'?[...state.filterCategories]:[],filterSubs:screen==='catalog'?[...state.filterSubs]:[],filterOptions:screen==='catalog'?[...state.filterOptions]:[]};}
  function restoreProductRoute(id,audience){
    if(!id)return;const p=state.products.find(x=>String(x.id)===String(id));if(!p)return;
    if(String(state.selected?.id||'')!==String(p.id)){state.selected=p;state.previewImage='';state.color=p.colors?.[0]||p.colorVariants?.[0]?.color||'';state.bulkQty={};const sizes=state.color?p.colorVariants?.find(v=>v.color===state.color)?.sizes:p.sizes;state.size=(sizes||p.sizes||[])[0]||'';}
  }
  function restoreRouteState(screen,entry){
    const params=new URLSearchParams(location.search),st=entry||{};
    if(screen==='catalog'){const cats=Array.isArray(st.filterCategories)&&st.filterCategories.length?st.filterCategories:(params.get('category')?[params.get('category')]:[]),subs=Array.isArray(st.filterSubs)&&st.filterSubs.length?st.filterSubs:(params.get('subcategory')?[params.get('subcategory')]:[]);state.filterCategories=[...cats];state.filterSubs=[...subs];state.filterOptions=Array.isArray(st.filterOptions)?[...st.filterOptions]:[];saveFilters();}
    else if(screen==='customCategory'){state.customCategoryId=String(st.customCategoryId||params.get('customCategory')||state.customCategoryId||'');}
    else if(screen==='customItem'){state.customItemId=String(st.customItemId||params.get('customItem')||state.customItemId||'');state.customCategoryId=String(st.customCategoryId||params.get('customCategory')||state.customCategoryId||'');const idea=state.customCatalogItems.find(i=>String(i.id)===String(state.customItemId));if(idea?.category_id)state.customCategoryId=String(idea.category_id);}
    else if(screen==='product')restoreProductRoute(st.productId||params.get('product')||state.selected?.id||'');
  }
  function go(screen,options){
    if(['catalog','categories','product'].includes(screen))screen='customCatalog';
    options=options||{};
    if(state.menu&&history.state?.oneLineModal==='menu'){try{const next={...(history.state||{})};delete next.oneLineModal;history.replaceState(next,'',location.href);}catch(_){}}
    state.menu=false;state.filterOpen=false;state.filterDraft=null;state.printInfoId='';state.headerSearchOpen=false;
    if(screen===state.screen&&!options.force){try{history.replaceState({...history.state,...routeState(screen,window.scrollY)},'',routeUrl(screen));}catch(_){}window.scrollTo(0,0);render();if(screen==='customItem')void refreshCustomerFabricPricing(state.customItemId);return;}
    const previous=state.screen;rememberScroll();state.screen=screen;
    if(!options.fromHistory){try{history.pushState({...routeState(screen,0),fromScreen:previous},'',routeUrl(screen));}catch(_){}}
    window.scrollTo(0,0);render();
    if(screen==='search')requestAnimationFrame(()=>root.querySelector('[data-unified-catalogue-search]')?.focus({preventScroll:true}));
    if(screen==='customItem')void refreshCustomerFabricPricing(state.customItemId);
    if(accountView()&&Date.now()-lastAccountSyncAt>15000)void pollCustomerAccount(true);
  }
  function navigateBack(fallback){
    if(state.screen==='home'){window.scrollTo(0,0);return;}
    if(history.state?.fromScreen){history.back();return;}
    go(fallback||fallbackForScreen(state.screen)||'home');
  }
  let cartMutationQueue=Promise.resolve(),cartMutationsPending=0,cartSyncError='',accountPollBusy=false,accountChannel=null;
  let lastAccountSyncAt=0, uniformAddBusy=false, cartAddBusy=false;
  let cartFeedbackTimer=null;
  function cartFeedback(stage){
    if(cartFeedbackTimer){clearTimeout(cartFeedbackTimer);cartFeedbackTimer=null;}
    let overlay=document.getElementById('one-line-cart-feedback');
    if(stage==='hide'){overlay?.remove();return;}
    if(!overlay){overlay=document.createElement('div');overlay.id='one-line-cart-feedback';overlay.className='one-line-cart-feedback';overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');document.body.appendChild(overlay);}
    overlay.innerHTML=stage==='success'
      ?'<div class="one-line-cart-feedback-card is-success"><span class="one-line-cart-feedback-check">'+I('check')+'</span><strong>Added to cart</strong></div>'
      :'<div class="one-line-cart-feedback-card"><span class="one-line-cart-feedback-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Adding to cart</span></div>';
    if(stage==='success')cartFeedbackTimer=setTimeout(()=>{overlay.remove();cartFeedbackTimer=null;},1350);
  }
  const ACCOUNT_POLL_MS=60000;
  const accountView=()=>['profile','profileDetails','cart','orders','addresses','checkout'].includes(state.screen);
  try{if('BroadcastChannel' in window){accountChannel=new BroadcastChannel('one-line-account-v41');accountChannel.onmessage=()=>pollCustomerAccount(true);}}catch(_){}
  function broadcastAccountSync(reason){try{accountChannel?.postMessage({reason:reason||'update',at:Date.now()});}catch(_){}}
  function ensureCartKey(item){if(!item.key)item.key=(item.itemType||'item')+'-'+(crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2));return String(item.key);}
  function applyServerCart(cart){
    const items=Array.isArray(cart?.items)?cart.items:[],legacyTeam=items.filter(raw=>raw?.itemType==='team_design');
    state.cart=items.filter(raw=>raw?.itemType!=='team_design').map(raw=>{const item=clone(raw);ensureCartKey(item);if(item.itemType==='custom_design'&&item.customDesign){item.price=S.customDesignPrice?.(item.customDesign,item.qty,state.settings)??item.price;item.total=Number(item.price||0)*Number(item.qty||0);}return item;});
    state.cartVersion=Number(cart?.version||0);state.cartUpdatedAt=String(cart?.updatedAt||'');
    legacyTeam.forEach(raw=>{const item=clone(raw);ensureCartKey(item);queueCartMutation('remove',item.key,null);});
  }
  function mapServerOrders(rows){return (rows||[]).map(o=>({id:o.order_code||o.id,customer:o.customer_name||'',phone:o.phone||'',total:Number(o.total||0),items:(o.order_items||[]).reduce((n,x)=>n+Number(x.qty||0),0),delivery:o.delivery||'',payment:o.payment||'',status:o.status||'Confirmed',metadata:o.metadata||{},createdAt:o.created_at||'',time:o.created_at?new Date(o.created_at).toLocaleString():'',address:o.address||'',orderItems:(o.order_items||[]).map(x=>({name:x.item_name||'Item',code:x.item_code||'',color:x.color||'',size:x.size||'',qty:Number(x.qty||0),price:Number(x.unit_price||0),itemType:x.item_type||'product',custom:x.item_type!=='product',customDesign:x.item_type==='custom_design'?(x.design_json||null):null,teamDesign:x.item_type==='team_design'?(x.design_json||null):null,uniformOrder:x.item_type==='uniform_order'?(x.design_json||null):null,design:x.design_json||{},image:x.design_json?.selectedItems?.find(v=>(v.images||[]).length)?.images?.[0]||x.design_json?.frontCompositeUrl||x.design_json?.design?.front?.compositeUrl||x.design_json?.front?.compositeUrl||x.design_json?.images?.[0]||x.design_json?.cardImage||''}))}));}
  function mapServerEnquiries(rows){return (rows||[]).map(e=>({id:e.id||'',type:e.event_type||'custom_catalog_enquiry',payload:e.payload&&typeof e.payload==='object'?e.payload:{},createdAt:e.created_at||'',time:e.created_at?new Date(e.created_at).toLocaleString():''}));}
  const orderMetaStamp=meta=>String(meta?.count||0)+'|'+String(meta?.updatedAt||'');
  function applyServerCustomer(customer){
    if(!customer)return false;const before=JSON.stringify([state.customer?.name||'',state.customer?.businessName||'',state.customer?.jobTitle||'',state.customer?.phone||'',state.profileUpdatedAt||'']);
    const sess=B?.customerSession?.()||{},next={...(state.customer||{}),...sess,customerId:customer.id||state.customer?.customerId||sess.customerId,phone:customer.phone||state.customer?.phone||sess.phone||'',name:customer.name||'',businessName:customer.businessName||'',jobTitle:customer.jobTitle||''};
    state.customer=next;state.profileUpdatedAt=String(customer.updatedAt||'');
    state.details.name=next.name||'';if(!readDraft('checkout-business'))state.details.business=next.businessName||'';state.details.phone=next.phone||'';
    return before!==JSON.stringify([next.name||'',next.businessName||'',next.jobTitle||'',next.phone||'',state.profileUpdatedAt||'']);
  }
  async function refreshCustomerAccount(renderAfter=false){
    const current={...(state.customer||{}),...(B?.customerSession?.()||{})};if(!current?.token)return null;
    try{
      const data=await B.customerAccount();if(!data?.customer)return null;
      applyServerCustomer(data.customer);state.addresses=Array.isArray(data.addresses)?data.addresses:[];if(!state.selectedAddressId||!state.addresses.some(a=>String(a.id)===String(state.selectedAddressId)))state.selectedAddressId=String(state.addresses.find(a=>a.is_default)?.id||state.addresses[0]?.id||'');applyServerCart(data.cart||null);state.orders=mapServerOrders(data.orders||[]);state.enquiries=mapServerEnquiries(data.enquiries||[]);state.ordersStamp=orderMetaStamp(data.ordersMeta||{count:(data.orders||[]).length,updatedAt:(data.orders||[]).reduce((m,o)=>String(o.updated_at||'')>m?String(o.updated_at||''):m,'')});state.enquiriesStamp=orderMetaStamp(data.enquiriesMeta||{count:(data.enquiries||[]).length,updatedAt:(data.enquiries||[]).reduce((m,e)=>String(e.created_at||'')>m?String(e.created_at||''):m,'')});state.accountLoaded=true;
      lastAccountSyncAt=Date.now();if(renderAfter)render();return data;
    }catch(err){if(/session expired/i.test(String(err?.message||''))){B?.clearCustomerSession?.();state.customer=null;state.cart=[];state.orders=[];state.enquiries=[];state.addresses=[];state.selectedAddressId='';state.accountLoaded=false;}return null;}
  }
  function queueCartMutation(operation,itemKey,item,optimistic=false){
    const key=String(itemKey||item?.key||'');cartMutationsPending++;
    cartMutationQueue=cartMutationQueue.then(async()=>{
      const result=await B.mutateCustomerCart(operation,key,item?clone(item):null);cartSyncError='';if(result?.cart){if(optimistic){state.cartVersion=Number(result.cart.version||0);state.cartUpdatedAt=String(result.cart.updatedAt||'');}else applyServerCart(result.cart);}lastAccountSyncAt=Date.now();broadcastAccountSync('cart');
      if(!optimistic&&['cart','profile','profileDetails','addresses'].includes(state.screen))render();return result;
    }).catch(async err=>{cartSyncError=err?.message||'Could not sync cart';showToast(cartSyncError);await refreshCustomerAccount(true);return null;}).finally(()=>{cartMutationsPending=Math.max(0,cartMutationsPending-1);});
    return cartMutationQueue;
  }
  async function pollCustomerAccount(force=false){
    if(accountPollBusy||cartMutationsPending>0||cartQuantityTimers.size>0||document.hidden||(!force&&!accountView()))return;const sess=B?.customerSession?.();if(!sess?.token)return;if(!force&&Date.now()-lastAccountSyncAt<ACCOUNT_POLL_MS-1000)return;accountPollBusy=true;lastAccountSyncAt=Date.now();
    try{
      const data=await B.customerSync();if(!data?.customer)return;const profileChanged=applyServerCustomer(data.customer);
      const remoteCartVersion=Number(data.cart?.version||0),remoteOrderStamp=orderMetaStamp(data.ordersMeta),remoteEnquiryStamp=orderMetaStamp(data.enquiriesMeta);
      const needFull=remoteCartVersion!==Number(state.cartVersion||0)||remoteOrderStamp!==String(state.ordersStamp||'')||remoteEnquiryStamp!==String(state.enquiriesStamp||'');
      if(needFull)await refreshCustomerAccount(false);else state.accountLoaded=true;
      if((force||profileChanged||needFull)&&state.screen!=='customize'&&state.screen!=='profileDetails'&&!state.authBusy){if(state.screen==='checkout'&&state.checkoutStep===1){saveAddressDraft();}render();}
    }catch(err){if(/session expired/i.test(String(err?.message||''))){B?.clearCustomerSession?.();state.customer=null;state.cart=[];state.orders=[];state.enquiries=[];state.addresses=[];state.selectedAddressId='';state.accountLoaded=false;render();}}finally{accountPollBusy=false;}
  }
  async function addCart(item,navigate){
    // Hold the lock through the server response; a rapid double tap must never create two cart rows.
    if(cartAddBusy)return false;cartAddBusy=true;
    cartFeedback('loading');
    ensureCartKey(item);state.cart.push(item);
    let succeeded=false;
    try{
      const saved=await queueCartMutation('upsert',item.key,item);
      if(!saved)return false; // The existing cart-sync error handling reports the problem.
      B?.customerEvent?.('cart_add',{item:{productId:item.productId||null,name:item.name,code:item.code||'',qty:item.qty||1,itemType:item.itemType||'product'}});
      if(navigate)go('cart');
      cartFeedback('success');succeeded=true;
      return true;
    }finally{if(!succeeded)cartFeedback('hide');cartAddBusy=false;}
  }
  function clearDesignerAfterCart(){
    // A submitted design must not reappear as a preselected draft on the next visit.
    try{localStorage.setItem('one-line-designer-draft-v7',JSON.stringify({cartCleared:true,sizeQty:{}}));}catch(_){}
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
    try{history.pushState({...(history.state||{}),oneLine:true,screen:state.screen,scrollY:window.scrollY,oneLineModal:'menu'},'',location.href);}catch(_){}
    render();
  }
  function closeMenu(fromHistory){
    if(!state.menu)return;
    if(!fromHistory&&history.state?.oneLineModal==='menu'){history.back();return;}
    state.menu=false;render();
  }
  function openLegal(name){state.legal=name;try{history.pushState({...(history.state||{}),oneLine:true,screen:state.screen,scrollY:window.scrollY,oneLineModal:'legal',legal:name},'',location.href);}catch(_){}render();}
  function closeLegal(fromHistory){state.legal='';if(!fromHistory&&history.state?.oneLineModal==='legal'){history.back();return;}render();}
  function productVariants(p){return Array.isArray(p?.variants)?p.variants.filter(v=>v.active!==false):[];}
  function selectedVariants(p){const rows=productVariants(p);if(!rows.length)return[];const hasColors=rows.some(v=>v.color);return hasColors&&state.color?rows.filter(v=>String(v.color||'')===String(state.color||'')):rows;}
  function variantKey(v){return String(v.id||((v.color||'')+'|'+(v.size||'')));}
  function selectedBulkLines(p){
    const rows=selectedVariants(p);if(rows.length)return rows.map(v=>({variantId:v.id||'',color:v.color||'',size:v.size||'',stock:Number(v.stock||0),unitPrice:Number(v.price??p.price??0),qty:Math.max(0,Number(state.bulkQty[variantKey(v)]||0))})).filter(x=>x.qty>0);
    const qty=Math.max(0,Number(state.bulkQty.simple||0));return qty?[{variantId:'',color:state.color||'',size:'',stock:Number(p.stock||0),unitPrice:Number(p.price||0),qty}]:[];
  }
  function bulkTotalQty(lines){return (lines||[]).reduce((n,x)=>n+Number(x.qty||0),0);}
  function bulkTotalPrice(lines){return (lines||[]).reduce((n,x)=>n+Number(x.qty||0)*Number(x.unitPrice||0),0);}
  function validateLines(lines,label){for(const line of lines){if(line.qty<1)continue;if(Number.isFinite(line.stock)&&line.qty>line.stock)throw new Error((label||'Item')+' only has '+line.stock+' available for '+(line.size||line.color||'this option')+'.');}}
  async function addSelectedProductToCart(){
    if(cartAddBusy)return;
    const p=state.selected;if(!p)return;const lines=selectedBulkLines(p);if(!lines.length){showToast('Enter a quantity for at least one available size');return;}
    try{validateLines(lines,p.name);}catch(e){showToast(e.message);return;}
    const qty=bulkTotalQty(lines),price=qty?bulkTotalPrice(lines)/qty:Number(p.price||0),total=bulkTotalPrice(lines);
    const added=await addCart({key:'bulk-'+p.id+'-'+Date.now(),itemType:'product',productId:p.id,code:p.code||p.sku||'',name:p.name||'Item',image:selectedProductImage(p),price,total,qty,bulkLines:lines,color:state.color||'',detail:lines.map(x=>(x.size||x.color||'Item')+' × '+x.qty).join(' · ')},true);
    if(added){state.bulkQty={};state.color='';state.size='';}
  }
  function optionValues(p){return S.productOptions(p);}
  function filterPool(){return retailProducts();}
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
    // Dedicated Cloudflare Pages share pages deliver per-item OG metadata to social crawlers.
    const base=location.origin+'/share/';
    if(kind==='product')return base+'product/'+encodeURIComponent(String(value))+'?v=202';
    if(kind==='category')return base+'retail-category/'+encodeURIComponent(String(value))+'?v=202';
    if(kind==='subcategory')return base+'retail-category/'+encodeURIComponent(String(extra||value))+'?v=202';
    if(kind==='custom-category')return base+'category/'+encodeURIComponent(String(value))+'?v=202';
    if(kind==='custom-item')return base+'item/'+encodeURIComponent(String(value))+'?v=202';
    const url=new URL('/',location.origin);
    if(kind==='section'){url.searchParams.set('section',String(value));url.hash='home';}
    else if(kind==='designer')url.hash='customize';
    else if(kind==='custom-catalog')url.hash='customCatalog';
    else url.hash='catalog';
    return url.toString();
  }
  function shareImageUrl(kind,value,extra){
    const u=shareUrl(kind,value,extra);
    const parsed=new URL(u,location.href);
    if(!/^\/share\/(?:item|category|product|retail-category)\/[^/]+$/.test(parsed.pathname))return '';
    return location.origin+parsed.pathname.replace('/share/','/share/image/');
  }
  async function shareJpegFile(kind,value,extra,label){
    // Convert the existing image locally only when Share is tapped. No uploads,
    // background conversion, new database rows or Supabase storage copies.
    const imageUrl=shareImageUrl(kind,value,extra);
    if(!imageUrl||typeof File==='undefined')return null;
    const response=await fetch(imageUrl,{cache:'default',credentials:'omit'});
    if(!response.ok)throw new Error('Share image unavailable');
    const image=await response.blob();
    if(!image.type.startsWith('image/')||image.size>16*1024*1024)throw new Error('Invalid share image');
    if(image.type==='image/jpeg')return new File([image],String(label||'One-Line').replace(/[^a-z0-9_-]+/gi,'-').slice(0,44)+'.jpg',{type:'image/jpeg'});
    let bitmap=null,source=null,objectUrl='';
    try{
      if(typeof createImageBitmap==='function'){
        try{bitmap=await createImageBitmap(image);source=bitmap;}catch(_){}
      }
      if(!source){
        objectUrl=URL.createObjectURL(image);
        source=await new Promise((resolve,reject)=>{
          const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(new Error('Preview cannot be decoded'));el.src=objectUrl;
        });
      }
      const w=Number(source.width||source.naturalWidth),h=Number(source.height||source.naturalHeight);
      if(!w||!h)throw new Error('Empty share image');
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;
      const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('No image canvas');
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,1080,1080);
      const scale=Math.min(1080/w,1080/h),dw=Math.round(w*scale),dh=Math.round(h*scale);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(source,Math.floor((1080-dw)/2),Math.floor((1080-dh)/2),dw,dh);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.87));
      if(!blob||!blob.size)throw new Error('Could not prepare share image');
      const filename=String(label||'One-Line').replace(/[^a-z0-9_-]+/gi,'-').slice(0,44)||'One-Line';
      return new File([blob],filename+'.jpg',{type:'image/jpeg'});
    }finally{bitmap?.close?.();if(objectUrl)URL.revokeObjectURL(objectUrl);}
  }
  async function shareItem(kind,value,label,extra){
    const url=shareUrl(kind,value,extra),title=label||'One-Line catalogue';
    try{
      if(navigator.share){
        // Share the real image *with* its product/category link on supported
        // Android/iOS share sheets, bypassing WebP-unfriendly link crawlers.
        if(shareImageUrl(kind,value,extra)){
          try{
            const file=await shareJpegFile(kind,value,extra,title);
            if(file&&(!navigator.canShare||navigator.canShare({files:[file]}))){
              await navigator.share({title,text:title+'\n'+url,files:[file]});
              return;
            }
          }catch(error){if(error?.name==='AbortError')return;}
        }
        await navigator.share({title,text:title,url});return;
      }
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);showToast('Share link copied');return;}
    }catch(err){if(err?.name==='AbortError')return;}
    try{const ta=document.createElement('textarea');ta.value=url;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast('Share link copied');}catch(_){showToast('Copy this page URL to share');}
  }
  function resetFilters(category){state.filterCategories=category&&category!=='All'?[category]:[];state.filterSubs=[];state.filterOptions=[];saveFilters();}
  function commitFilterDraft(){if(!state.filterDraft)return;state.filterCategories=clone(state.filterDraft.categories||[]);state.filterSubs=clone(state.filterDraft.subs||[]);state.filterOptions=clone(state.filterDraft.options||[]);saveFilters();}
  function closeFilter(applyDraft){if(applyDraft===true)commitFilterDraft();state.filterOpen=false;state.filterDraft=null;render();}
  function openProduct(id,audience){
    const p=state.products.find(x=>String(x.id)===String(id));if(!p)return;
    state.selected=p;state.previewImage='';state.color=p.colors?.[0]||p.colorVariants?.[0]?.color||'';state.bulkQty={};
    const sizes=state.color?p.colorVariants?.find(v=>v.color===state.color)?.sizes:p.sizes;state.size=(sizes||p.sizes||[])[0]||'';
    go('product');
  }
  function selectedProductImage(p){return state.previewImage||(state.color?S.productImageForColor(p,state.color):(p.images?.[0]||p.image));}

  function productImages(p){
    if(!p)return ['assets/product-placeholder.svg'];
    const images=[p.image,...(Array.isArray(p.images)?p.images:[]),...(Array.isArray(p.colorVariants)?p.colorVariants.map(v=>v&&v.image):[]),...(Array.isArray(p.variants)?p.variants.map(v=>v&&v.image):[])].filter(Boolean);
    return [...new Set(images)].slice(0,10);
  }
  function productGallery(p){const preferred=state.color?S.productImageForColor(p,state.color):selectedProductImage(p);return [...new Set([preferred,...productImages(p)].filter(Boolean))];}
  function resetZoomState(){state.zoomImage='';state.zoomAlt='';state.zoomImages=[];state.zoomIndex=0;state.zoomScale=1;state.zoomX=0;state.zoomY=0;}
  function openZoom(src,alt){
    const custom=state.screen==='customItem'?state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId)):null;
    const customGallery=custom?(isUniformCustomItem(custom)?uniformGalleryImages(custom,uniformSelection(custom)):[...(custom.images||[])].filter(Boolean)):[],gallery=custom?customGallery:(state.selected?productGallery(state.selected):[src]);
    const images=[...new Set([...(gallery||[]),src].filter(Boolean))];const index=Math.max(0,images.indexOf(src));
    state.zoomImages=images.length?images:[src];state.zoomIndex=index;state.zoomImage=state.zoomImages[index]||src;state.zoomAlt=alt||'Product image';state.zoomScale=1;state.zoomX=0;state.zoomY=0;
    try{
      if(history.state?.oneLineZoom)history.replaceState({...history.state,zoomIndex:index,zoomSrc:state.zoomImage,zoomAlt:state.zoomAlt},'',location.href);
      else{history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);history.pushState({...history.state,oneLine:true,oneLineZoom:true,screen:state.screen,scrollY:window.scrollY,zoomIndex:index,zoomSrc:state.zoomImage,zoomAlt:state.zoomAlt},'',location.href);}
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
    return '<div class="detail-slider" data-detail-slider><div class="detail-slider-frame"><div class="product-slide-track detail-slide-track">'+images.map((src,i)=>'<div class="product-slide detail-slide" data-detail-index="'+i+'"><button type="button" class="detail-zoom-target" data-zoom-image="'+S.esc(src)+'" data-zoom-alt="'+S.esc(name+' '+(i+1))+'" aria-label="Open product image">'+img(src,name+' '+(i+1),'product-image','assets/crew-tee.webp')+'</button></div>').join('')+'</div></div>'+(images.length>1?'<div class="product-slide-progress detail-slide-progress">'+images.map((_,i)=>'<i class="'+(i===0?'active':'')+'"></i>').join('')+'</div>':'<div class="product-slide-progress detail-slide-progress single"><i class="active"></i></div>')+'</div>';
  }
  function productCard(p,audience){
    const slides=productImages(p),discount=p.mrp&&p.price?Math.max(0,Math.round((p.mrp-p.price)/p.mrp*100)):0;
    const label=String(p.name||p.subcategory||p.category||'Product').trim()||'Product';
    const imageOnly=!String(p.name||'').trim()&&!String(p.description||'').trim()&&!Number(p.price||0)&&!Number(p.mrp||0);
    const info=imageOnly?'':'<div class="product-info">'+(p.subcategory||p.category?'<p>'+S.esc(p.subcategory||p.category)+'</p>':'')+(p.name?'<h3>'+S.esc(p.name)+'</h3>':'')+(Number(p.price||0)||Number(p.mrp||0)?'<div class="price-row"><strong>'+S.money(p.price)+'</strong>'+(p.mrp?'<s>'+S.money(p.mrp)+'</s>':'')+'</div>':'')+'</div>';
    const shareKind='product',shareValue=p.id,shareExtra='retail';
    return '<article class="product-card wellone-card '+(imageOnly?'image-only-card':'')+'" tabindex="0" data-open-product="'+S.esc(p.id)+'" data-audience="'+'retail'+'"><button type="button" class="card-share-button" data-share-kind="'+shareKind+'" data-share-value="'+S.esc(shareValue)+'" data-share-extra="'+shareExtra+'" data-share-label="'+S.esc(label)+'" aria-label="Share '+S.esc(label)+'">'+I('share')+'</button><div class="product-image-wrap ratio-3x4 product-card-slider" data-card-slider="'+S.esc(p.id)+'" data-slider-audience="'+'retail'+'"><div class="product-slide-track">'+(p.cardImage?[p.cardImage]:slides.slice(0,1)).map((src,i)=>'<div class="product-slide" data-slide-index="'+i+'">'+img(src,label+' '+(i+1),'product-image')+'</div>').join('')+'</div>'+(discount?'<span class="discount-tag">-'+discount+'%</span>':'')+'</div>'+(false?'<div class="product-slide-progress" aria-hidden="true">'+slides.map((_,i)=>'<i class="'+(i===0?'active':'')+'"></i>').join('')+'</div>':'<div class="product-slide-progress single" aria-hidden="true"><i class="active"></i></div>')+info+'</article>';
  }
  function orderedCategoryNames(list){
    const available=[...new Set(list.map(p=>p.category).filter(Boolean))],configured=state.categories.map(c=>c.name).filter(n=>available.includes(n));
    available.forEach(n=>{if(!configured.includes(n))configured.push(n);});
    return configured.sort((a,b)=>{const at=/t[- ]?shirts?/i.test(a)?0:1,bt=/t[- ]?shirts?/i.test(b)?0:1;return at-b;});
  }
  function groupedProductSections(list,audience){
    return orderedCategoryNames(list).map((name,index)=>{const items=list.filter(p=>p.category===name);if(!items.length)return'';const subs=[...new Set(items.map(p=>p.subcategory).filter(Boolean))];return '<section class="catalog-category-group '+(index===0?'first-category-group':'')+'"><div class="catalog-category-heading"><div><span class="eyebrow">'+(index===0?'FIRST CATEGORY':'CATEGORY '+String(index+1).padStart(2,'0'))+'</span><h2>'+S.esc(name)+'</h2>'+(subs.length?'<p class="category-subline">'+subs.map(S.esc).join(' · ')+'</p>':'')+'</div><div class="category-heading-actions"><small>'+items.length+' item'+(items.length===1?'':'s')+'</small></div></div><div class="product-grid catalog-grid responsive-catalog-grid">'+items.map(p=>productCard(p,audience)).join('')+'</div></section>';}).join('');
  }
  function hasReadyMadeItems(){return retailProducts().some(p=>p.active!==false&&p.customerVisible!==false);}
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  function fallbackForScreen(screen){return({search:'home',product:'catalog',customCategory:(state.customCatalogCategories.find(c=>String(c.id)===String(state.customCategoryId))?.catalogue_section==='ready'?'readyMade':'customCatalog'),customItem:'customCategory',cart:'home',checkout:'cart',orders:'profile',addresses:'profile',profileDetails:'profile',profile:'home',customize:'home',teamUpload:'home',categories:'home',catalog:'home',customCatalog:'home'})[screen]||'home';}
  function header(){
    const customer=state.customer||B?.customerSession?.()||null,verified=!!customer?.token,isHome=state.screen==='home';
    const activeScreen=(...screens)=>screens.includes(state.screen)?' active-menu':'';
    const item=(screen,label,icon,screens)=>'<button class="drawer-item'+activeScreen(...(screens||[screen]))+'" data-go="'+screen+'"><span class="drawer-icon">'+I(icon)+'</span><span>'+label+'</span>'+I('chevron')+'</button>';
    const installNav=isStandalone()?'':'<button class="drawer-item nav-install" data-action="install"><span class="drawer-icon">'+I('download')+'</span><span>Install app</span>'+I('chevron')+'</button>';
    const installHead=isStandalone()?'':'<button class="install-link" data-action="install" aria-label="Install app">'+I('download')+'<span>Install</span></button>';
    const account=verified?'<button class="drawer-account" data-go="profile"><span class="drawer-account-icon">'+I('user')+'</span><span><b>'+S.esc(customer?.name||'My profile')+'</b><small>'+S.esc(String(customer?.phone||'').replace(/^91(?=\d{10}$)/,'+91 '))+'</small></span>'+I('chevron')+'</button>':'<button class="drawer-account" data-action="profile-login"><span class="drawer-account-icon">'+I('user')+'</span><span><b>Sign in / Sign up</b><small>Save designs, track orders and more.</small></span>'+I('chevron')+'</button>';
    const readyMadeDrawer=item('readyMade','Ready Made','tag',['readyMade']);
    const drawer='<div class="drawer-top"><button class="drawer-brand-button" data-go="home">'+logo(false)+'</button><button class="drawer-close" data-action="close-menu" aria-label="Close menu">'+I('close')+'</button></div><div class="drawer-links">'+
      item('home','Home','home')+readyMadeDrawer+item('customCatalog','Custom Catalogue','sparkle',['customCatalog','customCategory','customItem'])+item('customize','Customize','type')+item('teamUpload','Team Order','users')+
      '<span class="drawer-divider" aria-hidden="true"></span>'+item('cart','My Cart','cart',['cart','checkout'])+item('orders','My Orders','orders')+item('profile','My Profile','user')+
      '<button class="drawer-item" data-action="whatsapp" data-message="Hi, I need help with One-Line."><span class="drawer-icon">'+I('contact')+'</span><span>Help & Support</span>'+I('chevron')+'</button>'+installNav+'<button class="drawer-item" data-legal="About"><span class="drawer-icon">'+I('shield')+'</span><span>About OneLine</span>'+I('chevron')+'</button></div>'+account;
    const leading=isHome?'<button class="mobile-menu" data-action="menu" aria-label="Open menu">'+I('menu')+'</button>':'<button class="mobile-menu header-back-button" data-action="nav-back" data-fallback="'+fallbackForScreen(state.screen)+'" aria-label="Go back">'+I('back')+'</button>';
    const announcement=isHome?'<div class="announcement"><span>CUSTOM APPAREL · BULK ORDERS · TEAM KITS</span><b>ONE DESIGN. EVERY SIZE.</b></div>':'';
    return announcement+'<header class="site-header '+(isHome?'home-site-header':'inner-site-header')+'">'+leading+'<button class="logo-button" data-go="home">'+logo(false)+'</button><nav class="'+(state.menu?'open':'')+'">'+drawer+'</nav><div class="header-actions">'+installHead+'<button data-go="profile" class="profile-head-link'+(['profile','profileDetails','orders'].includes(state.screen)?' active':'')+'" aria-label="Open profile">'+I('user')+'</button><button type="button" data-action="toggle-header-search" class="header-search-link'+(state.headerSearchOpen?' active':'')+'" aria-label="Search all catalogue items" aria-expanded="'+!!state.headerSearchOpen+'" aria-controls="header-inline-search">'+I('search')+'</button><button data-go="cart" class="cart-head-link" aria-label="Open cart">'+I('cart')+'</button></div></header>'+(state.menu?'<button class="menu-scrim" data-action="close-menu" aria-label="Close menu"></button>':'');
  }
  function footer(){const readyMadeLink='<button data-go="readyMade">Ready Made</button>';return '<footer><div class="footer-main">'+logo(false)+'<p>Design custom apparel, upload front and back creative team artwork.</p><div><b>SHOP</b>'+readyMadeLink+'<button data-go="customCatalog">Customization catalogue</button><button data-go="customize">Custom designer</button><button data-go="teamUpload">Team order</button></div><div><b>INFORMATION</b>'+Object.keys(legalCopy).map(x=>'<button data-legal="'+x+'">'+x+'</button>').join('')+'</div><div><b>ACCOUNT</b><button data-go="profile">Profile</button><button data-go="cart">Cart</button><button data-go="orders">Orders</button></div></div><div class="footer-bottom"><span>© 2026 One-Line Touch Shopping</span><span>One-Line Touch Shopping</span><span>Developed by <a class="developer-credit-inline" href="'+QUARTZ_SITE+'" target="_blank" rel="noopener noreferrer">Quartz Web Solutions</a></span></div></footer>';}
  function bottom(){
    const currentCustom=state.screen==='customItem'?state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId)):null;
    if(currentCustom&&isUniformCustomItem(currentCustom))return'';
    const accountActive=['profile','profileDetails','cart','addresses','checkout'].includes(state.screen);
    return '<nav class="mobile-bottom"><button data-go="home" class="'+(state.screen==='home'?'active':'')+'">'+I('home')+'Home</button><button data-go="customCatalog" class="'+(['customCatalog','customCategory','customItem'].includes(state.screen)?'active':'')+'">'+I('sparkle')+'Custom</button><button data-go="customize" class="create-only '+(state.screen==='customize'?'active':'')+'" aria-label="Create custom apparel">'+I('plus')+'</button><button data-go="orders" class="'+(state.screen==='orders'?'active':'')+'">'+I('orders')+'Orders</button><button data-go="profile" class="'+(accountActive?'active':'')+'">'+I('user')+'Profile</button></nav>';
  }
  let sortedPublicItemsSource=null,sortedPublicItemsCache=[];
  function visibleCustomCatalogItems(){
    const source=state.customCatalogItems||[];
    if(sortedPublicItemsSource!==source){sortedPublicItemsSource=source;sortedPublicItemsCache=source.filter(x=>x.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||(Date.parse(b.created_at||'')||0)-(Date.parse(a.created_at||'')||0)||String(a.id).localeCompare(String(b.id)));}
    return sortedPublicItemsCache;
  }
  function customItemsForCategory(categoryId){return visibleCustomCatalogItems().filter(x=>String(x.category_id)===String(categoryId));}
  function visibleCustomCatalogCategories(section='custom'){const ids=new Set(visibleCustomCatalogItems().map(x=>String(x.category_id)));return (state.customCatalogCategories||[]).filter(x=>x.active!==false&&(x.catalogue_section||'custom')===section&&ids.has(String(x.id))).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||(Date.parse(a.created_at||'')||0)-(Date.parse(b.created_at||'')||0));}
  function customCategoryPubliclyAccessible(category){return !!category&&(category.active!==false||category.shareable===true);}
  function customCategoryCard(c,index,homeCard){const count=customItemsForCategory(c.id).length;return '<article class="custom-catalog-category '+(homeCard?'home-custom-category':'')+'" data-open-custom-category="'+S.esc(c.id)+'" tabindex="0"><button type="button" class="card-share-button custom-category-share" data-share-kind="custom-category" data-share-value="'+S.esc(c.id)+'" data-share-label="'+S.esc(c.name||'Customization category')+'" aria-label="Share '+S.esc(c.name||'category')+'">'+I('share')+'</button><div class="custom-category-image">'+img(c.image_url,c.name,'','assets/category-placeholder.svg')+'</div><div class="custom-category-copy"><span>'+String(index+1).padStart(2,'0')+' · '+count+' IDEA'+(count===1?'':'S')+'</span><h3>'+S.esc(c.name||'Customization')+'</h3>'+(c.description?'<p>'+S.esc(c.description)+'</p>':'')+'</div><b class="custom-category-arrow">'+I('arrow')+'</b></article>';}
  function customCatalogHomeSection(){const cats=visibleCustomCatalogCategories().slice(0,4);if(!cats.length)return'';return '<section class="custom-catalog-home section-wrap"><div class="section-heading home-flow-heading"><div class="section-heading-copy"><span class="eyebrow">CUSTOMIZATION CATALOGUE</span><h2>Choose an idea. Make it yours.</h2><p>Browse design references and enquire to customize one for your team, business or event.</p></div><div class="section-heading-actions"><button type="button" class="inline-share-button" data-share-kind="custom-catalog" data-share-label="One-Line Customization Catalogue" aria-label="Share customization catalogue">'+I('share')+'</button><button class="custom-catalog-view-button" data-go="customCatalog">View catalogue '+I('arrow')+'</button></div></div><div class="custom-category-grid home-custom-category-grid">'+cats.map((c,i)=>customCategoryCard(c,i,true)).join('')+'</div></section>';}
  function customCategoryForItem(item){return state.customCatalogCategories.find(c=>String(c.id)===String(item?.category_id))||null;}
  function customCategoryName(item){return String(customCategoryForItem(item)?.name||'').trim().toLowerCase();}
  // Category mode, not a stale uniform_config in the item, determines the flow.
  // Recognize the original category names even before the v144 SQL migration.
  function inferCatalogueMode(name){
    const n=String(name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
    // Two original catalogue titles require their historical customer controls.
    if(n==='ready stock printable items')return'printable';
    if(n==='full sublimation jerseys')return'jersey';
    if(/\buniforms?\b/.test(n))return'uniform';
    if(/\b(t shirts?|tshirts?|tee shirts?)\b/.test(n))return'tshirt';
    if(/\b(jerseys?|sportswear|sports wear|sports kit)\b/.test(n))return'jersey';
    return'catalogue';
  }
  function isFullSublimationItem(item){return customCategoryName(item).replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()==='full sublimation jerseys';}
  function isCorporateTeeItem(item){const c=customCategoryForItem(item);return !!c&&(c.catalogue_section||'custom')!=='ready'&&String(c.name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()==='corporate tee shirt';}
  function isPrintableCustomItem(item){return customCategoryMode(item)==='printable';}
  function customCategoryMode(item){const c=customCategoryForItem(item);if(!c)return item?.fabric_options?.uniform_config?'uniform':'catalogue';if((c.catalogue_section||'custom')==='ready')return'uniform';const matched=inferCatalogueMode(c.name);if(['ready stock printable items','full sublimation jerseys'].includes(String(c.name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()))return matched;const t=String(c.item_editor_type||'auto').toLowerCase();return ['catalogue','tshirt','jersey','uniform','printable'].includes(t)?t:matched;}
  function isTshirtCustomItem(item){return ['tshirt','printable'].includes(customCategoryMode(item));}
  function isSportswearCustomItem(item){return customCategoryMode(item)==='jersey';}
  // Generic Custom Catalogue and Uniforms both use configurable variants,
  // but shirt and jersey categories always use their original fabric selectors.
  function isUniformCustomItem(item){return ['catalogue','uniform'].includes(customCategoryMode(item));}
  function appUniformSize(row,index){const value=typeof row==='string'?row:String(row?.size||''),stock=typeof row==='object'&&row!==null?Math.max(0,Math.floor(Number(row.stock||0))):0,rate=typeof row==='object'&&row!==null&&row.rate!==undefined&&row.rate!==null&&row.rate!==''?Math.max(0,Number(row.rate)):null;return{id:String(row?.id||('size-'+index)),size:value.trim(),stock,rate:Number.isFinite(rate)?rate:null,unlimited:row?.unlimited===true,length_cm:row?.length_cm===null||row?.length_cm===undefined||row?.length_cm===''?null:Math.max(0,Number(row.length_cm)),width_cm:row?.width_cm===null||row?.width_cm===undefined||row?.width_cm===''?null:Math.max(0,Number(row.width_cm))};}
  function appLegacyVariantSizes(row,common){const own=Array.isArray(row?.sizes)?row.sizes.map((x,i)=>appUniformSize(x,i)).filter(x=>x.size):[];if(own.length)return own;const commonRows=(Array.isArray(common)?common:[]).map((x,i)=>appUniformSize(x,i)).filter(x=>x.size),limit=Math.max(0,Math.floor(Number(row?.stock||0)));if(!commonRows.length)return[];if(limit<=0)return commonRows.map((x,i)=>({...x,id:'size-'+i,stock:0}));let left=limit;return commonRows.map((x,i)=>{const stock=Math.min(Math.max(0,Number(x.stock||0)),left);left=Math.max(0,left-stock);return{...x,id:'size-'+i,stock};});}
  function appUniformVariant(raw,id,name,common=[]){const row=raw&&typeof raw==='object'?raw:{},images=Array.isArray(row.images)?row.images.filter(Boolean):(row.image?[String(row.image)]:[]),sizes=appLegacyVariantSizes(row,common),stock=sizes.reduce((n,x)=>n+Math.max(0,Number(x?.stock||0)),0),mrp=row.mrp!==undefined&&row.mrp!==null&&row.mrp!==''?Math.max(0,Number(row.mrp)):null,rate=row.rate!==undefined&&row.rate!==null&&row.rate!==''?Math.max(0,Number(row.rate)):null,hasOld=!!(images.length||stock||sizes.some(x=>x.size)||mrp!==null||rate!==null);return{id:String(row.id||id),name:String(typeof row.name==='string'?row.name:name).trim(),enabled:row.enabled===true||(row.enabled===undefined&&hasOld),images,mrp:Number.isFinite(mrp)?mrp:null,rate:Number.isFinite(rate)?rate:null,detail_title:String(row.detail_title||'').trim(),detail_description:String(row.detail_description||'').trim(),sizes};}
  function uniformConfig(item){
    const raw=item?.fabric_options?.uniform_config,base={display_id:'',default_mrp:null,rate_unit:'Set',options_customized:true,variant_order:[],top:[],bottom:[],description_blocks:[]};
    if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
      if(Array.isArray(raw.top)||Array.isArray(raw.bottom)){
        const topRows=raw.top||[],bottomRows=raw.bottom||[],common=Array.isArray(raw.sizes)?raw.sizes:[];
        // Do not generate preset variants: customers see exactly what Admin saved.
        base.top=topRows.filter(v=>v&&v.id).map(v=>appUniformVariant(v,v.id,v.name||'Variant',common));
        base.bottom=bottomRows.filter(v=>v&&v.id).map(v=>appUniformVariant(v,v.id,v.name||'Variant',common));
      }else if(Array.isArray(raw.items)){
        base.top=raw.items.filter(v=>v&&v.id).map(v=>appUniformVariant(v,v.id,v.name||v.title||'Variant'));
      }
      base.variant_order=Array.isArray(raw.variant_order)?raw.variant_order.map(String):[...base.top,...base.bottom].map(v=>String(v.id));
      base.display_id=String(raw.display_id||raw.item_id||'').trim();base.rate_unit=RATE_UNIT_OPTIONS.includes(raw.rate_unit)?raw.rate_unit:'Set';
      const dm=raw.default_mrp!==undefined&&raw.default_mrp!==null&&raw.default_mrp!==''?Number(raw.default_mrp):null;
      base.default_mrp=Number.isFinite(dm)?Math.max(0,dm):null;
      base.description_blocks=(Array.isArray(raw.description_blocks)?raw.description_blocks:[]).map((b,i)=>({id:String(b?.id||('block-'+i)),heading:String(b?.heading||'').trim(),points:String(b?.points||'').trim()})).filter(b=>b.heading||b.points);
    }
    return base;
  }
  function uniformAllVariants(cfg){const all=[...(cfg?.top||[]),...(cfg?.bottom||[])],rank=new Map((cfg?.variant_order||[]).map((id,i)=>[String(id),i]));return all.sort((a,b)=>(rank.get(String(a.id))??100000)-(rank.get(String(b.id))??100000));}
  function uniformVariantStock(v){return (v?.sizes||[]).reduce((n,x)=>n+Math.max(0,Math.floor(Number(x?.stock||0))),0);}
  function uniformVariantAdded(v){return v?.enabled===true;}
  function uniformGarments(item){return uniformAllVariants(uniformConfig(item)).filter(uniformVariantAdded);}
  function uniformEffectiveRate(option,row){const sizeRate=row?.rate!==undefined&&row?.rate!==null&&row?.rate!==''?Number(row.rate):null,optionRate=option?.rate!==undefined&&option?.rate!==null&&option?.rate!==''?Number(option.rate):null,itemRate=option?.itemRate!==undefined&&option?.itemRate!==null&&option?.itemRate!==''?Number(option.itemRate):null;return Number.isFinite(sizeRate)?Math.max(0,sizeRate):(Number.isFinite(optionRate)?Math.max(0,optionRate):(Number.isFinite(itemRate)?Math.max(0,itemRate):null));}function uniformFromRate(item){const base=item?.rate!==undefined&&item?.rate!==null&&item?.rate!==''?Number(item.rate):null,rates=[];for(const raw of uniformGarments(item)){const option={...raw,itemRate:base};for(const row of (option.sizes||[])){if(!row.unlimited&&Number(row.stock||0)<=0)continue;const rate=uniformEffectiveRate(option,row);if(rate!==null)rates.push(rate);}}return rates.length?Math.min(...rates):(Number.isFinite(base)?Math.max(0,base):null);}
  function uniformFeatures(item){const cfg=uniformConfig(item),names=uniformAllVariants(cfg).filter(uniformVariantAdded).map(v=>v.name),sizes=[...new Set(uniformAllVariants(cfg).filter(uniformVariantAdded).flatMap(v=>(v.sizes||[]).filter(x=>x.unlimited||Number(x.stock)>0).map(x=>x.size).filter(Boolean)))];return[{label:'Options',value:names.join(' / ')},{label:'Sizes',value:sizes.join(' / ')}].filter(x=>x.value);}
  function uniformSelectedIds(){const ids=new Set((state.uniformOptionIds||[]).map(String));if(!ids.size&&state.uniformTopId)ids.add(String(state.uniformTopId));if(!ids.size&&state.uniformBottomId)ids.add(String(state.uniformBottomId));return ids;}
  function uniformQtyKey(optionId,size){return String(optionId)+'::'+String(size);}
  function uniformOptionQuantities(option){const out={};for(const row of (option?.sizes||[])){const size=String(row?.size||'').trim(),stock=Math.max(0,Math.floor(Number(row?.stock||0)));if(!size||(!row.unlimited&&stock<=0))continue;const key=uniformQtyKey(option.id,size),qty=Math.max(0,Math.min(row.unlimited?Number.MAX_SAFE_INTEGER:stock,Math.floor(Number(state.uniformSizeQty?.[key]||0))));if(qty>0)out[size]=qty;}return out;}
  function uniformSelection(item){const cfg=uniformConfig(item),itemRate=item?.rate!==undefined&&item?.rate!==null&&item?.rate!==''?Number(item.rate):null,itemMrp=cfg?.default_mrp!==undefined&&cfg?.default_mrp!==null&&cfg?.default_mrp!==''?Number(cfg.default_mrp):null,options=uniformAllVariants(cfg).filter(uniformVariantAdded).map(v=>({...v,itemRate:Number.isFinite(itemRate)?Math.max(0,itemRate):null,itemMrp:Number.isFinite(itemMrp)?Math.max(0,itemMrp):null})),ids=uniformSelectedIds(),selectedOptions=options.filter(v=>ids.has(String(v.id))),itemQuantities={},selectedItems=[];let totalPieces=0,totalAmount=0;for(const v of selectedOptions){const sizeQuantities=uniformOptionQuantities(v),qty=Object.values(sizeQuantities).reduce((n,q)=>n+Number(q||0),0),sizeRates={};let lineTotal=0;for(const row of (v.sizes||[])){const size=String(row?.size||'').trim(),count=Number(sizeQuantities[size]||0),rate=uniformEffectiveRate(v,row);if(size&&rate!==null)sizeRates[size]=rate;if(count&&rate!==null)lineTotal+=count*rate;}itemQuantities[v.id]=sizeQuantities;selectedItems.push({...v,sizeQuantities,sizeRates,orderedQty:qty,lineTotal});totalPieces+=qty;totalAmount+=lineTotal;}return{cfg,options,selectedOptions,selectedItems,itemQuantities,totalPieces,totalQty:totalPieces,totalAmount,ready:totalPieces>0};}
  function uniformGalleryImages(item,sel=uniformSelection(item)){const defaults=Array.isArray(item?.images)?item.images.filter(Boolean):[];const active=uniformActiveOption(sel);if(active){const own=Array.isArray(active.images)?active.images.filter(Boolean):[];return [...new Set(own.length?own:defaults)];}if(defaults.length)return [...new Set(defaults)];const firstWithImages=(sel?.options||[]).find(v=>(v.images||[]).some(Boolean));return [...new Set((firstWithImages?.images||[]).filter(Boolean))];}
  function customFabricRate(fabric,quality){const key=({premium:'premium_rate',standard:'standard_rate',budget:'budget_rate'})[String(quality||'').toLowerCase()];if(!key)return null;const v=fabric?.[key],n=Number(v);return v===null||v===undefined||v===''||!Number.isFinite(n)||n<0?null:n;}
  function customFabricQualities(fabric){return ['Premium','Standard','Budget'].filter(q=>customFabricRate(fabric,q)!==null);}
  function customItemFabricOptions(item){if(!isTshirtCustomItem(item))return{};const raw=item?.fabric_options;/* Legacy item selections were static snapshots. Default to the live Admin list unless an admin explicitly chooses per-item restrictions. */if(raw?.selection_mode==='custom'&&!raw.uniform_config)return raw;const out={};(state.customCatalogFabrics||[]).filter(f=>f.active!==false).forEach(f=>{const q=customFabricQualities(f);if(q.length)out[String(f.id)]=q;});return out;}
  function customAvailableFabrics(item){const opts=customItemFabricOptions(item);return (state.customCatalogFabrics||[]).filter(f=>f.active!==false).map(f=>{const allowed=Array.isArray(opts[String(f.id)])?opts[String(f.id)]:[];const qualities=customFabricQualities(f).filter(q=>allowed.includes(q));return{fabric:f,qualities};}).filter(x=>x.qualities.length);}
  function defaultSportswearItemOptions(){const fabrics={};(state.customSportswearFabrics||[]).filter(f=>f.active!==false).forEach(f=>{const q=customFabricQualities(f);if(q.length)fabrics[String(f.id)]=q;});return{types:(state.customSportswearTypes||[]).filter(t=>t.active!==false).map(t=>String(t.id)),fabrics};}
  function customSportswearItemOptions(item){const raw=item?.fabric_options;/* Old stored type/fabric arrays must not hide newly added Admin options. */if(raw?.selection_mode==='custom'&&Array.isArray(raw.types)&&raw.fabrics&&typeof raw.fabrics==='object'&&!Array.isArray(raw.fabrics))return raw;return defaultSportswearItemOptions();}
  function sportswearTypes(item=null){const allowed=item?new Set((customSportswearItemOptions(item).types||[]).map(String)):null;return (state.customSportswearTypes||[]).filter(t=>t.active!==false&&(!allowed||allowed.has(String(t.id)))).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.name||'').localeCompare(String(b.name||'')));}
  function sportswearFabrics(item=null){const opts=item?customSportswearItemOptions(item).fabrics:null;return (state.customSportswearFabrics||[]).filter(f=>f.active!==false).map(f=>{const all=customFabricQualities(f),allowed=opts&&Array.isArray(opts[String(f.id)])?opts[String(f.id)]:item?[]:all;return{fabric:f,qualities:all.filter(q=>allowed.includes(q))};}).filter(x=>x.qualities.length);}
  function sportswearTypeAdjustment(type){const n=Number(type?.price_adjustment||0);return Number.isFinite(n)?n:0;}
  function sportswearRate(fabric,quality,type){const base=customFabricRate(fabric,quality);return base===null?null:Math.max(0,base+sportswearTypeAdjustment(type));}
  function sportswearFromRate(item){const types=sportswearTypes(item),fabrics=sportswearFabrics(item);if(!types.length||!fabrics.length)return null;const values=[];types.forEach(t=>fabrics.forEach(x=>x.qualities.forEach(q=>{const r=sportswearRate(x.fabric,q,t);if(r!==null)values.push(r);})));return values.length?Math.min(...values):null;}
  function configuredCustomFinalRate(item){const raw=item?.rate;const value=raw===null||raw===undefined||raw===''?null:Number(raw);return Number.isFinite(value)&&value>=0?value:null;}
  function customItemFromRate(item){const configured=configuredCustomFinalRate(item);if(configured!==null)return configured;if(isPrintableCustomItem(item))return null;if(isTshirtCustomItem(item)){const values=[];customAvailableFabrics(item).forEach(x=>x.qualities.forEach(q=>{const r=customFabricRate(x.fabric,q);if(r!==null)values.push(r);}));return values.length?Math.min(...values):null;}if(isSportswearCustomItem(item))return sportswearFromRate(item);if(isUniformCustomItem(item))return uniformFromRate(item);return(item.rate===null||item.rate===undefined||item.rate==='')?null:Number(item.rate);}
  // Catalogue search works entirely on already-cached rows; no Supabase request per keystroke.
  const catalogueSearchIndexCache=new WeakMap();
  function catalogueItemSearchIndex(item){
    if(catalogueSearchIndexCache.has(item))return catalogueSearchIndexCache.get(item);
    const tokens=[item.id,item.item_id,item.item_code,item.code,item.title,item.name,item.description,item.rate,item.mrp,item.final_rate,item.default_mrp,item.unit,item.price,item.private_detail_1,item.private_detail_2];
    const seen=new WeakSet();
    const collect=(value,depth=0)=>{
      if(value===null||value===undefined||depth>9)return;
      if(typeof value==='string'){
        if(value.length<=300&&!/^data:|^https?:|^blob:/i.test(value))tokens.push(value);
        return;
      }
      if(typeof value==='number') {tokens.push(String(value));return;}
      if(typeof value!=='object'||seen.has(value))return;
      seen.add(value);
      if(Array.isArray(value)){value.slice(0,150).forEach(v=>collect(v,depth+1));return;}
      for(const [key,entry] of Object.entries(value)){
        if(/image|photo|asset|base64|url|composite|thumbnail|src|dataurl/i.test(key))continue;
        if(['name','title','description','detailTitle','detailDescription','id','code','rate','price','mrp','size','color','colour','type','label','variant','barcode','length','width'].some(k=>key.toLowerCase().includes(k.toLowerCase())))tokens.push(key);
        collect(entry,depth+1);
      }
    };
    collect(item.fabric_options);collect(item.variants);collect(item.options);
    const index=tokens.filter(v=>v!==undefined&&v!==null&&v!=='').join(' ').toLowerCase();
    catalogueSearchIndexCache.set(item,index);return index;
  }
  function catalogueSection(item){return (customCategoryForItem(item)?.catalogue_section||'custom')==='ready'?'ready':'custom';}
  function catalogueSearchValue(section){return String(state.catalogueSearchQueries?.[section]||'');}
  function catalogueSearchMatches(item,query){
    const terms=String(query||'').toLowerCase().replace(/[₹,]/g,'').trim().split(/\s+/).filter(Boolean);
    if(!terms.length)return true;
    const mode=customCategoryMode(item),live=[];
    if(mode==='tshirt')for(const row of customAvailableFabrics(item)){live.push(row.fabric.name,row.fabric.id,...row.qualities);for(const quality of row.qualities)live.push(customFabricRate(row.fabric,quality));}
    if(mode==='jersey'){
      for(const row of sportswearTypes(item))live.push(row.id,row.name,row.price_adjustment);
      for(const row of sportswearFabrics(item)){live.push(row.fabric.id,row.fabric.name,...row.qualities);for(const quality of row.qualities)live.push(customFabricRate(row.fabric,quality));}
    }
    if(mode==='printable')for(const row of state.customPrintTypes||[])live.push(row.id,row.name);
    const haystack=(catalogueItemSearchIndex(item)+' '+String(customCategoryForItem(item)?.name||'')+' '+live.filter(v=>v!==null&&v!==undefined).join(' ')).toLowerCase().replace(/[₹,]/g,'');
    return terms.every(word=>haystack.includes(word));
  }
  function catalogueSearchBox(section){return '<div class="catalog-code-search catalogue-custom-search"><input data-custom-catalogue-search="'+section+'" aria-label="Search '+(section==='ready'?'Ready Made':'Custom Catalogue')+'" type="search" autocomplete="off" value="'+S.esc(catalogueSearchValue(section))+'" placeholder="Search items, price, description, variants or IDs"><span>'+I('search')+'</span></div>';}
  function catalogueSearchResults(section,cats){const q=catalogueSearchValue(section).trim();if(!q)return null;
    const visibleCategoryIds=new Set(cats.map(c=>String(c.id)));
    const matches=visibleCustomCatalogItems().filter(item=>visibleCategoryIds.has(String(item.category_id))&&catalogueSection(item)===section&&catalogueSearchMatches(item,q));
    const categoryMatches=cats.filter(c=>([c.name,c.description,c.id].join(' ').toLowerCase()).includes(q.toLowerCase()));
    return (categoryMatches.length?'<div class="custom-category-grid full-custom-category-grid">'+categoryMatches.map((c,i)=>customCategoryCard(c,i,false)).join('')+'</div>':'')+
      (matches.length?'<h2 class="catalogue-search-section-title">Matching items ('+matches.length+')</h2>'+customCategoryGrid(matches):(!categoryMatches.length?'<div class="empty-state clean-empty"><h2>No matching items</h2><p>Try a name, rate, description, variant or item ID.</p></div>':''));
  }
  // Unified full-page search: Custom Catalogue and Ready Made share one cached index.
  function unifiedCatalogueSearch(){
    const query=String(state.headerSearchQuery||''),q=query.trim();
    const accessibleIds=new Set([...visibleCustomCatalogCategories('custom'),...visibleCustomCatalogCategories('ready')].map(c=>String(c.id)));
    const results=q?visibleCustomCatalogItems().filter(item=>accessibleIds.has(String(item.category_id))&&catalogueSearchMatches(item,q)):[];
    return '<main class="header-unified-search-page section-wrap screen screen-enter"><label class="header-unified-search-field">'+I('search')+'<input type="search" data-unified-catalogue-search autocomplete="off" aria-label="Search all catalogue items" placeholder="Search items, variants, IDs, prices..." value="'+S.esc(query)+'"></label><div class="header-unified-search-results">'+(q?(results.length?customCategoryGrid(results):'<div class="empty-state clean-empty"><h2>No matching items</h2></div>'):'')+'</div></main>';
  }
  // v195: Search is inline, never a separate screen or popup. The active page stays visible.
  function headerSearchMatches(){
    const query=String(state.headerSearchQuery||'').trim();if(!query)return [];
    const ids=new Set([...visibleCustomCatalogCategories('custom'),...visibleCustomCatalogCategories('ready')].map(c=>String(c.id)));
    return visibleCustomCatalogItems().filter(item=>ids.has(String(item.category_id))&&catalogueSearchMatches(item,query));
  }
  function headerSearchMatchesHtml(){
    const query=String(state.headerSearchQuery||'').trim();if(!query)return '';
    const matches=headerSearchMatches();
    if(!matches.length)return '<p class="inline-search-empty">No matching items</p>';
    const displayed=matches.slice(0,30);
    return displayed.map(item=>{
      const category=customCategoryForItem(item);
      const thumbnail=item.card_image_url||item.images?.[0]||'assets/product-placeholder.svg';
      return '<button type="button" class="inline-search-result" data-header-search-item="'+S.esc(item.id)+'">'+img(thumbnail,item.title||'Item','inline-search-thumb')+'<span class="inline-search-result-copy"><b>'+S.esc(item.title||'Item')+'</b><small>'+S.esc(category?.name||'')+'</small></span>'+I('arrow')+'</button>';
    }).join('')+(matches.length>30?'<p class="inline-search-empty">Showing 30 of '+matches.length+' results. Type more to narrow the search.</p>':'');
  }
  function inlineHeaderSearch(){
    if(!state.headerSearchOpen)return '';
    return '<section class="inline-header-search" id="header-inline-search" aria-label="Search both catalogues"><div class="inline-header-search-inner"><label class="inline-header-search-field">'+I('search')+'<input type="search" data-inline-header-search autocomplete="off" aria-label="Search items in both catalogues" placeholder="Search items, IDs, variants..." value="'+S.esc(state.headerSearchQuery||'')+'"></label><button type="button" class="inline-header-search-close" data-action="close-header-search" aria-label="Close search">'+I('close')+'</button></div><div class="inline-header-search-matches" data-inline-search-matches>'+headerSearchMatchesHtml()+'</div></section>';
  }
  function openHeaderSearchItem(id){
    const item=state.customCatalogItems.find(x=>String(x.id)===String(id));if(!item)return;
    const cat=customCategoryForItem(item);if(!customCategoryPubliclyAccessible(cat))return;
    state.headerSearchOpen=false;state.customCategoryId=String(item.category_id);
    state.catalogueSearchQueries[catalogueSection(item)]='';
    go('customCategory'); // Entry before item details, so browser Back returns to matching category cards.
    openCustomCatalogueItem(id);
  }
  function readyMade(){const cats=visibleCustomCatalogCategories('ready');return '<main class="custom-catalog-page section-wrap screen screen-enter"><div class="catalog-title"><div><span class="eyebrow">READY TO ORDER</span><h1>Ready Made</h1><p>Find styles, sizes and prices.</p></div></div>'+catalogueSearchBox('ready')+(catalogueSearchResults('ready',cats)??(cats.length?'<div class="custom-category-grid full-custom-category-grid">'+cats.map((c,i)=>customCategoryCard(c,i,false)).join('')+'</div>':'<div class="empty-state clean-empty"><h2>Ready Made items coming soon</h2></div>'))+'</main>';}
  function readyMadeHomeSection(){const cats=visibleCustomCatalogCategories('ready').slice(0,4);if(!cats.length)return '';return '<section class="custom-catalog-home ready-made-home section-wrap"><div class="section-heading"><div><span class="eyebrow">READY TO ORDER</span><h2>Ready Made</h2></div><button data-go="readyMade">View all '+I('arrow')+'</button></div>'+(cats.length?'<div class="custom-category-grid home-custom-category-grid">'+cats.map((c,i)=>customCategoryCard(c,i,true)).join('')+'</div>':'<p>New ready-made collections coming soon.</p>')+'</section>';}
  function customCatalog(){const cats=visibleCustomCatalogCategories();return '<main class="custom-catalog-page section-wrap screen screen-enter"><div class="catalog-title custom-catalog-title"><div><span class="eyebrow">CUSTOMIZATION IDEAS / '+String(cats.length).padStart(2,'0')+'</span><h1>Custom Catalogue</h1><p>Explore custom styles and options.</p></div><button type="button" class="inline-share-button custom-catalog-main-share" data-share-kind="custom-catalog" data-share-label="One-Line Customization Catalogue" aria-label="Share full customization catalogue">'+I('share')+' <span>Share catalogue</span></button></div>'+catalogueSearchBox('custom')+(catalogueSearchResults('custom',cats)??(cats.length?'<div class="custom-category-grid full-custom-category-grid">'+cats.map((c,i)=>customCategoryCard(c,i,false)).join('')+'</div>':'<div class="empty-state clean-empty"><h2>No customization ideas yet</h2><p>New categories will appear here after the admin adds catalogue items.</p></div>'))+'</main>';}
  const RATE_UNIT_OPTIONS=['Piece','Pair','Set','kg','metre','Onwards'];
  function customIdeaCard(item){const category=customCategoryForItem(item),images=[item.card_image_url||item.images?.[0],...(item.images||[])].filter((x,i,all)=>x&&all.indexOf(x)===i),rate=customItemFromRate(item),uniform=isUniformCustomItem(item),tshirt=isTshirtCustomItem(item),sportswear=isSportswearCustomItem(item),hasAdminDefault=configuredCustomFinalRate(item)!==null,rateHtml=uniform?uniformPriceMarkup(rate,uniformDefaultMrp(item),hasAdminDefault?uniformRateUnit(item):'',hasAdminDefault,!hasAdminDefault):(rate!==null?'<b class="custom-catalog-rate">'+(hasAdminDefault?'':'From ')+S.money(rate)+'</b>':'');return '<article class="product-card wellone-card custom-idea-card" tabindex="0" data-open-custom-item="'+S.esc(item.id)+'"><button type="button" class="card-share-button" data-share-kind="custom-item" data-share-value="'+S.esc(item.id)+'" data-share-label="'+S.esc(item.title||'Customization idea')+'" aria-label="Share '+S.esc(item.title||'customization idea')+'">'+I('share')+'</button><div class="product-image-wrap ratio-3x4 product-card-slider" data-card-slider="custom-'+S.esc(item.id)+'"><div class="product-slide-track">'+([item.card_image_url||images[0]||'assets/product-placeholder.svg']).map((src,i)=>'<div class="product-slide" data-slide-index="'+i+'">'+img(src,item.title+' '+(i+1),'product-image')+'</div>').join('')+'</div></div>'+''+'<div class="product-info custom-idea-info">'+(!uniform&&category?'<p>'+S.esc(category.name)+'</p>':'')+'<h3>'+S.esc(item.title||'Customization idea')+'</h3>'+rateHtml+(item.description?'<span>'+S.esc(item.description)+'</span>':'')+'<div class="custom-enquire-label">'+(uniform?'Choose':sportswear?(isCorporateTeeItem(item)?'Choose fabric':'Choose type'):isPrintableCustomItem(item)?'Choose printing':tshirt?'Choose fabric':'Enquire')+' '+I('arrow')+'</div>'+'</div></article>'; }
  // Render only the visible batch; all items remain searchable without creating thousands of DOM nodes.
  const CARD_BATCH_SIZE=24;
  function catalogueGridKey(){return [state.screen,state.customCategoryId,state.screen==='search'?state.headerSearchQuery:catalogueSearchValue(state.screen==='readyMade'?'ready':'custom')].join(':');}
  function customCategoryGrid(items){
    const key=catalogueGridKey(),shown=Math.max(CARD_BATCH_SIZE,Number(state.catalogueShown[key]||CARD_BATCH_SIZE));
    const batch=items.slice(0,shown),remaining=items.length-batch.length,showBulk=batch.length>=6;
    const desktop='<div class="product-grid catalog-grid responsive-catalog-grid custom-idea-grid custom-idea-grid-desktop'+(showBulk?' has-mobile-masonry':'')+'">'+batch.map(customIdeaCard).join('')+'</div>';
    let markup=desktop;
    if(showBulk){
      const left=batch.filter((_,index)=>index%2===0).map(customIdeaCard).join('');
      const banner='<div class="custom-mobile-bulk-enquiry" aria-hidden="true"><img src="assets/bulk-enquiry-discount.png" alt="Discount for bulk enquiries" loading="lazy" decoding="async"></div>';
      const right=batch.filter((_,index)=>index%2===1).map((item,index)=>customIdeaCard(item)+(index===0?banner:'')).join('');
      markup+='<div class="custom-idea-masonry" aria-label="Customization catalogue"><div class="custom-idea-masonry-column">'+left+'</div><div class="custom-idea-masonry-column">'+right+'</div></div>';
    }
    if(remaining>0)markup+='<div class="catalogue-more-wrap"><button type="button" class="catalogue-more-btn" data-catalogue-more>Load more items ('+remaining+' remaining)</button></div>';
    return markup;
  }
  function customCategory(){const c=state.customCatalogCategories.find(x=>String(x.id)===String(state.customCategoryId));if(!customCategoryPubliclyAccessible(c))return customCatalog();const section=c.catalogue_section==='ready'?'ready':'custom',q=catalogueSearchValue(section);const items=customItemsForCategory(c.id).filter(item=>catalogueSearchMatches(item,q));return '<main class="custom-category-page section-wrap screen screen-enter"><div class="catalog-title custom-category-title"><div><span class="eyebrow">'+(c.catalogue_section==='ready'?'READY MADE':'CUSTOMIZATION CATEGORY')+'</span><h1>'+S.esc(c.name)+'</h1>'+(c.description?'<p>'+S.esc(c.description)+'</p>':'')+'</div><div class="catalog-title-actions"><button type="button" class="inline-share-button" data-share-kind="custom-category" data-share-value="'+S.esc(c.id)+'" data-share-label="'+S.esc(c.name)+'" aria-label="Share category">'+I('share')+'</button></div></div>'+catalogueSearchBox(section)+(items.length?customCategoryGrid(items):'<div class="empty-state clean-empty"><h2>'+(q.trim()?'No matching items':'No ideas in this category yet')+'</h2></div>')+'</main>';}
  // Customer selectors use live Admin/Supabase rows; no frozen per-item price snapshots.
  // Always recheck before sending an enquiry, even if the detail screen has been open.
  const customerFabricPricingRequests={},fabricPricingCheckedAt={};
  // Stale-while-revalidate: render previously loaded Admin options instantly,
  // throttle list requests across items, and refresh on return/focus.
  const FABRIC_LIST_TTL=60000;
  function refreshCustomerFabricPricing(itemId,{silent=false,force=false}={}){
    const item=state.customCatalogItems.find(x=>String(x.id)===String(itemId));
    if(!item)return Promise.resolve(false);
    const jersey=isSportswearCustomItem(item),shirt=isTshirtCustomItem(item),printable=isPrintableCustomItem(item),printExtras=printable||isCorporateTeeItem(item);
    if(!jersey&&!shirt)return Promise.resolve(true);
    const mode=jersey?(printExtras?'corporate-jersey':'jersey'):printable?'printable':printExtras?'corporate-tshirt':'tshirt',requestKey=mode+':'+String(itemId),visible=()=>state.screen==='customItem'&&String(state.customItemId)===String(itemId),hasCache=jersey?!!(state.customSportswearFabrics?.length&&state.customSportswearTypes?.length):printable?Array.isArray(state.customPrintTypes):!!state.customCatalogFabrics?.length;if(!force&&hasCache&&Date.now()-(fabricPricingCheckedAt[mode]||0)<FABRIC_LIST_TTL)return Promise.resolve(true);
    if(customerFabricPricingRequests[requestKey])return customerFabricPricingRequests[requestKey];
    if(visible()&&!hasCache){state.fabricPricingLoading=true;state.fabricPricingError='';render();}
    const request=(async()=>{
      try{
        const sb=B?.supa?.();if(!sb)throw new Error('Supabase connection is not available');
        const [fabricResult,typeResult,itemResult,printResult]=await Promise.all([
          printable?Promise.resolve({data:[],error:null}):sb.from(jersey?'custom_sportswear_fabrics':'custom_catalog_fabrics').select('*').order('sort_order'),
          jersey?sb.from('custom_sportswear_types').select('*').order('sort_order'):Promise.resolve(null),
          sb.from('custom_catalog_items').select('id,rate,fabric_options,description,updated_at').eq('id',itemId).maybeSingle(),
          printExtras?sb.from('custom_print_types').select('*').order('sort_order'):Promise.resolve(null)
        ]);
        if(fabricResult?.error)throw fabricResult.error;
        if(jersey&&typeResult?.error)throw typeResult.error;
        if(printExtras&&printResult?.error)throw printResult.error;
        if(itemResult?.error)throw itemResult.error;
        const previousData=JSON.stringify([state.customSportswearFabrics,state.customSportswearTypes,state.customPrintTypes,state.customCatalogFabrics,state.customCatalogItems.find(x=>String(x.id)===String(itemId))?.rate,state.customCatalogItems.find(x=>String(x.id)===String(itemId))?.fabric_options,state.customCatalogItems.find(x=>String(x.id)===String(itemId))?.description,state.customFabricId,state.customQuality,state.customSportswearTypeId,state.sportswearSizeQty]),wasLoading=state.fabricPricingLoading,hadError=!!state.fabricPricingError;
        if(itemResult?.data){const at=state.customCatalogItems.findIndex(x=>String(x.id)===String(itemId));if(at>=0){state.customCatalogItems[at]={...state.customCatalogItems[at],...itemResult.data};}}
        fabricPricingCheckedAt[mode]=Date.now();const fabrics=fabricResult?.data||[];
        if(printExtras){state.customPrintTypes=printResult?.data||[];try{localStorage.setItem('one-line-custom-print-types-v155',JSON.stringify(state.customPrintTypes));}catch(_){}}
        if(jersey){
          state.customSportswearFabrics=fabrics;
          state.customSportswearTypes=typeResult?.data||[];
          try{localStorage.setItem('one-line-custom-sportswear-fabrics-v1',JSON.stringify(fabrics));localStorage.setItem('one-line-custom-sportswear-types-v1',JSON.stringify(state.customSportswearTypes));}catch(_){/* Storage is optional */}
        }else if(!printable){
          state.customCatalogFabrics=fabrics;
          try{localStorage.setItem('one-line-custom-catalog-fabrics-v1',JSON.stringify(fabrics));}catch(_){/* Storage is optional */}
        }
        if(visible()){
          const freshItem=state.customCatalogItems.find(x=>String(x.id)===String(itemId))||item,options=printable?[]:jersey?sportswearFabrics(freshItem):customAvailableFabrics(freshItem);
          const selected=options.find(x=>String(x.fabric.id)===String(state.customFabricId));
          if(!selected){state.customFabricId='';state.customQuality='';}
          else if(!selected.qualities.includes(state.customQuality))state.customQuality='';
          if(jersey&&!sportswearTypes(null).some(t=>String(t.id)===String(state.customSportswearTypeId)))state.customSportswearTypeId='';
          if(jersey||printExtras){const currentItem=state.customCatalogItems.find(x=>String(x.id)===String(itemId))||item,allowed=new Set(sportswearItemSizes(currentItem).map(row=>row.size));state.sportswearSizeQty=Object.fromEntries(Object.entries(state.sportswearSizeQty||{}).filter(([size])=>allowed.has(size)));if(printExtras){const activeTypes=(state.customPrintTypes||[]).filter(p=>p.active!==false);const active=new Set(activeTypes.map(p=>String(p.id)));state.printableSelectedPrintIds=(state.printableSelectedPrintIds||[]).filter(id=>active.has(String(id)));const chosen=new Set(state.printableSelectedPrintIds);const valid=new Set(activeTypes.filter(t=>chosen.has(String(t.id))).flatMap(t=>printableSizes(t).map(size=>String(t.id)+'::'+size.id)));state.printablePrintQty=Object.fromEntries(Object.entries(state.printablePrintQty||{}).filter(([key])=>valid.has(key)));}}
          state.fabricPricingError='';state.fabricPricingLoading=false;
          const currentData=JSON.stringify([state.customSportswearFabrics,state.customSportswearTypes,state.customPrintTypes,state.customCatalogFabrics,state.customCatalogItems.find(x=>String(x.id)===String(itemId))?.rate,state.customCatalogItems.find(x=>String(x.id)===String(itemId))?.fabric_options,state.customCatalogItems.find(x=>String(x.id)===String(itemId))?.description,state.customFabricId,state.customQuality,state.customSportswearTypeId,state.sportswearSizeQty]);
          if(wasLoading||hadError||previousData!==currentData)render();
        }
        return true;
      }catch(err){
        if(visible()){
          const before=state.fabricPricingLoading||!!state.fabricPricingError;
          state.fabricPricingLoading=false;
          state.fabricPricingError=hasCache?'':printable?'Could not load current item and printing rates. Try again.':'Could not load latest Admin fabric prices. Try again.';
          if(before||state.fabricPricingError)render();
          if(!silent)showToast(printable?'Unable to verify item pricing':'Unable to load fabric and price options');
        }
        console.warn('One-Line fabric pricing load failed:',err);
        return false;
      }
    })().finally(()=>{delete customerFabricPricingRequests[requestKey];});
    customerFabricPricingRequests[requestKey]=request;
    return request;
  }
  function tshirtFabricPicker(item){if(state.fabricPricingLoading)return '<div class="custom-fabric-empty"><b>Loading latest fabrics and prices…</b></div>';if(state.fabricPricingError)return '<div class="custom-fabric-empty"><b>'+S.esc(state.fabricPricingError)+'</b><button type="button" data-action="reload-fabric-prices">Retry loading</button></div>';const options=customAvailableFabrics(item);if(!options.length)return '<div class="custom-fabric-empty"><b>No fabrics are available for this item.</b><span>Ask our team to enable visible fabrics in Admin.</span></div>';const selected=options.find(x=>String(x.fabric.id)===String(state.customFabricId))||null,quality=selected&&selected.qualities.includes(state.customQuality)?state.customQuality:'',rate=quality?customFabricRate(selected.fabric,quality):null;return '<section class="custom-tshirt-options"><div class="custom-option-heading"><span class="eyebrow">T-SHIRT FABRIC</span><h3>Fabric</h3></div><div class="custom-fabric-grid">'+options.map(x=>{const rates=x.qualities.map(q=>customFabricRate(x.fabric,q)).filter(v=>v!==null);return '<button type="button" class="custom-fabric-choice '+(selected&&String(selected.fabric.id)===String(x.fabric.id)?'active':'')+'" data-custom-fabric="'+S.esc(x.fabric.id)+'" aria-pressed="'+!!(selected&&String(selected.fabric.id)===String(x.fabric.id))+'"><b>'+S.esc(x.fabric.name)+'</b><small>From '+S.money(Math.min(...rates))+'</small><span>'+x.qualities.length+' qualit'+(x.qualities.length===1?'y':'ies')+'</span></button>';}).join('')+'</div>'+(selected?'<div class="custom-quality-block"><div class="custom-option-heading compact"><span class="eyebrow">QUALITY</span><h3>'+S.esc(selected.fabric.name)+' quality</h3></div><div class="custom-quality-grid">'+selected.qualities.map(q=>'<button type="button" class="custom-quality-choice '+(quality===q?'active':'')+'" data-custom-quality="'+S.esc(q)+'"><span>'+S.esc(q)+'</span><b>'+S.money(customFabricRate(selected.fabric,q))+'</b></button>').join('')+'</div></div>':'')+(rate!==null?''+ (isCorporateTeeItem(item)?corporatePrintPicker()+jerseySizePicker(item,rate)+corporatePrintTotal(item,rate):''):'')+'</section>';}
  const JERSEY_DEFAULT_SIZES=[];
  function sportswearItemSizes(item){
    const raw=item?.fabric_options?.sportswear_sizes;
    const rows=Array.isArray(raw)?raw:JERSEY_DEFAULT_SIZES.map(size=>({size,rate:null,length_cm:null,width_cm:null}));
    return rows.map(v=>typeof v==='string'?{size:v,rate:null,length_cm:null,width_cm:null,stock:null,unlimited:true}:{size:String(v?.size||'').trim(),rate:v?.rate===null||v?.rate===undefined||v?.rate===''?null:Math.max(0,Number(v.rate)),length_cm:v?.length_cm===null||v?.length_cm===undefined||v?.length_cm===''?null:Math.max(0,Number(v.length_cm)),width_cm:v?.width_cm===null||v?.width_cm===undefined||v?.width_cm===''?null:Math.max(0,Number(v.width_cm)),stock:v?.stock===null||v?.stock===undefined||v?.stock===''?null:Math.max(0,Math.floor(Number(v.stock)||0)),unlimited:v?.unlimited===true||v?.stock===null||v?.stock===undefined||v?.stock===''}).filter(v=>v.size);
  }
  function sizeMeasurementsHtml(row){const measures=[];const inches=v=>String(Math.round(Number(v)/2.54*100)/100);if(row?.width_cm!==null&&row?.width_cm!==undefined&&Number.isFinite(Number(row.width_cm)))measures.push('Width '+inches(row.width_cm)+' in');if(row?.length_cm!==null&&row?.length_cm!==undefined&&Number.isFinite(Number(row.length_cm)))measures.push('Length '+inches(row.length_cm)+' in');return measures.length?'<small class="catalogue-size-measurements">'+S.esc(measures.join(' · '))+'</small>':'';}
  function selectedSportswearQty(item,baseRate){
    const sizes=sportswearItemSizes(item),lines=sizes.map(row=>{const requestedQty=Math.max(0,Math.min(1000000,Math.floor(Number(state.sportswearSizeQty?.[row.size]||0))));const qty=isPrintableCustomItem(item)&&!row.unlimited?Math.min(requestedQty,Math.max(0,Number(row.stock||0))):requestedQty;const unitRate=row.rate!==null?row.rate:baseRate;return{size:row.size,qty,rate:unitRate,length_cm:row.length_cm,width_cm:row.width_cm,separateRate:row.rate!==null};}).filter(v=>v.qty>0),totalQty=lines.reduce((n,v)=>n+v.qty,0),totalAmount=lines.reduce((n,v)=>n+v.qty*Math.max(0,Number(v.rate||0)),0);return{lines,totalQty,totalAmount};
  }
  function jerseySizePicker(item,baseRate){
    const sizes=sportswearItemSizes(item),selection=selectedSportswearQty(item,baseRate);
    return '<section class="jersey-size-picker" data-jersey-size-picker><div class="custom-option-heading compact"><span class="eyebrow">SIZES & QUANTITY</span><h3>Sizes & quantity</h3></div><div class="jersey-size-list">'+sizes.map(row=>{
      const qty=Math.max(0,Math.floor(Number(state.sportswearSizeQty?.[row.size]||0)));const tracked=isPrintableCustomItem(item)&&!row.unlimited,available=Math.max(0,Math.floor(Number(row.stock||0))),out=tracked&&available===0;
      return '<div class="jersey-size-row"><div class="jersey-size-label"><span class="uniform-size-and-stock"><b>'+S.esc(row.size)+'</b>'+(tracked?'<small class="printable-availability '+(out?'out':'')+'">'+(out?'Out of stock':available+' in stock')+'</small>':'')+(row.rate!==null?'<small class="catalogue-special-size-rate">'+S.money(row.rate)+'</small>':'')+'</span>'+sizeMeasurementsHtml(row)+'</div><div class="uniform-qty-stepper"><button type="button" data-jersey-qty-minus="'+S.esc(row.size)+'" aria-label="Decrease '+S.esc(row.size)+'" '+(out?'disabled':'')+'>−</button><input type="number" min="0" max="'+(tracked?available:1000000)+'" step="1" inputmode="numeric" data-jersey-size-qty="'+S.esc(row.size)+'" value="'+qty+'" aria-label="'+S.esc(row.size)+' quantity" '+(out?'disabled':'')+'><button type="button" data-jersey-qty-plus="'+S.esc(row.size)+'" aria-label="Increase '+S.esc(row.size)+'" '+(out?'disabled':'')+'>+</button></div></div>';
    }).join('')+'</div><div class="jersey-size-summary" data-jersey-qty-summary>'+(isPrintableCustomItem(item)?'<span>'+selection.totalQty+' garment'+(selection.totalQty===1?'':'s')+' selected</span>':jerseySizeSummaryHtml(selection))+'</div></section>';
  }
  function jerseySizeSummaryHtml(sel){return '<span>'+sel.totalQty+' item'+(sel.totalQty===1?'':'s')+' selected</span>'+(sel.totalQty?'<strong>Total '+S.money(sel.totalAmount)+'</strong>':'<small>Select at least one size</small>');}
  function bindJerseyQtyControls(){
    const item=state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId));if(!item||!(isSportswearCustomItem(item)||isPrintableCustomItem(item)||isCorporateTeeItem(item)))return;
    const update=(size,qty)=>{const row=sportswearItemSizes(item).find(v=>v.size===size),max=isPrintableCustomItem(item)&&row&&!row.unlimited?Math.max(0,Number(row.stock||0)):1000000;state.sportswearSizeQty={...state.sportswearSizeQty,[size]:Math.max(0,Math.min(max,1000000,Math.floor(Number(qty)||0)))};const input=[...root.querySelectorAll('[data-jersey-size-qty]')].find(el=>el.dataset.jerseySizeQty===size);if(input)input.value=String(state.sportswearSizeQty[size]);state.enquirySuccessId='';const types=sportswearTypes(item),fabrics=sportswearFabrics(item),type=types.find(t=>String(t.id)===String(state.customSportswearTypeId)),fabric=fabrics.find(x=>String(x.fabric.id)===String(state.customFabricId)),shirtFabric=isCorporateTeeItem(item)&&isTshirtCustomItem(item)?customAvailableFabrics(item).find(x=>String(x.fabric.id)===String(state.customFabricId)):null,base=isPrintableCustomItem(item)?printableSelection(item).base:shirtFabric?(shirtFabric.qualities.includes(state.customQuality)?customFabricRate(shirtFabric.fabric,state.customQuality):null):type&&fabric&&fabric.qualities.includes(state.customQuality)?sportswearRate(fabric.fabric,state.customQuality,type):null,sel=selectedSportswearQty(item,base);const summary=root.querySelector('[data-jersey-qty-summary]');if(summary)summary.innerHTML=isPrintableCustomItem(item)?'<span>'+sel.totalQty+' garment'+(sel.totalQty===1?'':'s')+' selected</span>':jerseySizeSummaryHtml(sel);const button=root.querySelector('[data-action="custom-catalog-enquiry"]');if(button){button.disabled=base===null||!sel.totalQty;button.classList.remove('sent');}if(isPrintableCustomItem(item))syncPrintableTotal(item);else syncCorporatePrintTotal(item); };
    root.querySelectorAll('[data-jersey-size-qty]').forEach(input=>input.addEventListener('input',()=>update(input.dataset.jerseySizeQty,input.value)));
    root.querySelectorAll('[data-jersey-qty-minus],[data-jersey-qty-plus]').forEach(btn=>btn.addEventListener('click',()=>{const size=btn.dataset.jerseyQtyMinus||btn.dataset.jerseyQtyPlus,input=[...root.querySelectorAll('[data-jersey-size-qty]')].find(el=>el.dataset.jerseySizeQty===size);if(input)update(size,Number(input.value||0)+(btn.dataset.jerseyQtyPlus!==undefined?1:-1));}));
  }
  // Defaults make each garment card show an exact final rate for the currently chosen fabric / quality.
  // When Admin hides an option, the next active option is selected without losing valid choices.
  function ensureCatalogueGarmentDefaults(item){
    if(!(isSportswearCustomItem(item)||isPrintableCustomItem(item)))return;
    // The full sublimation flow must begin empty; corporate selections remain buyer-controlled.
    if(isPrintableCustomItem(item)||isFullSublimationItem(item))return;
    if(isCorporateTeeItem(item)){const types=sportswearTypes(item);if(!types.some(t=>String(t.id)===String(state.customSportswearTypeId)))state.customSportswearTypeId=String((types.find(t=>t.is_base)||types[0])?.id||'');return;}
    const types=sportswearTypes(item),fabrics=sportswearFabrics(item);
    if(!types.some(t=>String(t.id)===String(state.customSportswearTypeId)))state.customSportswearTypeId=String((types.find(t=>t.is_base)||types[0])?.id||'');
    let fabric=fabrics.find(v=>String(v.fabric.id)===String(state.customFabricId));
    if(!fabric){fabric=fabrics[0];state.customFabricId=String(fabric?.fabric.id||'');}
    if(!fabric?.qualities.includes(state.customQuality))state.customQuality=fabric?(fabric.qualities.includes('Standard')?'Standard':fabric.qualities[0]||''):'';
  }
  function garmentCardRate(fabric,quality,type){
    if(!fabric||!quality||!type)return null;
    const rate=customFabricRate(fabric,quality);
    return rate===null?null:Math.max(0,rate+sportswearTypeAdjustment(type));
  }
  function sportswearPicker(item){
    if(state.fabricPricingLoading)return '<div class="custom-fabric-empty"><b>Loading prices…</b></div>';
    if(state.fabricPricingError)return '<div class="custom-fabric-empty"><b>'+S.esc(state.fabricPricingError)+'</b><button type="button" data-action="reload-fabric-prices">Retry</button></div>';
    const types=sportswearTypes(item),fabrics=sportswearFabrics(item),type=types.find(t=>String(t.id)===String(state.customSportswearTypeId)),selected=fabrics.find(v=>String(v.fabric.id)===String(state.customFabricId));
    if(!types.length||!fabrics.length)return '<div class="custom-fabric-empty">No fabric prices available.</div>';
    const quality=selected?.qualities.includes(state.customQuality)?state.customQuality:'',rate=type&&selected&&quality?sportswearRate(selected.fabric,quality,type):null;
    return '<section class="custom-tshirt-options custom-sportswear-options refined-choice-flow">'+
      (isCorporateTeeItem(item)?'':'<div class="custom-option-heading"><h3>Type</h3></div><div class="custom-fabric-grid custom-sportswear-type-grid">'+types.map(t=>{
        const exact=selected&&quality?garmentCardRate(selected.fabric,quality,t):null;
        return '<button type="button" class="custom-fabric-choice custom-sportswear-type-choice '+(String(type?.id)===String(t.id)?'active':'')+'" data-custom-sportswear-type="'+S.esc(t.id)+'" aria-pressed="'+(String(type?.id)===String(t.id))+'"><b>'+S.esc(t.name)+'</b>'+(exact!==null?'<small>'+S.money(exact)+'</small>':'')+'</button>';
      }).join('')+'</div>')+
      (type?'<div class="custom-quality-block"><div class="custom-option-heading compact"><h3>Fabric</h3></div><div class="custom-fabric-grid">'+fabrics.map(v=>{
        const q=v.qualities.includes(quality)?quality:(v.qualities.includes('Standard')?'Standard':v.qualities[0]);
        const p=garmentCardRate(v.fabric,q,type);
        return '<button type="button" class="custom-fabric-choice '+(String(selected?.fabric.id)===String(v.fabric.id)?'active':'')+'" data-custom-fabric="'+S.esc(v.fabric.id)+'" aria-pressed="'+(String(selected?.fabric.id)===String(v.fabric.id))+'"><b>'+S.esc(v.fabric.name)+'</b>'+(p!==null?'<small>'+S.money(p)+'</small>':'')+'</button>';
      }).join('')+'</div></div>':'')+
      (type&&selected?'<div class="custom-quality-block"><div class="custom-option-heading compact"><h3>Quality</h3></div><div class="custom-quality-grid">'+selected.qualities.map(q=>'<button type="button" class="custom-quality-choice '+(quality===q?'active':'')+'" data-custom-quality="'+S.esc(q)+'" aria-pressed="'+(quality===q)+'"><span>'+S.esc(q)+'</span><b>'+S.money(sportswearRate(selected.fabric,q,type))+'</b></button>').join('')+'</div></div>':'')+
      (rate!==null?''+(isCorporateTeeItem(item)?corporatePrintPicker():'')+jerseySizePicker(item,rate)+(isCorporateTeeItem(item)?corporatePrintTotal(item,rate):''):'')+'</section>';
  }
  // Printable products: same live garment styles and T-shirt fabrics,
  // with admin-managed print extras. Garment and print totals are independent.
  function printableTypes(){return (state.customPrintTypes||[]).filter(p=>p.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));}
  // Fixed print choices across Ready Stock and Corporate Tee. Old sizes are
  // matched by stable IDs first, so legacy labels/duplicates cannot create extra rows.
  function printableSizes(type){
    if(!type)return[];
    const raw=(Array.isArray(type.sizes)?type.sizes:[]).filter(s=>s&&s.active!==false&&String(s.id||'').trim()&&Number.isFinite(Number(s.rate))&&Number(s.rate)>=0);
    const base=String(type.name||'').toLowerCase(),defaults=/embroider/.test(base)?[50,75,100]:/sublim/.test(base)?[20,30,40]:/screen/.test(base)?[15,25,35]:[10,20,30];
    const slots=[['Standard','Logo Size'],['Large','Name Size'],['Number','Number Size']];
    const used=new Set();
    return slots.map(([id,name],index)=>{
      const matches=raw.filter(x=>!used.has(String(x.id)));
      let item=matches.find(x=>String(x.id)===id);
      if(!item){const pattern=index===0?/\b(logo|standard)\b/i:index===1?/\b(name|letter|large)\b/i:/\bnumber\b/i;item=matches.find(x=>pattern.test(String(x.name||'')));}
      if(item)used.add(String(item.id));
      // Newly supplied fallback rows become orderable after the v183 SQL migration.
      const rate=item?Number(item.rate):defaults[index];
      return {id:item?String(item.id):id,name,rate};
    });
  }
  function selectedPrintExtras(){
    const includePrinting=state.printableIncludePrint!==false;
    const selectedIds=new Set(includePrinting?(state.printableSelectedPrintIds||[]).map(String):[]);
    const printTypes=printableTypes().filter(type=>selectedIds.has(String(type.id)));
    const prints=printTypes.flatMap(type=>printableSizes(type).map(size=>{
      const qty=Math.max(0,Math.min(10000,Math.floor(Number(state.printablePrintQty?.[String(type.id)+'::'+size.id]||0))));
      return qty?{id:String(type.id),name:String(type.name),size:size.id,sizeLabel:size.name,qty,rate:size.rate,total:qty*size.rate}:null;
    }).filter(Boolean));
    return {includePrinting,printType:printTypes[0]||null,printTypes,prints,printsPerGarment:prints.reduce((sum,p)=>sum+p.total,0),ready:!includePrinting||(printTypes.length>0&&printTypes.every(type=>printableSizes(type).length>0&&prints.some(p=>p.id===String(type.id))))};
  }
  function corporatePrintSelection(item,baseRate){
    const extra=selectedPrintExtras(),garments=selectedSportswearQty(item,baseRate);
    const printsTotal=extra.printsPerGarment*garments.totalQty;
    return {...extra,garments,printsTotal,totalAmount:garments.totalAmount+printsTotal,ready:extra.ready&&baseRate!==null&&garments.totalQty>0};
  }
  function corporatePrintSummaryHtml(selection){
    return '<span>'+selection.garments.totalQty+' garment'+(selection.garments.totalQty===1?'':'s')+(selection.includePrinting?' · Prints '+S.money(selection.printsPerGarment)+'/garment':' · No printing')+'</span><strong>Order total '+S.money(selection.totalAmount)+'</strong>';
  }
  function corporatePrintPicker(){
    return '<section class="printable-print-section" data-print-selector>'+printablePrintOptionsHtml()+'</section>';
  }
  function corporatePrintTotal(item,baseRate){
    return '<div class="printable-total-summary" data-corporate-print-total>'+corporatePrintSummaryHtml(corporatePrintSelection(item,baseRate))+'</div>';
  }
  function syncCorporatePrintTotal(item){
    if(!isCorporateTeeItem(item))return;
    const fabric=isSportswearCustomItem(item)?sportswearFabrics(item).find(v=>String(v.fabric.id)===String(state.customFabricId)):customAvailableFabrics(item).find(v=>String(v.fabric.id)===String(state.customFabricId));
    const quality=fabric?.qualities.includes(state.customQuality)?state.customQuality:'';
    const type=isSportswearCustomItem(item)?sportswearTypes(item).find(v=>String(v.id)===String(state.customSportswearTypeId)):null;
    const base=fabric&&quality?(isSportswearCustomItem(item)?(type?sportswearRate(fabric.fabric,quality,type):null):customFabricRate(fabric.fabric,quality)):null;
    const selection=corporatePrintSelection(item,base),summary=root.querySelector('[data-corporate-print-total]');
    if(summary)summary.innerHTML=corporatePrintSummaryHtml(selection);
    const enquiry=root.querySelector('[data-action="custom-catalog-enquiry"]');
    if(enquiry)enquiry.disabled=!selection.ready;
  }
  function printableSelection(item){
    const extra=selectedPrintExtras(),garment=null;
    const fabric=null,quality='',base=(item.rate!==null&&item.rate!==undefined&&Number.isFinite(Number(item.rate))&&Number(item.rate)>=0)?Number(item.rate):null;
    const sizes=selectedSportswearQty(item,base);
    const printsTotal=extra.printsPerGarment*sizes.totalQty;
    return {garment,fabric:fabric?.fabric||null,quality,base,sizes,...extra,printsTotal,totalAmount:sizes.totalAmount+printsTotal,ready:base!==null&&sizes.totalQty>0&&extra.ready};
  }
  function printableSummaryHtml(sel){return '<span>'+sel.sizes.totalQty+' garment'+(sel.sizes.totalQty===1?'':'s')+(sel.includePrinting?' · Prints '+S.money(sel.printsPerGarment)+'/garment':' · No printing')+'</span><strong>Order total '+S.money(sel.totalAmount)+'</strong>'; }
  function printablePicker(item){
    const sel=printableSelection(item);
    return '<section class="custom-tshirt-options printable-options refined-choice-flow">'+
      (sel.base===null?'<div class="custom-fabric-empty">Ask Admin to set the Ready Stock base garment rate.</div>':'')+
      '<section class="printable-print-section" data-print-selector>'+printablePrintOptionsHtml()+'</section>'+
      (sel.base!==null?jerseySizePicker(item,sel.base)+'<div class="printable-total-summary" data-printable-total>'+printableSummaryHtml(sel)+'</div>':'')+'</section>';
  }
  // Multiple print types can be selected; each type retains independent size quantities.
  function printSizeLabel(size){return size==='Standard'?'Logo Size':size==='Large'?'Name Size':size==='Number'?'Number Size':String(size||'');}
  const PRINT_INFO=[
    [/dtf|direct.to.film/i,'DTF Print','A full-colour design is transferred onto a garment using film, adhesive powder, and heat. The print sits on top of the fabric with a smooth feel. Good for colourful logos and small runs.'],
    [/embroi|thread|stitch/i,'Embroidery','A logo or design is stitched with threads into the garment. It creates a raised, textured, premium finish. Small tiny letters or gradients may not reproduce clearly.'],
    [/sublim/i,'Sublimation','The artwork is heat-transferred into suitable polyester fabric using dye. The result feels part of the fabric rather than a raised layer. Colour and material affect the final look.'],
    [/screen/i,'Screen Print','Ink is pushed through a patterned mesh screen onto the garment. It gives solid, durable colour and often suits bulk orders with repeated designs.']
  ];
  function printInfo(name){const x=PRINT_INFO.find(([pattern])=>pattern.test(name));return {title:name||'Print',description:x?x[2]:'This printing method has different finishes depending on the fabric, design, ink and production setup. Contact the shop to inspect an actual sample before placing a bulk order.'};}
  function printSlug(name){if(/dtf|direct.to.film/i.test(name))return'dtf';if(/embroi/i.test(name))return'embroidery';if(/sublim/i.test(name))return'sublimation';if(/screen/i.test(name))return'screen-print';return'other-print';}
  function printInfoIcon(){return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.9"/><path d="M12 7v7" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.15" fill="currentColor"/></svg>';}
  function printInfoModal(){if(!state.printInfoId)return'';const t=printableTypes().find(x=>String(x.id)===String(state.printInfoId));if(!t)return'';const info=printInfo(t.name),href='print-guide.html#'+printSlug(t.name);return '<div class="print-info-backdrop" data-close-print-info><section class="print-info-dialog" role="dialog" aria-modal="true" aria-label="Print method information"><button type="button" class="print-info-close" data-close-print-info aria-label="Close print information">← Back</button><span class="print-info-tag">PRINT GUIDE</span><h2>'+S.esc(info.title)+'</h2><p>'+S.esc(info.description)+'</p><a class="print-info-more" href="'+S.esc(href)+'">More <span aria-hidden="true">→</span></a></section></div>';}
  function printablePrintOptionsHtml(){
    const types=printableTypes(),selectedIds=new Set((state.printableSelectedPrintIds||[]).map(String));
    return '<label class="printable-include-toggle"><span class="printable-include-text"><b>Add printing</b></span><input type="checkbox" data-print-include '+(state.printableIncludePrint!==false?'checked':'')+' aria-label="Add printing"><span class="printable-toggle-track" aria-hidden="true"></span></label>'+
      (state.printableIncludePrint===false?'':'<div class="custom-option-heading compact"><h3>Print type</h3><small>Choose print quantities for each garment.</small></div>'+
      (types.length?'<div class="printable-print-types" role="group" aria-label="Print types — select one or more">'+types.map(t=>{const selected=selectedIds.has(String(t.id));return '<div class="printable-type-wrap"><button type="button" class="printable-type-card '+(selected?'active':'')+'" data-print-type-choice="'+S.esc(t.id)+'" aria-label="'+(selected?'Deselect ':'Select ')+S.esc(t.name)+'" aria-pressed="'+selected+'"><span class="printable-type-check" aria-hidden="true">'+(selected?'✓':'+')+'</span></button><div class="printable-type-name-row"><span class="printable-type-title" aria-hidden="true">'+S.esc(t.name)+'</span><button class="print-info-trigger" type="button" data-print-info="'+S.esc(t.id)+'" aria-label="About '+S.esc(t.name)+'">'+printInfoIcon()+'</button></div></div>';}).join('')+'</div>':'<div class="custom-fabric-empty">No print types configured. Add print options in Admin.</div>')+
      types.filter(type=>selectedIds.has(String(type.id))).map(type=>{const sizes=printableSizes(type);return '<div class="printable-size-stage" data-print-size-stage="'+S.esc(type.id)+'"><div class="custom-option-heading compact"><span class="eyebrow">PRINT SIZES</span><h3>'+S.esc(type.name)+'</h3></div>'+
        (sizes.length?'<div class="printable-size-quantity-list">'+sizes.map(size=>{const key=String(type.id)+'::'+size.id,qty=Math.max(0,Math.min(10000,Math.floor(Number(state.printablePrintQty?.[key]||0))));return '<div class="printable-active-quantity"><div class="printable-qty-name"><b>'+S.esc(size.name)+'</b><small>'+S.money(size.rate)+' per print on each garment <span class="printable-size-line-subtotal" data-print-subtotal="'+S.esc(key)+'">'+(qty?' · '+S.money(size.rate*qty)+'/garment':'')+'</span></small></div><div class="uniform-qty-stepper"><button type="button" data-print-qty-minus="'+S.esc(key)+'" aria-label="Decrease '+S.esc(size.name)+' quantity">−</button><input type="number" min="0" max="10000" step="1" inputmode="numeric" data-print-qty="'+S.esc(key)+'" value="'+qty+'" aria-label="'+S.esc(size.name)+' quantity"><button type="button" data-print-qty-plus="'+S.esc(key)+'" aria-label="Increase '+S.esc(size.name)+' quantity">+</button></div></div>';}).join('')+'</div>':'<div class="custom-fabric-empty">This print type has no active sizes. Ask Admin to add one.</div>')+'</div>';}).join(''));
  }
  function bindPrintableQtyControls(){
    const item=state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId));if(!item||!(isPrintableCustomItem(item)||isCorporateTeeItem(item)))return;
    const update=(key,value)=>{
      if(!(state.printableSelectedPrintIds||[]).includes(key.split('::')[0]))return;
      const valueInt=Math.max(0,Math.min(10000,Math.floor(Number(value)||0)));
      state.printablePrintQty={...state.printablePrintQty,[key]:valueInt};
      // Update only the changed row: replacing all print controls after every tap
      // interrupted double-taps and input focus on mobile.
      const input=[...root.querySelectorAll('[data-print-qty]')].find(v=>v.dataset.printQty===key);
      if(input)input.value=String(valueInt);
      const subtotal=[...root.querySelectorAll('[data-print-subtotal]')].find(v=>v.dataset.printSubtotal===key);
      if(subtotal){const selected=printableTypes().find(v=>String(v.id)===key.split('::')[0]),size=printableSizes(selected).find(v=>String(selected.id)+'::'+v.id===key);subtotal.textContent=size&&valueInt?' · '+S.money(size.rate*valueInt)+'/garment':'';}
      if(isPrintableCustomItem(item))syncPrintableTotal(item);else syncCorporatePrintTotal(item);
    };
    root.querySelectorAll('[data-print-include]').forEach(toggle=>toggle.addEventListener('change',()=>{
      state.printableIncludePrint=toggle.checked;state.printableActivePrintId='';state.printableActivePrintSize='';state.printableSelectedPrintIds=[];state.printablePrintQty={};
      render();
    }));
    root.querySelectorAll('[data-print-type-choice]').forEach(btn=>btn.addEventListener('click',()=>{
      const next=String(btn.dataset.printTypeChoice||'');
      const selected=new Set(state.printableSelectedPrintIds||[]);
      if(selected.has(next)){selected.delete(next);state.printablePrintQty=Object.fromEntries(Object.entries(state.printablePrintQty||{}).filter(([key])=>!key.startsWith(next+'::')));}
      else selected.add(next);
      state.printableSelectedPrintIds=[...selected];
      render(); // Stage changes may show or hide garment sizes; quantity taps remain incremental.
    }));
    root.querySelectorAll('[data-print-qty]').forEach(input=>input.addEventListener('input',()=>update(input.dataset.printQty,input.value)));
    root.querySelectorAll('[data-print-qty-minus],[data-print-qty-plus]').forEach(btn=>btn.addEventListener('click',()=>{
      const key=btn.dataset.printQtyMinus||btn.dataset.printQtyPlus,input=[...root.querySelectorAll('[data-print-qty]')].find(v=>v.dataset.printQty===key);
      if(input)update(key,Number(input.value||0)+(btn.dataset.printQtyPlus!==undefined?1:-1));
    }));
  }
  function syncPrintableTotal(item){const el=root.querySelector('[data-printable-total]');if(el)el.innerHTML=printableSummaryHtml(printableSelection(item));const ready=printableSelection(item).ready;root.querySelectorAll('[data-action="printable-add-cart"],[data-action="printable-buy-now"]').forEach(x=>{x.disabled=false;x.title=ready?'': 'Choose garment sizes'+(state.printableIncludePrint!==false?', print type and print-size quantity':'');});}
  async function addPrintableOrderToCart(id,buyNow){
    const itemId=String(id||state.customItemId);const ok=await refreshCustomerFabricPricing(itemId,{force:true,silent:true});if(!ok){showToast('Cannot verify current prices. Retry.');return;}
    const item=state.customCatalogItems.find(x=>String(x.id)===itemId),sel=item?printableSelection(item):null;
    if(!sel?.ready){showToast('Select garment sizes'+(state.printableIncludePrint!==false?', print type and print-size quantity.':'.'));return;}
    const category=customCategoryForItem(item),sizes=sel.sizes.lines.map(v=>({...v})),price=sel.totalAmount/sel.sizes.totalQty;
    const design={kind:'printable_order',itemId:item.id,itemTitle:item.title,categoryName:category?.name||'',fabricId:'',fabricName:'',quality:'',cardImage:item.images?.[0]||'',images:(item.images||[]).slice(0,20),printableSizes:sizes,sizeQuantities:Object.fromEntries(sizes.map(v=>[v.size,v.qty])),sizeRates:Object.fromEntries(sizes.map(v=>[v.size,v.rate])),includePrinting:sel.includePrinting,selectedPrintTypeId:sel.printType?.id||'',selectedPrintTypeName:sel.printType?.name||'',selectedPrintTypeIds:sel.printTypes.map(t=>String(t.id)),selectedPrints:sel.prints,garmentTotal:sel.sizes.totalAmount,printsPerGarment:sel.printsPerGarment,printsTotal:sel.printsTotal,totalPieces:sel.sizes.totalQty,totalAmount:sel.totalAmount};
    const cartItem={itemType:'printable_order',custom:true,name:item.title||'Printable item',code:item.display_id||item.id,qty:sel.sizes.totalQty,price,total:sel.totalAmount,image:design.cardImage,detail:[sizes.map(v=>v.size+' × '+v.qty).join(', '),sel.prints.map(p=>p.name+' '+p.sizeLabel+' × '+p.qty+'/garment').join(', ')].filter(Boolean).join(' · '),design};
    if(buyNow){startDirectCheckout(cartItem);}
    else {const added=await addCart(cartItem,false);if(added){state.printablePrintQty={};state.printableSelectedPrintIds=[];state.printableActivePrintId='';state.printableActivePrintSize='';state.sportswearSizeQty={};render();showToast(isCorporateTeeItem(item)?'Corporate Tee Shirt added to cart':'Printable item added to cart');}}
  }
  async function addJerseyOrderToCart(id,buyNow){
    const itemId=String(id||state.customItemId),ok=await refreshCustomerFabricPricing(itemId,{force:true,silent:true});
    if(!ok){showToast('Could not verify latest prices. Retry.');return;}
    const item=state.customCatalogItems.find(i=>String(i.id)===itemId);
    if(!item||!isSportswearCustomItem(item))return;
    const type=sportswearTypes(item).find(t=>String(t.id)===String(state.customSportswearTypeId));
    const fabric=sportswearFabrics(item).find(f=>String(f.fabric.id)===String(state.customFabricId));
    const quality=state.customQuality;
    if(!type||!fabric||!fabric.qualities.includes(quality)){showToast('Choose a type, fabric and quality.');return;}
    const base=sportswearRate(fabric.fabric,quality,type),sizes=selectedSportswearQty(item,base);
    if(!sizes.totalQty){showToast('Choose at least one size.');return;}
    const extra=isCorporateTeeItem(item)?selectedPrintExtras():null;if(extra&&!extra.ready){showToast('Choose print-size quantities for every selected print type, or turn off printing.');return;}
    const printsPerGarment=extra?.printsPerGarment||0,printsTotal=printsPerGarment*sizes.totalQty,totalAmount=sizes.totalAmount+printsTotal;
    const design={kind:'jersey_order',itemId:item.id,itemTitle:item.title,garmentTypeId:type.id,garmentTypeName:type.name,fabricId:fabric.fabric.id,fabricName:fabric.fabric.name,quality,jerseySizes:sizes.lines,totalPieces:sizes.totalQty,garmentTotal:sizes.totalAmount,includePrinting:extra?.includePrinting??false,selectedPrintTypeIds:extra?.printTypes.map(v=>String(v.id))||[],selectedPrints:extra?.prints||[],printsPerGarment,printsTotal,totalAmount,images:(item.images||[]).slice(0,20),cardImage:item.card_image_url||item.images?.[0]||''};
    const cartItem={itemType:'jersey_order',custom:true,name:item.title||'Jersey',code:item.display_id||item.id,qty:sizes.totalQty,price:totalAmount/sizes.totalQty,total:totalAmount,image:design.cardImage,detail:[...(isCorporateTeeItem(item)?[]:[type.name]),fabric.fabric.name,quality,sizes.lines.map(r=>r.size+' × '+r.qty).join(', '),...(extra?extra.prints.map(p=>p.name+' '+p.sizeLabel+' × '+p.qty+'/garment'):[])].filter(Boolean).join(' · '),design};
    if(buyNow){startDirectCheckout(cartItem);}
    else {const added=await addCart(cartItem,false);if(added){state.sportswearSizeQty={};render();showToast('Jersey added to cart');}}
  }
  function uniformDescriptionHtml(item){const cfg=uniformConfig(item),active=uniformAllVariants(cfg).find(v=>String(v.id)===String(state.uniformGalleryVariantId||'')),fallback=(cfg.description_blocks||[]).slice(-1)[0]||{},b={heading:active?.detail_title||fallback.heading||'',points:active?.detail_description||item.description||fallback.points||''};if(!b.heading&&!b.points)return'';const points=String(b.points||'').split(/[,\n]+/).map(x=>x.trim()).filter(Boolean);return '<div class="kids-uniform-description"><section>'+(b.heading?'<h3>'+S.esc(b.heading.replace(/^[-\s]+|[-\s]+$/g,''))+'</h3>':'')+(active||item.description? ((active?.detail_description&&item.description&&String(active.detail_description).trim()!==String(item.description).trim()?'<p class="uniform-item-description">'+S.esc(item.description)+'</p>':'')+(b.points?'<p class="uniform-variant-detail-copy">'+S.esc(b.points)+'</p>':'')):(points.length?'<div class="kids-uniform-point-list">'+points.map(x=>'<span>'+I('check')+'<b>'+S.esc(x)+'</b></span>').join('')+'</div>':''))+'</section></div>'; }
  function uniformOptionFromRate(option){if(!option)return null;const own=option?.rate!==undefined&&option?.rate!==null&&option?.rate!==''?Number(option.rate):null,itemRate=option?.itemRate!==undefined&&option?.itemRate!==null&&option?.itemRate!==''?Number(option.itemRate):null;return Number.isFinite(own)?Math.max(0,own):(Number.isFinite(itemRate)?Math.max(0,itemRate):null);}
  function uniformActiveOption(sel){const activeId=String(state.uniformGalleryVariantId||'');return sel?.options?.find(v=>String(v.id)===activeId)||null;}
  function uniformDefaultDisplayRate(item){const direct=configuredCustomFinalRate(item);return direct!==null?direct:uniformFromRate(item);}
  function uniformDisplayedSetRate(item,sel=uniformSelection(item)){const active=uniformActiveOption(sel);if(!active)return uniformDefaultDisplayRate(item);const selected=(sel.selectedItems||[]).find(v=>String(v.id)===String(active.id));if(selected&&Number(selected.orderedQty||0)>0)return Number(selected.lineTotal||0);const activeRate=uniformOptionFromRate(active);return activeRate!==null?activeRate:uniformDefaultDisplayRate(item);}
  function uniformOptionMrp(option){if(!option)return null;const own=option?.mrp!==undefined&&option?.mrp!==null&&option?.mrp!==''?Number(option.mrp):null,itemMrp=option?.itemMrp!==undefined&&option?.itemMrp!==null&&option?.itemMrp!==''?Number(option.itemMrp):null;return Number.isFinite(own)?Math.max(0,own):(Number.isFinite(itemMrp)?Math.max(0,itemMrp):null);}
  function uniformDefaultMrp(item){const v=uniformConfig(item)?.default_mrp;return v!==undefined&&v!==null&&v!==''&&Number.isFinite(Number(v))?Math.max(0,Number(v)):null;}
  function uniformDisplayedMrp(item,sel=uniformSelection(item)){const active=uniformActiveOption(sel);if(!active)return uniformDefaultMrp(item);const unit=uniformOptionMrp(active),selected=(sel.selectedItems||[]).find(v=>String(v.id)===String(active.id)),qty=Math.max(0,Number(selected?.orderedQty||0));return unit!==null&&qty>0?unit*qty:unit;}
  function uniformRateUnit(item){const unit=uniformConfig(item)?.rate_unit;return RATE_UNIT_OPTIONS.includes(unit)?unit:'Set';}
  function uniformPriceMarkup(rate,mrp,unit='',showUnit=false,showFrom=false){
    const validRate=rate!==null&&rate!==undefined&&rate!==''&&Number.isFinite(Number(rate));
    const validMrp=mrp!==null&&mrp!==undefined&&mrp!==''&&Number.isFinite(Number(mrp));
    if(!validRate&&!validMrp)return '';
    const finalRate=validRate?Math.max(0,Number(rate)):null,mrpRate=validMrp?Math.max(0,Number(mrp)):null;
    const showCross=mrpRate!==null&&(finalRate===null||mrpRate>finalRate);
    return '<span class="uniform-price-stack">'
      +(mrpRate!==null?'<span class="uniform-price-mrp"><span class="uniform-mrp-label">MRP</span> '+(showCross?'<del class="uniform-mrp-value">'+S.money(mrpRate)+'</del>':'<span class="uniform-mrp-value">'+S.money(mrpRate)+'</span>')+'</span>':'')
      +(finalRate!==null?'<span class="uniform-final-group">'+(showFrom?'<span class="uniform-from-label">From</span>':'')+'<strong class="uniform-price-final">'+S.money(finalRate)+'</strong>'+(unit==='Onwards'?'<small class="uniform-rate-unit">Onwards</small>':(showUnit?'<small class="uniform-rate-unit">/'+S.esc(unit||'Set')+'</small>':''))+'</span>':'')
      +'</span>';
  }
  function uniformDisplayMrp(item,sel=uniformSelection(item)){
    const cfg=sel?.cfg||uniformConfig(item),raw=cfg?.default_mrp,base=raw===null||raw===undefined||raw===''?null:Number(raw);
    const active=uniformActiveOption(sel);if(!active)return Number.isFinite(base)?base:null;
    const rawOption=active.mrp;const own=rawOption===null||rawOption===undefined||rawOption===''?null:Number(rawOption);
    const each=Number.isFinite(own)?own:(Number.isFinite(base)?base:null);
    if(each===null)return null;
    const picked=(sel.selectedItems||[]).find(v=>String(v.id)===String(active.id));
    return each*Math.max(1,Number(picked?.orderedQty||0));
  }
  function uniformPriceHtml(item,sel=uniformSelection(item)){
    const final=uniformDisplayedSetRate(item,sel),mrp=uniformDisplayMrp(item,sel),active=!!uniformActiveOption(sel);
    if(final===null&&mrp===null)return '<span>Rate not set</span>';
    const hasAdminDefault=configuredCustomFinalRate(item)!==null;
    // Unselected + explicit admin final rate: rate with chosen unit.
    // Unselected + no admin rate: inferred lowest available variant rate, prefixed From.
    // Selected variant: actual selected price, never From.
    return uniformPriceMarkup(final,mrp,!active&&!hasAdminDefault?'':uniformRateUnit(item),!active&&hasAdminDefault,!active&&!hasAdminDefault);
  }
  function uniformSavedItemsHtml(sel){const saved=(sel.selectedItems||[]).filter(v=>v.orderedQty>0);if(!saved.length)return'';return '<div class="kids-uniform-saved" data-uniform-saved-list><span>Selected</span><div>'+saved.map(v=>{const sizes=Object.entries(v.sizeQuantities||{}).filter(([,q])=>Number(q)>0).map(([size,q])=>S.esc(size)+' × '+Number(q)).join(' · ');return '<button type="button" class="kids-uniform-saved-item" data-uniform-option="'+S.esc(v.id)+'"><b>'+S.esc(v.name)+'</b><small>'+sizes+'</small><strong>Edit</strong></button>';}).join('')+'</div></div>'; }
  function uniformSelectedTotalHtml(sel){if(!Number(sel?.totalPieces||0))return'';return '<div class="kids-uniform-order-total" data-uniform-order-total><span>Total selected</span><strong>'+S.money(Number(sel.totalAmount||0))+'</strong></div>';}
  function uniformOptionButtons(options,selectedOptions){if(!options.length)return'';const activeId=String(state.uniformGalleryVariantId||''),selectedIds=new Set((selectedOptions||[]).map(v=>String(v.id)));return '<div class="kids-uniform-option-part uniform-multi-options" data-uniform-change-section><span>Choose</span><div>'+options.map(v=>{const stock=uniformVariantStock(v),active=String(v.id)===activeId,saved=selectedIds.has(String(v.id))&&Object.values(uniformOptionQuantities(v)).some(q=>Number(q)>0);return '<button type="button" class="kids-uniform-option-button '+(active?'active ':'')+(saved&&!active?'saved ':'')+(stock<=0&&!v.sizes?.some(x=>x.unlimited)?'out':'')+'" data-uniform-option="'+S.esc(v.id)+'" '+(stock<=0&&!v.sizes?.some(x=>x.unlimited)?'disabled':'')+'><b>'+S.esc(v.name)+'</b>'+(stock<=0&&!v.sizes?.some(x=>x.unlimited)?'<small>Out of stock</small>':'')+'</button>';}).join('')+'</div></div>'; }
  function uniformSizeQuantityPicker(sel){const option=uniformActiveOption(sel);if(!option)return'';const rows=(option.sizes||[]).filter(x=>String(x.size||'').trim());return '<div class="kids-uniform-item-size-groups active-uniform-size-editor"><section class="kids-uniform-item-size-group"><div class="kids-uniform-size-qty-head"><span>'+S.esc(option.name)+' sizes</span></div>'+(rows.length?'<div class="kids-uniform-size-qty-grid">'+rows.map(row=>{const size=String(row.size||''),stock=Math.max(0,Math.floor(Number(row.stock||0))),key=uniformQtyKey(option.id,size),qty=Math.max(0,Math.min(row.unlimited?Number.MAX_SAFE_INTEGER:stock,Math.floor(Number(state.uniformSizeQty?.[key]||0)))),out=!row.unlimited&&stock<=0;return '<div class="kids-uniform-size-qty-row stock-aware '+(out?'out':'')+'"><span class="uniform-size-stock-inline"><span class="uniform-size-and-stock"><b>'+S.esc(size)+'</b>'+(row.unlimited?'':'<small>'+(out?'Out of stock':stock+' in stock')+'</small>')+(row.rate!==null&&row.rate!==undefined&&row.rate!==''?'<small class="catalogue-special-size-rate">'+S.money(row.rate)+'</small>':'')+'</span>'+sizeMeasurementsHtml(row)+'</span><div class="uniform-qty-stepper"><button type="button" data-uniform-qty-minus="'+S.esc(key)+'" aria-label="Decrease '+S.esc(option.name)+' '+S.esc(size)+'" '+(out?'disabled':'')+'>−</button><input type="number" min="0" '+(row.unlimited?'data-unlimited-stock="1"':'max="'+stock+'"')+' step="1" inputmode="numeric" data-uniform-size-qty="'+S.esc(key)+'" value="'+qty+'" aria-label="'+S.esc(option.name)+' '+S.esc(size)+' quantity" '+(out?'disabled':'')+'><button type="button" data-uniform-qty-plus="'+S.esc(key)+'" aria-label="Increase '+S.esc(option.name)+' '+S.esc(size)+'" '+(out?'disabled':'')+'>+</button></div></div>';}).join('')+'</div>':'')+'</section></div>'; }
  function scrollToUniformChoices(){requestAnimationFrame(()=>root.querySelector('[data-uniform-change-section]')?.scrollIntoView({behavior:'smooth',block:'start'}));}
  function uniformPicker(item){const sel=uniformSelection(item);if(!sel.options.length)return '<section class="kids-uniform-picker"><div class="empty-state clean-empty"><p>No variants are available right now.</p></div></section>';return '<section class="kids-uniform-picker uniform-button-picker">'+uniformOptionButtons(sel.options,sel.selectedOptions)+uniformDescriptionHtml(item)+uniformSizeQuantityPicker(sel)+uniformSavedItemsHtml(sel)+uniformSelectedTotalHtml(sel)+'</section>'; }
  function syncUniformQuantityUi(){const item=state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId));if(!item||!isUniformCustomItem(item))return;const sel=uniformSelection(item),pageRate=root.querySelector('[data-uniform-live-rate]');if(pageRate){pageRate.innerHTML=uniformPriceHtml(item,sel);}const saved=root.querySelector('[data-uniform-saved-list]'),savedHtml=uniformSavedItemsHtml(sel);if(saved){if(savedHtml){const temp=document.createElement('div');temp.innerHTML=savedHtml;saved.replaceWith(temp.firstElementChild);}else saved.remove();}else if(savedHtml){const total=root.querySelector('[data-uniform-order-total]'),picker=root.querySelector('.kids-uniform-picker');if(total)total.insertAdjacentHTML('beforebegin',savedHtml);else if(picker)picker.insertAdjacentHTML('beforeend',savedHtml);}const total=root.querySelector('[data-uniform-order-total]'),totalHtml=uniformSelectedTotalHtml(sel);if(total){if(totalHtml){const temp=document.createElement('div');temp.innerHTML=totalHtml;total.replaceWith(temp.firstElementChild);}else total.remove();}else if(totalHtml){const picker=root.querySelector('.kids-uniform-picker');if(picker)picker.insertAdjacentHTML('beforeend',totalHtml);}if(savedHtml)bindUniformOptionButtons(); }
  function bindUniformOptionButtons(){root.querySelectorAll('[data-uniform-option]:not([data-uniform-bound])').forEach(x=>{x.dataset.uniformBound='1';x.addEventListener('click',()=>{const id=String(x.dataset.uniformOption||'');if(!id)return;const fromSaved=!!x.closest('.kids-uniform-saved');let item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));const sel=item?uniformSelection(item):null;const savedIds=new Set((sel?.options||[]).filter(v=>Object.values(uniformOptionQuantities(v)).some(q=>Number(q)>0)).map(v=>String(v.id)));const sameActive=!fromSaved&&String(state.uniformGalleryVariantId||'')===id;if(sameActive){state.uniformOptionIds=[...savedIds];state.uniformGalleryVariantId='';}else{savedIds.add(id);state.uniformOptionIds=[...savedIds];state.uniformGalleryVariantId=id;}state.uniformTopId='';state.uniformBottomId='';state.enquirySuccessId='';render();if(fromSaved)requestAnimationFrame(()=>{const target=root.querySelector('[data-uniform-change-section]');if(target)target.scrollIntoView({behavior:'smooth',block:'start'});});});}); }
  function bindUniformQuantityControls(){
    root.querySelectorAll('[data-uniform-size-qty]:not([data-uniform-qty-bound])').forEach(x=>{x.dataset.uniformQtyBound='1';x.addEventListener('input',()=>{const key=x.dataset.uniformSizeQty||'',max=x.dataset.unlimitedStock==='1'?Number.MAX_SAFE_INTEGER:Math.max(0,Math.floor(Number(x.max||0))),qty=Math.max(0,Math.min(max,Math.floor(Number(x.value||0))));x.value=String(qty);state.uniformSizeQty={...(state.uniformSizeQty||{}),[key]:qty};const optionId=String(key).split('::')[0];if(qty>0&&!state.uniformOptionIds.map(String).includes(optionId))state.uniformOptionIds=[...state.uniformOptionIds,optionId];state.enquirySuccessId='';syncUniformQuantityUi();});});
    root.querySelectorAll('[data-uniform-qty-minus]:not([data-uniform-qty-bound]),[data-uniform-qty-plus]:not([data-uniform-qty-bound])').forEach(btn=>{btn.dataset.uniformQtyBound='1';btn.addEventListener('click',()=>{const key=btn.dataset.uniformQtyMinus||btn.dataset.uniformQtyPlus||'',input=root.querySelector('[data-uniform-size-qty="'+CSS.escape(key)+'"]');if(!input)return;const max=input.dataset.unlimitedStock==='1'?Number.MAX_SAFE_INTEGER:Math.max(0,Math.floor(Number(input.max||0))),delta=btn.dataset.uniformQtyPlus!==undefined?1:-1,qty=Math.max(0,Math.min(max,Math.floor(Number(input.value||0))+delta));input.value=String(qty);state.uniformSizeQty={...(state.uniformSizeQty||{}),[key]:qty};const optionId=String(key).split('::')[0];if(qty>0&&!state.uniformOptionIds.map(String).includes(optionId))state.uniformOptionIds=[...state.uniformOptionIds,optionId];state.enquirySuccessId='';syncUniformQuantityUi();});});
  }
  function customItem(){
    const item=state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId));if(!item||item.active===false)return customCatalog();const parent=customCategoryForItem(item);if(parent&&!customCategoryPubliclyAccessible(parent))return customCatalog();
    ensureCatalogueGarmentDefaults(item);
    const c=customCategoryForItem(item),busy=state.enquiryBusyId===String(item.id),sent=state.enquirySuccessId===String(item.id),logged=!!B?.customerSession?.()?.token,tshirt=isTshirtCustomItem(item),sportswear=isSportswearCustomItem(item),uniform=isUniformCustomItem(item),tshirtOptions=tshirt?customAvailableFabrics(item):[],sportsTypes=sportswear?sportswearTypes(item):[],sportsFabrics=sportswear?sportswearFabrics(item):[],selectedType=sportswear?sportsTypes.find(t=>String(t.id)===String(state.customSportswearTypeId)):null,selected=tshirt?tshirtOptions.find(x=>String(x.fabric.id)===String(state.customFabricId)):sportswear?sportsFabrics.find(x=>String(x.fabric.id)===String(state.customFabricId)):null,validQuality=!!selected&&selected.qualities.includes(state.customQuality),uniformSel=uniform?uniformSelection(item):null,images=uniform?uniformGalleryImages(item,uniformSel):(item.images||[]).filter(Boolean);
    const printable=isPrintableCustomItem(item),selectedRate=(!printable&&(tshirt||sportswear)&&(state.fabricPricingLoading||state.fabricPricingError))?null:printable?(printableSelection(item).base??customItemFromRate(item)):tshirt?(validQuality?customFabricRate(selected.fabric,state.customQuality):customItemFromRate(item)):sportswear?(selectedType&&validQuality?sportswearRate(selected.fabric,state.customQuality,selectedType):customItemFromRate(item)):uniform?uniformDisplayedSetRate(item,uniformSel):customItemFromRate(item);
    const ready=printable?!state.fabricPricingLoading&&!state.fabricPricingError&&printableSelection(item).ready:tshirt?!state.fabricPricingLoading&&!state.fabricPricingError&&validQuality&&(!isCorporateTeeItem(item)||corporatePrintSelection(item,customFabricRate(selected.fabric,state.customQuality)).ready):sportswear?!state.fabricPricingLoading&&!state.fabricPricingError&&!!selectedType&&validQuality&&(isCorporateTeeItem(item)?corporatePrintSelection(item,selectedType&&validQuality?sportswearRate(selected.fabric,state.customQuality,selectedType):null).ready:selectedSportswearQty(item,selectedType&&validQuality?sportswearRate(selected.fabric,state.customQuality,selectedType):null).totalQty>0):uniform?!!uniformSel?.ready:true,picker=printable?printablePicker(item):tshirt?tshirtFabricPicker(item):sportswear?sportswearPicker(item):uniform?uniformPicker(item):'',ratePrefix=uniform?'Set ':'';
    const actionArea=(printable||(isCorporateTeeItem(item)&&tshirt))?'<div class="uniform-order-actions printable-order-actions"><button class="secondary wide" type="button" data-action="printable-add-cart" data-item-id="'+S.esc(item.id)+'" '+' '+'>Add to cart '+I('cart')+'</button><button class="primary wide" type="button" data-action="printable-buy-now" data-item-id="'+S.esc(item.id)+'" '+' '+'>Buy now '+I('arrow')+'</button></div>':sportswear?'<div class="uniform-order-actions printable-order-actions"><button class="secondary wide" type="button" data-action="jersey-add-cart" data-item-id="'+S.esc(item.id)+'">Add to cart '+I('cart')+'</button><button class="primary wide" type="button" data-action="jersey-buy-now" data-item-id="'+S.esc(item.id)+'">Buy now '+I('arrow')+'</button></div>':uniform?'<div class="uniform-actions-anchor" data-uniform-actions-anchor><div class="uniform-order-actions" data-uniform-order-actions><button class="secondary wide uniform-add-cart-button" data-action="uniform-add-cart" data-item-id="'+S.esc(item.id)+'">Add to cart '+I('cart')+'</button><button class="primary wide" data-action="uniform-buy-now" data-item-id="'+S.esc(item.id)+'">Buy now '+I('arrow')+'</button></div></div>':'<button class="primary wide custom-catalog-enquiry-button '+(sent?'sent':'')+'" data-action="custom-catalog-enquiry" data-item-id="'+S.esc(item.id)+'" '+(busy||sent||(isCorporateTeeItem(item)&&!ready)?'disabled':'')+'>'+(sent?'Enquiry sent '+I('check'):busy?'Sending…':'Enquire '+I('arrow'))+'</button>';
    const customerDetails=[item.customer_detail_1,item.customer_detail_2].map(v=>String(v||'').trim()).filter(Boolean),customerDetailsHtml=customerDetails.length?'<div class="catalogue-public-details catalogue-public-details-bottom" aria-label="Item details">'+customerDetails.map((v,i)=>(i?'<span class="catalogue-detail-separator" aria-hidden="true">|</span>':'')+'<span>'+S.esc(v)+'</span>').join('')+'</div>':'';
    const uniformDisplayId=String(item.display_id||(uniform?uniformConfig(item).display_id:'')||item.id).trim(),shareButton='<button type="button" class="inline-share-button item-title-share custom-item-title-share" data-share-kind="custom-item" data-share-value="'+S.esc(item.id)+'" data-share-label="'+S.esc(item.title||'Customization idea')+'" aria-label="Share item">'+I('share')+'<span>Share</span></button>';
    return '<main class="product-fullscreen custom-item-page '+(uniform?'uniform-custom-item-page ':'')+(isCorporateTeeItem(item)?'corporate-tee-detail-page ':'')+(c?.catalogue_section==='ready'?'ready-made-detail-page ':'')+'screen screen-enter"><div class="product-full-inner custom-item-inner"><section class="product-full-media">'+detailSlider(images,item.title||'Customization idea')+'</section><section class="product-full-info custom-item-info"><div class="custom-item-meta-row"><span class="eyebrow">'+(c?.catalogue_section==='ready'?'READY MADE':'CUSTOM CATALOGUE')+(c?' / '+S.esc(c.name):'')+'</span>'+(uniformDisplayId?'<div class="custom-uniform-item-id"><span>ID</span><b>'+S.esc(uniformDisplayId)+'</b></div>':'')+'</div>'+'<div class="item-detail-title-row custom-item-title-row"><h1>'+S.esc(item.title||'Customization idea')+'</h1>'+shareButton+'</div>'+(uniform?'<div class="custom-item-rate uniform-live-price" data-uniform-live-rate>'+uniformPriceHtml(item,uniformSel)+'</div>':(printable?'':(selectedRate!==null?'<div class="custom-item-rate">'+ratePrefix+S.money(selectedRate)+'</div>':'')))+(uniform?'':(String(item.description||'').trim()?'<p class="custom-item-description">'+S.esc(item.description)+'</p>':''))+picker+actionArea+customerDetailsHtml+'</section></div></main>';
  }
  function resetUniformDetailAfterCart(item){
    state.uniformOptionIds=[];state.uniformSizeQty={};state.uniformGalleryVariantId='';state.uniformTopId='';state.uniformBottomId='';
    if(state.screen!=='customItem'||String(state.customItemId)!==String(item.id))return;
    // Refresh only the selection UI, not the whole app, so the cart success
    // confirmation stays visible and no page-level scroll is triggered.
    const picker=root.querySelector('.kids-uniform-picker');
    if(picker){picker.outerHTML=uniformPicker(item);bindUniformOptionButtons();bindUniformQuantityControls();}
    const rate=root.querySelector('[data-uniform-live-rate]');
    if(rate)rate.innerHTML=uniformPriceHtml(item);
    const slider=root.querySelector('.product-full-media [data-detail-slider]');
    if(slider){
      slider.outerHTML=detailSlider(uniformGalleryImages(item),item.title||'Customization idea');
      const next=root.querySelector('.product-full-media [data-detail-slider]');
      next?.querySelectorAll('[data-zoom-image]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openZoom(x.dataset.zoomImage,x.dataset.zoomAlt||'');}));
      bindDetailSliders();
    }
  }
  async function addUniformOrderToCart(itemId,buyNow=false){
    if(uniformAddBusy||cartAddBusy)return;
    uniformAddBusy=true;
    let cartAdded=false;
    // Start the three-dot feedback before the stock verification request.
    if(!buyNow)cartFeedback('loading');
    try{
    let item=state.customCatalogItems.find(x=>String(x.id)===String(itemId||state.customItemId));if(!item)return;
    try{const client=B?.supa?.();if(client){const latest=await client.from('custom_catalog_items').select('*').eq('id',item.id).maybeSingle();if(!latest.error&&latest.data){item=latest.data;const at=state.customCatalogItems.findIndex(x=>String(x.id)===String(item.id));if(at>=0)state.customCatalogItems[at]=latest.data;}}}catch(_){}
    const sel=uniformSelection(item);if(!sel.selectedOptions.length){render();showToast('Select at least one variant.');return;}if(!sel.totalPieces){showToast('Choose a size quantity within available stock.');return;}
    const selectedItems=sel.selectedItems.filter(v=>v.orderedQty>0).map(v=>({id:v.id,name:v.name,detailTitle:v.detail_title||'',detailDescription:v.detail_description||'',mrp:v.mrp??v.itemMrp??null,rate:v.rate??null,availableStock:uniformVariantStock(v),images:(v.images||[]).some(Boolean)?(v.images||[]).filter(Boolean):(item.images||[]).filter(Boolean),sizeQuantities:{...v.sizeQuantities},sizeRates:{...(v.sizeRates||{})},sizeStocks:(v.sizes||[]).map(x=>({size:String(x.size||''),stock:Math.max(0,Math.floor(Number(x.stock||0))),unlimited:x.unlimited===true,rate:uniformEffectiveRate(v,x)})).filter(x=>x.size),orderedQty:v.orderedQty,lineTotal:Number(v.lineTotal||0)}));
    if(!selectedItems.length){showToast('Choose a size quantity within available stock.');return;}
    const aggregate={};for(const v of selectedItems)for(const [size,qty] of Object.entries(v.sizeQuantities||{}))aggregate[size]=(aggregate[size]||0)+Number(qty||0);
    const cardImage=(item.images||[])[0]||'',images=uniformGalleryImages(item,{...sel,selectedOptions:selectedItems}),category=customCategoryForItem(item);
    const design={catalogueSection:category?.catalogue_section||'custom',categoryMode:customCategoryMode(item),kind:customCategoryMode(item)==='uniform'?'kids_uniform_order':'custom_catalogue_order',itemId:item.id,itemTitle:item.title||'Uniform',categoryId:category?.id||item.category_id||'',categoryName:category?.name||'Uniform',cardImage,images,selectedItems,itemQuantities:Object.fromEntries(selectedItems.map(v=>[v.id,v.sizeQuantities])),sizeQuantities:aggregate,totalUnits:sel.totalPieces,totalPieces:sel.totalPieces,descriptionBlocks:uniformConfig(item).description_blocks||[],totalAmount:Number(sel.totalAmount||0),selectedAt:new Date().toISOString()};
    const itemText=selectedItems.map(v=>v.name+': '+Object.entries(v.sizeQuantities).map(([size,qty])=>size+' × '+qty).join(', ')).join(' · ');
    const averageRate=sel.totalPieces>0?Number(sel.totalAmount||0)/sel.totalPieces:0,displayId=String(item.display_id||uniformConfig(item).display_id||'').trim();const cartItem={itemType:'uniform_order',custom:true,name:item.title||'Uniform',code:displayId||item.id,qty:sel.totalPieces,price:averageRate,total:Number(sel.totalAmount||0),image:cardImage,detail:itemText,design:{...design,displayId},uniformOrder:{...design,displayId}};
    // Buy Now is a standalone order; never append it to the account's saved cart.
    if(buyNow){
      state.uniformOptionIds=[];state.uniformSizeQty={};state.uniformGalleryVariantId='';state.uniformTopId='';state.uniformBottomId='';
      startDirectCheckout(cartItem);
    }else{
      cartAdded=await addCart(cartItem,false);
      // Only clear choices that were successfully saved, without navigating or
      // redrawing the entire page (which previously moved the scroll position).
      if(cartAdded)resetUniformDetailAfterCart(item);
    }
    }finally{if(!buyNow&&!cartAdded)cartFeedback('hide');uniformAddBusy=false;}
  }

  async function submitCustomCatalogEnquiry(itemId){
    const latest=state.customCatalogItems.find(x=>String(x.id)===String(itemId||state.customItemId));
    if(latest&&(isTshirtCustomItem(latest)||isSportswearCustomItem(latest))){const verified=await refreshCustomerFabricPricing(latest.id,{silent:true,force:true});if(!verified){showToast('Could not verify current fabric prices. Please retry.');return;}if(isSportswearCustomItem(latest)||isCorporateTeeItem(latest)){try{const q=await B?.supa?.()?.from('custom_catalog_items').select('fabric_options,description,updated_at').eq('id',latest.id).maybeSingle();if(q?.error)throw q.error;if(q?.data){latest.fabric_options=q.data.fabric_options;latest.description=q.data.description;}}catch(err){showToast('Could not verify current jersey sizes. Try again.');return;}}}
    const item=state.customCatalogItems.find(x=>String(x.id)===String(itemId||state.customItemId));if(!item)return;const c=customCategoryForItem(item),tshirt=isTshirtCustomItem(item),sportswear=isSportswearCustomItem(item),uniform=isUniformCustomItem(item);let jerseySelection=null,fabric=null,quality='',rate=(item.rate===null||item.rate===undefined||item.rate==='')?null:Number(item.rate),baseFabricRate=null,garmentType=null,uniformPayload=null;
    if(tshirt){const option=customAvailableFabrics(item).find(x=>String(x.fabric.id)===String(state.customFabricId));if(!option||!option.qualities.includes(state.customQuality)){showToast('Select a fabric and quality first');return;}fabric=option.fabric;quality=state.customQuality;rate=customFabricRate(fabric,quality);baseFabricRate=rate;if(isCorporateTeeItem(item)){jerseySelection=selectedSportswearQty(item,rate);if(!jerseySelection.totalQty){showToast('Add a quantity for at least one size.');return;}}}
    else if(sportswear){garmentType=sportswearTypes(item).find(t=>String(t.id)===String(state.customSportswearTypeId))||null;const option=sportswearFabrics(item).find(x=>String(x.fabric.id)===String(state.customFabricId));if(!garmentType){showToast('Select a sportswear type first');return;}if(!option||!option.qualities.includes(state.customQuality)){showToast('Select a fabric and quality first');return;}fabric=option.fabric;quality=state.customQuality;baseFabricRate=customFabricRate(fabric,quality);rate=sportswearRate(fabric,quality,garmentType);jerseySelection=selectedSportswearQty(item,rate);if(!jerseySelection.totalQty){showToast('Add a quantity for at least one size.');return;}}
    else if(uniform){showToast('Use Add to cart or Buy now for Uniform.');return;}
    const corporatePrints=isCorporateTeeItem(item)?selectedPrintExtras():null;
    if(corporatePrints&&!corporatePrints.ready){showToast('Choose print-size quantities for every selected print type, or turn off printing.');return;}
    const printsPerGarment=corporatePrints?.printsPerGarment||0,printsTotal=printsPerGarment*(jerseySelection?.totalQty||0),corporateTotal=jerseySelection?jerseySelection.totalAmount+printsTotal:null;
    state.enquiryBusyId=String(item.id);state.enquirySuccessId='';render();try{await B.customerEnquiry({itemId:item.id,itemTitle:item.title||'',itemDescription:item.description||'',itemRate:rate,includePrinting:corporatePrints?.includePrinting??false,selectedPrintTypeIds:corporatePrints?.printTypes.map(v=>String(v.id))||[],selectedPrints:corporatePrints?.prints||[],garmentTotal:jerseySelection?.totalAmount??null,printsPerGarment,printsTotal,totalAmount:corporateTotal,jerseySizes:jerseySelection?{sizeQuantities:Object.fromEntries(jerseySelection.lines.map(v=>[v.size,v.qty])),sizeRates:Object.fromEntries(jerseySelection.lines.map(v=>[v.size,v.rate])),sizes:jerseySelection.lines,totalQty:jerseySelection.totalQty,totalAmount:jerseySelection.totalAmount}:null,categoryId:c?.id||item.category_id||'',categoryName:c?.name||'',garmentTypeId:garmentType?.id||'',garmentTypeName:garmentType?.name||'',garmentTypeAdjustment:garmentType?sportswearTypeAdjustment(garmentType):0,fabricId:fabric?.id||'',fabricName:fabric?.name||'',fabricQuality:quality,baseFabricRate:baseFabricRate,fabricRate:rate,image:(item.images||[])[0]||'',images:(uniform?[...(item.images||[]),...(uniformPayload?.top?.images||[]),...(uniformPayload?.bottom?.images||[])]:(item.images||[])).filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,20),shareUrl:shareUrl('custom-item',item.id),uniformSelection:uniformPayload,uniformDescriptionBlocks:uniform?uniformConfig(state.customCatalogItems.find(x=>String(x.id)===String(item.id))||item).description_blocks:[],uniformFeatures:uniform?uniformFeatures(state.customCatalogItems.find(x=>String(x.id)===String(item.id))||item).map(f=>f.label+': '+f.value):[],source:'customization_catalogue'});await refreshCustomerAccount(false);broadcastAccountSync('enquiry');state.enquiryBusyId='';state.enquirySuccessId=String(item.id);showToast('Enquiry sent successfully');}catch(err){state.enquiryBusyId='';state.enquirySuccessId='';showToast(err.message||'Could not send enquiry');}
  }
  function fastUniformSection(){
    const colours=[['#20f12e','Green'],['#1473e6','Blue'],['#ef233c','Red'],['#7b2cbf','Purple'],['#ff8c1a','Orange'],['#f4d03f','Yellow'],['#121212','Black'],['#f5f5f5','White']];
    return '<section class="fast-uniform-section section-wrap" data-fast-uniform><div class="section-heading"><div><span class="eyebrow">FAST UNIFORM CUSTOMIZE</span><h2>Choose the shirt colour.</h2><p>Preview shirt colours instantly while the fabric texture, folds, lighting and the rest of the uniform stay natural.</p></div><div class="fast-uniform-heading-actions"><button type="button" class="fast-uniform-share" data-share-kind="section" data-share-value="shirt-colour" data-share-label="One-Line shirt colour customizer" aria-label="Share shirt colour customizer">'+I('share')+'</button><button type="button" class="fast-uniform-enquire" data-action="uniform-enquiry"><span>Enquire Now</span>'+I('arrow')+'</button></div></div><div class="fast-uniform-card"><div class="fast-uniform-preview"><canvas data-fast-uniform-canvas aria-label="Live uniform colour preview"></canvas></div><div class="fast-uniform-controls"><div class="fast-uniform-control-head"><div><span class="eyebrow">LIVE PREVIEW</span><h3>Shirt colour</h3></div><button type="button" class="fast-uniform-reset" data-fast-uniform-reset>Reset</button></div><div class="fast-uniform-swatches">'+colours.map((x,i)=>'<button type="button" class="fast-uniform-swatch '+(i===0?'active':'')+'" data-fast-uniform-colour="'+x[0]+'" style="background:'+x[0]+'" aria-label="'+x[1]+'"></button>').join('')+'<button type="button" class="fast-uniform-custom-swatch" data-fast-uniform-open aria-label="Choose any colour"></button></div><button type="button" class="fast-uniform-any" data-fast-uniform-open><span><i data-fast-uniform-dot></i>Choose any colour</span><b>›</b></button><p class="fast-uniform-hint">Only the shirt pixels are recoloured; the original cloth texture and lighting remain visible.</p></div></div><div class="fast-colour-overlay" data-fast-picker aria-hidden="true"><div class="fast-colour-sheet" role="dialog" aria-modal="true" aria-label="Choose any colour"><div class="fast-colour-head"><strong>Choose any colour</strong><button type="button" data-fast-picker-close aria-label="Close">×</button></div><div class="fast-sv-wrap"><canvas width="640" height="360" data-fast-sv></canvas><i data-fast-sv-cursor></i></div><input class="fast-hue" data-fast-hue type="range" min="0" max="360" value="120" aria-label="Hue"><div class="fast-picker-bottom"><i data-fast-colour-preview></i><label><span>#</span><input data-fast-hex value="20F12E" maxlength="6" inputmode="text" aria-label="Hex colour"></label><button type="button" data-fast-picker-apply>Apply</button></div></div></div></section>';
  }
  function home(){
    const popular=retailProducts().filter(p=>p.active!==false&&p.customerVisible!==false).slice(0,6);
    const browseCta=popular.length?'<button class="secondary" data-go="categories">Browse categories</button>':'<button class="secondary" data-go="customCatalog">Browse catalogue</button>';
    return '<main class="screen screen-enter"><section class="hero"><div class="hero-copy"><span class="eyebrow">MADE FOR YOUR NAME, TEAM OR BUSINESS</span><h1>Wear your<br><em>own idea.</em></h1><p>Customize garments, build a front/back creative team enquiry.</p><div class="hero-actions"><button class="primary" data-go="customize">Start customizing '+I('arrow')+'</button>'+browseCta+'</div><div class="hero-proof"><span>'+I('shield')+' Exact print position saved</span><span>'+I('package')+' Bulk size quantities supported</span></div></div><div class="hero-visual legacy-home-customizer" data-click-go="customize" tabindex="0" role="button" aria-label="Open custom apparel designer"><div class="hero-grid-label">ONE-LINE CUSTOM STUDIO</div><div class="hero-product-orbit"><div class="orbit-ring"></div><img src="assets/crew-tee.webp" alt="Premium blank T-shirt"><div class="hero-brand-badge"><img src="one-line-logo.webp" alt=""><span>BUILD YOUR OWN</span></div></div><div class="floating-tool tool-a">'+I('type')+'<span>Add text</span></div><div class="floating-tool tool-b">'+I('image')+'<span>Upload image</span></div><div class="floating-tool tool-c">'+I('sparkle')+'<span>Choose print</span></div><button class="visual-cta" data-go="customize"><span>OPEN DESIGNER</span>'+I('arrow')+'</button></div></section>'+readyMadeHomeSection()+customCatalogHomeSection()+processSection()+fastUniformSection()+homeCommonSection()+teamUploadSection()+(popular.length?'<section class="products-section section-wrap"><div class="section-heading"><div><span class="eyebrow">READY TO ORDER</span><h2>Available essentials.</h2></div><button data-go="catalog">See full catalogue '+I('arrow')+'</button></div><div class="product-grid home-product-grid">'+popular.map(p=>productCard(p,'retail')).join('')+'</div></section>':'')+'</main>';
  }
  function availableCategories(){
    const visible=retailProducts().filter(p=>p.active!==false&&p.customerVisible!==false),names=new Set(visible.map(p=>p.category).filter(Boolean));
    return state.categories.filter(c=>c.active!==false&&names.has(c.name)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  }
  function categoriesSection(){
    const cats=availableCategories();
    if(!cats.length)return'';
    return '<section class="category-section section-wrap borderless-categories"><div class="section-heading home-flow-heading"><div class="section-heading-copy"><span class="eyebrow">SHOP BY CATEGORY</span><h2>Ready-made catalogue.</h2><p>Browse the available ready-made collections and open a category to see its current items.</p></div><div class="section-heading-actions"><button class="catalog-view-button" data-go="categories">View all categories '+I('arrow')+'</button></div></div><div class="category-grid real-category-grid equal-category-grid">'+cats.map((c,i)=>'<article class="category-block real-category-card" data-category="'+S.esc(c.name)+'" tabindex="0"><button type="button" class="card-share-button" data-share-kind="category" data-share-value="'+S.esc(c.name)+'" data-share-label="'+S.esc(c.name)+'" aria-label="Share category">'+I('share')+'</button><span class="category-code">'+String(i+1).padStart(2,'0')+'</span><div class="category-photo">'+img(c.image,c.name,'','assets/category-placeholder.svg')+'</div><div><h3>'+S.esc(c.name)+'</h3><p>'+S.esc(c.sub||'Available products')+'</p></div><span class="category-arrow">'+I('arrow')+'</span></article>').join('')+'</div></section>';
  }
  function categoriesPage(){
    const cats=availableCategories();
    return '<main class="categories-page categories-only-page section-wrap screen screen-enter">'+(cats.length?'<div class="category-grid real-category-grid equal-category-grid full-category-grid categories-only-grid">'+cats.map((c,i)=>'<article class="category-block real-category-card category-name-only" data-category="'+S.esc(c.name)+'" tabindex="0"><button type="button" class="card-share-button" data-share-kind="category" data-share-value="'+S.esc(c.name)+'" data-share-label="'+S.esc(c.name)+'" aria-label="Share category">'+I('share')+'</button><span class="category-code">'+String(i+1).padStart(2,'0')+'</span><div class="category-photo">'+img(c.image,c.name,'','assets/category-placeholder.svg')+'</div><div><h3>'+S.esc(c.name)+'</h3></div><span class="category-arrow">'+I('arrow')+'</span></article>').join('')+'</div>':'<div class="empty-state clean-empty"><h2>No categories available</h2></div>')+'</main>';
  }
  function homeCommonSection(){
    return '<section class="home-common-bridge section-wrap"><div class="home-common-card"><div class="home-common-copy"><span class="eyebrow">YOUR ORDER, YOUR WAY</span><h2>Start with an idea or bring your own.</h2><p>Use the designer for a fresh layout, browse the Custom Catalogue for inspiration, or continue below with one finished design for the whole team.</p></div><div class="home-common-actions"><button type="button" class="home-common-primary" data-go="customize">Open designer '+I('arrow')+'</button><button type="button" class="home-common-secondary" data-go="customCatalog">Browse ideas</button></div></div></section>';
  }
  function teamUploadSection(){
    return '<section class="team-upload-home section-wrap"><div class="team-simple-home"><div><span class="eyebrow">TEAM DESIGN</span><h2>Upload your creative design</h2><p>Upload front and back artwork, add your logos, then enter the player list.</p></div><button type="button" class="team-open-button" data-go="teamUpload"><span>Let\'s go</span>'+I('arrow')+'</button></div></section>';
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
  function product(){
    const p=state.selected;if(!p)return catalog();const gallery=productGallery(p),label=String(p.name||p.category||'Product').trim()||'Product';
    const colors=[...new Set(productVariants(p).map(v=>v.color).filter(Boolean))];const lines=selectedBulkLines(p),q=bulkTotalQty(lines),total=bulkTotalPrice(lines);
    return '<main class="product-fullscreen screen screen-enter bulk-product-page"><div class="product-full-inner"><section class="product-full-media">'+detailSlider(gallery,label)+'</section><section class="product-full-info"><span class="eyebrow">'+[p.category,p.subcategory].filter(Boolean).map(S.esc).join(' / ')+'</span><div class="item-detail-title-row"><h1>'+S.esc(label)+'</h1><button type="button" class="inline-share-button item-title-share" data-share-kind="product" data-share-value="'+S.esc(p.id)+'" data-share-label="'+S.esc(label)+'" aria-label="Share product">'+I('share')+'<span>Share</span></button></div><div class="product-code-line"><span>ITEM CODE</span><b>'+S.esc(p.code||p.barcode||'------')+'</b></div>'+(Number(p.price||0)?'<div class="detail-price"><strong>From '+S.money(p.price)+'</strong>'+(p.mrp?'<s>'+S.money(p.mrp)+'</s>':'')+'</div>':'')+(p.description?'<p>'+S.esc(p.description)+'</p>':'')+(colors.length?'<div class="selection-block"><label>Colour <b>'+S.esc(state.color||colors[0])+'</b></label><div class="colour-options">'+colors.map(c=>'<button class="'+((state.color||colors[0])===c?'active':'')+'" data-product-color="'+S.esc(c)+'"><span style="background:'+(S.palette[c]||c||'#ddd')+'"></span>'+S.esc(c)+'</button>').join('')+'</div></div>':'')+bulkMatrix(p)+'<div class="bulk-live-summary"><span><b>'+q+'</b> piece'+(q===1?'':'s')+' selected</span><strong>'+S.money(total)+'</strong></div><div class="product-action-row"><button class="primary detail-add" data-action="add-product">Add bulk order to cart '+I('cart')+'</button><button class="custom-enquiry-btn" data-action="whatsapp" data-message="Hi, I want to know about '+S.esc(label)+' (item code '+S.esc(p.code||'')+').">'+whatsappLogo()+'<span>Contact to customize</span></button></div><div class="ready-made-note"><b>OTP only when you add to cart</b><span>You can browse freely. Phone verification starts only when you try to cart an item or design.</span></div></section></div></main>';
  }
  function customCartPreview(item){const faces=S.designedSurfaces(item.customDesign||{});const face=faces[0]||'front';return '<div class="cart-custom-preview">'+S.designPreview(item.customDesign,face,'cart-design-preview')+'<span>'+face.replace('Sleeve',' sleeve')+'</span></div>';}
  // Each size is adjustable separately so a + on one variant never changes another.
  function cartLineControl(item,label,quantity,optionId,size){
    const attr=' data-key="'+S.esc(item.key)+'" data-option="'+S.esc(optionId||'')+'" data-size="'+S.esc(size||'')+'"';
    return '<div class="cart-adjust-line"><span class="cart-line-label">'+S.esc(label)+'</span><div class="cart-line-stepper"><button type="button" data-cart-adjust="-1"'+attr+' aria-label="Remove one '+S.esc(label)+'" '+(quantity<=1&&Number(item.qty||0)<=1?'disabled':'')+'>'+I('minus')+'</button><b>'+quantity+'</b><button type="button" data-cart-adjust="1"'+attr+' aria-label="Add one '+S.esc(label)+'">'+I('plus')+'</button></div></div>';
  }
  function cartBreakdown(item){
    let rows=[];
    if(Array.isArray(item.bulkLines)&&item.bulkLines.length){
      rows=item.bulkLines.filter(x=>Number(x.qty)>0).map(l=>cartLineControl(item,[l.color,l.size].filter(Boolean).join(' · ')||'Item',Number(l.qty||0),String(l.variantId||''),String(l.size||'')));
    }else if(item.itemType==='uniform_order'){
      const d=item.design||item.uniformOrder||{};
      for(const x of d.selectedItems||[])for(const [size,q] of Object.entries(x.sizeQuantities||{}))if(Number(q)>0)rows.push(cartLineControl(item,(x.name||'Item')+' · '+size,Number(q),String(x.id||''),size));
    }else if(item.itemType==='custom_design'&&item.sizeQuantities){
      rows=Object.entries(item.sizeQuantities).filter(([,q])=>Number(q)>0).map(([size,q])=>cartLineControl(item,size,Number(q),'',size));
    }
    return rows.length?'<div class="cart-adjust-lines">'+rows.join('')+'</div>':'';
  }
  // Older saved carts used one-time print charges; require a fresh selection before checkout.
  function needsReaddForPrinting(item){const d=item?.design||{};return ['printable_order','jersey_order'].includes(item?.itemType)&&d.includePrinting===true&&d.printsPerGarment===undefined;}
  function cartItem(item){
    const uniform=item.itemType==='uniform_order',printable=item.itemType==='printable_order',thumb=item.customDesign?customCartPreview(item):'<div class="cart-ready-preview">'+img(item.image,item.name,'','assets/product-placeholder.svg')+'</div>',hasLines=!!((item.bulkLines||[]).length||item.itemType==='custom_design'&&Object.values(item.sizeQuantities||{}).some(q=>Number(q)>0)||uniform||printable||item.itemType==='jersey_order'),label=printable?'PRINTABLE ITEM':uniform?((item.design||item.uniformOrder)?.catalogueSection==='ready'?'READY MADE':(((item.design||item.uniformOrder)?.categoryMode==='uniform'||(!(item.design||item.uniformOrder)?.categoryMode&&/uniform/i.test((item.design||item.uniformOrder)?.categoryName||'')))?'UNIFORM':'CUSTOM CATALOGUE')):item.custom?'YOUR CUSTOM DESIGN':'BULK READY-MADE';
    const singleQty=hasLines?'<div class="qty-static"><b>'+Number(item.qty||0)+'</b><small>pcs</small></div>':'<div class="qty-control"><button type="button" data-cart-adjust="-1" data-key="'+S.esc(item.key)+'" aria-label="Decrease quantity" '+(Number(item.qty)<=1?'disabled':'')+'>'+I('minus')+'</button><span>'+Number(item.qty||0)+'</span><button type="button" data-cart-adjust="1" data-key="'+S.esc(item.key)+'" aria-label="Increase quantity">'+I('plus')+'</button></div>';
    return '<article class="cart-item improved-cart-item" data-cart-item-key="'+S.esc(item.key)+'">'+thumb+'<div class="cart-item-info"><span>'+label+'</span><h3>'+S.esc(item.name)+'</h3><p>'+[item.code?('Code '+item.code):'',item.detail].filter(Boolean).map(S.esc).join(' · ')+'</p>'+cartBreakdown(item)+(needsReaddForPrinting(item)?'<p class="cart-print-price-notice">Printing rate updated. Please remove this item and add it again to apply prints to every garment.</p>':'')+(item.customDesign?'<div class="cart-design-meta"><b>'+S.esc(item.customDesign.printType)+'</b><span>'+S.designedSurfaces(item.customDesign).length+' print area'+(S.designedSurfaces(item.customDesign).length===1?'':'s')+'</span></div>':'')+'<strong>'+(Number(item.total??item.price)>0?S.money(item.total??Number(item.price||0)*Number(item.qty||0)):'Price after review')+'</strong></div>'+singleQty+'<button class="remove-item" data-remove-key="'+S.esc(item.key)+'" aria-label="Remove item">'+I('trash')+'</button></article>';
  }
  const cartQuantityTimers=new Map();
  function flushCartQuantitySync(key){
    const timer=cartQuantityTimers.get(key);if(timer===undefined)return;
    clearTimeout(timer);cartQuantityTimers.delete(key);
    const item=state.cart.find(v=>String(v.key)===String(key));
    if(item)queueCartMutation('upsert',key,item,true);
  }
  function flushAllCartQuantitySync(){for(const key of [...cartQuantityTimers.keys()])flushCartQuantitySync(key);return cartMutationQueue;}
  function scheduleCartQuantitySync(key){
    if(cartQuantityTimers.has(key))clearTimeout(cartQuantityTimers.get(key));
    cartQuantityTimers.set(key,setTimeout(()=>flushCartQuantitySync(key),180));
  }
  function syncCartQuantityUi(item){
    const article=root.querySelector('[data-cart-item-key="'+CSS.escape(String(item.key))+'"]');
    if(article){
      // Refresh only quantity/price elements, not the product image or whole page.
      const draft=document.createElement('div');draft.innerHTML=cartItem(item);
      const fresh=draft.firstElementChild;
      for(const selector of ['.cart-item-info > p','.cart-item-info > strong','.qty-control','.qty-static']){
        const old=article.querySelector(selector),next=fresh.querySelector(selector);
        if(old&&next)old.innerHTML=next.innerHTML;
      }
      const oldLines=article.querySelector('.cart-adjust-lines'),newLines=fresh.querySelector('.cart-adjust-lines');
      if(oldLines&&newLines)oldLines.innerHTML=newLines.innerHTML;
      else if(oldLines&&!newLines)oldLines.remove();
      else if(!oldLines&&newLines)article.querySelector('.cart-item-info > strong')?.before(newLines);
    }
    const summary=root.querySelector('.cart-page .order-summary');
    if(summary){const pieces=summary.querySelector('.summary-line b'),price=summary.querySelector('.summary-total strong');if(pieces)pieces.textContent=totalQty();if(price)price.textContent=S.money(subtotal());}
  }
  function adjustCartQuantity(key,delta,optionId='',size=''){
    const current=state.cart.find(x=>String(x.key)===String(key));if(!current)return;
    try{
      const item=clone(current),d=item.design||item.uniformOrder||{},number=Math.floor(Number(delta));
      if(![-1,1].includes(number))return;
      if(item.itemType==='uniform_order'){
        const variant=(d.selectedItems||[]).find(x=>String(x.id)===String(optionId));
        if(!variant||!size)throw new Error('Choose a valid variant and size.');
        const before=Math.floor(Number(variant.sizeQuantities?.[size]||0)),next=before+number;
        if(next<0||(next===0&&Number(item.qty)<=1))return;
        if(number>0){
          const currentItem=state.customCatalogItems.find(x=>String(x.id)===String(d.itemId));
          const option=currentItem?uniformAllVariants(uniformConfig(currentItem)).find(x=>String(x.id)===String(optionId)):null;
          const row=option?.sizes?.find(x=>String(x.size)===String(size));
          if(currentItem?.active===false)throw new Error('This item is currently unavailable.');
          if(currentItem&&(!option?.enabled||!row))throw new Error('Selected option or size is no longer available.');
          const stock=row?.stock??variant.sizeStocks?.find(x=>String(x.size)===String(size))?.stock;
          const alreadyInCart=state.cart.filter(x=>x.itemType==='uniform_order'&&String((x.design||x.uniformOrder)?.itemId)===String(d.itemId)).reduce((sum,x)=>sum+((x.design||x.uniformOrder)?.selectedItems||[]).filter(v=>String(v.id)===String(optionId)).reduce((n,v)=>n+Number(v.sizeQuantities?.[size]||0),0),0);
          if(!(row?.unlimited||variant.sizeStocks?.find(x=>String(x.size)===String(size))?.unlimited)&&stock!=null&&alreadyInCart+1>Number(stock))throw new Error('Only '+Math.max(0,Math.floor(Number(stock)))+' available for '+variant.name+' · '+size+'.');
        }
        variant.sizeQuantities[size]=next;
        const remaining=[];let qty=0,total=0,aggregate={};
        for(const v of d.selectedItems||[]){
          const sizes=Object.fromEntries(Object.entries(v.sizeQuantities||{}).filter(([,q])=>Number(q)>0));
          const count=Object.values(sizes).reduce((n,q)=>n+Number(q),0);if(!count)continue;
          v.sizeQuantities=sizes;v.orderedQty=count;v.lineTotal=Object.entries(sizes).reduce((n,[z,q])=>n+Number(q)*Number(v.sizeRates?.[z]??v.rate??item.price??0),0);
          qty+=count;total+=v.lineTotal;for(const [z,q] of Object.entries(sizes))aggregate[z]=(aggregate[z]||0)+Number(q);
          remaining.push(v);
        }
        d.selectedItems=remaining;d.sizeQuantities=aggregate;d.itemQuantities=Object.fromEntries(remaining.map(v=>[v.id,v.sizeQuantities]));d.totalUnits=qty;d.totalPieces=qty;d.totalAmount=total;
        item.qty=qty;item.total=total;item.price=qty?total/qty:0;
        item.detail=remaining.map(v=>v.name+': '+Object.entries(v.sizeQuantities).map(([z,q])=>z+' × '+q).join(', ')).join(' · ');
        item.design=clone(d);item.uniformOrder=clone(d);
      }else if(Array.isArray(item.bulkLines)&&item.bulkLines.length){
        const line=item.bulkLines.find(x=>String(x.variantId||'')===String(optionId)&&String(x.size||'')===String(size));if(!line)return;
        const next=Number(line.qty||0)+number;if(next<0||(next===0&&Number(item.qty)<=1))return;
        if(number>0){
          const product=state.products.find(p=>String(p.id)===String(item.productId));
          const variant=productVariants(product).find(v=>String(v.id||'')===String(line.variantId||'')&&String(v.size||'')===String(size));
          const stock=variant?.stock??(line.variantId?null:product?.stock)??line.stock;
          if(stock!=null){const reserved=state.cart.filter(x=>String(x.productId)===String(item.productId)).flatMap(x=>x.bulkLines||[]).filter(x=>String(x.variantId||'')===String(optionId)&&String(x.size||'')===String(size)).reduce((n,x)=>n+Number(x.qty||0),0);if(reserved+1>Number(stock))throw new Error('Only '+Number(stock)+' available for '+(size||'item')+'.');}
        }
        line.qty=next;item.bulkLines=item.bulkLines.filter(x=>Number(x.qty)>0);item.qty=bulkTotalQty(item.bulkLines);item.total=bulkTotalPrice(item.bulkLines);item.price=item.qty?item.total/item.qty:0;item.detail=item.bulkLines.map(x=>(x.size||x.color||'Item')+' × '+x.qty).join(' · ');
      }else if(item.itemType==='custom_design'&&item.sizeQuantities){
        const next=Number(item.sizeQuantities[size]||0)+number;if(next<0||(next===0&&Number(item.qty)<=1))return;
        if(next>100000)throw new Error('Quantity is too large.');
        if(next===0)delete item.sizeQuantities[size];else item.sizeQuantities[size]=next;
        item.qty=Object.values(item.sizeQuantities).reduce((n,q)=>n+Number(q),0);
        item.customDesign={...(item.customDesign||{}),sizeQuantities:{...item.sizeQuantities},totalQty:item.qty};
        item.price=S.customDesignPrice?.(item.customDesign,item.qty,state.settings)??item.price;item.total=Number(item.price||0)*item.qty;
      }else{
        item.qty=Math.max(1,Number(item.qty||1)+number);
        if(item.qty>100000)throw new Error('Quantity is too large.');
        item.total=Number(item.price||0)*item.qty;
      }
      state.cart=state.cart.map(v=>v===current?item:v);
      syncCartQuantityUi(item);
      scheduleCartQuantitySync(String(item.key));
    }catch(e){showToast(e.message||'Could not update quantity.');}
  }
  function cart(){
    return '<main class="cart-page section-wrap screen screen-enter improved-cart-page simple-cart-page"><div class="catalog-title cart-title"><div><span class="eyebrow">YOUR SELECTIONS</span><h1>Cart</h1><p>Review products, size quantities and saved custom designs before checkout.</p></div></div>'+(state.cart.length?'<div class="cart-layout"><section class="cart-list">'+state.cart.map(cartItem).join('')+'</section><aside class="order-summary clean-order-summary"><span class="eyebrow">SUMMARY</span><div class="summary-line"><span>Selected pieces</span><b>'+totalQty()+'</b></div><div class="summary-line"><span>Products / designs</span><b>'+state.cart.length+'</b></div><div class="summary-total"><span>Estimated total</span><strong>'+S.money(subtotal())+'</strong></div><small>Final delivery charges, if any, are confirmed at checkout.</small><button class="primary wide" data-action="checkout">Continue to checkout '+I('arrow')+'</button><button class="secondary wide cart-edit-design" data-go="customize">Continue designing</button></aside></div>':'<div class="empty-state cart-empty">'+I('cart')+'<h2>Your cart is empty</h2><p>Add a catalogue item, custom design or team jersey order.</p><div><button class="primary" data-go="customize">Open customizer</button><button class="secondary" data-go="catalog">Browse products</button></div></div>')+'</main>';
  }
  function deliveryAddressLine(a){return [a?.business_name,a?.line1,a?.line2,a?.landmark,a?.city,a?.district,a?.state,a?.postal_code].filter(Boolean).join(', ');}
  function activeDeliveryAddress(){return state.addresses.find(a=>String(a.id)===String(state.selectedAddressId))||null;}
  function savedAddressCards(checkoutMode=false){
    if(!state.addresses.length)return '<p class="addresses-empty">No saved addresses yet. Add your first delivery address.</p>';
    return '<div class="saved-address-grid">'+state.addresses.map(a=>'<div class="saved-address-card '+(String(a.id)===String(state.selectedAddressId)?'active':'')+'">'+(checkoutMode?'<button type="button" data-action="select-address" data-id="'+S.esc(a.id)+'" class="saved-address-select" aria-pressed="'+(String(a.id)===String(state.selectedAddressId))+'">':'<div class="saved-address-select">')+'<strong>'+S.esc(a.label||'Address')+(a.is_default?' · Default':'')+'</strong><b>'+S.esc(a.recipient_name)+'</b><span>'+S.esc(deliveryAddressLine(a))+'</span><small>'+S.esc(a.phone||state.customer?.phone||'')+'</small>'+(checkoutMode?'</button>':'</div>')+'<div class="saved-address-actions"><button type="button" data-action="edit-address" data-id="'+S.esc(a.id)+'">Edit</button><button type="button" data-action="delete-address" data-id="'+S.esc(a.id)+'">Delete</button></div></div>').join('')+'</div>';
  }
  function addressEditorForm(){if(state.addressEditor===null)return '';const a=state.addresses.find(x=>String(x.id)===String(state.addressEditor))||{},draft=readDraft('address'),values=draft&&String(draft.editorId)===String(state.addressEditor)?draft.values||{}:{},v=(field,key)=>S.esc(Object.hasOwn(values,field)?values[field]:a[key]||''),paragraph=Object.hasOwn(values,'line1')?String(values.line1):[a.line1,a.line2,a.landmark,a.city,a.district,a.state].filter(Boolean).join(', ');return '<form class="saved-address-form" data-saved-address-form><h3>'+(a.id?'Edit address':'Add delivery address')+'</h3><div class="saved-address-fields"><label>Name<input name="recipientName" required minlength="2" maxlength="120" value="'+v('recipientName','recipient_name')+'"></label><label>Phone number<input name="phone" required type="tel" pattern="[+0-9 ()-]{10,20}" maxlength="20" value="'+v('phone','phone')+'"></label><label>Business / institute<input name="businessName" maxlength="160" value="'+v('businessName','business_name')+'" placeholder="Optional"></label><label>PIN code<input name="postalCode" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="'+v('postalCode','postal_code')+'"></label><label class="span2">Full address<textarea name="line1" required minlength="4" maxlength="1500" rows="4" placeholder="House/building, street, locality, city, district and state">'+S.esc(paragraph)+'</textarea></label></div><label class="address-default-check"><input type="checkbox" name="isDefault" '+((Object.hasOwn(values,'line1')||Object.keys(values).length?!!draft.isDefault:!!a.is_default)?'checked':'')+'> Set as default address</label><div class="saved-address-form-actions"><button type="submit" class="primary">Save address</button><button type="button" data-action="cancel-address" class="secondary">Cancel</button></div></form>';}

  function addressesSection(checkoutMode=false){return '<section class="saved-address-section"><div class="saved-address-heading"><h2>Delivery addresses</h2><button class="secondary" type="button" data-action="new-address">+ Add address</button></div>'+savedAddressCards(checkoutMode)+addressEditorForm()+'</section>';}
  function checkout(){
    const orderItems=checkoutItems();
    if(state.orderPlaced)return success();const deliveries=S.getDelivery().filter(x=>x.active);
    // Checkout can be started from Buy Now without adding anything to saved Cart.
    // Check the active order items, not the saved cart, otherwise Buy Now lands on Cart.
    if(!orderItems.length)return cart();
    state.payment='Cash on delivery';
    const selectedDelivery=deliveries.find(d=>d.name===state.delivery)||deliveries[0];
    if(selectedDelivery&&!deliveries.some(d=>d.name===state.delivery))state.delivery=selectedDelivery.name;
    const addressPreview=[state.details.name,state.details.address,state.customer?.phone||state.details.phone].filter(Boolean).map(S.esc);
    const stepTwo='<div class="delivery-payment-step"><div class="checkout-step-title"><span class="eyebrow">STEP 02</span><h1>Delivery & payment</h1><p>Choose how you want the order delivered. Payment is available only as Cash on Delivery.</p></div>'+
      '<div class="checkout-address-preview"><span class="checkout-option-icon">'+I('map')+'</span><div><small>DELIVER TO</small><b>'+S.esc(state.details.name||state.customer?.name||'Customer')+'</b><p>'+S.esc(state.details.address||'Delivery address')+'</p></div><button type="button" data-action="checkout-edit-details">Edit</button></div>'+
      '<section class="checkout-option-section"><div class="checkout-option-heading"><div><span>01</span><div><b>Delivery method</b><small>Select one available delivery option</small></div></div></div><div class="delivery-method-grid">'+deliveries.map(d=>'<button type="button" data-delivery="'+S.esc(d.name)+'" class="delivery-method-card '+(state.delivery===d.name?'active':'')+'"><span class="checkout-option-icon">'+I(d.name.toLowerCase().includes('pickup')?'package':d.name.toLowerCase().includes('bus')?'box':'truck')+'</span><span class="delivery-method-copy"><b>'+S.esc(d.name)+'</b><small>'+S.esc(d.note||'Delivery details will be confirmed with your order.')+'</small></span><span class="delivery-check">'+(state.delivery===d.name?I('check'):'')+'</span></button>').join('')+'</div></section>'+
      '<section class="checkout-option-section payment-only-cod"><div class="checkout-option-heading"><div><span>02</span><div><b>Payment method</b><small>Only one payment method is available</small></div></div></div><div class="cod-payment-card active"><span class="checkout-option-icon cod-icon">'+I('card')+'</span><span class="delivery-method-copy"><b>Cash on Delivery</b><small>Pay when your order is delivered.</small></span><span class="cod-badge">SELECTED</span><span class="delivery-check">'+I('check')+'</span></div><div class="cod-note">'+I('shield')+'<span><b>No online payment required</b><small>Your order will be placed without redirecting to any payment gateway.</small></span></div></section>'+
      '<section class="checkout-option-section redeem-checkout-section"><div class="checkout-option-heading"><div><span>03</span><div><b>Redeem code</b><small>Have a discount code?</small></div></div></div><div class="redeem-entry"><input type="text" maxlength="32" data-redeem-input placeholder="Enter code" autocomplete="off" value="'+S.esc(state.redeemInput||'')+'" aria-label="Redeem code"><button type="button" class="secondary" data-action="apply-redeem" '+(state.redeemBusy?'disabled':'')+'>'+(state.redeemBusy?'Checking…':'Apply')+'</button></div>'+(state.redeemError?'<p class="redeem-error">'+S.esc(state.redeemError)+'</p>':'')+(state.redeemApplied?'<div class="redeem-applied"><b>'+S.esc(state.redeemApplied.code)+' · −'+S.money(Math.min(subtotal(orderItems),Number(state.redeemApplied.discount||0)))+'</b><button type="button" data-action="remove-redeem">Remove</button></div>':'')+'</section>'+
      '<div class="checkout-place-order"><div><small>TOTAL</small>'+(state.redeemApplied?'<span class="redeem-original">'+S.money(subtotal(orderItems))+'</span>':'')+'<strong>'+S.money(Math.max(0,subtotal(orderItems)-(state.redeemApplied?Number(state.redeemApplied.discount||0):0)))+'</strong><span>'+totalQty(orderItems)+' piece'+(totalQty(orderItems)===1?'':'s')+' in this order</span></div><button class="primary order-submit-button" data-action="submit-order" '+(state.orderSubmitting?'disabled aria-busy="true"':'')+'>'+(state.orderSubmitting?'<span class="order-submit-inline-spinner" aria-hidden="true"></span> Placing order…':'Place order '+I('arrow'))+'</button></div></div>';
    const submitOverlay=state.orderSubmitting?'<div class="order-submit-overlay" role="status" aria-live="assertive" aria-busy="true"><div class="order-submit-loader"><span class="order-submit-spinner" aria-hidden="true"></span><strong>Placing your order</strong><p>Please wait while we save your order and confirm all items.</p><div class="order-submit-dots" aria-hidden="true"><i></i><i></i><i></i></div><small>Do not tap Place Order again.</small></div></div>':'';
    return '<main class="checkout-page section-wrap screen screen-enter styled-checkout-page"><div class="checkout-head">'+logo(true)+'<span>Secure checkout '+I('shield')+'</span></div><div class="checkout-steps two-steps"><span class="'+(state.checkoutStep>=1?'active':'')+'"><b>1</b>Details</span><i></i><span class="'+(state.checkoutStep>=2?'active':'')+'"><b>2</b>Delivery & payment</span></div><div class="checkout-layout"><section class="checkout-card styled-checkout-card">'+(state.checkoutStep===1?'<div><span class="eyebrow">STEP 01</span><h1>Delivery address</h1><p>Choose a saved address or add a new one.</p>'+addressesSection(true)+'<label class="checkout-remarks-label">Remarks<textarea data-checkout-remarks rows="2" maxlength="5000" placeholder="Anything we should know about this order?">'+S.esc(state.remarks||readDraft('checkout-remarks')?.value||'')+'</textarea></label><label class="checkout-business-label">Business / institution <small>optional</small><input data-checkout-business value="'+S.esc(readDraft('checkout-business')?.value??state.details.business??state.customer?.businessName??'')+'"></label><button type="button" class="primary wide" data-action="delivery-step" '+(!activeDeliveryAddress()?'disabled':'')+'>Continue '+I('arrow')+'</button></div>':stepTwo)+'</section><aside class="order-summary checkout-summary styled-checkout-summary"><span class="eyebrow">YOUR ORDER</span>'+orderItems.map(i=>'<div><span>'+i.qty+' × '+S.esc(i.name)+'</span><b>'+(Number(i.total??(i.price*i.qty))>0?S.money(i.total??(i.price*i.qty)):'Quote')+'</b></div>').join('')+'<hr>'+(state.redeemApplied?'<div class="summary-line"><span>Discount ('+S.esc(state.redeemApplied.code)+')</span><b>−'+S.money(Math.min(subtotal(orderItems),Number(state.redeemApplied.discount||0)))+'</b></div>':'')+'<div class="summary-total"><span>Total</span><strong>'+S.money(Math.max(0,subtotal(orderItems)-Number(state.redeemApplied?.discount||0)))+'</strong></div><small class="checkout-summary-cod">'+I('check')+' Cash on Delivery</small></aside></div></main>'+submitOverlay;
  }
  function success(){return '<main class="success-page section-wrap screen screen-enter"><div class="success-card">'+I('check')+'<span class="eyebrow">ORDER CONFIRMED</span><h1>Thank you.</h1><p>Your order and exact custom design data were saved.</p><div class="success-order"><span>Order reference</span><b>#'+S.esc(state.orderReference)+'</b></div><div><button class="primary" data-action="view-order">View my order</button><button class="secondary" data-go="home">Back to home</button></div></div></main>';}
  function orderItem(item){
    if(item.teamDesign){const d=item.teamDesign||{},front=d.design?.front||d.front||{},back=d.design?.back||d.back||{},rows=d.roster||[],src=x=>x?.compositeUrl||x?.compositeDataUrl||x?.backgroundUrl||x?.backgroundDataUrl||'';return '<div class="ordered-item ordered-team-enquiry"><div class="team-order-mini-previews">'+(src(front)?'<figure><img src="'+S.esc(src(front))+'" alt="Front team design"><figcaption>Front</figcaption></figure>':'')+(src(back)?'<figure><img src="'+S.esc(src(back))+'" alt="Back team design"><figcaption>Back</figcaption></figure>':'')+'</div><div><span>TEAM ENQUIRY</span><h3>'+S.esc(item.name)+'</h3><p>'+rows.length+' player'+(rows.length===1?'':'s')+' · Front + back design saved</p><div class="team-order-roster-mini">'+rows.slice(0,4).map(r=>'<small>'+[r.name,r.number,r.size].filter(Boolean).map(S.esc).join(' · ')+'</small>').join('')+(rows.length>4?'<small>+'+(rows.length-4)+' more</small>':'')+'</div></div><strong>Quote</strong></div>';}
    if(item.itemType==='printable_order'){const d=item.design||{};return '<div class="ordered-item"><div><span>PRINTABLE ITEM</span><h3>'+S.esc(item.name)+'</h3><small>'+S.esc([d.garmentTypeName,d.fabricName,d.quality,(d.printableSizes||[]).map(v=>v.size+' × '+v.qty).join(', '),(d.selectedPrints||[]).map(v=>v.name+' '+(v.sizeLabel||printSizeLabel(v.size))+' × '+v.qty).join(', ')].filter(Boolean).join(' · '))+'</small></div><strong>'+S.money(item.design?.totalAmount??item.total??item.qty*item.price)+'</strong></div>';}if(item.uniformOrder){const d=item.uniformOrder||{},items=(d.selectedItems||[]),summary=items.map(x=>x.name+': '+Object.entries(x.sizeQuantities||{}).filter(([,q])=>Number(q)>0).map(([size,q])=>size+' × '+q).join(', ')).filter(Boolean),image=items.find(x=>(x.images||[]).length)?.images?.[0]||d.cardImage||d.images?.[0]||item.image||'',priceText=Number(item.price||0)>0?S.money(item.price*item.qty):'Ordered';return '<div class="ordered-item ordered-uniform-item">'+(image?'<div class="cart-ready-preview">'+img(image,item.name,'','assets/product-placeholder.svg')+'</div>':'')+'<div><span>'+S.esc(d.catalogueSection==='ready'?'READY MADE':((d.categoryMode==='uniform'||(!d.categoryMode&&/uniform/i.test(d.categoryName||'')))?'UNIFORM':'CUSTOM CATALOGUE'))+'</span><h3>'+S.esc(item.name)+'</h3><small>'+S.esc(summary.join(' · '))+'</small></div><strong>'+priceText+'</strong></div>';}
    const faces=item.customDesign?S.designedSurfaces(item.customDesign):[],finalFront=item.customDesign?.frontCompositeUrl||item.customDesign?.frontCompositeDataUrl||'',finalBack=item.customDesign?.backCompositeUrl||item.customDesign?.backCompositeDataUrl||'';const previews=item.customDesign?(finalFront||finalBack?'<div class="design-surface-gallery">'+(finalFront?'<figure><img src="'+S.esc(finalFront)+'" alt="Front final design"><figcaption>front</figcaption></figure>':'')+(finalBack?'<figure><img src="'+S.esc(finalBack)+'" alt="Back final design"><figcaption>back</figcaption></figure>':'')+'</div>':'<div class="design-surface-gallery">'+(faces.length?faces:['front']).map(face=>'<figure>'+S.designPreview(item.customDesign,face)+'<figcaption>'+face.replace('Sleeve',' sleeve')+'</figcaption></figure>').join('')+'</div>'):'<div class="cart-ready-preview">'+img(item.image,item.name,'','assets/crew-tee.webp')+'</div>';return '<div class="ordered-item">'+previews+'<div><span>'+(item.custom?'CUSTOMIZED ITEM':'READY-MADE ITEM')+'</span><h3>'+S.esc(item.name)+'</h3><p>'+[item.color,item.size,'Qty '+item.qty].filter(Boolean).map(S.esc).join(' · ')+'</p>'+(item.customDesign?'<dl><div><dt>Print</dt><dd>'+S.esc(item.customDesign.printType)+'</dd></div><div><dt>Print areas</dt><dd>'+faces.length+'</dd></div></dl>':'')+'</div><strong>'+S.money(item.price*item.qty)+'</strong></div>';}

  function customerEnquiryHistoryCard(e){const p=e.payload||{},u=p.uniformSelection,sizeText=u?.sizeQuantities?Object.entries(u.sizeQuantities).filter(([,q])=>Number(q)>0).map(([sz,q])=>sz+' × '+q).join(', '):u?.size||'',option=u?[u.top&&('Top: '+u.top.name),u.bottom&&('Bottom: '+u.bottom.name),sizeText&&('Sizes: '+sizeText),u.totalQty&&('Total: '+u.totalQty)].filter(Boolean).join(' · '):[p.garmentTypeName,p.fabricName,p.fabricQuality].filter(Boolean).join(' · '),corporateSizes=String(p.categoryName||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()==='corporate tee shirt'&&p.jerseySizes?.sizeQuantities?Object.entries(p.jerseySizes.sizeQuantities).filter(([,qty])=>Number(qty)>0).map(([size,qty])=>size+' × '+qty).join(', '):'',hasRate=p.itemRate!==null&&p.itemRate!==undefined&&p.itemRate!=='',image=p.image||p.images?.[0]||'';return '<article class="customer-order-card customer-history-enquiry"><div class="customer-order-head"><div><span>ENQUIRY #'+S.esc(String(e.id||'').slice(0,8).toUpperCase())+'</span><h2>Enquiry sent</h2></div><div><small>'+S.esc(e.time||'')+'</small><strong>'+(hasRate?S.money(p.itemRate):'QUOTE')+'</strong></div></div><div class="customer-order-items"><div class="ordered-item customer-enquiry-history-item">'+(image?img(image,p.itemTitle||'Customization enquiry'):'<div class="customer-enquiry-history-placeholder">'+I('contact')+'</div>')+'<div><span>'+S.esc(p.categoryName||'CUSTOM CATALOGUE')+'</span><h3>'+S.esc(p.itemTitle||'Customization enquiry')+'</h3>'+(option?'<p>'+S.esc(option)+'</p>':'')+(corporateSizes?'<p>Sizes: '+S.esc(corporateSizes)+'</p>':'')+(p.itemDescription?'<small>'+S.esc(p.itemDescription)+'</small>':'')+'</div><strong>'+(hasRate?S.money(p.itemRate):'Enquiry')+'</strong></div></div><div class="customer-order-foot"><span>'+I('contact')+' Custom Catalogue enquiry</span><span>'+I('check')+' Submitted</span></div></article>';}
  function customerOrderStatus(o){
    const stages=['Confirmed','Processing','Ready','Dispatched','Completed'],status=String(o?.status||'Confirmed'),cancel=/cancel|reject/i.test(status),rank=cancel?0:Math.max(0,stages.findIndex(x=>x.toLowerCase()===status.toLowerCase()));
    return '<div class="customer-order-timeline" aria-label="Order progress">'+stages.map((step,i)=>'<div class="customer-order-step '+(i<=rank&&!cancel?'complete':'')+'"><span class="customer-order-node">'+(i<=rank&&!cancel?'✓':i+1)+'</span><small>'+step+'</small></div>').join('')+'</div>'+(cancel?'<p class="customer-order-alert">Status: '+S.esc(status)+'</p>':'');
  }
  function orderDisplayImages(item){const d=item.design||item.uniformOrder||item.customDesign||item.teamDesign||{},selected=(d.selectedItems||[]).flatMap(v=>(v.images||[]).map(src=>({src,label:v.name||item.name}))),custom=[d.frontCompositeUrl||d.frontCompositeDataUrl,d.backCompositeUrl||d.backCompositeDataUrl,d.design?.front?.compositeUrl||d.front?.compositeUrl,d.design?.back?.compositeUrl||d.back?.compositeUrl].filter(Boolean).map((src,i)=>({src,label:i%2?'Back design':'Front design'}));const list=selected.length?selected:(custom.length?custom:[...(d.images||[]).map(src=>({src,label:item.name})),{src:item.image||d.image||d.cardImage||d.artworkUrl||'',label:item.name}]);return list.filter((v,i,a)=>v.src&&a.findIndex(x=>x.src===v.src)===i);}
  function customerOrderDetailModal(){const o=state.orders.find(x=>String(x.id)===String(state.orderDetailId));if(!o)return'';const delivery=o.metadata?.deliveryRecipient||{};return '<div class="customer-order-overlay" data-customer-order-overlay><section class="customer-order-sheet" role="dialog" aria-modal="true" aria-label="Order details"><header class="customer-order-sheet-header"><div><small>ORDER #'+S.esc(o.id)+'</small><h2>Order details</h2></div><button type="button" data-action="close-order-detail" aria-label="Close order">×</button></header><div class="customer-order-sheet-content"><div class="customer-order-summary"><span>'+S.esc(o.time||'')+'</span><strong>'+S.money(o.total)+'</strong><b>'+S.esc(o.status)+'</b></div>'+customerOrderStatus(o)+'<h3>Items ordered</h3>'+((o.orderItems||[]).map(item=>{const d=item.design||{},variants=(d.selectedItems||[]),sizes=variants.map(v=>v.name+': '+Object.entries(v.sizeQuantities||{}).filter(([,q])=>Number(q)>0).map(([z,q])=>z+' × '+q).join(', ')).join(' | '),photos=orderDisplayImages(item);return '<article class="customer-order-detail-item"><h4>'+S.esc(item.name)+'</h4><p>'+S.esc([item.code,item.color,item.size,'Qty '+item.qty].filter(Boolean).join(' · '))+'</p>'+(sizes?'<p>'+S.esc(sizes)+'</p>':'')+(d.kind==='printable_order'?'<p>'+S.esc([d.garmentTypeName,d.fabricName,d.quality,(d.printableSizes||[]).map(v=>v.size+' × '+v.qty).join(', '),(d.selectedPrints||[]).map(v=>v.name+' '+(v.sizeLabel||printSizeLabel(v.size))+' × '+v.qty+' @ '+S.money(v.rate)).join(', ')].filter(Boolean).join(' · '))+'</p>':'')+(variants.some(v=>v.detailTitle||v.detailDescription)?'<p>'+S.esc(variants.map(v=>[v.detailTitle,v.detailDescription].filter(Boolean).join(': ')).filter(Boolean).join(' · '))+'</p>':'')+(photos.length?'<div class="customer-order-detail-images">'+photos.map(v=>'<figure>'+img(v.src,v.label,'')+'<figcaption>'+S.esc(v.label)+'</figcaption></figure>').join('')+'</div>':'')+'<b>'+S.money(d.kind==='printable_order'?d.totalAmount:item.qty*item.price)+'</b></article>';}).join('')||'<p>Order details not available.</p>')+(o.metadata?.redeem?.code?'<p class="redeem-order-note">Code '+S.esc(o.metadata.redeem.code)+' · -'+S.money(o.metadata.redeem.discount||0)+'</p>':'')+'<h3>Account & delivery</h3><div class="customer-order-delivery"><p><b>Account:</b> '+S.esc(o.metadata?.account?.name||state.customer?.name||o.customer)+'</p><p><b>Recipient:</b> '+S.esc(delivery.name||o.customer)+'</p><p><b>Phone:</b> '+S.esc(delivery.phone||o.phone)+'</p><p><b>Address:</b> '+S.esc(delivery.address||o.address)+'</p>'+(o.metadata?.remarks?'<p><b>Remarks:</b> '+S.esc(o.metadata.remarks)+'</p>':'')+'<p><b>Delivery:</b> '+S.esc(o.delivery)+'</p><p><b>Payment:</b> '+S.esc(o.payment)+'</p>'+(o.metadata?.expected_delivery_date?'<p class="customer-order-expected-date"><b>Expected delivery:</b> '+S.esc(customerDeliveryDate(o.metadata.expected_delivery_date))+'</p>':'')+'</div><button class="primary wide" type="button" data-action="download-customer-order" data-id="'+S.esc(o.id)+'">Download A4 order PDF '+I('download')+'</button><button class="secondary wide" type="button" data-action="share-customer-order" data-id="'+S.esc(o.id)+'">Share order PDF '+I('share')+'</button></div></section></div>';}
  function pdfPlain(value){return String(value??'').replace(/[^\x20-\x7e]/g,' ').replace(/\s+/g,' ').trim();}
  async function customerPdfImage(doc,src,x,y,maxW=80,maxH=63){if(!src)return 0;try{const im=await loadOrderImage(src),canvas=document.createElement('canvas');canvas.width=Math.min(1600,im.naturalWidth);canvas.height=Math.min(1600,Math.round(im.naturalHeight*canvas.width/im.naturalWidth));canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);const w=Math.min(maxW,maxH*im.naturalWidth/im.naturalHeight),h=Math.min(maxH,maxW*im.naturalHeight/im.naturalWidth);doc.addImage(canvas.toDataURL('image/jpeg',.88),'JPEG',x,y,w,h);return h;}catch(_){return 0;}}
  function customerDeliveryDate(value){
    const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));
    if(!match)return String(value||'');
    const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    if(date.getFullYear()!==Number(match[1])||date.getMonth()+1!==Number(match[2])||date.getDate()!==Number(match[3]))return String(value);
    return date.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  }
  // Use the recipient actually entered during checkout, and the order's original timestamp.
  // Filenames cannot contain ':' on Windows, so use HH-mm for 24-hour time.
  function customerOrderPdfFilename(order){
    const rawName=String(order?.metadata?.deliveryRecipient?.name||order?.customer||'CUSTOMER').trim();
    const recipient=rawName.normalize('NFKC').replace(/[^\p{L}\p{M}\p{N}._ -]+/gu,'-').replace(/[-\s]+/g,'-').replace(/[-.]+$/g,'').slice(0,65)||'CUSTOMER';
    const stamp=order?.createdAt||order?.created_at||order?.time||'';
    const date=new Date(stamp);let placed='DATE-UNKNOWN';
    if(Number.isFinite(date.getTime())){
      const fields=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));
      placed=fields.year+'-'+fields.month+'-'+fields.day+'-'+fields.hour+'-'+fields.minute;
    }
    return 'ONELINE-'+recipient+'-'+placed+'.pdf';
  }
  async function downloadCustomerOrderPdf(id){
    const order=state.orders.find(x=>String(x.id)===String(id));if(!order)throw new Error('Order not found.');
    const doc=await window.OneLineCustomerPdf(order,order.orderItems||[]);
    doc.save(customerOrderPdfFilename(order));
  }
  async function shareCustomerOrderPdf(id){
    const order=state.orders.find(x=>String(x.id)===String(id));if(!order)throw new Error('Order not found.');
    const doc=await window.OneLineCustomerPdf(order,order.orderItems||[]),filename=customerOrderPdfFilename(order);
    const file=new File([doc.output('blob')],filename,{type:'application/pdf'});
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      try{await navigator.share({files:[file],title:'One-Line order '+String(order.id)});return;}
      catch(err){if(err?.name==='AbortError')return;}
    }
    doc.save(filename);showToast('Sharing unavailable here. Downloaded the PDF instead.');
  }
  function orders(){const history=[...state.orders.map(o=>({kind:'order',createdAt:o.createdAt||'',data:o})),...state.enquiries.map(e=>({kind:'enquiry',createdAt:e.createdAt||'',data:e}))].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));return '<main class="customer-orders-page section-wrap screen screen-enter"><div class="catalog-title"><div><span class="eyebrow">CUSTOMER ORDER HISTORY</span><h1>Orders & enquiries</h1><p>Your confirmed orders and Custom Catalogue enquiries are kept together here.</p></div></div><div class="customer-order-list">'+(history.length?history.map(entry=>{if(entry.kind==='enquiry')return customerEnquiryHistoryCard(entry.data);const o=entry.data;return '<article class="customer-order-card customer-order-clickable" data-order-card="'+S.esc(o.id)+'" tabindex="0" role="button" aria-label="Open order '+S.esc(o.id)+'"><div class="customer-order-head"><div><span>ORDER #'+S.esc(o.id)+'</span><h2>'+S.esc(o.status)+'</h2></div><div><small>'+S.esc(o.time)+'</small><strong>'+S.money(o.total)+'</strong></div></div><div class="customer-order-items">'+(o.orderItems?.length?o.orderItems.map(orderItem).join(''):'<div class="legacy-order-note">'+I('package')+'<span><b>'+o.items+' ordered items</b><small>Older demo order</small></span></div>')+'</div><div class="customer-order-foot"><span>'+I('truck')+' '+S.esc(o.delivery)+'</span><span>'+I('card')+' '+S.esc(o.payment)+'</span><span>'+I('map')+' '+S.esc(o.address)+'</span></div><div class="customer-order-cta">View order details →</div></article>';}).join(''):'<div class="empty-state"><h2>No history yet</h2><p>Your confirmed orders and enquiries appear here.</p></div>')+'</div></main>'+customerOrderDetailModal();}
  function profile(){
    const customer=state.customer||B?.customerSession?.()||null;
    const verified=!!customer?.token;
    const name=String(customer?.name||'').trim();
    const rawPhone=String(customer?.phone||'').trim();
    const phone=rawPhone.replace(/^91(?=\d{10}$)/,'+91 ');
    const verifiedLabel='<span class="profile-verified-label">'+I('check')+' Verified account</span>';
    // Only identity appears at the top. The full profile lives on a separate page.
    const profileHeader=verified
      ?'<section class="profile-identity profile-overview-top profile-compact-header"><div class="profile-avatar profile-avatar-icon">'+I('user')+'</div><div class="profile-identity-copy"><h1>'+S.esc(name||'Your account')+'</h1><p class="profile-header-phone">'+S.esc(phone)+'</p>'+verifiedLabel+'</div></section>'
      :'<section class="profile-identity guest-profile profile-overview-top profile-compact-header"><div class="profile-avatar profile-avatar-icon">'+I('user')+'</div><div class="profile-identity-copy"><h1>Your account</h1><button class="primary profile-login-button" data-action="profile-login">Verify mobile number</button></div></section>';
    const profileShortcut='<button type="button" class="profile-shortcut" data-go="profileDetails"><span class="profile-action-icon">'+I('user')+'</span><span><b>Profile</b><small>'+(verified?'View and edit your personal details':'Personal details')+'</small></span>'+I('arrow')+'</button>';
    return '<main class="profile-page profile-overview-page section-wrap screen screen-enter">'+profileHeader+'<section class="profile-action-grid">'+profileShortcut+'<button data-go="cart"><span class="profile-action-icon">'+I('cart')+'</span><span><b>Cart</b><small>'+totalQty()+' selected piece'+(totalQty()===1?'':'s')+'</small></span>'+I('arrow')+'</button><button data-go="orders"><span class="profile-action-icon">'+I('orders')+'</span><span><b>Orders</b><small>Synced to your verified number</small></span>'+I('arrow')+'</button>'+(verified?'<button data-go="addresses"><span class="profile-action-icon">'+I('map')+'</span><span><b>Addresses</b><small>'+state.addresses.length+' saved delivery address'+(state.addresses.length===1?'':'es')+'</small></span>'+I('arrow')+'</button>':'')+'<button data-go="customize"><span class="profile-action-icon">'+I('plus')+'</span><span><b>Custom designer</b><small>Create your own apparel</small></span>'+I('arrow')+'</button><button data-go="teamUpload"><span class="profile-action-icon">'+I('image')+'</span><span><b>Team order</b><small>Upload one design for the whole team</small></span>'+I('arrow')+'</button></section><section class="profile-info-card"><h2>Help & information</h2><div class="profile-info-links"><button data-legal="About">About OneLine '+I('arrow')+'</button><button data-legal="Terms & Conditions">Terms & Conditions '+I('arrow')+'</button><button data-legal="Privacy Policy">Privacy Policy '+I('arrow')+'</button><button data-legal="Shipping & Returns">Shipping & Returns '+I('arrow')+'</button></div>'+(verified?'<button class="profile-logout" data-action="profile-logout">Sign out on this device</button>':'')+'</section></main>';
  }
  function profileDetails(){
    const customer=state.customer||B?.customerSession?.()||null;
    const verified=!!customer?.token;
    const name=String(customer?.name||'').trim();
    const businessName=String(customer?.businessName||'').trim();
    const jobTitle=String(customer?.jobTitle||'').trim();
    const rawPhone=String(customer?.phone||'').trim();
    const phone=rawPhone.replace(/^91(?=\d{10}$)/,'+91 ');
    const draft=readDraft('profile')||{};
    const value=(key,fallback)=>S.esc(Object.hasOwn(draft,key)?String(draft[key]??''):fallback);
    const verifiedLabel='<span class="profile-verified-label">'+I('check')+' Verified account</span>';
    const contents=verified
      ?'<form class="profile-name-form profile-details-form" data-profile-name><div class="profile-fields-grid"><label><small>Name <span class="required-asterisk">*</span></small><input name="name" required minlength="2" maxlength="120" value="'+value('name',name)+'" placeholder="Your full name" autocomplete="name"></label><label><small>Verified mobile number</small><div class="profile-readonly-phone"><span>'+S.esc(phone)+'</span>'+I('check')+'</div></label><label><small>Business / institution <i>optional</i></small><input name="businessName" maxlength="160" value="'+value('businessName',businessName)+'" placeholder="Company, shop or institution" autocomplete="organization"></label><label><small>Post / role <i>optional</i></small><input name="jobTitle" maxlength="120" value="'+value('jobTitle',jobTitle)+'" placeholder="Owner, Manager, Student…" autocomplete="organization-title"></label></div><div class="profile-details-actions"><button type="submit" class="primary">Save changes</button><button type="button" class="secondary" data-action="profile-cancel-edit">Cancel</button></div></form>'
      :'<div class="profile-details-guest"><p>Verify your mobile number to view and edit your profile.</p><button type="button" class="primary" data-action="profile-login">Verify mobile number</button></div>';
    return '<main class="profile-page profile-details-page section-wrap screen screen-enter"><button class="profile-details-back" type="button" data-go="profile">'+I('back')+' Back to account</button><section class="profile-details-panel"><div class="profile-details-top"><div><span class="eyebrow">MY ACCOUNT</span><h1>Profile</h1><p>Edit your personal details below.</p></div>'+(verified?verifiedLabel:'')+'</div>'+contents+'</section></main>';
  }
  function addressesPage(){
    const verified=!!(state.customer?.token||B?.customerSession?.()?.token);
    return '<main class="profile-page addresses-page section-wrap screen screen-enter"><div class="profile-page-head"><span class="eyebrow">MY ACCOUNT</span><h1>Addresses</h1><p>Manage delivery addresses for your orders.</p></div>'+(verified?addressesSection(false):'<section class="saved-address-section"><p>Sign in to manage your delivery addresses.</p><button type="button" class="primary" data-action="profile-login">Sign in</button></section>')+'</main>';
  }

  function filterModal(audience){
    if(!state.filterOpen)return'';const draft=state.filterDraft||{categories:clone(state.filterCategories),subs:clone(state.filterSubs),options:clone(state.filterOptions)};state.filterDraft=draft;const choices=filterChoices(audience);
    const choice=(kind,val,active)=>'<button type="button" class="catalog-filter-choice '+(active?'is-selected':'')+'" data-filter-choice="'+kind+'" data-value="'+S.esc(val)+'"><span class="filter-check">'+(active?I('check'):'')+'</span><span>'+S.esc(val)+'</span></button>';
    return '<div class="catalog-filter-overlay open"><aside class="catalog-filter-drawer"><header><div><p>'+'Ready-made catalogue'+'</p><h2>Filters</h2></div><button class="filter-drawer-close" data-action="close-filter" aria-label="Close">×</button></header><div class="catalog-filter-body"><section class="filter-drawer-group"><div class="filter-group-title"><span>Category</span><small>Select one or more</small></div><div class="filter-choice-grid">'+choices.cats.map(v=>choice('categories',v,draft.categories.includes(v))).join('')+'</div></section>'+(choices.subs.length?'<section class="filter-drawer-group"><div class="filter-group-title"><span>Subcategory</span><small>Available for selected categories</small></div><div class="filter-choice-grid">'+choices.subs.map(v=>choice('subs',v,draft.subs.includes(v))).join('')+'</div></section>':'')+(choices.options.length?'<section class="filter-drawer-group"><div class="filter-group-title"><span>Size / option</span><small>Only available values are shown</small></div><div class="filter-choice-grid option-choice-grid">'+choices.options.map(v=>choice('options',v,draft.options.includes(v))).join('')+'</div></section>':'')+'</div><footer><div><button class="filter-reset-button" data-action="reset-filter-draft">Clear</button><small>'+(draft.categories.length+draft.subs.length+draft.options.length)+' selected</small></div><button class="filter-apply-button" data-action="apply-filter">Apply filters</button></footer></aside></div>';
  }
  const teamSizes=['XS','S','M','L','XL','XXL','3XL'];
  const teamClamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const teamSide=side=>side==='back'?state.teamBack:state.teamFront;
  const teamUid=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  function resetTeamBuilder(){
    state.teamStep=1;state.teamUnlockedStep=1;state.teamFront={background:'',fileName:'',layers:[]};state.teamBack={background:'',fileName:'',layers:[{id:'team-name',type:'fixedText',text:'NAME',x:50,y:24,sizePct:7},{id:'team-number',type:'fixedText',text:'99',x:50,y:55,sizePct:22}]};state.teamRows=[{name:'',number:'',size:'M'}];state.teamActiveLayer='';state.teamCrop=null;state.teamEnquiryBusy=false;state.teamEnquirySuccess=false;
  }
  function teamStepBar(){
    const steps=[['Upload','Front + back'],['Front','Place logos'],['Back','NAME / 99 + logos'],['Team','Player rows']];
    return '<nav class="team-stepper" aria-label="Team design steps">'+steps.map((x,i)=>{const n=i+1,unlocked=n<=state.teamUnlockedStep,active=state.teamStep===n,done=n<state.teamStep&&unlocked;return '<button type="button" class="'+(active?'active ':done?'done ':'')+(unlocked?'unlocked':'locked')+'" data-team-jump="'+n+'" '+(unlocked?'':'disabled')+' aria-current="'+(active?'step':'false')+'"><b>'+(done?I('check'):String(n).padStart(2,'0'))+'</b><span><strong>'+x[0]+'</strong><small>'+x[1]+'</small></span></button>';}).join('')+'</nav>';
  }
  function teamUploadCard(side,label){
    const data=teamSide(side),has=!!data.background;
    return '<label class="team-side-upload '+(has?'has-image':'')+'"><input type="file" accept="image/png,image/jpeg,image/webp" data-team-side-upload="'+side+'"><div class="team-side-upload-head"><span>'+label+'</span><small>'+(has?'Tap to replace':'PNG, JPG or WebP')+'</small></div><div class="team-side-upload-preview">'+(has?'<img src="'+S.esc(data.background)+'" alt="'+label+' uploaded design">':I('image')+'<b>Upload '+label.toLowerCase()+'</b><small>Choose the clean design image for this side.</small>')+'</div>'+(data.fileName?'<em>'+S.esc(data.fileName)+'</em>':'')+'</label>';
  }

  function teamCropFrame(crop=state.teamCrop){
    const frame=crop?.frame;
    if(!frame)return null;
    const left=Number(frame.left),top=Number(frame.top),width=Number(frame.width),height=Number(frame.height);
    if(![left,top,width,height].every(Number.isFinite)||width<=0||height<=0)return null;
    return {left,top,width,height};
  }
  async function startTeamCrop(file,side){
    if(!file?.type?.startsWith('image/'))throw new Error('Choose an image file.');
    const src=await teamFileDataUrl(file),image=await teamLoadImage(src);
    state.teamCrop={side:side==='back'?'back':'front',fileName:file.name||((side==='back'?'back':'front')+'-design'),src,image,imageWidth:image.naturalWidth||image.width,imageHeight:image.naturalHeight||image.height,frame:null,imageLeft:0,imageTop:0,imageWidthPx:0,imageHeightPx:0,displayScale:1,stageWidth:0,stageHeight:0};
    try{history.pushState({...history.state,oneLine:true,screen:state.screen,oneLineCrop:true,scrollY:window.scrollY},'',location.href);}catch(_){}
    render();
  }
  function closeTeamCrop(){
    if(!state.teamCrop)return;
    if(history.state?.oneLineCrop){
      try{history.back();return;}catch(_){}
    }
    state.teamCrop=null;render();
  }
  function teamCropModal(){
    const crop=state.teamCrop;if(!crop)return'';
    return '<div class="team-crop-overlay" data-team-crop-overlay><section class="team-crop-modal" role="dialog" aria-modal="true" aria-label="Crop image"><header><h2>Crop</h2><button type="button" class="team-crop-close" data-action="team-crop-cancel" aria-label="Cancel crop">×</button></header><div class="team-crop-stage" data-team-crop-stage><img class="team-crop-image" data-team-crop-image src="'+S.esc(crop.src)+'" alt="" draggable="false"><div class="team-crop-box" data-team-crop-box><i class="team-crop-handle nw" data-team-crop-handle="nw"></i><i class="team-crop-handle ne" data-team-crop-handle="ne"></i><i class="team-crop-handle sw" data-team-crop-handle="sw"></i><i class="team-crop-handle se" data-team-crop-handle="se"></i></div></div><footer><button type="button" class="secondary" data-action="team-crop-cancel">Cancel</button><button type="button" class="primary" data-action="team-crop-apply">Done</button></footer></section></div>';
  }
  function bindTeamCrop(){
    const crop=state.teamCrop,stage=root.querySelector('[data-team-crop-stage]'),imageEl=root.querySelector('[data-team-crop-image]'),box=root.querySelector('[data-team-crop-box]');
    if(!crop||!stage||!imageEl||!box)return;
    const stageRect=stage.getBoundingClientRect(),sw=Math.max(1,stageRect.width),sh=Math.max(1,stageRect.height),iw=Math.max(1,Number(crop.imageWidth||crop.image?.naturalWidth||1)),ih=Math.max(1,Number(crop.imageHeight||crop.image?.naturalHeight||1));
    const scale=Math.min(sw/iw,sh/ih),dw=Math.max(1,iw*scale),dh=Math.max(1,ih*scale);
    crop.stageWidth=sw;crop.stageHeight=sh;crop.displayScale=scale;crop.imageWidthPx=dw;crop.imageHeightPx=dh;crop.imageLeft=(sw-dw)/2;crop.imageTop=(sh-dh)/2;crop.frame={left:crop.imageLeft,top:crop.imageTop,width:dw,height:dh};
    const paint=()=>{const f=teamCropFrame(crop);if(!f)return;imageEl.style.left=crop.imageLeft+'px';imageEl.style.top=crop.imageTop+'px';imageEl.style.width=crop.imageWidthPx+'px';imageEl.style.height=crop.imageHeightPx+'px';box.style.left=f.left+'px';box.style.top=f.top+'px';box.style.width=f.width+'px';box.style.height=f.height+'px';box.style.opacity='1';};
    paint();
    let pan=null;
    stage.addEventListener('pointerdown',e=>{if(e.target.closest('[data-team-crop-handle]'))return;const x=e.clientX-stage.getBoundingClientRect().left,y=e.clientY-stage.getBoundingClientRect().top;if(x<crop.imageLeft||x>crop.imageLeft+crop.imageWidthPx||y<crop.imageTop||y>crop.imageTop+crop.imageHeightPx)return;e.preventDefault();pan={id:e.pointerId,startX:e.clientX,startY:e.clientY,left:crop.imageLeft,top:crop.imageTop};try{stage.setPointerCapture(e.pointerId);}catch(_){}});
    stage.addEventListener('pointermove',e=>{if(!pan||pan.id!==e.pointerId)return;e.preventDefault();const f=teamCropFrame(crop);if(!f)return;const minLeft=f.left+f.width-crop.imageWidthPx,maxLeft=f.left,minTop=f.top+f.height-crop.imageHeightPx,maxTop=f.top;crop.imageLeft=teamClamp(pan.left+(e.clientX-pan.startX),minLeft,maxLeft);crop.imageTop=teamClamp(pan.top+(e.clientY-pan.startY),minTop,maxTop);paint();});
    const stopPan=e=>{if(!pan||pan.id!==e.pointerId)return;pan=null;};stage.addEventListener('pointerup',stopPan);stage.addEventListener('pointercancel',stopPan);
    root.querySelectorAll('[data-team-crop-handle]').forEach(handle=>{let resize=null;handle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const f=teamCropFrame(crop);if(!f)return;resize={id:e.pointerId,corner:handle.dataset.teamCropHandle,start:{...f}};try{handle.setPointerCapture(e.pointerId);}catch(_){}});handle.addEventListener('pointermove',e=>{if(!resize||resize.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,il=crop.imageLeft,it=crop.imageTop,ir=il+crop.imageWidthPx,ib=it+crop.imageHeightPx,min=44,s=resize.start,right=s.left+s.width,bottom=s.top+s.height;let left=s.left,top=s.top,newRight=right,newBottom=bottom;if(resize.corner.includes('w'))left=teamClamp(x,il,right-min);if(resize.corner.includes('e'))newRight=teamClamp(x,s.left+min,ir);if(resize.corner.includes('n'))top=teamClamp(y,it,bottom-min);if(resize.corner.includes('s'))newBottom=teamClamp(y,s.top+min,ib);crop.frame={left,top,width:newRight-left,height:newBottom-top};paint();});const stop=e=>{if(!resize||resize.id!==e.pointerId)return;resize=null;};handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);});
  }
  function applyTeamCrop(){
    const crop=state.teamCrop,frame=teamCropFrame(crop);if(!crop||!frame||!crop.image)return;
    const scale=Math.max(.0001,Number(crop.displayScale||1)),iw=Math.max(1,Number(crop.imageWidth||crop.image.naturalWidth||1)),ih=Math.max(1,Number(crop.imageHeight||crop.image.naturalHeight||1));
    const sx=teamClamp((frame.left-crop.imageLeft)/scale,0,iw-1),sy=teamClamp((frame.top-crop.imageTop)/scale,0,ih-1),sw=teamClamp(frame.width/scale,1,iw-sx),sh=teamClamp(frame.height/scale,1,ih-sy),outScale=Math.min(1,1200/Math.max(sw,sh)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(sw*outScale));c.height=Math.max(1,Math.round(sh*outScale));const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(crop.image,sx,sy,sw,sh,0,0,c.width,c.height);
    const data=teamSide(crop.side);data.background=c.toDataURL('image/webp',.84);data.fileName=crop.fileName;state.teamActiveLayer='';
    if(history.state?.oneLineCrop){
      try{history.back();return;}catch(_){}
    }
    state.teamCrop=null;render();
  }
  function teamLayerHtml(layer){
    const active=state.teamActiveLayer===layer.id,pos='left:'+teamClamp(layer.x,0,100)+'%;top:'+teamClamp(layer.y,0,100)+'%;',handle='<i class="team-resize-handle" data-team-resize-layer="'+S.esc(layer.id)+'" aria-hidden="true"></i>';
    if(layer.type==='image')return '<div class="team-edit-layer team-logo-layer '+(active?'selected':'')+'" data-team-layer-id="'+S.esc(layer.id)+'" style="'+pos+'width:'+teamClamp(layer.widthPct,5,100)+'%"><img src="'+S.esc(layer.src)+'" alt="Added logo" draggable="false"><button type="button" data-team-remove-layer="'+S.esc(layer.id)+'" aria-label="Remove logo">×</button>'+handle+'</div>';
    return '<div class="team-edit-layer team-fixed-text '+(active?'selected':'')+'" data-team-layer-id="'+S.esc(layer.id)+'" style="'+pos+'font-size:'+(teamClamp(layer.sizePct,3,30)*6)+'px;font-size:'+teamClamp(layer.sizePct,3,30)+'cqw"><span>'+S.esc(layer.text)+'</span><button type="button" data-team-remove-layer="'+S.esc(layer.id)+'" aria-label="Remove '+S.esc(layer.text)+'">×</button>'+handle+'</div>';
  }
  function teamEditor(side){
    const data=teamSide(side),label=side==='back'?'Back':'Front',active=data.layers.find(l=>l.id===state.teamActiveLayer)||null;
    const controls=active?'<div class="team-layer-controls"><div><b>'+(active.type==='fixedText'?S.esc(active.text):'Selected logo')+'</b><small>Drag to move. Pull the corner handle to resize. Tap outside to deselect.</small></div><button type="button" class="team-delete-selected" data-team-remove-layer="'+S.esc(active.id)+'">'+I('trash')+' Remove</button></div>':'';
    return '<section class="team-editor-card professional-team-editor" data-team-editor-shell><div class="team-editor-head"><div><span class="team-editor-side-badge">'+label.toUpperCase()+'</span><h2>Edit '+label.toLowerCase()+'</h2><p>'+(side==='back'?'Position NAME, 99 and any extra logos.':'Place your logos exactly where they should be printed.')+'</p></div><label class="team-add-logo">'+I('plus')+' Add logo<input type="file" accept="image/png,image/jpeg,image/webp" multiple data-team-logo-upload="'+side+'"></label></div><div class="team-design-editor"><div class="team-edit-stage" data-team-edit-stage="'+side+'"><img class="team-edit-background" src="'+S.esc(data.background)+'" alt="'+label+' creative design" draggable="false">'+data.layers.map(teamLayerHtml).join('')+'</div></div>'+controls+'<div class="team-editor-actions"><button type="button" class="secondary" data-action="team-prev-step">'+I('back')+' Back</button><button type="button" class="primary" data-action="team-next-step">Next '+I('arrow')+'</button></div></section>';
  }
  function teamRoster(){
    return '<section class="team-roster-side team-enquiry-roster"><div class="team-roster-head"><div><span class="eyebrow">TEAM DETAILS</span><h2>Team list</h2><p>Choose each size. Names and numbers are optional.</p></div></div><div class="team-roster-list">'+state.teamRows.map((r,i)=>'<div class="team-roster-row"><input data-team-row="'+i+'" data-team-field="name" value="'+S.esc(r.name)+'" placeholder="Name (optional)" aria-label="Player name (optional)"><input data-team-row="'+i+'" data-team-field="number" value="'+S.esc(r.number)+'" inputmode="numeric" maxlength="6" placeholder="No. (optional)" aria-label="Player number (optional)"><span class="team-size-picker"><select required data-team-row="'+i+'" data-team-field="size" aria-label="Player size">'+teamSizes.map(sz=>'<option '+(r.size===sz?'selected':'')+'>'+sz+'</option>').join('')+'</select>'+I('chevron')+'</span><button type="button" class="team-row-remove" data-team-remove="'+i+'" aria-label="Remove player">'+I('trash')+'</button></div>').join('')+'</div><div class="team-add-row-wrap"><button type="button" class="secondary" data-action="team-add-row">'+I('plus')+' Add row</button></div><div class="team-roster-footer"><span><b>'+state.teamRows.length+'</b> row'+(state.teamRows.length===1?'':'s')+'</span><div><button type="button" class="secondary" data-action="team-prev-step">'+I('back')+' Back</button><button type="button" class="primary team-enquire-button" data-action="team-enquire" '+(state.teamEnquiryBusy?'disabled':'')+'>'+(state.teamEnquiryBusy?'Placing…':'Enquire now')+' '+I('arrow')+'</button></div></div></section>';
  }
  function teamSubmitOverlay(){return state.teamEnquiryBusy?'<div class="team-submit-overlay" role="status" aria-live="polite"><div class="team-submit-loader"><i></i><strong>Placing your team enquiry</strong><span>Uploading the final front/back designs and saving every player detail…</span><small>Please keep this page open.</small></div></div>':'';}
  function teamUpload(){
    let body='';
    if(state.teamStep===1)body='<section class="team-upload-first"><div class="team-upload-intro"><span class="eyebrow">START HERE</span><h1>Upload front & back</h1><p>Choose one image for each side. You can add and position logos in the next steps.</p></div><div class="team-side-upload-grid">'+teamUploadCard('front','Front')+teamUploadCard('back','Back')+'</div><div class="team-upload-actions"><button type="button" class="secondary" data-action="team-prev-step">'+I('back')+' Back</button><button type="button" class="primary team-upload-continue" data-action="team-next-step" '+(!state.teamFront.background||!state.teamBack.background?'disabled':'')+'>Edit front '+I('arrow')+'</button></div></section>';
    else if(state.teamStep===2)body=teamEditor('front');
    else if(state.teamStep===3)body=teamEditor('back');
    else body=teamRoster();
    return '<main class="team-upload-page section-wrap screen screen-enter">'+body+teamStepBar()+teamSubmitOverlay()+teamCropModal()+'</main>';
  }
  async function teamFileDataUrl(file){return new Promise((resolve,reject)=>{if(!file?.type?.startsWith('image/')){reject(new Error('Choose an image file.'));return;}const reader=new FileReader();reader.onerror=()=>reject(new Error('Could not read that image.'));reader.onload=()=>resolve(String(reader.result||''));reader.readAsDataURL(file);});}
  async function compressTeamArtwork(file,max=1000,quality=.7){return new Promise((resolve,reject)=>{if(!file?.type?.startsWith('image/')){reject(new Error('Choose an image file.'));return;}const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{const scale=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',quality));};im.src=String(reader.result);};reader.readAsDataURL(file);});}
  const teamLoadImage=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
  async function teamComposite(side){
    const data=teamSide(side),bg=await teamLoadImage(data.background),max=1000,scale=Math.min(1,max/Math.max(bg.naturalWidth||bg.width,bg.naturalHeight||bg.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round((bg.naturalWidth||bg.width)*scale));c.height=Math.max(1,Math.round((bg.naturalHeight||bg.height)*scale));const ctx=c.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bg,0,0,c.width,c.height);
    try{if(document.fonts?.load)await document.fonts.load('900 48px \"Barlow Condensed\"');}catch(_){}
    for(const layer of data.layers){const x=teamClamp(layer.x,0,100)/100*c.width,y=teamClamp(layer.y,0,100)/100*c.height;if(layer.type==='image'){try{const im=await teamLoadImage(layer.src),w=teamClamp(layer.widthPct,5,100)/100*c.width,h=w*((im.naturalHeight||im.height)/Math.max(1,im.naturalWidth||im.width));ctx.drawImage(im,x-w/2,y-h/2,w,h);}catch(_){}}else{const fs=teamClamp(layer.sizePct,3,30)/100*c.width;ctx.save();ctx.font='900 '+fs+'px \"Barlow Condensed\", \"Arial Narrow\", Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=Math.max(.75,fs*.018);ctx.strokeStyle='rgba(0,0,0,.98)';ctx.strokeText(layer.text,x,y);ctx.fillStyle='#ffffff';ctx.fillText(layer.text,x,y);ctx.restore();}}
    return c.toDataURL('image/webp',.76);
  }
  function teamCleanLayers(side){return teamSide(side).layers.map(l=>l.type==='image'?{id:l.id,type:'image',assetName:l.assetName||l.originalName||'logo',originalName:l.originalName||l.assetName||'logo',originalType:l.originalType||'',originalSize:Number(l.originalSize||0),x:teamClamp(l.x,0,100),y:teamClamp(l.y,0,100),widthPct:teamClamp(l.widthPct,5,100),imageDataUrl:l.src,originalDataUrl:l.originalDataUrl||l.src}:{id:l.id,type:'fixedText',text:l.text,x:teamClamp(l.x,0,100),y:teamClamp(l.y,0,100),sizePct:teamClamp(l.sizePct,3,30)});}
  async function submitTeamEnquiry(){
    const rows=state.teamRows.map(r=>({name:String(r.name||'').trim(),number:String(r.number||'').trim(),size:String(r.size||'').trim()}));
    if(!state.teamFront.background||!state.teamBack.background){showToast('Upload both front and back designs first');return;}
    if(!rows.length||rows.some(r=>!r.size)){showToast('Choose a size for each row');return;}
    state.teamEnquiryBusy=true;render();
    try{
      const [frontComposite,backComposite]=await Promise.all([teamComposite('front'),teamComposite('back')]);
      const design={title:'Creative team design enquiry',rowCount:rows.length,roster:rows,design:{front:{fileName:state.teamFront.fileName||'front-design',backgroundDataUrl:state.teamFront.background,compositeDataUrl:frontComposite,layers:teamCleanLayers('front')},back:{fileName:state.teamBack.fileName||'back-design',backgroundDataUrl:state.teamBack.background,compositeDataUrl:backComposite,layers:teamCleanLayers('back')}},submittedAt:new Date().toISOString()};
      const customer=state.customer||B?.customerSession?.()||{};
      const order=await B.placeOrder({directOrder:true,customerName:customer.name||'',business:customer.businessName||'',delivery:'Team enquiry',payment:'Quote pending',items:[{itemType:'team_design',name:'Team creative design',code:'TEAM',qty:rows.length,price:0,design}]});
      state.orderReference=order?.orderCode||order?.id||'';
      await refreshCustomerAccount(false);
      resetTeamBuilder();
      state.screen='orders';
      history.replaceState(null,'','#orders');
      render();
      showToast('Team enquiry placed successfully');
    }catch(err){state.teamEnquiryBusy=false;render();showToast(err.message||'Could not place team enquiry');}
  }
  function authModal(){
    if(!state.authModal)return'';let body='',title='';
    if(state.authStep==='phone'){
      const enquiryAccount=state.pendingAction==='custom-catalog-enquiry'||state.pendingAction==='team-enquiry';
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
  async function continuePendingAction(){const a=state.pendingAction;state.pendingAction='';if(a==='add-product')await addSelectedProductToCart();else if(a==='team-enquiry')await submitTeamEnquiry();else if(a==='custom-add'&&state.pendingCustomItem){const item=state.pendingCustomItem;state.pendingCustomItem=null;item.itemType='custom_design';const added=await addCart(item,true);if(added)clearDesignerAfterCart();}else if(a==='custom-buy-now'&&state.pendingCustomItem){const item=state.pendingCustomItem;state.pendingCustomItem=null;item.itemType='custom_design';startDirectCheckout(item);} else if(a==='jersey-add-cart')await addJerseyOrderToCart(state.customItemId,false);else if(a==='jersey-buy-now')await addJerseyOrderToCart(state.customItemId,true);else if(a==='printable-add-cart')await addPrintableOrderToCart(state.customItemId,false);else if(a==='printable-buy-now')await addPrintableOrderToCart(state.customItemId,true);else if(a==='uniform-add-cart')await addUniformOrderToCart(state.customItemId,false);else if(a==='uniform-buy-now')await addUniformOrderToCart(state.customItemId,true);else if(a==='checkout'){clearDirectCheckout();state.redeemInput='';state.redeemApplied=null;state.redeemError='';state.checkoutStep=1;state.orderPlaced=false;go('checkout');}else if(a==='profile-login'){go(state.screen==='profileDetails'?'profileDetails':'profile');}else if(a==='custom-catalog-enquiry'){await submitCustomCatalogEnquiry(state.customItemId);}else render();}
  function legal(){const lines=legalCopy[state.legal]||legalCopy.About;return '<div class="overlay"><div class="legal-panel"><div class="legal-head-actions"><button class="legal-back" data-action="close-legal">'+I('back')+'<span>Back</span></button><button class="close" data-action="close-legal">'+I('close')+'</button></div><span class="eyebrow">STORE INFORMATION</span><h2>'+S.esc(state.legal)+'</h2>'+lines.map(x=>'<p>'+S.esc(x)+'</p>').join('')+'</div></div>';}
  function imageZoomModal(){if(!state.zoomImage)return'';const many=(state.zoomImages||[]).length>1,count=(state.zoomImages||[]).length||1;return '<div class="image-zoom-overlay" data-zoom-overlay><div class="image-zoom-shell" role="dialog" aria-modal="true" aria-label="Product image viewer"><button type="button" class="zoom-close" data-action="close-zoom" aria-label="Close image">'+I('close')+'</button>'+(many?'<button type="button" class="zoom-nav zoom-prev" data-action="zoom-prev" aria-label="Previous image">'+I('back')+'</button><button type="button" class="zoom-nav zoom-next" data-action="zoom-next" aria-label="Next image">'+I('arrow')+'</button>':'')+'<div class="zoom-image-stage" data-zoom-stage><img data-zoom-view src="'+S.esc(state.zoomImage)+'" alt="'+S.esc(state.zoomAlt||'Product image')+'" style="transform:translate3d('+state.zoomX+'px,'+state.zoomY+'px,0) scale('+state.zoomScale+')"></div><div class="zoom-controls"><button type="button" data-action="zoom-out" aria-label="Zoom out">'+I('minus')+'</button><span data-zoom-label>'+Math.round(state.zoomScale*100)+'%</span><span class="zoom-count">'+(state.zoomIndex+1)+' / '+count+'</span><button type="button" data-action="zoom-in" aria-label="Zoom in">'+I('plus')+'</button></div></div></div>'; }
  function paymentModal(){return '<div class="overlay"><div class="payment-modal"><button class="close" data-action="close-payment">'+I('close')+'</button><div class="demo-tag">ORDER CONFIRMATION</div>'+I('card')+'<h2>'+S.money(subtotal())+'</h2><p>Online payment gateway can be connected after the client supplies the selected payment provider credentials.</p><button class="primary wide" data-action="complete-order">Confirm order</button><button class="text-button" data-action="close-payment">Cancel</button></div></div>';}
  function toast(){return state.toast?'<div class="toast">'+I('check')+S.esc(state.toast)+(state.toast==='Added to your cart'?'<button data-go="cart">View cart</button>':'')+'</div>':'';}
  function whatsappFloat(){if(state.screen==='customize')return'';return '<button class="whatsapp-float whatsapp-icon-only contact-float" data-whatsapp-float aria-label="Contact enquiry"><img src="assets/contact-support.webp" alt="Contact"></button>';}
  function page(){if(['catalog','categories','product'].includes(state.screen))return customCatalog();return({home,search:unifiedCatalogueSearch,readyMade,categories:categoriesPage,catalog,product,customCatalog,customCategory,customItem,cart,checkout,orders,profile,profileDetails,addresses:addressesPage,teamUpload})[state.screen]?.()||home();}

  function render(){
    state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=(S.getCustomCatalogCategories?.()||state.customCatalogCategories||[]).map(c=>['uniform','kids uniform'].includes(String(c.name||'').trim().toLowerCase())?{...c,name:'Uniform'}:c);state.customCatalogItems=S.getCustomCatalogItems?.()||state.customCatalogItems||[];state.customCatalogFabrics=S.getCustomCatalogFabrics?.()||state.customCatalogFabrics||[];state.customSportswearFabrics=S.getCustomSportswearFabrics?.()||state.customSportswearFabrics||[];state.customSportswearTypes=S.getCustomSportswearTypes?.()||state.customSportswearTypes||[];state.customPrintTypes=S.getCustomPrintTypes?.()||state.customPrintTypes||[];state.settings=S.getSettings();const sess=B?.customerSession?.();if(sess?.token)state.customer={...(state.customer||{}),...sess};
    if(state.screen==='customize'){root.innerHTML='<div class="view-root customizer-only-root"><div class="customizer-screen-wrap"><div id="designer-root"></div>'+footer()+'</div>'+authModal()+toast()+'</div>';window.OneLineDesigner.mount(document.getElementById('designer-root'),{onBack:()=>navigateBack('home'),onAdd:async item=>{item.itemType='custom_design';if(!(B?.customerSession?.()?.token)){state.pendingCustomItem=item;state.pendingAction='custom-add';state.authModal=true;state.authStep='phone';state.authError='';render();return false;}const added=await addCart(item,true);if(added)clearDesignerAfterCart();return added;},onBuy:async item=>{item.itemType='custom_design';if(!(B?.customerSession?.()?.token)){state.pendingCustomItem=item;state.pendingAction='custom-buy-now';state.authModal=true;state.authStep='phone';state.authError='';render();return false;}startDirectCheckout(item);return true;}});syncModalScrollLock();bind();return;}
    if(state.screen==='teamUpload'){root.innerHTML='<div class="view-root team-only-root">'+page()+authModal()+toast()+'</div>';syncModalScrollLock();bind();return;}
    const audience='retail';
    root.innerHTML='<div class="view-root has-site-header">'+header()+inlineHeaderSearch()+page()+footer()+bottom()+filterModal(audience)+(state.legal?legal():'')+(state.paymentDemo?paymentModal():'')+authModal()+imageZoomModal()+printInfoModal()+toast()+whatsappFloat()+'</div>';syncModalScrollLock();bind();bindZoomViewer();positionWhatsapp();
  }
  function orderImageSource(src){
    const value=String(src||'').trim();if(!value)return'';
    try{return new URL(value,location.href).href;}catch(_){return value;}
  }
  async function loadOrderImage(src){
    const value=orderImageSource(src);if(!value)throw new Error('Image source is missing.');
    return await new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not load an order image.'));im.src=value;});
  }
  function customOrderColour(design){return S.palette?.[design?.garmentColor]||design?.garmentColor||'#192a45';}
  function customOrderZone(side){return side==='back'?{cx:.5,cy:.47,w:.33,h:.45}:{cx:.5,cy:.47,w:.31,h:.43};}
  async function renderCustomOrderSide(design,side){
    const garment=side==='back'?(design?.garmentBackImage||design?.garmentImage):design?.garmentImage;if(!garment)return'';
    const im=await loadOrderImage(garment),size=1000,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const ratio=Math.min(size/im.naturalWidth,size/im.naturalHeight),dw=im.naturalWidth*ratio,dh=im.naturalHeight*ratio,dx=(size-dw)/2,dy=(size-dh)/2;
    ctx.save();ctx.filter='grayscale(1)';ctx.drawImage(im,dx,dy,dw,dh);ctx.restore();
    const tint=document.createElement('canvas');tint.width=size;tint.height=size;const tx=tint.getContext('2d',{alpha:true});tx.drawImage(im,dx,dy,dw,dh);tx.globalCompositeOperation='source-in';tx.fillStyle=customOrderColour(design);tx.fillRect(0,0,size,size);tx.globalCompositeOperation='source-over';ctx.save();ctx.globalAlpha=.88;ctx.globalCompositeOperation='multiply';ctx.drawImage(tint,0,0);ctx.restore();
    const surface=S.surfaceDesign?.(design,side)||{},layers=Array.isArray(surface.layers)?surface.layers:[],zone=customOrderZone(side),zw=size*zone.w,zh=size*zone.h,zx=size*zone.cx-zw/2,zy=size*zone.cy-zh/2;
    for(const layer of layers){const pos=layer?.position||{x:50,y:50},x=zx+zw*(Number(pos.x||0)/100),y=zy+zh*(Number(pos.y||0)/100),rotation=Number(layer?.rotation||0)*Math.PI/180,displayPct=Number(layer?.displaySizePct||0),pricedPct=Number(layer?.pricingWidthPct||0);ctx.save();ctx.translate(x,y);ctx.rotate(rotation);if(layer?.type==='image'&&layer.src){try{const art=await loadOrderImage(layer.src),width=displayPct>0?size*displayPct/100:pricedPct>0?size*pricedPct/100:zw*Math.max(.01,Number(layer.scale||38))/100,height=width*(art.naturalHeight/Math.max(1,art.naturalWidth));ctx.drawImage(art,-width/2,-height/2,width,height);}catch(_){}}else if(layer?.type==='text'){let fontSize=displayPct>0?size*displayPct/100:Math.max(6,zw*Math.max(.01,Number(layer.scale||18))/100);ctx.fillStyle=layer.color||'#ffffff';ctx.font='900 '+fontSize+'px '+JSON.stringify(layer.font||'Impact');if(!(displayPct>0)&&pricedPct>0){const measured=Math.max(1,ctx.measureText(String(layer.value||'')).width),target=size*pricedPct/100;fontSize=Math.max(6,fontSize*(target/measured));ctx.font='900 '+fontSize+'px '+JSON.stringify(layer.font||'Impact');}ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(layer.value||''),0,0);}ctx.restore();}
    return canvas.toDataURL('image/webp',.92);
  }
  async function prepareCustomOrderDesign(raw){
    const design=clone(raw||{});
    const [front,back]=await Promise.all([renderCustomOrderSide(design,'front'),renderCustomOrderSide(design,'back')]);
    if(front)design.frontCompositeDataUrl=front;if(back)design.backCompositeDataUrl=back;return design;
  }
  async function completeOrder(){
    if(state.orderSubmitting||!checkoutItems().length)return;
    flushAllCartQuantitySync();
    const directOrder=!!state.directOrderItem,orderCart=clone(checkoutItems());
    if(orderCart.some(needsReaddForPrinting)){showToast('Printing rates have changed. Remove and re-add affected items from the catalogue.');return;}
    state.orderSubmitting=true;state.authBusy=true;state.payment='Cash on delivery';render();
    try{
      const prepared=[];for(const item of orderCart){if(item.itemType==='custom_design')prepared.push({...item,preparedDesign:await prepareCustomOrderDesign(item.design||item.customDesign||{})});else prepared.push(item);}
      const payload={directOrder,redeemCode:state.redeemApplied?.code||'',deliveryAddressId:state.selectedAddressId||'',remarks:state.remarks||'',customerName:state.customer?.name||state.details.name||'',recipientName:activeDeliveryAddress()?.recipient_name||'',phone:state.customer?.phone||state.details.phone||'',address:state.details.address||'',business:state.details.business||'',delivery:state.delivery,payment:'Cash on delivery',items:prepared.map(item=>item.itemType==='custom_design'?{itemType:item.itemType,key:item.key||'',name:item.name,code:item.code||'CUSTOM',qty:item.qty||1,unitPrice:Number(item.price||0),design:item.preparedDesign||item.design||item.customDesign||{}}:item.itemType==='jersey_order'?{itemType:'jersey_order',key:item.key||'',name:item.name,code:item.code||'JERSEY',qty:item.qty||1,unitPrice:Number(item.price||0),design:item.design||{}}:item.itemType==='printable_order'?{itemType:'printable_order',key:item.key||'',name:item.name,code:item.code||'PRINT',qty:item.qty||1,unitPrice:Number(item.price||0),design:item.design||{}}:item.itemType==='uniform_order'?{itemType:'uniform_order',key:item.key||'',name:item.name,code:item.code||'UNIFORM',qty:item.qty||1,unitPrice:Number(item.price||0),design:item.design||item.uniformOrder||{}}:{itemType:'product',productId:item.productId,name:item.name,code:item.code||'',lines:item.bulkLines||[]})};
      await cartMutationQueue;
      if(!directOrder&&cartSyncError)throw new Error('Cart is not fully synced yet. '+cartSyncError);
      B?.customerEvent?.('order_submit_attempt',{delivery:state.delivery,payment:state.payment,items:orderCart.map(i=>({name:i.name,code:i.code||'',itemType:i.itemType||'product',qty:i.qty||1}))});
      const r=await B.placeOrder(payload);
      state.orderReference=r.orderCode||r.id||'ORDER';state.remarks='';clearDraft('checkout-remarks');state.redeemInput='';state.redeemApplied=null;state.redeemError='';clearDraft('checkout-business');state.orderPlaced=false;state.paymentDemo=false;clearDirectCheckout();
      if(!directOrder){state.cart=[];state.cartVersion=Number(state.cartVersion||0)+1;}broadcastAccountSync('order');
      await B.hydrate({force:true});await refreshCustomerAccount(false);
      state.orderSubmitting=false;state.authBusy=false;state.checkoutStep=1;
      go('orders');
    }catch(e){
      state.orderSubmitting=false;state.authBusy=false;showToast(e.message||'Could not place order');if(/stock|unavailable|size|option/i.test(String(e.message||'')))B?.hydrate?.({force:true}).catch(()=>{});
    }
  }
  function cleanWhatsAppNumber(value){let n=String(value||'').replace(/[^0-9]/g,'');if(n.length===10)n='91'+n;return n;}
  function whatsAppUrlTo(number,message){const n=cleanWhatsAppNumber(number)||WHATSAPP_NUMBER,text=encodeURIComponent(message||'Hi, I need a customization quotation.');return 'https://wa.me/'+n+'?text='+text;}
  function whatsAppUrl(message){return whatsAppUrlTo(WHATSAPP_NUMBER,message);}
  function openWhatsApp(message){window.open(whatsAppUrl(message),'_blank','noopener');}
  function openWhatsAppTo(number,message){window.open(whatsAppUrlTo(number,message),'_blank','noopener');}
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
    let mouseDrag=null,suppressClick=false;
    track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;mouseDrag={x:e.clientX,y:e.clientY,scroll:track.scrollLeft,moved:false};});
    track.addEventListener('pointermove',e=>{if(!mouseDrag)return;const dx=e.clientX-mouseDrag.x,dy=e.clientY-mouseDrag.y;if(!mouseDrag.moved&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)){mouseDrag.moved=true;track.classList.add('gallery-mouse-dragging');track.setPointerCapture(e.pointerId);}if(mouseDrag.moved){e.preventDefault();track.scrollLeft=mouseDrag.scroll-dx;sync();}});
    const finishMouseDrag=()=>{if(!mouseDrag)return;const moved=mouseDrag.moved;mouseDrag=null;track.classList.remove('gallery-mouse-dragging');if(moved){suppressClick=true;const slide=Math.round(track.scrollLeft/(track.clientWidth||1));track.scrollTo({left:slide*(track.clientWidth||1),behavior:'smooth'});setTimeout(()=>{suppressClick=false;},120);}};
    track.addEventListener('pointerup',finishMouseDrag);track.addEventListener('pointercancel',finishMouseDrag);
    track.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
    if(onActivate)track.addEventListener('click',e=>{e.stopPropagation();onActivate(e);});
    sync();
  }

  function openCustomCatalogueItem(itemId){
    const idea=state.customCatalogItems.find(x=>String(x.id)===String(itemId));
    if(!idea)return;
    // A result opens details directly, but Back should show that item's own category cards.
    if(state.screen==='search'&&idea.category_id){
      rememberScroll();
      state.customCategoryId=String(idea.category_id);
      state.catalogueSearchQueries[catalogueSection(idea)]='';
      try{history.pushState({...routeState('customCategory',0),fromScreen:'search'},'',routeUrl('customCategory'));}catch(_){}
      state.screen='customCategory';
      window.scrollTo(0,0);
    }
    state.customItemId=String(itemId);
    state.customFabricId='';state.customQuality='';state.customSportswearTypeId='';state.sportswearSizeQty={};
    state.printableIncludePrint=false;state.printablePrintQty={};state.printableSelectedPrintIds=[];state.printableActivePrintId='';state.printableActivePrintSize='';
    state.uniformTopId='';state.uniformBottomId='';state.uniformOptionIds=[];state.uniformSizeQty={};state.uniformGalleryVariantId='';
    if(idea.category_id)state.customCategoryId=String(idea.category_id);
    go('customItem');
  }
  function bindProductSliders(){
    root.querySelectorAll('[data-card-slider]').forEach(slider=>{
      const track=slider.querySelector('.product-slide-track'),card=slider.closest('[data-open-product],[data-open-custom-item]'),bars=card?.querySelectorAll('.product-slide-progress i');if(!track||!card)return;
      const sync=()=>{const w=track.clientWidth||1,idx=Math.max(0,Math.min((bars?.length||1)-1,Math.round(track.scrollLeft/w)));bars?.forEach((b,i)=>b.classList.toggle('active',i===idx));const progress=card.querySelector('.product-slide-progress');if(progress){progress.style.setProperty('--gallery-index',idx);progress.style.setProperty('--gallery-count',bars?.length||1);}};
      bindHorizontalSlider(track,sync,()=>{if(card.dataset.openCustomItem){openCustomCatalogueItem(card.dataset.openCustomItem);}else openProduct(card.dataset.openProduct,card.dataset.audience);});
    });
  }
  function bindDetailSliders(){
    root.querySelectorAll('[data-detail-slider]').forEach(slider=>{
      const track=slider.querySelector('.detail-slide-track'),bars=slider.querySelectorAll('.detail-slide-progress i');if(!track)return;
      const sync=()=>{const w=track.clientWidth||1,idx=Math.max(0,Math.min((bars?.length||1)-1,Math.round(track.scrollLeft/w)));bars?.forEach((b,i)=>b.classList.toggle('active',i===idx));const progress=slider.querySelector('.detail-slide-progress');if(progress){progress.style.setProperty('--gallery-index',idx);progress.style.setProperty('--gallery-count',bars?.length||1);}};
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
  function bindUniformActionDock(){
    if(uniformActionDockHandler){
      window.removeEventListener('scroll',uniformActionDockHandler);
      window.removeEventListener('resize',uniformActionDockHandler);
      uniformActionDockHandler=null;
    }
    const anchor=root.querySelector('[data-uniform-actions-anchor]'),actions=root.querySelector('[data-uniform-order-actions]');
    if(!anchor||!actions)return;
    let raf=0;
    const sync=()=>{
      raf=0;
      const mobile=window.matchMedia('(max-width: 820px)').matches;
      if(!mobile){
        actions.classList.add('docked');
        anchor.style.removeProperty('height');
        return;
      }
      const h=Math.ceil(actions.getBoundingClientRect().height||52);
      anchor.style.height=h+'px';
      const fixedBottom=10;
      const fixedTop=Math.round(window.innerHeight-fixedBottom-h);
      const anchorTop=anchor.getBoundingClientRect().top;
      const shouldDock=anchorTop<=fixedTop+1;
      if(shouldDock!==actions.classList.contains('docked'))actions.classList.toggle('docked',shouldDock);
    };
    uniformActionDockHandler=()=>{if(!raf)raf=requestAnimationFrame(sync);};
    window.addEventListener('scroll',uniformActionDockHandler,{passive:true});
    window.addEventListener('resize',uniformActionDockHandler);
    requestAnimationFrame(sync);
  }
  function bind(){
    root.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',()=>go(x.dataset.go)));
    // Keep the current screen visible when opening the header search.
    root.querySelector('[data-action="toggle-header-search"]')?.addEventListener('click',()=>{
      state.headerSearchOpen=!state.headerSearchOpen;
      const scroll=window.scrollY;render();window.scrollTo(0,scroll);
      if(state.headerSearchOpen)requestAnimationFrame(()=>root.querySelector('[data-inline-header-search]')?.focus({preventScroll:true}));
    });
    root.querySelector('[data-action="close-header-search"]')?.addEventListener('click',()=>{
      state.headerSearchOpen=false;const scroll=window.scrollY;render();window.scrollTo(0,scroll);
    });
    const inlineInput=root.querySelector('[data-inline-header-search]');
    if(inlineInput)inlineInput.addEventListener('input',e=>{
      state.headerSearchQuery=e.target.value;
      const matches=root.querySelector('[data-inline-search-matches]');
      if(matches)matches.innerHTML=headerSearchMatchesHtml(); // Does not re-render or reload the page.
    });
    root.querySelector('[data-inline-search-matches]')?.addEventListener('click',e=>{
      const item=e.target.closest('[data-header-search-item]');
      if(item)openHeaderSearchItem(item.dataset.headerSearchItem);
    });

    root.querySelectorAll('[data-click-go]').forEach(x=>{const open=()=>go(x.dataset.clickGo);x.addEventListener('click',open);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
    root.querySelectorAll('[data-open-product]').forEach(x=>x.addEventListener('click',e=>{if(e.target.closest('.product-slide-track'))return;e.stopPropagation();openProduct(x.dataset.openProduct,x.dataset.audience);}));
    root.querySelectorAll('[data-category]').forEach(x=>{x.addEventListener('click',e=>{if(e.target.closest('[data-share-kind]'))return;resetFilters(x.dataset.category);go('catalog');});x.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-share-kind]')){e.preventDefault();resetFilters(x.dataset.category);go('catalog');}});});
    
    root.querySelectorAll('[data-catalogue-more]').forEach(btn=>btn.addEventListener('click',()=>{const key=catalogueGridKey();state.catalogueShown[key]=Math.min(30000,(state.catalogueShown[key]||CARD_BATCH_SIZE)+CARD_BATCH_SIZE);render();}));
    root.querySelectorAll('[data-open-custom-category]').forEach(x=>{const open=e=>{if(e?.target?.closest?.('[data-share-kind]'))return;state.customCategoryId=x.dataset.openCustomCategory;go('customCategory');};x.addEventListener('click',open);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(e);}});});
    root.querySelectorAll('[data-open-custom-item]').forEach(card=>{
      const open=e=>{if(e?.target?.closest?.('.product-slide-track,[data-share-kind]'))return;openCustomCatalogueItem(card.dataset.openCustomItem);};
      card.addEventListener('click',open);
      card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-share-kind]')){e.preventDefault();openCustomCatalogueItem(card.dataset.openCustomItem);}});
    });
    root.querySelectorAll('[data-legal]').forEach(x=>x.addEventListener('click',()=>{if(x.closest('.site-header nav')&&state.menu)clearMenuModalState();openLegal(x.dataset.legal);}));
    const customCatalogueSearch=root.querySelector('[data-custom-catalogue-search]');
    if(customCatalogueSearch)customCatalogueSearch.addEventListener('input',e=>{
      const section=e.target.dataset.customCatalogueSearch==='ready'?'ready':'custom';
      state.catalogueSearchQueries[section]=e.target.value;
      if(Object.keys(state.catalogueShown).length>80)state.catalogueShown={};
      const pos=e.target.selectionStart;
      render();
      const input=root.querySelector('[data-custom-catalogue-search="'+section+'"]');
      if(input){input.focus({preventScroll:true});try{input.setSelectionRange(pos,pos);}catch(_){}}
    });
    const unifiedSearchInput=root.querySelector('[data-unified-catalogue-search]');
    if(unifiedSearchInput)unifiedSearchInput.addEventListener('input',e=>{
      state.headerSearchQuery=e.target.value;
      const pos=e.target.selectionStart;
      render();
      const input=root.querySelector('[data-unified-catalogue-search]');
      if(input){input.focus({preventScroll:true});try{input.setSelectionRange(pos,pos);}catch(_){}}
    });
    const catalogSearch=root.querySelector('[data-catalog-search]');if(catalogSearch)catalogSearch.addEventListener('input',e=>{state.catalogQuery=e.target.value;render();requestAnimationFrame(()=>{const n=root.querySelector('[data-catalog-search]');if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length);}catch(_){}}});});
    root.querySelectorAll('[data-custom-sportswear-type]').forEach(x=>x.addEventListener('click',()=>{const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));const printable=item&&isPrintableCustomItem(item);const next=String(x.dataset.customSportswearType);if(printable||isFullSublimationItem(item)){state.customSportswearTypeId=String(state.customSportswearTypeId)===next?'':next;state.customFabricId='';state.customQuality='';state.printableSelectedPrintIds=[];state.printableActivePrintId='';state.printablePrintQty={};state.sportswearSizeQty={};}else state.customSportswearTypeId=next;state.enquirySuccessId='';render();}));
    root.querySelectorAll('[data-custom-fabric]').forEach(x=>x.addEventListener('click',()=>{const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));const next=String(x.dataset.customFabric);const same=String(state.customFabricId)===next;if(same){state.customFabricId='';state.customQuality='';state.sportswearSizeQty={};state.printableSelectedPrintIds=[];state.printablePrintQty={};}else{if(item&&(isPrintableCustomItem(item)||isSportswearCustomItem(item)||isCorporateTeeItem(item))){state.customQuality='';state.printableSelectedPrintIds=[];state.printableActivePrintId='';state.printablePrintQty={};state.sportswearSizeQty={};}state.customFabricId=next;}state.enquirySuccessId='';render();}));
    root.querySelectorAll('[data-custom-quality]').forEach(x=>x.addEventListener('click',()=>{state.customQuality=state.customQuality===x.dataset.customQuality?'':x.dataset.customQuality;state.sportswearSizeQty={};state.printableSelectedPrintIds=[];state.printablePrintQty={};state.enquirySuccessId='';render();}));
    root.querySelectorAll('[data-print-info]').forEach(button=>button.addEventListener('click',()=>{state.printInfoId=button.dataset.printInfo;try{history.pushState({...history.state,oneLineModal:'print-info',printInfoId:state.printInfoId},'',location.href);}catch(_){}render();}));
    root.querySelectorAll('[data-close-print-info]').forEach(button=>button.addEventListener('click',e=>{if(e.target!==button&&button.classList.contains('print-info-backdrop'))return;if(history.state?.oneLineModal==='print-info')history.back();else {state.printInfoId='';render();}}));
    bindUniformOptionButtons();
    bindUniformActionDock();
    bindUniformQuantityControls();bindJerseyQtyControls();bindPrintableQtyControls();
    root.querySelectorAll('[data-product-color]').forEach(x=>x.addEventListener('click',()=>{state.color=x.dataset.productColor;state.previewImage='';state.bulkQty={};render();}));
    root.querySelectorAll('[data-product-image]').forEach(x=>x.addEventListener('click',()=>{if(state.selected)state.previewImage=x.dataset.productImage;render();}));
    root.querySelectorAll('[data-bulk-key]').forEach(x=>x.addEventListener('change',()=>{state.bulkQty[x.dataset.bulkKey]=Math.max(0,Number(x.value||0));render();}));
    const cartPage=root.querySelector('.cart-page');
    if(cartPage)cartPage.addEventListener('click',e=>{
      const adjust=e.target.closest('[data-cart-adjust]');
      if(adjust&&!adjust.disabled){adjustCartQuantity(adjust.dataset.key,Number(adjust.dataset.cartAdjust),adjust.dataset.option||'',adjust.dataset.size||'');return;}
      const remove=e.target.closest('[data-remove-key]');if(!remove)return;
      flushAllCartQuantitySync();const item=state.cart.find(i=>i.key===remove.dataset.removeKey);
      state.cart=state.cart.filter(i=>i.key!==remove.dataset.removeKey);queueCartMutation('remove',remove.dataset.removeKey,null);
      B?.customerEvent?.('cart_remove',{item:{name:item?.name||'',code:item?.code||''}});render();
    });
    root.querySelectorAll('[data-delivery]').forEach(x=>x.addEventListener('click',()=>{state.delivery=x.dataset.delivery;render();}));
    root.querySelectorAll('[data-payment]').forEach(x=>x.addEventListener('click',()=>{state.payment=x.dataset.payment;render();}));
    root.querySelectorAll('[data-remove-filter]').forEach(x=>x.addEventListener('click',()=>removeFilter(x.dataset.removeFilter,x.dataset.value)));
    root.querySelectorAll('[data-share-kind]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();shareItem(x.dataset.shareKind,x.dataset.shareValue||'',x.dataset.shareLabel||'',x.dataset.shareExtra||'');}));

    
    root.querySelectorAll('[data-zoom-image]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openZoom(x.dataset.zoomImage,x.dataset.zoomAlt||'');}));
    root.querySelectorAll('[data-team-row]').forEach(x=>x.addEventListener('input',()=>{const i=Number(x.dataset.teamRow);if(state.teamRows[i])state.teamRows[i][x.dataset.teamField]=x.value;}));
    root.querySelectorAll('select[data-team-row]').forEach(x=>x.addEventListener('change',()=>{const i=Number(x.dataset.teamRow);if(state.teamRows[i])state.teamRows[i][x.dataset.teamField]=x.value;}));
    root.querySelectorAll('[data-team-remove]').forEach(x=>x.addEventListener('click',()=>{if(state.teamRows.length===1)state.teamRows=[{name:'',number:'',size:'M'}];else state.teamRows.splice(Number(x.dataset.teamRemove),1);render();}));
    root.querySelectorAll('[data-team-jump]').forEach(x=>x.addEventListener('click',()=>{const target=Number(x.dataset.teamJump||0);if(target>=1&&target<=state.teamUnlockedStep&&target!==state.teamStep){state.teamActiveLayer='';state.teamStep=target;window.scrollTo({top:0,behavior:'smooth'});render();}}));
    root.querySelectorAll('[data-team-side-upload]').forEach(input=>input.addEventListener('change',async()=>{const file=input.files?.[0],side=input.dataset.teamSideUpload;if(!file)return;try{await startTeamCrop(file,side);}catch(err){showToast(err.message||'Could not read that image');}}));
    bindTeamCrop();
    const teamCropOverlay=root.querySelector('[data-team-crop-overlay]');if(teamCropOverlay)teamCropOverlay.addEventListener('click',e=>{if(e.target===teamCropOverlay)closeTeamCrop();});

    root.querySelectorAll('[data-team-logo-upload]').forEach(input=>input.addEventListener('change',async()=>{const side=input.dataset.teamLogoUpload,files=[...(input.files||[])].filter(f=>f.type.startsWith('image/'));if(!files.length)return;try{const data=teamSide(side);for(const file of files){const [src,originalDataUrl]=await Promise.all([compressTeamArtwork(file,600,.7),teamFileDataUrl(file)]);data.layers.push({id:teamUid('logo'),type:'image',src,assetName:file.name,originalName:file.name,originalType:file.type||'',originalSize:Number(file.size||0),originalDataUrl,x:50,y:50,widthPct:24});}state.teamActiveLayer=data.layers[data.layers.length-1]?.id||'';render();}catch(err){showToast(err.message||'Could not add logo');}}));
    root.querySelectorAll('[data-team-remove-layer]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();for(const side of ['front','back']){const data=teamSide(side),i=data.layers.findIndex(l=>l.id===btn.dataset.teamRemoveLayer);if(i>=0){data.layers.splice(i,1);break;}}if(state.teamActiveLayer===btn.dataset.teamRemoveLayer)state.teamActiveLayer='';render();}));
    root.querySelectorAll('[data-team-resize-layer]').forEach(handle=>{let resize=null;handle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const id=handle.dataset.teamResizeLayer,el=handle.closest('[data-team-layer-id]'),stage=el?.closest('[data-team-edit-stage]'),side=stage?.dataset.teamEditStage,layer=teamSide(side).layers.find(l=>l.id===id),rect=stage?.getBoundingClientRect();if(!layer||!rect)return;state.teamActiveLayer=id;resize={id:e.pointerId,layer,rect,startX:e.clientX,startY:e.clientY,startSize:layer.type==='image'?teamClamp(layer.widthPct,5,100):teamClamp(layer.sizePct,3,30)};try{handle.setPointerCapture(e.pointerId);}catch(_){}});handle.addEventListener('pointermove',e=>{if(!resize||resize.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const dx=e.clientX-resize.startX,dy=e.clientY-resize.startY,delta=((dx/Math.max(1,resize.rect.width))+(dy/Math.max(1,resize.rect.height)))*50,newSize=resize.startSize+delta;if(resize.layer.type==='image'){resize.layer.widthPct=teamClamp(newSize,5,100);const el=root.querySelector('[data-team-layer-id="'+CSS.escape(resize.layer.id)+'"]');if(el)el.style.width=resize.layer.widthPct+'%';}else{resize.layer.sizePct=teamClamp(newSize,3,30);const el=root.querySelector('[data-team-layer-id="'+CSS.escape(resize.layer.id)+'"]');if(el)el.style.fontSize=resize.layer.sizePct+'cqw';}});const end=e=>{if(!resize||resize.id!==e.pointerId)return;resize=null;render();};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);});
    root.querySelectorAll('[data-team-layer-id]').forEach(el=>{let drag=null;el.addEventListener('click',e=>{if(e.target.closest('button,[data-team-resize-layer]'))return;e.stopPropagation();if(state.teamActiveLayer!==el.dataset.teamLayerId){state.teamActiveLayer=el.dataset.teamLayerId;render();}});el.addEventListener('pointerdown',e=>{if(e.target.closest('button,[data-team-resize-layer]'))return;const id=el.dataset.teamLayerId;if(state.teamActiveLayer!==id)return;e.preventDefault();const stage=el.closest('[data-team-edit-stage]'),side=stage?.dataset.teamEditStage,layer=teamSide(side).layers.find(l=>l.id===id),rect=stage?.getBoundingClientRect();if(!layer||!rect)return;drag={id:e.pointerId,layer,rect,dx:e.clientX-(rect.left+layer.x/100*rect.width),dy:e.clientY-(rect.top+layer.y/100*rect.height)};try{el.setPointerCapture(e.pointerId);}catch(_){}});el.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();drag.layer.x=teamClamp((e.clientX-drag.dx-drag.rect.left)/drag.rect.width*100,0,100);drag.layer.y=teamClamp((e.clientY-drag.dy-drag.rect.top)/drag.rect.height*100,0,100);el.style.left=drag.layer.x+'%';el.style.top=drag.layer.y+'%';});const end=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;render();};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);});
    root.querySelectorAll('[data-team-edit-stage]').forEach(stage=>stage.addEventListener('click',e=>{if(e.target.closest('[data-team-layer-id]'))return;if(state.teamActiveLayer){state.teamActiveLayer='';render();}}));
    const teamShell=root.querySelector('[data-team-editor-shell]');if(teamShell)teamShell.addEventListener('click',e=>{if(e.target.closest('[data-team-layer-id],button,label,input'))return;if(state.teamActiveLayer){state.teamActiveLayer='';render();}});

    root.querySelectorAll('[data-filter-choice]').forEach(x=>x.addEventListener('click',()=>{const d=state.filterDraft,k=x.dataset.filterChoice,v=x.dataset.value;const arr=d[k];const i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else arr.push(v);if(k==='categories'){const allowedSubs=filterPool().filter(p=>!d.categories.length||d.categories.includes(p.category)).map(p=>p.subcategory);d.subs=d.subs.filter(s=>allowedSubs.includes(s));}render();}));

    const phoneForm=root.querySelector('[data-auth-phone]');if(phoneForm)phoneForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(phoneForm);state.authPhone=String(fd.get('phone')||'').trim();state.authError='';state.authBusy=true;render();try{await B.requestOtp(state.authPhone);state.authStep='otp';state.authOtp='';}catch(err){state.authError=err.message||'Could not send OTP';}finally{state.authBusy=false;render();}});
    const otpForm=root.querySelector('[data-auth-otp]');if(otpForm)otpForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(otpForm);state.authOtp=String(fd.get('otp')||'').trim();state.authError='';state.authBusy=true;render();try{const r=await B.verifyOtp(state.authPhone,state.authOtp,'');state.customer=r.session||B.customerSession();state.accountLoaded=false;state.authName=state.customer?.name||'';if(String(state.customer?.name||'').trim().length>=2){state.authModal=false;await refreshCustomerAccount(false);state.authBusy=false;broadcastAccountSync('login');await continuePendingAction();return;}state.accountLoaded=true;state.authStep='name';}catch(err){state.authError=err.message||'Invalid OTP';}finally{state.authBusy=false;render();}});
    const nameForm=root.querySelector('[data-auth-name]');if(nameForm)nameForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(nameForm);state.authName=String(fd.get('name')||'').trim();if(!state.authName)return;state.authBusy=true;state.authError='';render();try{const saved=await B.updateCustomerProfile({name:state.authName,businessName:state.customer?.businessName||'',jobTitle:state.customer?.jobTitle||''});state.customer={...(B.customerSession()||state.customer||{}),name:saved?.name||state.authName,businessName:saved?.businessName||'',jobTitle:saved?.jobTitle||''};B.setCustomerSession(state.customer);state.accountLoaded=true;state.authModal=false;broadcastAccountSync('profile');await refreshCustomerAccount(false);state.authBusy=false;await continuePendingAction();}catch(err){state.authBusy=false;state.authError=err.message||'Could not save name';render();}});

    root.querySelectorAll('[data-order-card]').forEach(card=>{const open=()=>{state.orderDetailId=card.dataset.orderCard||'';render();};card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
    root.querySelector('[data-checkout-remarks]')?.addEventListener('input',e=>{const words=String(e.target.value).trim().split(/\s+/).filter(Boolean);if(words.length>300){e.target.value=words.slice(0,300).join(' ');}state.remarks=e.target.value;writeDraft('checkout-remarks',{value:state.remarks});});
    const addressForm=root.querySelector('[data-saved-address-form]');
    if(addressForm){addressForm.addEventListener('input',saveAddressDraft);addressForm.addEventListener('change',saveAddressDraft);}
    const redeemInput=root.querySelector('[data-redeem-input]');if(redeemInput)redeemInput.addEventListener('input',()=>{const code=redeemInput.value.toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,32);redeemInput.value=code;if(code!==(state.redeemApplied?.code||''))state.redeemApplied=null;state.redeemInput=code;state.redeemError='';});
    const checkoutBusiness=root.querySelector('[data-checkout-business]');
    if(checkoutBusiness)checkoutBusiness.addEventListener('input',()=>{state.details.business=checkoutBusiness.value;writeDraft('checkout-business',{value:checkoutBusiness.value});});
    const profileDraftForm=root.querySelector('[data-profile-name]');
    if(profileDraftForm)profileDraftForm.addEventListener('input',()=>writeDraft('profile',Object.fromEntries(new FormData(profileDraftForm).entries())));
    if(addressForm)addressForm.addEventListener('submit',async e=>{e.preventDefault();if(!addressForm.reportValidity())return;const data=Object.fromEntries(new FormData(addressForm).entries());data.isDefault=!!addressForm.querySelector('[name=isDefault]')?.checked;const id=state.addressEditor;const save=addressForm.querySelector('[type=submit]');save.disabled=true;try{const r=await B.customerAddress(id?'address_update':'address_create',data,id);state.addresses=r.addresses||[];state.selectedAddressId=state.addresses.find(a=>a.is_default)?.id||state.addresses.at(-1)?.id||'';state.addressEditor=null;clearDraft('address');broadcastAccountSync('address');render();showToast('Address saved');}catch(err){save.disabled=false;showToast(err.message||'Could not save address');}});
    const profileNameForm=root.querySelector('[data-profile-name]');if(profileNameForm)profileNameForm.addEventListener('submit',async e=>{e.preventDefault();if(!profileNameForm.reportValidity())return;const fd=new FormData(profileNameForm),profile={name:String(fd.get('name')||'').trim(),businessName:String(fd.get('businessName')||'').trim(),jobTitle:String(fd.get('jobTitle')||'').trim()};if(profile.name.length<2){showToast('Enter your full name');return;}const save=profileNameForm.querySelector('[type=submit]');save.disabled=true;try{const saved=await B.updateCustomerProfile(profile);state.customer={...(B?.customerSession?.()||state.customer||{}),name:saved?.name??profile.name,businessName:saved?.businessName??profile.businessName,jobTitle:saved?.jobTitle??profile.jobTitle};B?.setCustomerSession?.(state.customer);state.details.name=state.customer.name;state.details.business=state.customer.businessName||'';clearDraft('profile');broadcastAccountSync('profile');go('profile');showToast('Profile saved');}catch(err){save.disabled=false;showToast(err.message||'Could not save profile');}});

    root.querySelectorAll('[data-action]').forEach(x=>x.addEventListener('click',async()=>{
      const a=x.dataset.action,fromDrawer=!!x.closest('.site-header nav');
      if(fromDrawer&&state.menu&&a!=='close-menu'&&a!=='menu')clearMenuModalState();
      if(a==='apply-redeem'){if(state.redeemBusy)return;const code=String(root.querySelector('[data-redeem-input]')?.value||state.redeemInput||'').trim().toUpperCase();if(!code){state.redeemError='Enter a code';render();return;}state.redeemBusy=true;state.redeemError='';try{const r=await B.validateRedeem(code,subtotal(checkoutItems()));state.redeemInput=code;state.redeemApplied={code:r.code,discount:Number(r.discount||0)};}catch(e){state.redeemApplied=null;state.redeemError=e.message||'Code is not valid';}finally{state.redeemBusy=false;render();}}
      else if(a==='remove-redeem'){state.redeemInput='';state.redeemApplied=null;state.redeemError='';render();}
      else if(a==='menu'){if(state.menu)closeMenu(false);else openMenu();}
      else if(a==='close-menu'){closeMenu(false);}
      else if(a==='nav-back'){if(state.screen==='teamUpload'&&!state.teamEnquirySuccess&&state.teamStep>1){state.teamActiveLayer='';state.teamStep-=1;render();}else navigateBack(x.dataset.fallback||'home');}
      else if(a==='install'){await install();if(fromDrawer)render();}
      else if(a==='open-filter'){state.filterDraft={categories:clone(state.filterCategories),subs:clone(state.filterSubs),options:clone(state.filterOptions)};state.filterOpen=true;render();}
      else if(a==='close-filter')closeFilter(false);
      else if(a==='reset-filter-draft'){state.filterDraft={categories:[],subs:[],options:[]};render();}
      else if(a==='apply-filter'){commitFilterDraft();state.filterOpen=false;state.filterDraft=null;render();}
      else if(a==='clear-filters'){resetFilters();render();}
      else if(a==='add-product'){if(requireCustomer('add-product'))await addSelectedProductToCart();}
      else if(a==='team-add-row'){state.teamRows.push({name:'',number:'',size:'M'});render();}
      else if(a==='team-crop-cancel'){closeTeamCrop();}
      else if(a==='team-crop-apply'){applyTeamCrop();}
      else if(a==='team-next-step'){if(state.teamStep===1&&(!state.teamFront.background||!state.teamBack.background)){showToast('Upload both front and back designs first');return;}state.teamActiveLayer='';const next=Math.min(4,state.teamStep+1);state.teamUnlockedStep=Math.max(state.teamUnlockedStep,next);state.teamStep=next;render();}
      else if(a==='team-prev-step'){state.teamActiveLayer='';if(state.teamStep>1){state.teamStep-=1;render();}else navigateBack('home');}
      else if(a==='team-enquire'){if(requireCustomer('team-enquiry'))await submitTeamEnquiry();}
      else if(a==='team-reset'){resetTeamBuilder();render();}
      else if(a==='close-auth')closeAuth();
      else if(a==='auth-resend'){state.authBusy=true;state.authError='';render();try{await B.retryOtp();showToast('OTP resent');}catch(err){state.authError=err.message||'Could not resend OTP';}finally{state.authBusy=false;render();}}
      else if(a==='auth-change-phone'){window.OneLineOTP?.reset?.();state.authStep='phone';state.authOtp='';state.authError='';render();}
      else if(a==='profile-login'){requireCustomer('profile-login');}
      else if(a==='new-address'){clearDraft('address');state.addressEditor='';writeDraft('address',{editorId:'',values:{},isDefault:false});render();}
      else if(a==='edit-address'){clearDraft('address');state.addressEditor=x.dataset.id||'';writeDraft('address',{editorId:String(state.addressEditor),values:{},isDefault:!!state.addresses.find(v=>String(v.id)===String(state.addressEditor))?.is_default});render();}
      else if(a==='cancel-address'){state.addressEditor=null;clearDraft('address');render();}
      else if(a==='select-address'){state.selectedAddressId=x.dataset.id||'';render();}
      else if(a==='delete-address'){if(!confirm('Delete this saved address?'))return;try{const r=await B.customerAddress('address_delete',null,x.dataset.id);state.addresses=r.addresses||[];if(!state.addresses.some(v=>String(v.id)===String(state.selectedAddressId)))state.selectedAddressId=state.addresses.find(v=>v.is_default)?.id||state.addresses[0]?.id||'';render();}catch(err){showToast(err.message||'Could not delete address');}}
      else if(a==='open-order-detail'){state.orderDetailId=x.dataset.id||'';render();}
      else if(a==='close-order-detail'){state.orderDetailId='';render();}
      else if(a==='share-customer-order'){try{await shareCustomerOrderPdf(x.dataset.id);}catch(err){showToast(err.message||'Could not share PDF');}}
      else if(a==='download-customer-order'){try{await downloadCustomerOrderPdf(x.dataset.id);}catch(err){showToast(err.message||'PDF could not be downloaded');}}
            else if(a==='profile-cancel-edit'){clearDraft('profile');go('profile');}
      else if(a==='profile-logout'){clearDirectCheckout();clearDraft('address');clearDraft('profile');clearDraft('checkout-business');clearDraft('checkout-remarks');state.remarks='';state.addressEditor=null;B?.clearCustomerSession?.();state.customer=null;state.cart=[];state.orders=[];state.enquiries=[];state.cartVersion=0;state.ordersStamp='';state.enquiriesStamp='';state.accountLoaded=false;window.OneLineOTP?.reset?.();broadcastAccountSync('logout');render();}
      else if(a==='checkout'){if(state.cart.some(needsReaddForPrinting)){showToast('A saved printed item needs to be removed and added again for the updated per-garment printing price.');return;}clearDirectCheckout();state.redeemInput='';state.redeemApplied=null;state.redeemError='';if(!state.customer?.token){requireCustomer('checkout');return;}B?.customerEvent?.('checkout_started',{cartItems:state.cart.length,pieces:totalQty(),items:state.cart.map(i=>({name:i.name,code:i.code||'',itemType:i.itemType||'product',qty:i.qty||1}))});state.checkoutStep=1;state.orderPlaced=false;go('checkout');}
      else if(a==='delivery-step'){const addr=activeDeliveryAddress();if(!addr){showToast('Choose or add a delivery address');return;}state.details={...state.details,name:state.customer?.name||'',recipientName:addr.recipient_name,address:deliveryAddressLine(addr),business:root.querySelector('[data-checkout-business]')?.value||state.customer?.businessName||''};state.payment='Cash on delivery';state.checkoutStep=2;render();}
      else if(a==='checkout-edit-details'){state.checkoutStep=1;render();}
      else if(a==='submit-order')await completeOrder();
      else if(a==='close-payment'){state.paymentDemo=false;render();}
      else if(a==='complete-order')await completeOrder();
      else if(a==='close-legal'){closeLegal(false);}
      else if(a==='view-order'){state.orderPlaced=false;go('orders');}
      else if(a==='whatsapp'){openWhatsApp(x.dataset.message||'Hi, I need a custom apparel quotation.');if(fromDrawer)render();}
      else if(a==='uniform-enquiry')openWhatsApp('Hi, I need a fast uniform customization quote. Please share options for garment colour, logo/text, sizes and quantity.');
      else if(a==='jersey-add-cart'||a==='jersey-buy-now'){state.customItemId=x.dataset.itemId||state.customItemId;const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));if(!item||!selectedSportswearQty(item,null).totalQty){showToast('Choose sizes and quantities.');return;}if(requireCustomer(a))await addJerseyOrderToCart(state.customItemId,a==='jersey-buy-now');}
      else if(a==='printable-add-cart'){state.customItemId=x.dataset.itemId||state.customItemId;const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));if(!item||!printableSelection(item).ready){showToast('Select fabric, quality and garment sizes'+(state.printableIncludePrint!==false?', plus a print type and print-size quantity.':'.'));return;}if(requireCustomer('printable-add-cart'))await addPrintableOrderToCart(state.customItemId,false);}
      else if(a==='printable-buy-now'){state.customItemId=x.dataset.itemId||state.customItemId;const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));if(!item||!printableSelection(item).ready){showToast('Select fabric, quality and garment sizes'+(state.printableIncludePrint!==false?', plus a print type and print-size quantity.':'.'));return;}if(requireCustomer('printable-buy-now'))await addPrintableOrderToCart(state.customItemId,true);}
      else if(a==='uniform-add-cart'){state.customItemId=x.dataset.itemId||state.customItemId;const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId)),sel=item?uniformSelection(item):null;if(!sel?.selectedOptions?.length){showToast('Select any item');scrollToUniformChoices();return;}if(requireCustomer('uniform-add-cart'))await addUniformOrderToCart(state.customItemId,false);}
      else if(a==='uniform-buy-now'){state.customItemId=x.dataset.itemId||state.customItemId;const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId)),sel=item?uniformSelection(item):null;if(!sel?.selectedOptions?.length){showToast('Select any item');scrollToUniformChoices();return;}if(requireCustomer('uniform-buy-now'))await addUniformOrderToCart(state.customItemId,true);}
      else if(a==='custom-catalog-enquiry'){state.customItemId=x.dataset.itemId||state.customItemId;const item=state.customCatalogItems.find(v=>String(v.id)===String(state.customItemId));if(item&&isSportswearCustomItem(item)&&!selectedSportswearQty(item,garmentCardRate(sportswearFabrics(item).find(x=>String(x.fabric.id)===String(state.customFabricId))?.fabric,state.customQuality,sportswearTypes(item).find(t=>String(t.id)===String(state.customSportswearTypeId)))).totalQty){showToast('Choose at least one size.');return;}if(requireCustomer('custom-catalog-enquiry'))await submitCustomCatalogEnquiry(state.customItemId);}
      else if(a==='reload-fabric-prices')void refreshCustomerFabricPricing(state.customItemId);
      else if(a==='close-zoom')closeZoom();
      else if(a==='zoom-prev')changeZoomImage(-1);
      else if(a==='zoom-next')changeZoomImage(1);
      else if(a==='zoom-in'){setZoomRatio(state.zoomScale+.25);}
      else if(a==='zoom-out'){setZoomRatio(state.zoomScale-.25);}

    }));
    const orderOverlay=root.querySelector('[data-customer-order-overlay]');if(orderOverlay)orderOverlay.addEventListener('click',e=>{if(e.target===orderOverlay){state.orderDetailId='';render();}});
    const overlay=root.querySelector('.catalog-filter-overlay');if(overlay)overlay.addEventListener('click',e=>{if(e.target===overlay)closeFilter(false);});

    const zoomOverlay=root.querySelector('[data-zoom-overlay]');if(zoomOverlay)zoomOverlay.addEventListener('click',e=>{if(e.target===zoomOverlay)closeZoom();});
    bindWhatsappDrag();bindProductSliders();bindDetailSliders();bindFastUniformCustomizer();
  }
  function syncModalScrollLock(){
    const locked=!!(state.menu||state.filterOpen||state.zoomImage||state.authModal||state.teamCrop);
    document.documentElement.classList.toggle('modal-scroll-lock',locked);
    document.body.classList.toggle('modal-scroll-lock',locked);
  }
  function syncZoomView(){
    const stage=root.querySelector('[data-zoom-stage]'),image=root.querySelector('[data-zoom-view]'),label=root.querySelector('[data-zoom-label]');
    if(!stage||!image)return;
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    const naturalW=image.naturalWidth||stage.clientWidth||1,naturalH=image.naturalHeight||stage.clientHeight||1;
    const factor=Math.min((stage.clientWidth||1)/naturalW,(stage.clientHeight||1)/naturalH);
    const maxX=Math.max(0,(naturalW*factor*state.zoomScale-stage.clientWidth)/2),maxY=Math.max(0,(naturalH*factor*state.zoomScale-stage.clientHeight)/2);
    state.zoomX=clamp(state.zoomX,-maxX,maxX);state.zoomY=clamp(state.zoomY,-maxY,maxY);
    image.style.transform='translate3d('+state.zoomX+'px,'+state.zoomY+'px,0) scale('+state.zoomScale+')';
    if(label)label.textContent=Math.round(state.zoomScale*100)+'%';
    const minus=root.querySelector('[data-action="zoom-out"]'),plus=root.querySelector('[data-action="zoom-in"]');
    if(minus)minus.disabled=state.zoomScale<=1;if(plus)plus.disabled=state.zoomScale>=5;
  }
  function setZoomRatio(value){
    state.zoomScale=Math.max(1,Math.min(5,Math.round(Number(value)*100)/100));
    if(state.zoomScale===1){state.zoomX=0;state.zoomY=0;}
    syncZoomView();
  }
  function bindZoomViewer(){
    const stage=root.querySelector('[data-zoom-stage]'),image=root.querySelector('[data-zoom-view]'),label=root.querySelector('[data-zoom-label]');
    if(!stage||!image)return;
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    let pinchStart=0,pinchScale=state.zoomScale,panStart=null,swipeStart=null,lastTap=0,gestureMoved=false;
    const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    const apply=syncZoomView;
    image.addEventListener('load',apply,{once:true});
    stage.addEventListener('wheel',e=>{
      if(!e.cancelable)return;
      e.preventDefault();
      setZoomRatio(state.zoomScale+(e.deltaY<0?.25:-.25));
    },{passive:false});
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
    let desktopDrag=null;
    stage.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;desktopDrag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:state.zoomX,oy:state.zoomY,moved:false};stage.setPointerCapture(e.pointerId);});
    stage.addEventListener('pointermove',e=>{if(!desktopDrag||desktopDrag.id!==e.pointerId)return;const dx=e.clientX-desktopDrag.x,dy=e.clientY-desktopDrag.y;if(Math.abs(dx)>7||Math.abs(dy)>7)desktopDrag.moved=true;if(state.zoomScale>1&&desktopDrag.moved){state.zoomX=desktopDrag.ox+dx;state.zoomY=desktopDrag.oy+dy;apply();}});
    stage.addEventListener('pointerup',e=>{if(!desktopDrag||desktopDrag.id!==e.pointerId)return;const dx=e.clientX-desktopDrag.x,dy=e.clientY-desktopDrag.y,moved=desktopDrag.moved;desktopDrag=null;if(state.zoomScale===1&&moved&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.15&&(state.zoomImages||[]).length>1)changeZoomImage(dx<0?1:-1);});
    stage.addEventListener('pointercancel',()=>{desktopDrag=null;});
    stage.addEventListener('dblclick',e=>{e.preventDefault();state.zoomScale=state.zoomScale>1?1:2;state.zoomX=0;state.zoomY=0;apply();});
    apply();
  }
  async function install(){if(state.installPrompt){await state.installPrompt.prompt();state.installPrompt=null;}else showToast('Use your browser menu and choose “Install app”');}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;render();});
  window.addEventListener('appinstalled',()=>{state.installPrompt=null;render();});
  setInterval(()=>{if(state.screen==='customItem'&&!document.hidden)void refreshCustomerFabricPricing(state.customItemId,{silent:true});},60000);
  window.addEventListener('focus',()=>{if(state.screen==='customItem')void refreshCustomerFabricPricing(state.customItemId,{silent:true});});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.screen==='customItem')void refreshCustomerFabricPricing(state.customItemId,{silent:true});});
  window.addEventListener('storage',e=>{state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=(S.getCustomCatalogCategories?.()||[]).map(c=>['uniform','kids uniform'].includes(String(c.name||'').trim().toLowerCase())?{...c,name:'Uniform'}:c);state.customCatalogItems=S.getCustomCatalogItems?.()||[];state.customCatalogFabrics=S.getCustomCatalogFabrics?.()||[];state.customSportswearFabrics=S.getCustomSportswearFabrics?.()||[];state.customSportswearTypes=S.getCustomSportswearTypes?.()||[];state.customPrintTypes=S.getCustomPrintTypes?.()||[];state.settings=S.getSettings();state.cart.forEach(item=>{if(item.itemType==='custom_design'&&item.customDesign){item.price=S.customDesignPrice?.(item.customDesign,item.qty,state.settings)??item.price;item.total=Number(item.price||0)*Number(item.qty||0);}});if(e.key===(window.ONE_LINE_CONFIG?.CUSTOMER_SESSION_KEY||'one-line-customer-session-v1')){const sess=B?.customerSession?.();if(sess?.token){state.customer={...(state.customer||{}),...sess};state.accountLoaded=false;refreshCustomerAccount(true);}else{state.customer=null;state.cart=[];state.orders=[];state.enquiries=[];state.addresses=[];state.selectedAddressId='';state.accountLoaded=false;render();}}else render();});
  window.addEventListener('one-line-change',()=>{state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=(S.getCustomCatalogCategories?.()||[]).map(c=>['uniform','kids uniform'].includes(String(c.name||'').trim().toLowerCase())?{...c,name:'Uniform'}:c);state.customCatalogItems=S.getCustomCatalogItems?.()||[];state.customCatalogFabrics=S.getCustomCatalogFabrics?.()||[];state.customSportswearFabrics=S.getCustomSportswearFabrics?.()||[];state.customSportswearTypes=S.getCustomSportswearTypes?.()||[];state.customPrintTypes=S.getCustomPrintTypes?.()||[];state.settings=S.getSettings();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){saveAddressDraft();flushAllCartQuantitySync();}else if(accountView()&&Date.now()-lastAccountSyncAt>30000)void pollCustomerAccount(true);});
  window.addEventListener('pagehide',()=>{saveAddressDraft();flushAllCartQuantitySync();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.teamCrop){closeTeamCrop();}else if(e.key==='Escape'&&state.zoomImage){closeZoom();}else if(e.key==='Escape'&&state.filterOpen){closeFilter(false);}else if(e.key==='Escape'&&state.menu){closeMenu(false);}else if(e.key==='Escape'&&state.headerSearchOpen){state.headerSearchOpen=false;const y=window.scrollY;render();window.scrollTo(0,y);root.querySelector('[data-action="toggle-header-search"]')?.focus({preventScroll:true});}if((e.ctrlKey||e.metaKey)&&['+','-','=','0'].includes(e.key))e.preventDefault();});document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault();},{passive:false});
  try{
    const valid=['home','search','readyMade','categories','catalog','product','customCatalog','customCategory','customItem','cart','checkout','orders','profile','profileDetails','addresses','customize','teamUpload'];const hash=location.hash.replace('#','');const params=new URLSearchParams(location.search);const sharePath=location.pathname.match(/^\/share\/(item|category|product|retail-category)\/([^/]+)\/?$/);if(sharePath){try{const shareId=decodeURIComponent(sharePath[2]);if(sharePath[1]==='item')params.set('customItem',shareId);if(sharePath[1]==='category')params.set('customCategory',shareId);if(sharePath[1]==='product')params.set('product',shareId);if(sharePath[1]==='retail-category')params.set('category',shareId);}catch(_){}}let initial=valid.includes(hash)?hash:'home';
    const sharedCategory=params.get('category'),sharedSub=params.get('subcategory'),sharedProduct=params.get('product'),sharedSection=params.get('section'),sharedCustomCategory=params.get('customCategory'),sharedCustomItem=params.get('customItem');
    if(sharedCategory){state.filterCategories=[sharedCategory];state.filterSubs=sharedSub?[sharedSub]:[];state.filterOptions=[];saveFilters();initial='catalog';}
    if(sharedProduct){const p=state.products.find(x=>String(x.id)===String(sharedProduct));if(p){state.selected=p;state.previewImage='';state.color=p.colors?.[0]||p.colorVariants?.[0]?.color||'';const sizes=state.color?p.colorVariants?.find(v=>v.color===state.color)?.sizes:p.sizes;state.size=(sizes||p.sizes||[])[0]||'';initial='product';}}
    if(sharedCustomItem){state.customItemId=sharedCustomItem;state.customCategoryId=sharedCustomCategory||state.customCategoryId||'';initial='customItem';}else if(sharedCustomCategory){state.customCategoryId=sharedCustomCategory;initial='customCategory';}
    state.screen=initial;state.sharedSection=sharedSection||'';
    if(history.state?.oneLine)history.replaceState({...history.state,...routeState(initial,history.state?.scrollY||0)},'',routeUrl(initial));
    else history.replaceState({...routeState(initial,0),fromScreen:''},'',routeUrl(initial));
  }catch(_){}
  window.addEventListener('popstate',e=>{
    if(state.printInfoId){if(e.state?.oneLineModal==='print-info'){state.printInfoId=String(e.state.printInfoId||state.printInfoId);render();return;}state.printInfoId='';render();return;}
    if(state.teamCrop){state.teamCrop=null;state.teamActiveLayer='';render();return;}
    if(state.menu){state.menu=false;state.filterOpen=false;state.filterDraft=null;syncModalScrollLock();render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||window.scrollY||0)));return;}
    const next=e.state?.oneLine?e.state.screen:'home';
    if(e.state?.oneLineModal==='legal'){state.screen=next||state.screen;restoreRouteState(state.screen,e.state||{});state.legal=e.state.legal||'About';state.menu=false;state.filterOpen=false;state.filterDraft=null;render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||0)));return;}
    if(state.legal && !e.state?.oneLineModal){state.legal='';state.screen=next||state.screen;restoreRouteState(state.screen,e.state||{});state.menu=false;state.filterOpen=false;state.filterDraft=null;render();requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||0)));return;}
    if(e.state?.oneLineZoom){state.screen=next||state.screen;restoreRouteState(state.screen,e.state||{});const custom=state.screen==='customItem'?state.customCatalogItems.find(x=>String(x.id)===String(state.customItemId)):null;const gallery=custom?(isUniformCustomItem(custom)?uniformGalleryImages(custom,uniformSelection(custom)):[...(custom.images||[])].filter(Boolean)):(state.selected?productGallery(state.selected):[]);state.zoomImages=gallery.length?gallery:[e.state.zoomSrc].filter(Boolean);state.zoomIndex=Math.max(0,Math.min(state.zoomImages.length-1,Number(e.state.zoomIndex||0)));state.zoomImage=e.state.zoomSrc||state.zoomImages[state.zoomIndex]||'';state.zoomAlt=e.state.zoomAlt||'Product image';state.zoomScale=1;state.zoomX=0;state.zoomY=0;render();return;}
    resetZoomState();state.legal='';state.screen=next||'home';restoreRouteState(state.screen,e.state||{});state.menu=false;state.filterOpen=false;state.filterDraft=null;render();if(state.screen==='customItem')void refreshCustomerFabricPricing(state.customItemId,{silent:true});requestAnimationFrame(()=>window.scrollTo(0,Number(e.state?.scrollY||0)));
  });
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=199').catch(()=>{});
  // A deep JSON.stringify of 5,000+ items on every refresh blocks low-end phones.
  const initialStamp=()=>String(S.getCatalogueRevision?.()||0)+':'+String(S.getCustomCatalogCategories?.().length||0)+':'+String(S.getCustomCatalogFabrics?.().length||0);
  let renderedStamp=initialStamp();render();
  B?.ready?.().then(async r=>{state.backendReady=true;if(r?.error)state.backendError=r.error.message||String(r.error);state.products=S.getProducts();state.categories=S.getCategories();state.customCatalogCategories=(S.getCustomCatalogCategories?.()||r?.customCategories||[]).map(c=>['uniform','kids uniform'].includes(String(c.name||'').trim().toLowerCase())?{...c,name:'Uniform'}:c);state.customCatalogItems=S.getCustomCatalogItems?.()||r?.customItems||[];state.customCatalogFabrics=S.getCustomCatalogFabrics?.()||r?.customFabrics||[];state.customSportswearFabrics=S.getCustomSportswearFabrics?.()||r?.customSportswearFabrics||[];state.customSportswearTypes=S.getCustomSportswearTypes?.()||r?.customSportswearTypes||[];state.customPrintTypes=S.getCustomPrintTypes?.()||r?.customPrintTypes||[];state.settings=S.getSettings();restoreRouteState(state.screen,history.state||{});try{history.replaceState({...history.state,...routeState(state.screen,history.state?.scrollY||0)},'',routeUrl(state.screen));}catch(_){}let accountChanged=false;if(B?.customerSession?.()?.token){const before=JSON.stringify([state.customer,state.cart,state.orders,state.enquiries]);await refreshCustomerAccount(false);accountChanged=before!==JSON.stringify([state.customer,state.cart,state.orders,state.enquiries]);}const nextStamp=initialStamp(),accountVisible=['profile','profileDetails','cart','orders','addresses','checkout'].includes(state.screen);if(nextStamp!==renderedStamp||(accountChanged&&accountVisible)||state.backendError){renderedStamp=nextStamp;render();}if(state.screen==='customItem')void refreshCustomerFabricPricing(state.customItemId,{silent:true});setInterval(()=>pollCustomerAccount(false),ACCOUNT_POLL_MS);}).catch(e=>{state.backendReady=true;state.backendError=e.message||String(e);render();});if(state.sharedSection==='shirt-colour'){setTimeout(()=>document.querySelector('[data-fast-uniform]')?.scrollIntoView({behavior:'auto',block:'start'}),120);}
})();
