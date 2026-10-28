/* v213: Branded One-Line A4 order summary; separate courier 4x6 shipping label.
   PDFs use saved order data; the A4 order summary embeds the business logo and saved item photos where available. */
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
  const sourceImages=Array.isArray(d.selectedItems)?d.selectedItems.flatMap(v=>Array.isArray(v.images)?v.images:[]):[];
  const picture=sourceImages.find(Boolean)||(Array.isArray(d.images)?d.images.find(Boolean):'')||d.cardImage||d.image||d.frontCompositeUrl||d.design?.front?.compositeUrl||d.front?.compositeUrl||item.image||'';
  const entry={name,code:clean(item.item_code||item.code||''),type,qty,rate,total:Number(item.line_total??item.total??qty*rate),image:picture,notes:[]};
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
// v212: Simple A4 order record based only on saved order_items (not live catalogue).
// Saved item images are displayed where available; no stale product lookup is needed.
window.OneLineCustomerPdf=async function(order,items){
 const doc=jsPdf('a4'),rows=linesFor(order,items),recipient=details(order),code=orderCode(order);
 const L=8,R=202,ink=[25,25,25],brand=[100,17,111],brandDeep=[63,8,73],muted=[104,92,107],shade=[247,240,249],pageBottom=267;
 // This is the same official logo the One-Line website uses in its header.
 // A missing image must not prevent a customer or staff member downloading an order.
 const businessLogo=await documentImage('/one-line-logo.webp');
 let y=13;
 const dark=()=>{doc.setTextColor(...ink);doc.setFont('helvetica','normal');};
 const divider=(top)=>{doc.setDrawColor(205,205,205);doc.setLineWidth(.25);doc.line(L,top,R,top);};
 const section=(label)=>{doc.setFillColor(...shade);doc.rect(L,y-4,R-L,6.8,'F');doc.setFillColor(...brand);doc.rect(L,y-4,1.3,6.8,'F');doc.setTextColor(...brandDeep);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(label,L+3.2,y+.5);y+=10;};
 const textRows=(value,width,size=9,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);return doc.splitTextToSize(clean(value)||'-',width);};
 const printRows=(value,x,width,size=9,bold=false,lineHeight=4.2)=>{
  const lines=textRows(value,width,size,bold);dark();doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
  for(const line of lines){if(y+lineHeight>pageBottom)nextPage(false);doc.text(line,x,y);y+=lineHeight;}
 };
 const header=first=>{
  // Keep the logo and One-Line purple header visible on every A4 page.
  doc.setFillColor(...brand);doc.rect(0,0,210,3,'F');
  if(businessLogo){const side=18;doc.addImage(businessLogo.data,'JPEG',L,8,side,side);}
  const brandX=businessLogo?29:L;
  doc.setTextColor(...brandDeep);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text('ONE-LINE',brandX,15.4);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('TOUCH SHOPPING',brandX,21);
  doc.setTextColor(...brand);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('ORDER SUMMARY',R,17,{align:'right'});
  doc.setDrawColor(...brand);doc.setLineWidth(.5);doc.line(L,29,R,29);
  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(first?12:10);
  doc.text('ORDER #'+code+(first?'':'  (continued)'),L,37);
  y=42;
  if(first){doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text('Ordered: '+fmtDate(order),L,y);y+=10;}
  else y+=8;
 };
 const nextPage=(showHeader=true)=>{doc.addPage();y=13;if(showHeader)header(false);};
 const ensure=h=>{if(y+h>pageBottom)nextPage();};
 header(true);
 section('DELIVER TO');
 printRows(recipient.name||order.customer_name||order.customer||'Customer',L,190,10,true,5);
 const phone=clean(recipient.phone||order.phone||'');if(phone)printRows('Phone: '+phone,L,190,9,false,4.5);
 const address=clean(recipient.address||order.address||'');if(address)printRows(address,L,190,9,false,4.5);
 y+=5;ensure(15);
 const tableHeader=()=>{
  doc.setFillColor(...brand);doc.rect(L,y-4,R-L,7,'F');doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.setTextColor(255,255,255);
  doc.text('ITEM / VARIANT / SIZE',L+1,y+.5);doc.text('QTY',145,y+.5,{align:'center'});doc.text('RATE',173,y+.5,{align:'right'});doc.text('AMOUNT',R-1,y+.5,{align:'right'});y+=8;
 };
 tableHeader();
 for(const row of rows){
  // A single photograph per ordered line makes deleted products identifiable in the PDF.
  const photo=await documentImage(row.image),photoW=photo?17:0;
  const nameX=L+(photo?20:1),nameWidth=(photo?112:131)-nameX;
  const title=[row.name,row.code?('#'+row.code):''].filter(Boolean).join(' ');
  const titleLines=textRows(title,nameWidth,8.5);
  const noteLines=row.notes.flatMap(note=>textRows(note,nameWidth,8));
  const infoH=titleLines.length*4.1+noteLines.length*3.7+2;
  const rowH=Math.max(photo?20:0,infoH,8)+3;
  ensure(rowH+1);
  const start=y;
  if(photo){const scale=Math.min(17/photo.w,17/photo.h);const w=photo.w*scale,h=photo.h*scale;doc.addImage(photo.data,'JPEG',L+1,start+1+(17-h)/2,w,h);}
  dark();doc.setFontSize(8.5);doc.setFont('helvetica','normal');
  let lineY=start+4;
  doc.setFont('helvetica','bold');for(const line of titleLines){doc.text(line,nameX,lineY);lineY+=4.1;}
  doc.setFont('helvetica','normal');doc.setFontSize(7.7);
  for(const line of noteLines){doc.text(line,nameX,lineY);lineY+=3.7;}
  doc.setFont('helvetica','normal');doc.setFontSize(8.5);
  doc.text(String(row.qty),145,start+4,{align:'center'});
  doc.text(cash(row.rate),173,start+4,{align:'right'});
  doc.text(cash(row.total),R-1,start+4,{align:'right'});
  y=start+rowH;divider(y-1);y+=2;
 }
 ensure(17);y+=4;
 doc.setFillColor(...shade);doc.rect(L,y-4,R-L,10,'F');
 doc.setFillColor(...brand);doc.rect(L,y-4,1.3,10,'F');
 doc.setTextColor(...brandDeep);doc.setFont('helvetica','bold');doc.setFontSize(11);
 doc.text('TOTAL AMOUNT',L+1,y+2.5);doc.text(cash(order.total),R-1,y+2.5,{align:'right'});
 // Fixed address footer at lower right of each sheet, independent of the item count.
 for(let page=1,pages=doc.getNumberOfPages();page<=pages;page++){
  doc.setPage(page);doc.setDrawColor(...brand);doc.setLineWidth(.4);doc.line(L,273,R,273);
  doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(...brandDeep);
  doc.text('FROM: One-Line Touch Shopping',R,279,{align:'right'});
  doc.setFont('helvetica','normal');doc.setTextColor(...muted);
  doc.text('Omanoor PO, Parappalliyali, Malappuram Dt',R,284,{align:'right'});
  doc.text('Kerala - India 673645  |  9562886916 / 9562886917',R,289,{align:'right'});
  if(pages>1){doc.setFontSize(7);doc.text(page+' / '+pages,L,289);}
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
