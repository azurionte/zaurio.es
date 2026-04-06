// Auto-save listeners para campos críticos de configuración
import { state } from './utils.js';
import { updateInitialReserve, updateDefaultStartMonth, updatePaymentMethod } from './ui.js';

const $ = (s) => document.querySelector(s);

export function setupAutoSaveListeners() {
  const initialReserveInput = $('#initialReserve');
  const defaultStartInput = $('#defaultStart');
  const paymentMethodSelect = $('#paymentMethod');
  
  // Usar debounce de 1 segundo para evitar múltiples saves simultáneos
  let initialReserveSaveTimeout, defaultStartSaveTimeout, paymentMethodSaveTimeout;
  
  // Auto-save: Colchón (initialReserve)
  if (initialReserveInput) {
    initialReserveInput.addEventListener('blur', async () => {
      try {
        const oldValue = state.plan.initial_reserve;
        const newValue = Number(initialReserveInput.value || 0);
        
        if (oldValue !== newValue) {
          console.log(`📊 Guardando colchón: ${oldValue} → ${newValue}€`);
          await updateInitialReserve(newValue);
          console.log('✅ Colchón guardado exitosamente');
        }
      } catch (err) {
        console.error('❌ Error al guardar colchón:', err);
        // Restaurar el valor anterior en caso de error
        initialReserveInput.value = state.plan.initial_reserve ?? 0;
        alert('Error al guardar el colchón. Por favor intenta de nuevo.');
      }
    });
    
    // También guardar con debounce mientras escribe (cada 1 segundo de inactividad)
    initialReserveInput.addEventListener('input', () => {
      clearTimeout(initialReserveSaveTimeout);
      initialReserveSaveTimeout = setTimeout(async () => {
        try {
          const newValue = Number(initialReserveInput.value || 0);
          if (state.plan.initial_reserve !== newValue) {
            await updateInitialReserve(newValue);
            console.log('💾 Colchón guardado automáticamente');
          }
        } catch (err) {
          console.error('Error en auto-save de colchón:', err);
        }
      }, 1000);
    });
  }
  
  // Auto-save: Mes por defecto
  if (defaultStartInput) {
    defaultStartInput.addEventListener('change', async () => {
      try {
        const newMonth = defaultStartInput.value;
        
        if (newMonth && state.plan.default_start_month !== newMonth) {
          console.log(`📅 Guardando mes por defecto: ${state.plan.default_start_month} → ${newMonth}`);
          await updateDefaultStartMonth(newMonth);
          console.log('✅ Mes por defecto guardado exitosamente');
        }
      } catch (err) {
        console.error('❌ Error al guardar mes por defecto:', err);
        defaultStartInput.value = state.plan.default_start_month;
        alert('Error al guardar el mes por defecto. Por favor intenta de nuevo.');
      }
    });
  }
  
  // Auto-save: Método de pago
  if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener('change', async () => {
      try {
        const newMethod = paymentMethodSelect.value;
        
        if (newMethod && state.plan.payment_method !== newMethod) {
          console.log(`💳 Guardando método de pago: ${state.plan.payment_method} → ${newMethod}`);
          await updatePaymentMethod(newMethod);
          console.log('✅ Método de pago guardado exitosamente');
        }
      } catch (err) {
        console.error('❌ Error al guardar método de pago:', err);
        paymentMethodSelect.value = state.plan.payment_method || 'reserve';
        alert('Error al guardar el método de pago. Por favor intenta de nuevo.');
      }
    });
  }
  
  console.log('✅ Auto-save listeners configurados');
}

// Renderizar el método de pago seleccionado
export function renderPaymentMethod() {
  const paymentMethodSelect = $('#paymentMethod');
  if (paymentMethodSelect && state.plan) {
    paymentMethodSelect.value = state.plan.payment_method || 'reserve';
  }
}

// Inicializar al cargar
export function initAutoSave() {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAutoSaveListeners();
      renderPaymentMethod();
    });
  } else {
    setupAutoSaveListeners();
    renderPaymentMethod();
  }
}
