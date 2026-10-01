import {D,L} from './data.js';

const $=i=>document.getElementById(i),NS='http://www.w3.org/2000/svg';
const COL={a:'#6366f1',b:'#f97316',t:'#14b8a6',r:'#f43f5e',c:'#64748b',s:'#22c55e',l:'#a855f7',g:'#0ea5e9',f:'#ec4899',e:'#eab308',x:'#14b8a6'},ICO={s:'≡',l:'⇅',g:'♂',f:'♀',e:'⌂',x:'•'};
const B0=[];D.split(';').map(s=>s.trim()).forEach(s=>{const[id,t,x,y]=s.split(',');B0.push({id,t,x:+x,y:+y})});let N={},segs,G,V,stubs,FL=0;const k=p=>p[0].toFixed(1)+','+p[1].toFixed(1),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const svg=$('map'),vp=$('vp');const mk=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const x in a)e.setAttribute(x,a[x]);(p||vp).appendChild(e);return e};
const lab=n=>n.t=='g'?'Gents Washroom':n.t=='f'?'Ladies Washroom':n.id;
// ---- graph build: split corridors at intersections, snap nodes to nearest corridor ----
function build(fl){N={};const gone=fl==1?['LOBBY','FACULTY LOUNGE','KIIT CAFE','STAIRS-7','LIFT-13','LIFT-14']:fl>1?['FACULTY LOUNGE','KIIT CAFE','STAIRS-12']:[];B0.forEach(o=>{if(fl&&(o.t=='e'||gone.includes(o.id)))return;const id=fl>1&&o.id=='LOBBY'?'LIBRARY':fl&&/^[ABC]-0\d\d$/.test(o.id)?o.id.slice(0,2)+fl+o.id.slice(3):o.id;N[id]={...o,id}});
$('roads').innerHTML='';$('nodes').innerHTML='';segs=[];G={};V={};stubs=[];
L.filter((_,i)=>!(fl==1?[1,17,18,19,20]:fl>1?[1,19]:[]).includes(i)).map(p=>fl>1&&p.length==3&&p[2][0]==747&&p[2][1]==820?[p[0],p[1],[719,820]]:p).forEach(p=>{for(let i=0;i<p.length-1;i++)segs.push({a:p[i],b:p[i+1],p:[p[i],p[i+1]]})});
function ix(s,t){const[x1,y1]=s.a,[x2,y2]=s.b,[x3,y3]=t.a,[x4,y4]=t.b,d=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3);if(!d)return null;
const u=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/d,v=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/d;return u>=0&&u<=1&&v>=0&&v<=1?[x1+u*(x2-x1),y1+u*(y2-y1)]:null}
for(let i=0;i<segs.length;i++)for(let j=i+1;j<segs.length;j++){const p=ix(segs[i],segs[j]);if(p){segs[i].p.push(p);segs[j].p.push(p)}}

