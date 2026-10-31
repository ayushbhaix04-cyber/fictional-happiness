import {json} from './_utils.js';
export async function onRequestGet({env}){
 if(!env.DB)return json({error:'Book database is not configured.'},503);
 try{const {results=[]}=await env.DB.prepare('SELECT id,title,cover_key,pdf_key,created_at FROM books ORDER BY created_at DESC').all();return json({books:results.map(b=>({id:b.id,title:b.title,coverUrl:b.cover_key||'',pdfUrl:b.pdf_key}))})}
 catch{return json({error:'Could not load books.'},500)}
}
