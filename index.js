const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"Content-Type":"application/json",...cors}});
async function authorized(req,env){
 const token=req.headers.get("CF-Access-Jwt-Assertion");if(!token)return false;const p=token.split(".");if(p.length!==3)return false;
 try{
  const decode=s=>JSON.parse(atob(s.replace(/-/g,"+").replace(/_/g,"/")));
  const h=decode(p[0]),b=decode(p[1]);if(!b.email||b.email.toLowerCase()!==env.ALLOWED_ADMIN_EMAIL.toLowerCase()||b.exp*1000<Date.now())return false;
  if(!Array.isArray(b.aud)||!b.aud.includes(env.ACCESS_AUD))return false;
  const cert=await (await fetch(env.ACCESS_CERTS_URL)).json(),jwk=cert.keys.find(k=>k.kid===h.kid);if(!jwk)return false;
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const sig=Uint8Array.from(atob(p[2].replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
  return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,sig,new TextEncoder().encode(p[0]+"."+p[1]));
 }catch{return false}
}
const err=(m,s=400)=>json({error:m},s);
export default {async fetch(req,env){
 const u=new URL(req.url),p=u.pathname,m=req.method;if(m==="OPTIONS")return new Response(null,{headers:cors});
 if(p==="/api/content"&&m==="GET"){const {results}=await env.DB.prepare("SELECT * FROM products ORDER BY created_at DESC").all();const a=await env.DB.prepare("SELECT value FROM settings WHERE key='announcement'").first();return json({products:results,announcement:a?.value||""})}
 if(!p.startsWith("/api/admin/"))return err("Not found",404);if(!(await authorized(req,env)))return err("Access denied. Sign in with the approved farm email.",401);
 if(p==="/api/admin/products"&&m==="POST"){const b=await req.json();if(!b.name||!b.category)return err("Name and category are required");const id=crypto.randomUUID();await env.DB.prepare("INSERT INTO products(id,name,category,price_ksh,availability,description,image_url,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(id,b.name,b.category,b.price_ksh??null,b.availability||"Available",b.description||"",b.image_url||"",Date.now()).run();return json({id})}
 const match=p.match(/^\/api\/admin\/products\/([^/]+)$/);
 if(match&&m==="PUT"){const b=await req.json(),old=await env.DB.prepare("SELECT * FROM products WHERE id=?").bind(match[1]).first();if(!old)return err("Listing not found",404);await env.DB.prepare("UPDATE products SET name=?,category=?,price_ksh=?,availability=?,description=?,image_url=? WHERE id=?").bind(b.name??old.name,b.category??old.category,b.price_ksh===undefined?old.price_ksh:b.price_ksh,b.availability??old.availability,b.description??old.description,b.image_url??old.image_url,match[1]).run();return json({ok:true})}
 if(match&&m==="DELETE"){await env.DB.prepare("DELETE FROM products WHERE id=?").bind(match[1]).run();return json({ok:true})}
 if(p==="/api/admin/announcement"&&m==="PUT"){const b=await req.json();await env.DB.prepare("INSERT INTO settings(key,value) VALUES('announcement',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(b.announcement||"").slice(0,500)).run();return json({ok:true})}
 if(p==="/api/admin/images"&&m==="POST"){const f=(await req.formData()).get("file");if(!f||typeof f==="string"||!f.type.startsWith("image/"))return err("Choose an image file");if(f.size>5*1024*1024)return err("Image must be 5 MB or smaller");const ext=(f.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg",key=crypto.randomUUID()+"."+ext;await env.IMAGES.put(key,f.stream(),{httpMetadata:{contentType:f.type}});return json({url:env.PUBLIC_IMAGE_BASE_URL.replace(/\/$/,"")+"/"+key})}
 return err("Not found",404)
}};