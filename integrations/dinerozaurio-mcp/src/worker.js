const SERVER_NAME = 'dinerozaurio-finance';
const SERVER_VERSION = '0.3.0';

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
    getMonthAdjustmentsUntil(env, accessToken, plan.id, month)
  ]);

  const startDefault = plan.default_start_month || month;
  const adjustment = adjustments.find((row) => row.month_key === month) || null;

  const incomeAmounts = incomes.map((item) => ({
    item,
    amount: getScopedAmountForMonth(
      adjustments,
      'income_overrides',
      item.id,
      month,
      recurringItemAmount(item, month, startDefault)
    )
  }));
  const expenseAmounts = expenses.map((item) => ({
    item,
    amount: getScopedAmountForMonth(
      adjustments,
      'expense_overrides',
      item.id,
      month,
      recurringItemAmount(item, month, startDefault)
    )
  }));
  const goalAmounts = goals.map((goal) => ({
    item: goal,
    amount: getScopedAmountForMonth(
      adjustments,
      'goal_overrides',
      goal.id,
      month,
      goalApplies(goal, month, startDefault) ? Number(goal.monthly_amount || 0) : 0
    )
  }));
  const debtStates = debts.map((debt) => resolveDebtMonthState(debt, month, startDefault, adjustments));

  const recurringIncome = sum(incomeAmounts, (entry) => entry.amount);
  const recurringExpenses = sum(expenseAmounts, (entry) => entry.amount);
  const debtPayments = sum(debtStates, (state) => state.amount);
  const scheduledSavings = sum(goalAmounts, (entry) => entry.amount);

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
      active_incomes: incomeAmounts.filter((entry) => entry.amount !== 0).length,
      active_expenses: expenseAmounts.filter((entry) => entry.amount !== 0).length,
      debts: debts.length,
      active_debts: debtStates.filter((state) => state.amount !== 0).length,
      active_savings_goals: goalAmounts.filter((entry) => entry.amount !== 0).length
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

