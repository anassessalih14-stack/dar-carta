import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const engine=fs.readFileSync('public/engine.js','utf8').replace(/^export /gm,'');
const api=fs.readFileSync('worker/api.js','utf8').replace(/^import .*;\r?\n/,'').replace(/^export /gm,'');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const assets={};for(const name of fs.readdirSync('public')){const f=path.join('public',name);if(fs.statSync(f).isFile())assets['/'+name]={type:types[path.extname(f)]||'text/plain',body:fs.readFileSync(f,'utf8')};}
const worker=engine+'\n'+api+'\nconst assets='+JSON.stringify(assets)+';\nexport default { async fetch(request,env){const u=new URL(request.url);if(u.pathname.startsWith("/api/"))return apiFetch(request,env);if(!["GET","HEAD"].includes(request.method))return new Response("Method not allowed",{status:405});const a=assets[u.pathname==="/"?"/index.html":u.pathname];return a?new Response(request.method==="HEAD"?null:a.body,{headers:{"Content-Type":a.type,"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff"}}):new Response("Not found",{status:404});}};\n';
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});fs.writeFileSync('dist/server/index.js',worker);fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});console.log('Built self-contained friend-table Worker.');
