const inpNombre = document.getElementById("nombre");
const inpFoto = document.getElementById("foto");
const btn = document.getElementById("enviar");
const status = document.getElementById("status");
const previewBox = document.getElementById("previewBox");

function setStatus(t, tone="ok"){
  status.textContent = t || "";
  status.dataset.tone = tone;
}

function canVibrate(){
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}
function vib(p){
  if (canVibrate()) { try { navigator.vibrate(p); } catch(_){} }
}

let selectedFile = null;

inpFoto.addEventListener("change", () => {
  const f = inpFoto.files && inpFoto.files[0];
  selectedFile = f || null;

  previewBox.innerHTML = "";
  if (!selectedFile){
    previewBox.innerHTML = `<span class="hint">Preview</span>`;
    return;
  }
  const img = document.createElement("img");
  img.alt = "preview";
  img.src = URL.createObjectURL(selectedFile);
  previewBox.appendChild(img);
});

btn.addEventListener("click", async () => {
  const nombre = (inpNombre.value || "").trim();

  if (!nombre){
    vib(15);
    setStatus("Escribe tu nombre 😈","warn");
    return;
  }
  if (!selectedFile){
    vib(15);
    setStatus("Sube una foto 📸","warn");
    return;
  }

  btn.disabled = true;
  btn.style.opacity = "0.65";
  setStatus("Subiendo… 💜","info");

  try{
    const ext = (selectedFile.name.split(".").pop() || "png").toLowerCase();
    const safeExt = ["png","jpg","jpeg","webp"].includes(ext) ? ext : "png";
    const fileName = `${crypto.randomUUID()}.${safeExt}`;

    const up = await supabaseClient.storage
      .from("participantes")
      .upload(fileName, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedFile.type || "image/png"
      });

    if (up.error){
      vib([25,60,25]);
      setStatus("❌ Error subiendo imagen:\n" + up.error.message,"error");
      btn.disabled = false;
      btn.style.opacity = "1";
      return;
    }

    const ins = await supabaseClient
      .from("participantes")
      .insert([{ nombre, foto_path: fileName, estado: "pendiente" }]);

    if (ins.error){
      vib([25,60,25]);
      setStatus("❌ Error guardando:\n" + ins.error.message,"error");
      btn.disabled = false;
      btn.style.opacity = "1";
      return;
    }

    vib([18,50,18]);
    setStatus("✅ Listo. Estás en cola. Zaurio te aprueba en directo 👑","ok");

    inpNombre.value = "";
    inpFoto.value = "";
    selectedFile = null;
    previewBox.innerHTML = `<span class="hint">Preview</span>`;

  } catch(e){
    vib([25,60,25]);
    setStatus("❌ Error:\n" + (e?.message || e),"error");
  }

  btn.disabled = false;
  btn.style.opacity = "1";
});
