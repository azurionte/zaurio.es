const SERVER_NAME = 'dinerozaurio-finance';
const SERVER_VERSION = '0.4.0';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

const MONTH_SCHEMA = {
  type: 'string',
  description: 'Month in YYYY-MM format.',
  pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
};

const TOOLS = [
  {
    name: 'get_financial_overview',
    description: 'Get the authenticated user\'s DineroZaurio financial overview for a month, including recurring income, expenses, debt payments, savings goals and margin.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          ...MONTH_SCHEMA,
          description: 'Month in YYYY-MM format. Defaults to the current month in the configured finance timezone.'
        }
      },
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_month_snapshot',
    description: 'Get a fully resolved DineroZaurio month with the exact income, expense, debt and savings items that make up the totals, including one-off and non-monthly variations and settled-debt exclusions. Use this for questions about why a month has a particular margin.',
    inputSchema: {
      type: 'object',
      properties: { month: MONTH_SCHEMA },
      required: ['month'],
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'get_financial_timeline',
    description: 'Get resolved monthly totals and notable temporary variations across a DineroZaurio date range. Use this for questions about when the user can afford something or how their finances evolve over time.',
    inputSchema: {
      type: 'object',
      properties: {
        from_month: MONTH_SCHEMA,
        to_month: MONTH_SCHEMA
      },
      required: ['from_month', 'to_month'],
      additionalProperties: false
    },
    annotations: READ_ONLY_ANNOTATIONS
  },
  {
    name: 'explain_financial_change',
    description: 'Explain exactly why one DineroZaurio month differs from another by comparing resolved income, expense, debt and savings items and returning the drivers of the margin change.',
    inputSchema: {
      type: 'object',
      properties: {
        from_month: MONTH_SCHEMA,
        to_month: MONTH_SCHEMA
      },
      required: ['from_month', 'to_month'],
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
      properties: { month: MONTH_SCHEMA },
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
    case 'get_month_snapshot': return getMonthSnapshot(plan, args, env, accessToken);
    case 'get_financial_timeline': return getFinancialTimeline(plan, args, env, accessToken);
    case 'explain_financial_change': return explainFinancialChange(plan, args, env, accessToken);
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
  const data = await loadFinancialData(plan, month, env, accessToken);
  const snapshot = buildMonthSnapshot(plan, month, data);

  return {
    month: snapshot.month,
    currency: snapshot.currency,
    plan: snapshot.plan,
    totals: snapshot.totals,
    counts: snapshot.counts,
    month_adjustment: snapshot.month_adjustment
  };
}

async function getMonthSnapshot(plan, args, env, accessToken) {
  if (!validMonth(args.month)) throw new Error('month must use YYYY-MM format.');
  const data = await loadFinancialData(plan, args.month, env, accessToken);
  return buildMonthSnapshot(plan, args.month, data);
}

async function getFinancialTimeline(plan, args, env, accessToken) {
  validateMonthRange(args.from_month, args.to_month);
  const months = monthsInRange(args.from_month, args.to_month);
  if (months.length > 60) throw new Error('The requested timeline is too long. Maximum range is 60 months.');

  const data = await loadFinancialData(plan, args.to_month, env, accessToken);
  const snapshots = months.map((month) => buildMonthSnapshot(plan, month, data));

  return {
    currency: 'EUR',
    from_month: args.from_month,
    to_month: args.to_month,
    months: snapshots.map((snapshot) => ({
      month: snapshot.month,
      income: snapshot.totals.income,
      expenses: snapshot.totals.expenses,
      debt_payments: snapshot.totals.debt_payments,
      scheduled_savings: snapshot.totals.scheduled_savings,
      margin: snapshot.totals.margin,
      notable_variations: snapshot.explanation.temporary_variations
    }))
  };
}

async function explainFinancialChange(plan, args, env, accessToken) {
  validateMonthRange(args.from_month, args.to_month, false);
  const throughMonth = args.from_month > args.to_month ? args.from_month : args.to_month;
  const data = await loadFinancialData(plan, throughMonth, env, accessToken);
  const from = buildMonthSnapshot(plan, args.from_month, data);
  const to = buildMonthSnapshot(plan, args.to_month, data);

  const changes = [
    ...diffSnapshotSection('income', from.income.items, to.income.items, 1),
    ...diffSnapshotSection('expense', from.expenses.items, to.expenses.items, -1),
    ...diffSnapshotSection('debt', from.debts.items, to.debts.items, -1),
    ...diffSnapshotSection('savings', from.savings.items, to.savings.items, -1)
  ].sort((a, b) => Math.abs(b.margin_impact) - Math.abs(a.margin_impact));

  return {
    currency: 'EUR',
    from_month: args.from_month,
    to_month: args.to_month,
    from_margin: from.totals.margin,
    to_margin: to.totals.margin,
    margin_change: round2(to.totals.margin - from.totals.margin),
    drivers: changes.filter((change) => Math.abs(change.amount_change) >= 0.01),
    from_notable_variations: from.explanation.temporary_variations,
    to_notable_variations: to.explanation.temporary_variations
  };
}

async function loadFinancialData(plan, throughMonth, env, accessToken) {
  const [incomes, expenses, debts, goals, adjustments] = await Promise.all([
    listByPlan(env, accessToken, 'income_items', plan.id, 'created_at.asc'),
    listByPlan(env, accessToken, 'expense_items', plan.id, 'created_at.asc'),
    listByPlan(env, accessToken, 'debt_items', plan.id, 'created_at.asc'),
    listByPlan(env, accessToken, 'savings_goals', plan.id, 'created_at.asc'),
    getMonthAdjustmentsUntil(env, accessToken, plan.id, throughMonth)
  ]);
  return { incomes, expenses, debts, goals, adjustments };
}

function buildMonthSnapshot(plan, month, data) {
  const { incomes, expenses, debts, goals, adjustments } = data;
  const startDefault = plan.default_start_month || month;
  const adjustment = adjustments.find((row) => row.month_key === month) || null;

  const incomeItems = incomes
    .map((item) => {
      const fallback = recurringItemAmount(item, month, startDefault);
      const override = getScopedOverrideForMonth(adjustments, 'income_overrides', item.id, month);
      const amount = override ? Number(override.amount || 0) : fallback;
      return {
        id: item.id,
        name: displayItemName(item),
        amount: round2(amount),
        type: normalizePeriodicity(item.periodicity || 'monthly') === 'one_time' ? 'one_time' : 'recurring',
        periodicity: normalizePeriodicity(item.periodicity || 'monthly'),
        reason: amountReason(item, month, override, fallback)
      };
    })
    .filter((item) => item.amount !== 0);

  const expenseItems = expenses
    .map((item) => {
      const fallback = recurringItemAmount(item, month, startDefault);
      const override = getScopedOverrideForMonth(adjustments, 'expense_overrides', item.id, month);
      let amount = fallback;
      if (override) amount = override.mode === 'remove_from_here' ? 0 : Number(override.amount || 0);
      return {
        id: item.id,
        name: displayItemName(item),
        amount: round2(amount),
        type: normalizePeriodicity(item.periodicity || 'monthly') === 'one_time' ? 'one_time' : 'recurring',
        periodicity: normalizePeriodicity(item.periodicity || 'monthly'),
        reason: amountReason(item, month, override, fallback),
        impacts_margin: true,
        payment_source: 'salary'
      };
    })
    .filter((item) => item.amount !== 0);

  const oneOffExpenses = normalizeOneOffExpenses(adjustment, month);
  const salaryOneOffTotal = sum(oneOffExpenses.filter((item) => item.impacts_margin), (item) => item.amount);
  expenseItems.push(...oneOffExpenses);

  const debtStates = debts.map((debt) => resolveDebtMonthState(debt, month, startDefault, adjustments));
  const debtItems = debtStates
    .filter((state) => state.amount !== 0)
    .map((state) => ({
      id: state.debt_id,
      name: state.name,
      amount: round2(state.amount),
      type: 'debt_payment',
      reason: state.reason,
      status: state.status,
      paid_month: state.paid_month,
      last_month: state.last_month,
      remaining_installments: state.remaining_installments
    }));

  const excludedDebts = debtStates
    .filter((state) => state.amount === 0 && state.status === 'settled')
    .map((state) => ({
      id: state.debt_id,
      name: state.name,
      status: 'settled',
      paid_month: state.paid_month,
      reason: `settled_in_${state.paid_month}`
    }));

  const savingsItems = goals
    .map((goal) => {
      const fallback = goalApplies(goal, month, startDefault) ? Number(goal.monthly_amount || 0) : 0;
      const override = getScopedOverrideForMonth(adjustments, 'goal_overrides', goal.id, month);
      const amount = override ? (override.mode === 'remove_from_here' ? 0 : Number(override.amount || 0)) : fallback;
      return {
        id: goal.id,
        name: displayItemName(goal),
        amount: round2(amount),
        type: 'scheduled_savings',
        reason: override ? overrideReason(override) : (amount ? 'scheduled_for_month' : 'not_scheduled_for_month')
      };
    })
    .filter((item) => item.amount !== 0);

  const recurringIncome = sum(incomeItems, (item) => item.amount);
  const recurringExpenses = sum(expenseItems.filter((item) => item.type !== 'one_off' || item.impacts_margin), (item) => item.type === 'one_off' ? 0 : item.amount);
  const debtPayments = sum(debtItems, (item) => item.amount);
  const scheduledSavings = sum(savingsItems, (item) => item.amount);

  const extraIncome = Number(adjustment?.extra_income_amount || 0);
  const extraExpense = Number(adjustment?.extra_expense_amount || 0);
  const extraSaving = Number(adjustment?.extra_saving_amount || 0);

  const incomeTotal = recurringIncome + extraIncome;
  const expenseTotal = recurringExpenses + salaryOneOffTotal + extraExpense;
  const savingsTotal = scheduledSavings + extraSaving;
  const margin = incomeTotal - expenseTotal - debtPayments - savingsTotal;

  const temporaryVariations = [
    ...expenseItems.filter((item) => item.type === 'one_off' || item.periodicity !== 'monthly').map((item) => ({
      category: 'expense',
      name: item.name,
      amount: item.amount,
      margin_impact: item.impacts_margin ? round2(-item.amount) : 0,
      reason: item.reason
    })),
    ...debtItems.filter((item) => /override|first|last|custom/i.test(item.reason || '')).map((item) => ({
      category: 'debt',
      name: item.name,
      amount: item.amount,
      margin_impact: round2(-item.amount),
      reason: item.reason
    }))
  ].sort((a, b) => Math.abs(b.margin_impact) - Math.abs(a.margin_impact));

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
      active_incomes: incomeItems.length,
      active_expenses: expenseItems.filter((item) => item.impacts_margin).length,
      debts: debts.length,
      active_debts: debtItems.length,
      settled_debts_excluded: excludedDebts.length,
      active_savings_goals: savingsItems.length
    },
    income: {
      total: round2(incomeTotal),
      items: incomeItems,
      extra_income: extraIncome ? [{ name: adjustment?.extra_income_name || 'Extra income', amount: round2(extraIncome), reason: 'month_adjustment' }] : []
    },
    expenses: {
      total: round2(expenseTotal),
      items: expenseItems,
      extra_expense: extraExpense ? [{ name: adjustment?.extra_expense_name || 'Extra expense', amount: round2(extraExpense), reason: 'month_adjustment' }] : []
    },
    debts: {
      total: round2(debtPayments),
      items: debtItems,
      excluded: excludedDebts
    },
    savings: {
      total: round2(savingsTotal),
      items: savingsItems,
      extra_saving: extraSaving ? [{ name: adjustment?.extra_saving_name || 'Extra saving', amount: round2(extraSaving), reason: 'month_adjustment' }] : []
    },
    explanation: {
      temporary_variations: temporaryVariations,
      summary: buildSnapshotSummary(month, margin, temporaryVariations)
    },
    month_adjustment: adjustment
  };
}

