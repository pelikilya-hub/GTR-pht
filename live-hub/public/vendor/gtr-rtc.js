/* GTR RTC v3 — Cloudflare Realtime SFU + room signaling via the site's own Worker.
   <gtr-camera room>   transmitter: publishes camera+mic to the SFU, announces itself in the room
   <gtr-director room> pult: pulls every camera, program window, tally + flip/quality/mic commands
   <gtr-multiview room> public viewer: same as director without the command rail
   No PeerJS, no third-party signaling: media → Cloudflare SFU, control → /ws/<room> (Durable Object).
   Visual language unchanged from the design (JetBrains Mono / 'Inter Tight', #E5372C). */
(function(){
'use strict';
var MONO="'JetBrains Mono',monospace", HEAD="'Inter Tight',sans-serif";
var RED='#E5372C', RED2='#FF6A5B', INK='#ECE9E4', DIM='#8E8C94', DIM2='#55545C', BRD='#26262B', BG2='#101013';
var QUAL=[{k:'480p',w:854,h:480},{k:'720p',w:1280,h:720},{k:'1080p',w:1920,h:1080}];
var SLOTS=[
  {id:'cam1',label:'CAM 1',sub:'ОСНОВНАЯ'},
  {id:'cam2',label:'CAM 2',sub:'ВТОРАЯ'},
  {id:'cam3',label:'CAM 3',sub:'ТРЕТЬЯ'},
  {id:'cam4',label:'CAM 4',sub:'ЧЕТВЁРТАЯ'}
];
var API_BASE=(function(){ try{ var o=window.__GTR_API_BASE; if(o) return String(o).replace(/\/$/,''); }catch(e){} return ''; })();

(function(){ if(document.getElementById('gtr-rtc-kf')) return;
  var st=document.createElement('style'); st.id='gtr-rtc-kf';
  st.textContent='@keyframes gtrBlink{0%,100%{opacity:1}50%{opacity:.2}} @keyframes gtrPulse{0%,100%{box-shadow:0 0 0 0 rgba(229,55,44,.4)}50%{box-shadow:0 0 0 8px rgba(229,55,44,0)}}';
  document.head.appendChild(st); })();
function el(tag,css,props){ var n=document.createElement(tag); if(css)n.style.cssText=css; if(props)Object.assign(n,props); return n; }
function statusDot(col,blink){ return 'display:inline-block;width:7px;height:7px;border-radius:50%;background:'+col+(blink?';animation:gtrBlink 1.1s infinite':''); }
function wsUrl(room,qs){ var proto=location.protocol==='https:'?'wss:':'ws:'; var base=API_BASE?API_BASE.replace(/^http/,'ws'):proto+'//'+location.host; return base+'/ws/'+encodeURIComponent(room)+'?'+qs; }
/* Crew key: cameras and the pult must prove they are the crew (server secret CREW_KEY).
   Asked once per device, kept in localStorage. Viewers never need it. */
function crewKey(){ try{ return localStorage.getItem('gtrpht_crew_key')||''; }catch(e){ return ''; } }
async function ensureCrew(){
  for(var i=0;i<3;i++){
    var r=null; try{ r=await fetch(API_BASE+'/api/crew/check',{headers:{'X-Crew-Key':crewKey()},cache:'no-store'}); }catch(e){ return true; }
    if(r.ok||r.status!==401) return true;
    var k=window.prompt(i?'Ключ не подошёл. Ключ экипажа Bangtaostyle.com:':'Ключ экипажа Bangtaostyle.com (один раз на устройство):');
    if(k==null) return false;
    try{ localStorage.setItem('gtrpht_crew_key',k.trim()); }catch(e){}
  }
  return false;
}
async function api(path,method,body){
  var hd={}; if(body) hd['Content-Type']='application/json'; var ck=crewKey(); if(ck) hd['X-Crew-Key']=ck;
  var r=await fetch(API_BASE+path,{method:method||'GET',headers:hd,body:body?JSON.stringify(body):undefined});
  var txt=await r.text(); var j=null; try{ j=txt?JSON.parse(txt):null; }catch(e){}
  if(!r.ok){ var e=new Error((j&&(j.error||j.errorDescription))||('HTTP '+r.status)); e.status=r.status; throw e; }
  return j;
}
async function iceServers(){
  try{ var j=await api('/api/turn'); if(j&&j.iceServers) return Array.isArray(j.iceServers)?j.iceServers:[j.iceServers]; }catch(e){}
  return [{urls:['stun:stun.cloudflare.com:3478']}];
}
function waitIce(pc,ms){
  return new Promise(function(res,rej){
    if(pc.iceConnectionState==='connected'||pc.iceConnectionState==='completed') return res();
    var to=setTimeout(function(){ rej(new Error('ICE timeout')); },ms||15000);
    pc.addEventListener('iceconnectionstatechange',function h(){
      var s=pc.iceConnectionState;
      if(s==='connected'||s==='completed'){ clearTimeout(to); pc.removeEventListener('iceconnectionstatechange',h); res(); }
      else if(s==='failed'||s==='closed'){ clearTimeout(to); pc.removeEventListener('iceconnectionstatechange',h); rej(new Error('ICE '+s)); }
    });
  });
}

/* ───────────── Room signaling client (shared) ───────────── */
class Signal{
  constructor(room,role,slot,name,handlers){ this.room=room; this.role=role; this.slot=slot||''; this.name=name||''; this.h=handlers||{}; this.ws=null; this.id=null; this.open=false; this.closed=false; this._retry=0; }
  connect(){
    if(this.closed) return;
    var self=this; var qs='role='+this.role+'&slot='+encodeURIComponent(this.slot)+'&name='+encodeURIComponent(this.name)+(this.role!=='view'&&crewKey()?'&key='+encodeURIComponent(crewKey()):'');
    var ws=new WebSocket(wsUrl(this.room,qs)); this.ws=ws;
    ws.onopen=function(){ self.open=true; self._retry=0; if(self.h.open) self.h.open(); };
    ws.onmessage=function(ev){ var m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; } if(m&&m.type==='hello') self.id=m.id; if(self.h.msg) self.h.msg(m); };
    ws.onclose=function(ev){ self.open=false; if(self.h.close) self.h.close(ev); if(self.closed||ev.code===4001) return; var d=Math.min(10000,800*Math.pow(1.6,self._retry++)); setTimeout(function(){ self.connect(); },d); };
    ws.onerror=function(){};
    if(this._ping) clearInterval(this._ping);
    this._ping=setInterval(function(){ try{ if(ws.readyState===1) ws.send('ping'); }catch(e){} },25000);
  }
  send(o){ try{ if(this.ws&&this.ws.readyState===1) this.ws.send(JSON.stringify(o)); }catch(e){} }
  close(){ this.closed=true; if(this._ping) clearInterval(this._ping); try{ if(this.ws) this.ws.close(1000); }catch(e){} }
}

/* ============================== CAMERA ============================== */
class GTRCamera extends HTMLElement{
  connectedCallback(){
    if(this._built) return; this._built=true;
    this.room=localStorage.getItem('gtr_room')||this.getAttribute('room')||'gtrpht';
    this.slot=localStorage.getItem('gtr_slot')||'cam1';
    this.facing='environment'; this.qi=1; this.deviceId=''; this.micOn=true;
    this.stream=null; this.pc=null; this.session=null; this.sig=null; this.live=false; this.viewers=0;
    this.buildUI();
    this._tick=setInterval(()=>this.heartbeat(),5000);
  }
  disconnectedCallback(){ clearInterval(this._tick); this.goOff(); if(this.stream) this.stream.getTracks().forEach(t=>t.stop()); }
  buildUI(){
    this.style.cssText='display:block;font-family:'+MONO+';color:'+INK+';-webkit-user-select:none;user-select:none';
    var w=el('div','border:1px solid '+BRD+';background:'+BG2+';overflow:hidden');
    var hdr=el('div','display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #1E1E23;flex-wrap:wrap');
    hdr.appendChild(el('span','font-family:'+HEAD+';font-weight:900;font-size:14px;letter-spacing:.06em;color:'+RED2,{textContent:'BANGTAOSTYLE.COM'}));
    hdr.appendChild(el('span','font-size:9px;letter-spacing:.18em;color:'+DIM2,{textContent:'КАМЕРА · REALTIME'}));
    hdr.appendChild(el('span','flex:1'));
    this.liveDot=el('span',statusDot(DIM2)+';width:10px;height:10px'); hdr.appendChild(this.liveDot);
    this.liveLabel=el('span','font-size:10px;letter-spacing:.14em;color:'+DIM2,{textContent:'ОФЛАЙН'}); hdr.appendChild(this.liveLabel);
    w.appendChild(hdr);
    var sr=el('div','display:flex;gap:4px;padding:10px 14px 0;flex-wrap:wrap'); this.slotBtns={};
    SLOTS.forEach(s=>{
      var b=el('button','flex:1;min-width:60px;background:none;border:1px solid #2A2A30;padding:8px 6px;cursor:pointer;text-align:center;font-family:'+MONO+';font-size:10px;letter-spacing:.1em;color:'+DIM+';min-height:44px',{textContent:s.label});
      b.onclick=()=>{ this.slot=s.id; localStorage.setItem('gtr_slot',s.id); this.paintSlots(); if(this.live){ this.goOff(); setTimeout(()=>this.goLive(),300); } };
      sr.appendChild(b); this.slotBtns[s.id]=b;
    });
    w.appendChild(sr);
    var rr=el('div','display:flex;gap:8px;align-items:center;padding:8px 14px 0;flex-wrap:wrap');
    rr.appendChild(el('span','font-size:8px;letter-spacing:.18em;color:'+DIM2,{textContent:'КОМНАТА'}));
    this.roomIn=el('input','background:#0A0A0B;border:1px solid #26262B;color:'+INK+';padding:8px 10px;font-size:12px;font-family:'+MONO+';outline:none;width:100px;min-height:44px',{value:this.room});
    this.roomIn.onchange=()=>{ this.room=this.roomIn.value.trim()||'gtrpht'; localStorage.setItem('gtr_room',this.room); if(this.live){ this.goOff(); setTimeout(()=>this.goLive(),300); } };
    rr.appendChild(this.roomIn);
    w.appendChild(rr);
    var pv=el('div','position:relative;background:#000;margin:10px 14px 0;border:1px solid #1E1E23;aspect-ratio:16/9;overflow:hidden');
    this.video=el('video','position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000');
    this.video.muted=true; this.video.playsInline=true; this.video.setAttribute('playsinline',''); this.video.autoplay=true;
    pv.appendChild(this.video);
    this.tallyEl=el('div','position:absolute;inset:0;border:3px solid '+RED+';display:none;pointer-events:none;animation:gtrPulse 2s infinite'); pv.appendChild(this.tallyEl);
    this.tallyLbl=el('div','position:absolute;top:10px;left:50%;transform:translateX(-50%);background:'+RED+';color:#0B0B0C;font-family:'+HEAD+';font-weight:900;font-size:11px;letter-spacing:.1em;padding:5px 14px;display:none;pointer-events:none',{textContent:'В ПРОГРАММЕ'}); pv.appendChild(this.tallyLbl);
    this.hudEl=el('div','position:absolute;bottom:8px;right:8px;background:rgba(10,10,11,.7);border:1px solid #26262B;font-size:8px;letter-spacing:.1em;color:'+DIM+';padding:3px 7px',{textContent:'—'}); pv.appendChild(this.hudEl);
    this.noCam=el('div','position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;letter-spacing:.2em;color:'+DIM2,{textContent:'КАМЕРА НЕ ЗАПУЩЕНА'}); pv.appendChild(this.noCam);
    w.appendChild(pv);
    this.bigBtn=el('button','margin:12px 14px 0;width:calc(100% - 28px);background:'+RED+';border:2px solid '+RED+';color:#0B0B0C;font-family:'+HEAD+';font-weight:900;font-size:16px;letter-spacing:.08em;padding:18px;cursor:pointer;min-height:56px;transition:all .2s',{textContent:'▶  В ЭФИР'});
    this.bigBtn.onclick=()=>this.toggle();
    w.appendChild(this.bigBtn);
    var cr=el('div','display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px');
    this.flipBtn=this._mkBtn('⟲ FLIP'); this.flipBtn.onclick=()=>this.flip(); cr.appendChild(this.flipBtn);
    this.micBtn=this._mkBtn('МИК: ВКЛ'); this.micBtn.onclick=()=>this.toggleMic(); cr.appendChild(this.micBtn);
    this.qBtns=QUAL.map((q,i)=>{ var b=this._mkBtn(q.k); b.onclick=()=>this.setQuality(i); cr.appendChild(b); return b; });
    w.appendChild(cr);
    this.statusEl=el('div','padding:8px 14px 12px;font-size:9.5px;letter-spacing:.1em;line-height:1.7;color:'+DIM,{textContent:'Выбери слот, комнату и нажми «В ЭФИР».'});
    w.appendChild(this.statusEl);
    this.appendChild(w);
    this.paintSlots(); this.paintQual();
  }
  _mkBtn(label){ return el('button','flex:1;min-width:55px;background:none;border:1px solid #2A2A30;color:'+DIM+';font-family:'+MONO+';font-size:9px;letter-spacing:.1em;padding:8px;cursor:pointer;min-height:44px',{textContent:label}); }
  paintSlots(){ for(var k in this.slotBtns){ var on=k===this.slot; this.slotBtns[k].style.borderColor=on?RED:'#2A2A30'; this.slotBtns[k].style.background=on?'rgba(229,55,44,.12)':'none'; this.slotBtns[k].style.color=on?RED2:DIM; } }
  paintQual(){ this.qBtns.forEach((b,i)=>{ var on=i===this.qi; b.style.borderColor=on?RED:'#2A2A30'; b.style.background=on?'rgba(229,55,44,.12)':'none'; b.style.color=on?RED2:DIM; }); }
  setStatus(m){ this.statusEl.textContent=m; if(this.sig&&this.sig.open) this.sig.send({type:'log',msg:m}); }
  async toggle(){ if(this.live) this.goOff(true); else await this.goLive(); }
  constraints(audio){
    var q=QUAL[this.qi];
    var vc=this.deviceId?{deviceId:{exact:this.deviceId}}:{facingMode:{ideal:this.facing}};
    Object.assign(vc,{width:{ideal:q.w},height:{ideal:q.h},frameRate:{ideal:30}});
    return {video:vc,audio:audio?{echoCancellation:true,noiseSuppression:true}:false};
  }
  async goLive(){
    try{
      if(!this.stream){
        this.setStatus('ЗАПРОС КАМЕРЫ И МИКРОФОНА…');
        this.stream=await navigator.mediaDevices.getUserMedia(this.constraints(true));
        this.video.srcObject=this.stream; this.video.play().catch(()=>{}); this.noCam.style.display='none'; this.updateHUD();
      }
    }catch(e){ this.setStatus('КАМЕРА НЕ ДАНА: '+e.message+'. Разреши доступ в настройках браузера.'); return; }
    if(!(await ensureCrew())){ this.setStatus('✗ Нужен ключ экипажа — эфир не запущен'); return; }
    this.bigBtn.textContent='⏳ ПОДКЛЮЧЕНИЕ…'; this.bigBtn.style.background='#333';
    try{
      this.setStatus('ПОДКЛЮЧЕНИЕ К REALTIME SFU…');
      var ice=await iceServers();
      var pc=new RTCPeerConnection({iceServers:ice,bundlePolicy:'max-bundle'});
      this.pc=pc;
      var vt=this.stream.getVideoTracks()[0], at=this.stream.getAudioTracks()[0];
      var tv=pc.addTransceiver(vt,{direction:'sendonly'});
      var ta=at?pc.addTransceiver(at,{direction:'sendonly'}):null;
      var offer=await pc.createOffer(); await pc.setLocalDescription(offer);
      var ses=await api('/api/rt/session','POST'); this.session=ses.sessionId;
      var tracks=[{location:'local',mid:tv.mid,trackName:'video'}]; if(ta) tracks.push({location:'local',mid:ta.mid,trackName:'audio'});
      var resp=await api('/api/rt/tracks','POST',{sessionId:this.session,sessionDescription:{type:'offer',sdp:pc.localDescription.sdp},tracks:tracks});
      if(resp.errorCode) throw new Error(resp.errorDescription||resp.errorCode);
      await pc.setRemoteDescription(resp.sessionDescription);
      await waitIce(pc,20000);
      pc.oniceconnectionstatechange=()=>{ var s=pc.iceConnectionState; if(s==='failed'||s==='disconnected'){ this.setStatus('⚠ СВЯЗЬ С SFU: '+s+' — переподключаем…'); if(this.live){ this.goOff(); setTimeout(()=>this.goLive(),2500); } } };
      this.sig=new Signal(this.room,'cam',this.slot,this.slot.toUpperCase(),{
        open:()=>{ this.announce(); this.setStatus('✓ В ЭФИРЕ · слот '+this.slot.toUpperCase()+' · SFU · не закрывай страницу'); },
        msg:(m)=>this.onMsg(m),
        close:(ev)=>{ if(ev&&ev.code===4001){ this.setStatus('⚠ Слот '+this.slot.toUpperCase()+' занят другим устройством — эфир остановлен'); this.goOff(); } }
      });
      this.sig.connect();
      this.live=true;
      this.bigBtn.textContent='■  ОСТАНОВИТЬ ЭФИР'; this.bigBtn.style.background='#1A1A1E'; this.bigBtn.style.borderColor=RED; this.bigBtn.style.color=RED2;
      this.liveDot.style.cssText=statusDot('#FF4B3E',true)+';width:10px;height:10px';
      this.liveLabel.textContent='В ЭФИРЕ'; this.liveLabel.style.color=RED2;
      if(navigator.wakeLock) navigator.wakeLock.request('screen').then(w=>{this._wake=w;}).catch(()=>{});
    }catch(e){
      if(e.status===401){ try{ localStorage.removeItem('gtrpht_crew_key'); }catch(_){} }
      this.setStatus('✗ '+(e.status===503?'SFU не настроен на сервере (REALTIME_APP_ID/SECRET)':e.status===401?'Ключ экипажа не принят — нажми «В ЭФИР» ещё раз':e.message));
      this.resetBtn(); this.teardownMedia();
    }
  }
  announce(){ if(!this.sig) return; var tr=[{trackName:'video',kind:'video'}]; if(this.stream&&this.stream.getAudioTracks().length) tr.push({trackName:'audio',kind:'audio'}); this.sig.send({type:'announce',session:this.session,tracks:tr,state:this.stateMsg()}); }
  teardownMedia(){ if(this.pc){ try{this.pc.close();}catch(e){} this.pc=null; } this.session=null; }
  goOff(manual){
    this.live=false;
    if(this.sig){ this.sig.close(); this.sig=null; }
    this.teardownMedia();
    if(this._wake){ try{this._wake.release();}catch(e){} this._wake=null; }
    this.resetBtn();
    this.liveDot.style.cssText=statusDot(DIM2)+';width:10px;height:10px';
    this.liveLabel.textContent='ОФЛАЙН'; this.liveLabel.style.color=DIM2;
    this.tallyEl.style.display='none'; this.tallyLbl.style.display='none';
    if(manual) this.statusEl.textContent='ЭФИР ОСТАНОВЛЕН. Камера работает локально.';
  }
  resetBtn(){ this.bigBtn.textContent='▶  В ЭФИР'; this.bigBtn.style.background=RED; this.bigBtn.style.borderColor=RED; this.bigBtn.style.color='#0B0B0C'; }
  async replaceVideo(){
    try{
      var ns=await navigator.mediaDevices.getUserMedia(this.constraints(false));
      var nv=ns.getVideoTracks()[0]; var old=this.stream.getVideoTracks()[0];
      if(old){ this.stream.removeTrack(old); old.stop(); }
      this.stream.addTrack(nv); this.video.srcObject=this.stream;
      this.video.style.transform=(this.facing==='user')?'scaleX(-1)':'none'; this.video.play().catch(()=>{});
      if(this.pc){ var s=this.pc.getSenders().find(x=>x.track&&x.track.kind==='video'); if(s) await s.replaceTrack(nv); }
      this.updateHUD(); this.pushState();
    }catch(e){ this.setStatus('Камера: '+e.message); }
  }
  flip(){ this.deviceId=''; this.facing=this.facing==='environment'?'user':'environment'; if(this.stream) this.replaceVideo(); }
  setQuality(i){ this.qi=Math.max(0,Math.min(QUAL.length-1,i)); this.paintQual(); if(this.stream) this.replaceVideo(); }
  toggleMic(){
    this.micOn=!this.micOn;
    if(this.stream) this.stream.getAudioTracks().forEach(t=>{t.enabled=this.micOn;});
    this.micBtn.textContent=this.micOn?'МИК: ВКЛ':'МИК: ВЫКЛ'; this.micBtn.style.borderColor=this.micOn?'#2A2A30':RED; this.micBtn.style.color=this.micOn?DIM:RED2;
    this.pushState();
  }
  updateHUD(){ var t=this.stream&&this.stream.getVideoTracks()[0]; if(!t) return; var s=t.getSettings(); this.hudEl.textContent=(s.width||'?')+'×'+(s.height||'?')+' · '+Math.round(s.frameRate||0)+'fps · '+QUAL[this.qi].k; }
  stateMsg(){ var t=this.stream&&this.stream.getVideoTracks()[0]; var s=t?t.getSettings():{}; return {w:s.width||0,h:s.height||0,fps:Math.round(s.frameRate||0),facing:this.facing,mic:this.micOn,qi:this.qi,batt:this._batt!=null?this._batt:null}; }
  pushState(){ if(this.sig&&this.sig.open) this.sig.send({type:'state',state:this.stateMsg()}); }
  heartbeat(){
    if(!this.live) return;
    try{ if(navigator.getBattery) navigator.getBattery().then(b=>{ this._batt=Math.round(b.level*100); }); }catch(e){}
    var vt=this.stream&&this.stream.getVideoTracks()[0];
    if(vt&&vt.readyState!=='live'){ this.setStatus('⚠ видеотрек погас (экран гас?) — перезапускаем'); this.goOff(); setTimeout(()=>this.goLive(),800); return; }
    this.pushState();
  }
  onMsg(m){
    if(!m) return;
    if(m.type==='cmd'){
      if(m.cmd==='flip') this.flip();
      else if(m.cmd==='quality') this.setQuality(m.value|0);
      else if(m.cmd==='mic') this.toggleMic();
      else if(m.cmd==='tally'){ var on=!!m.value; this.tallyEl.style.display=on?'block':'none'; this.tallyLbl.style.display=on?'block':'none'; }
    } else if(m.type==='hello'||m.type==='peer'||m.type==='leave'){
      if(m.type==='hello') this.announce();
    } else if(m.type==='bumped'){ this.setStatus('⚠ Слот перехвачен: '+(m.by||'другое устройство')); }
  }
}

/* ======================= DIRECTOR / MULTIVIEW ======================= */
class GTRSwitcher extends HTMLElement{
  connectedCallback(){
    if(this._built) return; this._built=true;
    this.mode=this.getAttribute('mode')||(this.tagName==='GTR-MULTIVIEW'?'view':'director');
    this.fill=this.getAttribute('fill')==='1';
    this.room=localStorage.getItem('gtr_room')||this.getAttribute('room')||'gtrpht';
    this.sel='cam1'; this.audioOn=false; this.feeds={}; this.peers={}; this.scanning=false;
    this.pc=null; this.session=null; this.midMap={}; this.sig=null;
    this.buildUI();
    if(this.getAttribute('autostart')!=='0') setTimeout(()=>this.startScan(),400);
  }
  disconnectedCallback(){ this.stopScan(); }
  buildUI(){
    var dir=this.mode==='director';
    this.style.cssText='display:block;font-family:'+MONO+';color:'+INK+(this.fill?';height:100%':'')+';-webkit-user-select:none;user-select:none';
    var w=el('div','display:flex;flex-direction:column;gap:8px'+(this.fill?';height:100%':''));
    var bar=el('div','display:flex;gap:8px;align-items:center;flex-wrap:wrap');
    bar.appendChild(el('span','font-family:'+HEAD+';font-weight:900;font-size:12px;letter-spacing:.06em;color:'+RED2,{textContent:'BANGTAOSTYLE.COM'}));
    bar.appendChild(el('span','font-size:9px;letter-spacing:.18em;color:'+DIM2,{textContent:dir?'ПУЛЬТ · REALTIME':'МУЛЬТИВЬЮ'}));
    bar.appendChild(el('span','flex:1'));
    if(dir){
      bar.appendChild(el('span','font-size:8px;letter-spacing:.14em;color:'+DIM2,{textContent:'КОМНАТА'}));
      this.roomIn=el('input','background:#0A0A0B;border:1px solid #26262B;color:'+INK+';padding:6px 8px;font-size:11px;font-family:'+MONO+';outline:none;width:80px;min-height:36px',{value:this.room});
      this.roomIn.onchange=()=>{ this.room=this.roomIn.value.trim()||'gtrpht'; localStorage.setItem('gtr_room',this.room); this.restart(); };
      bar.appendChild(this.roomIn);
    }
    this.scanBtn=el('button','background:'+RED+';border:1px solid '+RED+';color:#0B0B0C;font-family:'+HEAD+';font-weight:700;font-size:11px;letter-spacing:.06em;padding:8px 16px;cursor:pointer;min-height:44px',{textContent:'🔍 НАЙТИ КАМЕРЫ'});
    this.scanBtn.onclick=()=>this.toggleScan(); bar.appendChild(this.scanBtn);
    this.audBtn=el('button','background:none;border:1px solid #2A2A30;color:'+DIM+';font-family:'+MONO+';font-size:9px;padding:8px;cursor:pointer;min-height:44px',{textContent:'🔇'});
    this.audBtn.onclick=()=>{ this.audioOn=!this.audioOn; this.prog.muted=!this.audioOn; if(this.audioOn) this.prog.play().catch(()=>{}); this.audBtn.textContent=this.audioOn?'🔊':'🔇'; this.audBtn.style.borderColor=this.audioOn?RED:'#2A2A30'; };
    bar.appendChild(this.audBtn);
    var fsBtn=el('button','background:none;border:1px solid #2A2A30;color:'+DIM+';font-family:'+MONO+';font-size:9px;padding:8px;cursor:pointer;min-height:44px',{textContent:'⛶'});
    fsBtn.onclick=()=>{ (this.progBox.requestFullscreen||this.progBox.webkitRequestFullscreen||function(){}).call(this.progBox); };
    bar.appendChild(fsBtn);
    this.statusEl=el('div','font-size:9px;letter-spacing:.12em;color:'+DIM2+';padding:0',{textContent:'Подключаемся к комнате…'});
    var pb=el('div','position:relative;background:#000;border:1px solid #1E1E23;overflow:hidden'+(this.fill?';flex:1;min-height:0':';aspect-ratio:16/9'));
    this.progBox=pb;
    this.prog=el('video','position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000');
    this.prog.muted=true; this.prog.playsInline=true; this.prog.setAttribute('playsinline',''); this.prog.autoplay=true;
    pb.appendChild(this.prog);
    this.progLbl=el('div','position:absolute;top:8px;left:8px;display:flex;align-items:center;gap:6px;background:rgba(10,10,11,.72);border:1px solid '+BRD+';padding:4px 10px'); pb.appendChild(this.progLbl);
    this.progEmpty=el('div','position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:0 20px');
    this.progEmpty.innerHTML='<div style="font-size:12px;letter-spacing:.26em;color:'+RED+';animation:gtrBlink 2.2s infinite">ОЖИДАНИЕ СИГНАЛА</div><div style="font-size:9.5px;letter-spacing:.08em;line-height:1.7;color:'+DIM2+'">Открой /camera на iPhone → «В ЭФИР»<br>Камеры в этой комнате появятся здесь автоматически</div>';
    pb.appendChild(this.progEmpty);
    var ctrl=null;
    if(dir){
      ctrl=el('div','display:flex;gap:4px;flex-wrap:wrap;align-items:center;border:1px solid '+BRD+';background:#0D0D0F;padding:6px 8px');
      ctrl.appendChild(el('span','font-size:8px;letter-spacing:.14em;color:'+DIM2,{textContent:'КАМЕРА →'}));
      this.cFlip=this._mkBtn('⟲'); this.cFlip.onclick=()=>this.cmd('flip'); ctrl.appendChild(this.cFlip);
      this.cQ=QUAL.map((q,i)=>{ var b=this._mkBtn(q.k); b.onclick=()=>this.cmd('quality',i); ctrl.appendChild(b); return b; });
      this.cMic=this._mkBtn('МИК'); this.cMic.onclick=()=>this.cmd('mic'); ctrl.appendChild(this.cMic);
      this.cInfo=el('span','font-size:8px;letter-spacing:.08em;color:'+DIM2+';margin-left:auto',{textContent:'—'}); ctrl.appendChild(this.cInfo);
    }
    var grid=el('div','display:grid;grid-template-columns:repeat(4,1fr);gap:4px'+(this.fill?';height:64px':''));
    if(!this.fill) grid.style.gridTemplateColumns='repeat(auto-fit,minmax(120px,1fr))';
    SLOTS.forEach(s=>{
      var tile=el('div','position:relative;background:#000;border:1px solid #2A2A30;cursor:pointer;overflow:hidden'+(this.fill?'':';aspect-ratio:16/9'));
      var v=el('video','position:absolute;inset:0;width:100%;height:100%;object-fit:cover'); v.muted=true; v.playsInline=true; v.setAttribute('playsinline',''); v.autoplay=true; tile.appendChild(v);
      var lb=el('div','position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:4px;background:rgba(10,10,11,.75);padding:3px 6px');
      var dot=el('span',statusDot(DIM2)); var txt=el('span','font-size:8px;letter-spacing:.12em;color:'+DIM,{textContent:s.label}); var res=el('span','font-size:7px;color:'+DIM2+';margin-left:auto',{textContent:'OFF'});
      lb.appendChild(dot); lb.appendChild(txt); lb.appendChild(res); tile.appendChild(lb);
      tile.onclick=()=>this.select(s.id); grid.appendChild(tile);
      this.feeds[s.id]={def:s,tile,video:v,dot,res,stream:null,peerId:null,session:null,state:null,status:'off'};
    });
    w.appendChild(bar); w.appendChild(this.statusEl); w.appendChild(pb); if(ctrl) w.appendChild(ctrl); w.appendChild(grid);
    this.appendChild(w);
    this.paintSel(); this.paintProgLbl();
  }
  _mkBtn(label){ return el('button','background:none;border:1px solid #2A2A30;color:'+DIM+';font-family:'+MONO+';font-size:8px;letter-spacing:.08em;padding:6px 8px;cursor:pointer;min-height:36px',{textContent:label}); }
  toggleScan(){ if(this.scanning) this.stopScan(); else this.startScan(); }
  async startScan(){
    if(this.scanning) return;
    if(this.mode==='director'&&!(await ensureCrew())){ this.statusEl.textContent='✗ ПУЛЬТ ТОЛЬКО ДЛЯ ЭКИПАЖА — нужен ключ'; return; }
    if(this.scanning) return;
    this.scanning=true;
    this.scanBtn.textContent='■ СТОП'; this.scanBtn.style.background='#1A1A1E'; this.scanBtn.style.color=RED2;
    this.statusEl.textContent='КОМНАТА «'+this.room.toUpperCase()+'» · подключение…';
    this.sig=new Signal(this.room,this.mode==='director'?'dir':'view','',this.mode,{
      open:()=>{ this.statusEl.textContent='В СЕТИ · ждём камеры в «'+this.room.toUpperCase()+'»'; },
      msg:(m)=>this.onMsg(m),
      close:()=>{ if(this.scanning) this.statusEl.textContent='СВЯЗЬ С КОМНАТОЙ ПОТЕРЯНА · переподключение…'; }
    });
    this.sig.connect();
  }
  stopScan(){
    this.scanning=false;
    this.scanBtn.textContent='🔍 НАЙТИ КАМЕРЫ'; this.scanBtn.style.background=RED; this.scanBtn.style.color='#0B0B0C';
    if(this.sig){ this.sig.close(); this.sig=null; }
    if(this.pc){ try{this.pc.close();}catch(e){} this.pc=null; } this.session=null; this.midMap={}; this.peers={};
    SLOTS.forEach(s=>{ var f=this.feeds[s.id]; f.stream=null; f.peerId=null; f.session=null; f.video.srcObject=null; this.setFeed(s.id,'off'); });
    this.prog.srcObject=null; this.paintProgLbl();
    this.statusEl.textContent='ПОИСК ОСТАНОВЛЕН';
  }
  restart(){ this.stopScan(); setTimeout(()=>this.startScan(),300); }
  onMsg(m){
    if(!m) return;
    if(m.type==='hello'){ (m.peers||[]).forEach(p=>this.onPeer(p)); }
    else if(m.type==='peer'){ this.onPeer(m.peer); }
    else if(m.type==='leave'){ this.onLeave(m.id); }
    else if(m.type==='log'){ this.statusEl.textContent='['+String(m.slot||'').toUpperCase()+'] '+m.msg; }
  }
  onPeer(p){
    if(!p||p.role!=='cam'||!p.slot||!this.feeds[p.slot]) return;
    this.peers[p.id]=p;
    var f=this.feeds[p.slot];
    f.state=p.state||f.state; f.peerId=p.id; this.paintState(p.slot);
    if(p.session&&p.tracks&&p.tracks.length&&f.session!==p.session){ f.session=p.session; this.pull(p.slot,p).catch(e=>{ this.statusEl.textContent='⚠ '+p.slot.toUpperCase()+': '+e.message; }); }
    else if(f.status==='off') this.setFeed(p.slot,'conn');
  }
  onLeave(id){
    var p=this.peers[id]; if(!p) return; delete this.peers[id];
    var f=this.feeds[p.slot]; if(!f||f.peerId!==id) return;
    f.stream=null; f.peerId=null; f.session=null; f.video.srcObject=null; this.setFeed(p.slot,'off');
    if(this.sel===p.slot){ this.prog.srcObject=null; this.paintProgLbl(); }
    this.countLive();
  }
  async ensurePc(){
    if(this.pc&&this.session) return;
    var ice=await iceServers();
    var pc=new RTCPeerConnection({iceServers:ice,bundlePolicy:'max-bundle'});
    pc.ontrack=(ev)=>{
      var mid=ev.transceiver&&ev.transceiver.mid; var slot=this.midMap[mid]; if(!slot) return;
      var f=this.feeds[slot]; if(!f.stream) f.stream=new MediaStream();
      f.stream.addTrack(ev.track);
      if(ev.track.kind==='video'){ f.video.srcObject=f.stream; f.video.play().catch(()=>{}); this.setFeed(slot,'live'); if(this.sel===slot) this.attachProg(); this.countLive(); }
      else if(this.sel===slot) this.attachProg();
    };
    pc.oniceconnectionstatechange=()=>{ var s=pc.iceConnectionState; if(s==='failed'){ this.statusEl.textContent='⚠ ICE failed — переподключаем'; this.restart(); } };
    var ses=await api('/api/rt/session','POST');
    this.pc=pc; this.session=ses.sessionId;
  }
  async pull(slot,p){
    await this.ensurePc();
    if(this.feeds[slot].session!==p.session) return;
    this.setFeed(slot,'conn');
    var tracks=p.tracks.map(t=>({location:'remote',sessionId:p.session,trackName:t.trackName}));
    var resp=await api('/api/rt/tracks','POST',{sessionId:this.session,tracks:tracks});
    if(resp.errorCode) throw new Error(resp.errorDescription||resp.errorCode);
    (resp.tracks||[]).forEach(t=>{ if(t.mid) this.midMap[t.mid]=slot; });
    if(resp.requiresImmediateRenegotiation&&resp.sessionDescription){
      await this.pc.setRemoteDescription(resp.sessionDescription);
      var ans=await this.pc.createAnswer(); await this.pc.setLocalDescription(ans);
      await api('/api/rt/renegotiate','PUT',{sessionId:this.session,sessionDescription:{type:'answer',sdp:this.pc.localDescription.sdp}});
    }
    this.statusEl.textContent='✓ '+slot.toUpperCase()+' · поток запрошен';
  }
  setFeed(slot,st){
    var f=this.feeds[slot]; f.status=st;
    f.dot.style.cssText=statusDot(st==='live'?'#FF4B3E':(st==='conn'?'#C9A227':DIM2),st==='live');
    f.res.textContent=st==='live'?(f.state&&f.state.w?f.state.w+'×'+f.state.h:'LIVE'):(st==='conn'?'…':'OFF');
    f.tile.style.borderColor=slot===this.sel?(st==='live'?RED:'#555'):'#2A2A30';
    if(slot===this.sel) this.paintProgLbl();
  }
  countLive(){ var n=0; SLOTS.forEach(s=>{ if(this.feeds[s.id].status==='live') n++; }); this.statusEl.textContent='✓ КАМЕР В ЭФИРЕ: '+n+(n?'':' · ждём сигнал'); }
  select(slot){
    this.sel=slot; this.paintSel(); this.attachProg(); this.paintProgLbl();
    if(this.mode==='director'&&this.sig) SLOTS.forEach(s=>{ var f=this.feeds[s.id]; if(f.peerId) this.sig.send({type:'cmd',to:f.peerId,cmd:'tally',value:s.id===slot}); });
  }
  attachProg(){ var f=this.feeds[this.sel]; this.prog.srcObject=f.stream||null; if(f.stream){ this.prog.muted=!this.audioOn; this.prog.play().catch(()=>{}); } this.paintProgLbl(); }
  paintSel(){ SLOTS.forEach(s=>{ var on=s.id===this.sel; this.feeds[s.id].tile.style.borderWidth=on?'2px':'1px'; this.feeds[s.id].tile.style.borderColor=on?RED:'#2A2A30'; }); }
  paintProgLbl(){
    var f=this.feeds[this.sel], live=f.status==='live';
    this.progLbl.innerHTML='<span style="'+statusDot(live?'#FF4B3E':DIM2,live)+'"></span><span style="font-size:9px;letter-spacing:.14em;color:'+(live?RED2:DIM)+'">PGM · '+f.def.label+'</span>';
    this.progEmpty.style.display=live?'none':'flex';
  }
  paintState(slot){
    var f=this.feeds[slot], st=f.state; if(!st) return;
    if(f.status==='live'&&st.w) f.res.textContent=st.w+'×'+st.h;
    if(slot===this.sel&&this.mode==='director'&&this.cInfo){ this.cInfo.textContent=(st.facing==='user'?'ФРОНТ':'ТЫЛ')+' · '+st.w+'×'+st.h+' · '+st.fps+'fps'+(st.batt!=null?' · 🔋'+st.batt+'%':''); }
  }
  cmd(cmd,value){ var f=this.feeds[this.sel]; if(f.peerId&&this.sig) this.sig.send({type:'cmd',to:f.peerId,cmd:cmd,value:value}); else this.statusEl.textContent=f.def.label+' не в сети'; }
}
class GTRMultiview extends GTRSwitcher{}
if(!customElements.get('gtr-camera')) customElements.define('gtr-camera',GTRCamera);
if(!customElements.get('gtr-director')) customElements.define('gtr-director',GTRSwitcher);
if(!customElements.get('gtr-multiview')) customElements.define('gtr-multiview',GTRMultiview);
})();
