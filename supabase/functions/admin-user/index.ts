import { cors,json,admin,requirePortalUser } from '../_shared.ts'
const emailFor=(username:string)=>username.trim().toLowerCase().replace(/[^a-z0-9._-]/g,'')+'@staff.oneline.local'
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const portal=await requirePortalUser(req,['admin']);if(!portal)return json({error:'Admin authorization required.'},403);const body=await req.json(),db=admin();
    if(body.action==='create'){
      const username=String(body.username||'').trim(),password=String(body.password||''),name=String(body.name||'').trim(),role=String(body.role||'staff');
      if(!username||password.length<8||!name||!['admin','management','staff','receiver'].includes(role))return json({error:'Name, username, role and an 8+ character password are required.'},400);
      const created=await db.auth.admin.createUser({email:emailFor(username),password,email_confirm:true,user_metadata:{username,name,role}});if(created.error)throw created.error;
      const q=await db.from('profiles').insert({id:created.data.user.id,username,name,role,active:true}).select().single();if(q.error){await db.auth.admin.deleteUser(created.data.user.id);throw q.error}return json({ok:true,profile:q.data});
    }
    if(body.action==='update'){
      const id=String(body.id||''),patch:any={};for(const k of ['name','role','active'])if(body[k]!==undefined)patch[k]=body[k];patch.updated_at=new Date().toISOString();if(patch.role&&!['admin','management','staff','receiver'].includes(patch.role))return json({error:'Invalid role.'},400);
      const q=await db.from('profiles').update(patch).eq('id',id).select().single();if(q.error)throw q.error;if(body.password){const u=await db.auth.admin.updateUserById(id,{password:String(body.password)});if(u.error)throw u.error}return json({ok:true,profile:q.data});
    }
    return json({error:'Unsupported action.'},400);
  }catch(e){return json({error:e instanceof Error?e.message:'Account action failed.'},400)}
})
