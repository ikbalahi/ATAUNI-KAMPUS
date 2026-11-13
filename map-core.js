(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CampusCartography=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const colors={'İdari / Destek':'#205d7a','Kütüphane':'#675281','Akademik':'#315f56','Yeme içme':'#8a591f','Sağlık':'#9b3c3b','Spor / Kültür':'#547633','Bilim / Kültür':'#425d82','Banka / ATM':'#62583b','Günlük yaşam':'#6c6b49'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function projection(bbox,w,h,pad=20){
  const lat0=(bbox[1]+bbox[3])/2,cos=Math.cos(lat0*Math.PI/180),R=111195;
  const dx=(bbox[2]-bbox[0])*cos*R,dy=(bbox[3]-bbox[1])*R,s=Math.min((w-pad*2)/dx,(h-pad*2)/dy),ox=(w-dx*s)/2,oy=(h-dy*s)/2;
  const project=([lon,lat])=>[ox+(lon-bbox[0])*cos*R*s,oy+(bbox[3]-lat)*R*s];
  const inverse=([x,y])=>[bbox[0]+(x-ox)/(cos*R*s),bbox[3]-(y-oy)/(R*s)];
  return {project,inverse,metersPerUnit:1/s,w,h,bbox};
 }
 const path=(coords,p,closed)=>coords.map((c,i)=>(i?'L':'M')+p(c).map(n=>n.toFixed(2)).join(',')).join('')+(closed?'Z':'');
 const css=`.geo-campus{fill:#e3ebdd;stroke:#8da792;stroke-width:1.5;stroke-dasharray:7 5}.geo-land{fill:#d9e3ce;stroke:#c1d0b5;stroke-width:.4}.geo-building{fill:#becfcb;stroke:#91aaa5;stroke-width:.7}.geo-parking{fill:#e2e2d7;stroke:#c6cbbd;stroke-width:.6}.geo-pitch{fill:#c7d8b4;stroke:#91ae79;stroke-width:1}.geo-water{fill:#bad5d9;stroke:#80b4bd;stroke-width:1.2}.road-case{fill:none;stroke:#bdc7bb;stroke-linecap:round;stroke-linejoin:round}.road-fill{fill:none;stroke:#fffdf3;stroke-linecap:round;stroke-linejoin:round}.geo-path{fill:none;stroke:#a5b4a0;stroke-width:1;stroke-dasharray:3 2;stroke-linecap:round}.map-text{fill:#173e4c;font-family:"Work Sans","Segoe UI",Arial,sans-serif}.pin-text{fill:#fff;font-family:"Work Sans","Segoe UI",Arial,sans-serif;font-weight:650;text-anchor:middle;dominant-baseline:central}.pin-label{fill:#173e4c;font-family:"Work Sans","Segoe UI",Arial,sans-serif;paint-order:stroke fill;stroke:#f9faf3;stroke-linejoin:round;font-weight:600;stroke-width:4}.area-label{fill:#516b5a;font-family:"Work Sans","Segoe UI",Arial,sans-serif;font-weight:600;letter-spacing:2px;paint-order:stroke;stroke:#eef1e7;stroke-width:4}`;
 function geography(geo,proj){
  const layers={campus:[],land:[],water:[],parking:[],pitch:[],building:[],roads:[],paths:[]};
  for(const f of geo.features){const t=f.properties,g=f.geometry,closed=g.type==='Polygon',coords=closed?g.coordinates[0]:g.coordinates,d=path(coords,proj.project,closed);
   if(t.kind==='road'){
    if(['footway','path','steps','cycleway','pedestrian'].includes(t.highway)){layers.paths.push(`<path class="geo-path" d="${d}"${t.highway==='cycleway'?' style="stroke:#658b6f"':''}/>`);continue;}
    const width=({motorway:8,trunk:7,primary:6,secondary:5,tertiary:4.3,residential:3.4,unclassified:3.1,service:2.2,track:1.5})[t.highway]||2;
    layers.roads.push({d,width});continue;
   }
   if(layers[t.kind])layers[t.kind].push(`<path class="geo-${t.kind}" d="${d}"${t.kind==='water'&&!closed?' style="fill:none"':''}/>`);
  }
  return ['campus','land','water','parking','pitch','building'].map(k=>`<g data-layer="${k}">${layers[k].join('')}</g>`).join('')+
   '<g data-layer="roads">'+layers.roads.map(r=>`<path class="road-case" stroke-width="${r.width+1.5}" d="${r.d}"/>`).join('')+layers.roads.map(r=>`<path class="road-fill" stroke-width="${r.width}" d="${r.d}"/>`).join('')+'</g><g data-layer="paths">'+layers.paths.join('')+'</g>';
 }
 const shortNames={'Öğrenci İşleri / Dış İlişkiler':'Öğrenci İşleri','Fuat Sezgin Merkez Kütüphanesi':'Merkez Kütüphane','Fuat Sezgin Çalışma Salonu':'Çalışma Salonu','Merkez Yemekhane / Mediko binası':'Merkez Yemekhane','OPAL: Optomekatronik Araştırma Laboratuvarı':'OPAL','Edebiyat Fakültesi: batı binası':'Yeni Edebiyat','Atatürk Üniversitesi Kampüs Eğitim Aile Sağlığı Merkezi':'Aile Sağlığı','Kampüs Eğitim Aile Sağlığı Merkezi':'Aile Sağlığı Merkezi'};
 function label(p){return shortNames[p.name]||p.name;}
 function marker(p,proj,r=11,{labelVisible=false,selected=false,withRole=false,offset=null,displacement=null}={}){
  const point=proj.project([p.lon,p.lat]),sx=displacement?.[0]||0,sy=displacement?.[1]||0,x=point[0]+sx,y=point[1]+sy,color=colors[p.category]||'#315f56';
  const attr=withRole?` role="button" tabindex="0" aria-label="${esc(p.name)}" aria-pressed="${selected}"`:'';
  const dx=offset?.[0]??r+7,dy=offset?.[1]??-r-4,anchor=dx===0?'middle':dx<0?'end':'start';
  return `<g class="pin${selected?' selected':''}" data-place="${esc(p.id)}" transform="translate(${x.toFixed(2)},${y.toFixed(2)})"${attr}><title>${esc(p.name)} | ${esc(p.status==='official'?'Resmî koordinat':'OSM konumu')} | ${esc(p.source)}</title>${sx||sy?`<path d="M${-sx},${-sy}L0,0" stroke="#456e5b" stroke-width="1.4"/><circle cx="${-sx}" cy="${-sy}" r="2.6" fill="#254c3d"/>`:''}${selected?`<circle r="${r+6}" fill="#fff9" stroke="${color}" stroke-width="1.4"/>`:''}<circle r="${r+6}" fill="transparent" stroke="none"/><circle r="${r}" fill="${color}" stroke="#fffef5" stroke-width="2"/><text class="pin-text" font-size="${r*.84}">${esc(p.num)}</text>${labelVisible?`<text class="pin-label" x="${dx}" y="${dy}" font-size="${r*1.02}" text-anchor="${anchor}">${esc(label(p))}</text>`:''}</g>`;
 }
 function roadLabels(geo,proj,fontSize=12){
  const names=['Batı Kampüs Sokak','Prof. Dr. İhsan Doğramacı Bulvarı','Terminal Caddesi','Çat Yolu Caddesi','Ömer Nasuhi Bilmen Caddesi'];
  return '<g data-layer="road-names">'+names.map(name=>{
   const f=geo.features.filter(f=>f.properties.kind==='road'&&f.properties.name===name).sort((a,b)=>b.geometry.coordinates.length-a.geometry.coordinates.length)[0];if(!f||f.geometry.type!=='LineString')return'';
   const coords=f.geometry.coordinates,point=coords[Math.floor(coords.length/2)],xy=proj.project(point),margin=name.length*fontSize*.27+15;xy[0]=Math.max(margin,Math.min(proj.w-margin,xy[0]));xy[1]=Math.max(30,Math.min(proj.h-20,xy[1]));
   return `<text x="${xy[0]}" y="${xy[1]-6}" font-size="${fontSize}" text-anchor="middle" class="map-text" fill="#526b5c" style="paint-order:stroke;stroke:#f4f6eb;stroke-width:3;font-weight:400"><title>${esc(f.properties.source)}</title>${esc(name)}</text>`;
  }).join('')+'</g>';
 }
 function grid(proj,bbox){
  let out='<g opacity=".6">';
  for(let lon=Math.ceil(bbox[0]*200)/200;lon<bbox[2];lon+=.005){const a=proj.project([lon,bbox[1]]),b=proj.project([lon,bbox[3]]);out+=`<path d="M${a}L${b}" stroke="#b9c9bd" stroke-width=".5" stroke-dasharray="2 6"/>`;}
  for(let lat=Math.ceil(bbox[1]*200)/200;lat<bbox[3];lat+=.005){const a=proj.project([bbox[0],lat]),b=proj.project([bbox[2],lat]);out+=`<path d="M${a}L${b}" stroke="#b9c9bd" stroke-width=".5" stroke-dasharray="2 6"/>`;}
  return out+'</g>';
 }
 return{colors,esc,projection,path,css,geography,marker,label,grid,roadLabels};
});