function normalizeOneOffExpenses(adjustment, month) {
  const entries = adjustment?.expense_overrides?.__oneOffExpenses;
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((entry) => !entry.monthKey || entry.monthKey === month)
    .map((entry) => {
      const source = ['salary', 'card', 'reserve', 'savings'].includes(entry.paymentSource) ? entry.paymentSource : 'salary';
      const impactsMargin = source === 'salary';
      return {
        id: entry.id || `oneoff-${month}-${String(entry.name || '')}`,
        name: String(entry.name || 'One-off expense'),
        amount: round2(Number(entry.amount || 0)),
        type: 'one_off',
        periodicity: 'one_time',
        reason: 'one_off_expense_for_month',
        impacts_margin: impactsMargin,
        payment_source: source,
        entry_date: entry.entryDate || null
      };
    })
    .filter((entry) => entry.amount !== 0);
}

function buildSnapshotSummary(month, margin, variations) {
  if (!variations.length) return `${month} has a resolved margin of ${round2(margin)} EUR with no notable non-monthly variations.`;
  const names = variations.slice(0, 4).map((item) => `${item.name} (${item.margin_impact >= 0 ? '+' : ''}${item.margin_impact} EUR margin impact)`).join(', ');
  return `${month} has a resolved margin of ${round2(margin)} EUR. Main temporary/non-monthly variations: ${names}.`;
}

