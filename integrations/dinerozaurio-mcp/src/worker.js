const SERVER_NAME = 'dinerozaurio-finance';
const SERVER_VERSION = '0.2.0';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

const TOOLS = [
  {
    name: 'get_financial_overview',
    description: 'Get the authenticated user\'s DineroZaurio financial overview for a month, including recurring income, expenses, debt payments, savings goals and margin.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: 'Month in YYYY-MM format. Defaults to the current month in the configured finance timezone.',
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_incomes',
    description: 'List income items in the authenticated user\'s active DineroZaurio plan.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_expenses',
    description: 'List expense items in the authenticated user\'s active DineroZaurio plan.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_debts',
    description: 'List debts and credit-card obligations in the authenticated user\'s active DineroZaurio plan.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_savings_goals',
    description: 'List savings goals in the authenticated user\'s active DineroZaurio plan.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_month_adjustments',
    description: 'List month-specific adjustments in the authenticated user\'s active DineroZaurio plan. Optionally filter by month.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATIONS
  }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ ok: true, service: SERVER_NAME, version: SERVER_VERSION });
    }

    if (url.pathname === '/.well-known/oauth-protected-resource' || url.pathname === '/.well-known/oauth-protected-resource/mcp') {
      return protectedResourceMetadata(url, env);
    }

    if (url.pathname !== '/mcp') {
      return json({ error: 'Not found' }, 404);
    }

    if (request.method !== 'POST') {
      return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    }

    const missing = requiredEnv(env);
    if (missing.length) {
      return json({ error: 'Server is not configured', missing }, 503);
    }

    const accessToken = bearerToken(request);
    if (!accessToken) return oauthUnauthorized(url);

    const user = await getAuthenticatedUser(env, accessToken);
    if (!user) return oauthUnauthorized(url, 'invalid_token');

    let message;
    try {
      message = await request.json();
    } catch {
      return rpcError(null, -32700, 'Parse error');
    }

    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
      return rpcError(message?.id ?? null, -32600, 'Invalid Request');
    }

    try {
      const response = await handleRpc(message, env, accessToken);
      if (response === null) return new Response(null, { status: 202 });
      return json(response);
    } catch (error) {
      console.error('DineroZaurio MCP error', error);
      return rpcError(message.id ?? null, -32603, 'Internal error', { message: safeErrorMessage(error) });
    }
  }
};

function protectedResourceMetadata(url, env) {
  return json({
    resource: `${url.origin}/mcp`,
    authorization_servers: [`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`],
    scopes_supported: ['email', 'profile'],
    bearer_methods_supported: ['header']
  });
}

function oauthUnauthorized(url, error = null) {
  const metadataUrl = `${url.origin}/.well-known/oauth-protected-resource`;
  const parts = [`Bearer resource_metadata="${metadataUrl}"`];
  if (error) parts.push(`error="${error}"`);
  return json({ error: error || 'unauthorized', message: 'OAuth authorization is required.' }, 401, {
    'WWW-Authenticate': parts.join(', ')
  });
}

async function handleRpc(message, env, accessToken) {
  const id = message.id;

  if (message.method === 'initialize') {
    return rpcResult(id, {
      protocolVersion: message.params?.protocolVersion || '2025-06-18',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
    });
  }

  if (message.method === 'notifications/initialized' || message.method === 'notifications/cancelled') return null;
  if (message.method === 'ping') return rpcResult(id, {});
  if (message.method === 'tools/list') return rpcResult(id, { tools: TOOLS });

  if (message.method === 'tools/call') {
    const name = message.params?.name;
    const args = message.params?.arguments || {};
    const result = await callTool(name, args, env, accessToken);
    return rpcResult(id, { content: [{ type: 'text', text: JSON.stringify(result) }] });
  }

  return rpcErrorObject(id, -32601, 'Method not found');
}

async function callTool(name, args, env, accessToken) {
  const plan = await getActivePlan(env, accessToken);
  if (!plan) throw new Error('No DineroZaurio plan is visible for the authenticated user. Check RLS policies.');

  switch (name) {
    case 'get_financial_overview': return getFinancialOverview(plan, args, env, accessToken);
    case 'get_incomes': return listByPlan(env, accessToken, 'income_items', plan.id, 'created_at.asc');
    case 'get_expenses': return listByPlan(env, accessToken, 'expense_items', plan.id, 'created_at.asc');
    case 'get_debts': return listByPlan(env, accessToken, 'debt_items', plan.id, 'created_at.asc');
    case 'get_savings_goals': return listByPlan(env, accessToken, 'savings_goals', plan.id, 'created_at.asc');
    case 'get_month_adjustments': return getMonthAdjustments(env, accessToken, plan.id, args.month);
    default: throw new Error(`Unknown tool: ${String(name)}`);
  }
}

