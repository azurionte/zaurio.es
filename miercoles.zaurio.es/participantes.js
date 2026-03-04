const inpNombre = document.getElementById("nombre");
const inpFoto = document.getElementById("foto");
const btn = document.getElementById("enviar");
const status = document.getElementById("status");
const previewBox = document.getElementById("previewBox");

function setStatus(t){
  status.textContent = t || "";
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
    setStatus("Escribe tu nombre 😈");
    return;
  }
  if (!selectedFile){
    vib(15);
    setStatus("Sube una foto 📸");
    return;
  }

  btn.disabled = true;
  btn.style.opacity = "0.65";
  setStatus("Subiendo… 💜");

  try{
    // 1) Subir a Supabase Storage
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
      setStatus("❌ Error subiendo imagen:\n" + up.error.message);
      btn.disabled = false;
      btn.style.opacity = "1";
      return;
    }

    // 2) Insertar fila en tabla
    const ins = await supabaseClient
      .from("participantes")
      .insert([{ nombre, foto_path: fileName }]);

    if (ins.error){
      vib([25,60,25]);
      setStatus("❌ Error guardando participante:\n" + ins.error.message);
      btn.disabled = false;
      btn.style.opacity = "1";
      return;
    }

    vib([18,50,18]);
    setStatus("✅ Listo. Podrías aparecer en el directo 👑");

    // limpiar
    inpNombre.value = "";
    inpFoto.value = "";
    selectedFile = null;
    previewBox.innerHTML = `<span class="hint">Preview</span>`;

  } catch(e){
    vib([25,60,25]);
    setStatus("❌ Error:\n" + (e?.message || e));
  }

  btn.disabled = false;
  btn.style.opacity = "1";
});
