(function(){
  "use strict";
  const C=window.ONE_LINE_CONFIG||{};
  let loadPromise=null,requestId='',lastIdentifier='';

  function normalizeError(value){
    if(value instanceof Error)return value;
    const message=value?.message||value?.error||value?.description||value?.data?.message||value?.data?.error||String(value||'OTP request failed.');
    return new Error(String(message).replace(/^Error:\s*/i,''));
  }
  function deepFind(value,keys){
    const wanted=new Set(keys.map(k=>String(k).toLowerCase()));
    const seen=new Set();
    function walk(v){
      if(v==null)return '';
      if(typeof v==='string'||typeof v==='number')return '';
      if(typeof v!=='object'||seen.has(v))return '';
      seen.add(v);
      for(const [k,x] of Object.entries(v)){
        if(wanted.has(String(k).toLowerCase())&&(typeof x==='string'||typeof x==='number')&&String(x).trim())return String(x).trim();
      }
      for(const x of Object.values(v)){const found=walk(x);if(found)return found;}
      return '';
    }
    return walk(value);
  }
  function accessTokenFrom(data){
    if(!data)return '';
    if(typeof data==='string'&&data.split('.').length>=2)return data;
    const direct=deepFind(data,['access-token','access_token','accessToken','jwt','token']);
    if(direct)return direct;
    // MSG91 widget success commonly returns the verified access token in message.
    const msg=typeof data?.message==='string'?data.message:'';
    if(msg&&msg.split('.').length>=2)return msg;
    return '';
  }
  function requestIdFrom(data){
    const direct=deepFind(data,['reqId','req_id','requestId','request_id']);
    if(direct)return direct;
    // Normal MSG91 SendOTP success commonly returns reqId in message.
    const msg=typeof data?.message==='string'?data.message.trim():'';
    if(msg&&msg.length>=12&&!msg.includes(' '))return msg;
    return '';
  }
  function config(){
    return {
      widgetId:C.MSG91_WIDGET_ID,
      tokenAuth:C.MSG91_WIDGET_TOKEN,
      identifier:lastIdentifier||'',
      exposeMethods:true,
      captchaRenderId:'one-line-msg91-captcha',
      success:()=>{},failure:()=>{}
    };
  }
  async function waitForMethods(timeout=9000){
    const start=Date.now();
    while(Date.now()-start<timeout){
      if(typeof window.sendOtp==='function'&&typeof window.verifyOtp==='function')return true;
      await new Promise(r=>setTimeout(r,80));
    }
    throw new Error('OTP service could not start. Check your internet connection and try again.');
  }
  function load(){
    if(typeof window.sendOtp==='function'&&typeof window.verifyOtp==='function')return Promise.resolve(true);
    if(loadPromise)return loadPromise;
    if(!C.MSG91_WIDGET_ID||!C.MSG91_WIDGET_TOKEN)return Promise.reject(new Error('MSG91 OTP Widget is not configured.'));
    loadPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-one-line-msg91]');
      const start=async()=>{
        try{
          if(typeof window.initSendOTP!=='function')throw new Error('MSG91 OTP SDK did not load.');
          window.initSendOTP(config());
          await waitForMethods();resolve(true);
        }catch(e){loadPromise=null;reject(normalizeError(e));}
      };
      if(existing){
        if(typeof window.initSendOTP==='function')start();
        else{existing.addEventListener('load',start,{once:true});existing.addEventListener('error',()=>reject(new Error('Could not load MSG91 OTP SDK.')),{once:true});}
        return;
      }
      const script=document.createElement('script');
      script.src='https://verify.msg91.com/otp-provider.js';script.async=true;script.dataset.oneLineMsg91='1';
      script.onload=start;script.onerror=()=>{loadPromise=null;reject(new Error('Could not load MSG91 OTP service.'));};
      document.head.appendChild(script);
    });
    return loadPromise;
  }
  async function send(identifier){
    lastIdentifier=String(identifier||'').replace(/\D/g,'');requestId='';
    if(!/^91\d{10}$/.test(lastIdentifier))throw new Error('Enter a valid 10-digit Indian mobile number.');
    await load();
    // Re-initialize before every fresh send. The custom auth modal is re-rendered between attempts,
    // so this remounts MSG91 CAPTCHA (when enabled) into the current DOM container.
    if(typeof window.initSendOTP==='function')window.initSendOTP(config());
    await waitForMethods();
    return await new Promise((resolve,reject)=>{
      try{window.sendOtp(lastIdentifier,data=>{requestId=requestIdFrom(data)||requestId;resolve({data,requestId,accessToken:accessTokenFrom(data),identifier:lastIdentifier});},err=>reject(normalizeError(err)));}
      catch(e){reject(normalizeError(e));}
    });
  }
  async function retry(){
    await load();
    return await new Promise((resolve,reject)=>{
      try{window.retryOtp(null,data=>{requestId=requestIdFrom(data)||requestId;resolve({data,requestId});},err=>reject(normalizeError(err)),requestId||undefined);}
      catch(e){reject(normalizeError(e));}
    });
  }
  async function verify(otp){
    await load();const code=String(otp||'').replace(/\D/g,'');if(code.length<4)throw new Error('Enter the OTP you received.');
    return await new Promise((resolve,reject)=>{
      try{window.verifyOtp(code,data=>{const accessToken=accessTokenFrom(data);if(!accessToken){reject(new Error('OTP was accepted but the verification token was missing. Please retry.'));return;}resolve({data,accessToken,identifier:deepFind(data,['identifier','mobile','phone'])||lastIdentifier,requestId});},err=>reject(normalizeError(err)),requestId||undefined);}
      catch(e){reject(normalizeError(e));}
    });
  }
  function reset(){requestId='';lastIdentifier='';}
  window.OneLineOTP={load,send,retry,verify,reset,get requestId(){return requestId;}};
})();
