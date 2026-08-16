(() => {
  'use strict';

  const PREPROD_URL = 'https://wsdtcsjkssvdqovdpxrq.supabase.co';
  const PREPROD_KEY = 'sb_publishable_kWc68mbD1KZg9eu38KVEAA_mDARNb-e';
  const ALLOWED_EMAIL = 'dmnrobles@gmail.com';
  const PROD_URL = 'https://dinerozaurio.zaurio.es';

  window.__DINEROZAURIO_ENV__ = 'preprod';
  window.__DINEROZAURIO_PREPROD__ = true;

  const style = document.createElement('style');
  style.textContent = `
    #dzPreprodGate{
      position:fixed;inset:0;z-index:2147483647;
      display:grid;place-items:center;padding:20px;
      background:radial-gradient(circle at top,#2a0046 0%,#12001d 38%,#000 100%);
      color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif
    }
    #dzPreprodGate .card{
      width:min(440px,100%);padding:28px;border-radius:24px;
      background:rgba(20,13,42,.94);border:1px solid rgba(255,255,255,.12);
      box-shadow:0 24px 70px rgba(0,0,0,.45)
    }
    #dzPreprodGate .pill{
      display:inline-flex;padding:6px 10px;border-radius:999px;
      background:rgba(255,0,170,.13);border:1px solid rgba(255,0,170,.28);
      color:#ffc2e9;font-size:11px;font-weight:900;letter-spacing:.08em
    }
    #dzPreprodGate h1{margin:14px 0 6px;font-size:25px}
    #dzPreprodGate p{margin:0 0 18px;color:rgba(255,255,255,.65);line-height:1.5}
    #dzPreprodGate input{
      width:100%;box-sizing:border-box;padding:13px 14px;border-radius:13px;
      border:1px solid rgba(255,255,255,.12);background:#0a1128;color:#fff;
      font:inherit;outline:none
    }
    #dzPreprodGate button{
      width:100%;margin-top:12px;padding:13px 16px;border:0;border-radius:999px;
      background:linear-gradient(135deg,#ff00aa,#ff4cc6);color:#fff;
      font-weight:900;cursor:pointer
    }
    #dzPreprodGate .status{min-height:20px;margin-top:12px;font-size:13px;color:#9fe8f5}
    .dzPreprodBadge{
      position:fixed;left:12px;bottom:12px;z-index:999999;
      padding:7px 10px;border-radius:999px;background:#ff00aa;color:white;
      font:900 10px/1 Inter,system-ui,sans-serif;letter-spacing:.08em;
      box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none
    }
  `;
  document.head.appendChild(style);

  const addBadge = () => {
    if (document.querySelector('.dzPreprodBadge')) return;
    const badge = document.createElement('div');
    badge.className = 'dzPreprodBadge';
    badge.textContent = 'PREPROD';
    document.body.appendChild(badge);
  };

  async function start() {
    if (!window.supabase?.createClient) {
      setTimeout(start, 40);
      return;
    }

    const auth = window.supabase.createClient(PREPROD_URL, PREPROD_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const { data: { session } } = await auth.auth.getSession();

    if (session?.user?.email) {
      if (session.user.email.toLowerCase() !== ALLOWED_EMAIL) {
        await auth.auth.signOut();
        location.replace(PROD_URL);
        return;
      }
      addBadge();
      return;
    }

    const gate = document.createElement('div');
    gate.id = 'dzPreprodGate';
    gate.innerHTML = `
      <div class="card">
        <span class="pill">DINEROZAURIO · PREPROD</span>
        <h1>Entrar en preproduccion</h1>
        <p>Este entorno esta reservado para pruebas. Introduce tu email y te enviaremos un enlace de acceso.</p>
        <form id="dzPreprodLogin">
          <input id="dzPreprodEmail" type="email" autocomplete="email" placeholder="tu@email.com" required>
          <button type="submit">Enviar enlace de acceso</button>
          <div class="status" id="dzPreprodStatus"></div>
        </form>
      </div>`;
    document.body.appendChild(gate);

    const form = gate.querySelector('#dzPreprodLogin');
    const emailInput = gate.querySelector('#dzPreprodEmail');
    const status = gate.querySelector('#dzPreprodStatus');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim().toLowerCase();

      if (email !== ALLOWED_EMAIL) {
        location.replace(PROD_URL);
        return;
      }

      status.textContent = 'Enviando enlace...';
      const { error } = await auth.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `https://${location.host}${location.pathname}`,
          shouldCreateUser: true
        }
      });

      status.textContent = error
        ? `No se pudo enviar: ${error.message}`
        : 'Revisa tu correo. Al abrir el enlace volveras a PREPROD.';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
