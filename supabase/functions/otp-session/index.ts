import { cors,json,cleanPhone,admin,hashToken } from '../_shared.ts'

function decodeJwtPayload(token:string){
  try{const part=token.split('.')[1];if(!part)return null;const normalized=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');return JSON.parse(atob(normalized))}catch(_){return null}
}
function findIdentifier(value:any):string{
  const wanted=new Set(['identifier','mobile','phone','mobilenumber','mobile_number','useridentifier','user_identifier']);const seen=new Set<any>();
  const walk=(v:any):string=>{if(!v||typeof v!=='object'||seen.has(v))return'';seen.add(v);for(const [k,x] of Object.entries(v)){if(wanted.has(k.toLowerCase())&&(typeof x==='string'||typeof x==='number'))return String(x)}for(const x of Object.values(v)){const r=walk(x);if(r)return r}return''};
  return walk(value)
}
function explicitFailure(body:any){const status=String(body?.type||body?.status||body?.success||'').toLowerCase();const msg=String(body?.message||body?.error||'').toLowerCase();return status==='error'||status==='failure'||status==='failed'||status==='false'||/authentication failure|invalid|expired|unauthori[sz]ed|not verified|failed/.test(msg)}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const {phone,accessToken,name}=await req.json(),mobile=cleanPhone(phone),token=String(accessToken||'').trim();
    if(!/^91\d{10}$/.test(mobile)||!token)return json({error:'A verified Indian mobile number and MSG91 access token are required.'},400);
    const authkey=Deno.env.get('MSG91_AUTH_KEY');if(!authkey)return json({error:'MSG91 server verification is not configured. Add MSG91_AUTH_KEY in Supabase Edge Function secrets.'},500);
    const r=await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({authkey,'access-token':token})});
    const body=await r.json().catch(()=>({}));if(!r.ok||explicitFailure(body))return json({error:String(body?.message||body?.error||'MSG91 access token verification failed.')},401);

    // MSG91 documents this endpoint as returning verified user information. Also inspect the already server-verified JWT payload as a compatibility fallback.
    const verifiedIdentifier=findIdentifier(body)||findIdentifier(decodeJwtPayload(token));
    if(verifiedIdentifier){const verifiedPhone=cleanPhone(verifiedIdentifier);if(/^91\d{10}$/.test(verifiedPhone)&&verifiedPhone!==mobile)return json({error:'Verified mobile number does not match the requested number.'},401)}

    const db=admin(),now=new Date().toISOString();let {data:customer,error:lookupError}=await db.from('customers').select('*').eq('phone',mobile).maybeSingle();if(lookupError)throw lookupError;
    const newCustomer=!customer;
    if(!customer){const q=await db.from('customers').insert({phone:mobile,name:String(name||'').trim().slice(0,120),business_name:'',job_title:'',last_seen_at:now,updated_at:now}).select().single();if(q.error)throw q.error;customer=q.data}
    else{const nextName=String(customer.name||name||'').trim().slice(0,120);const q=await db.from('customers').update({name:nextName,last_seen_at:now,updated_at:now}).eq('id',customer.id).select().single();if(q.error)throw q.error;customer=q.data}

    const sessionToken=crypto.randomUUID()+crypto.randomUUID(),token_hash=await hashToken(sessionToken),expires=new Date(Date.now()+1000*60*60*24*30).toISOString();
    await db.from('customer_sessions').delete().eq('customer_id',customer.id).lt('expires_at',now);
    const ins=await db.from('customer_sessions').insert({customer_id:customer.id,token_hash,expires_at:expires});if(ins.error)throw ins.error;
    await db.from('customer_activity').insert({customer_id:customer.id,event_type:'phone_verified',payload:{provider:'MSG91 Widget'}});
    return json({ok:true,newCustomer,session:{token:sessionToken,customerId:customer.id,phone:customer.phone,name:customer.name,businessName:customer.business_name||'',jobTitle:customer.job_title||'',expiresAt:expires}});
  }catch(e){return json({error:e instanceof Error?e.message:'OTP verification failed.'},500)}
})
