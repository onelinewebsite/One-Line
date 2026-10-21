/* v185: Customer A4 order summary and separately optimized courier 4x6 shipping label.
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
   const d=item.design_json||item.design||item.uniformOrder||{},name=clean(item.item_name||item.name||'Item'),type=clean(item.item_type||item.itemType||'product'),qty=Number(item.qty||item.quantity||1),rate=Number(item.unit_price??item.price??0);
   const entry={name,code:clean(item.item_code||item.code||''),type,qty,rate,total:Number(item.line_total??item.total??qty*rate),notes:[]};
   if(d.fabricName||d.quality||d.garmentTypeName)entry.notes.push(['Garment',d.garmentTypeName,d.fabricName,d.quality].filter(Boolean).join(' / '));
   const sizes=Array.isArray(d.jerseySizes)?d.jerseySizes:Array.isArray(d.printableSizes)?d.printableSizes:[];
   if(sizes.length)entry.notes.push('Garment sizes: '+sizes.map(x=>x.size+' x '+x.qty+(x.rate!==undefined?' at '+cash(x.rate):'')).join(', '));
   else if(d.sizeQuantities&&typeof d.sizeQuantities==='object')entry.notes.push('Sizes: '+Object.entries(d.sizeQuantities).filter(([,v])=>Number(v)>0).map(([k,v])=>k+' x '+v).join(', '));
   if(Array.isArray(d.selectedPrints)&&d.selectedPrints.length){entry.notes.push('Prints on EACH garment: '+d.selectedPrints.map(x=>[x.name,x.sizeLabel||x.size,'x '+x.qty,cash(x.rate)+' each'].filter(Boolean).join(' / ')).join('; '));entry.notes.push('Printing: '+cash(d.printsPerGarment||0)+'/garment x '+Number(d.totalPieces||qty)+' garments = '+cash(d.printsTotal||0));}
   else if(d.includePrinting===false)entry.notes.push('Printing: Not added');
   if(Array.isArray(d.selectedItems))for(const variant of d.selectedItems){entry.notes.push('Variant: '+clean(variant.name||'')+' '+Object.entries(variant.sizeQuantities||{}).filter(([,v])=>Number(v)>0).map(([k,v])=>k+' x '+v).join(', '));}
   if(d.roster?.length)entry.notes.push('Players: '+d.roster.map(r=>[r.name,r.number,r.size].filter(Boolean).join('/')).join(', '));
   if(item.color||item.size)entry.notes.push([item.color,item.size].filter(Boolean).join(' / '));
   if(d.detailTitle||d.detailDescription)entry.notes.push([d.detailTitle,d.detailDescription].filter(Boolean).join(': '));
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
 const doc=jsPdf('a4'),rows=linesFor(order,items),d=details(order),code=orderCode(order);
 const ink=[35,25,43],violet=[108,29,134],light=[250,245,251],pad=14,right=196;let y=42;
 const setInk=(rgb=ink)=>{doc.setTextColor(...rgb);};
 const pageStart=()=>{
  doc.setFillColor(...violet);doc.rect(0,0,210,30,'F');
  doc.setFillColor(...light);doc.rect(0,30,210,4,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(255,255,255);doc.text('ONE-LINE',44,14);
  doc.setFontSize(10);doc.text('TOUCH SHOPPING',44,20);
  doc.setFontSize(8);doc.text('ORDER SUMMARY',195,15,{align:'right'});
  setInk();
 };
 pageStart();
 const logo=await documentImage('one-line-logo.webp');
 if(logo){doc.setFillColor(255,255,255);doc.roundedRect(12,5,26,22,3,3,'F');const r=Math.min(20/logo.w,20/logo.h);const w=logo.w*r,h=logo.h*r;doc.addImage(logo.data,'JPEG',25-w/2,16-h/2,w,h);}
 const another=()=>{doc.addPage();y=42;pageStart();if(logo){doc.setFillColor(255,255,255);doc.roundedRect(12,5,26,22,3,3,'F');const r=Math.min(20/logo.w,20/logo.h);doc.addImage(logo.data,'JPEG',25-logo.w*r/2,16-logo.h*r/2,logo.w*r,logo.h*r);}};
 const need=h=>{if(y+h>277)another();};
 const heading=t=>{need(17);doc.setFillColor(...light);doc.roundedRect(pad,y-5,182,11,2,2,'F');doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...violet);doc.text(t,pad+4,y+2);y+=15;setInk();};
 const field=(key,val)=>{if(!clean(val))return;doc.setFontSize(10);doc.setFont('helvetica','bold');const prefix=clean(key)+': ';const prefixW=doc.getTextWidth(prefix);doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(clean(val),176-Math.min(prefixW,55));need(Math.max(1,lines.length)*5.7+4);doc.setFont('helvetica','bold');doc.text(prefix,18,y);doc.setFont('helvetica','normal');doc.text(lines,18+Math.min(prefixW,55),y);y+=Math.max(1,lines.length)*5.7+4;};
 heading('ORDER INFORMATION');field('Order reference',code);field('Date',fmtDate(order));field('Status',order.status||'Confirmed');field('Total',cash(order.total));
 heading('DELIVERY');field('Account',order.metadata?.account?.name||order.customer_name||order.customer||'');
 field('Recipient',d.name||order.customer_name||order.customer||'');field('Phone',d.phone||order.phone||'');
 field('Business',d.businessName||d.business||order.business||'');field('Delivery address',d.address||order.address||'');
 field('Shipping',order.delivery||'Courier');field('Payment',order.payment||'Cash on delivery');
 if(order.metadata?.remarks){heading('REMARKS');field('Notes',order.metadata.remarks);}
 heading('ORDERED ITEMS');
 for(let i=0;i<rows.length;i++){
  const row=rows[i];need(29);
  doc.setDrawColor(222,207,228);doc.setFillColor(255,255,255);doc.roundedRect(pad,y-7,182,28,3,3,'S');
  doc.setTextColor(...violet);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text(doc.splitTextToSize((i+1)+'. '+row.name,135).slice(0,2),18,y);
  setInk();doc.setFontSize(9.5);doc.setFont('helvetica','normal');doc.text('Qty: '+row.qty+'  |  '+cash(row.rate)+' each',18,y+15);doc.setFont('helvetica','bold');doc.text(cash(row.total),192,y+15,{align:'right'});y+=29;
  if(row.code)field('Item ID',row.code);
  for(const note of row.notes){doc.setFontSize(9.5);field('Details',note);}
  y+=6;
 }
 heading('PAYMENT SUMMARY');field('Items subtotal',cash(rows.reduce((n,r)=>n+r.total,0)));
 if(order.metadata?.redeem?.code)field('Discount',order.metadata.redeem.code+'  -'+cash(order.metadata.redeem.discount));
 field('AMOUNT PAYABLE',cash(order.total));
 const total=doc.getNumberOfPages();for(let i=1;i<=total;i++){doc.setPage(i);doc.setDrawColor(221,215,225);doc.line(14,281,196,281);setInk([109,100,113]);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('One-Line Touch Shopping | Omanoor PO, Malappuram, Kerala 673645 | 9562886916 / 9562886917',14,286);doc.text(i+' / '+total,196,293,{align:'right'});}
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
