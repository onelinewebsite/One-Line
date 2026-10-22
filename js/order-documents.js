/* v196: Compact, item-identifying customer A4 order summary; separate courier 4x6 shipping label.
   Both use already loaded order data; neither fetches new images or consumes Supabase bandwidth. */
(function(){
'use strict';
const clean=v=>String(v===null||v===undefined?'':v).replace(/[^\x20-\x7E\n]/g,' ').replace(/[\t\r]+/g,' ').trim();
const cash=v=>'INR '+Number(v||0).toFixed(2);
const orderCode=o=>clean(o.order_code||o.orderCode||o.id||'');
const details=o=>o.metadata?.deliveryRecipient||{};
const fmtDate=o=>{const s=o.created_at||o.createdAt||o.time||'';const d=new Date(s);return Number.isFinite(d.getTime())?d.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})+' IST':clean(s);};
function linesFor(order,items){
 const lines=[];
 for(const item of items||[]){
  const d=item.design_json||item.design||item.uniformOrder||{},name=clean(item.item_name||item.name||'Item'),type=clean(item.item_type||item.itemType||'product'),qty=Number(item.qty??item.quantity??1),rate=Number(item.unit_price??item.price??0);
  const entry={name,code:clean(item.item_code||item.code||''),type,qty,rate,total:Number(item.line_total??item.total??qty*rate),notes:[]};
  const note=v=>{if(clean(v))entry.notes.push(clean(v));};
  note([d.garmentTypeName,d.fabricName,d.quality].filter(Boolean).join(' / '));
  if(d.garmentColor)note('Colour: '+d.garmentColor);
  const sizes=Array.isArray(d.jerseySizes)?d.jerseySizes:Array.isArray(d.printableSizes)?d.printableSizes:[];
  if(sizes.length)note('Sizes: '+sizes.filter(z=>Number(z.qty)>0).map(z=>z.size+' x '+z.qty+(z.rate!==undefined?' @ '+cash(z.rate):'')).join(', '));
  else if(d.sizeQuantities&&typeof d.sizeQuantities==='object')note('Sizes: '+Object.entries(d.sizeQuantities).filter(([,v])=>Number(v)>0).map(([k,v])=>k+' x '+v).join(', '));
  if(Array.isArray(d.selectedItems))for(const variant of d.selectedItems){
   note('Variant: '+[variant.name,variant.code||variant.displayId].filter(Boolean).join(' / '));
   note('Sizes: '+Object.entries(variant.sizeQuantities||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>k+' x '+v).join(', '));
  }
  if(Array.isArray(d.selectedPrints)&&d.selectedPrints.length){
   note('On every garment: '+d.selectedPrints.map(x=>[x.name,x.sizeLabel||x.size,'x '+x.qty].filter(Boolean).join(' / ')).join('; '));
   if(d.printsPerGarment!==undefined)note('Printing: '+cash(d.printsPerGarment)+' per garment x '+Number(d.totalPieces||qty)+' garments = '+cash(d.printsTotal));
  }else if(d.includePrinting===false)note('No printing');
  if(d.printType||d.printTypeName)note('Print: '+(d.printTypeName||d.printType));
  if(d.materialQuality)note('Cloth: '+d.materialQuality);
  if(d.roster?.length)note('Players: '+d.roster.map(r=>[r.name,r.number,r.size].filter(Boolean).join('/')).join(', '));
  if(item.color||item.size)note([item.color,item.size].filter(Boolean).join(' / '));
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
window.OneLineCustomerPdf=async function(order,items){
 const doc=jsPdf('a4'),rows=linesFor(order,items),recipient=details(order),code=orderCode(order);
 const violet=[108,29,134],ink=[42,34,47],soft=[250,246,251];
 const left=14,right=196,contentWidth=182,bottom=278;let y=29;
 const drawHeader=()=>{
  doc.setFillColor(...violet);doc.rect(0,0,210,22,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text('ONE-LINE',38,11);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('TOUCH SHOPPING',38,16);
  doc.setFont('helvetica','bold');doc.text('ORDER DETAILS',195,13,{align:'right'});
  doc.setTextColor(...ink);
 };
 let logo=null;
 drawHeader();
 logo=await documentImage('one-line-logo.webp');
 const drawLogo=()=>{if(!logo)return;doc.setFillColor(255,255,255);doc.roundedRect(10,2.5,23,17,2,2,'F');const ratio=Math.min(15/logo.w,15/logo.h);doc.addImage(logo.data,'JPEG',21.5-logo.w*ratio/2,11-logo.h*ratio/2,logo.w*ratio,logo.h*ratio);};
 drawLogo();
 const nextPage=()=>{doc.addPage();y=29;drawHeader();drawLogo();};
 const ensure=height=>{if(y+height>bottom)nextPage();};
 const section=label=>{
  ensure(11);doc.setFillColor(...soft);doc.roundedRect(left,y-3,contentWidth,7,1.5,1.5,'F');
  doc.setTextColor(...violet);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(label,left+3,y+1.5);
  doc.setTextColor(...ink);y+=9;
 };
 const wrapLines=(text,width,size=8.5,bold=false)=>{
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
  return doc.splitTextToSize(clean(text)||'-',width);
 };
 const printWrapped=(text,x,width,size=8.5,lineHeight=4.4,bold=false)=>{
  const lines=wrapLines(text,width,size,bold);
  doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...ink);
  for(const line of lines){ensure(lineHeight);doc.text(line,x,y);y+=lineHeight;}
 };
 const field=(label,value)=>{
  if(!clean(value))return;
  const prefix=label+': ';
  doc.setFont('helvetica','bold');doc.setFontSize(8.5);
  const pw=Math.min(46,doc.getTextWidth(prefix)+1);
  const lines=wrapLines(value,contentWidth-8-pw,8.5);
  ensure(lines.length*4.4+1);
  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.text(prefix,left+3,y);
  doc.setFont('helvetica','normal');doc.text(lines,left+3+pw,y);y+=lines.length*4.4+1;
 };
 // Keep order and delivery in a few lines; only create another page if genuinely necessary.
 section('ORDER & DELIVERY');
 field('Order',code);
 field('Placed',fmtDate(order));
 field('Recipient',recipient.name||order.customer_name||order.customer||'Customer');
 field('Phone',recipient.phone||order.phone||'');
 field('Address',recipient.address||order.address||'');
 if(order.metadata?.expected_delivery_date){const raw=String(order.metadata.expected_delivery_date);field('Expected delivery',/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw.split('-').reverse().join('-'):raw);}
 field('Status',order.status||'Confirmed');
 if(order.metadata?.remarks)field('Remarks',order.metadata.remarks);
 y+=2;section('ITEMS ORDERED');
 for(let i=0;i<rows.length;i++){
  const row=rows[i];
  ensure(11);doc.setFont('helvetica','bold');doc.setFontSize(9.4);doc.setTextColor(...violet);
  const label=(i+1)+'. '+row.name+(row.code?'  ['+row.code+']':'');
  // Reserve the right-hand portion for the item total without covering long names.
  const titles=wrapLines(label,121,9.4,true);
  for(const line of titles){ensure(4.8);doc.text(line,left+2,y);y+=4.8;}
  doc.setFont('helvetica','bold');doc.setTextColor(...ink);doc.setFontSize(9);
  doc.text(cash(row.total),right-2,y-4.8,{align:'right'});
  printWrapped('Quantity '+row.qty+(row.qty>0?'  |  '+cash(row.rate)+' per garment/item':''),left+3,contentWidth-6,8.2,4.2);
  for(const note of row.notes){printWrapped(note,left+3,contentWidth-7,8.2,4.1);}
  y+=2;ensure(3);doc.setDrawColor(230,220,234);doc.line(left+2,y-1,right-2,y-1);y+=2;
 }
 section('TOTAL');
 if(order.metadata?.redeem?.code)field('Discount',String(order.metadata.redeem.code)+' -'+cash(order.metadata.redeem.discount||0));
 doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...violet);
 ensure(7);doc.text('Amount payable',left+3,y);doc.text(cash(order.total),right-3,y,{align:'right'});y+=7;
 const pages=doc.getNumberOfPages();
 for(let page=1;page<=pages;page++){
  doc.setPage(page);doc.setDrawColor(225,220,226);doc.line(left,282,right,282);
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(110,104,114);
  doc.text('One-Line Touch Shopping | Order summary',left,287);
  doc.text(page+' / '+pages,right,287,{align:'right'});
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
