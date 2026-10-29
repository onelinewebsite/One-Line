/* v215: Screenshot-style readable One-Line A4 order summary; separate courier 4x6 shipping label.
   PDFs use saved order data; the A4 order summary embeds the business logo and saved item photos where available. */
(function(){
'use strict';
const clean=v=>String(v===null||v===undefined?'':v).replace(/[^\x20-\x7E\n]/g,' ').replace(/[\t\r]+/g,' ').trim();
const cash=v=>'INR '+Number(v||0).toFixed(2);
const orderCode=o=>clean(o.order_code||o.orderCode||o.id||'');
const details=o=>o.metadata?.deliveryRecipient||{};
const fmtDate=o=>{const s=o.created_at||o.createdAt||o.time||'';const d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' IST':clean(s);};
// Keep ordered sizes, colours and variants once per line. Old order rows can
// contain the same size both in item.size and in design.sizeQuantities.
function linesFor(order,items){
 const lines=[];
 const sizeEntries=source=>Object.entries(source||{}).filter(([size,qty])=>clean(size)&&Number(qty)>0);
 const sizeKey=v=>clean(v).toLowerCase().replace(/\s+/g,' ').trim();
 const asSizeText=(name,qty)=>clean(name)+' x '+Number(qty);
 for(const item of items||[]){
  const d=item.design_json||item.design||item.uniformOrder||{};
  const name=clean(item.item_name||item.name||'Item'),type=clean(item.item_type||item.itemType||'product');
  const qty=Number(item.qty??item.quantity??1),rate=Number(item.unit_price??item.price??0);
  const sourceImages=Array.isArray(d.selectedItems)?d.selectedItems.flatMap(v=>Array.isArray(v.images)?v.images:[]):[];
  const picture=sourceImages.find(Boolean)||(Array.isArray(d.images)?d.images.find(Boolean):'')||d.cardImage||d.image||d.frontCompositeUrl||d.design?.front?.compositeUrl||d.front?.compositeUrl||item.image||'';
  const code=clean(item.item_code||item.code||'');
  // Some existing names already include their model/item code (e.g. Socks #85).
  const codeAlreadyInName=code&&new RegExp('(?:^|[^a-z0-9])#?'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-z0-9])','i').test(name);
  const entry={name,code:codeAlreadyInName?'':code,type,qty,rate,total:Number(item.line_total??item.total??qty*rate),image:picture,notes:[]};
  const seen=new Set();
  const note=value=>{const v=clean(value);if(v&&!seen.has(v.toLowerCase())){seen.add(v.toLowerCase());entry.notes.push(v);}};
  const colour=clean(item.color||d.garmentColor||'');
  const baseSize=clean(item.size||'');
  const selected=Array.isArray(d.selectedItems)?d.selectedItems.filter(Boolean):[];
  const sized=Array.isArray(d.jerseySizes)?d.jerseySizes:Array.isArray(d.printableSizes)?d.printableSizes:[];
  const explicitSizes=sized.filter(row=>clean(row?.size)&&Number(row?.qty)>0).map(row=>[clean(row.size),Number(row.qty)]);
  const aggregateSizes=sizeEntries(d.sizeQuantities);
  const variantSizes=selected.flatMap(v=>sizeEntries(v.sizeQuantities));
  // Prefer the size-specific details for special orders, but avoid showing the
  // aggregate and per-variant size sets together (the latter is authoritative).
  // Match the reference's compact 'Item / Colour / Size' table entry.
  const primarySizes=explicitSizes.length?explicitSizes:aggregateSizes;
  const inlineSize=!selected.length&&primarySizes.length===1&&primarySizes[0][1]===qty
   ?primarySizes[0][0]:!selected.length&&!primarySizes.length?baseSize:'';
  entry.name=[name,colour,inlineSize].filter((part,index,parts)=>part&&parts.findIndex(x=>sizeKey(x)===sizeKey(part))===index).join(' / ');
  if(selected.length){
   for(const v of selected){
    const label=clean(v.name||v.detailTitle||'');
    const parts=sizeEntries(v.sizeQuantities).map(([size,count])=>asSizeText(size,count));
    const context=label&&sizeKey(label)!==sizeKey(name)?label:'';
    if(parts.length)note([context,parts.join(', ')].filter(Boolean).join(' - '));
    else if(context)note(context);
   }
   if(!variantSizes.length&&baseSize)note('Size: '+baseSize);
  }else if(primarySizes.length){
   // The QTY column already covers a single chosen size.
   if(!inlineSize)note('Sizes: '+primarySizes.map(([size,count])=>asSizeText(size,count)).join(', '));
  }else if(baseSize&&!inlineSize)note('Size: '+baseSize);
  const extras=[d.garmentTypeName,d.fabricName,d.quality].map(clean).filter(Boolean);
  if(extras.length)note(extras.join(' / '));
  if(Array.isArray(d.selectedPrints)&&d.selectedPrints.length){
   note('Printing: '+d.selectedPrints.map(x=>[x.name,x.sizeLabel||x.size,'x '+x.qty].filter(Boolean).join(' / ')).join('; '));
  }
  if(d.printType||d.printTypeName)note('Print: '+(d.printTypeName||d.printType));
  if(d.materialQuality)note('Cloth: '+d.materialQuality);
  if(d.roster?.length)note('Players: '+d.roster.map(r=>[r.name,r.number,r.size].filter(Boolean).join('/')).join(', '));
  if(d.detailTitle||d.detailDescription)note([d.detailTitle,d.detailDescription].filter(Boolean).join(': '));
  lines.push(entry);
 }
 return lines;
}
function jsPdf(format){if(!window.jspdf?.jsPDF)throw new Error('PDF library failed to load');return new window.jspdf.jsPDF({format,unit:'mm',compress:true});}
function color(doc,r,g,b){doc.setTextColor(r,g,b);}
function wrap(doc,text,width){return doc.splitTextToSize(clean(text)||'-',width);}
function drawText(doc,text,x,y,width,fontSize=10,bold=false,spacing=5){
 doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(fontSize);const rows=wrap(doc,text,width);doc.text(rows,x,y);return y+rows.length*spacing;
}
async function documentImage(src){
 if(!src||typeof document==='undefined')return null;
 try{
  const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});
  if(!img.naturalWidth||!img.naturalHeight)return null;
  const canvas=document.createElement('canvas'),scale=Math.min(1,1100/img.naturalWidth,1100/img.naturalHeight);
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return {data:canvas.toDataURL('image/jpeg',.83),w:canvas.width,h:canvas.height};
 }catch(_){return null;}
}
// v215: Readable A4 order format matching the supplied example. Use saved order
// data only; retain historical item photos and right-aligned merchant footer.
window.OneLineCustomerPdf=async function(order,items){
 const doc=jsPdf('a4'),rows=linesFor(order,items),recipient=details(order),code=orderCode(order);
 const L=11,R=199,ink=[24,24,24],muted=[72,72,72],shade=[240,235,242],pageBottom=262;
 const businessLogo=await documentImage('/one-line-logo.webp');
 let y=12,tableStarted=false;
 const dark=()=>{doc.setTextColor(...ink);doc.setFont('helvetica','normal');};
 const rule=(at)=>{doc.setDrawColor(197,197,197);doc.setLineWidth(.27);doc.line(L,at,R,at);};
 const wrapped=(value,width,size=10,bold=false)=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
  return doc.splitTextToSize(clean(value)||'-',width);
 };
 const header=first=>{
  if(businessLogo){const side=21;doc.addImage(businessLogo.data,'JPEG',L,9,side,side);}
  const tx=businessLogo?43:L;
  dark();doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('One Line',tx,19.5);
  doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.text('Touch Shopping',tx,27);
  rule(35);
  doc.setFont('helvetica','bold');doc.setFontSize(12.5);
  doc.text('ORDER #'+code+(first?'':' (continued)'),L+1,43);
  y=50;
  if(first){doc.setFont('helvetica','normal');doc.setFontSize(10.5);doc.text('Ordered: '+fmtDate(order),L+1,50);y=59;}
  else y=56;
 };
 const tableHeader=()=>{
  doc.setFillColor(...shade);doc.rect(L,y-4.9,R-L,8.7,'F');dark();doc.setFont('helvetica','bold');doc.setFontSize(10.2);
  doc.text('ITEM / VARIANT / SIZE',L+2,y+.7);
  doc.text('QTY',135,y+.7,{align:'center'});
  doc.text('RATE',164,y+.7,{align:'right'});
  doc.text('AMOUNT',R-2,y+.7,{align:'right'});
  y+=10;tableStarted=true;
 };
 const nextPage=()=>{doc.addPage();header(false);if(tableStarted)tableHeader();};
 const ensure=height=>{if(y+height>pageBottom)nextPage();};
 const section=label=>{
  ensure(14);doc.setFillColor(...shade);doc.rect(L,y-4.8,R-L,8.5,'F');
  dark();doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(label,L+2,y+.7);y+=12;
 };
 const printText=(value,{bold=false,size=10.7,step=5.5}={})=>{
  const lines=wrapped(value,R-L-5,size,bold);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
  for(const line of lines){ensure(step+1);dark();doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.text(line,L+2,y);y+=step;}
 };
 header(true);
 section('DELIVER TO');
 printText(recipient.name||order.customer_name||order.customer||'Customer',{bold:true,size:11.5,step:6});
 const phone=clean(recipient.phone||order.phone||'');if(phone)printText('Phone: '+phone);
 const address=clean(recipient.address||order.address||'');if(address)printText(address);
 y+=6;ensure(18);tableHeader();
 for(const row of rows){
  const photo=await documentImage(row.image);
  const photoW=photo?17:0,nameX=L+2+(photo?20:0),nameWidth=123-nameX;
  const title=[row.name,row.code?'#'+row.code:''].filter(Boolean).join(' ');
  const titleLines=wrapped(title,nameWidth,10.3,true);
  const noteLines=row.notes.flatMap(note=>wrapped(note,nameWidth,9.5,false));
  const titleHeight=titleLines.length*5.3,noteHeight=noteLines.length*4.9;
  const rowH=Math.max(photo?19:0,titleHeight+noteHeight+2,9)+5;
  ensure(rowH+1);
  const start=y;let lineY=start+4.9;
  if(photo){const scale=Math.min(17/photo.w,17/photo.h),w=photo.w*scale,h=photo.h*scale;doc.addImage(photo.data,'JPEG',L+2,start+2+(17-h)/2,w,h);}
  dark();doc.setFont('helvetica','bold');doc.setFontSize(10.3);
  for(const line of titleLines){doc.text(line,nameX,lineY);lineY+=5.3;}
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);
  for(const line of noteLines){doc.text(line,nameX,lineY);lineY+=4.9;}
  doc.setFontSize(10.2);
  doc.text(String(row.qty),135,start+4.9,{align:'center'});
  doc.text(cash(row.rate),164,start+4.9,{align:'right'});
  doc.text(cash(row.total),R-2,start+4.9,{align:'right'});
  y=start+rowH;rule(y-1.5);y+=2;
 }
 ensure(17);y+=5;dark();doc.setFont('helvetica','bold');doc.setFontSize(12);
 doc.text('TOTAL AMOUNT',L+2,y+1);doc.text(cash(order.total),R-2,y+1,{align:'right'});
 // Keep merchant contact fixed at the bottom right; never center it.
 const count=doc.getNumberOfPages();
 for(let page=1;page<=count;page++){
  doc.setPage(page);rule(271);
  dark();doc.setFont('helvetica','normal');doc.setFontSize(8.6);
  doc.text('FROM: One-Line Touch Shopping',R,278,{align:'right'});
  doc.setTextColor(...muted);
  doc.text('Omanoor PO, Parappalliyali, Malappuram Dt',R,284,{align:'right'});
  doc.text('Kerala - India 673645  |  9562886916 / 9562886917',R,290,{align:'right'});
  if(count>1){doc.setFontSize(8);doc.text(page+' / '+count,L,290);}
 }
 return doc;
};
// Code39 scanner-readable internal order reference (not a carrier-issued AWB / airway bill).
const CODE39={
'0':'101001101101','1':'110100101011','2':'101100101011','3':'110110010101','4':'101001101011','5':'110100110101','6':'101100110101','7':'101001011011','8':'110100101101','9':'101100101101',
'A':'110101001011','B':'101101001011','C':'110110100101','D':'101011001011','E':'110101100101','F':'101101100101','G':'101010011011','H':'110101001101','I':'101101001101','J':'101011001101',
'K':'110101010011','L':'101101010011','M':'110110101001','N':'101011010011','O':'110101101001','P':'101101101001','Q':'101010110011','R':'110101011001','S':'101101011001','T':'101011011001',
'U':'110010101011','V':'100110101011','W':'110011010101','X':'100101101011','Y':'110010110101','Z':'100110110101','-':'100101011011','.':'110010101101',' ':'100110101101','$':'100100100101','/':'100100101001','+':'100101001001','%':'101001001001','*':'100101101101'
};
function barcode(doc,input,x,y,width=85,height=18){
 const source=clean(input).toUpperCase().replace(/[^A-Z0-9 -.]/g,'').slice(0,24)||'ORDER';
 const bits=('*'+source+'*').split('').map(ch=>CODE39[ch]||CODE39['-']).join('0');const moduleWidth=width/bits.length;
 doc.setFillColor(20,20,20);
 for(let i=0;i<bits.length;i++)if(bits[i]==='1')doc.rect(x+i*moduleWidth,y,moduleWidth,height,'F');
 return source;
}
window.OneLineShippingPdf=async function(order,items){
 const doc=jsPdf([101.6,152.4]),d=details(order),code=orderCode(order),rows=linesFor(order,items);let y=10;
 color(doc,25,25,25);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('ONE-LINE',7,y);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('TOUCH SHOPPING',7,y+5);doc.text('INTERNAL SHIPPING LABEL',94,y+1,{align:'right'});y=20;
 doc.setDrawColor(85);doc.line(7,y,95,y);y+=7;
 const label=(heading,text,size=10)=>{doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(heading,7,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(size);for(const line of wrap(doc,text,86)){if(y>111)break;doc.text(line,7,y);y+=size*0.48+1;}y+=2;};
 label('SHIP TO',d.name||order.customer_name||order.customer||'Customer',12);
 label('PHONE',d.phone||order.phone||'-');
 if(d.businessName||d.business||order.business)label('BUSINESS',d.businessName||d.business||order.business);
 label('ADDRESS',d.address||order.address||'Address not specified');
 doc.setDrawColor(170);doc.line(7,y,95,y);y+=6;
 label('ORDER / PAYMENT',code+' | '+(order.payment||'COD'));label('PACKING CONTENT',rows.map(r=>r.name+' x'+r.qty).join('; ').slice(0,140),8);
 const qty=rows.reduce((n,r)=>n+r.qty,0);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('PCS: '+qty+'    TOTAL: '+cash(order.total),7,117);
 barcode(doc,code,7,123,88,16);doc.setFontSize(8);doc.text(code,51,144,{align:'center'});
 doc.setFont('helvetica','normal');doc.setFontSize(6);color(doc,90,90,90);doc.text('Merchant reference barcode, NOT a courier AWB. Attach courier-issued label separately.',51,149,{align:'center',maxWidth:94});
 return doc;
};
})();
