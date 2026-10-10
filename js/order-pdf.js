/* Shared customer and portal order document. Product artwork is never embedded. */
(function(){
  'use strict';
  window.OneLineUserId=(id,kind='USER')=>id?'OL-'+kind+'-'+String(id).replace(/-/g,'').toUpperCase():'';
  window.OneLineOrderPdf=async function(order,items){
    if(!window.jspdf?.jsPDF)throw new Error('PDF library is not loaded. Please refresh.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),code=String(order.order_code||order.id||''),recipient=order.metadata?.deliveryRecipient||{};
    let y=16;
    const next=(value,size=10,bold=false,highlight=false)=>{
      if(value===null||value===undefined||value==='')return;
      doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);
      const rows=doc.splitTextToSize(String(value),174),lineHeight=size*.45+1;
      for(const row of rows){if(y+lineHeight>279){doc.addPage();y=18;}if(highlight){doc.setFillColor(236,245,239);doc.rect(14,y-4,182,lineHeight+1,'F');}doc.setTextColor(25,35,30);doc.text(row,18,y);y+=lineHeight;}y+=2;
    };
    // This is the only image permitted in an order PDF: the business logo.
    const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Business logo failed to load. Please refresh and retry.'));im.src='one-line-logo.webp';});
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);
    const h=Math.min(18,30*image.naturalHeight/image.naturalWidth),w=h*image.naturalWidth/image.naturalHeight;doc.addImage(canvas.toDataURL('image/png'),'PNG',18,12,w,h);
    y=35;next('One-Line Touch Shopping',17,true);next('Omanoor PO, Parappalliyali, Malappuram Dt');next('Kerala - India, PIN 673645');next('PH: 9562886916 / 9562886917');y+=2;
    next('ORDER #'+code,13,true);next('Date: '+(order.time||(order.created_at?new Date(order.created_at).toLocaleString('en-IN'):'')));
    next('Status: '+(order.status||'Confirmed'));next('Delivery: '+(order.delivery||'-')+' | Payment: '+(order.payment||'-'));y+=3;
    next('DELIVER TO',12,true,true);next(recipient.name||order.customer_name||order.customer||'Customer',11,true,true);
    next('Phone: '+(recipient.phone||order.phone||'-'),10,false,true);next(recipient.address||order.address||'-',10,false,true);y+=5;
    next('ORDER DETAILS',12,true);
    for(const [index,item] of items.entries()){
      const d=item.design_json||item.design||{},qty=Number(item.qty||0),price=Number(item.unit_price??item.price??0);
      next((index+1)+'. '+(item.item_name||item.name||'Item'),11,true);
      next('Item ID: '+(item.item_code||item.code||d.displayId||'-'));
      next('Quantity: '+qty+' | Unit rate: INR '+price.toFixed(2)+' | Amount: INR '+(qty*price).toFixed(2));
      next([item.color,item.size].filter(Boolean).join(' | '));
      next([d.garmentType,d.model,d.materialQuality,d.garmentColor,d.printType].filter(Boolean).join(' | '));
      const sizes=v=>Object.entries(v||{}).filter(([,n])=>Number(n)>0).map(([s,n])=>s+' x '+n).join(', ');
      if(sizes(d.sizeQuantities))next('Sizes: '+sizes(d.sizeQuantities));
      for(const v of d.selectedItems||[]){next(v.name||'Variant',10,true);next('Sizes: '+sizes(v.sizeQuantities));if(v.sizeRates)next('Size rates: '+Object.entries(v.sizeRates).map(([s,r])=>s+' INR '+Number(r).toFixed(2)).join(', '));next(v.detailTitle||v.detail_title);next(v.detailDescription||v.detail_description);}
      for(const [i,r] of (d.roster||[]).entries())next('Player '+(i+1)+': '+[r.name,r.number,r.size].filter(Boolean).join(' | '));
      y+=3;
    }
    next('TOTAL: INR '+Number(order.total||0).toFixed(2),14,true);
    const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFontSize(8);doc.setTextColor(100);doc.text('One-Line Touch Shopping | Order '+code,14,290);doc.text(page+' / '+pages,195,290,{align:'right'});}
    return doc;
  };
})();
