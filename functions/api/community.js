import {json,readJSON} from './_utils.js';
export async function onRequestGet({env}){
  if(!env.DB)return json({questions:[]});
  try{const {results=[]}=await env.DB.prepare("SELECT id,display_name,subject,question,answer,created_at FROM community_questions WHERE status='approved' ORDER BY created_at DESC LIMIT 50").all();return json({questions:results});}
  catch{return json({error:'Community board is temporarily unavailable.'},500)}
}
export async function onRequestPost({request,env}){
  if(!env.DB)return json({error:'Community database is not configured yet.'},503);
  const d=await readJSON(request);
  if(String(d.website||'').trim())return json({ok:true}); // honeypot
  const display=String(d.displayName||'Student').trim().replace(/[<>]/g,'').slice(0,28)||'Student';
  const subject=String(d.subject||'General').trim().slice(0,60);
  const question=String(d.question||'').trim().slice(0,900);
  if(subject.length<2||question.length<15)return json({error:'Choose a subject and write at least 15 characters.'},400);
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const material=new TextEncoder().encode(ip+'|'+String(env.ADMIN_SESSION_SECRET||'mfso-community'));
  const digest=await crypto.subtle.digest('SHA-256',material);
  const rateKey=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
  try{
    const recent=await env.DB.prepare('SELECT COUNT(*) AS n FROM community_questions WHERE rate_key=? AND created_at>?').bind(rateKey,Date.now()-60*60*1000).first();
    if((recent?.n||0)>=3)return json({error:'Please wait before submitting another doubt. You can submit up to 3 per hour.'},429);
    const id=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO community_questions(id,display_name,subject,question,answer,status,rate_key,created_at) VALUES(?,?,?,?,?,'pending',?,?)").bind(id,display,subject,question,'',rateKey,Date.now()).run();
    return json({ok:true,message:'Your doubt was sent for review. It will appear after approval.'});
  }catch{return json({error:'Could not save your doubt. Please try again later.'},500)}
}
