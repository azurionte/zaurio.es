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
    const ins = await supabase.from('plans')
      .insert({
        user_id: userId,
        name: 'Plan principal',
        initial_reserve: 0,
        default_start_month: ymNow()
      })
      .select()
      .single();
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

// Guarda los metadatos del plan (nombre, reserva inicial, mes de inicio)
export async function savePlanMeta() {
  return supabase
    .from('plans')
    .update({
      name: state.plan.name,
      initial_reserve: state.plan.initial_reserve,
      default_start_month: state.plan.default_start_month
    })
    .eq('id', state.plan.id);
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
