(function(){
  "use strict";
  const C=window.ONE_LINE_CONFIG||{};
  let sdkPromise=null,initialized=false,requestId='',lastIdentifier='',sendInFlight=null,verifyInFlight=null,retryInFlight=null;

  function errorOf(value){
    if(value instanceof Error)return value;
    const raw=value?.message||value?.error||value?.description||value?.data?.message||value?.data?.error||String(value||'OTP request failed.');
    const text=String(raw).replace(/^Error:\s*/i,'');
    if(/captcha/i.test(text))return new Error('Captcha is enabled in MSG91. Disable Captcha in the OTP Widget settings and try again.');
    if(/Cannot read properties of undefined|reading ['\"]verify['\"]/i.test(text))return new Error('OTP service was not ready. Please try once more.');
    return new Error(text);
  }
  function deepFind(value,keys){
    const wanted=new Set(keys.map(k=>String(k).toLowerCase())),seen=new Set();
    function walk(v){if(v==null||typeof v!=='object'||seen.has(v))return'';seen.add(v);for(const [k,x] of Object.entries(v)){if(wanted.has(String(k).toLowerCase())&&(typeof x==='string'||typeof x==='number')&&String(x).trim())return String(x).trim();}for(const x of Object.values(v)){const y=walk(x);if(y)return y;}return'';}return walk(value);
  }
  function accessTokenFrom(data){
    if(!data)return'';if(typeof data==='string'&&data.split('.').length>=2)return data;
    const direct=deepFind(data,['access-token','access_token','accessToken','jwt','token']);if(direct)return direct;
    const msg=typeof data?.message==='string'?data.message:'';return msg&&msg.split('.').length>=2?msg:'';
  }
  function requestIdFrom(data){
    const direct=deepFind(data,['reqId','req_id','requestId','request_id']);if(direct)return direct;
    const msg=typeof data?.message==='string'?data.message.trim():'';return msg&&msg.length>=12&&!msg.includes(' ')?msg:'';
  }
  const configuration=()=>({widgetId:C.MSG91_WIDGET_ID,tokenAuth:C.MSG91_WIDGET_TOKEN,exposeMethods:true,success:()=>{},failure:()=>{}});
  async function waitForMethods(timeout=10000){
    const start=Date.now();while(Date.now()-start<timeout){if(typeof window.sendOtp==='function'&&typeof window.verifyOtp==='function'&&typeof window.retryOtp==='function')return true;await new Promise(r=>setTimeout(r,70));}
    throw new Error('OTP service could not start. Please refresh and try again.');
  }
  async function initOnce(){
    if(initialized&&typeof window.sendOtp==='function'&&typeof window.verifyOtp==='function')return true;
    if(!C.MSG91_WIDGET_ID||!C.MSG91_WIDGET_TOKEN)throw new Error('MSG91 OTP Widget is not configured.');
    if(!sdkPromise){
      sdkPromise=new Promise((resolve,reject)=>{
        const start=async()=>{try{if(typeof window.initSendOTP!=='function')throw new Error('MSG91 OTP SDK did not load.');if(!initialized){window.initSendOTP(configuration());initialized=true;}await waitForMethods();resolve(true);}catch(e){sdkPromise=null;initialized=false;reject(errorOf(e));}};
        const existing=document.querySelector('script[data-one-line-msg91]');
        if(existing){if(typeof window.initSendOTP==='function')start();else{existing.addEventListener('load',start,{once:true});existing.addEventListener('error',()=>{sdkPromise=null;reject(new Error('Could not load MSG91 OTP service.'));},{once:true});}return;}
        const script=document.createElement('script');script.src='https://verify.msg91.com/otp-provider.js';script.async=true;script.dataset.oneLineMsg91='1';script.onload=start;script.onerror=()=>{sdkPromise=null;reject(new Error('Could not load MSG91 OTP service.'));};document.head.appendChild(script);
      });
    }
    return sdkPromise;
  }
  async function send(identifier){
    lastIdentifier=String(identifier||'').replace(/\D/g,'');requestId='';
    if(!/^91\d{10}$/.test(lastIdentifier))throw new Error('Enter a valid 10-digit Indian mobile number.');
    if(sendInFlight)return sendInFlight;
    sendInFlight=(async()=>{await initOnce();return await new Promise((resolve,reject)=>{let settled=false;const ok=data=>{if(settled)return;settled=true;requestId=requestIdFrom(data)||requestId;resolve({data,requestId,identifier:lastIdentifier});};const fail=err=>{if(settled)return;settled=true;reject(errorOf(err));};try{window.sendOtp(lastIdentifier,ok,fail);}catch(e){fail(e);}});})();
    try{return await sendInFlight;}finally{sendInFlight=null;}
  }
  async function retry(){
    if(retryInFlight)return retryInFlight;
    retryInFlight=(async()=>{await initOnce();return await new Promise((resolve,reject)=>{try{window.retryOtp(null,data=>{requestId=requestIdFrom(data)||requestId;resolve({data,requestId});},err=>reject(errorOf(err)),requestId||undefined);}catch(e){reject(errorOf(e));}});})();
    try{return await retryInFlight;}finally{retryInFlight=null;}
  }
  async function verify(otp){
    const code=String(otp||'').replace(/\D/g,'');if(code.length<4)throw new Error('Enter the OTP you received.');
    if(verifyInFlight)return verifyInFlight;
    verifyInFlight=(async()=>{await initOnce();return await new Promise((resolve,reject)=>{try{window.verifyOtp(code,data=>{const accessToken=accessTokenFrom(data);if(!accessToken){reject(new Error('OTP could not be verified. Please request a new OTP and try again.'));return;}resolve({data,accessToken,identifier:deepFind(data,['identifier','mobile','phone'])||lastIdentifier,requestId});},err=>reject(errorOf(err)),requestId||undefined);}catch(e){reject(errorOf(e));}});})();
    try{return await verifyInFlight;}finally{verifyInFlight=null;}
  }
  function reset(){requestId='';lastIdentifier='';sendInFlight=null;verifyInFlight=null;retryInFlight=null;}
  window.OneLineOTP={load:initOnce,send,retry,verify,reset,get requestId(){return requestId;}};
})();
