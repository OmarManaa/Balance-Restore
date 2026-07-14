const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
async function getContent(env){const row=await env.DB.prepare("SELECT content FROM site_content WHERE id = 1").first();if(row?.content)return JSON.parse(row.content);const fallback=await env.ASSETS.fetch(new Request("https://assets.local/default-content.json"));return fallback.json();}
function adminAllowed(request, env) {
  const url = new URL(request.url);

  // Allow admin access during local development only
  const isLocal =
    url.hostname === "127.0.0.1" ||
    url.hostname === "localhost" ||
    url.hostname === "::1";

  if (isLocal) {
    return true;
  }

  // Production: require Cloudflare Access authentication
  const email = request.headers.get(
    "Cf-Access-Authenticated-User-Email"
  );

  return Boolean(
    email &&
    (!env.ADMIN_EMAIL ||
      email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase())
  );
}
export default{async fetch(request,env){const url=new URL(request.url);if(url.pathname==="/api/content"&&request.method==="GET")return json(await getContent(env));if(url.pathname==="/api/admin/content"){if(!adminAllowed(request,env))return json({error:"Unauthorized. Protect /admin/* and /api/admin/* with Cloudflare Access."},401);if(request.method==="GET")return json(await getContent(env));if(request.method==="PUT"){let body;try{body=await request.json()}catch{return json({error:"Invalid JSON"},400)}await env.DB.prepare(`INSERT INTO site_content (id, content, updated_at) VALUES (1, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET content=excluded.content, updated_at=datetime('now')`).bind(JSON.stringify(body)).run();return json({ok:true});}}return env.ASSETS.fetch(request);}};
