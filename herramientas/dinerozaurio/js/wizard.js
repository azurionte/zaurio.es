// Lógica para el asistente (wizard) de configuración inicial.

import { supabase, signInWithGoogle } from './state.js';

// Maneja el clic en el botón de inicio de sesión con Google.
const loginBtn = document.getElementById('googleLoginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err);
    }
  });
}

// Comprueba la sesión y muestra el asistente o la app según corresponda.
async function init() {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  toggleUI(session);
  // Escucha los cambios de autenticación para actualizar la interfaz en tiempo real.
  supabase.auth.onAuthStateChange((_event, sessionNow) => {
    toggleUI(sessionNow);
  });
}

// Muestra u oculta las distintas vistas según la sesión y el flujo.
function toggleUI(session) {
  const authGate = document.getElementById('authGate');
  const wizard = document.getElementById('wizard');
  const app = document.getElementById('app');
  if (session) {
    // Ocultar pantalla de login
    authGate.classList.add('hidden');
    // Si aún no se ha completado el wizard, mostrarlo; de lo contrario, mostrar la app principal.
    // Aquí podrías consultar un campo en Supabase que indique si el usuario ya completó su configuración.
    wizard.classList.remove('hidden');
    app.classList.add('hidden');
  } else {
    // Mostrar la pantalla de login
    authGate.classList.remove('hidden');
    wizard.classList.add('hidden');
    app.classList.add('hidden');
  }
}

// Configura el comportamiento del asistente paso a paso.
function setupWizard() {
  const steps = Array.from(document.querySelectorAll('.wizard-step'));
  let currentStep = 0;

  function showStep(index) {
    steps.forEach((step, i) => {
      if (i === index) step.classList.remove('hidden');
      else step.classList.add('hidden');
    });
  }

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  }

  async function finish() {
    // Aquí se podrían guardar los datos introducidos en Supabase y marcar el wizard como completado.
    // Ocultamos el asistente y cargamos la aplicación principal.
    document.getElementById('wizard').classList.add('hidden');
    // Cargamos dinámicamente app.js para inicializar la aplicación solo cuando sea necesario.
    try {
      await import('./app.js');
    } catch (err) {
      console.error('No se pudo cargar app.js:', err);
    }
    document.getElementById('app').classList.remove('hidden');
  }

  // Asignar eventos a botones de cada paso
  const next1 = document.getElementById('next1');
  const next2 = document.getElementById('next2');
  const next3 = document.getElementById('next3');
  const next4 = document.getElementById('next4');
  const finishBtn = document.getElementById('finishWizard');
  const prev2 = document.getElementById('prev2');
  const prev3 = document.getElementById('prev3');
  const prev4 = document.getElementById('prev4');
  const prev5 = document.getElementById('prev5');

  if (next1) next1.addEventListener('click', next);
  if (next2) next2.addEventListener('click', next);
  if (next3) next3.addEventListener('click', next);
  if (next4) next4.addEventListener('click', next);
  if (finishBtn) finishBtn.addEventListener('click', finish);
  if (prev2) prev2.addEventListener('click', prev);
  if (prev3) prev3.addEventListener('click', prev);
  if (prev4) prev4.addEventListener('click', prev);
  if (prev5) prev5.addEventListener('click', prev);

  // Mostrar la primera vista inicialmente
  showStep(currentStep);
}

// Cuando el DOM esté listo, inicializar el wizard y la comprobación de sesión
document.addEventListener('DOMContentLoaded', () => {
  setupWizard();
  init();
});
