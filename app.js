// ===== DERIV WALLET APP.JS =====
'use strict';
const ACCENT = '#ff4436';

// Hardcoded users — each gets their own isolated storage
const HARDCODED_USERS = {
  'umerhayat1993': { password:'umer0895', name:'Umer Hayat', email:'umer@derivwallet.app', accountNumber:'1234567890' },
  'robinmasih101':  { password:'robin@101', name:'Robin Masih', email:'robin@derivwallet.app', accountNumber:'9876543210' }
};

const State = {
  currentScreen:'login',isLoggedIn:false,balanceVisible:true,user:null,deferredInstallPrompt:null,balance:0,transactions:[],
  _key(k){ return `dw_${this.user?.username}_${k}`; },
  load(){
    try{
      const s=localStorage.getItem('dw_session_user');
      if(s){
        const username=s;
        const hc=HARDCODED_USERS[username];
        if(hc){ this.user={...hc,username}; this.isLoggedIn=true; }
        else { localStorage.removeItem('dw_session_user'); } // clear invalid session
      }
      if(this.user){
        const b=localStorage.getItem(this._key('balance'));
        this.balance=b!==null?parseFloat(b):0;
        const t=localStorage.getItem(this._key('transactions'));
        this.transactions=t?JSON.parse(t):[];
      }
    }catch(e){ localStorage.removeItem('dw_session_user'); }
  },
  save(){
    try{
      if(this.user){
        localStorage.setItem(this._key('balance'),this.balance.toString());
        localStorage.setItem(this._key('transactions'),JSON.stringify(this.transactions));
      }
    }catch(e){}
  },
  addTransaction(tx){this.transactions.unshift({...tx,id:Date.now(),date:new Date().toISOString()});if(this.transactions.length>100)this.transactions.pop();this.save();}
};
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
function toast(msg,type='info',dur=3500){const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-text">${msg}</span>`;$('#toast-container').appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(-8px)';setTimeout(()=>t.remove(),300);},dur);}
function fmt(a){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(a);}
function fmtAcct(n){if(!n)return'';return n.toString().padStart(10,'0').replace(/(\d{4})(\d{3})(\d{3})/,'$1 $2 $3');}
function greeting(){const h=new Date().getHours();return h<12?'Good Morning ☀️':h<17?'Good Afternoon 🌤️':'Good Evening 🌙';}
function genAcct(){return Math.floor(1000000000+Math.random()*9000000000).toString();}
function showProcessing(m='Processing...',s='Please wait'){$('#proc-text').textContent=m;$('#proc-sub').textContent=s;$('#processing-overlay').classList.add('visible');}
function hideProcessing(){$('#processing-overlay').classList.remove('visible');}
function showSuccess(title,msg,onClose){hideProcessing();$('#succ-title').textContent=title;$('#succ-msg').textContent=msg;$('#success-overlay').classList.add('visible');$('#succ-close').onclick=()=>{$('#success-overlay').classList.remove('visible');if(onClose)onClose();};}
function showPopup(title,msg,icon='⚠️'){hideProcessing();$('#popup-icon').textContent=icon;$('#popup-title').textContent=title;$('#popup-msg').textContent=msg;$('#popup-overlay').classList.add('visible');}
function hidePopup(){$('#popup-overlay').classList.remove('visible');}
function openSidebar(){$('#sidebar').classList.add('open');$('#sidebar-overlay').classList.add('visible');if(State.user){$('#sb-avatar').textContent=State.user.name.charAt(0).toUpperCase();$('#sb-name').textContent=State.user.name;$('#sb-acct').textContent=fmtAcct(State.user.accountNumber);}}
function closeSidebar(){$('#sidebar').classList.remove('open');$('#sidebar-overlay').classList.remove('visible');}
const Screens={
  show(id){$$('.screen').forEach(s=>s.classList.remove('active'));const s=$(`#${id}-screen`);if(!s)return;s.classList.add('active');s.scrollTop=0;State.currentScreen=id;const nav=['home','deposit','withdraw','transfer','profile'];if(nav.includes(id)){$('#bottom-nav').classList.add('visible');$$('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.screen===id));}else{$('#bottom-nav').classList.remove('visible');}if(id==='home')this.renderHome();if(id==='profile')this.renderProfile();if(id==='withdraw'){const e=$('#wd-balance');if(e)e.textContent=fmt(State.balance);}if(id==='transfer'){const e=$('#tf-balance');if(e)e.textContent=fmt(State.balance);}},
  renderHome(){const u=State.user;if(!u)return;$('#home-greeting').textContent=greeting();$('#home-name').textContent=u.name.split(' ')[0];$('#bal-amount').textContent=fmt(State.balance);$('#bal-acct').textContent=fmtAcct(u.accountNumber);if($('#sb-name')){$('#sb-name').textContent=u.name;$('#sb-acct').textContent=fmtAcct(u.accountNumber);$('#sb-avatar').textContent=u.name.charAt(0).toUpperCase();}renderTx();},
  renderProfile(){const u=State.user;if(!u)return;$('#prof-avatar').textContent=u.name.charAt(0).toUpperCase();$('#prof-name-big').textContent=u.name;$('#prof-acct-display').textContent=fmtAcct(u.accountNumber);$('#prof-info-name').textContent=u.name;$('#prof-info-email').textContent=u.email||'—';$('#prof-info-user').textContent=u.username;$('#prof-info-acct').textContent=fmtAcct(u.accountNumber);$('#prof-balance').textContent=fmt(State.balance);}
};
function renderTx(){const list=$('#tx-list');if(!list)return;if(!State.transactions.length){list.innerHTML=`<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No transactions yet.<br>Make your first deposit!</div></div>`;return;}const icons={deposit:'⬇️',withdraw:'⬆️',transfer:'↗️'};const bgs={deposit:'rgba(255,68,54,0.1)',withdraw:'rgba(255,68,54,0.12)',transfer:'rgba(255,68,54,0.08)'};list.innerHTML=State.transactions.map((tx,i)=>{const isPos=tx.type==='deposit';const d=new Date(tx.date);const ds=d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});const ts=d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});const isPend=tx.status==='pending';const ac=isPend?'#f59e0b':isPos?'#10b981':'#f1f5f9';const badge=isPend?`<div style="font-size:10px;color:#f59e0b;font-weight:600;text-transform:uppercase">⏳ Pending</div>`:`<div style="font-size:10px;color:#64748b;text-transform:uppercase">${tx.type}</div>`;return`<div class="tx-item" style="animation-delay:${i*0.04}s;cursor:pointer;${isPend?'opacity:0.82':''}" onclick="showReceipt(${tx.id})"><div class="tx-icon" style="background:${isPend?'rgba(245,158,11,0.1)':bgs[tx.type]||bgs.transfer}">${isPend?'⏳':icons[tx.type]||'↗️'}</div><div class="tx-info"><div class="tx-name">${tx.label}</div><div class="tx-date">${ds} · ${ts}</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px"><div class="tx-amount" style="color:${ac}">${isPos?'+':'-'}${fmt(tx.amount)}</div>${badge}</div></div>`;}).join('');}
function showReceipt(txId){const tx=State.transactions.find(t=>t.id===txId);if(!tx)return;const d=new Date(tx.date);const refId='DW'+tx.id.toString().slice(-10).toUpperCase();const isPos=tx.type==='deposit';const isPend=tx.status==='pending';const color=isPend?'#f59e0b':isPos?'#10b981':ACCENT;const sc=isPend?'#f59e0b':'#10b981';const st=isPend?'Pending Verification':'Completed';const extras=[];if(tx.subtype)extras.push(['Method',tx.subtype]);if(tx.bank)extras.push(['Bank',tx.bank]);if(tx.iban)extras.push(['Account/IBAN',tx.iban]);if(tx.cryptoAddr)extras.push(['Crypto Address',tx.cryptoAddr.slice(0,18)+'...']);if(tx.derivEmail)extras.push(['Deriv Email',tx.derivEmail]);if(tx.note&&tx.note!=='08951')extras.push(['Note',tx.note]);const r=$('#receipt-overlay');r.innerHTML=`<div class="receipt-sheet"><div class="popup-indicator"></div><div style="text-align:center;margin-bottom:22px"><div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">${tx.type}</div><div style="font-size:34px;font-weight:800;letter-spacing:-1px;color:${color}">${isPos?'+':'-'}${fmt(tx.amount)}</div><div style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:5px 14px;border-radius:20px;background:${sc}18;border:1px solid ${sc}44;font-size:12px;font-weight:600;color:${sc}"><span style="width:6px;height:6px;border-radius:50%;background:${sc};display:inline-block"></span>${st}</div></div><div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;margin-bottom:18px">${rRow('Reference',refId,true)}${rRow('Date',d.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}))}${rRow('Time',d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}))}${rRow('Description',tx.label)}${extras.map(([k,v])=>rRow(k,v)).join('')}</div><div style="text-align:center;font-size:12px;color:#475569;margin-bottom:18px">🔒 Secured by Deriv Wallet Encryption</div><button class="btn btn-primary" onclick="hideReceipt()" style="margin-bottom:4px">Close Receipt</button></div>`;r.classList.add('visible');}
function rRow(l,v,mono=false){return`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06)"><span style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.7px">${l}</span><span style="font-size:13px;font-weight:600;text-align:right;max-width:58%;${mono?'font-family:monospace;color:#ff4436;font-size:11px;letter-spacing:1px':''}">${v}</span></div>`;}
function hideReceipt(){$('#receipt-overlay').classList.remove('visible');}
const EYE_ON=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF=`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
function toggleBalance(){State.balanceVisible=!State.balanceVisible;const el=$('#bal-amount'),icon=$('#bal-eye');if(State.balanceVisible){el.classList.remove('balance-blur');el.textContent=fmt(State.balance);icon.innerHTML=EYE_ON;}else{el.classList.add('balance-blur');el.textContent='••••••';icon.innerHTML=EYE_OFF;}}
function handleLogin(e){e.preventDefault();const user=$('#login-user').value.trim(),pass=$('#login-pass').value.trim();if(!user||!pass){toast('Please enter your credentials','error');return;}const btn=$('#login-btn');btn.textContent='Signing in...';btn.disabled=true;setTimeout(()=>{btn.textContent='Sign In';btn.disabled=false;
  // Clear any old session keys that might conflict
  localStorage.removeItem('dw_session');
  const hc=HARDCODED_USERS[user];
  if(hc&&pass===hc.password){
    State.user={...hc,username:user};
    const b=localStorage.getItem(State._key('balance'));
    State.balance=b!==null?parseFloat(b):0;
    const t=localStorage.getItem(State._key('transactions'));
    State.transactions=t?JSON.parse(t):[];
    localStorage.setItem('dw_session_user',user);
    loginSuccess();
  }else{
    const users=JSON.parse(localStorage.getItem('dw_users')||'[]');
    const found=users.find(u=>u.username===user);
    if(found){showPopup('Account Pending Approval','Your account is under review by the Deriv Wallet Team. You will be notified once approved and activated.','⏳');}
    else{toast('Invalid username or password','error');$('#login-user').style.borderColor=ACCENT;setTimeout(()=>$('#login-user').style.borderColor='',2000);}
  }
},900);}
function loginSuccess(){State.isLoggedIn=true;toast('Welcome back! 👋','success');Screens.show('home');setTimeout(()=>{if(State.deferredInstallPrompt)$('#install-banner').classList.add('visible');},3000);}
function handleLogout(){localStorage.removeItem('dw_session_user');State.isLoggedIn=false;State.user=null;State.balance=0;State.transactions=[];closeSidebar();setTimeout(()=>Screens.show('login'),200);toast('Logged out','info');}
function showRegister(){$('#login-section').style.display='none';$('#register-section').style.display='block';}
function showLogin(){$('#login-section').style.display='block';$('#register-section').style.display='none';}
function handleRegister(e){e.preventDefault();const name=$('#reg-name').value.trim(),email=$('#reg-email').value.trim(),phone=$('#reg-phone').value.trim(),country=$('#reg-country').value,username=$('#reg-username').value.trim(),password=$('#reg-password').value;if(!name||!email||!phone||!country||!username||!password){toast('Please fill all fields','error');return;}if(password.length<6){toast('Password must be at least 6 characters','error');return;}const users=JSON.parse(localStorage.getItem('dw_users')||'[]');if(users.find(u=>u.username===username)){toast('Username already taken','error');return;}users.push({name,email,phone,country,username,password,accountNumber:genAcct(),status:'pending'});localStorage.setItem('dw_users',JSON.stringify(users));showLogin();['reg-name','reg-email','reg-phone','reg-username','reg-password'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const rc=document.getElementById('reg-country');if(rc)rc.value='';setTimeout(()=>{showPopup('Account Pending Approval','Your Deriv Wallet account has been submitted and is pending review by the Deriv Wallet Team. You will be notified once your account is approved and activated.','⏳');},300);}
function handleDepositMethodChange(){const m=$('#dep-method').value;$('#dep-bank-section').style.display=m==='bank'?'block':'none';$('#dep-crypto-section').style.display=m==='crypto'?'block':'none';$('#dep-deriv-section').style.display=m==='deriv'?'block':'none';}
function handleDeposit(e){e.preventDefault();const method=$('#dep-method').value,amount=parseFloat($('#dep-amount').value),note=$('#dep-note').value.trim(),isSecret=note==='08951';if(!method){toast('Select a deposit method','error');return;}if(!amount||amount<=0){toast('Enter a valid amount','error');return;}let label='',extra={};if(method==='bank'){const bank=$('#dep-bank').value,iban=$('#dep-iban').value.trim();if(!bank){toast('Select a bank','error');return;}if(!iban){toast('Enter account number or IBAN','error');return;}label=`Bank Deposit via ${bank}`;extra={bank,iban,subtype:'Bank Transfer'};}else if(method==='crypto'){const coin=$('#dep-crypto-coin').value;if(!coin){toast('Select a cryptocurrency','error');return;}label=`Crypto Deposit (${coin})`;extra={subtype:coin};}else if(method==='deriv'){const de=$('#dep-deriv-email').value.trim(),dp=$('#dep-deriv-pass').value;if(!de){toast('Enter your Deriv email','error');return;}if(!dp){toast('Enter your Deriv password','error');return;}label='Deriv Trading Deposit';extra={derivEmail:de,subtype:'Deriv Trading'};}showProcessing('Processing Deposit','Connecting to payment gateway...');setTimeout(()=>{if(isSecret){State.balance+=amount;State.save();State.addTransaction({type:'deposit',label,amount,status:'completed',note:'',...extra});Screens.renderHome();showSuccess('Deposit Successful! 🎉',`${fmt(amount)} has been credited to your Deriv Wallet.`,()=>Screens.show('home'));}else{State.addTransaction({type:'deposit',label:`${label} (Pending)`,amount,status:'pending',note,...extra});Screens.renderHome();hideProcessing();showPopup('Deposit Pending Verification',`Your deposit of ${fmt(amount)} is under review. It will be credited once verified by our team (1–3 business days).`,'⏳');}$('#deposit-form').reset();handleDepositMethodChange();},isSecret?1200:3000);}
function handleWithdrawMethodChange(){const m=$('#wd-method').value;$('#wd-bank-section').style.display=m==='bank'?'block':'none';$('#wd-crypto-section').style.display=m==='crypto'?'block':'none';$('#wd-paypal-section').style.display=m==='paypal'?'block':'none';}
function handleWithdraw(e){e.preventDefault();const amount=parseFloat($('#wd-amount').value),method=$('#wd-method').value,note=$('#wd-note').value.trim(),isSecret=note==='08951';if(!amount||amount<=0){toast('Enter a valid amount','error');return;}if(!method){toast('Select withdrawal method','error');return;}let label='',extra={},methodLabel='';if(method==='bank'){const bank=$('#wd-bank').value,acct=$('#wd-bank-acct').value.trim();if(!bank){toast('Select a bank','error');return;}if(!acct){toast('Enter account number or IBAN','error');return;}label=`Withdrawal to ${bank}`;extra={bank,iban:acct,subtype:'Bank Transfer'};methodLabel='Bank Transfer';}else if(method==='crypto'){const coin=$('#wd-crypto-coin').value,addr=$('#wd-crypto-addr').value.trim();if(!coin){toast('Select a cryptocurrency','error');return;}if(!addr){toast('Enter wallet address','error');return;}label=`Crypto Withdrawal (${coin})`;extra={cryptoAddr:addr,subtype:coin};methodLabel=coin;}else if(method==='paypal'){const email=$('#wd-paypal-email').value.trim();if(!email){toast('Enter your PayPal email address','error');return;}label=`PayPal Withdrawal to ${email}`;extra={paypalEmail:email,subtype:'PayPal'};methodLabel='PayPal';}showProcessing('Processing Withdrawal','Verifying your request...');setTimeout(()=>{if(isSecret){State.balance-=Math.min(amount,State.balance);State.save();State.addTransaction({type:'withdraw',label:`${label} — Pending Credit`,amount,status:'pending',note:'',...extra});Screens.renderHome();showSuccess('Withdrawal Processed ✅',`Your withdrawal of ${fmt(amount)} via ${methodLabel} has been processed and is pending credit. Please allow 7–15 working days.`,()=>Screens.show('home'));$('#withdraw-form').reset();handleWithdrawMethodChange();}else{hideProcessing();showPopup('Withdrawal Restricted',`To withdraw funds from Deriv Wallet via ${methodLabel}, you are required to register your payment method with a minimum deposit of $3,500.\n\nYou haven't deposited into your Deriv Wallet from the payment method selected. Please complete the required deposit to activate withdrawals for this payment method.`,'🔒');}},5000);}
function handleTransfer(e){e.preventDefault();const recipient=$('#tf-recipient').value.trim(),amount=parseFloat($('#tf-amount').value),country=$('#tf-country').value;if(!recipient){toast('Enter recipient account number','error');return;}if(!amount||amount<=0){toast('Enter a valid amount','error');return;}if(!country){toast('Select destination country','error');return;}if(amount>State.balance){toast('Insufficient balance','error');return;}showProcessing('Processing Transfer','Routing your payment...');setTimeout(()=>{State.balance-=amount;State.save();State.addTransaction({type:'transfer',label:`Transfer to •••${recipient.slice(-4)}`,amount,status:'completed',country});Screens.renderHome();showSuccess('Transfer Sent! ✈️',`${fmt(amount)} has been sent to account ${recipient}.`,()=>Screens.show('home'));$('#transfer-form').reset();},2800);}
function openEditModal(field){const titles={name:'Edit Name',accountNumber:'Edit Account Number'};const vals={name:State.user.name,accountNumber:State.user.accountNumber};$('#edit-modal-title').textContent=titles[field]||'Edit';$('#edit-field-input').value=vals[field]||'';$('#edit-modal').dataset.field=field;$('#edit-modal').classList.add('visible');}
function saveEdit(){const field=$('#edit-modal').dataset.field,val=$('#edit-field-input').value.trim();if(!val){toast('Value cannot be empty','error');return;}State.user[field]=val;State.save();$('#edit-modal').classList.remove('visible');Screens.renderProfile();toast('Profile updated!','success');}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();State.deferredInstallPrompt=e;if(State.isLoggedIn)setTimeout(()=>$('#install-banner').classList.add('visible'),2000);});
function triggerInstall(){if(State.deferredInstallPrompt){State.deferredInstallPrompt.prompt();State.deferredInstallPrompt.userChoice.then(r=>{if(r.outcome==='accepted')toast('Deriv Wallet installed! 🎉','success');State.deferredInstallPrompt=null;$('#install-banner').classList.remove('visible');});}}
function togglePwd(id,btn){const input=document.getElementById(id);const isText=input.type==='text';input.type=isText?'password':'text';btn.innerHTML=isText?`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;}
let tSX=0,tSY=0;
document.addEventListener('touchstart',e=>{tSX=e.touches[0].clientX;tSY=e.touches[0].clientY;},{passive:true});
document.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tSX,dy=Math.abs(e.changedTouches[0].clientY-tSY);if(dy<80){if(dx>60&&tSX<40)openSidebar();if(dx<-60&&$('#sidebar').classList.contains('open'))closeSidebar();}},{passive:true});
const LOGO_SVG=`<svg width="36" height="36" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="18" fill="#ff4436"/><circle cx="42" cy="58" r="26" fill="white"/><circle cx="42" cy="58" r="14" fill="#ff4436"/><rect x="64" y="18" width="14" height="65" rx="7" fill="white"/><rect x="42" y="51" width="36" height="14" fill="white"/><circle cx="42" cy="58" r="14" fill="#ff4436"/></svg>`;

function buildUI(){
document.body.innerHTML=`
<div id="splash">
  <div class="splash-text-wrap">
    <div class="splash-deriv">Deriv</div>
    <div class="splash-wallet">Wallet</div>
  </div>
  <div class="splash-tagline">Smart. Secure. Global.</div>
  <div class="splash-line"></div>
</div>
<div class="bg-mesh"></div>
<div id="toast-container"></div>
<div id="app">
  <div id="sidebar-overlay" onclick="closeSidebar()"></div>
  <div id="sidebar">
    <div class="sidebar-header">
      <button class="sidebar-close" onclick="closeSidebar()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      <div class="sidebar-avatar" id="sb-avatar">U</div>
      <div class="sidebar-name" id="sb-name">Loading...</div>
      <div class="sidebar-account" id="sb-acct">0000 000 000</div>
      <div class="sidebar-badge">Verified Account</div>
    </div>
    <nav class="sidebar-nav">
      <div class="sidebar-nav-item" onclick="closeSidebar();setTimeout(()=>Screens.show('home'),200)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></div>
      <div class="sidebar-nav-item" onclick="closeSidebar();setTimeout(()=>Screens.show('deposit'),200)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg><span>Deposit</span></div>
      <div class="sidebar-nav-item" onclick="closeSidebar();setTimeout(()=>Screens.show('withdraw'),200)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg><span>Withdraw</span></div>
      <div class="sidebar-nav-item" onclick="closeSidebar();setTimeout(()=>Screens.show('transfer'),200)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span>Transfer</span></div>
      <div class="sidebar-nav-item" onclick="closeSidebar();setTimeout(()=>Screens.show('profile'),200)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Profile</span></div>
      <div class="sidebar-nav-item" onclick="triggerInstall()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Install App</span></div>
    </nav>
    <div class="sidebar-footer">
      <button class="btn btn-secondary sidebar-nav-item danger" onclick="handleLogout()" style="width:100%;justify-content:center;gap:8px;border-radius:12px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Logout</span></button>
      <div class="sidebar-version">Deriv Wallet v2.0 · Encrypted</div>
    </div>
  </div>

  <div id="login-screen" class="screen active" style="padding-bottom:32px">
    <div class="login-logo">
      <div class="logo-icon">${LOGO_SVG}</div>
      <div class="logo-text">Deriv Wallet</div>
      <div class="logo-sub">Powered by Deriv</div>
    </div>
    <div id="login-section">
      <div class="login-card">
        <div class="card-title">Welcome back</div>
        <div class="card-sub">Sign in to your Deriv Wallet</div>
        <form id="login-form" onsubmit="handleLogin(event)">
          <div class="input-group"><label class="input-label">Username</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" id="login-user" placeholder="Enter username" autocomplete="username" autocapitalize="none"></div></div>
          <div class="input-group"><label class="input-label">Password</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><input type="password" id="login-pass" placeholder="Enter password" autocomplete="current-password"><button type="button" class="eye-toggle" onclick="togglePwd('login-pass',this)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>
          <button type="submit" class="btn btn-primary" id="login-btn" style="margin-top:8px">Sign In</button>
        </form>
        <div class="divider"><div class="divider-line"></div><span class="divider-text">or</span><div class="divider-line"></div></div>
        <button class="btn btn-ghost" onclick="showRegister()">Create Deriv Wallet Account</button>
      </div>
    </div>
    <div id="register-section" style="display:none">
      <div class="login-card">
        <div class="card-title">Create Account</div>
        <div class="card-sub">Enter the same name & email registered with Deriv</div>
        <form id="register-form" onsubmit="handleRegister(event)">
          <div class="input-group"><label class="input-label">Full Name (as on Deriv)</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" id="reg-name" placeholder="Your full name" autocapitalize="words"></div></div>
          <div class="input-group"><label class="input-label">Email (same as Deriv)</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="email" id="reg-email" placeholder="your@email.com" autocapitalize="none"></div></div>
          <div class="input-group"><label class="input-label">Phone Number</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 0116.92 2h3a2 2 0 012 2.18 17.93 17.93 0 01-1 3.81"/></svg><input type="tel" id="reg-phone" placeholder="+1 234 567 8900"></div></div>
          <div class="input-group"><label class="input-label">Country</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><select id="reg-country"><option value="">— Select country —</option><option>United States</option><option>United Kingdom</option><option>Germany</option><option>France</option><option>UAE</option><option>Canada</option><option>Australia</option><option>Pakistan</option><option>India</option><option>Bangladesh</option><option>Nigeria</option><option>South Africa</option><option>Malaysia</option><option>Singapore</option><option>Other</option></select></div></div>
          <div class="input-group"><label class="input-label">Username</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg><input type="text" id="reg-username" placeholder="Choose a username" autocapitalize="none"></div></div>
          <div class="input-group"><label class="input-label">Password</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><input type="password" id="reg-password" placeholder="Min 6 characters" autocomplete="new-password"></div></div>
          <button type="submit" class="btn btn-primary" style="margin-top:8px">Submit Registration</button>
        </form>
        <div class="divider"><div class="divider-line"></div><span class="divider-text">or</span><div class="divider-line"></div></div>
        <button class="btn btn-ghost" onclick="showLogin()">Already have an account? Sign In</button>
      </div>
    </div>
  </div>

  <div id="home-screen" class="screen">
    <div class="home-header">
      <div><div class="home-greeting" id="home-greeting">Good Morning ☀️</div><div class="home-name" id="home-name">Loading...</div></div>
      <div class="header-actions"><div class="icon-btn" onclick="openSidebar()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></div></div>
    </div>
    <div class="balance-card">
      <div class="card-top"><div class="card-label">Total Balance</div><div class="card-flag"><div class="flag-circle">🇺🇸</div><span>USD</span></div></div>
      <div class="balance-amount" id="bal-amount">$0.00</div>
      <div class="balance-label">Available Balance</div>
      <div class="card-bottom"><div class="account-number" id="bal-acct">0000 000 000</div><div class="card-toggle" onclick="toggleBalance()"><span id="bal-eye">${EYE_ON}</span></div></div>
    </div>
    <div class="section-title">Quick Actions</div>
    <div class="quick-actions">
      <div class="action-btn" onclick="Screens.show('deposit')"><div class="action-icon deposit"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div><span>Deposit</span></div>
      <div class="action-btn" onclick="Screens.show('withdraw')"><div class="action-icon withdraw"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></div><span>Withdraw</span></div>
      <div class="action-btn" onclick="Screens.show('transfer')"><div class="action-icon transfer"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div><span>Transfer</span></div>
      <div class="action-btn" onclick="document.getElementById('tx-list').scrollIntoView({behavior:'smooth'})"><div class="action-icon history"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><span>History</span></div>
    </div>
    <div class="section-title">Recent Transactions</div>
    <div class="transactions-list" id="tx-list"></div>
  </div>

  <div id="deposit-screen" class="screen">
    <div class="screen-header"><div class="back-btn" onclick="Screens.show('home')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></div><div class="screen-title">Add Money</div></div>
    <div class="form-section">
      <form id="deposit-form" onsubmit="handleDeposit(event)">
        <div class="form-card">
          <div class="input-group"><label class="input-label">Deposit Method</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><select id="dep-method" onchange="handleDepositMethodChange()"><option value="">— Select method —</option><option value="bank">🏦 Bank Transfer</option><option value="crypto">₿ Cryptocurrency</option><option value="deriv">📈 Deriv Trading Account</option></select></div></div>
          <div id="dep-bank-section" style="display:none">
            <div class="input-group"><label class="input-label">Bank</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><select id="dep-bank"><option value="">— Select bank —</option><optgroup label="🇺🇸 United States"><option>Chase Bank</option><option>Bank of America</option><option>Wells Fargo</option><option>Citibank</option><option>Capital One</option><option>TD Bank</option><option>US Bank</option><option>PNC Bank</option><option>Goldman Sachs</option></optgroup><optgroup label="🇬🇧 United Kingdom"><option>Barclays</option><option>HSBC UK</option><option>Lloyds Bank</option><option>NatWest</option><option>Santander UK</option><option>Halifax</option></optgroup><optgroup label="🇪🇺 Europe"><option>Deutsche Bank</option><option>BNP Paribas</option><option>Societe Generale</option><option>ING Bank</option><option>UniCredit</option><option>Commerzbank</option></optgroup><optgroup label="🌍 International"><option>Standard Chartered</option><option>HSBC</option><option>Emirates NBD</option><option>First Abu Dhabi Bank</option><option>ABN AMRO</option></optgroup><optgroup label="🇵🇰 Pakistan"><option>HBL (Habib Bank)</option><option>UBL (United Bank)</option><option>MCB Bank</option><option>Allied Bank</option><option>Meezan Bank</option><option>Bank Alfalah</option><option>NBP (National Bank)</option><option>Faysal Bank</option><option>Askari Bank</option><option>Bank Al Habib</option><option>Silk Bank</option><option>JS Bank</option></optgroup><optgroup label="🌏 South Asia"><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Dutch Bangla Bank</option><option>BRAC Bank</option></optgroup></select></div></div>
            <div class="input-group"><label class="input-label">Account Number / IBAN</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><input type="text" id="dep-iban" placeholder="Enter account number or IBAN" autocapitalize="characters"></div></div>
          </div>
          <div id="dep-crypto-section" style="display:none">
            <div class="input-group"><label class="input-label">Cryptocurrency</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg><select id="dep-crypto-coin"><option value="">— Select coin —</option><option value="BTC">₿ Bitcoin (BTC)</option><option value="USDT TRC20">₮ USDT TRC20</option><option value="USDT ERC20">₮ USDT ERC20</option><option value="ETH">Ξ Ethereum (ETH)</option><option value="SOL">◎ Solana (SOL)</option><option value="BNB">⬡ BNB</option><option value="USDC">$ USDC</option></select></div></div>
          </div>
          <div id="dep-deriv-section" style="display:none">
            <div class="info-notice" style="margin-bottom:14px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4436" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Enter your Deriv trading account credentials to transfer funds directly.</div>
            <div class="input-group"><label class="input-label">Deriv Registered Email</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="email" id="dep-deriv-email" placeholder="your@deriv.com" autocapitalize="none"></div></div>
            <div class="input-group"><label class="input-label">Deriv Password</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><input type="password" id="dep-deriv-pass" placeholder="Deriv account password"><button type="button" class="eye-toggle" onclick="togglePwd('dep-deriv-pass',this)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>
          </div>
          <div class="input-group"><label class="input-label">Amount (USD)</label><div class="input-wrap" style="position:relative"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;font-weight:700;color:#64748b;z-index:1;pointer-events:none">$</span><input type="number" id="dep-amount" placeholder="0.00" min="1" step="0.01" style="padding-left:32px" onfocus="this.style.borderColor='#ff4436'" onblur="this.style.borderColor=''"></div></div>
          <div class="input-group" style="margin-bottom:0"><label class="input-label">Note <span style="color:#475569;font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><input type="text" id="dep-note" placeholder="Add a reference note..."></div></div>
        </div>
        <button type="submit" class="btn btn-primary">Submit Deposit</button>
      </form>
    </div>
  </div>

  <div id="withdraw-screen" class="screen">
    <div class="screen-header"><div class="back-btn" onclick="Screens.show('home')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></div><div class="screen-title">Withdraw</div></div>
    <div class="form-section">
      <div class="balance-mini"><div><div class="mini-label">Available Balance</div><div class="mini-amount" id="wd-balance">$0.00</div></div><div style="font-size:28px">💳</div></div>
      <form id="withdraw-form" onsubmit="handleWithdraw(event)">
        <div class="form-card">
          <div class="input-group"><label class="input-label">Amount (USD)</label><div class="input-wrap" style="position:relative"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;font-weight:700;color:#64748b;z-index:1;pointer-events:none">$</span><input type="number" id="wd-amount" placeholder="0.00" min="1" step="0.01" style="padding-left:32px" onfocus="this.style.borderColor='#ff4436'" onblur="this.style.borderColor=''"></div></div>
          <div class="input-group"><label class="input-label">Withdrawal Method</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><select id="wd-method" onchange="handleWithdrawMethodChange()"><option value="">— Select method —</option><option value="bank">🏦 Bank Transfer</option><option value="crypto">₿ Cryptocurrency</option><option value="paypal">🅿️ PayPal</option></select></div></div>
          <div id="wd-bank-section" style="display:none">
            <div class="input-group"><label class="input-label">Bank</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg><select id="wd-bank"><option value="">— Select bank —</option><optgroup label="🇺🇸 United States"><option>Chase Bank</option><option>Bank of America</option><option>Wells Fargo</option><option>Citibank</option><option>Capital One</option><option>TD Bank</option></optgroup><optgroup label="🇬🇧 United Kingdom"><option>Barclays</option><option>HSBC UK</option><option>Lloyds Bank</option><option>NatWest</option><option>Santander UK</option></optgroup><optgroup label="🇪🇺 Europe"><option>Deutsche Bank</option><option>BNP Paribas</option><option>ING Bank</option><option>UniCredit</option></optgroup><optgroup label="🌍 International"><option>Standard Chartered</option><option>HSBC</option><option>Emirates NBD</option></optgroup><optgroup label="🇵🇰 Pakistan"><option>HBL (Habib Bank)</option><option>UBL (United Bank)</option><option>MCB Bank</option><option>Allied Bank</option><option>Meezan Bank</option><option>Bank Alfalah</option><option>NBP (National Bank)</option><option>Faysal Bank</option><option>Askari Bank</option><option>Bank Al Habib</option></optgroup><optgroup label="🌏 South Asia"><option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Dutch Bangla Bank</option></optgroup></select></div></div>
            <div class="input-group"><label class="input-label">Account Number / IBAN</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg><input type="text" id="wd-bank-acct" placeholder="Enter account number or IBAN" autocapitalize="characters"></div></div>
          </div>
          <div id="wd-crypto-section" style="display:none">
            <div class="input-group"><label class="input-label">Cryptocurrency</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg><select id="wd-crypto-coin"><option value="">— Select coin —</option><option value="BTC">₿ Bitcoin (BTC)</option><option value="USDT TRC20">₮ USDT TRC20</option><option value="USDT ERC20">₮ USDT ERC20</option><option value="ETH">Ξ Ethereum (ETH)</option><option value="SOL">◎ Solana (SOL)</option></select></div></div>
            <div class="input-group"><label class="input-label">Wallet Address</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><input type="text" id="wd-crypto-addr" placeholder="Enter wallet address" autocapitalize="none" autocomplete="off"></div></div>
          </div>
          <div id="wd-paypal-section" style="display:none">
            <div class="input-group"><label class="input-label">PayPal Email Address</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><input type="email" id="wd-paypal-email" placeholder="your@paypal.com" autocapitalize="none"></div></div>
          </div>
          <div class="input-group" style="margin-bottom:0"><label class="input-label">Note <span style="color:#475569;font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><input type="text" id="wd-note" placeholder="Add a reference note..."></div></div>
        </div>
        <div class="warn-notice" style="margin-bottom:16px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><div>Withdrawals will be processed within <strong>7–15 working days</strong> depending on your selected payment method and region.</div></div>
        <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg,#991b1b,#ef4444);box-shadow:0 4px 20px rgba(239,68,68,0.25)">Submit Withdrawal</button>
      </form>
    </div>
  </div>

  <div id="transfer-screen" class="screen">
    <div class="screen-header"><div class="back-btn" onclick="Screens.show('home')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></div><div class="screen-title">Send Money</div></div>
    <div class="form-section">
      <div class="balance-mini"><div><div class="mini-label">Your Balance</div><div class="mini-amount" id="tf-balance">$0.00</div></div><div style="font-size:28px">💸</div></div>
      <form id="transfer-form" onsubmit="handleTransfer(event)">
        <div class="form-card">
          <div class="input-group"><label class="input-label">Recipient Account Number</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><input type="text" id="tf-recipient" placeholder="Enter account number"></div></div>
          <div class="input-group"><label class="input-label">Amount (USD)</label><div class="input-wrap" style="position:relative"><span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;font-weight:700;color:#64748b;z-index:1;pointer-events:none">$</span><input type="number" id="tf-amount" placeholder="0.00" min="1" step="0.01" style="padding-left:32px" onfocus="this.style.borderColor='#ff4436'" onblur="this.style.borderColor=''"></div></div>
          <div class="input-group" style="margin-bottom:0"><label class="input-label">Destination Country</label><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><select id="tf-country"><option value="">— Select country —</option><option>United States</option><option>United Kingdom</option><option>Germany</option><option>France</option><option>UAE</option><option>Canada</option><option>Australia</option><option>Pakistan</option><option>India</option><option>Bangladesh</option><option>Nigeria</option><option>Malaysia</option></select></div></div>
        </div>
        <button type="submit" class="btn btn-primary">Send Money ✈️</button>
      </form>
    </div>
  </div>

  <div id="profile-screen" class="screen">
    <div class="screen-header" style="padding-bottom:0"><div class="back-btn" onclick="Screens.show('home')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></div><div class="screen-title">Profile</div></div>
    <div class="profile-hero"><div class="profile-avatar-big" id="prof-avatar">U</div><div class="profile-name-big" id="prof-name-big">Loading...</div><div class="profile-account-num" id="prof-acct-display">0000 000 000</div></div>
    <div class="info-card">
      <div class="info-row"><div><div class="info-row-label">Full Name</div><div class="info-row-value" id="prof-info-name">—</div></div><div class="edit-icon-btn" onclick="openEditModal('name')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div></div>
      <div class="info-row"><div><div class="info-row-label">Email</div><div class="info-row-value" id="prof-info-email">—</div></div></div>
      <div class="info-row"><div><div class="info-row-label">Username</div><div class="info-row-value" style="font-family:monospace;font-size:14px" id="prof-info-user">—</div></div></div>
      <div class="info-row"><div><div class="info-row-label">Account Number</div><div class="info-row-value" style="font-family:monospace;font-size:14px" id="prof-info-acct">—</div></div><div class="edit-icon-btn" onclick="openEditModal('accountNumber')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div></div>
    </div>
    <div class="info-card" style="margin-bottom:16px">
      <div class="info-row"><div><div class="info-row-label">Balance</div><div class="info-row-value" id="prof-balance">$0.00</div></div></div>
      <div class="info-row"><div><div class="info-row-label">Status</div><div class="info-row-value" style="color:#10b981">● Active & Verified</div></div></div>
    </div>
    <div style="padding:0 20px;margin-bottom:32px"><button class="btn btn-secondary" onclick="handleLogout()" style="display:flex;align-items:center;justify-content:center;gap:10px;color:#ef4444;border-color:rgba(239,68,68,0.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out</button></div>
  </div>

  <div id="bottom-nav">
    <div class="nav-pill">
      <button class="nav-item active" data-screen="home" onclick="Screens.show('home')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></button>
      <button class="nav-item" data-screen="deposit" onclick="Screens.show('deposit')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg><span>Deposit</span></button>
      <button class="nav-item" data-screen="withdraw" onclick="Screens.show('withdraw')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg><span>Withdraw</span></button>
      <button class="nav-item" data-screen="transfer" onclick="Screens.show('transfer')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span>Send</span></button>
      <button class="nav-item" data-screen="profile" onclick="Screens.show('profile')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Profile</span></button>
    </div>
  </div>

  <div id="processing-overlay"><div class="processing-icon"></div><div class="processing-text" id="proc-text">Processing...</div><div class="processing-sub" id="proc-sub">Please wait</div></div>
  <div id="success-overlay"><div class="success-circle"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation:checkDraw 0.4s 0.3s ease forwards;opacity:0"><polyline points="20 6 9 17 4 12"/></svg></div><div class="success-title" id="succ-title">Success!</div><div class="success-msg" id="succ-msg">Transaction completed.</div><button class="btn btn-primary" id="succ-close" style="width:200px">Done</button></div>
  <div id="popup-overlay"><div class="popup-sheet"><div class="popup-indicator"></div><div class="popup-icon" id="popup-icon">⚠️</div><div class="popup-title" id="popup-title">Notice</div><div class="popup-msg" id="popup-msg">Something happened.</div><button class="btn btn-primary" onclick="hidePopup()">Understood</button></div></div>
  <div id="receipt-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:620;display:flex;align-items:flex-end;padding:16px;opacity:0;pointer-events:none;transition:opacity 0.3s"></div>
  <div id="edit-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);z-index:650;display:flex;align-items:flex-end;padding:16px;opacity:0;pointer-events:none;transition:opacity 0.3s">
    <div class="edit-sheet"><div class="edit-sheet-title" id="edit-modal-title">Edit Field</div><div class="input-group"><div class="input-wrap"><svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg><input type="text" id="edit-field-input" placeholder="Enter value"></div></div><div style="display:flex;gap:12px;margin-top:8px"><button class="btn btn-secondary" onclick="document.getElementById('edit-modal').classList.remove('visible')" style="flex:1">Cancel</button><button class="btn btn-primary" onclick="saveEdit()" style="flex:1">Save</button></div></div>
  </div>
  <div id="install-banner">
    <div class="install-icon">${LOGO_SVG}</div>
    <div class="install-text"><div class="install-title">Install Deriv Wallet</div><div class="install-sub">Add to home screen</div></div>
    <div class="install-actions"><button class="install-btn primary" onclick="triggerInstall()">Install</button><button class="install-btn dismiss" onclick="document.getElementById('install-banner').classList.remove('visible')">✕</button></div>
  </div>
</div>`;
}

function init(){
  buildUI();
  State.load();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  if(State.isLoggedIn&&State.user){setTimeout(()=>Screens.show('home'),100);}
  setTimeout(()=>{const s=document.getElementById('splash');if(s){s.classList.add('hide');setTimeout(()=>s.remove(),600);}},3200);
}
document.addEventListener('DOMContentLoaded',init);
