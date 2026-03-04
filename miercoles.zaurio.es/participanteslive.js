const mount = document.getElementById("mount");
let lastKey = "";

function esc(s){
  return (s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderEmpty(){
  mount.innerHTML = `
    <div class="empty pop">👑 Esperando participante…</div>
  `;
}

function renderOne(nombre, publicUrl){
  mount.innerHTML = `
    <div class="avatarWrap pop">
      <img src="${publicUrl}" alt="">
    </div>
    <div class="name pop">${esc(nombre)}</div>
  `;
}

async function tick(){
  // trae el último
  const r = await supabaseClient
    .from("participantes")
    .select("id,nombre,foto_path,creado")
    .order("creado", { ascending:false })
    .limit(1);

  if (r.error){
    // no muestro error feo en stream, dejo empty
    renderEmpty();
    return;
  }

  if (!r.data || r.data.length === 0){
    lastKey = "EMPTY";
    renderEmpty();
    return;
  }

  const p = r.data[0];
  const key = `${p.id}:${p.foto_path}:${p.nombre}`;

  if (key === lastKey) return;
  lastKey = key;

  const pub = supabaseClient
    .storage
    .from("participantes")
    .getPublicUrl(p.foto_path);

  const url = pub.data?.publicUrl || "";
  renderOne(p.nombre, url + "?v=" + Date.now()); // bust cache para TikTok
}

tick();
setInterval(tick, 1000);

// anti-freeze
setInterval(()=>{ document.getElementById("heartbeat").textContent = Date.now(); }, 500);
