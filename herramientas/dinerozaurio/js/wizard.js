// Lógica para el asistente (wizard) de configuración inicial.

// Importamos supabase y la función de login desde state.js
import { supabase, signInWithGoogle } from './state.js';
// Importamos funciones de ui.js para gestionar perfil, plan e inserción de datos
import {
  ensureProfile,
  loadOrCreateDefaultPlan,
  upsertIncome,
  upsertDebt,
  loadPlanData
} from './ui.js';

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
  const { data: { session } } = await supabase.auth.getSession();
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
  const splash = document.getElementById('splash');
  if (session) {
    // Ocultar pantalla de login
    authGate.classList.add('hidden');
    // Mostrar splash de bienvenida la primera vez
    if (!window.__zaurioSplashShown) {
      showSplash(session);
    } else {
      // Si el splash ya se mostró, ir al asistente directamente
      wizard.classList.remove('hidden');
      app.classList.add('hidden');
    }
  } else {
    // Mostrar la pantalla de login y ocultar las demás vistas
    authGate.classList.remove('hidden');
    wizard.classList.add('hidden');
    app.classList.add('hidden');
    if (splash) splash.classList.add('hidden');
  }
}

// Muestra la pantalla de bienvenida con el nombre del usuario durante unos segundos
function showSplash(session) {
  const splash = document.getElementById('splash');
  const wizard = document.getElementById('wizard');
  const app = document.getElementById('app');
  if (!splash) return;
  // Obtener el nombre del usuario (o email si no hay nombre)
  const meta = session?.user?.user_metadata || {};
  const fullName = meta.full_name || meta.name || session.user.email || '';
  const firstName = fullName.split(' ')[0] || fullName;
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) {
    welcomeMsg.textContent = `¡Bienvenid@ ${firstName}!`;
  }
  // Mostrar el splash
  splash.classList.remove('hidden');
  window.__zaurioSplashShown = true;
  // Ocultarlo tras 2 segundos y mostrar el asistente
  setTimeout(() => {
    splash.classList.add('hidden');
    wizard.classList.remove('hidden');
    app.classList.add('hidden');
  }, 2000);
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
    // Guardar datos introducidos en Supabase y cargar la app
    try {
      // Sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');
      // Perfil y plan por defecto
      await ensureProfile(session.user);
      const plan = await loadOrCreateDefaultPlan(session.user.id);
      // Guardar ingresos introducidos
      for (const inc of incomes) {
      if (!inc.name && !inc.amount) continue;
        const row = {
          id: crypto.randomUUID(),
          name: inc.name || 'Ingreso',
          amount: Number(inc.amount || 0),
          periodicity: 'monthly',
          start_month: plan.default_start_month,
          end_month: null
        };
        await upsertIncome(row);
      }
      // Guardar deudas introducidas
      for (const d of debts) {
        if (!d.name && !d.amount) continue;
        const row = {
          id: crypto.randomUUID(),
          name: d.name || 'Deuda',
          start_month: plan.default_start_month,
          debt_type: d.type === 'loan' ? 'loan' : 'card'
        };
        if (d.type === 'loan') {
          row.monthly_payment = Number(d.amount || 0);
          row.end_mode = 'remaining';
          row.remaining_installments = 0;
        } else {
          row.card_type = 'pay_end_month';
          row.amount = Number(d.amount || 0);
          row.periodicity = 'monthly';
        }
        await upsertDebt(row);
      }
      // Recargar datos del plan en el estado global
      await loadPlanData(plan.id);
      // Ocultar asistente
      document.getElementById('wizard').classList.add('hidden');
      // Cargar dinámicamente la aplicación principal
      const appModule = await import('./app.js');
      document.getElementById('app').classList.remove('hidden');
      // Configurar la UI y renderizar si existen estas funciones
      if (appModule.setAuthUI) {
        appModule.setAuthUI(session);
      }
      if (appModule.renderAll) {
        appModule.renderAll();
      }
    } catch (err) {
      console.error('Error al finalizar el asistente:', err);
      alert('Hubo un error guardando tu configuración: ' + err.message);
    }
  }

  // Asociar los botones de navegación
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

  // Mostrar la primera vista
  showStep(currentStep);
  // Inicializar las listas de ingresos y deudas
  initDynamicLists();
}

// Arrays que almacenan los ingresos y deudas introducidos
const incomes = [];
const debts = [];

