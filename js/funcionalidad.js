
{
const $=id=>document.getElementById(id);
const FAM=[{n:'Rojos',h:25},{n:'Naranjas',h:60},{n:'Amarillos',h:100},{n:'Verdes',h:145},{n:'Turquesas',h:195},{n:'Azules',h:258},{n:'Morados',h:315}];
const ROUNDS=21,LIMIT=10000,DMAX=14,DMIN=1.1;

// OKLCH -> sRGB lineal
const lin=(L,C,H)=>{const h=H*Math.PI/180,a=C*Math.cos(h),b=C*Math.sin(h);
  const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
  return[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]};
const inG=c=>c.every(v=>v>=-1e-4&&v<=1.0001);
const css=c=>'rgb('+c.map(v=>Math.round(255*Math.min(1,Math.max(0,v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)))).join(',')+')';

// Par de colores (base, distinto) separados por d/100 en OKLab, girando el tono
function pair(H,d){
  const L=.64+Math.random()*.12;let C=.14,dh;
  for(;C>.03;C-=.005){dh=2*Math.asin(Math.min(1,d/100/(2*C)))*180/Math.PI;
    if(inG(lin(L,C,H))&&inG(lin(L,C,H+dh))&&inG(lin(L,C,H-dh)))break}
  const sg=Math.random()<.5?1:-1;
  return{base:css(lin(L,C,H)),odd:css(lin(L,C,H+sg*dh))};
}
const pts=d=>Math.round(100*Math.min(1,Math.max(0,1-Math.log(d/DMIN)/Math.log(DMAX/DMIN))));

function draw(el,n,c,oddIdx,onPick){
  el.style.gridTemplateColumns=`repeat(${n},1fr)`;
  el.innerHTML=Array.from({length:n*n},(_,i)=>`<button class="tile" data-i="${i}" aria-label="Cuadro ${i+1}" style="background:${i===oddIdx?c.odd:c.base}"></button>`).join('');
  el.onclick=e=>{const t=e.target.closest('.tile');if(t)onPick(+t.dataset.i,t)};
}

// Demo de portada
function demo(){const odd=Math.floor(Math.random()*16);const f=FAM[Math.floor(Math.random()*7)];
  draw($('demo'),4,pair(f.h,16),odd,(i,t)=>{if(i===odd){t.classList.add('hit');setTimeout(start,250)}else{$('demo').classList.remove('shake');void $('demo').offsetWidth;$('demo').classList.add('shake')}})}
demo();

let st,timer,t0,raf;
function start(){
  const order=[];for(let k=0;k<3;k++)order.push(...FAM.map((_,i)=>i).sort(()=>Math.random()-.5));
  st={i:0,d:12,order,log:[],streak:0,best:0};
  $('intro').hidden=$('result').hidden=true;$('game').hidden=false;window.scrollTo(0,0);next();
}
function next(){
  if(st.i>=ROUNDS)return finish();
  const n=Math.min(2+Math.floor(st.i/4),6),f=FAM[st.order[st.i]],c=pair(f.h,st.d),odd=Math.floor(Math.random()*n*n);
  st.cur={f:st.order[st.i],d:st.d,c,odd,busy:false};
  $('round').textContent=`${st.i+1} / ${ROUNDS}`;$('prog').style.width=100*st.i/ROUNDS+'%';
  $('streak').textContent=st.streak>2?`Racha de ${st.streak}`:f.n;
  $('hint').textContent='¿Cuál es diferente?';
  draw($('board'),n,c,odd,pick);
  t0=performance.now();cancelAnimationFrame(raf);
  const tick=()=>{const p=(performance.now()-t0)/LIMIT;$('clock').style.width=Math.max(0,100-100*p)+'%';if(p>=1)pick(-1);else raf=requestAnimationFrame(tick)};tick();
}
function pick(i,t){
  const cur=st.cur;if(cur.busy)return;cur.busy=true;cancelAnimationFrame(raf);
  const ok=i===cur.odd,ms=Math.round(performance.now()-t0);
  st.log.push({f:cur.f,d:cur.d,ok,ms,col:cur.c.base,timeout:i<0});
  if(ok){t.classList.add('hit');st.streak++;st.best=Math.max(st.best,st.streak);st.d=Math.max(DMIN,st.d*.76)}
  else{st.streak=0;st.d=Math.min(DMAX,st.d*1.5);$('board').classList.remove('shake');void $('board').offsetWidth;$('board').classList.add('shake');
    $('board').children[cur.odd].classList.add('reveal');$('hint').textContent=i<0?'Se acabó el tiempo. Era este.':'Era este.'}
  st.i++;setTimeout(next,ok?260:1100);
}
const LV=[[85,'Ojo de halcón','Distingues matices que a la mayoría se le escapan. Tu percepción cromática es excelente en esta pantalla.'],
  [70,'Visión aguda','Detectas diferencias muy sutiles con consistencia. Un ojo muy entrenado para el color.'],
  [50,'Buena percepción','Distingues bien los colores en el día a día; los matices más finos aún se te resisten.'],
  [30,'Percepción moderada','Las diferencias pequeñas te cuestan. Prueba con más brillo y sin filtros de pantalla.'],
  [0,'Matices difíciles','Te costó separar los tonos. Revisa la pantalla y la luz; si se repite, consulta a un optometrista.']];
function finish(){
  cancelAnimationFrame(raf);$('game').hidden=true;$('result').hidden=false;window.scrollTo(0,0);
  const tail=st.log.slice(6),thr=Math.exp(tail.reduce((a,r)=>a+Math.log(r.d),0)/tail.length);
  const sc=pts(thr),lv=LV.find(l=>sc>=l[0]);
  $('score').innerHTML=`${sc}<small>/100</small>`;$('lvl').textContent=lv[1];$('desc').textContent=lv[2];
  const fs=FAM.map((f,k)=>{const hits=st.log.filter(r=>r.f===k&&r.ok);return{n:f.n,col:css(lin(.68,.12,f.h)),v:hits.length?pts(Math.min(...hits.map(r=>r.d))):0}});
  $('fams').innerHTML=fs.map(f=>`<div class="fam"><span>${f.n}</span><span class="t"><i style="width:${f.v}%;background:${f.col}"></i></span><span>${f.v}</span></div>`).join('');
  const avg=fs.reduce((a,f)=>a+f.v,0)/7,rg=(fs[0].v+fs[3].v)/2,top=[...fs].sort((a,b)=>b.v-a.v)[0],low=[...fs].sort((a,b)=>a.v-b.v)[0];
  $('famnote').textContent=avg-rg>25?'Tus rojos y verdes quedaron bastante por debajo del resto. Puede ser la pantalla o el azar, pero si te pasa seguido vale la pena una prueba de visión cromática.'
    :`Tu tono más fuerte: ${top.n.toLowerCase()}. El que más te costó: ${low.n.toLowerCase()}.`;
  $('dots').innerHTML=st.log.map((r,k)=>`<i class="${r.ok?'':'x'}" style="background:${r.col}" title="Ronda ${k+1}: ${FAM[r.f].n}, diferencia ${r.d.toFixed(1)}, ${r.ok?'acierto':r.timeout?'tiempo agotado':'fallo'}"></i>`).join('');
  const okN=st.log.filter(r=>r.ok).length,avgMs=st.log.reduce((a,r)=>a+r.ms,0)/ROUNDS;
  $('stats').textContent=`${okN} de ${ROUNDS} aciertos · racha máxima ${st.best} · ${(avgMs/1000).toFixed(1)} s promedio por ronda · diferencia mínima estable ${thr.toFixed(1)} ΔE`;
  let h=[];try{h=JSON.parse(localStorage.getItem('ojoCromatico')||'[]')}catch(e){}
  $('histCard').hidden=!h.length;
  $('hist').innerHTML=h.slice(-6).reverse().map(x=>`<span>${x.s} · ${new Date(x.t).toLocaleDateString('es-MX',{day:'numeric',month:'short'})}</span>`).join('')+(h.length?`<span>Mejor: ${Math.max(...h.map(x=>x.s))}</span>`:'');
  h.push({s:sc,t:Date.now()});try{localStorage.setItem('ojoCromatico',JSON.stringify(h.slice(-20)))}catch(e){}
  st.text=`Mi ojo cromático: ${sc}/100 (${lv[1]}). Mejor tono: ${top.n.toLowerCase()}. ¿Puedes superarme?`;
}
$('again').onclick=start;
$('share').onclick=async()=>{try{await navigator.clipboard.writeText(st.text);$('share').textContent='¡Copiado!'}catch(e){$('share').textContent='No se pudo copiar'}setTimeout(()=>$('share').textContent='Copiar resultado',1800)};
}
