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

function clear(){
  mount.innerHTML = ""; // ← si no hay nada, NO se ve nada
}

function render(list){
  if (!list || list.length === 0){
    clear();
    return;
  }

  mount.innerHTML = list.map(p => {
    const pub = supabaseClient.storage.from("participantes").getPublicUrl(p.foto_path);
    const url = (pub.data?.publicUrl || "") + "?v=" + Date.now(); // bust cache TikTok
    return `
      <div class="p">
        <div class="avatar"><img src="${url}" alt=""></div>
        <div class="name">${esc(p.nombre)}</div>
      </div>
    `;
  }).join("");
}

async function tick(){
  const r = await supabaseClient
    .from("participantes")
    .select("id,nombre,foto_path,aprobado_at,creado,estado")
    .eq("estado","aprobado")
    .order("aprobado_at",{ascending:false, nullsFirst:false})
    .order("creado",{ascending:false})
    .limit(5);

  if (r.error){
    clear();
    return;
  }

  const data = r.data || [];
  const key = data.map(x => x.id).join("|");
  if (key === lastKey) return;
  lastKey = key;

  render(data);
}

tick();
setInterval(tick, 1000);

// anti-freeze TikTok
setInterval(()=>{ document.getElementById("heartbeat").textContent = Date.now(); }, 500);
