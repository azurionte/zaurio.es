const btn = document.getElementById("enviar");
const mensaje = document.getElementById("mensaje");
const status = document.getElementById("status");
const count = document.getElementById("count");

function setStatus(text, tone = "info") {
  status.textContent = text || "";
  status.dataset.tone = tone;

  // trigger anim
  status.classList.remove("pop");
  // reflow
  void status.offsetWidth;
  status.classList.add("pop");
}

function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function vib(pattern) {
  if (canVibrate()) {
    try { navigator.vibrate(pattern); } catch (_) {}
  }
}

// contador
mensaje.addEventListener("input", () => {
  count.textContent = String(mensaje.value.length);
  if (status.textContent) setStatus("", "info");
});

btn.addEventListener("click", async () => {
  const texto = mensaje.value.trim();

  if (!texto) {
    vib(15);
    setStatus("Escribe algo primero 😈", "warn");
    return;
  }

  btn.disabled = true;
  btn.style.opacity = "0.65";
  setStatus("Enviando… 💜", "info");

  const { error } = await supabaseClient
    .from("mensajes")
    .insert([{ texto }]);

  if (error) {
    vib([25, 60, 25]);
    setStatus("❌ No se pudo enviar 😭\n" + error.message, "error");
    btn.disabled = false;
    btn.style.opacity = "1";
    return;
  }

  // éxito
  vib([18, 50, 18]);
  mensaje.value = "";
  count.textContent = "0";

  // confirmación sexy
  const msgs = [
    "💅 Drama recibido. Gracias por alimentar el caos.",
    "✨ Recibido. Puede salir en directo… o no 😏",
    "😈 Enviado. Ahora a esperar el veredicto de Zaurio.",
    "💜 Listo. Tu chisme ya está en la cola."
  ];
  const pick = msgs[Math.floor(Math.random() * msgs.length)];
  setStatus(pick, "ok");

  btn.disabled = false;
  btn.style.opacity = "1";
});
