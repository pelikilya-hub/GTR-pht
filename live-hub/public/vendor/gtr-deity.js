/* <gtr-deity variant="buddha|chedi|wai|church|thailand|ilia"> — grey matrix-reveal silhouettes; 'ilia' uses embedded 48×64 luminance grid */
(function(){
  const GLYPHS='กขฃคฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ0123456789'.split('');
  // 48×64 hex-encoded luminance grid (0-F) — compact portrait mask
  const ILIA_W=48,ILIA_H=64,ILIA_HEX='0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000002300332000000000000000000000000000000000000000002347923000000000000000000000000000000000000000005863973000008072000000000000000000000000000000045898998686888573820000000000000000000000000000208abcadc9bb9acba546000000000000000000000000002207bcdcdddcca9bbca96520000000000000000000000000603a8dceddbcb8bcbdbb8903200000000000000000000002838bcddedddc9cbcedcb9a863000000000000000000000048a8dceedebdbecdbabddbc66300000000000000000000007abcccddecdedccddddbcbc99500000000000000000000008bdbecbcbcdcddcdedddce9ba700000000000000000000009bcdccccbabbccacaccdd9caa640000000000000000000006bceccabb9899bb99acdecbc9880000000000000000000002adda99a976877678bddcb9a9885000000000000000000000bcc9ab98555554468bdcaac9b88000000000000000000007adb99987556434466abba9b9987000000000000000000000aca988866445444457998a889600000000000000000000006ca8887644444434568789cba650000000000000000000000c99766554443434556669cba5000000000000000000000308abab96654445444576589940220000000000000000300006b889aa97664669988777b70222200000000000000000000098a95a9a96588ac76666a400220000000000000000000000899987aa94579898865663000000000000000000000000008888769a94578764454562000000000000000000000400006788789a95666544454440000000000000000000000000025867877896665544554330000000000000000000000000005777669a9557544444330000000000000000000000000000577757aa95579533443200000000000000000000000000005876588a74566733444200000000000000000000000000025875779b8557565444330000000000000000000000000002498788997767657444300000000000000000000000000222398579885655566544400000000000000000000000222233458668bb988894534400000000000000000000000023333446886988866654444530000000000000000000000333344456877777665554445632000000000000000000002333354567898886666554545743200000000000000000022344566789aa98864444455566544000000000000000000234567788679a99764334654456555300000000000000000355677766579a99864445645555444444400000000000002378788655589a98687645444555543445555400000000046778889a86799a886544444445565555687655400000005777888879a998aa8865547554656777779755664200000467777778799aaaba9865455545868888886445764200000357777778778889aba97667666687787665444587320000024567677777788789998667755676665554544585300000003466777778986677898776656566666544545574300000002356667779dc667678776656766666554444455420000000024567777a9b977767777766768666656545554300000000003567779acc866667777777767565565665553200000000002466678cba966766777777666655466565843000000000002356666aaa77676777676665655555557543200000000000034658669a57556677676665556455455432000000000000033456657675556676665565555555444320000000';
  class GtrDeity extends HTMLElement{
    static get observedAttributes(){return ['variant','src'];}
    attributeChangedCallback(n,o,v){if(o===v||!this._init)return;this._cells=null;if(n==='variant'){this._img=null;this._imgReq=false;}this._build();}
    connectedCallback(){
      if(this._init) return; this._init=true; this._builtV=null;
      this.style.display='block'; this.style.position=this.style.position||'relative';
      if(!this.style.height) this.style.height='100%';
      if(!this.style.width) this.style.width='100%';
      const cv=document.createElement('canvas');
      cv.style.cssText='position:absolute;inset:0;width:100%;height:100%';
      this.appendChild(cv); this._cv=cv;
      this._visible=false;
      this._io=new IntersectionObserver(entries=>{
        this._visible=entries[0].isIntersecting;
        if(this._visible&&!this._rafOn){ this._rafOn=true; this._raf=requestAnimationFrame(t=>this._loop(t)); }
      },{threshold:0.01});
      this._io.observe(this);
      this._ro=new ResizeObserver(()=>this._build());
      this._ro.observe(this);
      this._build();
      // touch-burn layer: pointer draws a soft burning red line across the matrix
      this._burn=[];
      this.style.pointerEvents='auto'; this.style.touchAction='none';
      const rel=e=>{const r=this.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
      const press=e=>e.pressure&&e.pressure>0?e.pressure:(e.pointerType==='mouse'?.55:.5);
      this._pdown=e=>{ this._drawing=true; const p=rel(e); this._burn.push({x:p.x,y:p.y,f:press(e),t:performance.now(),nw:true}); try{this.setPointerCapture(e.pointerId);}catch(_){} };
      this._pmove=e=>{ if(!this._drawing) return; const p=rel(e);
        const last=this._burn[this._burn.length-1];
        if(!last||Math.hypot(p.x-last.x,p.y-last.y)>4) this._burn.push({x:p.x,y:p.y,f:press(e),t:performance.now()});
        if(this._burn.length>600) this._burn.splice(0,this._burn.length-600);
      };
      this._pup=()=>{ this._drawing=false; };
      this.addEventListener('pointerdown',this._pdown);
      this.addEventListener('pointermove',this._pmove);
      this.addEventListener('pointerup',this._pup);
      this.addEventListener('pointercancel',this._pup);
      const self=this;
      this._loop=function _loop(t){ if(!self._visible){self._rafOn=false;return;} self._raf=requestAnimationFrame(_loop); self._draw(t); };
      if(this._visible){ this._rafOn=true; this._raf=requestAnimationFrame(this._loop); }
    }
    disconnectedCallback(){ cancelAnimationFrame(this._raf); this._rafOn=false; if(this._ro) this._ro.disconnect(); if(this._io) this._io.disconnect(); }
    _silhouette(ctx,w,h){
      const v=this.getAttribute('variant')||'buddha';
      if(v==='thailand'){ this._thai(ctx,w,h,false); return; }
      if(v==='ilia'){
        ctx.fillStyle='#fff';
        const gw=ILIA_W,gh=ILIA_H,sc=Math.min(w/gw,h/gh),dw=gw*sc,dh=gh*sc,ox=(w-dw)/2,oy=(h-dh)/2;
        const pw=dw/gw, ph=dh/gh;
        for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
          const val=parseInt(ILIA_HEX[gy*gw+gx],16);
          if(val>0){ ctx.globalAlpha=val/15; ctx.fillRect(ox+gx*pw,oy+gy*ph,pw+.5,ph+.5); }
        }
        ctx.globalAlpha=1; return;
      }
      const s=Math.min(w,h), cx=w/2;
      ctx.fillStyle='#fff'; ctx.strokeStyle='#fff';
      const C=(x,y,r)=>{ctx.beginPath();ctx.arc(cx+(x-.5)*s,y*s+(h-s)/2,r*s,0,7);ctx.fill();};
      const E=(x,y,rx,ry)=>{ctx.beginPath();ctx.ellipse(cx+(x-.5)*s,y*s+(h-s)/2,rx*s,ry*s,0,0,7);ctx.fill();};
      const P=(pts)=>{const X=p=>cx+(p[0]-.5)*s,Y=p=>p[1]*s+(h-s)/2;ctx.beginPath();ctx.moveTo(X(pts[0]),Y(pts[0]));let i=1;for(;i+1<pts.length;i+=2)ctx.quadraticCurveTo(X(pts[i]),Y(pts[i]),X(pts[i+1]),Y(pts[i+1]));if(i<pts.length)ctx.lineTo(X(pts[i]),Y(pts[i]));ctx.closePath();ctx.fill();};
      if(v==='church'){
        ctx.fillRect(cx-.34*s,(h-s)/2+.60*s,.68*s,.26*s);
        ctx.fillRect(cx-.09*s,(h-s)/2+.44*s,.18*s,.17*s);
        P([[.5,.13],[.66,.24],[.615,.37],[.575,.445],[.5-.075,.445],[.5-.115,.37],[.34,.24],[.5,.13]]);
        ctx.fillRect(cx-.011*s,(h-s)/2+.025*s,.022*s,.105*s);
        ctx.fillRect(cx-.055*s,(h-s)/2+.052*s,.11*s,.02*s);
        ctx.save(); ctx.translate(cx,(h-s)/2+.095*s); ctx.rotate(-.6); ctx.fillRect(-.04*s,-.009*s,.08*s,.018*s); ctx.restore();
        for(const m of [1,-1]){
          ctx.save(); ctx.translate(cx,0); ctx.scale(m,1); ctx.translate(-cx,0);
          ctx.fillRect(cx+.185*s,(h-s)/2+.50*s,.09*s,.11*s);
          P([[.5+.23,.36],[.5+.31,.425],[.5+.285,.475],[.5+.275,.505],[.5+.185,.505],[.5+.175,.475],[.5+.15,.425],[.5+.23,.36]]);
          ctx.fillRect(cx+.224*s,(h-s)/2+.30*s,.012*s,.06*s);
          ctx.fillRect(cx+.204*s,(h-s)/2+.315*s,.052*s,.011*s);
          ctx.restore();
        }
        ctx.save(); ctx.globalCompositeOperation='destination-out';
        ctx.beginPath(); ctx.arc(cx,(h-s)/2+.76*s,.055*s,Math.PI,0); ctx.rect(cx-.055*s,(h-s)/2+.76*s,.11*s,.10*s); ctx.fill();
        ctx.restore();
        return;
      }
      if(v==='chedi'){
        ctx.fillRect(cx-.30*s,(h-s)/2+.80*s,.60*s,.05*s);
        ctx.fillRect(cx-.24*s,(h-s)/2+.73*s,.48*s,.07*s);
        ctx.fillRect(cx-.19*s,(h-s)/2+.67*s,.38*s,.06*s);
        P([[.5,.36],[.72,.44],[.68,.67],[.32,.67],[.28,.44],[.5,.36]]);
        ctx.fillRect(cx-.05*s,(h-s)/2+.30*s,.10*s,.07*s);
        P([[.5,.08],[.545,.20],[.035+.5,.31],[.5-.035,.31],[.5-.045,.20],[.5,.08]]);
      } else if(v==='wai'){
        for(const m of [1,-1]){
          ctx.save(); ctx.translate(cx,0); ctx.scale(m,1); ctx.translate(-cx,0);
          P([[.5,.12],[.56,.28],[.565,.46],[.575,.62],[.52,.78],[.5,.80],[.5,.46],[.5,.12]]);
          ctx.restore();
        }
        E(.5,.82,.13,.06);
      } else {
        ctx.lineWidth=.010*s;
        for(let r=.19;r>=.14;r-=.025){ctx.globalAlpha=.25+(.19-r)*8;ctx.beginPath();ctx.arc(cx,(h-s)/2+.25*s,r*s,0,7);ctx.stroke();}
        ctx.globalAlpha=1;
        P([[.5,.035],[.515,.055],[.52,.08],[.515,.10],[.5,.075],[.485,.10],[.48,.08],[.485,.055],[.5,.035]]);
        C(.5,.115,.026); C(.5,.145,.034);
        E(.5,.23,.082,.092);
        E(.395,.24,.018,.038); E(.605,.24,.018,.038);
        ctx.fillRect(cx-.032*s,(h-s)/2+.315*s,.064*s,.030*s);
        P([[.41,.345],[.44,.33],[.5,.34],[.56,.33],[.59,.345],[.70,.42],[.695,.52],[.68,.60],[.5,.64],[.32,.60],[.305,.52],[.30,.42],[.41,.345]]);
        ctx.save();ctx.globalAlpha=.15;ctx.lineWidth=.005*s;ctx.strokeStyle='#000';
        ctx.beginPath();ctx.moveTo(cx-.16*s,(h-s)/2+.36*s);ctx.quadraticCurveTo(cx,(h-s)/2+.50*s,cx+.16*s,(h-s)/2+.36*s);ctx.stroke();
        ctx.beginPath();ctx.moveTo(cx-.14*s,(h-s)/2+.40*s);ctx.quadraticCurveTo(cx,(h-s)/2+.54*s,cx+.14*s,(h-s)/2+.40*s);ctx.stroke();
        ctx.restore();
        E(.5,.58,.072,.032);
        E(.5,.575,.045,.020);
        ctx.save();ctx.globalAlpha=.6;
        for(let i=-2;i<=2;i++){E(.5+i*.012,.56,.006,.014);}
        ctx.restore();
        P([[.27,.64],[.35,.62],[.5,.66],[.65,.62],[.73,.64],[.74,.70],[.72,.74],[.5,.72],[.28,.74],[.26,.70],[.27,.64]]);
        E(.30,.68,.035,.028); E(.70,.68,.035,.028);
        ctx.save();ctx.globalAlpha=.12;ctx.lineWidth=.004*s;ctx.strokeStyle='#000';
        ctx.beginPath();ctx.moveTo(cx-.18*s,(h-s)/2+.66*s);ctx.quadraticCurveTo(cx,(h-s)/2+.72*s,cx+.18*s,(h-s)/2+.66*s);ctx.stroke();
        ctx.restore();
        ctx.fillRect(cx-.28*s,(h-s)/2+.74*s,.56*s,.022*s);
        ctx.fillRect(cx-.32*s,(h-s)/2+.76*s,.64*s,.018*s);
        ctx.fillRect(cx-.36*s,(h-s)/2+.775*s,.72*s,.025*s);
        ctx.save();ctx.globalAlpha=.5;
        for(let i=0;i<12;i++){const px=cx+(i-5.5)*.058*s;E((px-cx)/s+.5,.775,.022,.010);}
        ctx.restore();
      }
    }
    _thai(ctx,w,h,overlay){
      const OUT=[[98.5,19.8],[99.0,20.4],[100.1,20.4],[100.5,19.5],[101.2,19.6],[100.9,18.4],[101.1,17.6],[102.1,18.2],[103.0,18.4],[103.9,18.3],[104.8,17.4],[104.7,16.5],[105.6,15.7],[105.5,14.8],[104.8,14.4],[103.0,14.3],[102.3,13.6],[102.9,12.7],[102.3,12.2],[101.7,12.6],[100.9,13.5],[100.1,13.4],[100.0,12.5],[99.2,10.9],[99.6,9.3],[100.3,9.2],[100.6,8.4],[100.1,7.6],[101.0,6.9],[101.8,6.5],[102.1,6.2],[101.0,5.7],[100.3,6.6],[99.7,6.5],[99.1,7.7],[98.6,8.4],[98.3,7.8],[98.2,8.9],[98.7,10.3],[99.2,11.5],[99.6,12.0],[99.2,12.9],[98.6,13.2],[99.1,13.7],[98.3,14.7],[98.2,15.7],[98.6,16.3],[97.8,17.6],[98.3,18.3],[97.9,19.0]];
      const ROUTE=[[98.35,7.9],[99.0,8.6],[99.7,9.3],[100.0,9.55],[100.03,9.75],[99.7,9.3],[98.8,8.1],[99.2,10.0],[99.6,11.0],[99.96,12.57],[99.8,15.0],[99.8,17.0],[98.99,18.79],[100.0,16.5],[100.58,14.35],[100.5,13.75]];
      const EV=[[98.35,7.9],[100.0,9.55],[100.03,9.75],[98.8,8.1],[99.96,12.57],[99.8,17.0],[98.99,18.79],[100.58,14.35],[100.5,13.75]];
      const LNG=[97.3,106.0], LAT=[5.4,20.8];
      const sc=Math.min(w/(LNG[1]-LNG[0]),h/(LAT[1]-LAT[0]));
      const ox=(w-(LNG[1]-LNG[0])*sc)/2, oy=(h-(LAT[1]-LAT[0])*sc)/2;
      const X=p=>ox+(p[0]-LNG[0])*sc, Y=p=>oy+(LAT[1]-p[1])*sc;
      if(!overlay){
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(X(OUT[0]),Y(OUT[0]));
        for(let i=1;i<OUT.length;i++) ctx.lineTo(X(OUT[i]),Y(OUT[i]));
        ctx.closePath(); ctx.fill();
      } else {
        ctx.strokeStyle='rgb(255,0,0)'; ctx.lineWidth=Math.max(3,sc*.28); ctx.lineJoin='round'; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(X(ROUTE[0]),Y(ROUTE[0]));
        for(let i=1;i<ROUTE.length;i++) ctx.lineTo(X(ROUTE[i]),Y(ROUTE[i]));
        ctx.stroke();
        ctx.fillStyle='rgb(0,255,0)';
        for(const e of EV){ ctx.beginPath(); ctx.arc(X(e),Y(e),Math.max(4,sc*.38),0,7); ctx.fill(); }
      }
    }
    _build(){
      const w=this.clientWidth,hh=this.clientHeight; if(!w||!hh) return;
      const vr=this.getAttribute('variant')||'buddha';
      const dpr=Math.min(2,window.devicePixelRatio||1);
      this._cv.width=w*dpr; this._cv.height=hh*dpr; this._dpr=dpr; this._w=w; this._h=hh;
      const off=document.createElement('canvas'); off.width=w; off.height=hh;
      const o=off.getContext('2d'); this._silhouette(o,w,hh);
      const data=o.getImageData(0,0,w,hh).data;
      let odata=null;
      if((this.getAttribute('variant')||'')==='thailand'){
        const off2=document.createElement('canvas'); off2.width=w; off2.height=hh;
        const o2=off2.getContext('2d'); this._thai(o2,w,hh,true);
        odata=o2.getImageData(0,0,w,hh).data;
      }
      const cell=Math.max(5,Math.round(Math.min(w,hh)/(vr==='buddha'?62:vr==='ilia'?64:46)));
      const cells=[]; const colStart={};
      for(let y=cell/2;y<hh;y+=cell) for(let x=cell/2;x<w;x+=cell){
        const pix=((y|0)*w+(x|0))*4;
        let route=false, ev=false;
        if(odata&&odata[pix+3]>60){ route=odata[pix]>120; ev=odata[pix+1]>120; }
        if(data[pix+3]>90||route||ev){
          const col=Math.round(x/cell);
          if(colStart[col]==null) colStart[col]=Math.random()*1600;
          cells.push({x,y,g:GLYPHS[(Math.random()*GLYPHS.length)|0],
            rt:colStart[col]+(y/hh)*2400+Math.random()*120,
            f:.7+Math.random()*.6,ph:Math.random()*6.28,red:route||Math.random()<.012,ev,w:Math.min(1,data[pix+3]/255)});
        }
      }
      this._cells=cells; this._cell=cell; this._t0=performance.now();
    }
    _draw(t){
      const cv=this._cv,cells=this._cells; if(!cells) return;
      const x=cv.getContext('2d'),dpr=this._dpr;
      x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,this._w,this._h);
      const PERIOD=12000, e=(t-this._t0)%PERIOD;
      const rawBeat=Math.max(0,Math.min(1,window.__gtrBeat||0));
      if(!this._bassEnv) this._bassEnv=0;
      this._bassEnv=rawBeat>this._bassEnv?rawBeat:this._bassEnv*.965;
      const beat=this._bassEnv;
      x.save();
      if(beat>0){ x.translate(this._w/2,this._h/2); const sc=1+beat*.022; x.scale(sc,sc); x.translate(-this._w/2,-this._h/2); }
      x.font=`${Math.round(this._cell*.95)}px "JetBrains Mono",monospace`;
      x.textAlign='center'; x.textBaseline='middle';
      for(const c of cells){
        const dt=e-c.rt;
        let a;
        if(dt<0) a=0;
        else if(dt<420) a=dt/420;
        else if(e>PERIOD-1300) a=Math.max(0,(PERIOD-e)/1300)*(1-c.y/(this._h*3));
        else a=1;
        if(a<=0) continue;
        const head=dt>=0&&dt<190;
        const trail=dt>=190&&dt<650;
        if((head||trail)&&Math.random()<.25) c.g=GLYPHS[(Math.random()*GLYPHS.length)|0];
        else if(Math.random()<.003) c.g=GLYPHS[(Math.random()*GLYPHS.length)|0];
        const shimmer=.55+.45*Math.sin(t/900*c.f+c.ph);
        let col, ga;
        if(c.ev){ col='#ECE9E4'; ga=Math.min(1,.6+.4*Math.sin(t/300+c.ph)+beat*.5); }
        else if(head){ col='#ECE9E4'; ga=1; }
        else if(trail){ col='#C9C7CE'; ga=.9; }
        else if(c.red||beat>.25){
          const wt=c.w==null?1:c.w;
          const bassGlow=Math.max(0,(beat-.15)/.85);
          if(c.red||bassGlow>.3){
            const intensity=c.red?Math.min(1,.35+shimmer*.65+bassGlow*1.2):bassGlow*.7*wt;
            col=intensity>.7?'#FF6A5B':(intensity>.4?'#E5372C':'#8B2218');
            ga=Math.min(1,intensity*(.4+.6*wt));
          } else {
            const hot=shimmer>.8; col=hot?(wt>.82?'#C9C7CE':'#8E8C94'):'#3E3E46'; ga=Math.min(1,(.35+shimmer*.55)*(.3+.7*wt));
          }
        }
        else { const hot=shimmer>.8; const wt=c.w==null?1:c.w; col=hot?(wt>.82?'#C9C7CE':'#8E8C94'):'#3E3E46'; ga=Math.min(1,(.35+shimmer*.55+beat*.3)*(.3+.7*wt)); }
        x.globalAlpha=a*ga;
        x.fillStyle=col;
        x.fillText(c.g,c.x,c.y+(dt<420&&dt>=0?(1-dt/420)*-10:0));
      }
      x.globalAlpha=1;
      const burn=this._burn;
      if(burn&&burn.length){
        const now=t, LIFE=2400;
        while(burn.length&&now-burn[0].t>LIFE) burn.shift();
        if(burn.length){
          for(const c of cells){ c.heat=0; }
          for(const b of burn){
            const age=(now-b.t)/LIFE, live=1-age;
            if(live<=0) continue;
            const R=this._cell*(1.6+b.f*3.4);
            for(const c of cells){
              const d2=(c.x-b.x)*(c.x-b.x)+(c.y-b.y)*(c.y-b.y);
              if(d2<R*R){ const k=(1-Math.sqrt(d2)/R)*live*(.45+b.f*.75); if(k>(c.heat||0)) c.heat=k; }
            }
          }
          x.font=`${Math.round(this._cell*.95)}px "JetBrains Mono",monospace`;
          for(const c of cells){
            if(!c.heat||c.heat<.03) continue;
            const h2=Math.min(1,c.heat);
            if(Math.random()<h2*.35) c.g=GLYPHS[(Math.random()*GLYPHS.length)|0];
            x.globalAlpha=Math.min(1,h2*1.2);
            x.fillStyle=h2>.75?'#FFD9C9':(h2>.4?'#FF6A5B':'#E5372C');
            x.fillText(c.g,c.x,c.y);
          }
          x.lineCap='round'; x.lineJoin='round';
          for(let i=1;i<burn.length;i++){
            const a=burn[i-1],b=burn[i];
            if(b.nw) continue;
            const live=1-(now-b.t)/LIFE; if(live<=0) continue;
            x.strokeStyle='#E5372C'; x.globalAlpha=live*.85;
            x.lineWidth=(0.6+b.f*2.6)*live;
            x.beginPath(); x.moveTo(a.x,a.y); x.lineTo(b.x,b.y); x.stroke();
          }
          x.globalAlpha=1;
        }
      }
      x.restore();
    }
  }
  if(!customElements.get('gtr-deity')) customElements.define('gtr-deity',GtrDeity);
})();