function diffSnapshotSection(category, fromItems, toItems, marginSign) {
  const fromMap = itemAmountMap(fromItems);
  const toMap = itemAmountMap(toItems);
  const keys = new Set([...fromMap.keys(), ...toMap.keys()]);
  const changes = [];

  for (const key of keys) {
    const before = fromMap.get(key) || { name: key, amount: 0, reason: null };
    const after = toMap.get(key) || { name: key, amount: 0, reason: null };
    const amountChange = round2(Number(after.amount || 0) - Number(before.amount || 0));
    if (Math.abs(amountChange) < 0.01) continue;
    changes.push({
      category,
      name: after.name || before.name,
      from_amount: round2(before.amount || 0),
      to_amount: round2(after.amount || 0),
      amount_change: amountChange,
      margin_impact: round2(amountChange * marginSign),
      from_reason: before.reason || null,
      to_reason: after.reason || null
    });
  }
  return changes;
}

function itemAmountMap(items) {
  const map = new Map();
  for (const item of items || []) {
    const key = item.id || `${item.name}:${item.type || ''}`;
    const previous = map.get(key);
    if (previous) {
      previous.amount = round2(Number(previous.amount || 0) + Number(item.amount || 0));
    } else {
      map.set(key, { ...item });
    }
  }
  return map;
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
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
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

function displayItemName(item) {
  const meta = itemMetadata(item);
  if (meta.name) return String(meta.name);
  const raw = String(item?.name || '').trim();
  return raw || 'Unnamed item';
}

function displayDebtName(debt) {
  const meta = debtMetadata(debt);
  const entity = String(meta.entityName || '').trim();
  const instrument = String(meta.instrumentName || '').trim();
  if (entity && instrument) return `${entity} · ${instrument}`;
  if (entity) return entity;
  if (instrument) return instrument;
  return String(debt?.name || 'Debt');
}

function normalizeScopedOverride(raw) {
  if (raw === undefined || raw === null) return null;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const mode = ['this_month', 'from_here', 'remove_from_here'].includes(raw.mode) ? raw.mode : 'this_month';
    return { mode, amount: mode === 'remove_from_here' ? 0 : Number(raw.amount || 0) };
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
    if (candidate?.mode === 'from_here' || candidate?.mode === 'remove_from_here') persistent = candidate;
  }
  return persistent;
}

