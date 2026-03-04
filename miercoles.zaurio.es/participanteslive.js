const mount = document.getElementById("mount");
let lastKey = "";
let channel = null;

function esc(s){
  return (s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function clear(){
  mount.innerHTML = "";
}

function render(list){
  if (!list || list.length === 0){
    clear();
    return;
  }

  const now = Date.now(); // bust cache
  mount.innerHTML = list.map(p => {
    const pub = supabaseClient.storage.from("participantes").getPublicUrl(p.foto_path);
    const url = (pub.data?.publicUrl || "") + "?v=" + now;

    return `
      <div class="p">
        <div class="avatarRing">
          <div class="avatarOuter">
            <div class="avatar">
              <img src="${url}" alt="">
            </div>
          </div>
        </div>
        <div class="name">${esc(p.nombre)}</div>
      </div>
    `;
  }).join("");
}

async function loadApproved(){
  const r = await supabaseClient
    .from("participantes")
    .select("id,nombre,foto_path,aprobado_at,creado,estado")
    .eq("estado","aprobado")
    .order("aprobado_at",{ ascending:false, nullsFirst:false })
    .order("creado",{ ascending:false })
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

function setupRealtime(){
  // evita duplicar canales si TikTok recarga raro
  try { if (channel) supabaseClient.removeChannel(channel); } catch(_){}

  channel = supabaseClient
    .channel("rt-participantes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "participantes" },
      () => {
        // cualquier insert/update/delete => refresca lista aprobados
        loadApproved();
      }
    )
    .subscribe();
}

// Init
loadApproved();
setupRealtime();

// Fallback polling por si TikTok “congela” realtime
setInterval(loadApproved, 2000);

// anti-freeze TikTok
setInterval(()=>{ document.getElementById("heartbeat").textContent = Date.now(); }, 500);
