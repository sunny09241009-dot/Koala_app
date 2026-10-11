import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
const upstream='https://koala-mommy.sunny09241009.chatgpt.site';
const allowedOrigin='https://sunny09241009-dot.github.io';
const maxBody=12000;
export function createGateway(fetcher=fetch){return createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');res.setHeader('X-Content-Type-Options','nosniff');
 const origin=req.headers.origin;
 if(origin===allowedOrigin){res.setHeader('Access-Control-Allow-Origin',allowedOrigin);res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Max-Age','600')}
 const reply=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value))};
 try{
  const url=new URL(req.url,'http://localhost');
  if(origin&&origin!==allowedOrigin)return reply(403,{error:'无法接受此请求'});
  if(req.method==='GET'&&url.pathname==='/')return reply(200,{ok:true,message:'考拉连接入口已运行，接下来请设置 App 的服务网址。'});
  if(url.pathname!=='/api/signal')return reply(404,{error:'找不到这个页面'});
  if(req.method==='OPTIONS'){if(origin!==allowedOrigin)return reply(403,{error:'无法接受此请求'});res.writeHead(204);return res.end()}
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'不支持的操作'});
  if(req.method==='POST'&&origin!==allowedOrigin)return reply(403,{error:'无法接受此请求'});
  const headers={'Origin':upstream,'Accept':'application/json','User-Agent':'Mozilla/5.0 (compatible; KoalaConnection/1.0)'};
const auth=req.headers.authorization?.trim();if(auth&&auth!=='Bearer'){if(auth.length>120||!/^Bearer [A-Za-z0-9_-]*$/.test(auth))return reply(401,{error:'配对凭证无效'});headers.Authorization=auth}
  let body;
  if(req.method==='POST'){
   const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBody)return reply(413,{error:'内容太长了'});parts.push(chunk)}
   body=Buffer.concat(parts).toString('utf8');headers['Content-Type']='application/json';
   try{JSON.parse(body)}catch{return reply(400,{error:'消息格式错误'})}
  }
  // Forward only to the fixed service; browser headers, cookies and redirects are never forwarded.
  const target=new URL('/api/signal',upstream);const before=url.searchParams.get('before');if(before){if(before.length>40)return reply(400,{error:'消息编号无效'});target.searchParams.set('before',before)}
  const response=await fetcher(target,{method:req.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(18000)});
  if(response.status>=300&&response.status<400)return reply(502,{error:'连接服务暂时不可用，请稍后再试'});
  const text=await response.text();let value;try{value=JSON.parse(text)}catch{return reply(502,{error:'连接服务暂时不可用，请稍后再试'})}
  reply(response.status,value);
 }catch{if(!res.headersSent)reply(502,{error:'暂时连不上服务，请稍后重试'});else res.end()}
})}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=createGateway();server.requestTimeout=25000;server.headersTimeout=20000;server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Koala connection ready'));}
