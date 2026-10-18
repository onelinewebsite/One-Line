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
window.OneLineCustomerPdf=async function(order,items){
 const d=details(order),code=orderCode(order),rows=linesFor(order,items),doc=jsPdf('a4');let y=17,page=1;
 const newPage=()=>{doc.addPage();y=18;page++;color(doc,20,20,22);};
 const needed=h=>{if(y+h>271)newPage();};
 function section(s){needed(18);doc.setFillColor(248,239,250);doc.roundedRect(13,y-5,184,11,2,2,'F');color(doc,95,25,118);y=drawText(doc,s,17,y+2,173,11,true,5.4)+10;color(doc,35,35,40);}
 function field(k,v){if(!clean(v))return;const key=clean(k)+': ';doc.setFont('helvetica','bold');doc.setFontSize(9);const value=key+clean(v);const ls=wrap(doc,value,175);needed(ls.length*5.4+3);doc.text(ls,17,y);y+=ls.length*5.4+3;}
 doc.setFillColor(99,21,121);doc.rect(0,0,210,27,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text('ONE-LINE  |  TOUCH SHOPPING',14,14);doc.setFontSize(9);doc.text('CUSTOMER ORDER DETAILS  -  A4 COPY',14,21);color(doc,28,24,33);y=38;
 field('Order reference',code);field('Ordered at',fmtDate(order));field('Status',order.status||'Confirmed');field('Order total',cash(order.total));
 section('CUSTOMER AND DELIVERY');
 field('Account owner',order.metadata?.account?.name||order.customer_name||order.customer||'');
 field('Account phone',order.metadata?.account?.phone||order.phone||'');
 field('Recipient',d.name||order.customer_name||order.customer||'');field('Recipient phone',d.phone||order.phone||'');
 field('Business',d.businessName||d.business||order.business||'');field('Delivery address',d.address||order.address||'');
 field('Shipping method',order.delivery||'Courier');field('Payment',order.payment||'Cash on delivery');
 if(order.metadata?.remarks)section('ORDER REMARKS'),field('Remarks',order.metadata.remarks);
 section('ITEMS AND SPECIFICATIONS');
 for(let i=0;i<rows.length;i++){
   const r=rows[i];needed(20);color(doc,96,26,121);y=drawText(doc,(i+1)+'. '+r.name,17,y,172,11,true,6);color(doc,32,32,32);
   field('Item ID',r.code);field('Quantity',r.qty);field('Unit rate',cash(r.rate));field('Line amount',cash(r.total));
   for(const note of r.notes)field('Detail',note);
   needed(8);doc.setDrawColor(226,218,228);doc.line(17,y,193,y);y+=9;
 }
 section('PAYMENT SUMMARY');field('Items total',cash(rows.reduce((n,r)=>n+r.total,0)));
 if(order.metadata?.redeem?.code)field('Discount code',order.metadata.redeem.code+' (minus '+cash(order.metadata.redeem.discount)+')');
 field('PAYABLE TOTAL',cash(order.total));
 needed(18);doc.setFont('helvetica','normal');doc.setFontSize(8);color(doc,100,95,110);doc.text('One-Line Touch Shopping | Omanoor PO, Parappalliyali, Malappuram, Kerala 673645',17,y+5);doc.text('Phone: 9562886916 / 9562886917',17,y+10);
 for(let n=1;n<=doc.getNumberOfPages();n++){doc.setPage(n);color(doc,108,104,110);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text('Order '+code+' | '+n+' / '+doc.getNumberOfPages(),193,290,{align:'right'});}
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
