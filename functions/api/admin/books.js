import {json,isAdmin,readJSON} from '../_utils.js';
function driveLinks(input){
  let u;try{u=new URL(String(input||''))}catch{return null}
  if(!['drive.google.com','docs.google.com'].includes(u.hostname.toLowerCase()))return null;
  let id=(u.pathname.match(/\/file\/d\/([^/]+)/)||[])[1]||u.searchParams.get('id');
  if(!id)return null;
  return {preview:`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`};
}
function validImage(input){if(!input)return '';try{const u=new URL(input);return ['https:'].includes(u.protocol)?u.href:''}catch{return null}}
export async function onRequestGet({request,env}){
 if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
 if(!env.DB)return json({error:'D1 database is not configured.'},503);
 const {results=[]}=await env.DB.prepare('SELECT id,title,cover_key,pdf_key,created_at FROM books ORDER BY created_at DESC').all();
 return json({books:results.map(b=>({id:b.id,title:b.title,coverUrl:b.cover_key||'',pdfUrl:b.pdf_key}))});
}
export async function onRequestPost({request,env}){
 if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
 if(!env.DB)return json({error:'D1 database is not configured.'},503);
 const body=await readJSON(request),title=String(body.title||'').trim().slice(0,120),links=driveLinks(body.driveUrl),cover=validImage(String(body.coverUrl||'').trim());
 if(!title||!links)return json({error:'Enter a book name and a valid Google Drive file sharing link.'},400);
 if(cover===null)return json({error:'Cover image must be a valid HTTPS image URL.'},400);
 const id=crypto.randomUUID();
 try{await env.DB.prepare('INSERT INTO books(id,title,cover_key,pdf_key,created_at) VALUES(?,?,?,?,?)').bind(id,title,cover,links.preview,Date.now()).run();return json({ok:true,id})}
 catch(e){return json({error:'Could not save book. Check the D1 database and run migrations/0001_init.sql if this is a new database.'},500)}
}
export async function onRequestDelete({request,env}){
 if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
 if(!env.DB)return json({error:'D1 database is not configured.'},503);
 const id=new URL(request.url).searchParams.get('id');if(!id)return json({error:'Book id is required.'},400);
 await env.DB.prepare('DELETE FROM books WHERE id=?').bind(id).run();return json({ok:true});
}
