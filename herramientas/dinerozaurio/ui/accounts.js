(()=>{'use strict';
const V='accounts-ui-7';
const build=window.__DINEROZAURIO_VERSION__?.build||'recovery';
const scripts=[
  `./folder-mode-summary-v2.js?v=${build}`,
  `./folder-mode-enhancements-v3.js?v=${build}`,
  `./folder-mode-fixes-v4.js?v=${build}`,
  `./ui-fixes-v5.js?v=${build}`,
  `./account-routing-current.js?v=${build}`
];
function finish(){window.__DZ_VISUAL_STACK_INSTALLED__='5c029-canonical-1';const reveal=()=>{if(window.__DZ_ACCOUNT_OBSERVED_ADAPTER__!=='canonical-account-ux-5c029-1')return setTimeout(reveal,30);window.__DZ_ACCOUNTS_UI__=V;window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__='accounting-core-2';window.__DINEROZAURIO_ROUTING_AUTHORITY__='accounting-core-2';delete window.__DINEROZAURIO_ACCOUNT_DISPLAY_AUTHORITY__;window.__DINEROZAURIO_UI_PATCHES_READY__=true;document.documentElement.classList.remove('dz-accounting-loading');if(typeof renderHomeDashboard==='function'&&document.getElementById('homeDashboard'))renderHomeDashboard();};reveal();}
function load(i=0){if(i>=scripts.length){if(document.readyState==='complete')finish();else window.addEventListener('load',finish,{once:true});return;}const s=document.createElement('script');s.src=scripts[i];s.async=false;s.onload=()=>load(i+1);s.onerror=()=>console.error('DineroZaurio recovery: no se pudo cargar',scripts[i]);document.head.appendChild(s);}
load();
})();