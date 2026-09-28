(function(){
  "use strict";
  const C=window.ONE_LINE_CONFIG||{};
  let loadPromise=null,initialized=false,requestId='',lastIdentifier='';
  let sendInFlight=null,retryInFlight=null,verifyInFlight=null;
  let lastSendAt=0,lastRetryAt=0,lastSendResult=null,lastRetryResult=null;
  const SEND_GUARD_MS=15000,RETRY_GUARD_MS=15000;

  function normalizeError(value){
    if(value instanceof Error)return value;
    const message=value?.message||value?.error||value?.description||value?.data?.message||value?.data?.error||String(value||'OTP request failed.');
    return new Error(String(message).replace(/^Error:\s*/i,''));
  }
  function deepFind(value,keys){
    const wanted=new Set(keys.map(k=>String(k).toLowerCase())),seen=new Set();
    function walk(v){
      if(v==null||typeof v!=='object'||seen.has(v))return '';
      seen.add(v);
      for(const [k,x] of Object.entries(v))if(wanted.has(String(k).toLowerCase())&&(typeof x==='string'||typeof x==='number')&&String(x).trim())return String(x).trim();
      for(const x of Object.values(v)){const found=walk(x);if(found)return found;}
      return '';
    }
    return walk(value);
  }
  function accessTokenFrom(data){
    if(!data)return '';
    if(typeof data==='string'&&data.split('.').length>=2)return data.trim();
    const direct=deepFind(data,['access-token','access_token','accessToken','jwt','token']);
    if(direct)return direct;
    const msg=typeof data?.message==='string'?data.message.trim():'';
    return msg&&msg.split('.').length>=2?msg:'';
  }
  function requestIdFrom(data){
    const direct=deepFind(data,['reqId','req_id','requestId','request_id']);
    if(direct)return direct;
    const msg=typeof data?.message==='string'?data.message.trim():'';
    return msg&&msg.length>=12&&!/\s/.test(msg)&&!msg.includes('.')?msg:'';
  }
  function config(){
    return {
      widgetId:C.MSG91_WIDGET_ID,
      tokenAuth:C.MSG91_WIDGET_TOKEN,
      exposeMethods:true,
      captchaRenderId:'',
      success:()=>{},
      failure:()=>{}
    };
  }
  async function waitForMethods(timeout=9000){
    const start=Date.now();
    while(Date.now()-start<timeout){
      if(typeof window.sendOtp==='function'&&typeof window.retryOtp==='function'&&typeof window.verifyOtp==='function')return true;
      await new Promise(r=>setTimeout(r,80));
    }
    throw new Error('OTP service could not start. Check your internet connection and try again.');
  }
  async function initialiseOnce(){
    if(initialized&&typeof window.sendOtp==='function'&&typeof window.verifyOtp==='function')return true;
    if(typeof window.initSendOTP!=='function')throw new Error('MSG91 OTP SDK did not load.');
    window.initSendOTP(config());
    initialized=true;
    await waitForMethods();
    return true;
  }
  function load(){
    if(initialized&&typeof window.sendOtp==='function'&&typeof window.verifyOtp==='function')return Promise.resolve(true);
    if(loadPromise)return loadPromise;
    if(!C.MSG91_WIDGET_ID||!C.MSG91_WIDGET_TOKEN)return Promise.reject(new Error('MSG91 OTP Widget is not configured.'));
    loadPromise=new Promise((resolve,reject)=>{
      const finish=()=>initialiseOnce().then(resolve).catch(err=>{loadPromise=null;initialized=false;reject(normalizeError(err));});
      const existing=document.querySelector('script[data-one-line-msg91]');
      if(existing){
        if(typeof window.initSendOTP==='function')finish();
        else{existing.addEventListener('load',finish,{once:true});existing.addEventListener('error',()=>{loadPromise=null;reject(new Error('Could not load MSG91 OTP SDK.'));},{once:true});}
        return;
      }
      const script=document.createElement('script');
      script.src='https://verify.msg91.com/otp-provider.js';
      script.async=true;
      script.dataset.oneLineMsg91='1';
      script.onload=finish;
      script.onerror=()=>{loadPromise=null;reject(new Error('Could not load MSG91 OTP service.'));};
      document.head.appendChild(script);
    });
    return loadPromise;
  }
  async function send(identifier){
    const mobile=String(identifier||'').replace(/\D/g,'');
    if(!/^91\d{10}$/.test(mobile))throw new Error('Enter a valid 10-digit Indian mobile number.');
    if(sendInFlight&&mobile===lastIdentifier)return sendInFlight;
    if(mobile===lastIdentifier&&lastSendResult&&Date.now()-lastSendAt<SEND_GUARD_MS)return lastSendResult;
    if(mobile!==lastIdentifier){requestId='';lastSendResult=null;lastRetryResult=null;lastRetryAt=0;}
    lastIdentifier=mobile;
    sendInFlight=(async()=>{
      await load();
      const result=await new Promise((resolve,reject)=>{
        try{window.sendOtp(mobile,data=>{requestId=requestIdFrom(data)||requestId;resolve({data,requestId,accessToken:accessTokenFrom(data),identifier:mobile});},err=>reject(normalizeError(err)));}
        catch(e){reject(normalizeError(e));}
      });
      lastSendAt=Date.now();lastSendResult=result;return result;
    })();
    try{return await sendInFlight;}finally{sendInFlight=null;}
  }
  async function retry(){
    if(retryInFlight)return retryInFlight;
    if(lastRetryResult&&Date.now()-lastRetryAt<RETRY_GUARD_MS)return lastRetryResult;
    if(!lastIdentifier)throw new Error('Enter your mobile number and request an OTP first.');
    if(!requestId)throw new Error('OTP session is missing. Change the number and request a new OTP.');
    retryInFlight=(async()=>{
      await load();
      const result=await new Promise((resolve,reject)=>{
        try{window.retryOtp(null,data=>{requestId=requestIdFrom(data)||requestId;resolve({data,requestId,identifier:lastIdentifier});},err=>reject(normalizeError(err)),requestId);}
        catch(e){reject(normalizeError(e));}
      });
      lastRetryAt=Date.now();lastRetryResult=result;return result;
    })();
    try{return await retryInFlight;}finally{retryInFlight=null;}
  }
  async function verify(otp){
    const code=String(otp||'').replace(/\D/g,'');
    if(code.length<4)throw new Error('Enter the OTP you received.');
    if(verifyInFlight)return verifyInFlight;
    if(!lastIdentifier||!requestId)throw new Error('OTP session is missing. Change the number and request a new OTP.');
    verifyInFlight=(async()=>{
      await load();
      return await new Promise((resolve,reject)=>{
        try{
          window.verifyOtp(code,data=>{
            const accessToken=accessTokenFrom(data);
            if(!accessToken){reject(new Error('OTP was verified but MSG91 did not return the verification token. Request a new OTP and try again.'));return;}
            resolve({data,accessToken,identifier:deepFind(data,['identifier','mobile','phone'])||lastIdentifier,requestId});
          },err=>reject(normalizeError(err)),requestId);
        }catch(e){reject(normalizeError(e));}
      });
    })();
    try{return await verifyInFlight;}finally{verifyInFlight=null;}
  }
  function reset(){requestId='';lastIdentifier='';sendInFlight=null;retryInFlight=null;verifyInFlight=null;lastSendAt=0;lastRetryAt=0;lastSendResult=null;lastRetryResult=null;}
  window.OneLineOTP={load,send,retry,verify,reset,get requestId(){return requestId;},get identifier(){return lastIdentifier;}};
})();
