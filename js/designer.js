(function(){
  "use strict";
  const S=window.OneLineStore,I=S.icon;
  const surfaces=[
    {id:"front",label:"Front",short:"Front"},{id:"back",label:"Back",short:"Back"},
    {id:"rightSleeve",label:"Right sleeve",short:"R sleeve"},{id:"leftSleeve",label:"Left sleeve",short:"L sleeve"}
  ];
  const models=[
    {name:"Crew T-Shirt",type:"T-Shirt",typeExtra:0,image:"assets/crew-tee.webp",backImage:"assets/crew-tee-back.webp"},
    {name:"Sportswear",type:"Sportswear",typeExtra:150,image:"assets/sports-jersey.webp",backImage:"assets/sports-jersey-back.webp"},
    {name:"Polo",type:"Polo",typeExtra:100,image:"assets/polo-shirt.webp",backImage:"assets/polo-shirt-back.webp"}
  ];
  const materials=[
    {name:"Budget",price:299,note:"Light everyday fabric · best for simple value orders"},
    {name:"Standard",price:399,note:"Balanced comfort, finish and durability"},
    {name:"Premium",price:549,note:"Heavier premium feel · cleaner long-lasting finish"}
  ];
  const sleeveImage="assets/sleeve-side-neutral.webp";
  const draftKey="one-line-designer-draft-v5",legacyDraftKey="one-line-designer-draft-v4";
  const fontList=["Impact","Arial Black","Trebuchet MS","Georgia","Courier New","Verdana","Times New Roman"];
  const TEXT_MAX=50;
  const clone=v=>typeof structuredClone==="function"?structuredClone(v):JSON.parse(JSON.stringify(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const clampText=v=>clamp(v,6,TEXT_MAX);
  const uid=(prefix)=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const resizeMax=()=>{const v=window.visualViewport,w=v?.width||window.innerWidth||390,h=v?.height||window.innerHeight||720;return Math.max(280,Math.round(Math.min(w,h)*.94));};

  function makeText(value,index){return{id:uid('text'),type:'text',value:value||'YOUR TEXT',font:'Impact',color:'#ffffff',size:30,rotation:0,position:{x:50+((index||0)%3-1)*7,y:38+((index||0)%4)*5},scale:18};}
  function makeImage(src,index){return{id:uid('image'),type:'image',src:src||'',size:82,rotation:0,position:{x:50+((index||0)%3-1)*7,y:58+((index||0)%4)*4},scale:38};}
  function normalizeLayer(layer,index){
    if(!layer||!layer.type)return null;
    if(layer.type==='text')return{id:layer.id||uid('text'),type:'text',value:String(layer.value??layer.text??'YOUR TEXT'),font:layer.font||'Impact',color:layer.color||layer.textColor||'#ffffff',size:clampText(layer.size??layer.textSize??30),rotation:Number(layer.rotation??layer.textRotation??0),position:clone(layer.position||layer.positions?.text||{x:50,y:38}),scale:Number(layer.scale??layer.textScale??18)};
    if(layer.type==='image')return{id:layer.id||uid('image'),type:'image',src:layer.src||layer.uploadedImage||'',size:Math.max(10,Number(layer.size??layer.imageSize??82)),rotation:Number(layer.rotation??layer.imageRotation??0),position:clone(layer.position||layer.positions?.image||{x:50,y:62}),scale:Number(layer.scale??layer.imageScale??38)};
    return null;
  }
  function normalizeSurface(raw,defaultText){
    if(raw?.layers&&Array.isArray(raw.layers))return{layers:raw.layers.map(normalizeLayer).filter(Boolean)};
    const layers=[];
    if(raw?.text)layers.push(normalizeLayer({type:'text',value:raw.text,font:raw.font,color:raw.textColor,size:raw.textSize,rotation:raw.textRotation,position:raw.positions?.text,scale:raw.textScale},0));
    if(raw?.uploadedImage)layers.push(normalizeLayer({type:'image',src:raw.uploadedImage,size:raw.imageSize,rotation:raw.imageRotation,position:raw.positions?.image,scale:raw.imageScale},1));
    if(!layers.length&&defaultText)layers.push(makeText(defaultText,0));
    return{layers};
  }
  function normalizeDesigns(saved){
    const source=saved||{};
    return Object.fromEntries(surfaces.map(s=>[s.id,normalizeSurface(source[s.id],s.id==='front'&&!saved?'YOUR IDEA':'')]));
  }
  function loadDraft(){
    for(const key of [draftKey,legacyDraftKey]){try{const d=JSON.parse(localStorage.getItem(key)||"null");if(d)return d;}catch(_){}}
    return null;
  }
  function picker(name,value,options,open,extraClass){
    const selected=options.find(x=>x.value===value)||options[0];
    return '<div class="custom-picker '+(extraClass||'')+' '+(open===name?'open':'')+'" data-picker="'+name+'"><button type="button" class="picker-trigger" data-action="toggle-picker" data-picker-name="'+name+'"><span>'+S.esc(selected?.label||'Select')+'</span>'+I('chevron')+'</button>'+
      (open===name?'<div class="picker-menu" role="listbox">'+options.map(x=>'<button type="button" class="'+(x.value===value?'selected':'')+'" data-action="pick" data-picker-name="'+name+'" data-value="'+S.esc(x.value)+'"><span>'+S.esc(x.label)+'</span>'+(x.value===value?I('check'):'')+'</button>').join('')+'</div>':'')+'</div>';
  }

  function mount(root,hooks){
    const saved=loadDraft();
    const state={
      model:models.find(m=>m.name===saved?.modelName||m.type===saved?.modelType)||models[0],
      material:materials.find(m=>m.name===saved?.materialName)||materials[1],
      color:saved?.color||"Navy",size:saved?.size||"M",qty:Number(saved?.qty)||1,
      surface:saved?.surface||"front",designs:normalizeDesigns(saved?.designs||saved?.surfaceDesigns),
      active:null,pickerOpen:null,fileMode:'add',replaceLayerId:null,printMethods:S.getPrints(),printType:saved?.printType||S.getPrints()[0]?.name||"DTF Print"
    };
    const pointers=new Map();let pinch=null,transformGesture=null,lastTap={time:0,id:""},resizeTimer=null;
    let colourPickerH=210,colourPickerS=.55,colourPickerV=.55,colourPickerValue='#1f2c43';
    const hexToRgb=value=>{let h=String(value||'').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];};
    const rgbToHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
    const hsvToRgb=(h,s,v)=>{h=((h%360)+360)%360;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return[(r+m)*255,(g+m)*255,(b+m)*255];};
    const rgbToHsv=(r,g,b)=>{r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d){if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}if(h<0)h+=360;return[h,max===0?0:d/max,max];};
    if(S.isDarkColor(state.color)&&state.printMethods.find(p=>p.name===state.printType)?.lightOnly)state.printType=state.printMethods.find(p=>!p.lightOnly)?.name||"DTF Print";
    models.flatMap(m=>[m.image,m.backImage]).concat(sleeveImage).forEach(src=>{const im=new Image();im.decoding='async';im.src=src;});

    const current=()=>state.designs[state.surface];
    const activeLayer=()=>current().layers.find(l=>l.id===state.active)||null;
    const layerById=id=>current().layers.find(l=>l.id===id)||null;
    const designedCount=()=>surfaces.filter(x=>state.designs[x.id].layers.length).length;
    const chosenPrint=()=>state.printMethods.find(x=>x.name===state.printType)||state.printMethods.find(x=>!x.lightOnly)||{name:"DTF Print",price:180,note:"Vivid colour"};
    const garmentPrice=()=>Number(state.material.price||0)+Number(state.model.typeExtra||0);
    const presetColours=['Black','White','Navy','Maroon','Olive','Sky','Sand'];
    const colourValue=value=>S.palette[value]||value||'#1f2c43';
    const usingCustomColour=()=>!presetColours.includes(state.color);
    const customColourValue=()=>/^#[0-9a-f]{6}$/i.test(String(state.color||''))?String(state.color):colourValue(state.color);
    const unitPrice=()=>garmentPrice()+Number(chosenPrint().price||0)+Math.max(0,designedCount()-1)*80;
    const garmentSrc=()=>state.surface.includes("Sleeve")?sleeveImage:state.surface==="back"?state.model.backImage:state.model.image;
    const surfaceLabel=()=>surfaces.find(x=>x.id===state.surface)?.label||"Front";
    const saveDraft=()=>{try{localStorage.setItem(draftKey,JSON.stringify({modelName:state.model.name,modelType:state.model.type,materialName:state.material.name,color:state.color,size:state.size,qty:state.qty,surface:state.surface,designs:state.designs,printType:state.printType}));}catch(err){console.warn('Designer draft storage is full; current session will continue.',err);}};

    function syncCurrentScale(){
      const area=root.querySelector('[data-print-area]')?.getBoundingClientRect();if(!area?.width)return;
      current().layers.forEach(l=>{l.scale=Math.max(.1,l.size/area.width*100);});saveDraft();
    }
    function darkPrintNote(){return '<p class="sublimation-help"><b>Sublimation:</b> available only on light garment colours. On dark colours the sublimation ink cannot be seen correctly, so the option is disabled automatically.</p>';}
    function handles(layer){return '<button class="layer-remove" data-action="remove-layer" data-layer-id="'+S.esc(layer.id)+'" aria-label="Delete selected item">'+I('close')+'</button><button class="layer-rotate" data-transform="'+S.esc(layer.id)+'" aria-label="Rotate and resize selected item">'+I('rotate')+'</button>';}
    function layerHtml(layer){
      const pos=layer.position||{x:50,y:50},selected=state.active===layer.id;
      if(layer.type==='text')return '<div class="design-layer text-layer '+(selected?'selected':'')+'" data-layer-id="'+S.esc(layer.id)+'" data-layer-type="text" title="Double tap to edit" style="left:'+pos.x+'%;top:'+pos.y+'%;color:'+S.esc(layer.color)+';font-family:'+S.esc(layer.font)+';font-size:'+clampText(layer.size)+'px;transform:translate(-50%,-50%) rotate('+Number(layer.rotation||0)+'deg)"><span class="layer-text-content">'+S.esc(layer.value)+'</span>'+handles(layer)+'</div>';
      return '<div class="design-layer image-layer '+(selected?'selected':'')+'" data-layer-id="'+S.esc(layer.id)+'" data-layer-type="image" style="left:'+pos.x+'%;top:'+pos.y+'%;width:'+Math.max(10,Number(layer.size||82))+'px;transform:translate(-50%,-50%) rotate('+Number(layer.rotation||0)+'deg)"><img src="'+S.esc(layer.src)+'" alt="Uploaded artwork" draggable="false">'+handles(layer)+'</div>';
    }
    function layerList(){
      const layers=current().layers;if(!layers.length)return '<div class="layer-empty">No artwork on this side yet.</div>';
      let textN=0,imageN=0;
      return '<div class="layer-stack">'+layers.map(l=>{const n=l.type==='text'?++textN:++imageN;return '<button type="button" data-action="select-layer" data-layer-id="'+S.esc(l.id)+'" class="'+(state.active===l.id?'active':'')+'"><span>'+I(l.type==='text'?'type':'image')+'</span><b>'+(l.type==='text'?'Text ':'Image ')+n+'</b><small>'+(l.type==='text'?S.esc((l.value||'').slice(0,18)):'Artwork')+'</small></button>';}).join('')+'</div>';
    }
    function activeControls(maxSize){
      const l=activeLayer();if(!l)return '<section class="control-block selected-layer-control"><label>Selected layer</label><div class="selected-layer-empty">Tap any text or image on the garment, or add a new one.</div></section>';
      if(l.type==='text')return '<section class="control-block text-control selected-layer-control"><div class="selected-layer-title"><label>Selected text</label><button data-action="remove-layer" data-layer-id="'+S.esc(l.id)+'">'+I('trash')+' Remove</button></div><div class="input-with-icon">'+I('type')+'<input data-active-text value="'+S.esc(l.value)+'" maxlength="120" placeholder="Add text"></div><small class="edit-tip">You can add as many text layers as you need on this side.</small><div class="inline-fields multi-layer-fields"><div class="font-field"><span>Font style</span><div class="styled-select">'+picker('font',l.font,fontList.map(v=>({value:v,label:v})),state.pickerOpen)+'</div></div><input data-color-input type="color" value="'+S.esc(l.color)+'" aria-label="Text colour"><label class="range-field practical-size-range">Size <small>'+Math.round(l.size)+' px</small><input data-range="size" type="range" min="6" max="50" value="'+clampText(l.size)+'"></label><label class="range-field full-range">Rotate<input data-range="rotation" type="range" min="-180" max="180" value="'+Number(l.rotation||0)+'"></label></div></section>';
      return '<section class="control-block uploaded-control selected-layer-control"><div class="selected-layer-title"><label>Selected image</label><button data-action="remove-layer" data-layer-id="'+S.esc(l.id)+'">'+I('trash')+' Remove</button></div><button class="refined-upload" data-action="replace-image" data-layer-id="'+S.esc(l.id)+'"><img src="'+S.esc(l.src)+'" alt=""><span><b>Replace this image</b><small>PNG, JPG or WEBP</small></span>'+I('upload')+'</button><div class="artwork-tools"><label class="practical-size-range">Size <small>'+Math.round(l.size)+' px</small><input data-range="size" type="range" min="10" max="'+maxSize+'" value="'+Math.min(maxSize,l.size)+'"></label><label>Rotate<input data-range="rotation" type="range" min="-180" max="180" value="'+Number(l.rotation||0)+'"></label><button data-action="reset-image">'+I('rotate')+' Reset</button></div></section>';
    }

    function garmentColourPickerHtml(){
      return '<div class="fast-colour-overlay garment-colour-overlay" data-garment-picker aria-hidden="true"><div class="fast-colour-sheet" role="dialog" aria-modal="true" aria-label="Choose any colour"><div class="fast-colour-head"><strong>Choose any colour</strong><button type="button" data-garment-picker-close aria-label="Close">×</button></div><div class="fast-sv-wrap"><canvas width="640" height="360" data-garment-sv></canvas><i data-garment-sv-cursor></i></div><input class="fast-hue" data-garment-hue type="range" min="0" max="360" value="210" aria-label="Hue"><div class="fast-picker-bottom"><i data-garment-colour-preview></i><label><span>#</span><input data-garment-hex value="1F2C43" maxlength="6" inputmode="text" aria-label="Hex colour"></label><button type="button" data-garment-picker-apply>Apply</button></div></div></div>';
    }
    function setGarmentTintPreview(value){const tint=root.querySelector('.compact-garment > .garment-tint');if(tint)tint.style.background=value;}
    function bindGarmentColourPicker(){
      const overlay=root.querySelector('[data-garment-picker]'),sv=root.querySelector('[data-garment-sv]'),ctx=sv?.getContext('2d'),cursor=root.querySelector('[data-garment-sv-cursor]'),hue=root.querySelector('[data-garment-hue]'),hex=root.querySelector('[data-garment-hex]'),preview=root.querySelector('[data-garment-colour-preview]');if(!overlay||!sv||!ctx)return;
      const draw=()=>{const w=sv.width,h=sv.height,[r,g,b]=hsvToRgb(colourPickerH,1,1);ctx.fillStyle=rgbToHex(r,g,b);ctx.fillRect(0,0,w,h);let g1=ctx.createLinearGradient(0,0,w,0);g1.addColorStop(0,'#fff');g1.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g1;ctx.fillRect(0,0,w,h);g1=ctx.createLinearGradient(0,0,0,h);g1.addColorStop(0,'rgba(0,0,0,0)');g1.addColorStop(1,'#000');ctx.fillStyle=g1;ctx.fillRect(0,0,w,h);if(cursor){cursor.style.left=(colourPickerS*100)+'%';cursor.style.top=((1-colourPickerV)*100)+'%';}};
      const setFromHSV=()=>{colourPickerValue=rgbToHex(...hsvToRgb(colourPickerH,colourPickerS,colourPickerV));if(hex)hex.value=colourPickerValue.slice(1).toUpperCase();if(preview)preview.style.background=colourPickerValue;setGarmentTintPreview(colourPickerValue);draw();};
      const setFromHex=value=>{if(!/^#[0-9a-f]{6}$/i.test(value))return false;colourPickerValue=value.toLowerCase();const[h,s,v]=rgbToHsv(...hexToRgb(value));colourPickerH=h;colourPickerS=s;colourPickerV=v;if(hue)hue.value=Math.round(h);if(hex)hex.value=value.slice(1).toUpperCase();if(preview)preview.style.background=value;setGarmentTintPreview(value);draw();return true;};
      const close=apply=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.documentElement.classList.remove('fast-picker-lock');document.body.classList.remove('fast-picker-lock');if(!apply)setGarmentTintPreview(colourValue(state.color));};
      root.querySelector('[data-garment-picker-close]')?.addEventListener('click',()=>close(false));overlay.addEventListener('click',e=>{if(e.target===overlay)close(false);});
      root.querySelector('[data-garment-picker-apply]')?.addEventListener('click',()=>{const value='#'+String(hex?.value||'').trim();if(!setFromHex(value))return;state.color=colourPickerValue;if(S.isDarkColor(state.color)&&chosenPrint().lightOnly)state.printType=state.printMethods.find(p=>!p.lightOnly)?.name||'DTF Print';saveDraft();close(true);render();});
      hue?.addEventListener('input',e=>{colourPickerH=+e.target.value;setFromHSV();});hex?.addEventListener('input',e=>{const v=e.target.value.replace(/[^0-9a-f]/gi,'').slice(0,6);e.target.value=v.toUpperCase();if(v.length===6)setFromHex('#'+v);});
      const pick=e=>{const r=sv.getBoundingClientRect(),x=clamp(e.clientX-r.left,0,r.width),y=clamp(e.clientY-r.top,0,r.height);colourPickerS=x/r.width;colourPickerV=1-y/r.height;setFromHSV();};sv.addEventListener('pointerdown',e=>{try{sv.setPointerCapture(e.pointerId);}catch(_){}pick(e);});sv.addEventListener('pointermove',e=>{if(e.buttons)pick(e);});
      root._openGarmentColourPicker=()=>{setFromHex(customColourValue());overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.documentElement.classList.add('fast-picker-lock');document.body.classList.add('fast-picker-lock');};
    }

    async function shareDesigner(){
      const url=new URL(location.href);url.searchParams.delete('section');url.hash='customize';const value=url.toString();
      try{if(navigator.share){await navigator.share({title:'One-Line apparel customizer',text:'Customize an apparel design',url:value});return;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return;}}catch(err){if(err?.name==='AbortError')return;}
      try{const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}catch(_){}
    }

    function render(){
      const sleeve=state.surface.includes("Sleeve"),src=garmentSrc(),dark=S.isDarkColor(state.color),maxSize=resizeMax();
      root.innerHTML='<main class="designer-page compact-designer old-model-designer unlimited-layer-designer">'+
        '<header class="sub-header refined-sub-header"><button class="designer-back" data-action="back" aria-label="Back to store">'+I('back')+'</button><div class="step-label"><span>01</span> CUSTOMIZE YOUR APPAREL</div><button class="cart-button" data-action="add"><span>Add · '+S.money(unitPrice()*state.qty)+'</span>'+I('bag')+'</button></header>'+
        '<div class="designer-layout compact-designer-layout"><section class="designer-stage compact-stage locked-garment-stage" data-stage>'+
          '<div class="compact-designer-bar"><section class="stage-garment-type"><label>Type</label><div class="garment-type-cards">'+models.map(m=>'<button data-action="model-card" data-value="'+S.esc(m.name)+'" class="'+(m.name===state.model.name?'active':'')+'"><b>'+S.esc(m.type)+'</b>'+(m.typeExtra?'<small>+'+S.money(m.typeExtra)+'</small>':'<small>Base type</small>')+'</button>').join('')+'</div></section><div class="compact-surface-tabs" aria-label="Choose print area">'+surfaces.map(x=>'<button data-action="surface" data-value="'+x.id+'" class="'+(x.id===state.surface?'active':'')+'"><span class="full-label">'+x.label+'</span><span class="short-label">'+x.short+'</span>'+(state.designs[x.id].layers.length?'<i></i>':'')+'</button>').join('')+'</div></div>'+
          '<div class="stage-topline"><span>'+surfaceLabel()+'</span><span>GARMENT LOCKED · MOVE PRINT ONLY</span></div>'+
          '<div class="shirt-canvas compact-shirt-canvas view-'+state.surface+'"><div class="live-garment compact-garment garment-'+state.surface+' locked-garment"><div class="garment-depth"></div>'+
            '<img class="garment-photo '+(sleeve?'sleeve-photo ':'')+(state.surface==='rightSleeve'?'mirror-sleeve':'')+'" src="'+src+'" alt="'+S.esc(state.model.name+' '+surfaceLabel())+'" draggable="false">'+
            '<div class="garment-tint '+(sleeve?'sleeve-tint ':'')+(state.surface==='rightSleeve'?'mirror-sleeve':'')+'" style="background:'+colourValue(state.color)+';mask-image:url('+src+');-webkit-mask-image:url('+src+')"></div>'+
            '<div class="print-area surface-'+state.surface+'" data-print-area>'+current().layers.map(layerHtml).join('')+'</div></div></div><p class="drag-hint">'+I('move')+' Move any layer · pinch or corner handle to resize/rotate · double tap text to edit</p></section>'+
          '<aside class="designer-controls compact-controls"><div class="control-head"><span>DESIGN CONTROLS</span><div class="control-head-actions"><small>'+surfaceLabel()+'</small><button type="button" class="designer-section-share" data-action="share-designer" aria-label="Share customizer">'+I('share')+'</button></div></div>'+
            '<section class="control-block garment-colour-control"><label>Garment colour</label><div class="swatches garment-colour-swatches">'+presetColours.map(c=>'<button aria-label="'+c+'" title="'+c+'" data-action="color" data-value="'+c+'" class="'+(state.color===c?'active':'')+'" style="background:'+S.palette[c]+'">'+(state.color===c?I('check'):'')+'</button>').join('')+'<button type="button" aria-label="Choose any colour" title="Choose any colour" data-action="custom-color-open" class="custom-colour-swatch '+(usingCustomColour()?'active':'')+'"></button></div><button type="button" class="choose-any-colour-row" data-action="custom-color-open"><span><i style="background:'+customColourValue()+'"></i>Choose any colour</span>'+I('chevron')+'</button></section>'+
            '<div class="quick-layer-tools unlimited-add-tools"><button data-action="add-text">'+I('type')+'<span>Add text</span></button><button data-action="choose-image">'+I('image')+'<span>Add image</span></button><input data-file hidden type="file" accept="image/*" multiple></div>'+
            '<section class="control-block material-quality-control"><label>Cloth type</label><div class="material-quality-cards">'+materials.map(m=>'<button data-action="material-card" data-value="'+S.esc(m.name)+'" class="'+(m.name===state.material.name?'active':'')+'"><span><b>'+S.esc(m.name)+'</b><strong>'+S.money(m.price)+'</strong></span><small>'+S.esc(m.note)+'</small></button>').join('')+'</div></section>'+
            '<section class="control-block size-only-control"><label>Size</label><div class="styled-select">'+picker('size',state.size,["XS","S","M","L","XL","XXL","3XL"].map(v=>({value:v,label:v})),state.pickerOpen)+'</div></section>'+
            '<section class="control-block layer-manager"><div class="layer-manager-head"><label>Layers on '+surfaceLabel()+'</label><small>'+current().layers.length+' total</small></div>'+layerList()+'</section>'+
            activeControls(maxSize)+
            '<section class="control-block print-control"><label>Printing type</label><div class="print-options">'+state.printMethods.map(p=>{const disabled=!!(p.lightOnly&&dark);return '<button data-action="print" data-value="'+S.esc(p.name)+'" class="'+(state.printType===p.name?'active ':'')+(disabled?'disabled':'')+'" '+(disabled?'disabled aria-disabled="true"':'')+'><span>'+(state.printType===p.name?I('check'):'')+'</span><b>'+S.esc(p.name)+'</b><small>'+S.esc(p.note)+'</small><strong>+'+S.money(p.price)+'</strong></button>';}).join('')+'</div>'+darkPrintNote()+'</section>'+
            '<div class="designer-total refined-total"><div><small>Estimated total</small><strong>'+S.money(unitPrice()*state.qty)+'</strong><span>'+state.model.type+' · '+state.material.name+' · '+designedCount()+' print area'+(designedCount()===1?'':'s')+' · '+state.qty+' piece'+(state.qty===1?'':'s')+'</span></div><div class="qty-control polished-qty"><button data-action="qty-minus">'+I('minus')+'</button><span>'+state.qty+'</span><button data-action="qty-plus">'+I('plus')+'</button></div></div><button class="primary wide refined-add" data-action="add">Add custom design to cart '+I('arrow')+'</button>'+
          '</aside></div></main>'+garmentColourPickerHtml();
      bind();bindGarmentColourPicker();requestAnimationFrame(syncCurrentScale);
    }

    function chooseModel(value){const found=models.find(m=>m.name===value);if(found){state.model=found;saveDraft();}}
    function chooseMaterial(value){const found=materials.find(m=>m.name===value);if(found){state.material=found;saveDraft();}}
    function removeLayer(id){const idx=current().layers.findIndex(l=>l.id===id);if(idx>=0)current().layers.splice(idx,1);if(state.active===id)state.active=null;saveDraft();render();}
    function legacySurface(surface){
      const text=surface.layers.find(l=>l.type==='text'),image=surface.layers.find(l=>l.type==='image');
      return{text:text?.value||'',font:text?.font||'Impact',textColor:text?.color||'#fff',textSize:text?.size||30,textScale:text?.scale||18,textRotation:text?.rotation||0,uploadedImage:image?.src||'',imageSize:image?.size||82,imageScale:image?.scale||38,imageRotation:image?.rotation||0,positions:{text:clone(text?.position||{x:50,y:38}),image:clone(image?.position||{x:50,y:62})},layers:clone(surface.layers)};
    }
    function makeDesign(){
      syncCurrentScale();const front=legacySurface(state.designs.front),surfaceDesigns=Object.fromEntries(surfaces.map(s=>[s.id,legacySurface(state.designs[s.id])]));
      return{model:state.model.name,garmentType:state.model.type,materialQuality:state.material.name,materialPrice:state.material.price,garmentImage:state.model.image,garmentBackImage:state.model.backImage,sleeveImage,garmentColor:state.color,text:front.text,font:front.font,textColor:front.textColor,textSize:front.textSize,textScale:front.textScale,textRotation:front.textRotation,uploadedImage:front.uploadedImage,imageSize:front.imageSize,imageScale:front.imageScale,imageRotation:front.imageRotation,positions:front.positions,printType:state.printType,surfaceDesigns};
    }
    function add(){const customDesign=makeDesign();hooks.onAdd({key:'custom-'+Date.now(),name:state.model.type+' · Custom',price:unitPrice(),qty:state.qty,color:state.color,size:state.size,detail:state.material.name+' cloth · '+state.printType+' · '+designedCount()+' print area'+(designedCount()===1?'':'s'),image:state.model.image,custom:true,customDesign});saveDraft();}
    function compressImage(file){
      return new Promise((resolve,reject)=>{if(!file||!file.type.startsWith('image/')){reject(new Error('Not an image'));return;}const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{const scale=Math.min(1,1000/Math.max(im.width,im.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*scale));canvas.height=Math.max(1,Math.round(im.height*scale));const ctx=canvas.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/webp',.76));};im.src=String(reader.result);};reader.readAsDataURL(file);});
    }
    async function uploadFiles(files,replaceId){
      const list=[...files].filter(f=>f?.type?.startsWith('image/'));if(!list.length)return;
      try{
        if(replaceId){const layer=layerById(replaceId);if(layer&&layer.type==='image'){layer.src=await compressImage(list[0]);layer.rotation=0;state.active=layer.id;}}
        else{for(const file of list){const src=await compressImage(file),layer=makeImage(src,current().layers.length);current().layers.push(layer);state.active=layer.id;}}
        saveDraft();render();
      }catch(err){console.error(err);alert('That image could not be added. Please try another image file.');}
    }
    function focusTextEditor(id){state.active=id;render();setTimeout(()=>{const input=root.querySelector('[data-active-text]');if(!input)return;input.focus({preventScroll:true});input.select();input.scrollIntoView({behavior:'auto',block:'nearest'});},20);}
    function applyLayerStyle(layer){
      const el=root.querySelector('[data-layer-id="'+CSS.escape(layer.id)+'"]');if(!el)return;
      el.style.left=layer.position.x+'%';el.style.top=layer.position.y+'%';el.style.transform='translate(-50%,-50%) rotate('+Number(layer.rotation||0)+'deg)';
      if(layer.type==='text'){el.style.fontSize=clampText(layer.size)+'px';el.style.fontFamily=layer.font;el.style.color=layer.color;const span=el.querySelector('.layer-text-content');if(span)span.textContent=layer.value;}
      else el.style.width=Math.max(10,Number(layer.size||82))+'px';
    }
    function setSelectedVisual(id){root.querySelectorAll('.design-layer').forEach(el=>el.classList.toggle('selected',el.dataset.layerId===id));root.querySelectorAll('.layer-stack button').forEach(el=>el.classList.toggle('active',el.dataset.layerId===id));}
    function selectLayer(id){if(!layerById(id))return;state.active=id;setSelectedVisual(id);saveDraft();}

    function bind(){
      root.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',e=>{
        const a=el.dataset.action;
        if(a==='back'){syncCurrentScale();hooks.onBack();}
        else if(a==='add')add();
        else if(a==='surface'){syncCurrentScale();state.surface=el.dataset.value;state.active=null;state.pickerOpen=null;saveDraft();render();}
        else if(a==='toggle-picker'){e.stopPropagation();state.pickerOpen=state.pickerOpen===el.dataset.pickerName?null:el.dataset.pickerName;render();}
        else if(a==='pick'){const n=el.dataset.pickerName,v=el.dataset.value;if(n==='size')state.size=v;if(n==='font'&&activeLayer()?.type==='text')activeLayer().font=v;state.pickerOpen=null;saveDraft();render();}
        else if(a==='model-card'){chooseModel(el.dataset.value);render();}
        else if(a==='material-card'){chooseMaterial(el.dataset.value);render();}
        else if(a==='add-text'){const layer=makeText('YOUR TEXT',current().layers.length);current().layers.push(layer);state.active=layer.id;saveDraft();focusTextEditor(layer.id);}
        else if(a==='choose-image'){state.fileMode='add';state.replaceLayerId=null;root.querySelector('[data-file]')?.click();}
        else if(a==='replace-image'){state.fileMode='replace';state.replaceLayerId=el.dataset.layerId;root.querySelector('[data-file]')?.click();}
        else if(a==='select-layer'){state.active=el.dataset.layerId;state.pickerOpen=null;saveDraft();render();}
        else if(a==='color'){state.color=el.dataset.value;if(S.isDarkColor(state.color)&&chosenPrint().lightOnly)state.printType=state.printMethods.find(p=>!p.lightOnly)?.name||'DTF Print';saveDraft();render();}
        else if(a==='custom-color-open'){root._openGarmentColourPicker?.();}
        else if(a==='share-designer'){shareDesigner();}
        else if(a==='remove-layer'){e.preventDefault();e.stopPropagation();removeLayer(el.dataset.layerId);}
        else if(a==='print'){if(el.disabled)return;state.printType=el.dataset.value;saveDraft();render();}
        else if(a==='reset-image'){const l=activeLayer();if(l?.type==='image'){l.rotation=0;saveDraft();render();}}
        else if(a==='qty-minus'){state.qty=Math.max(1,state.qty-1);saveDraft();render();}
        else if(a==='qty-plus'){state.qty++;saveDraft();render();}
      }));
      const file=root.querySelector('[data-file]');if(file)file.addEventListener('change',()=>{const replace=state.fileMode==='replace'?state.replaceLayerId:null;uploadFiles(file.files||[],replace);file.value='';state.fileMode='add';state.replaceLayerId=null;});
      const txt=root.querySelector('[data-active-text]');if(txt)txt.addEventListener('input',()=>{const l=activeLayer();if(!l||l.type!=='text')return;l.value=txt.value;const textEl=root.querySelector('[data-layer-id="'+CSS.escape(l.id)+'"] .layer-text-content');if(textEl)textEl.textContent=l.value;saveDraft();});
      const col=root.querySelector('[data-color-input]');if(col)col.addEventListener('input',()=>{const l=activeLayer();if(!l||l.type!=='text')return;l.color=col.value;applyLayerStyle(l);saveDraft();});
      root.querySelectorAll('[data-range]').forEach(el=>el.addEventListener('input',()=>{const l=activeLayer();if(!l)return;if(el.dataset.range==='size')l.size=l.type==='text'?clampText(el.value):Math.max(10,Number(el.value));else if(el.dataset.range==='rotation')l.rotation=Number(el.value);const label=el.closest('label')?.querySelector('small');if(label&&el.dataset.range==='size')label.textContent=Math.round(l.size)+' px';applyLayerStyle(l);saveDraft();}));

      root.querySelectorAll('.design-layer[data-layer-id]').forEach(el=>{
        const id=el.dataset.layerId;
        el.addEventListener('dblclick',e=>{const l=layerById(id);if(l?.type==='text'){e.preventDefault();e.stopPropagation();focusTextEditor(id);}});
        el.addEventListener('pointerdown',e=>{
          if(e.target.closest('button'))return;e.preventDefault();e.stopPropagation();const l=layerById(id);if(!l)return;const now=Date.now();
          if(l.type==='text'&&lastTap.id===id&&now-lastTap.time<330){lastTap={time:0,id:''};focusTextEditor(id);return;}lastTap={time:now,id};
          selectLayer(id);try{el.setPointerCapture(e.pointerId);}catch(_){}
          const area=root.querySelector('[data-print-area]')?.getBoundingClientRect();if(!area)return;const px=area.left+(l.position.x/100)*area.width,py=area.top+(l.position.y/100)*area.height;
          pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,id,offsetX:e.clientX-px,offsetY:e.clientY-py});const pts=[...pointers.values()].filter(p=>p.id===id);
          if(pts.length===2)pinch={id,distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1,angle:Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x)*180/Math.PI,size:l.size,rotation:l.rotation||0};
        });
        el.addEventListener('pointermove',e=>{
          const p=pointers.get(e.pointerId);if(!p||p.id!==id)return;e.preventDefault();p.x=e.clientX;p.y=e.clientY;const l=layerById(id),area=root.querySelector('[data-print-area]')?.getBoundingClientRect();if(!l||!area)return;const pts=[...pointers.values()].filter(x=>x.id===id);
          if(pts.length>=2){if(!pinch||pinch.id!==id){pinch={id,distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1,angle:Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x)*180/Math.PI,size:l.size,rotation:l.rotation||0};}const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)||1,ang=Math.atan2(pts[1].y-pts[0].y,pts[1].x-pts[0].x)*180/Math.PI;l.size=l.type==='text'?clampText(pinch.size*(dist/pinch.distance)):Math.max(10,pinch.size*(dist/pinch.distance));l.rotation=Math.round(pinch.rotation+(ang-pinch.angle));}
          else{l.position.x=clamp((e.clientX-p.offsetX-area.left)/area.width*100,-30,130);l.position.y=clamp((e.clientY-p.offsetY-area.top)/area.height*100,-30,130);}
          applyLayerStyle(l);
        });
        const end=e=>{if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if([...pointers.values()].filter(p=>p.id===id).length<2)pinch=null;syncCurrentScale();};
        el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
      });
      root.querySelectorAll('[data-transform]').forEach(handle=>{
        handle.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const id=handle.dataset.transform,l=layerById(id);if(!l)return;selectLayer(id);const box=handle.parentElement.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;transformGesture={id:e.pointerId,layerId:id,cx,cy,angle:Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI,rotation:l.rotation||0,distance:Math.max(1,Math.hypot(e.clientX-cx,e.clientY-cy)),size:l.size};try{handle.setPointerCapture(e.pointerId);}catch(_){}});
        handle.addEventListener('pointermove',e=>{const g=transformGesture;if(!g||g.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const l=layerById(g.layerId);if(!l)return;const angle=Math.atan2(e.clientY-g.cy,e.clientX-g.cx)*180/Math.PI,distance=Math.max(1,Math.hypot(e.clientX-g.cx,e.clientY-g.cy));let rotation=g.rotation+angle-g.angle;if(Math.abs(rotation%45)<3)rotation=Math.round(rotation/45)*45;l.rotation=Math.round(rotation);const size=g.size*(distance/g.distance);l.size=l.type==='text'?clampText(size):Math.max(10,size);applyLayerStyle(l);});
        const finish=e=>{if(!transformGesture||transformGesture.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();transformGesture=null;syncCurrentScale();};handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
      });
      const stage=root.querySelector('[data-stage]');if(stage)stage.addEventListener('pointerdown',e=>{if(!e.target.closest('.design-layer')&&!e.target.closest('.custom-picker')&&state.active){state.active=null;state.pickerOpen=null;render();}});
    }

    let lastViewportWidth=Math.round(window.visualViewport?.width||window.innerWidth||0);
    const onResize=()=>{const active=document.activeElement;if(active&&(active.matches?.('input, textarea, select')||active.isContentEditable))return;const nextWidth=Math.round(window.visualViewport?.width||window.innerWidth||0);if(Math.abs(nextWidth-lastViewportWidth)<2)return;lastViewportWidth=nextWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>render(),90);};
    window.addEventListener('resize',onResize);window.visualViewport?.addEventListener?.('resize',onResize);
    render();
    return{destroy(){clearTimeout(resizeTimer);window.removeEventListener('resize',onResize);window.visualViewport?.removeEventListener?.('resize',onResize);syncCurrentScale();root.innerHTML='';}};
  }
  window.OneLineDesigner={mount};
})();
