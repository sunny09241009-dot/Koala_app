// 考拉抱抱 7.9：考拉摇动抽签
const root=new URL(self.registration.scope);
const icon=new URL('apple-touch-icon.png',root).href;
function appUrl(value){try{const url=new URL(value||root.href,root);if(url.origin===root.origin&&url.pathname===root.pathname){if(url.searchParams.get('view')==='friends'&&/^[0-9a-f-]{36}$/i.test(url.searchParams.get('conversation')||''))return root.href+'?view=friends&conversation='+url.searchParams.get('conversation');return root.href+(url.searchParams.get('view')==='chat'?'?view=chat':'')}}catch{}return root.href}
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let p={title:'考拉抱抱',body:'有人在呼唤你，打开看看吧。',url:root.href};try{if(e.data)p=e.data.json()}catch{}e.waitUntil(self.registration.showNotification(p.title,{body:p.body,icon,badge:icon,tag:p.id||'koala',data:{url:appUrl(p.url)}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=appUrl(e.notification.data?.url);e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async list=>{for(const c of list){const current=new URL(c.url);if(current.origin===root.origin&&current.pathname===root.pathname){if(url.includes('?view=chat'))c.postMessage({type:'open-chat'});if(url.includes('?view=friends'))c.postMessage({type:'open-friends',conversation:new URL(url).searchParams.get('conversation')});return c.focus()}}return self.clients.openWindow(url)}))});
