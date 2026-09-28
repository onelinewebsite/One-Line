(function () {
  "use strict";

  const palette = {
    Black: "#18191d", White: "#f6f5f1", Navy: "#192a45", Maroon: "#681f35",
    Olive: "#566142", Sky: "#9ac6e9", Sand: "#cfb992", Red: "#b8333d",
    Green: "#2e724c", Yellow: "#e6bf3b", Grey: "#8d9198", Pink: "#d98ca0"
  };

  // No catalogue demo imagery ships in production. This fallback is used only by the custom designer helper.
  const onlineImages = { tshirtBlack: "assets/crew-tee.webp" };


  // Production build intentionally ships with no demo catalogue, categories or orders.
  // Live data is hydrated from the client Supabase project by js/backend.js.
  const seedCategories = [];
  const cv = (color, image, sizes) => ({ color, image, sizes: sizes.slice() });
  const seedProducts = [];
  const seedOrders = [];
  const deliveryDefaults = [
    {name:"Courier",note:"Door delivery · charge confirmed with order",active:true},
    {name:"Store pickup",note:"Collect from the production desk",active:true},
    {name:"Bus parcel",note:"Collect from your selected bus stand",active:true}
  ];
  const printDefaults = [
    {name:"DTF Print",price:180,note:"Vivid colour · works on light and dark garments"},
    {name:"Screen Print",price:120,note:"Durable and efficient for quantity orders"},
    {name:"Embroidery",price:260,note:"Premium stitched thread finish"},
    {name:"Sublimation",price:150,note:"Light colours only · ink is not visible correctly on dark garments",lightOnly:true}
  ];

  const iconPaths = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', bag:'<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/>', cart:'<circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/><path d="M3 5h2l2.3 9.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 .98-.78L20 8H7"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
    home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/>', orders:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/>',
    arrow:'<path d="M5 12h14M14 6l6 6-6 6"/>', back:'<path d="m15 18-6-6 6-6M9 12h11"/>', check:'<path d="m5 12 4 4L19 6"/>',
    shield:'<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>', package:'<path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>',
    truck:'<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>', type:'<path d="M5 5h14M12 5v14M8 19h8"/>',
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 4"/>', sliders:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>',
    move:'<path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>', sparkle:'<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>', map:'<path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="10" r="2"/>',
    card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>', download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>', upload:'<path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14"/>', rotate:'<path d="M20 11a8 8 0 1 0-2 5M20 4v7h-7"/>',
    box:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v5"/>', external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>', eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2"/>',
    phone:'<path d="M7 3 4 5c0 8 7 15 15 15l2-3-5-3-2 2c-3-1-5-3-6-6l2-2-3-5Z"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-4.2 3.2-6.3 7.5-6.3s6.7 2.1 7.5 6.3"/>', edit:'<path d="m4 20 4-.8L19 8.2 15.8 5 4.8 16 4 20Z"/><path d="m13.8 7 3.2 3.2"/>',
    contact:'<circle cx="8.5" cy="7.5" r="3"/><path d="M3.5 18c.7-3 2.4-4.5 5-4.5s4.3 1.5 5 4.5"/><path d="M15 6h6v7h-3l-3 2V6Z"/><path d="M17.5 9.5h1"/>',
    tag:'<path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.25"/>',
    share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
    zoom:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>', whatsapp:'<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 3.04 4.03c.424.255.754.407 1.012.521.425.18.81.154 1.115.093.34-.051 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.885 9.888-9.885a9.82 9.82 0 0 1 6.99 2.9 9.825 9.825 0 0 1 2.894 6.99c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0 0 12.055 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.69 1.448h.005c6.558 0 11.893-5.335 11.896-11.893a11.821 11.821 0 0 0-3.489-8.413Z"/>'
  };

  const clone = value => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  function icon(name, cls){ const auto=name==="whatsapp"?" whatsapp-brand":""; return '<svg class="icon '+(cls||'')+auto+'" viewBox="0 0 24 24" aria-hidden="true">'+(iconPaths[name]||iconPaths.sparkle)+'</svg>'; }
  function money(value){ return "₹"+Number(value||0).toLocaleString("en-IN"); }
  function esc(value){ return String(value ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]); }
  function load(key,fallback){ try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):clone(fallback);}catch(_){return clone(fallback);} }
  const legacyTshirtImage = 'https://images.pexels.com/photos/35625406/pexels-photo-35625406.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop';
  function migrateKnownAssets(value){
    const walk=v=>{
      if(Array.isArray(v))return v.map(walk);
      if(v&&typeof v==="object"){const out={};for(const [k,x] of Object.entries(v))out[k]=walk(x);return out;}
      return v===legacyTshirtImage?onlineImages.tshirtBlack:v;
    };
    return walk(value);
  }
  function save(key,value){ localStorage.setItem(key,JSON.stringify(value)); window.dispatchEvent(new CustomEvent("one-line-change",{detail:{key}})); }
  function getProducts(){ return migrateKnownAssets(load("custom-store-products-v3",[])); }
  // v41: authenticated cart and order history are never read from device cache.
  function getOrders(){ return []; }
  function getCart(){ return []; }
  function getCategories(){ return migrateKnownAssets(load("custom-store-categories-v3",[])); }
  function getCustomCatalogCategories(){ return migrateKnownAssets(load("one-line-custom-catalog-categories-v1",[])); }
  function getCustomCatalogItems(){ return migrateKnownAssets(load("one-line-custom-catalog-items-v1",[])); }
  function getDelivery(){ return load("custom-store-delivery-v3",deliveryDefaults); }
  function getPrints(){ return load("custom-store-print-types-v3",printDefaults); }
  function getSettings(){ return load("custom-store-settings-v3",{whatsapp:"",b2bId:"",b2bPassword:""}); }
  function isDarkColor(name){ const value=String(name||'').trim().toLowerCase(); if(/^#[0-9a-f]{6}$/i.test(value)){const n=parseInt(value.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; return (r*.2126+g*.7152+b*.0722)<155;} return ["black","navy","maroon","olive","green","blue","charcoal","brown","purple"].some(x=>value.includes(x)); }
  function productOptions(product){
    if(product?.type==="Simple") return [];
    if(Array.isArray(product?.colorVariants) && product.colorVariants.length) return [...new Set(product.colorVariants.flatMap(v=>v.sizes||[]))];
    return Array.isArray(product?.sizes)?product.sizes:[];
  }
  function productImageForColor(product,color){
    const row=product?.colorVariants?.find(v=>String(v.color).toLowerCase()===String(color||"").toLowerCase());
    return row?.image || product?.images?.[0] || product?.image || onlineImages.tshirtBlack;
  }

  function surfaceDesign(design,surface){
    const blank={text:"",font:"Impact",textColor:"#fff",textSize:30,textRotation:0,uploadedImage:"",imageSize:82,imageRotation:0,positions:{text:{x:50,y:40},image:{x:50,y:62}},textScale:22,imageScale:38,layers:[]};
    let raw=null;
    if(design?.surfaceDesigns?.[surface])raw=design.surfaceDesigns[surface];
    else if(surface==="front"&&design)raw=design;
    if(!raw)return clone(blank);
    const out=Object.assign({},blank,raw);out.positions=Object.assign({},blank.positions,raw.positions||{});
    if(Array.isArray(raw.layers))out.layers=raw.layers.filter(Boolean).map(l=>Object.assign({},l,{position:Object.assign({x:50,y:50},l.position||{})}));
    else{
      out.layers=[];
      if(raw.text)out.layers.push({type:'text',value:raw.text,font:raw.font||'Impact',color:raw.textColor||'#fff',size:Number(raw.textSize||30),rotation:Number(raw.textRotation||0),position:Object.assign({x:50,y:40},raw.positions?.text||{}),scale:Number(raw.textScale||22)});
      if(raw.uploadedImage)out.layers.push({type:'image',src:raw.uploadedImage,size:Number(raw.imageSize||82),rotation:Number(raw.imageRotation||0),position:Object.assign({x:50,y:62},raw.positions?.image||{}),scale:Number(raw.imageScale||38)});
    }
    return out;
  }
  function designedSurfaces(design){return ["front","back","rightSleeve","leftSleeve"].filter(s=>{const d=surfaceDesign(design,s);return d.layers?.length||d.text||d.uploadedImage;});}
  function designPreview(design,surface,className){
    surface=surface||"front";const d=surfaceDesign(design,surface),sleeve=surface.includes("Sleeve");
    const fallbackSleeve=design.sleeveImage||"assets/sleeve-side-neutral.webp";
    const garment=surface==="leftSleeve"?(design.leftSleeveImage||fallbackSleeve):surface==="rightSleeve"?(design.rightSleeveImage||fallbackSleeve):surface==="back"?(design.garmentBackImage||design.garmentImage):design.garmentImage;
    const mirror=(surface==="rightSleeve"&&!design.rightSleeveImage)?" scaleX(-1)":"",zone="zone-"+surface;
    const layers=(d.layers?.length?d.layers:[
      d.text?{type:'text',value:d.text,font:d.font,color:d.textColor,size:d.textSize,rotation:d.textRotation,position:d.positions.text,scale:d.textScale}:null,
      d.uploadedImage?{type:'image',src:d.uploadedImage,size:d.imageSize,rotation:d.imageRotation,position:d.positions.image,scale:d.imageScale}:null
    ].filter(Boolean));
    const content=layers.map(l=>{
      const pos=l.position||{x:50,y:50};
      if(l.type==='text'){
        const scale=Number(l.scale||Math.max(8,(l.size||30)*.72));
        return '<span class="saved-design-text" style="left:'+Number(pos.x||0)+'%;top:'+Number(pos.y||0)+'%;color:'+esc(l.color||'#fff')+';font-family:'+esc(l.font||'Impact')+';font-size:'+scale+'cqw;transform:translate(-50%,-50%) rotate('+Number(l.rotation||0)+'deg)">'+esc(l.value||'')+'</span>';
      }
      if(l.type==='image'&&l.src){
        const scale=Number(l.scale||Math.max(18,(l.size||82)*.46));
        return '<img class="saved-design-image" src="'+esc(l.src)+'" alt="" style="left:'+Number(pos.x||0)+'%;top:'+Number(pos.y||0)+'%;width:'+scale+'%;transform:translate(-50%,-50%) rotate('+Number(l.rotation||0)+'deg)" />';
      }
      return '';
    }).join('');
    return '<div class="real-garment-preview preview-'+surface+' '+esc(className||'')+'"><div class="garment-depth"></div><img class="garment-photo '+(sleeve?'sleeve-preview ':'')+(surface==='rightSleeve'?'show-rightSleeve':'')+'" src="'+esc(garment)+'" alt="" style="transform:'+mirror+'"><span class="garment-tint '+(sleeve?'sleeve-preview ':'')+(surface==='rightSleeve'?'show-rightSleeve':'')+'" style="background:'+esc(palette[design.garmentColor]||design.garmentColor||palette.Navy)+';mask-image:url('+esc(garment)+');-webkit-mask-image:url('+esc(garment)+');transform:'+mirror+'"></span><div class="garment-print-zone '+zone+'">'+content+'</div></div>';
  }

  window.OneLineStore={palette,onlineImages,seedCategories,seedProducts,seedOrders,deliveryDefaults,printDefaults,icon,money,esc,load,save,getProducts,getOrders,getCart,getCategories,getCustomCatalogCategories,getCustomCatalogItems,getDelivery,getPrints,getSettings,isDarkColor,productOptions,productImageForColor,surfaceDesign,designedSurfaces,designPreview};
})();
