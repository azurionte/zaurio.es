const PREPROD_URL = 'https://wsdtcsjkssvdqovdpxrq.supabase.co';
const PREPROD_PUBLISHABLE_KEY = 'sb_publishable_kWc68mbD1KZg9eu38KVEAA_mDARNb-e';

function requireSupabase() {
  if (!globalThis.supabase?.createClient) throw new Error('Supabase client library is not loaded');
  return globalThis.supabase;
}

export function createV3Client() {
  const sdk = requireSupabase();
  return sdk.createClient(PREPROD_URL, PREPROD_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

function camel(row) {
  if (!row) return row;
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    const next = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[next] = value;
  }
  return result;
}

function camelRows(rows) {
  return (rows || []).map(camel);
}

export class SupabaseV3Repository {
  constructor(client = createV3Client()) {
    this.client = client;
  }

  async session() {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async signInWithGoogle(redirectTo = location.href) {
    const { error } = await this.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getPlanForCurrentUser() {
    const session = await this.session();
    if (!session?.user?.id) return null;
    const rows = unwrap(await this.client.from('dz3_plans').select('*').eq('user_id', session.user.id).eq('status', 'active').order('updated_at', { ascending: false }).limit(1));
    return camel(rows?.[0] || null);
  }

  async loadPlanState(planId) {
    const fetch = async (table, column = 'plan_id') => camelRows(unwrap(await this.client.from(table).select('*').eq(column, planId)));
    const [planRow, accounts, recurrenceRules, incomeRules, expenseRules, debts, savingsGoals, eventOverrides, financialEvents, transferRules, transfers, observations] = await Promise.all([
      this.client.from('dz3_plans').select('*').eq('id', planId).single().then(unwrap).then(camel),
      fetch('dz3_accounts'),
      fetch('dz3_recurrence_rules'),
      fetch('dz3_income_rules'),
      fetch('dz3_expense_rules'),
      fetch('dz3_debts'),
      fetch('dz3_savings_goals'),
      fetch('dz3_event_overrides'),
      fetch('dz3_financial_events'),
      fetch('dz3_transfer_rules'),
      fetch('dz3_transfers'),
      fetch('dz3_balance_observations')
    ]);

    const accountIds = accounts.map(row => row.id);
    const debtIds = debts.map(row => row.id);
    const buckets = accountIds.length ? camelRows(unwrap(await this.client.from('dz3_account_buckets').select('*').in('account_id', accountIds))) : [];
    const debtSchedules = debtIds.length ? camelRows(unwrap(await this.client.from('dz3_debt_schedules').select('*').in('debt_id', debtIds))) : [];
    const debtAdjustments = debtIds.length ? camelRows(unwrap(await this.client.from('dz3_debt_adjustments').select('*').in('debt_id', debtIds))) : [];

    return { plan: planRow, accounts, buckets, recurrenceRules, incomeRules, expenseRules, debts, debtSchedules, debtAdjustments, savingsGoals, eventOverrides, financialEvents, transferRules, transfers, observations };
  }

  async saveEventOverride(row) {
    return camel(unwrap(await this.client.from('dz3_event_overrides').upsert(row, { onConflict: 'plan_id,source_type,source_id,original_scheduled_at' }).select().single()));
  }

  async confirmFinancialEvent(row) {
    return camel(unwrap(await this.client.from('dz3_financial_events').insert(row).select().single()));
  }

  async recordTransfer(row) {
    return camel(unwrap(await this.client.from('dz3_transfers').insert(row).select().single()));
  }

  async addBalanceObservation(row) {
    return camel(unwrap(await this.client.from('dz3_balance_observations').insert(row).select().single()));
  }
}
