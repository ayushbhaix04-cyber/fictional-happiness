import {json,readJSON,isAdmin} from '../_utils.js';
export async function onRequestGet({request,env}){
  if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
  if(!env.DB)return json({error:'D1 database is not configured.'},503);
  try{const {results=[]}=await env.DB.prepare("SELECT id,display_name,subject,question,answer,status,created_at FROM community_questions WHERE status IN ('pending','approved') ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 100").all();return json({questions:results});}
  catch{return json({error:'Could not load community submissions.'},500)}
}
export async function onRequestPost({request,env}){
  if(!await isAdmin(request,env))return json({error:'Please sign in again.'},401);
  if(!env.DB)return json({error:'D1 database is not configured.'},503);
  const d=await readJSON(request),id=String(d.id||''),action=String(d.action||'');
  if(!id||!['approve','reject'].includes(action))return json({error:'Invalid moderation request.'},400);
  const answer=String(d.answer||'').trim().slice(0,1800);
  try{
    if(action==='reject')await env.DB.prepare("UPDATE community_questions SET status='rejected' WHERE id=?").bind(id).run();
    else await env.DB.prepare("UPDATE community_questions SET status='approved',answer=?,answered_at=? WHERE id=?").bind(answer,Date.now(),id).run();
    return json({ok:true});
  }catch{return json({error:'Could not update this submission.'},500)}
}
