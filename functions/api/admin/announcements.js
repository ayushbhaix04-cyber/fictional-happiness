import {json,readJSON,isAdmin} from '../_utils.js';
export async function onRequestGet({request,env}){
  if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
  if(!env.DB)return json({error:'D1 database is not configured.'},503);
  const {results=[]}=await env.DB.prepare('SELECT id,title,body,created_at FROM announcements ORDER BY created_at DESC LIMIT 30').all();return json({announcements:results});
}
export async function onRequestPost({request,env}){
  if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
  if(!env.DB)return json({error:'D1 database is not configured.'},503);
  const d=await readJSON(request),title=String(d.title||'').trim().slice(0,100),body=String(d.body||'').trim().slice(0,700);
  if(title.length<3||body.length<5)return json({error:'Enter an announcement title and message.'},400);
  const id=crypto.randomUUID();
  try{await env.DB.prepare('INSERT INTO announcements(id,title,body,created_at) VALUES(?,?,?,?)').bind(id,title,body,Date.now()).run();return json({ok:true,id});}
  catch{return json({error:'Could not publish announcement.'},500)}
}
export async function onRequestDelete({request,env}){
  if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
  if(!env.DB)return json({error:'D1 database is not configured.'},503);
  const id=new URL(request.url).searchParams.get('id');if(!id)return json({error:'Announcement id is required.'},400);
  await env.DB.prepare('DELETE FROM announcements WHERE id=?').bind(id).run();return json({ok:true});
}