const link=(a,b,w)=>{(G[a]=G[a]||[]).push({k:b,w});(G[b]=G[b]||[]).push({k:a,w})};
Object.values(N).forEach(n=>{let best=1e9,bp,bs;segs.forEach(s=>{const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],u=Math.max(0,Math.min(1,((n.x-s.a[0])*dx+(n.y-s.a[1])*dy)/(dx*dx+dy*dy))),p=[s.a[0]+u*dx,s.a[1]+u*dy],d=dist(p,[n.x,n.y]);if(d<best){best=d;bp=p;bs=s}});
bs.p.push(bp);n.proj=bp;stubs.push([n,bp]);});
segs.forEach(s=>{const q=s.p.map(p=>({p,d:dist(p,s.a)})).sort((a,b)=>a.d-b.d);for(let i=0;i<q.length-1;i++){const a=k(q[i].p),b=k(q[i+1].p);V[a]=q[i].p;V[b]=q[i+1].p;if(a!=b)link(a,b,q[i+1].d-q[i].d)}});
stubs.forEach(([n,p])=>{link(n.id,k(p),dist(p,[n.x,n.y])+1);V[n.id]=[n.x,n.y]});
function dij(src){const d={[src]:0},pr={},done=new Set();while(1){let u=null;for(const x in d)if(!done.has(x)&&(u===null||d[x]<d[u]))u=x;if(u===null)break;done.add(u);(G[u]||[]).forEach(e=>{if(d[u]+e.w<(d[e.k]??1e12)){d[e.k]=d[u]+e.w;pr[e.k]=u}})}return{d,pr}}
// ---- draw ----
segs.forEach(s=>mk('line',{x1:s.a[0],y1:s.a[1],x2:s.b[0],y2:s.b[1],stroke:'#2e2e2e','stroke-width':2.5,'stroke-linecap':'round'},$('roads')));
stubs.forEach(([n,p])=>mk('line',{x1:n.x,y1:n.y,x2:p[0],y2:p[1],stroke:'#2e2e2e','stroke-width':2.5},$('roads')));
Object.values(N).forEach(n=>{const g=mk('g',{class:'nd'},$('nodes'));n.t.match(/[abtrc]/)?mk('rect',{x:n.x-12,y:n.y-8,width:24,height:16,rx:4,fill:COL[n.t]},g):(mk('circle',{cx:n.x,cy:n.y,r:9,fill:'#000',stroke:COL[n.t],'stroke-width':1.5},g),mk('text',{x:n.x,y:n.y+4,'text-anchor':'middle','font-size':11,fill:COL[n.t],style:'pointer-events:none'},g).textContent=ICO[n.t]);
const gl=mk('g',{class:'nl'},g);mk('text',{x:n.x,y:n.y+(n.t.match(/[abtrc]/)?20:21)},gl).textContent=lab(n).toUpperCase();
g.onclick=()=>{if(moved)return;!$('s').value?pick('s',n.id):pick('e',n.id)};n.el=g});
}
// ---- pan / zoom ----
let vb={x:100,y:10,w:1120,h:920};const fit=()=>{const r=svg.getBoundingClientRect(),a=r.width/r.height;vb.h=920;vb.w=920*a;if(vb.w<1120){vb.w=1120;vb.h=1120/a}vb.x=650-vb.w/2;vb.y=470-vb.h/2;set()};
const set=()=>svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
const pts=new Map();let moved=0,pd=0;
function zoom(f,cx,cy){const r=svg.getBoundingClientRect(),px=vb.x+(cx-r.left)/r.width*vb.w,py=vb.y+(cy-r.top)/r.height*vb.h;vb.w*=f;vb.h*=f;vb.x=px-(cx-r.left)/r.width*vb.w;vb.y=py-(cy-r.top)/r.height*vb.h;set()}
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.12:.89,e.clientX,e.clientY)},{passive:false});
svg.addEventListener('pointerdown',e=>{pts.set(e.pointerId,e);moved=0;pd=0});
svg.addEventListener('pointermove',e=>{const o=pts.get(e.pointerId);if(!o)return;const r=svg.getBoundingClientRect();
if(pts.size==1){const dx=e.clientX-o.clientX,dy=e.clientY-o.clientY;if(Math.abs(dx)+Math.abs(dy)>0)moved+=Math.abs(dx)+Math.abs(dy);vb.x-=dx/r.width*vb.w;vb.y-=dy/r.height*vb.h;set()}
else if(pts.size==2){pts.set(e.pointerId,e);const[a,b]=[...pts.values()],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(pd)zoom(pd/d,(a.clientX+b.clientX)/2,(a.clientY+b.clientY)/2);pd=d;moved=9}
pts.set(e.pointerId,e)});
['pointerup','pointercancel','pointerleave'].forEach(t=>svg.addEventListener(t,e=>{pts.delete(e.pointerId);setTimeout(()=>moved=0,0)}));
// ---- search fields ----
const sel={s:null,e:null};
function field(f,inp,dd,x){const i=$(inp),d=$(dd);const show=()=>{const q=i.value.toLowerCase();d.innerHTML='';const KIND={a:'CLASSROOM',b:'CLASSROOM',t:'CLASSROOM',r:'CLASSROOM',c:'CLASSROOM',s:'STAIRS',l:'LIFT',g:'WASHROOM',f:'WASHROOM',e:'ENTRANCE',x:'PLACE'};Object.values(N).filter(n=>(n.id+lab(n)+KIND[n.t]).toLowerCase().includes(q)).sort((a,b)=>(b.id.toLowerCase()==q)-(a.id.toLowerCase()==q)).slice(0,30).forEach(n=>{const o=document.createElement('div'),ex=q&&n.id.toLowerCase()==q,ty=q&&!ex&&KIND[n.t].toLowerCase().includes(q)&&!n.id.toLowerCase().includes(q);o.innerHTML=`<span>${lab(n)+(n.t.match(/[gf]/)?' ('+n.id+')':'')}</span><span>${ex?'<span class="bd ex">EXACT</span>':''}${ty?'<span class="bd">TYPE</span>':''}<span class="bd">${KIND[n.t]}</span></span>`;o.onmousedown=ev=>{ev.preventDefault();pick(f,n.id)};d.appendChild(o)});d.style.display=d.children.length?'block':'none'};
i.oninput=()=>{sel[f]=null;show();ui()};i.onfocus=show;i.onblur=()=>d.style.display='none';$(x).onclick=()=>{i.value='';sel[f]=null;route();ui()}}
function pick(f,id){sel[f]=id;$(f).value=lab(N[id]);$(f=='s'?'sd':'ed').style.display='none';route();ui();}
field('s','s','sd','sx');field('e','e','ed','ex');
const ui=()=>{$('sx').hidden=!$('s').value;$('ex').hidden=!$('e').value;$('clr').style.display=($('s').value||$('e').value)?'block':'none';document.querySelectorAll('.qn button').forEach(b=>b.disabled=!sel.s)};
$('sw').onclick=()=>{const[a,b]=[sel.s,sel.e];sel.s=b;sel.e=a;$('s').value=b?lab(N[b]):'';$('e').value=a?lab(N[a]):'';route();ui()};
$('clr').onclick=()=>{sel.s=sel.e=null;$('s').value=$('e').value='';route();ui()};
document.querySelectorAll('.qn button').forEach(b=>b.onclick=()=>{const{d}=dij(sel.s),t=b.dataset.q;let best=null;Object.values(N).forEach(n=>{if(n.id!=sel.s&&n.t==t&&(t!='x'||n.id!='FACULTY LOUNGE')&&d[n.id]!=null&&(!best||d[n.id]<d[best]))best=n.id});best?pick('e',best):toast(t=='w'?'Water cooler locations not added yet':'None found')});
function toast(m){const t=$('toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',1800)}
// ---- routing + steps ----
let P=[],S=[],si=0;
function route(){const R=$('route'),c=$('cur');$('arrows').innerHTML='';P=[];S=[];if(!sel.s||!sel.e||sel.s==sel.e){R.removeAttribute('d');c.style.display='none';$('steps').style.display='none';return}
const{pr,d}=dij(sel.s);if(d[sel.e]==null){toast('No path found');return}let u=sel.e;const ids=[u];while(u!=sel.s){u=pr[u];ids.unshift(u)}
P=ids.map(i=>V[i]).filter((p,i,a)=>!i||k(p)!=k(a[i-1]));R.setAttribute('d','M'+P.map(p=>p.join(' ')).join('L'));arrows(P);
// merge collinear points, then describe legs
const M=[P[0]];for(let i=1;i<P.length-1;i++){const a=M[M.length-1],b=P[i],c2=P[i+1];if(Math.abs((b[0]-a[0])*(c2[1]-b[1])-(b[1]-a[1])*(c2[0]-b[0]))>1)M.push(b)}M.push(P[P.length-1]);
S=[{t:'Start at '+lab(N[sel.s]),p:P[0]}];for(let i=0;i<M.length-1;i++){const a=M[i],b=M[i+1],m=Math.round(dist(a,b)*.15);let tx=`Walk about ${m} m`;if(i<M.length-2){const c2=M[i+2],cr=(b[0]-a[0])*(c2[1]-b[1])-(b[1]-a[1])*(c2[0]-b[0]);tx+=Math.abs(cr)>1?(cr>0?', then turn right':', then turn left'):''}if(m>0)S.push({t:tx,p:b})}
S.push({t:'Arrive at '+lab(N[sel.e]),p:P[P.length-1]});go(0);$('steps').style.display='block';place()}
function arrows(P){let carry=30;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],len=dist(a,b),ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;for(let d=carry;d<len;d+=42){const x=a[0]+(b[0]-a[0])*d/len,y=a[1]+(b[1]-a[1])*d/len;mk('path',{d:'M-4 -4L5 0L-4 4Z',fill:'#7dd3fc',transform:`translate(${x} ${y}) rotate(${ang})`},$('arrows'));carry=d+42-len}carry=Math.max(carry,6)}}
function go(i){si=Math.max(0,Math.min(S.length-1,i));const s=S[si];$('sn').textContent=`STEP ${si+1} OF ${S.length}`;$('stx').textContent=s.t;$('pv').disabled=!si;$('nx').disabled=si==S.length-1;
$('sl').innerHTML=S.map((x,j)=>`<li class="${j==si?'on':''}">${j+1}. ${x.t}</li>`).join('');const c=$('cur');c.style.display='block';c.setAttribute('cx',s.p[0]);c.setAttribute('cy',s.p[1])}
$('pv').onclick=()=>go(si-1);$('nx').onclick=()=>go(si+1);$('ex2').onclick=()=>{const l=$('sl');l.style.display=l.style.display=='block'?'none':'block'};
const place=()=>{$('steps').style.top=(($('side').offsetHeight)+32)+'px'};
$('col').onclick=()=>{const h=$('sb').style.display=='none';$('sb').style.display=h?'block':'none';$('col').textContent=h?'‹':'›';place()};
$('gear').onclick=()=>svg.classList.toggle('nolab');
addEventListener('resize',()=>{fit();place()});const FLS=[['3F','3rd Floor',3],['2F','2nd Floor',2],['1F','1st Floor',1],['G','Ground Floor',0]];
$('fm').innerHTML='';FLS.forEach(([c,n,v,off])=>{const d=document.createElement('div');d.className=(v==FL?'on ':'')+(off?'off':'');d.innerHTML=`<b>${c}</b><span>${n}${off?' (soon)':''}</span>`;d.onmousedown=e=>{e.preventDefault();if(off)return;FL=v;$('fl').textContent=v?c:'GF';sel.s=sel.e=null;$('s').value=$('e').value='';build(v);route();ui();[...$('fm').children].forEach(x=>x.classList.remove('on'));d.classList.add('on');$('fm').style.display='none'};$('fm').appendChild(d)});
$('fb').onclick=()=>{const m=$('fm');m.style.display=m.style.display=='block'?'none':'block'};
build(0);fit();ui();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
