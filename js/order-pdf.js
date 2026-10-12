/* One-page courier packing sheet, shared by customer and admin downloads. */
(function(){
  'use strict';
  window.OneLineUserId=(id,kind='USER')=>id?'OL-'+kind+'-'+String(id).replace(/-/g,'').toUpperCase():'';
  let logoPromise;
  function logo(){return logoPromise||(logoPromise=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=240;c.height=Math.round(240*im.naturalHeight/im.naturalWidth);c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve({data:c.toDataURL('image/png'),ratio:im.naturalWidth/im.naturalHeight});};im.onerror=()=>{logoPromise=null;reject(new Error('Business logo could not load. Please retry.'));};im.src='one-line-logo.webp';}));}
  const amount=n=>'INR '+Number(n||0).toFixed(2);
  window.OneLineOrderPdf=async function(order,items){
    if(!window.jspdf?.jsPDF)throw new Error('PDF library is not loaded. Please refresh.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:[101.6,127],compress:true}),code=String(order.order_code||order.id||''),recipient=order.metadata?.deliveryRecipient||{},rows=[];
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
    // 4 x 5 inch courier/packing slip. Keep exactly one printable page.
    const mark=await logo(),stamp=order.created_at||order.createdAt,date=stamp?new Date(stamp):null;
    const orderedAt=date&&!Number.isNaN(date.getTime())?date.toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})+' IST':String(order.time||'Not recorded');
    const blocks=[
      {text:'ORDER #'+code,bold:true},{text:'Ordered: '+orderedAt},
      {text:'DELIVER TO',bold:true},
      {text:recipient.name||order.customer_name||order.customer||'Customer',bold:true},
      {text:'Phone: '+(recipient.phone||order.phone||'-')},
      ...(recipient.business?[{text:recipient.business}]:[]),
      {text:recipient.address||order.address||'-'}
    ];
    const W=101.6,footerY=112.2;
    const markH=Math.min(11,14/mark.ratio),markW=markH*mark.ratio;
    doc.addImage(mark.data,'PNG',5,4,markW,markH);
    doc.setTextColor(27);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('One Line',23,10);
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text('Touch Shopping',23,14);
    doc.setDrawColor(205);doc.line(5,17,96.6,17);
    function makePlan(size){
      doc.setFontSize(size);
      const line=size*.41,gap=.9;
      const top=blocks.map(b=>{doc.setFont('helvetica',b.bold?'bold':'normal');return {...b,lines:doc.splitTextToSize(String(b.text),89)};});
      doc.setFont('helvetica','normal');
      const table=rows.map(r=>({...r,lines:doc.splitTextToSize(String(r.label),43)}));
      const height=top.reduce((n,b)=>n+b.lines.length*line+gap,0)+5+line+3+table.reduce((n,r)=>n+Math.max(line+1,r.lines.length*line+1),0)+8;
      return {top,table,line,gap,size,height};
    }
    let plan=makePlan(8);
    // Shrink unusually long packing lists to remain above the fixed footer.
    while(plan.height>footerY-21&&plan.size>3)plan=makePlan(plan.size*.92);
    const write=(text,x,y,bold=false,align='left')=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(plan.size);doc.setTextColor(27);doc.text(String(text),x,y,{align});};
    let y=21;
    for(const [index,block] of plan.top.entries()){
      if(index===2){doc.setFillColor(245,240,247);doc.rect(5,y-plan.line+.6,91.6,plan.line+1,'F');}
      for(const line of block.lines){write(line,6,y,block.bold);y+=plan.line;}
      y+=plan.gap;
    }
    y+=2;
    doc.setFillColor(235,229,240);doc.rect(5,y-plan.line+.5,91.6,plan.line+2,'F');
    write('ITEM / VARIANT / SIZE',6,y,true);write('QTY',58,y,true,'right');write('RATE',77,y,true,'right');write('AMOUNT',95,y,true,'right');
    y+=plan.line+2;
    for(const row of plan.table){
      row.lines.forEach((line,i)=>write(line,6,y+i*plan.line));
      write(String(row.qty),58,y,false,'right');write(amount(row.rate),77,y,false,'right');write(amount(row.total),95,y,false,'right');
      y+=Math.max(plan.line+1,row.lines.length*plan.line+1);
      doc.setDrawColor(237);doc.line(5,y-plan.line+.4,96.6,y-plan.line+.4);
    }
    y+=2;write('TOTAL AMOUNT',6,y,true);write(amount(order.total),95,y,true,'right');
    doc.setDrawColor(180);doc.line(5,footerY,96.6,footerY);
    doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(56);
    doc.text('FROM: One-Line Touch Shopping',50.8,116,{align:'center'});
    doc.text('Omanoor PO, Parappalliyali, Malappuram Dt',50.8,120,{align:'center'});
    doc.text('Kerala - India 673645  |  9562886916 / 9562886917',50.8,124,{align:'center'});
    return doc;
  };
})();
