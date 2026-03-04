const btn = document.getElementById("enviar")
const mensaje = document.getElementById("mensaje")
const status = document.getElementById("status")

btn.onclick = async () => {

const lastSend = localStorage.getItem("lastSend")

if(lastSend){
let diff = Date.now() - lastSend

if(diff < 300000){
let remaining = Math.ceil((300000-diff)/1000)
status.innerText = "Espera " + remaining + " segundos"
return
}
}

let texto = mensaje.value.trim()

if(texto.length < 3){
status.innerText="Escribe algo"
return
}

await supabaseClient
.from("mensajes")
.insert([{texto:texto}])

localStorage.setItem("lastSend",Date.now())

mensaje.value=""
status.innerText="Gracias por tu chisme 💅"
}
