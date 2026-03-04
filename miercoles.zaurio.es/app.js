const btn = document.getElementById("enviar");
const mensaje = document.getElementById("mensaje");
const status = document.getElementById("status");
const count = document.getElementById("count");

const DEV = new URLSearchParams(location.search).get("dev") === "1";
const COOLDOWN_MS = DEV ? 5000 : 300000; // 5s test / 5min real
const KEY = "lastSendAt";

function setStatus(t){ status.textContent = t || ""; }

function remainingSeconds(){
  const last = Number(localStorage.getItem(KEY) || "0");
  if (!last) return 0;
  const diff = Date.now() - last;
  if (diff >= COOLDOWN_MS) return 0;
  return Math.ceil((COOLDOWN_MS - diff) / 1000);
}

function tickCooldown(){
  const r = remainingSeconds();
  if (r > 0){
    btn.disabled = true;
    btn.style.opacity = "0.6";
    setStatus(`⏳ Espera ${r}s para enviar otro`);
  } else {
    btn.disabled = false;
    btn.style.opacity = "1";
    if (status.textContent.startsWith("⏳")) setStatus("");
  }
}

mensaje.addEventListener("input", ()=>{
  count.textContent = String(mensaje.value.length);
});

btn.addEventListener("click", async ()=>{
  tickCooldown();
  if (remainingSeconds() > 0) return;

  const texto = mensaje.value.trim();
  if (!texto){
    setStatus("Escribe algo primero 🙂");
    return;
  }

  setStatus("Enviando…");

  const { error } = await supabaseClient
    .from("mensajes")
    .insert([{ texto, estado: "pendiente" }]);

  if (error){
    // ✅ aquí ahora verás el error real (RLS, key mal, etc.)
    setStatus("❌ Error al enviar:\n" + error.message);
    return;
  }

  localStorage.setItem(KEY, String(Date.now()));
  mensaje.value = "";
  count.textContent = "0";
  setStatus("✅ Gracias por tu mensaje 💅");
  tickCooldown();
});

tickCooldown();
setInterval(tickCooldown, 500);