async function getFinancialOverview(plan, args, env, accessToken) {
  const month = validMonth(args.month) ? args.month : currentMonth(env.FINANCE_TIMEZONE || 'Europe/Madrid');
  const [incomes, expenses, debts, goals, adjustments] = await Promise.all([
    listByPlan(env, accessToken, 'income_items', plan.id, 'created_at.asc'),
    listByPlan(env, accessToken, 'expense_items', plan.id, 'created_at.asc'),
    listByPlan(env, accessToken, 'debt_items', plan.id, 'created_at.asc'),
    listByPlan(env, accessToken, 'savings_goals', plan.id, 'created_at.asc'),
    getMonthAdjustments(env, accessToken, plan.id, month)
  ]);

  const startDefault = plan.default_start_month || month;
  const activeIncomes = incomes.filter((item) => applies(item, month, startDefault));
  const activeExpenses = expenses.filter((item) => applies(item, month, startDefault));
  const activeGoals = goals.filter((item) => goalApplies(item, month, startDefault));
  const recurringIncome = sum(activeIncomes, (item) => item.amount);
  const recurringExpenses = sum(activeExpenses, (item) => item.amount);
  const debtPayments = sum(debts, (debt) => debtMonthlyAmount(debt, month, startDefault));
  const scheduledSavings = sum(activeGoals, (goal) => goal.monthly_amount);
  const adjustment = adjustments[0] || null;
  const extraIncome = Number(adjustment?.extra_income_amount || 0);
  const extraExpense = Number(adjustment?.extra_expense_amount || 0);
  const extraSaving = Number(adjustment?.extra_saving_amount || 0);
  const incomeTotal = recurringIncome + extraIncome;
  const expenseTotal = recurringExpenses + extraExpense;
  const savingsTotal = scheduledSavings + extraSaving;
  const margin = incomeTotal - expenseTotal - debtPayments - savingsTotal;

  return {
    month,
    currency: 'EUR',
    plan: {
      id: plan.id,
      name: plan.name,
      initial_reserve: Number(plan.initial_reserve || 0),
      default_start_month: plan.default_start_month || null,
      payment_method: plan.payment_method || null
    },
    totals: {
      income: round2(incomeTotal),
      expenses: round2(expenseTotal),
      debt_payments: round2(debtPayments),
      scheduled_savings: round2(savingsTotal),
      margin: round2(margin)
    },
    counts: {
      active_incomes: activeIncomes.length,
      active_expenses: activeExpenses.length,
      debts: debts.length,
      active_savings_goals: activeGoals.length
    },
    month_adjustment: adjustment
  };
}

async function getAuthenticatedUser(env, accessToken) {
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const response = await fetch(`${base}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) return null;
  return response.json();
}

async function getMonthAdjustments(env, accessToken, planId, month) {
  const filters = [`plan_id=eq.${encodeURIComponent(planId)}`];
  if (validMonth(month)) filters.push(`month_key=eq.${encodeURIComponent(month)}`);
  return supabaseSelect(env, accessToken, 'month_adjustments', filters, 'month_key.asc');
}

async function getActivePlan(env, accessToken) {
  const rows = await supabaseSelect(env, accessToken, 'plans', [], 'created_at.asc', 1);
  return rows[0] || null;
}

function listByPlan(env, accessToken, table, planId, order) {
  return supabaseSelect(env, accessToken, table, [`plan_id=eq.${encodeURIComponent(planId)}`], order);
}

async function supabaseSelect(env, accessToken, table, filters = [], order = null, limit = null) {
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const query = new URLSearchParams();
  query.set('select', '*');
  if (order) query.set('order', order);
  if (limit) query.set('limit', String(limit));
  const filterText = filters.length ? `&${filters.join('&')}` : '';
  const endpoint = `${base}/rest/v1/${table}?${query.toString()}${filterText}`;

  const response = await fetch(endpoint, {
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${table} query failed (${response.status}): ${text.slice(0, 300)}`);
  }
  return response.json();
}

function applies(item, month, startDefault) {
  const start = item.start_month || startDefault;
  const end = item.end_month || '';
  if (!start || month < start) return false;
  if (end && month > end) return false;
  return periodicityApplies(item.periodicity || 'monthly', start, month);
}

function goalApplies(goal, month, startDefault) {
  return applies({ start_month: goal.start_month || startDefault, end_month: goal.end_month || '', periodicity: goal.periodicity || 'monthly' }, month, startDefault);
}

function periodicityApplies(periodicity, start, month) {
  const diff = monthDiff(start, month);
  if (diff < 0) return false;
  switch (periodicity) {
    case 'one_time': return diff === 0;
    case 'bimonthly': return diff % 2 === 0;
    case 'quarterly': return diff % 3 === 0;
    case 'yearly': return diff % 12 === 0;
    case 'monthly':
    default: return true;
  }
}

function debtMonthlyAmount(debt, month, startDefault) {
  const start = debt.start_month || startDefault;
  if (!start || month < start) return 0;
  const debtType = debt.debt_type || 'loan';
  const cardType = debt.card_type || null;
  if (debtType === 'loan' || cardType === 'installment') return installmentAmount(debt, month, start);
  if (cardType === 'pay_end_month') {
    return applies({ start_month: start, end_month: debt.end_month || '', periodicity: debt.periodicity || 'monthly' }, month, startDefault) ? Number(debt.amount || 0) : 0;
  }
  if (cardType === 'revolving') return Number(debt.current_debt || 0) > 0 ? Number(debt.current_payment || 0) : 0;
  return Number(debt.monthly_payment || 0);
}

function installmentAmount(debt, month, start) {
  const monthly = Number(debt.monthly_payment || 0);
  if (debt.end_mode === 'remaining') {
    const diff = monthDiff(start, month);
    const remaining = Number(debt.remaining_installments || 0);
    return diff >= 0 && diff < remaining ? monthly : 0;
  }
  if (debt.last_month) return month <= debt.last_month ? monthly : 0;
  return monthly;
}

function monthDiff(from, to) {
  const [fy, fm] = String(from).split('-').map(Number);
  const [ty, tm] = String(to).split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function currentMonth(timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

function validMonth(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function sum(items, getter) {
  return items.reduce((total, item) => total + Number(getter(item) || 0), 0);
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function requiredEnv(env) {
  return ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY'].filter((key) => !env[key]);
}

function bearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9._~-]+/g, 'Bearer [redacted]').slice(0, 500);
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcErrorObject(id, code, message, data) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

function rpcError(id, code, message, data) {
  return json(rpcErrorObject(id, code, message, data), 200);
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}
