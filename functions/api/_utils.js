export const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
export async function readJSON(request){try{return await request.json()}catch{return {}}}
const enc=s=>new TextEncoder().encode(s);
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function signature(value,secret){const key=await crypto.subtle.importKey('raw',enc(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64u(await crypto.subtle.sign('HMAC',key,enc(value)));}
export async function makeSession(secret){const payload=b64u(enc(JSON.stringify({exp:Date.now()+8*60*60*1000,nonce:crypto.randomUUID()})));return payload+'.'+await signature(payload,secret)}
export async function isAdmin(request,env){const cookie=request.headers.get('Cookie')||'';const token=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('mfso_admin='))?.slice(11);if(!token||!env.ADMIN_SESSION_SECRET)return false;const [payload,sig]=token.split('.');if(!payload||!sig)return false;const expected=await signature(payload,env.ADMIN_SESSION_SECRET);if(sig.length!==expected.length)return false;let diff=0;for(let i=0;i<sig.length;i++)diff|=sig.charCodeAt(i)^expected.charCodeAt(i);if(diff)return false;try{const raw=atob(payload.replace(/-/g,'+').replace(/_/g,'/'));const obj=JSON.parse(decodeURIComponent(escape(raw)));return obj.exp>Date.now()}catch{return false}}
export const adminCookie=token=>`mfso_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
export const clearAdminCookie='mfso_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
