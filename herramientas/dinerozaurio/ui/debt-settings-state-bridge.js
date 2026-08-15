(()=>{'use strict';
function bridge(){
  if(typeof state==='undefined') return setTimeout(bridge,80);
  if(!window.state) window.state=state;
}
bridge();
})();
