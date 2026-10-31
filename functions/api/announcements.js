import {json} from './_utils.js';
export async function onRequestGet({env}){
  if(!env.DB)return json({announcements:[]});
  try{const {results=[]}=await env.DB.prepare('SELECT id,title,body,created_at FROM announcements ORDER BY created_at DESC LIMIT 12').all();return json({announcements:results});}
  catch{return json({error:'Announcements are temporarily unavailable.'},500)}
}