function getScopedAmountForMonth(adjustments, overrideKey, itemId, month, fallbackAmount) {
  const override = getScopedOverrideForMonth(adjustments, overrideKey, itemId, month);
  if (!override) return Number(fallbackAmount || 0);
  if (override.mode === 'remove_from_here') return 0;
  return Number(override.amount || 0);
}

function amountReason(item, month, override, fallback) {
  if (override) return overrideReason(override);
  const periodicity = normalizePeriodicity(item.periodicity || 'monthly');
  if (!fallback) return 'not_due_this_month';
  if (periodicity === 'one_time') return 'one_time_scheduled_for_month';
  if (periodicity === 'bimonthly') return 'bimonthly_due_this_month';
  if (periodicity === 'quarterly') return 'quarterly_due_this_month';
  if (periodicity === 'four_monthly') return 'four_monthly_due_this_month';
  if (periodicity === 'yearly') return 'yearly_due_this_month';
  if (periodicity === 'weekly') return 'weekly_charges_due_this_month';
  if (periodicity === 'biweekly') return 'biweekly_charges_due_this_month';
  if (periodicity === 'custom_months') return 'custom_period_due_this_month';
  return 'monthly_recurring';
}

function overrideReason(override) {
  if (!override) return null;
  if (override.mode === 'from_here') return 'override_from_here';
  if (override.mode === 'remove_from_here') return 'removed_from_here';
  return 'override_this_month';
}