async function getMonthAdjustmentsUntil(env, accessToken, planId, month) {
  const filters = [
    `plan_id=eq.${encodeURIComponent(planId)}`,
    `month_key=lte.${encodeURIComponent(month)}`
  ];
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

function recurringItemAmount(item, month, startDefault) {
  const start = item.start_month || startDefault;
  const end = item.end_month || '';
  if (!start || month < start) return 0;
  if (end && month > end) return 0;

  const periodicity = normalizePeriodicity(item.periodicity || 'monthly');
  const meta = itemMetadata(item);
  if (periodicity === 'weekly' || periodicity === 'biweekly') {
    const count = recurringChargeCount(item, meta, month, startDefault, periodicity === 'weekly' ? 7 : 14);
    return count * Number(item.amount || 0);
  }

  return periodicityApplies(periodicity, start, month, Number(meta.intervalMonths || 1))
    ? Number(item.amount || 0)
    : 0;
}

function goalApplies(goal, month, startDefault) {
  const start = goal.start_month || startDefault;
  const end = goal.end_month || '';
  if (!start || month < start) return false;
  if (end && month > end) return false;
  const meta = itemMetadata(goal);
  return periodicityApplies(normalizePeriodicity(goal.periodicity || 'monthly'), start, month, Number(meta.intervalMonths || 1));
}

function normalizePeriodicity(value) {
  return [
    'weekly',
    'biweekly',
    'monthly',
    'bimonthly',
    'quarterly',
    'four_monthly',
    'yearly',
    'one_time',
    'custom_months'
  ].includes(value) ? value : 'monthly';
}

function periodicityApplies(periodicity, start, month, intervalMonths = 1) {
  const diff = monthDiff(start, month);
  if (diff < 0) return false;
  switch (periodicity) {
    case 'one_time': return diff === 0;
    case 'bimonthly': return diff % 2 === 0;
    case 'quarterly': return diff % 3 === 0;
    case 'four_monthly': return diff % 4 === 0;
    case 'yearly': return diff % 12 === 0;
    case 'custom_months': return diff % Math.max(1, Number(intervalMonths || 1)) === 0;
    case 'weekly':
    case 'biweekly':
    case 'monthly':
    default: return true;
  }
}

function recurringChargeCount(item, meta, month, startDefault, intervalDays) {
  const startMonth = item.start_month || startDefault;
  const dueDay = Math.min(28, Math.max(1, Number(meta.dueDay || 1)));
  const fallbackDate = `${startMonth}-${String(dueDay).padStart(2, '0')}`;
  const rawAnchor = /^\d{4}-\d{2}-\d{2}$/.test(String(meta.startDate || '')) ? meta.startDate : fallbackDate;
  const anchor = utcDateValue(rawAnchor);
  if (anchor === null) return 0;

  const leadDays = Math.max(0, Number(meta.chargeLeadDays || 0));
  const dayMs = 24 * 60 * 60 * 1000;
  const firstCharge = anchor - (leadDays * dayMs);
  const [year, monthNumber] = month.split('-').map(Number);
  const monthStart = Date.UTC(year, monthNumber - 1, 1);
  const nextMonthStart = Date.UTC(year, monthNumber, 1);
  const intervalMs = intervalDays * dayMs;

  let cursor = firstCharge;
  if (cursor < monthStart) {
    cursor += Math.ceil((monthStart - cursor) / intervalMs) * intervalMs;
  }

  let count = 0;
  while (cursor < nextMonthStart) {
    if (cursor >= monthStart) count += 1;
    cursor += intervalMs;
  }
  return count;
}

function utcDateValue(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return Date.UTC(year, month - 1, day);
}

function itemMetadata(item) {
  return parseEmbeddedMetadata(item?.name, '__DZITEM__');
}

function debtMetadata(debt) {
  return parseEmbeddedMetadata(debt?.name, '__DZMETA__');
}

function parseEmbeddedMetadata(rawName, prefix) {
  const text = String(rawName || '').trim();
  if (!text.startsWith(prefix)) return {};
  try {
    const value = JSON.parse(text.slice(prefix.length));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function normalizeScopedOverride(raw) {
  if (raw === undefined || raw === null) return null;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const mode = ['this_month', 'from_here', 'remove_from_here'].includes(raw.mode) ? raw.mode : 'this_month';
    return {
      mode,
      amount: mode === 'remove_from_here' ? 0 : Number(raw.amount || 0)
    };
  }
  return { mode: 'this_month', amount: Number(raw || 0) };
}

function getScopedOverrideForMonth(adjustments, overrideKey, itemId, month) {
  const directAdjustment = adjustments.find((row) => row.month_key === month);
  const direct = normalizeScopedOverride(directAdjustment?.[overrideKey]?.[itemId]);
  if (direct) return direct;

  let persistent = null;
  for (const adjustment of adjustments) {
    if (adjustment.month_key > month) break;
    const candidate = normalizeScopedOverride(adjustment?.[overrideKey]?.[itemId]);
    if (candidate?.mode === 'from_here' || candidate?.mode === 'remove_from_here') {
      persistent = candidate;
    }
  }
  return persistent;
}

function getScopedAmountForMonth(adjustments, overrideKey, itemId, month, fallbackAmount) {
  const override = getScopedOverrideForMonth(adjustments, overrideKey, itemId, month);
  if (!override) return Number(fallbackAmount || 0);
  if (override.mode === 'remove_from_here') return 0;
  return Number(override.amount || 0);
}

function resolveDebtMonthState(debt, month, startDefault, adjustments) {
  const paidMonth = getDebtPaidMonth(debt, adjustments);

  // A paid debt is terminal. No later custom/from_here override may reactivate it.
  if (paidMonth && month > paidMonth) {
    return {
      debt_id: debt.id,
      amount: 0,
      active: false,
      paid_month: paidMonth,
      override_mode: null
    };
  }

  const override = getDebtOverrideForMonth(debt.id, month, adjustments);
  let amount;

  if (override?.mode === 'paid') {
    amount = Number(override.amount || debtBaseMonthlyAmount(debt, month, startDefault));
  } else if (override?.mode === 'skip') {
    amount = 0;
  } else if (override?.mode === 'custom') {
    amount = Number(override.amount || 0);
  } else {
    amount = debtBaseMonthlyAmount(debt, month, startDefault);
  }

  return {
    debt_id: debt.id,
    amount: Number(amount || 0),
    active: Number(amount || 0) !== 0,
    paid_month: paidMonth || null,
    override_mode: override?.mode || null
  };
}

function getDebtPaidMonth(debt, adjustments) {
  const candidates = [];
  const meta = debtMetadata(debt);
  const settledMonth = String(debt.settled_month || meta.settledMonth || '').trim();
  if (validMonth(settledMonth)) candidates.push(settledMonth);

  for (const adjustment of adjustments) {
    if (adjustment?.debt_overrides?.[debt.id]?.mode === 'paid' && validMonth(adjustment.month_key)) {
      candidates.push(adjustment.month_key);
    }
  }

  candidates.sort();
  return candidates[0] || '';
}

function getDebtOverrideForMonth(debtId, month, adjustments) {
  const directAdjustment = adjustments.find((row) => row.month_key === month);
  const direct = directAdjustment?.debt_overrides?.[debtId] || null;
  if (direct) return direct;

  let persistent = null;
  for (const adjustment of adjustments) {
    if (adjustment.month_key > month) break;
    const candidate = adjustment?.debt_overrides?.[debtId] || null;
    if (candidate?.mode === 'custom' && candidate.scope === 'from_here') {
      persistent = candidate;
    }
  }
  return persistent;
}

function debtBaseMonthlyAmount(debt, month, startDefault) {
  const start = debt.start_month || startDefault;
  if (!start || month < start) return 0;

  const debtType = debt.debt_type || 'loan';
  const cardType = debt.card_type || null;

  if (debtType === 'loan' || cardType === 'installment') {
    return installmentAmount(debt, month, start);
  }

  if (cardType === 'pay_end_month') {
    const meta = debtMetadata(debt);
    return periodicityApplies(
      normalizePeriodicity(debt.periodicity || 'monthly'),
      start,
      month,
      Number(meta.intervalMonths || 1)
    ) ? Number(debt.amount || 0) : 0;
  }

  if (cardType === 'revolving') {
    return Number(debt.current_debt || 0) > 0 ? Number(debt.current_payment || 0) : 0;
  }

  return Number(debt.monthly_payment || 0);
}

function installmentAmount(debt, month, start) {
  const monthly = Number(debt.monthly_payment || 0);
  if (debt.last_month) {
    return month >= start && month <= debt.last_month ? monthly : 0;
  }

  if (debt.end_mode === 'remaining') {
    const diff = monthDiff(start, month);
    const remaining = Number(debt.remaining_installments || 0);
    return diff >= 0 && diff < remaining ? monthly : 0;
  }

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