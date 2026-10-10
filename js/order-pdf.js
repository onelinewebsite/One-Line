/* One-page courier packing sheet, shared by customer and admin downloads. */
(function(){
  'use strict';
  window.OneLineUserId=(id,kind='USER')=>id?'OL-'+kind+'-'+String(id).replace(/-/g,'').toUpperCase():'';
  let logoPromise;
  function logo(){return logoPromise||(logoPromise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=240;c.height=Math.round(240*im.naturalHeight/im.naturalWidth);c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve({data:c.toDataURL('image/png'),ratio:im.naturalWidth/im.naturalHeight});};im.onerror=()=>{logoPromise=null;reject(new Error('Business logo could not load. Please retry.'));};im.src='one-line-logo.webp';}));}
  const amount=n=>'INR '+Number(n||0).toFixed(2);
  window.OneLineOrderPdf=async function(order,items){
    if(!window.jspdf?.jsPDF)throw new Error('PDF library is not loaded. Please refresh.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',compress:true}),code=String(order.order_code||order.id||''),recipient=order.metadata?.deliveryRecipient||{},rows=[];
    for(const item of items||[]){
      const d=item.design_json||item.design||item.uniformOrder||{},name=item.item_name||item.name||'Item',rate=Number(item.unit_price??item.price??0);
      if(d.selectedItems?.length){
        for(const v of d.selectedItems)for(const [size,quantity] of Object.entries(v.sizeQuantities||{})){
          const qty=Number(quantity);if(qty<=0)continue;
          const unit=Number(v.sizeRates?.[size]??v.rate??rate);
          rows.push({label:[name,v.name,size].filter(Boolean).join(' / '),qty,rate:unit,total:qty*unit});
        }
      }else{
        const sizes=Object.entries(d.sizeQuantities||{}).filter(([,q])=>Number(q)>0),sizeTotal=sizes.reduce((n,[,q])=>n+Number(q),0);
        if(sizes.length&&sizeTotal===Number(item.qty))for(const [size,qty] of sizes)rows.push({label:[name,item.color||d.garmentColor,size].filter(Boolean).join(' / '),qty:Number(qty),rate,total:Number(qty)*rate});
        else rows.push({label:[name,item.color||d.garmentColor,item.size,...sizes.map(([s,q])=>s+' x '+q)].filter(Boolean).join(' / '),qty:Number(item.qty||0),rate,total:Number(item.qty||0)*rate});
      }
    }
    const mark=await logo(),lh=Math.min(14,20/mark.ratio),lw=lh*mark.ratio;
    doc.addImage(mark.data,'PNG',14,11,lw,lh);
    doc.setTextColor(20);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('One Line',39,16);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Touch Shopping',39,21);
    const stamp=order.created_at||order.createdAt;
    const date=stamp?new Date(stamp):null;
    const orderedAt=date&&!Number.isNaN(date.getTime())?date.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})+' IST':String(order.time||'Not recorded');
    const blocks=[{text:'ORDER #'+code,bold:true},{text:'Ordered: '+orderedAt},{text:'DELIVER TO',bold:true},{text:recipient.name||order.customer_name||order.customer||'Customer',bold:true},{text:'Phone: '+(recipient.phone||order.phone||'-')},...(recipient.business?[{text:recipient.business}]:[]),{text:recipient.address||order.address||'-'}];
    // Measure before drawing. Scale complete content rather than clipping or adding pages.
    function layout(size){
      doc.setFontSize(size);const gap=size*.16,line=size*.43;
      const top=blocks.map(b=>{doc.setFont('helvetica',b.bold?'bold':'normal');return {...b,lines:doc.splitTextToSize(String(b.text),174)};});
      doc.setFont('helvetica','normal');const table=rows.map(r=>({...r,lines:doc.splitTextToSize(r.label,94)}));
      const height=top.reduce((n,b)=>n+b.lines.length*line+gap,0)+8+table.reduce((n,r)=>n+Math.max(line+2,r.lines.length*line+2),0)+14;
      return {top,table,gap,line,height,size};
    }
    let plan=layout(10);while(plan.height>232&&plan.size>1)plan=layout(plan.size*.92);
    let y=34;doc.setDrawColor(160);doc.line(14,28,196,28);
    const text=(t,x,yy,bold=false,align='left')=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(plan.size);doc.setTextColor(20);doc.text(t,x,yy,{align});};
    for(const [index,b] of plan.top.entries()){
      if(index>=2){doc.setFillColor(241,244,242);doc.rect(14,y-plan.line+1,182,b.lines.length*plan.line+plan.gap,'F');}
      b.lines.forEach(line=>{text(line,18,y,b.bold);y+=plan.line;});y+=plan.gap;
    }
    y+=5;doc.setFillColor(232,236,233);doc.rect(14,y-plan.line,182,plan.line+3,'F');
    text('ITEM / VARIANT / SIZE',18,y,true);text('QTY',124,y,true,'right');text('RATE',157,y,true,'right');text('AMOUNT',192,y,true,'right');y+=plan.line+3;
    for(const row of plan.table){
      row.lines.forEach((line,i)=>text(line,18,y+i*plan.line));text(String(row.qty),124,y,false,'right');text(amount(row.rate),157,y,false,'right');text(amount(row.total),192,y,false,'right');
      y+=Math.max(plan.line+2,row.lines.length*plan.line+2);doc.setDrawColor(225);doc.line(14,y-plan.line+1,196,y-plan.line+1);
    }
    y+=5;text('TOTAL AMOUNT',18,y,true);text(amount(order.total),192,y,true,'right');
    doc.setDrawColor(170);doc.line(14,276,196,276);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(60);
    doc.text('FROM: One-Line Touch Shopping',105,281,{align:'center'});
    doc.text('Omanoor PO, Parappalliyali, Malappuram Dt, Kerala - India, PIN 673645',105,285,{align:'center'});
    doc.text('PH: 9562886916 / 9562886917',105,289,{align:'center'});
    return doc;
  };
})();