function resolveDebtMonthState(debt, month, startDefault, adjustments) {
  const meta = debtMetadata(debt);
  const paidMonth = getDebtPaidMonth(debt, adjustments);
  const name = displayDebtName(debt);
  const start = debt.start_month || startDefault;
  const lastMonth = debt.last_month || null;
  const remainingInstallments = debt.last_month ? null : remainingInstallmentsForMonth(debt, month, start);

  if (paidMonth && month > paidMonth) {
    return {
      debt_id: debt.id,
      name,
      amount: 0,
      active: false,
      status: 'settled',
      paid_month: paidMonth,
      reason: `settled_in_${paidMonth}`,
      last_month: lastMonth,
      remaining_installments: 0
    };
  }

  const override = getDebtOverrideForMonth(debt.id, month, adjustments);
  let amount;
  let reason;

  if (override?.mode === 'paid') {
    amount = Number(override.amount || debtBaseMonthlyAmount(debt, month, startDefault));
    reason = 'paid_override_this_month';
  } else if (override?.mode === 'skip') {
    amount = 0;
    reason = 'skipped_this_month';
  } else if (override?.mode === 'custom') {
    amount = Number(override.amount || 0);
    reason = override.scope === 'from_here' ? 'custom_override_from_here' : 'custom_override_this_month';
  } else {
    amount = debtBaseMonthlyAmount(debt, month, startDefault);
    if (!amount) reason = month < start ? 'not_started' : (lastMonth && month > lastMonth ? 'ended' : 'not_due');
    else if (meta.calendarNote && /primera cuota/i.test(String(meta.calendarNote)) && month === start) reason = 'first_scheduled_payment';
    else if (lastMonth && month === lastMonth) reason = 'last_scheduled_payment';
    else reason = 'scheduled_payment';
  }

  return {
    debt_id: debt.id,
    name,
    amount: Number(amount || 0),
    active: Number(amount || 0) !== 0,
    status: paidMonth && month === paidMonth ? 'settled_this_month' : (Number(amount || 0) !== 0 ? 'active' : 'inactive'),
    paid_month: paidMonth || null,
    reason,
    last_month: lastMonth,
    remaining_installments: remainingInstallments
  };
}

function getDebtPaidMonth(debt, adjustments) {
  const candidates = [];
  const meta = debtMetadata(debt);
  const settledMonth = String(debt.settled_month || meta.settledMonth || '').trim();
  if (validMonth(settledMonth)) candidates.push(settledMonth);

  for (const adjustment of adjustments) {
    if (adjustment?.debt_overrides?.[debt.id]?.mode === 'paid' && validMonth(adjustment.month_key)) candidates.push(adjustment.month_key);
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
    if (candidate?.mode === 'custom' && candidate.scope === 'from_here') persistent = candidate;
  }
  return persistent;
}

function debtBaseMonthlyAmount(debt, month, startDefault) {
  const start = debt.start_month || startDefault;
  if (!start || month < start) return 0;

  const debtType = debt.debt_type || 'loan';
  const cardType = debt.card_type || null;

  if (debtType === 'loan' || cardType === 'installment') return installmentAmount(debt, month, start);

  if (cardType === 'pay_end_month') {
    const meta = debtMetadata(debt);
    return periodicityApplies(
      normalizePeriodicity(debt.periodicity || 'monthly'),
      start,
      month,
      Number(meta.intervalMonths || 1)
    ) ? Number(debt.amount || 0) : 0;
  }

  if (cardType === 'revolving') return Number(debt.current_debt || 0) > 0 ? Number(debt.current_payment || 0) : 0;
  return Number(debt.monthly_payment || 0);
}

function installmentAmount(debt, month, start) {
  const monthly = Number(debt.monthly_payment || 0);
  if (debt.last_month) return month >= start && month <= debt.last_month ? monthly : 0;

  if (debt.end_mode === 'remaining') {
    const diff = monthDiff(start, month);
    const remaining = Number(debt.remaining_installments || 0);
    return diff >= 0 && diff < remaining ? monthly : 0;
  }

  return monthly;
}

function remainingInstallmentsForMonth(debt, month, start) {
  const total = Number(debt.remaining_installments || 0);
  if (!total || month < start) return total;
  return Math.max(0, total - Math.max(0, monthDiff(start, month)));
}

function validateMonthRange(from, to, requireAscending = true) {
  if (!validMonth(from) || !validMonth(to)) throw new Error('from_month and to_month must use YYYY-MM format.');
  if (requireAscending && from > to) throw new Error('from_month must be before or equal to to_month.');
}

function monthsInRange(from, to) {
  const out = [];
  let cursor = from;
  while (cursor <= to) {
    out.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return out;
}

function addMonths(month, delta) {
  const [year, monthNumber] = String(month).split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
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