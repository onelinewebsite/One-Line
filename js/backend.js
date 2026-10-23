(function(){
  "use strict";
  const C=window.ONE_LINE_CONFIG||{};
  const S=window.OneLineStore;
  let client=null,readyPromise=null,portalProducts=[];
  try{
    if(localStorage.getItem('one-line-production-reset-v43')!=='1'){
      ['custom-store-products-v3','custom-store-categories-v3','custom-store-orders-v3','custom-store-cart-v3','one-line-v21-products-migrated','one-line-v24-uniforms-migrated','one-line-v21-categories-migrated'].forEach(k=>localStorage.removeItem(k));
      localStorage.setItem('one-line-production-reset-v43','1');
    }
    // v41: cart, order history and customer profile are server-authoritative.
    // Remove old device snapshots so they can never overwrite another device.
    localStorage.removeItem('custom-store-cart-v3');
    localStorage.removeItem('custom-store-orders-v3');
  }catch(_){}
  function local(key,value){const writing=arguments.length===2;try{if(writing){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new CustomEvent('one-line-change',{detail:{key}}));return value;}return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return writing?value:null;}}
  const configured=()=>!!(C.SUPABASE_URL&&C.SUPABASE_PUBLISHABLE_KEY&&window.supabase?.createClient);
  const supa=()=>{if(!configured())return null;if(!client)client=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return client;};
  const cleanPhone=v=>{let n=String(v||'').replace(/\D/g,'');if(n.length===10)n='91'+n;return n;};
  const session=()=>{
    const key=C.CUSTOMER_SESSION_KEY||'one-line-customer-session-v1',v=local(key);if(!v?.token)return null;
    const safe={token:String(v.token),customerId:v.customerId||null,phone:v.phone||'',expiresAt:v.expiresAt||''};
    try{if(Object.keys(v).some(k=>!['token','customerId','phone','expiresAt'].includes(k)))localStorage.setItem(key,JSON.stringify(safe));}catch(_){}
    return safe;
  };
  const setSession=v=>{
    if(!v?.token)return null;
    // Persist only the credential / stable identifiers. Profile, cart and orders
    // always come from Supabase so a second device never sees stale account data.
    const safe={token:String(v.token),customerId:v.customerId||null,phone:v.phone||'',expiresAt:v.expiresAt||''};
    return local(C.CUSTOMER_SESSION_KEY||'one-line-customer-session-v1',safe);
  };
  const clearSession=()=>localStorage.removeItem(C.CUSTOMER_SESSION_KEY||'one-line-customer-session-v1');
  async function invokePublicDirect(name,body){
    const base=String(C.SUPABASE_URL||'').replace(/\/$/,'');
    if(!base)throw new Error('Supabase is not configured yet.');
    const url=base+'/functions/v1/'+encodeURIComponent(name);
    // text/plain keeps this request CORS-simple, so the browser does not have
    // to complete an OPTIONS preflight before public Edge Functions.
    const response=await fetch(url,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'content-type':'text/plain;charset=UTF-8','accept':'application/json'},body:JSON.stringify(body||{})});
    const raw=await response.text();let data={};
    try{data=raw?JSON.parse(raw):{};}catch(_){data={error:raw||('Edge Function '+name+' returned an invalid response.')}}
    if(!response.ok||data?.error)throw new Error(String(data?.error||data?.message||('Edge Function '+name+' failed ('+response.status+').')));
    return data;
  }
  const invoke=async(name,body,auth=true)=>{
    const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');
    if(!auth){
      let directError=null;
      try{return await invokePublicDirect(name,body);}catch(err){directError=err;}
      try{
        const {data,error}=await sb.functions.invoke(name,{body});
        if(error)throw error;if(data?.error)throw new Error(data.error);return data;
      }catch(err){
        const first=String(directError?.message||'').trim(),second=String(err?.message||'').trim();
        if(/failed to fetch|networkerror|load failed|failed to send a request/i.test(first+' '+second)){
          throw new Error('Could not connect to the One-Line verification server. The OTP itself was received, but the Supabase Edge Function is not reachable. Deploy the latest otp-session function and try again.');
        }
        throw directError||err;
      }
    }
    const {data,error}=await sb.functions.invoke(name,{body});if(error)throw error;if(data?.error)throw new Error(data.error);return data;
  };
  const values=(rows,key)=>[...new Set((rows||[]).map(x=>String(x?.[key]||'').trim()).filter(Boolean))];
  function mapData(data,includeInactive=false){
    const cats=data.categories||[],subs=data.subcategories||[],variants=data.product_variants||[];
    // Linear-time join; filtering every variant for every product becomes O(products * variants).
    const variantsByProduct=new Map();
    for(const variant of variants){const key=String(variant.product_id),group=variantsByProduct.get(key);if(group)group.push(variant);else variantsByProduct.set(key,[variant]);}
    const catMap=new Map(cats.map(c=>[c.id,c])),subMap=new Map(subs.map(s=>[s.id,s]));
    const products=(data.products||[]).filter(p=>includeInactive||p.active!==false).map(p=>{
      const vv=(variantsByProduct.get(String(p.id))||[]).filter(v=>includeInactive||v.active!==false);
      const cat=catMap.get(p.category_id),sub=subMap.get(p.subcategory_id);
      const colors=values(vv,'color'),sizes=values(vv,'size');
      const colorVariants=colors.map(color=>{const rows=vv.filter(v=>v.color===color);return{color,image:rows.find(v=>v.image_url)?.image_url||'',sizes:values(rows,'size')};});
      return {id:p.id,createdAt:p.created_at||'',code:p.code||'',sku:p.code||'',barcode:p.barcode||'',audience:'retail',name:p.name||'',description:p.description||'',category:cat?.name||'',categoryId:p.category_id||'',subcategory:sub?.name||'',subcategoryId:p.subcategory_id||'',price:Number(p.price||0),mrp:Number(p.mrp||0),image:(p.images||[])[0]||'',cardImage:p.card_image_url||'',images:p.images||[],type:p.product_type||'Simple',optionTitle:p.option_title||'Size',colors,sizes,colorVariants,variants:vv.map(v=>({id:v.id,color:v.color||'',size:v.size||'',stock:Number(v.stock||0),price:Number(v.price??p.price??0),barcode:v.barcode||'',image:v.image_url||'',active:v.active!==false})),stock:vv.length?vv.reduce((n,v)=>n+Number(v.stock||0),0):Number(p.stock||0),active:p.active!==false,customerVisible:p.customer_visible!==false,askForPrice:!!p.ask_for_price};
    });
    const categories=cats.filter(c=>c.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(c=>({id:c.id,name:c.name,image:c.image_url||'',sub:subs.filter(s=>s.category_id===c.id&&s.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(s=>s.name).join(' · ')||c.subtitle||'',active:true}));
    return{products,categories,orders:data.orders||[],settings:data.settings||{},prints:data.print_types||null,delivery:data.delivery_methods||null};
  }
  let catalogueFlight=null,catalogueCache=null,catalogueCachedAt=0;
  const CATALOGUE_TTL=120000;
  const CATALOGUE_PAGE_SIZE=350;
  const CATALOGUE_MAX_PAGES=80; // 28,000 rows per table; never silently return only the first 1,000.
  const cataloguePortal=()=>!!document.body.dataset.portalRole;
  async function directCataloguePage(sb,table,page,columns='*'){
    const orderBy=table==='catalogue_internal_details'?'item_id':'id';
    const from=page*CATALOGUE_PAGE_SIZE;
    const res=await sb.from(table).select(columns).order(orderBy,{ascending:true}).range(from,from+CATALOGUE_PAGE_SIZE-1);
    if(res.error)throw res.error;
    return res.data||[];
  }
  async function cataloguePage(sb,table,page,columns='*'){
    // Staff/admin bypass the public Cloudflare cache to preserve role-filtered records.
    if(!cataloguePortal()){
      try{
        const query=new URLSearchParams({table,page:String(page)});
        const response=await fetch('/api/public-catalogue?'+query,{credentials:'omit',headers:{accept:'application/json'}});
        if(response.ok){const rows=await response.json();if(Array.isArray(rows))return rows;}
        // On a Pages site without Functions, fall back to the original RLS-protected API.
      }catch(_){/* Keep catalogue available while Cloudflare is unreachable. */}
    }
    return directCataloguePage(sb,table,page,columns);
  }
  async function catalogueRows(sb,table,columns='*'){
    // Most configuration tables fit in one page; don't issue two extra requests for them.
    const first=await cataloguePage(sb,table,0,columns),rows=[...first];
    if(first.length<CATALOGUE_PAGE_SIZE)return rows;
    for(let page=1;page<CATALOGUE_MAX_PAGES;page+=3){
      const group=await Promise.all([page,page+1,page+2].filter(n=>n<CATALOGUE_MAX_PAGES).map(n=>cataloguePage(sb,table,n,columns)));
      for(const batch of group){rows.push(...batch);if(batch.length<CATALOGUE_PAGE_SIZE)return rows;}
    }
    throw new Error('Catalogue exceeded the supported row limit; contact the developer to expand paging.');
  }
  function cachePublished(key,value){
    if(S?.setCatalogueCache)S.setCatalogueCache(key,value);
    else local(key,value);
  }
  function hydrate(options={}){
    if(catalogueFlight)return catalogueFlight;
    if(!options.force&&catalogueCache&&Date.now()-catalogueCachedAt<CATALOGUE_TTL)return Promise.resolve(catalogueCache);
    catalogueFlight=hydrateFresh().then(data=>{catalogueCache=data;catalogueCachedAt=Date.now();return data;}).finally(()=>{catalogueFlight=null;});
    return catalogueFlight;
  }
  function patchCatalogue(kind,row){
    const key=kind==='items'?'customItems':'customCategories',storage=kind==='items'?'one-line-custom-catalog-items-v1':'one-line-custom-catalog-categories-v1';
    const rows=catalogueCache?.[key]||JSON.parse(localStorage.getItem(storage)||'[]'),index=rows.findIndex(x=>String(x.id)===String(row.id));
    if(index<0)rows.push(row);else rows[index]=row;
    if(catalogueCache)catalogueCache[key]=rows;
    local(storage,rows);
  }
  async function hydrateFresh(){
    if(!configured())return{configured:false};
    const sb=supa();
    const queries=await Promise.allSettled([
      catalogueRows(sb,'categories'),
      catalogueRows(sb,'subcategories'),
      catalogueRows(sb,'products'),
      catalogueRows(sb,'product_variants'),
      sb.from('store_settings').select('*').limit(1).maybeSingle(),
      catalogueRows(sb,'print_types'),
      catalogueRows(sb,'delivery_methods')
    ]);
    // Reuse the original mapping while making each paginated list resemble a Supabase result.
    const settled=queries.map(q=>q.status==='fulfilled'?(Array.isArray(q.value)?{data:q.value,error:null}:q.value):{data:null,error:q.reason});
    const firstError=settled.find(q=>q.error)?.error;if(firstError)throw firstError;
    const rawData={categories:settled[0].data,subcategories:settled[1].data,products:settled[2].data,product_variants:settled[3].data,settings:settled[4].data||{},print_types:settled[5].data,delivery_methods:settled[6].data};
    const publicMapped=mapData(rawData),mapped=document.body.dataset.portalRole?mapData(rawData,true):publicMapped;portalProducts=mapped.products;
    cachePublished('custom-store-products-v3',publicMapped.products);local('custom-store-categories-v3',mapped.categories);
    if(mapped.settings&&Object.keys(mapped.settings).length){const prev=S?.getSettings?.()||{};local('custom-store-settings-v3',{...prev,...mapped.settings,whatsapp:mapped.settings.whatsapp||prev.whatsapp||''});}
    if(mapped.prints?.length)local('custom-store-print-types-v3',mapped.prints.map(x=>({name:x.name,price:Number(x.price||0),largePrice:Number(x.large_price??x.price??0),note:x.note||'',lightOnly:!!x.light_only,active:x.active!==false})));
    if(mapped.delivery?.length)local('custom-store-delivery-v3',mapped.delivery.map(x=>({name:x.name,note:x.note||'',active:x.active!==false})));
    // Custom Catalogue stays separate from Ready Made. Keep older databases from breaking if those tables are unavailable.
    // Never let an optional catalogue table break the existing storefront.
    let customCategories=[],customItems=[],customFabrics=[],customSportswearFabrics=[],customSportswearTypes=[],customPrintTypes=[],customSchemaReady=false,sportswearSchemaReady=false;
    try{
      const cqSettled=await Promise.allSettled([
        catalogueRows(sb,'custom_catalog_categories'),
        catalogueRows(sb,'custom_catalog_items'),
        catalogueRows(sb,'custom_catalog_fabrics'),
        catalogueRows(sb,'custom_sportswear_fabrics'),
        catalogueRows(sb,'custom_sportswear_types'),
        catalogueRows(sb,'custom_print_types')
      ]);
      const cq=cqSettled.map(q=>q.status==='fulfilled'?{data:q.value,error:null}:{data:null,error:q.reason});
      customSchemaReady=!cq[0].error&&!cq[1].error&&!cq[2].error;sportswearSchemaReady=!cq[3].error&&!cq[4].error;
      if(!cq[0].error&&!cq[1].error){
        customCategories=cq[0].data||[];customItems=cq[1].data||[];
        // Optional public read of explicitly published details (Admin updates use separate, protected table).
        try{
          const publicDetails={data:await catalogueRows(sb,'catalogue_internal_details','item_id,detail_1,detail_2'),error:null};
          if(!publicDetails.error){
            const detailsById=new Map((publicDetails.data||[]).map(d=>[String(d.item_id),d]));
            customItems=customItems.map(item=>{const detail=detailsById.get(String(item.id));return {...item,customer_detail_1:detail?.detail_1||'',customer_detail_2:detail?.detail_2||''};});
          }
        }catch(_){}
        local('one-line-custom-catalog-categories-v1',customCategories);cachePublished('one-line-custom-catalog-items-v1',customItems);
      }
      if(!cq[2].error){customFabrics=cq[2].data||[];local('one-line-custom-catalog-fabrics-v1',customFabrics);}
      if(!cq[3].error){customSportswearFabrics=cq[3].data||[];local('one-line-custom-sportswear-fabrics-v1',customSportswearFabrics);}
      if(!cq[4].error){customSportswearTypes=cq[4].data||[];local('one-line-custom-sportswear-types-v1',customSportswearTypes);}
      if(!cq[5].error){customPrintTypes=cq[5].data||[];local('one-line-custom-print-types-v155',customPrintTypes);}
    }catch(_){}
    return{configured:true,...mapped,customCategories,customItems,customFabrics,customSportswearFabrics,customSportswearTypes,customPrintTypes,customSchemaReady,sportswearSchemaReady,rawCategories:settled[0].data||[],rawSubcategories:settled[1].data||[]};
  }
  function ready(){if(!readyPromise)readyPromise=hydrate().catch(error=>({configured:true,error}));return readyPromise;}
  async function createCustomerSession(phone,accessToken,name){
    const data=await invoke('otp-session',{phone:cleanPhone(phone),accessToken:String(accessToken||''),name:String(name||'').trim()},false);
    if(data?.session)setSession(data.session);
    return data;
  }
  async function requestOtp(phone){
    if(!window.OneLineOTP)throw new Error('OTP service is not available.');
    const mobile=cleanPhone(phone);
    // Keep the customer flow explicit: number -> OTP -> name. A verified
    // customer session is created only after verifyOtp() succeeds.
    return window.OneLineOTP.send(mobile);
  }
  async function retryOtp(){
    if(!window.OneLineOTP)throw new Error('OTP service is not available.');
    return window.OneLineOTP.retry();
  }
  async function verifyOtp(phone,otp,name){
    if(!window.OneLineOTP)throw new Error('OTP service is not available.');
    const verified=await window.OneLineOTP.verify(String(otp||'').trim());
    return createCustomerSession(phone,verified.accessToken,name);
  }
  async function customerEvent(event_type,payload){const s=session();if(!s?.token)return null;return invoke('customer-event',{token:s.token,event_type,payload},false).catch(()=>null);}
  async function customerEnquiry(payload){
    const s=session();
    if(!s?.token)throw new Error('Please verify your phone number first.');
    // Save Custom Catalogue enquiries through customer-event, the same verified
    // activity endpoint used by the working enquiry flow. Do not swallow errors:
    // the customer only sees success after Supabase confirms the insert.
    const data=await invoke('customer-event',{token:s.token,event_type:'custom_catalog_enquiry',payload:payload||{}},false);
    if(!data?.ok)throw new Error('Could not save the Custom Catalogue enquiry.');
    return data;
  }
  async function customerTeamEnquiry(payload){const s=session();if(!s?.token)throw new Error('Please verify your phone number first.');return invoke('customer-event',{token:s.token,event_type:'team_design_enquiry',payload:payload||{}},false);}
  async function customerAccount(){const s=session();if(!s?.token)return null;return invoke('customer-account',{token:s.token,action:'get'},false);}
  async function customerAddress(action,address,id){const s=session();if(!s?.token)throw new Error('Sign in to manage addresses.');return invoke('customer-account',{token:s.token,action,address:address||{},id:id||''},false);}
  async function customerSync(){const s=session();if(!s?.token)return null;return invoke('customer-account',{token:s.token,action:'sync'},false);}
  async function updateCustomerProfile(profile){const s=session();if(!s?.token)throw new Error('Please verify your phone number first.');const data=await invoke('customer-account',{token:s.token,action:'update',profile:profile||{}},false);return data?.customer||null;}
  async function mutateCustomerCart(operation,itemKey,item){
    const s=session();if(!s?.token)throw new Error('Please verify your phone number first.');
    return invoke('customer-account',{token:s.token,action:'cart_mutate',operation:String(operation||''),itemKey:String(itemKey||item?.key||''),item:item||null},false);
  }
  async function validateRedeem(redeemCode,subtotal){const s=session();if(!s?.token)throw new Error('Verify your number first.');return invoke('place-order',{action:'validate_redeem',token:s.token,redeemCode,subtotal},false);}
  async function placeOrder(payload){const s=session();if(!s?.token)throw new Error('Please verify your phone number first.');const data=await invoke('place-order',{token:s.token,...payload},false);return data?.order||data;}
  async function staffSignIn(username,password){const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');const clean=String(username||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'');if(!clean)throw new Error('Enter username.');const email=clean+'@staff.oneline.local';const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;const {data:profile,error:pe}=await sb.from('profiles').select('*').eq('id',data.user.id).single();if(pe)throw pe;if(!profile.active){await sb.auth.signOut();throw new Error('This account is suspended.');}return profile;}
  async function staffProfile(){
    const sb=supa();if(!sb)return null;
    const {data:sessionData,error:sessionError}=await sb.auth.getSession();if(sessionError)throw sessionError;if(!sessionData?.session)return null;
    const {data:{user},error}=await sb.auth.getUser();if(error)throw error;if(!user)return null;
    const {data:profile,error:profileError}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();if(profileError)throw profileError;
    if(!profile)throw new Error('No portal profile is linked to this account. Ask an administrator to check your account.');
    if(!profile.active){await sb.auth.signOut();throw new Error('This account is suspended.');}return profile;
  }
  async function staffSignOut(){lastAdminFeed=null;const sb=supa();if(sb)await sb.auth.signOut();}
  async function adminCreateAccount(payload){return invoke('admin-user',{action:'create',...payload});}
  async function adminUpdateAccount(payload){return invoke('admin-user',{action:'update',...payload});}
  let lastAdminFeed=null,adminFeedFlight=null;
  async function adminFeed(){if(adminFeedFlight)return adminFeedFlight;adminFeedFlight=invoke('admin-user',{action:'admin_feed',syncToken:lastAdminFeed?.syncToken||''}).then(data=>{if(data?.unchanged&&lastAdminFeed)return lastAdminFeed;lastAdminFeed=data;return data;}).finally(()=>{adminFeedFlight=null;});return adminFeedFlight;}
  async function listProfiles(){const sb=supa();if(!sb)return[];const {data,error}=await sb.from('profiles').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}

  
  
  
  
  
  async function catalogueImage(file,folder){
    // Catalogue media only; original customer artwork and downloads remain untouched.
    if(!/^(custom-catalog|catalog|categories|variants|products)(\/|$)/.test(folder)||!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size<150000||!window.createImageBitmap)return file;
    let bitmap;
    try{
      bitmap=await createImageBitmap(file);const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.85));
      return blob&&blob.type==='image/webp'&&blob.size<file.size?new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'}):file;
    }catch(_){return file;}finally{bitmap?.close?.();}
  }
  async function uploadImage(file,folder='catalog'){
    const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');if(!file)return'';file=await catalogueImage(file,folder);const ext=(file.name.split('.').pop()||'webp').toLowerCase();const path=folder+'/'+crypto.randomUUID()+'.'+ext;const {error}=await sb.storage.from(C.STORAGE_BUCKET||'product-images').upload(path,file,{cacheControl:'31536000',upsert:false});if(error)throw error;return sb.storage.from(C.STORAGE_BUCKET||'product-images').getPublicUrl(path).data.publicUrl;
  }
  function storageObjectPath(url){
    const value=String(url||'').trim();if(!value)return'';
    const bucket=String(C.STORAGE_BUCKET||'product-images');
    try{
      const u=new URL(value,location.href),marker='/storage/v1/object/public/'+encodeURIComponent(bucket)+'/';
      let i=u.pathname.indexOf(marker);if(i<0){const plain='/storage/v1/object/public/'+bucket+'/';i=u.pathname.indexOf(plain);if(i<0)return'';return decodeURIComponent(u.pathname.slice(i+plain.length));}
      return decodeURIComponent(u.pathname.slice(i+marker.length));
    }catch(_){return'';}
  }
  async function deleteImage(url){
    const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');const path=storageObjectPath(url);if(!path)return false;
    const {error}=await sb.storage.from(C.STORAGE_BUCKET||'product-images').remove([path]);if(error)throw error;return true;
  }
  async function deleteImages(urls){
    const unique=[...new Set((urls||[]).map(String).filter(Boolean))];for(const url of unique){try{await deleteImage(url);}catch(err){console.warn('Image cleanup failed',err);}}
    return true;
  }
  async function upsertCategory(row){const sb=supa();const payload={id:row.id||undefined,name:row.name,image_url:row.image||'',subtitle:row.sub||'',active:row.active!==false,sort_order:Number(row.sort_order||0)};const {data,error}=await sb.from('categories').upsert(payload).select().single();if(error)throw error;await hydrate({force:true});return data;}
  async function upsertProduct(p){
    const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');
    const base={id:p.id||undefined,code:p.code||p.sku||'',barcode:p.barcode||null,name:p.name||'',description:p.description||'',category_id:p.categoryId||null,subcategory_id:p.subcategoryId||null,price:Number(p.price||0),mrp:Number(p.mrp||0),product_type:p.type||'Simple',option_title:p.optionTitle||'Size',images:p.images?.length?p.images:[p.image].filter(Boolean),card_image_url:p.cardImage||null,active:p.active!==false,customer_visible:true,ask_for_price:!!p.askForPrice,stock:Number(p.stock||0)};
    const {data,error}=await sb.from('products').upsert(base).select().single();if(error)throw error;
    if(Array.isArray(p.variants)){const removed=await sb.from('product_variants').delete().eq('product_id',data.id);if(removed.error)throw removed.error;if(p.variants.length){const rows=p.variants.map(v=>({product_id:data.id,color:v.color||'',size:v.size||'',stock:Number(v.stock||0),price:Number(v.price??p.price??0),barcode:v.barcode||null,image_url:v.image||'',active:v.active!==false}));const r=await sb.from('product_variants').insert(rows);if(r.error)throw r.error;}}
    await hydrate({force:true});return data;
  }
  async function deleteProduct(id){const sb=supa();const {error}=await sb.from('products').delete().eq('id',id);if(error)throw error;await hydrate({force:true});}
  window.OneLineBackend={portalProducts:()=>portalProducts,configured,supa,ready,hydrate,patchCatalogue,requestOtp,retryOtp,verifyOtp,customerSession:session,setCustomerSession:setSession,clearCustomerSession:clearSession,customerEvent,customerEnquiry,customerTeamEnquiry,customerAccount,customerSync,customerAddress,updateCustomerProfile,mutateCustomerCart,placeOrder,validateRedeem,staffSignIn,staffProfile,staffSignOut,adminCreateAccount,adminUpdateAccount,adminFeed,listProfiles,uploadImage,deleteImage,deleteImages,upsertCategory,upsertProduct,deleteProduct,cleanPhone};
})();
