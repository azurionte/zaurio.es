const btn = document.getElementById("enviar");
const mensaje = document.getElementById("mensaje");
const status = document.getElementById("status");
const count = document.getElementById("count");

function setStatus(t){
  status.textContent = t || "";
}

mensaje.addEventListener("input", ()=>{
  count.textContent = String(mensaje.value.length);
});

btn.addEventListener("click", async ()=>{

  const texto = mensaje.value.trim();

  if (!texto){
    setStatus("Escribe algo primero 🙂");
    return;
  }

  btn.disabled = true;
  btn.style.opacity = "0.6";

  setStatus("Enviando…");

  const { error } = await supabaseClient
    .from("mensajes")
    .insert([
      {
        texto: texto,
        estado: "pendiente"
      }
    ]);

  if (error){
    setStatus("❌ Error al enviar:\n" + error.message);
    btn.disabled = false;
    btn.style.opacity = "1";
    return;
  }

  mensaje.value = "";
  count.textContent = "0";

  setStatus("✅ Gracias por tu mensaje 💅");

  btn.disabled = false;
  btn.style.opacity = "1";

});
