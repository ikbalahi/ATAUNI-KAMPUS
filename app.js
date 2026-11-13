(async function(){
 'use strict';
 const C=window.CampusCartography,$=s=>document.querySelector(s),e=C.esc;
 let data,geo;
 try{[data,geo]=await Promise.all([fetch('./assets/guide.json?v=20261029').then(r=>{if(!r.ok)throw Error('guide');return r.json()}),fetch('./assets/campus.geojson?v=20261029').then(r=>{if(!r.ok)throw Error('geo');return r.json()})]);}
 catch(err){$('#welcome-title').textContent='Rehber yüklenemedi.';$('.welcome-copy .lede').textContent='İnternet bağlantınızı kontrol edip sayfayı yeniden açın. Resmî kanallara Takvim ve kaynaklar bölümünden ulaşabilirsiniz.';console.error(err);return;}
 const source=id=>data.sources.find(s=>s.id===id);
 const link=(id,label)=>{const s=source(id);return s?`<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(label||s.title)}</a>`:'';};
 const fallback=ids=>`<details class="link-fallback"><summary>Bağlantı açılmıyor mu?</summary>${[...new Set(ids)].map(id=>{const s=source(id);return s?`<div class="fallback-row">${e(s.title)}<a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.url)}</a><button type="button" data-copy="${e(s.url)}">Adresi kopyala</button></div>`:'';}).join('')}</details>`;
 function setRoute(){
  const [tabName,query]=location.hash.slice(1).split('?'),name=['baslangic','harita','basvuru','kaynaklar'].includes(tabName)?tabName:'baslangic';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.id===name));
  document.querySelectorAll('.topbar nav a').forEach(a=>{const active=a.getAttribute('href')==='#'+name;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(name==='basvuru'&&query){const s=data.services.find(s=>s.id===decodeURIComponent(query));if(s){$('#service-search').value='';serviceCategory='Tümü';renderServices();const details=$(`[data-service="${s.id}"]`);if(details){details.open=true;requestAnimationFrame(()=>details.scrollIntoView({block:'center',behavior:'instant'}));}}}
  if(name==='harita'){requestAnimationFrame(()=>{renderPlaces();updateScale();});if(query){const p=data.pois.find(p=>p.id===decodeURIComponent(query));if(p){mapCategory='Tümü';$('#place-search').value='';selectPlace(p.id);}}}
  if(!query)window.scrollTo({top:0,behavior:'instant'});
 }
 $('#calendar-rows').innerHTML=data.calendar.map(row=>`<tr>${row.map(cell=>`<td>${e(cell)}</td>`).join('')}</tr>`).join('');
 $('#calendar-tip-rows').innerHTML=data.calendarTip.map(row=>`<tr>${row.map(cell=>`<td>${e(cell)}</td>`).join('')}</tr>`).join('');
 $('#calendar-dis-rows').innerHTML=data.calendarDis.map(row=>`<tr>${row.map(cell=>`<td>${e(cell)}</td>`).join('')}</tr>`).join('');
 $('#calendar-dis5-rows').innerHTML=data.calendarDis5.map(row=>`<tr>${row.map(cell=>`<td>${e(cell)}</td>`).join('')}</tr>`).join('');
 $('#sources').innerHTML=data.sources.map(s=>`<div class="source-item"><div><strong>${e(s.title)}</strong><a class="source-url" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.url)}</a></div><button class="copy" data-copy="${e(s.url)}" aria-label="${e(s.title)} adresini kopyala">Kopyala</button></div>`).join('');
 let serviceCategory='Tümü';
 const serviceCategories=['Tümü',...new Set(data.services.map(s=>s.category))];
 const norm=s=>String(s).normalize('NFKD').replace(/\p{Diacritic}/gu,'').replace(/ı/g,'i').toLowerCase();
 function renderServices(){
  const q=norm($('#service-search').value),list=data.services.filter(s=>(serviceCategory==='Tümü'||s.category===serviceCategory)&&norm(s.title+' '+s.question+' '+s.body+' '+s.action+' '+s.category).includes(q));
  $('#service-filters').innerHTML=serviceCategories.map(c=>`<button type="button" data-service-category="${e(c)}" aria-pressed="${c===serviceCategory}">${e(c)}</button>`).join('');
  $('#service-count').textContent=`${list.length} başvuru ve hizmet konusu`;
  $('#services').innerHTML=list.length?list.map(s=>{
   const phone=s.phone?`<a href="tel:+90${s.phone.replace(/\D/g,'').replace(/^0/,'')}">${e(s.phone)}</a>`:'',mail=s.email?`<a href="mailto:${e(s.email)}">${e(s.email)}</a>`:'';
   const poi=s.places.map(id=>data.pois.find(p=>p.id===id)).filter(Boolean);
   const osmSources=s.id==='banka'||s.id==='market'?` <span class="inline-sources">${poi.slice(0,3).map(p=>`<a href="${e(p.source)}" target="_blank" rel="noopener noreferrer">OSM: ${e(p.name)}</a>`).join('')}</span>`:'';
   return `<details class="service" data-service="${e(s.id)}"><summary><span class="service-category">${e(s.category)}</span><span><span class="service-title">${e(s.title)}</span><span class="service-question">${e(s.question)}</span></span><span class="service-indicator" aria-hidden="true">+</span></summary><div class="service-content"><p>${e(s.body)} ${link(s.sourceIds[0],'Resmî bilgi')}${osmSources}</p><p class="action"><strong>Ne yapabilirsiniz?</strong> ${e(s.action)}</p>${phone||mail?`<div class="contact">${phone}${mail} ${link(s.sourceIds.find(id=>/Contact|^o$|^pdr$|^international$|^security$|^access$|^fitness$/.test(id))||s.sourceIds[0],'İletişim kaydı')}</div>`:''}<div class="service-links">${s.sourceIds.slice(1).map(id=>link(id)).join('')}${poi.map(p=>`<button class="map-link" data-map-place="${e(p.id)}">Haritada: ${e(C.label(p))}</button>`).join('')}</div>${fallback(s.sourceIds)}</div></details>`;
  }).join(''):'<p class="empty">Bu aramayla eşleşen konu bulunamadı. Daha kısa bir sözcük deneyin veya “Tümü” kategorisini seçin.</p>';
 }
 $('#service-search').addEventListener('input',renderServices);
 $('#service-filters').addEventListener('click',ev=>{const b=ev.target.closest('[data-service-category]');if(b){serviceCategory=b.dataset.serviceCategory;renderServices();}});
 document.addEventListener('click',async ev=>{
  const mapButton=ev.target.closest('[data-map-place]');if(mapButton){location.hash='harita?'+encodeURIComponent(mapButton.dataset.mapPlace);return;}
  const b=ev.target.closest('[data-copy]');if(!b)return;
  try{if(!navigator.clipboard?.writeText)throw Error('clipboard');await Promise.race([navigator.clipboard.writeText(b.dataset.copy),new Promise((_,reject)=>setTimeout(()=>reject(Error('clipboard timeout')),1500))]);b.textContent='Kopyalandı';}
  catch{b.textContent='Adresi seçip kopyalayın';const r=b.closest('.source-item')?.querySelector('.source-url')||b.closest('.fallback-row')?.querySelector('a');if(r){const range=document.createRange();range.selectNodeContents(r);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);}$('#copy-message').textContent='Otomatik kopyalama desteklenmiyor. Görünen adresi seçip kopyalayabilirsiniz.';}
 });
 renderServices();
 const map=$('#map'),width=1400,height=900,proj=C.projection(geo.metadata.bbox,width,height,28);
 let mapCategory='İlk duraklar',selected=null,view=[0,0,width,height],viewName='Tüm yerleşke',userMarker=null;
 const allCategories=['İlk duraklar','Tümü','İdari / Destek','Kütüphane','Akademik','Yeme içme','Sağlık','Spor / Kültür','Bilim / Kültür','Banka / ATM','Günlük yaşam'];
 map.innerHTML=`<defs><style>${C.css}</style></defs><g id="geo-layer">${C.geography(geo,proj)}</g><g id="map-markers"></g><g id="map-location"></g>`;
 $('#mini-map').innerHTML=`<svg viewBox="0 0 1400 900" focusable="false"><style>${C.css}</style>${C.geography(geo,proj)}${data.pois.filter(p=>p.essential).map(p=>C.marker(p,proj,15)).join('')}</svg>`;
 function filteredPlaces(){
  const q=norm($('#place-search').value);
  return data.pois.filter(p=>(mapCategory==='Tümü'||mapCategory==='İlk duraklar'&&p.essential||p.category===mapCategory)&&norm(p.name+' '+p.category+' '+p.num+' '+(p.originalName||'')).includes(q));
 }
 function renderPlaces(){
  const list=filteredPlaces();
  $('#map-filters').innerHTML=allCategories.map(c=>`<button type="button" data-map-category="${e(c)}" aria-pressed="${mapCategory===c}">${e(c)}</button>`).join('');
  $('#place-count').textContent=`${list.length} yer`;
  $('#places').innerHTML=list.length?list.map(p=>`<button type="button" class="place${selected===p.id?' selected':''}" data-place-row="${e(p.id)}" aria-pressed="${selected===p.id}"><span class="place-number">${e(p.num)}</span><span><span class="place-name">${e(p.name)}</span><span class="place-meta">${e(p.category)}</span></span></button>`).join(''):'<p class="empty">Eşleşen yer yok. Farklı bir sözcük deneyin veya filtreleri temizleyin. Hizmet iletişimi için başvuru rehberini açın.</p>';
  const selectedPoint=data.pois.find(p=>p.id===selected),included=list.some(p=>p.id===selected);
  const drawn=(selectedPoint&&!included?[...list,selectedPoint]:list).slice().sort((a,b)=>(a.id===selected?1:0)-(b.id===selected?1:0));
  const bounds=map.getBoundingClientRect(),unitsPerPx=bounds.width&&bounds.height?Math.max(view[2]/bounds.width,view[3]/bounds.height):view[2]/900;
  const markerR=15*unitsPerPx;
  $('#map-markers').innerHTML=drawn.map(p=>C.marker(p,proj,markerR,{labelVisible:p.id===selected,selected:p.id===selected,withRole:true,offset:p.id===selected?[0,-markerR-10*unitsPerPx]:null})).join('');
  renderUserLocation();
 }
 function renderDetail(p){
  if(!p){$('#map-detail').innerHTML='<p class="eyebrow">HARİTAYI KEŞFEDİN</p><h2>Bir noktayı seçerek başlayın.</h2><p>İsimle arayın veya numaralı bir yere dokunun. İlgili hizmet, kaynak ve konum ayrıntısı burada açılır.</p>';return;}
  const badge=p.status==='official'?'Resmî koordinat':'OSM yer kaydı';
  const rel=data.services.filter(s=>s.places.includes(p.id));
  const revision=p.updated?`<p class="fine">OSM kaydının son düzenlenmesi: ${e(new Date(p.updated).toLocaleDateString('tr-TR'))}. Verinin yeniden alınması, yerinde doğrulama anlamına gelmez.</p>`:'';
  $('#map-detail').innerHTML=`<span class="source-badge">${e(badge)}</span><h2>${e(p.num)} · ${e(p.name)}</h2><p>${e(p.note)} <a href="${e(p.source)}" target="_blank" rel="noopener noreferrer">Konum kaydı</a></p><p class="coordinates">Enlem ${p.lat.toFixed(6)} · Boylam ${p.lon.toFixed(6)}</p>${revision}<div class="detail-links">${p.official?`<a href="${e(p.official)}" target="_blank" rel="noopener noreferrer">Resmî birim sayfası</a>`:''}${p.phone?`<a href="tel:+90${p.phone.replace(/\D/g,'').replace(/^0/,'')}">${e(p.phone)}</a>`:''}${rel.map(s=>`<a href="#basvuru?${e(s.id)}">${e(s.title)}</a>`).join('')}</div><details class="link-fallback"><summary>Konum bağlantısını kopyala</summary><div class="fallback-row"><a href="${e(p.source)}" target="_blank" rel="noopener noreferrer">${e(p.source)}</a><button data-copy="${e(p.source)}">Adresi kopyala</button></div></details>`;
 }
 function applyView(){
  map.setAttribute('viewBox',view.join(' '));
  $('#map-view-name').textContent=viewName;
  $('#view-full').setAttribute('aria-pressed',String(viewName==='Tüm yerleşke'));
  $('#view-core').setAttribute('aria-pressed',String(viewName==='Merkez hizmetler'));
  renderPlaces();updateScale();
 }
 function updateScale(){
  const bounds=map.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  const unitsPerPx=Math.max(view[2]/bounds.width,view[3]/bounds.height),mPerPx=proj.metersPerUnit*unitsPerPx,ideal=100*mPerPx;
  const distance=[10,20,50,100,200,500,1000,2000].reduce((best,x)=>Math.abs(x-ideal)<Math.abs(best-ideal)?x:best,100);
  $('#scale-line').style.width=(distance/mPerPx)+'px';$('#scale-text').textContent=distance>=1000?(distance/1000)+' km':distance+' m';
 }
 function selectPlace(id,focus=true){
  const p=data.pois.find(p=>p.id===id);if(!p)return;selected=id;renderDetail(p);
  if(focus){const xy=proj.project([p.lon,p.lat]),w=width*.32,h=height*.32;view=[xy[0]-w/2,xy[1]-h/2,w,h];viewName=p.name;}
  applyView();
 }
 $('#place-search').addEventListener('input',()=>{if($('#place-search').value.trim())mapCategory='Tümü';selected=null;renderDetail(null);renderPlaces();});
 $('#map-filters').addEventListener('click',ev=>{const b=ev.target.closest('[data-map-category]');if(b){mapCategory=b.dataset.mapCategory;selected=null;renderDetail(null);renderPlaces();}});
 $('#places').addEventListener('click',ev=>{const b=ev.target.closest('[data-place-row]');if(b)selectPlace(b.dataset.placeRow);});
 const chooseMarker=ev=>{const p=ev.target.closest('[data-place]');if(p)selectPlace(p.dataset.place);};
 map.addEventListener('click',chooseMarker);
 map.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();chooseMarker(ev);}});
 $('#clear-map').addEventListener('click',()=>{$('#place-search').value='';mapCategory='Tümü';selected=null;renderDetail(null);renderPlaces();});
 function zoom(factor){const [x,y,w,h]=view,nw=Math.max(width*.055,Math.min(width*1.7,w*factor)),nh=nw*height/width;view=[x+w/2-nw/2,y+h/2-nh/2,nw,nh];viewName='Harita görünümü';applyView();}
 $('#zoom-in').addEventListener('click',()=>zoom(.72));$('#zoom-out').addEventListener('click',()=>zoom(1/.72));
 function resetFull(){view=[0,0,width,height];viewName='Tüm yerleşke';applyView();}
 $('#view-full').addEventListener('click',resetFull);$('#reset-view').addEventListener('click',resetFull);
 $('#view-core').addEventListener('click',()=>{const a=proj.project([41.2375,39.9045]),b=proj.project([41.258,39.895]);const w=b[0]-a[0],h=b[1]-a[1],vw=Math.max(w,h*width/height);view=[(a[0]+b[0])/2-vw/2,(a[1]+b[1])/2-vw*height/width/2,vw,vw*height/width];viewName='Merkez hizmetler';applyView();});
 let drag=null,dragMoved=false;
 map.addEventListener('pointerdown',ev=>{if(ev.target.closest('[data-place]'))return;drag={x:ev.clientX,y:ev.clientY,view:[...view]};dragMoved=false;map.setPointerCapture(ev.pointerId);map.classList.add('dragging');});
 map.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)dragMoved=true;const r=map.getBoundingClientRect(),s=Math.max(drag.view[2]/r.width,drag.view[3]/r.height);view=[drag.view[0]-dx*s,drag.view[1]-dy*s,drag.view[2],drag.view[3]];map.setAttribute('viewBox',view.join(' '));viewName='Harita görünümü';$('#map-view-name').textContent=viewName;updateScale();});
 const endDrag=()=>{if(drag){drag=null;map.classList.remove('dragging');applyView();}};
 map.addEventListener('pointerup',endDrag);map.addEventListener('pointercancel',endDrag);
 function renderUserLocation(){
  const group=$('#map-location');if(!userMarker){group.innerHTML='';return;}const [x,y]=proj.project([userMarker.lon,userMarker.lat]),r=Math.max(3,8*view[2]/width);group.innerHTML=`<circle cx="${x}" cy="${y}" r="${Math.max(r*2,userMarker.accuracy/proj.metersPerUnit)}" fill="#286db018" stroke="#286db075" stroke-width="${r/5}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#286db0" stroke="white" stroke-width="${r/3}"/><title>Tarayıcı konumunuz; doğruluk yaklaşık ${Math.round(userMarker.accuracy)} m</title>`;
 }
 $('#locate').addEventListener('click',()=>{
  const message=$('#map-message');if(!navigator.geolocation){message.textContent='Tarayıcınız konum özelliğini desteklemiyor. Yer adını arayarak devam edebilirsiniz.';return;}
  message.textContent='Tarayıcıdan konum izni bekleniyor…';
  navigator.geolocation.getCurrentPosition(pos=>{const b=geo.metadata.bbox,lat=pos.coords.latitude,lon=pos.coords.longitude;if(lon<b[0]||lon>b[2]||lat<b[1]||lat>b[3]){message.textContent='Tarayıcının bildirdiği konum bu kampüs haritasının dışında. Yer aramasıyla devam edebilirsiniz.';return;}userMarker={lat,lon,accuracy:pos.coords.accuracy};const [x,y]=proj.project([lon,lat]);view=[x-width*.2,y-height*.2,width*.4,height*.4];viewName='Konumunuz';message.textContent=`Konum doğruluğu yaklaşık ${Math.round(pos.coords.accuracy)} m; yalnızca bu sayfada gösterilir, bir sunucuya gönderilmez.`;applyView();},()=>{message.textContent='Konum alınamadı veya izin verilmedi. Bu özellik paylaşılan önizlemede kısıtlanabilir; yer adını arayarak devam edebilirsiniz.';},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
 });
 $('#download-top').addEventListener('click',()=>{$('#map-message').textContent='Ayrıntılı harita dosyası yeni sekmede açıldıysa oradan kaydedebilirsiniz.';});
 window.addEventListener('resize',()=>{renderPlaces();updateScale();});
 window.addEventListener('hashchange',setRoute);
 renderDetail(null);$('#view-core').click();setRoute();
 window.appReady=true;
})();
