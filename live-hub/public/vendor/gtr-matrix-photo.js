/* <gtr-matrix-photo srcs="a.png,b.png" interval="8000"> — matrix glyph-rain photo reveal.
   Glyphs rain down adopting photo colors. Photo background progressively brightens to FULL
   visibility during peak phase with crisp reveal, then dissolves back. Beat-sync via window.__gtrBeat. */
(function(){
  const G='กขฃคฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ0123456789ABCDEFabcdef'.split('');
  const DB='gtrpht_mphoto_';
  class GtrMatrixPhoto extends HTMLElement {
    connectedCallback(){
      if(this._init) return; this._init=true;
      this.style.cssText+=';display:block;position:relative;overflow:hidden;background:#0D0D0F;width:100%;height:100%';
      this._imgs=[]; this._loaded=[]; this._cur=0; this._cells=null;
      const srcs=(this.getAttribute('srcs')||'').split(',').map(s=>s.trim()).filter(Boolean);
      try{ const saved=JSON.parse(localStorage.getItem(DB+this.id)||'[]'); if(saved.length) srcs.push(...saved); }catch(e){}
      this._imgSrcs=srcs;
      const cv=document.createElement('canvas');
      cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;will-change:transform';
      this.appendChild(cv); this._cv=cv;
      this._ctr=document.createElement('div');
      this._ctr.style.cssText='position:absolute;right:8px;bottom:6px;font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.18em;color:rgba(236,233,228,.5);pointer-events:none;z-index:1';
      this.appendChild(this._ctr);
      this.addEventListener('dragover',e=>{e.preventDefault();this.style.outline='1px solid #E5372C';});
      this.addEventListener('dragleave',()=>this.style.outline='');
      this.addEventListener('drop',e=>{e.preventDefault();this.style.outline='';this._addFiles([...e.dataTransfer.files].filter(f=>f.type.startsWith('image/')));});
      this._ro=new ResizeObserver(()=>{this._cells=null;this._buildCells();});
      this._ro.observe(this);
      this._visible=false;
      this._io=new IntersectionObserver(entries=>{
        this._visible=entries[0].isIntersecting;
        if(this._visible&&!this._raf) this._raf=requestAnimationFrame(t=>this._loop(t));
      },{threshold:0.01});
      this._io.observe(this);
      this._loadAll(srcs).then(()=>{this._buildCells();if(this._visible) this._raf=requestAnimationFrame(t=>this._loop(t));});
      this._interval=+(this.getAttribute('interval'))||8000;
      this._lastSwitch=performance.now();
    }
    disconnectedCallback(){cancelAnimationFrame(this._raf);this._raf=0;if(this._ro)this._ro.disconnect();if(this._io)this._io.disconnect();}
    async _loadAll(srcs){
      for(const s of srcs){
        try{
          const img=new Image(); img.crossOrigin='anonymous';
          await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=s;});
          this._loaded.push(img);
        }catch(e){}
      }
    }
    async _addFiles(files){
      const saved=[];
      for(const f of files){
        const url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(f);});
        const img=new Image();
        await new Promise(r=>{img.onload=r;img.src=url;});
        this._loaded.push(img);
        const c=document.createElement('canvas'),s=Math.min(1,600/img.width);
        c.width=img.width*s;c.height=img.height*s;
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        saved.push(c.toDataURL('image/jpeg',.65));
      }
      if(saved.length){try{const ex=JSON.parse(localStorage.getItem(DB+this.id)||'[]');ex.push(...saved);localStorage.setItem(DB+this.id,JSON.stringify(ex.slice(-6)));}catch(e){}}
      this._cells=null; this._buildCells();
    }
    _sampleColor(img,x,y,w,h){
      if(!img||!this._sampleCv) return null;
      const sc=this._sampleCv, sx=this._sampleCtx;
      if(sc._img!==img){
        try{
          sc.width=Math.min(200,img.width); sc.height=Math.round(sc.width*img.height/img.width);
          sx.drawImage(img,0,0,sc.width,sc.height);
          sc._data=sx.getImageData(0,0,sc.width,sc.height).data;
          sc._img=img;
        }catch(e){ sc._img=img; sc._data=null; return null; }
      }
      if(!sc._data) return null;
      const px=Math.min(sc.width-1,Math.max(0,Math.round(x/w*sc.width)));
      const py=Math.min(sc.height-1,Math.max(0,Math.round(y/h*sc.height)));
      const i=(py*sc.width+px)*4;
      const d=sc._data;
      return [d[i],d[i+1],d[i+2],d[i+3]];
    }
    _buildCells(){
      const w=this.clientWidth, h=this.clientHeight;
      if(!w||!h) return;
      if(this._bw===w&&this._bh===h&&this._cells) return;
      this._bw=w; this._bh=h;
      const dpr=Math.min(2,window.devicePixelRatio||1);
      this._cv.width=w*dpr; this._cv.height=h*dpr;
      this._dpr=dpr; this._w=w; this._h=h;
      this._sampleCv=document.createElement('canvas');
      this._sampleCtx=this._sampleCv.getContext('2d');
      this._sampleCv._img=null;
      const cell=Math.max(6,Math.round(Math.min(w,h)/32));
      this._cell=cell;
      const cells=[];
      const colStart={};
      for(let cy=cell/2;cy<h;cy+=cell){
        for(let cx=cell/2;cx<w;cx+=cell){
          const col=Math.round(cx/cell);
          if(colStart[col]==null) colStart[col]=Math.random()*1800;
          cells.push({ x:cx, y:cy, col, g:G[(Math.random()*G.length)|0], rt:colStart[col]+(cy/h)*2800+Math.random()*140, f:.6+Math.random()*.7, ph:Math.random()*6.28, red:Math.random()<.008 });
        }
      }
      this._cells=cells;
      this._t0=performance.now();
      this._ctr.textContent=this._loaded.length>1?((this._cur%this._loaded.length)+1)+'/'+this._loaded.length:'';
    }
    _loop(t){
      if(!this._visible){this._raf=0;return;}
      this._raf=requestAnimationFrame(tt=>this._loop(tt));
      if(!this._cells||!this._cells.length) return;
      try{ this._draw(t); }catch(e){}
    }
    _draw(t){
      if(!this._firstDraw){ this._firstDraw=true; this._lastSwitch=t; this._t0=t; }
      const n=this._loaded.length;
      if(n>1 && t-this._lastSwitch>this._interval){
        this._cur=(this._cur+1)%n;
        this._lastSwitch=t;
        this._sampleCv._img=null;
        this._ctr.textContent=(this._cur+1)+'/'+n;
      }
      const img=n?this._loaded[this._cur%n]:null;
      const cv=this._cv,ctx=cv.getContext('2d'),dpr=this._dpr;
      const w=this._w,h=this._h,cell=this._cell;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,w,h);
      const P=this._interval||8000;
      const e=(t-this._t0)%P;
      const beat=Math.max(0,Math.min(1,window.__gtrBeat||0));
      const rE=P*0.18, pS=P*0.30, pE=P*0.72, fS=P-1200;
      if(img){
        let pa;
        if(e<rE){ pa=(e/rE)*0.15; }
        else if(e<pS){ const prog=(e-rE)/(pS-rE); pa=0.15+0.85*(1-Math.pow(1-prog,2.5)); }
        else if(e<pE){ pa=1.0; }
        else if(e<fS){ const prog=(e-pE)/(fS-pE); pa=1.0-prog*0.7; }
        else { pa=Math.max(0,0.3*((P-e)/(P-fS))); }
        pa=Math.min(1,pa+beat*0.06);
        if(pa>0.005){
          ctx.save();
          ctx.globalAlpha=pa;
          const iw=img.width,ih=img.height,sc=Math.max(w/iw,h/ih);
          const dw=iw*sc,dh=ih*sc;
          ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);
          if(pa>0.85){ ctx.globalAlpha=(pa-0.85)*0.15; ctx.fillStyle='#FFF5E8'; ctx.fillRect(0,0,w,h); }
          ctx.restore();
        }
      }
      ctx.save();
      if(beat>0){ctx.translate(w/2,h/2);const s=1+beat*.015;ctx.scale(s,s);ctx.translate(-w/2,-h/2);}
      ctx.font=`${Math.round(cell*.92)}px "JetBrains Mono",monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      let gm=1;
      if(e<rE){ gm=1; }
      else if(e<pS){ const prog=(e-rE)/(pS-rE); gm=1-prog*0.95; }
      else if(e<pE){ gm=0.04+beat*0.03; }
      else if(e<fS){ const prog=(e-pE)/(fS-pE); gm=0.04+prog*0.65; }
      else { gm=0.69+((e-fS)/(P-fS))*0.31; }
      for(const c of this._cells){
        const dt=e-c.rt;
        let a;
        if(dt<0) a=0;
        else if(dt<500) a=dt/500;
        else if(e>P-1500) a=Math.max(0,(P-e)/1500);
        else a=1;
        if(a<=0) continue;
        const head=dt>=0&&dt<220,trail=dt>=220&&dt<700;
        if((head||trail)&&Math.random()<.3) c.g=G[(Math.random()*G.length)|0];
        else if(Math.random()<.004) c.g=G[(Math.random()*G.length)|0];
        const sh=.5+.5*Math.sin(t/850*c.f+c.ph);
        let col,ga;
        if(head){ col='#ECE9E4'; ga=gm; }
        else if(trail){ col='#C9C7CE'; ga=.85*gm; }
        else if(img){
          const rgba=this._sampleColor(img,c.x,c.y,w,h);
          if(rgba&&rgba[3]>30){
            const r=rgba[0],g=rgba[1],b=rgba[2];
            const lum=(r*.299+g*.587+b*.114)/255;
            const cm=Math.min(1,.5+sh*.5+beat*.3);
            col=`rgb(${Math.round(r*cm+(1-cm)*62)},${Math.round(g*cm+(1-cm)*62)},${Math.round(b*cm+(1-cm)*70)})`;
            ga=Math.min(1,(.3+lum*.5+sh*.3+beat*.2)*a*gm);
            if(ga<.03) ga=.03;
          } else { col=c.red?'#E5372C':'#3E3E46'; ga=(.15+sh*.15)*a*gm; }
        } else if(c.red){ col='#E5372C'; ga=Math.min(1,.3+sh*.6+beat*.7)*gm; }
        else { col=sh>.75?'#8E8C94':'#3E3E46'; ga=(.25+sh*.4+beat*.2)*a*gm; }
        ctx.globalAlpha=ga;
        ctx.fillStyle=col;
        ctx.fillText(c.g,c.x,c.y+(head?(1-dt/220)*-8:0));
      }
      ctx.globalAlpha=1;
      ctx.restore();
    }
  }
  if(!customElements.get('gtr-matrix-photo')) customElements.define('gtr-matrix-photo',GtrMatrixPhoto);
})();