// Configura los botones de añadir ingresos y deudas y crea las primeras filas
function initDynamicLists() {
  const addIncomeBtn = document.getElementById('addIncomeBtn');
  if (addIncomeBtn) {
    addIncomeBtn.addEventListener('click', () => {
      addIncomeRow();
    });
  }
  const addDebtBtn = document.getElementById('addDebtBtn');
  if (addDebtBtn) {
    addDebtBtn.addEventListener('click', () => {
      addDebtRow();
    });
  }
  // Crear fila por defecto si hay contenedores
  if (document.getElementById('incomeList')) {
    addIncomeRow();
  }
  if (document.getElementById('debtList')) {
    addDebtRow();
  }
}

// Añade una fila de ingreso vacía y vuelve a renderizar la lista
function addIncomeRow() {
  const id = crypto.randomUUID();
  incomes.push({ id, name: '', amount: 0 });
  renderIncomeList();
}

// Elimina una fila de ingreso por id y vuelve a renderizar
function removeIncomeRow(id) {
  const idx = incomes.findIndex(i => i.id === id);
  if (idx >= 0) incomes.splice(idx, 1);
  renderIncomeList();
}

// Genera el DOM de la lista de ingresos
function renderIncomeList() {
  const container = document.getElementById('incomeList');
  if (!container) return;
  container.innerHTML = '';
  incomes.forEach((income) => {
    const row = document.createElement('div');
    row.className = 'income-row';
    row.dataset.id = income.id;
    row.innerHTML = `
      <input type="text" placeholder="Nombre" value="${income.name}" class="input" data-key="name">
      <input type="number" placeholder="Cantidad €" value="${income.amount}" class="input" data-key="amount" step="0.01">
      <button class="btn danger" data-action="remove">×</button>
    `;
    // Actualiza el nombre y la cantidad al escribir
    row.querySelector('[data-key="name"]').addEventListener('input', (e) => {
      const itm = incomes.find(x => x.id === income.id);
      if (itm) itm.name = e.target.value;
    });
    row.querySelector('[data-key="amount"]').addEventListener('input', (e) => {
      const itm = incomes.find(x => x.id === income.id);
      if (itm) itm.amount = Number(e.target.value);
    });
    // Botón de eliminar
    row.querySelector('[data-action="remove"]').addEventListener('click', () => {
      removeIncomeRow(income.id);
    });
    container.appendChild(row);
  });
}

// Añade una fila de deuda vacía y vuelve a renderizar la lista
function addDebtRow() {
  const id = crypto.randomUUID();
  debts.push({ id, name: '', type: 'loan', amount: 0 });
  renderDebtList();
}

// Elimina una fila de deuda por id y vuelve a renderizar
function removeDebtRow(id) {
  const idx = debts.findIndex(i => i.id === id);
  if (idx >= 0) debts.splice(idx, 1);
  renderDebtList();
}

// Genera el DOM de la lista de deudas
function renderDebtList() {
  const container = document.getElementById('debtList');
  if (!container) return;
  container.innerHTML = '';
  debts.forEach((debt) => {
    const row = document.createElement('div');
    row.className = 'debt-row income-row';
    row.dataset.id = debt.id;
    row.innerHTML = `
      <input type="text" placeholder="Entidad" value="${debt.name}" class="input" data-key="name">
      <select class="input" data-key="type">
        <option value="loan" ${debt.type === 'loan' ? 'selected' : ''}>Préstamo</option>
        <option value="card" ${debt.type === 'card' ? 'selected' : ''}>Tarjeta</option>
      </select>
      <input type="number" placeholder="Monto €" value="${debt.amount}" class="input" data-key="amount" step="0.01">
      <button class="btn danger" data-action="remove">×</button>
    `;
    // Actualiza nombre, tipo y monto de la deuda al cambiar
    row.querySelector('[data-key="name"]').addEventListener('input', (e) => {
      const itm = debts.find(x => x.id === debt.id);
      if (itm) itm.name = e.target.value;
    });
    row.querySelector('[data-key="type"]').addEventListener('change', (e) => {
      const itm = debts.find(x => x.id === debt.id);
      if (itm) itm.type = e.target.value;
    });
    row.querySelector('[data-key="amount"]').addEventListener('input', (e) => {
      const itm = debts.find(x => x.id === debt.id);
      if (itm) itm.amount = Number(e.target.value);
    });
    // Botón de eliminar
    row.querySelector('[data-action="remove"]').addEventListener('click', () => {
      removeDebtRow(debt.id);
    });
    container.appendChild(row);
  });
}

// Al cargar el DOM, inicializa el wizard y la comprobación de sesión
document.addEventListener('DOMContentLoaded', () => {
  setupWizard();
  init();
});
