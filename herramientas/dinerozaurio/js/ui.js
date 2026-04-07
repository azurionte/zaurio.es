// Importa la instancia de Supabase desde state.js
import { supabase } from './state.js';
// Importa el estado global (plan, ingresos, etc.) desde utils.js
import { state } from './utils.js';
// Importa ymNow desde forecast.js (utils.js no lo exporta)
import { ymNow } from './forecast.js';

// Crea o actualiza el perfil del usuario en Supabase
export async function ensureProfile(user) {
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatar_url: user.user_metadata?.avatar_url || null
  });
}

// Carga el plan por defecto del usuario o lo crea si no existe
function isMissingPlansColumnError(error, column) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes(`could not find the '${column}' column of 'plans'`) ||
    message.includes(`column \"${column}\" of relation \"plans\" does not exist`);
}

export async function loadOrCreateDefaultPlan(userId) {
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;

  let plan = plans?.[0];
  if (!plan) {
    let ins = await supabase.from('plans')
      .insert({
        user_id: userId,
        name: 'Plan principal',
        initial_reserve: 0,
        default_start_month: ymNow(),
        payment_method: 'reserve'
      })
      .select()
      .single();

    if (ins.error && isMissingPlansColumnError(ins.error, 'payment_method')) {
      ins = await supabase.from('plans')
        .insert({
          user_id: userId,
          name: 'Plan principal',
          initial_reserve: 0,
          default_start_month: ymNow()
        })
        .select()
        .single();
    }

    if (ins.error) throw ins.error;
    plan = ins.data;
  }

  // Guarda el plan y ajusta el rango de previsión en el estado global
  state.plan = plan;
  state.forecast.from = state.forecast.from || plan.default_start_month || ymNow();
  state.forecast.to = state.forecast.to || plan.default_start_month || ymNow();
  return plan;
}

// Carga todos los datos asociados a un plan (ingresos, gastos, deudas, objetivos, ajustes)
export async function loadPlanData(planId) {
  const [incomes, expenses, debts, goals, adjustments] = await Promise.all([
    supabase.from('income_items').select('*').eq('plan_id', planId).order('created_at'),
    supabase.from('expense_items').select('*').eq('plan_id', planId).order('created_at'),
    supabase.from('debt_items').select('*').eq('plan_id', planId).order('created_at'),
    supabase.from('savings_goals').select('*').eq('plan_id', planId).order('created_at'),
    supabase.from('month_adjustments').select('*').eq('plan_id', planId).order('month_key')
  ]);

  if (incomes.error) throw incomes.error;
  if (expenses.error) throw expenses.error;
  if (debts.error) throw debts.error;
  if (goals.error) throw goals.error;
  if (adjustments.error) throw adjustments.error;

  state.incomes = incomes.data || [];
  state.expenses = expenses.data || [];
  state.debts = debts.data || [];
  state.goals = goals.data || [];
  state.adjustments = {};

  for (const row of adjustments.data || []) {
    state.adjustments[row.month_key] = {
      id: row.id,
      extra_incomes: row.extra_incomes || [],
      extra_expenses: row.extra_expenses || [],
      savings_adds: row.savings_adds || [],
      debt_actions: row.debt_actions || []
    };
  }
}

// Guarda los metadatos del plan (nombre, reserva inicial, mes de inicio, método de pago)
export async function savePlanMeta() {
  let result = await supabase
    .from('plans')
    .update({
      name: state.plan.name,
      initial_reserve: state.plan.initial_reserve,
      default_start_month: state.plan.default_start_month,
      payment_method: state.plan.payment_method || 'reserve'
    })
    .eq('id', state.plan.id)
    .select()
    .single();

  if (result.error && isMissingPlansColumnError(result.error, 'payment_method')) {
    result = await supabase
      .from('plans')
      .update({
        name: state.plan.name,
        initial_reserve: state.plan.initial_reserve,
        default_start_month: state.plan.default_start_month
      })
      .eq('id', state.plan.id)
      .select()
      .single();
  }

  if (result.error) {
    console.error('Error guardando metadatos del plan:', result.error);
    throw result.error;
  }
  
  state.plan = { ...state.plan, ...result.data };
  return result.data;
}

// Actualiza solo el método de pago
export async function updatePaymentMethod(method) {
  if (!['reserve', 'credit_card'].includes(method)) {
    throw new Error('Método de pago inválido. Debe ser "reserve" o "credit_card"');
  }
  
  state.plan.payment_method = method;
  
  let result = await supabase
    .from('plans')
    .update({ payment_method: method })
    .eq('id', state.plan.id)
    .select()
    .single();

  if (result.error && isMissingPlansColumnError(result.error, 'payment_method')) {
    console.warn('El campo payment_method no existe en la tabla plans; se conservará en el estado local.');
    return state.plan;
  }
  
  if (result.error) {
    console.error('Error actualizando método de pago:', result.error);
    throw result.error;
  }
  
  state.plan = { ...state.plan, ...result.data };
  return result.data;
}

// Actualiza solo el mes por defecto y persiste en BD
export async function updateDefaultStartMonth(month) {
  state.plan.default_start_month = month;
  state.forecast.from = month;
  state.forecast.to = month;
  
  const { data, error } = await supabase
    .from('plans')
    .update({ default_start_month: month })
    .eq('id', state.plan.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error actualizando mes por defecto:', error);
    throw error;
  }
  
  state.plan = { ...state.plan, ...data };
  return data;
}

// Actualiza solo la reserva inicial (colchón) y persiste en BD
export async function updateInitialReserve(amount) {
  const numAmount = Number(amount || 0);
  state.plan.initial_reserve = numAmount;
  
  const { data, error } = await supabase
    .from('plans')
    .update({ initial_reserve: numAmount })
    .eq('id', state.plan.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error actualizando reserva inicial:', error);
    throw error;
  }
  
  state.plan = { ...state.plan, ...data };
  return data;
}

// Función genérica para upsert en cualquier tabla del plan
async function upsert(table, item) {
  const payload = { ...item, plan_id: state.plan.id };
  const { data, error } = await supabase
    .from(table)
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Inserta o actualiza ingresos, gastos, deudas y objetivos
export const upsertIncome  = (item) => upsert('income_items', item);
export const upsertExpense = (item) => upsert('expense_items', item);
export const upsertDebt    = (item) => upsert('debt_items', item);
export const upsertGoal    = (item) => upsert('savings_goals', item);

// Elimina elementos individuales por id
export async function deleteIncome(id) {
  const { error } = await supabase.from('income_items').delete().eq('id', id);
  if (error) throw error;
}
export async function deleteExpense(id) {
  const { error } = await supabase.from('expense_items').delete().eq('id', id);
  if (error) throw error;
}
export async function deleteDebt(id) {
  const { error } = await supabase.from('debt_items').delete().eq('id', id);
  if (error) throw error;
}
export async function deleteGoal(id) {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw error;
}

// Inserta o actualiza ajustes mensuales
export async function upsertAdjustment(monthKey, payload) {
  const row = {
    month_key: monthKey,
    plan_id: state.plan.id,
    extra_incomes: payload.extra_incomes || [],
    extra_expenses: payload.extra_expenses || [],
    savings_adds: payload.savings_adds || [],
    debt_actions: payload.debt_actions || []
  };
  const { data, error } = await supabase
    .from('month_adjustments')
    .upsert(row, { onConflict: 'plan_id,month_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
