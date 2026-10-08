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
    const catMap=new Map(cats.map(c=>[c.id,c])),subMap=new Map(subs.map(s=>[s.id,s]));
    const products=(data.products||[]).filter(p=>includeInactive||p.active!==false).map(p=>{
      const vv=variants.filter(v=>v.product_id===p.id&&(includeInactive||v.active!==false));
      const cat=catMap.get(p.category_id),sub=subMap.get(p.subcategory_id);
      const colors=values(vv,'color'),sizes=values(vv,'size');
      const colorVariants=colors.map(color=>{const rows=vv.filter(v=>v.color===color);return{color,image:rows.find(v=>v.image_url)?.image_url||'',sizes:values(rows,'size')};});
      return {id:p.id,code:p.code||'',sku:p.code||'',barcode:p.barcode||'',audience:p.b2b_only?'b2b':'retail',name:p.name||'',description:p.description||'',category:cat?.name||'',categoryId:p.category_id||'',subcategory:sub?.name||'',subcategoryId:p.subcategory_id||'',price:Number(p.price||0),mrp:Number(p.mrp||0),image:(p.images||[])[0]||'',images:p.images||[],type:p.product_type||'Simple',optionTitle:p.option_title||'Size',colors,sizes,colorVariants,variants:vv.map(v=>({id:v.id,color:v.color||'',size:v.size||'',stock:Number(v.stock||0),price:Number(v.price??p.price??0),barcode:v.barcode||'',image:v.image_url||'',active:v.active!==false})),stock:vv.length?vv.reduce((n,v)=>n+Number(v.stock||0),0):Number(p.stock||0),active:p.active!==false,customerVisible:p.customer_visible!==false,askForPrice:!!p.ask_for_price,b2bAccess:!!p.b2b_access};
    });
    const categories=cats.filter(c=>c.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(c=>({id:c.id,name:c.name,image:c.image_url||'',sub:subs.filter(s=>s.category_id===c.id&&s.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(s=>s.name).join(' · ')||c.subtitle||'',active:true}));
    return{products,categories,orders:data.orders||[],settings:data.settings||{},prints:data.print_types||null,delivery:data.delivery_methods||null};
  }
  async function hydrate(){
    if(!configured())return{configured:false};
    const sb=supa();
    const queries=await Promise.all([
      sb.from('categories').select('*').order('sort_order').order('created_at',{ascending:true}),
      sb.from('subcategories').select('*').order('sort_order'),
      sb.from('products').select('*'),
      sb.from('product_variants').select('*'),
      sb.from('store_settings').select('*').limit(1).maybeSingle(),
      sb.from('print_types').select('*').order('sort_order'),
      sb.from('delivery_methods').select('*').order('sort_order')
    ]);
    const firstError=queries.find(q=>q.error)?.error;if(firstError)throw firstError;
    const rawData={categories:queries[0].data,subcategories:queries[1].data,products:queries[2].data,product_variants:queries[3].data,settings:queries[4].data||{},print_types:queries[5].data,delivery_methods:queries[6].data};
    const publicMapped=mapData(rawData),mapped=document.body.dataset.portalRole?mapData(rawData,true):publicMapped;portalProducts=mapped.products;
    local('custom-store-products-v3',publicMapped.products);local('custom-store-categories-v3',mapped.categories);
    if(mapped.settings&&Object.keys(mapped.settings).length){const prev=S?.getSettings?.()||{};local('custom-store-settings-v3',{...prev,...mapped.settings,whatsapp:mapped.settings.whatsapp||prev.whatsapp||''});}
    if(mapped.prints?.length)local('custom-store-print-types-v3',mapped.prints.map(x=>({name:x.name,price:Number(x.price||0),largePrice:Number(x.large_price??x.price??0),note:x.note||'',lightOnly:!!x.light_only,active:x.active!==false})));
    if(mapped.delivery?.length)local('custom-store-delivery-v3',mapped.delivery.map(x=>({name:x.name,note:x.note||'',active:x.active!==false})));
    // Custom Catalogue stays separate from Ready Made. Keep older databases from breaking if those tables are unavailable.
    // Never let an optional catalogue table break the existing storefront.
    let customCategories=[],customItems=[],customFabrics=[],customSportswearFabrics=[],customSportswearTypes=[],customSchemaReady=false,sportswearSchemaReady=false;
    try{
      const cq=await Promise.all([
        sb.from('custom_catalog_categories').select('*').order('sort_order').order('created_at',{ascending:true}),
        sb.from('custom_catalog_items').select('*').order('sort_order'),
        sb.from('custom_catalog_fabrics').select('*').order('sort_order'),
        sb.from('custom_sportswear_fabrics').select('*').order('sort_order'),
        sb.from('custom_sportswear_types').select('*').order('sort_order')
      ]);
      customSchemaReady=!cq[0].error&&!cq[1].error&&!cq[2].error;sportswearSchemaReady=!cq[3].error&&!cq[4].error;
      if(!cq[0].error&&!cq[1].error){customCategories=cq[0].data||[];customItems=cq[1].data||[];local('one-line-custom-catalog-categories-v1',customCategories);local('one-line-custom-catalog-items-v1',customItems);}
      if(!cq[2].error){customFabrics=cq[2].data||[];local('one-line-custom-catalog-fabrics-v1',customFabrics);}
      if(!cq[3].error){customSportswearFabrics=cq[3].data||[];local('one-line-custom-sportswear-fabrics-v1',customSportswearFabrics);}
      if(!cq[4].error){customSportswearTypes=cq[4].data||[];local('one-line-custom-sportswear-types-v1',customSportswearTypes);}
    }catch(_){}
    return{configured:true,...mapped,customCategories,customItems,customFabrics,customSportswearFabrics,customSportswearTypes,customSchemaReady,sportswearSchemaReady,rawCategories:queries[0].data||[],rawSubcategories:queries[1].data||[]};
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
  async function customerSync(){const s=session();if(!s?.token)return null;return invoke('customer-account',{token:s.token,action:'sync'},false);}
  async function updateCustomerProfile(profile){const s=session();if(!s?.token)throw new Error('Please verify your phone number first.');const data=await invoke('customer-account',{token:s.token,action:'update',profile:profile||{}},false);return data?.customer||null;}
  async function mutateCustomerCart(operation,itemKey,item){
    const s=session();if(!s?.token)throw new Error('Please verify your phone number first.');
    return invoke('customer-account',{token:s.token,action:'cart_mutate',operation:String(operation||''),itemKey:String(itemKey||item?.key||''),item:item||null},false);
  }
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
  async function staffSignOut(){const sb=supa();if(sb)await sb.auth.signOut();}
  async function adminCreateAccount(payload){return invoke('admin-user',{action:'create',...payload});}
  async function adminUpdateAccount(payload){return invoke('admin-user',{action:'update',...payload});}
  async function adminBootstrapAccounts(){return invoke('admin-user',{action:'bootstrap_defaults'});}
  async function adminFeed(){return invoke('admin-user',{action:'admin_feed'});}
  async function listProfiles(){const sb=supa();if(!sb)return[];const {data,error}=await sb.from('profiles').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}
  const B2B_SESSION_KEY='one-line-b2b-session-v2';
  function b2bSession(){try{const row=JSON.parse(sessionStorage.getItem(B2B_SESSION_KEY)||'null');if(!row?.token)return null;if(row.expiresAt&&new Date(row.expiresAt).getTime()<=Date.now()){sessionStorage.removeItem(B2B_SESSION_KEY);return null;}return row;}catch(_){return null;}}
  function setB2BSession(row){if(row?.token)sessionStorage.setItem(B2B_SESSION_KEY,JSON.stringify(row));else sessionStorage.removeItem(B2B_SESSION_KEY);return row||null;}
  async function b2bLogin(username,password){const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');const {data,error}=await sb.rpc('b2b_login',{p_username:String(username||'').trim(),p_password:String(password||'')});if(error)throw error;if(!data?.token)throw new Error('Could not start B2B session.');setB2BSession(data);return data;}
  async function b2bCatalog(token){const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');const sessionRow=b2bSession(),value=String(token||sessionRow?.token||'');if(!value)throw new Error('Please sign in to B2B.');const {data,error}=await sb.rpc('b2b_catalog',{p_token:value});if(error)throw error;return data||{items:[]};}
  async function b2bLogout(){const sb=supa(),row=b2bSession();try{if(sb&&row?.token)await sb.rpc('b2b_logout',{p_token:row.token});}catch(_){}setB2BSession(null);return true;}
  async function b2bUpdateStorefront(payload){const sb=supa(),row=b2bSession();if(!sb)throw new Error('Supabase is not configured yet.');if(!row?.token)throw new Error('Please sign in to B2B.');const {data,error}=await sb.rpc('b2b_update_storefront',{p_token:row.token,p_brand_name:String(payload?.brandName||'').trim(),p_whatsapp_number:String(payload?.whatsappNumber||'').trim(),p_profile_photo:String(payload?.profilePhoto||'')});if(error)throw error;if(data?.account){const next={...row,account:{...(row.account||{}),...data.account}};setB2BSession(next);return next;}return row;}
  async function b2bPublicCatalog(slug){const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');const {data,error}=await sb.rpc('b2b_public_catalog',{p_slug:String(slug||'').trim()});if(error)throw error;return data||{store:null,items:[]};}
  async function uploadImage(file,folder='catalog'){
    const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');if(!file)return'';const ext=(file.name.split('.').pop()||'webp').toLowerCase();const path=folder+'/'+crypto.randomUUID()+'.'+ext;const {error}=await sb.storage.from(C.STORAGE_BUCKET||'product-images').upload(path,file,{cacheControl:'31536000',upsert:false});if(error)throw error;return sb.storage.from(C.STORAGE_BUCKET||'product-images').getPublicUrl(path).data.publicUrl;
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
  async function upsertCategory(row){const sb=supa();const payload={id:row.id||undefined,name:row.name,image_url:row.image||'',subtitle:row.sub||'',active:row.active!==false,sort_order:Number(row.sort_order||0)};const {data,error}=await sb.from('categories').upsert(payload).select().single();if(error)throw error;await hydrate();return data;}
  async function upsertProduct(p){
    const sb=supa();if(!sb)throw new Error('Supabase is not configured yet.');
    const base={id:p.id||undefined,code:p.code||p.sku||'',barcode:p.barcode||null,name:p.name||'',description:p.description||'',category_id:p.categoryId||null,subcategory_id:p.subcategoryId||null,price:Number(p.price||0),mrp:Number(p.mrp||0),product_type:p.type||'Simple',option_title:p.optionTitle||'Size',images:p.images?.length?p.images:[p.image].filter(Boolean),active:p.active!==false,customer_visible:p.audience!=='b2b',b2b_only:p.audience==='b2b',ask_for_price:!!p.askForPrice,b2b_access:!!p.b2bAccess,stock:Number(p.stock||0)};
    const {data,error}=await sb.from('products').upsert(base).select().single();if(error)throw error;
    if(Array.isArray(p.variants)){const removed=await sb.from('product_variants').delete().eq('product_id',data.id);if(removed.error)throw removed.error;if(p.variants.length){const rows=p.variants.map(v=>({product_id:data.id,color:v.color||'',size:v.size||'',stock:Number(v.stock||0),price:Number(v.price??p.price??0),barcode:v.barcode||null,image_url:v.image||'',active:v.active!==false}));const r=await sb.from('product_variants').insert(rows);if(r.error)throw r.error;}}
    await hydrate();return data;
  }
  async function deleteProduct(id){const sb=supa();const {error}=await sb.from('products').delete().eq('id',id);if(error)throw error;await hydrate();}
  window.OneLineBackend={portalProducts:()=>portalProducts,configured,supa,ready,hydrate,requestOtp,retryOtp,verifyOtp,customerSession:session,setCustomerSession:setSession,clearCustomerSession:clearSession,customerEvent,customerEnquiry,customerTeamEnquiry,customerAccount,customerSync,updateCustomerProfile,mutateCustomerCart,placeOrder,staffSignIn,staffProfile,staffSignOut,adminCreateAccount,adminUpdateAccount,adminBootstrapAccounts,adminFeed,listProfiles,b2bSession,setB2BSession,b2bLogin,b2bCatalog,b2bLogout,b2bUpdateStorefront,b2bPublicCatalog,uploadImage,deleteImage,deleteImages,upsertCategory,upsertProduct,deleteProduct,cleanPhone};
})();
