import {json,readJSON} from './_utils.js';
export async function onRequestPost({request,env}){
 const d=await readJSON(request);const type=String(d.type||'Suggestion').slice(0,60),subject=String(d.subject||'Not specified').slice(0,180),message=String(d.message||'').trim().slice(0,3500),contact=String(d.contact||'Not provided').slice(0,180),page=String(d.page||'').slice(0,300);
 if(message.length<8)return json({error:'Please enter at least 8 characters.'},400);
 if(!env.TG_BOT_TOKEN||!env.TG_CHAT_ID)return json({error:'Feedback delivery is not configured yet. Please contact @arjunx18.'},503);
 const text=`📩 MISSION FREE STUDY OFFICIAL — NEW FEEDBACK\nType: ${type}\nSubject: ${subject}\nMessage:\n${message}\nContact: ${contact}\nPage: ${page}`;
 try{const r=await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:env.TG_CHAT_ID,text,disable_web_page_preview:true})});const out=await r.json();if(!r.ok||!out.ok)return json({error:'Telegram did not accept the feedback. Please try again later.'},502);if(env.DB)await env.DB.prepare('INSERT INTO feedback(type,subject,message,created_at) VALUES(?,?,?,?)').bind(type,subject,message,Date.now()).run();return json({ok:true});}catch{return json({error:'Could not reach Telegram. Please try again.'},502)}
}
