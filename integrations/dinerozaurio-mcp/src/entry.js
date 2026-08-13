import worker from './worker.js';

const CONTEXT_TOOL = {
  name: 'get_financial_context',
  description: 'Get DineroZaurio financial context for a month together with folder-mode account locations, folder balances, confirmed transfers, account assignments and personal loans. Use this when the question depends on where money currently lives, whether money has been moved between BBVA/Revolut/folders, or money lent to/borrowed from another person.',
  inputSchema: {
    type: 'object',
    properties: {
      month: {
        type: 'string',
        description: 'Month in YYYY-MM format. Defaults to the current month.',
        pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
      }
    },
    additionalProperties: false
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

const PERSONAL_LOANS_TOOL = {
  name: 'get_personal_loans',
  description: 'List tracked personal loans between the authenticated user and other people, including direction, outstanding amount, due date, status and recorded repayments.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};

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

async function proxyJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });
  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function oauthChallenge(origin) {
  return `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource", scope="email profile"`;
}

function currentMonth(timeZone = 'Europe/Madrid') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  return `${year}-${month}`;
}

function validMonth(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function cloneHeaders(request) {
  const headers = new Headers(request.headers);
  headers.set('Content-Type', 'application/json');
  return headers;
}

async function callWorkerRpc(request, env, ctx, message) {
  const nextRequest = new Request(request.url, {
    method: 'POST',
    headers: cloneHeaders(request),
    body: JSON.stringify(message)
  });
  const response = await worker.fetch(nextRequest, env, ctx);
  const body = await response.json();
  return { response, body };
}

function rpcToolResult(id, value) {
  return json({
    jsonrpc: '2.0',
    id,
    result: {
      content: [{ type: 'text', text: JSON.stringify(value) }]
    }
  });
}

function parseToolText(body) {
  const text = body?.result?.content?.find(item => item?.type === 'text')?.text;
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return null; }
}

function allAdjustmentsPayload(adjustments) {
  return Array.isArray(adjustments) ? adjustments : [];
}

function extractOrganization(adjustments) {
  for (const row of adjustments) {
    const organization = row?.expense_overrides?.__moneyOrganization;
    if (organization && typeof organization === 'object') return organization;
  }
  return null;
}

function extractFolderTransfers(adjustments, month) {
  const row = adjustments.find(item => item?.month_key === month);
  const map = row?.expense_overrides?.__folderTransfers;
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {};
}

function extractPersonalLoans(adjustments) {
  for (const row of adjustments) {
    const loans = row?.expense_overrides?.__personalLoans;
    if (Array.isArray(loans)) return loans;
  }
  return [];
}

function accountContext(organization, transfers) {
  if (!organization || !Array.isArray(organization.accounts)) {
    return {
      enabled: false,
      salary_account_id: null,
      accounts: [],
      assignments: {},
      transfer_confirmations: []
    };
  }

  const transferConfirmations = Object.entries(transfers || {}).map(([key, value]) => {
    const [accountId, folderId = ''] = key.split('|');
    return {
      account_id: accountId,
      folder_id: folderId || null,
      amount: Number(value?.amount || 0),
      confirmed_at: value?.confirmedAt || null
    };
  });

  return {
    enabled: !!organization.enabled,
    salary_account_id: organization.salaryAccountId || null,
    accounts: organization.accounts.map(account => ({
      id: account.id,
      name: account.name,
      kind: account.kind || 'current',
      actual_balance: account.actualBalance === null || account.actualBalance === undefined ? null : Number(account.actualBalance || 0),
      balance_updated_at: account.balanceUpdatedAt || null,
      minimum_balance: Number(account.minimumBalance || 0),
      folders: Array.isArray(account.folders) ? account.folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        actual_balance: folder.actualBalance === null || folder.actualBalance === undefined ? null : Number(folder.actualBalance || 0),
        balance_updated_at: folder.balanceUpdatedAt || null
      })) : []
    })),
    assignments: organization.assignments || {},
    transfer_confirmations: transferConfirmations
  };
}

function personalLoansContext(loans) {
  const items = (Array.isArray(loans) ? loans : []).map(loan => ({
    id: loan.id,
    direction: loan.direction === 'lent' ? 'lent_by_user' : 'borrowed_by_user',
    person: loan.person || '',
    principal: Number(loan.principal || 0),
    outstanding: Number(loan.outstanding || 0),
    start_date: loan.startDate || null,
    due_date: loan.dueDate || null,
    note: loan.note || '',
    status: loan.status || (Number(loan.outstanding || 0) > 0 ? 'open' : 'closed'),
    payments: Array.isArray(loan.payments) ? loan.payments.map(payment => ({
      amount: Number(payment.amount || 0),
      date: payment.date || null,
      recorded_at: payment.recordedAt || null
    })) : []
  }));

  return {
    items,
    totals: {
      user_owes: items.filter(item => item.direction === 'borrowed_by_user' && item.status !== 'closed').reduce((sum, item) => sum + item.outstanding, 0),
      owed_to_user: items.filter(item => item.direction === 'lent_by_user' && item.status !== 'closed').reduce((sum, item) => sum + item.outstanding, 0)
    }
  };
}

async function getAllAdjustments(request, env, ctx, id) {
  const result = await callWorkerRpc(request, env, ctx, {
    jsonrpc: '2.0',
    id: `${String(id ?? 'context')}-adjustments`,
    method: 'tools/call',
    params: { name: 'get_month_adjustments', arguments: {} }
  });
  if (result.body?.error) throw new Error(result.body.error.message || 'Could not read month adjustments.');
  return allAdjustmentsPayload(parseToolText(result.body));
}

async function buildFinancialContext(request, env, ctx, message) {
  const month = validMonth(message.params?.arguments?.month)
    ? message.params.arguments.month
    : currentMonth(env.FINANCE_TIMEZONE || 'Europe/Madrid');

  const [snapshotRpc, adjustments] = await Promise.all([
    callWorkerRpc(request, env, ctx, {
      jsonrpc: '2.0',
      id: `${String(message.id ?? 'context')}-snapshot`,
      method: 'tools/call',
      params: { name: 'get_month_snapshot', arguments: { month } }
    }),
    getAllAdjustments(request, env, ctx, message.id)
  ]);

  if (snapshotRpc.body?.error) throw new Error(snapshotRpc.body.error.message || 'Could not build month snapshot.');
  const snapshot = parseToolText(snapshotRpc.body);
  const organization = extractOrganization(adjustments);
  const transfers = extractFolderTransfers(adjustments, month);
  const loans = extractPersonalLoans(adjustments);

  return {
    month,
    snapshot,
    account_context: accountContext(organization, transfers),
    personal_loans: personalLoansContext(loans),
    interpretation_hints: [
      'The month snapshot is the source of truth for projected income, expenses, debt payments, savings and margin.',
      'account_context describes where money is physically expected or manually confirmed to live when folder mode is enabled.',
      'transfer_confirmations mean the user explicitly confirmed money was moved into an account/folder; do not assume unconfirmed transfers happened.',
      'A folder actual_balance is the user-reported amount currently left there and should take precedence over inferred spending until bank synchronization exists.',
      'personal_loans tracks informal money lent to or borrowed from other people and is separate from institutional debt_items.'
    ]
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const supabase = env.SUPABASE_URL?.replace(/\/$/, '');

    if (!supabase) {
      return json({ error: 'SUPABASE_URL is not configured' }, 503);
    }

    if (
      url.pathname === '/.well-known/oauth-authorization-server' ||
      url.pathname === '/.well-known/oauth-authorization-server/mcp' ||
      url.pathname === '/mcp/.well-known/oauth-authorization-server'
    ) {
      return proxyJson(`${supabase}/.well-known/oauth-authorization-server/auth/v1`);
    }

    if (
      url.pathname === '/.well-known/openid-configuration' ||
      url.pathname === '/.well-known/openid-configuration/mcp' ||
      url.pathname === '/mcp/.well-known/openid-configuration'
    ) {
      return proxyJson(`${supabase}/auth/v1/.well-known/openid-configuration`);
    }

    if (url.pathname === '/mcp' && request.method === 'GET') {
      return json(
        { error: 'unauthorized', message: 'OAuth authorization is required.' },
        401,
        { 'WWW-Authenticate': oauthChallenge(url.origin) }
      );
    }

    if (url.pathname === '/mcp' && request.method === 'POST') {
      const text = await request.clone().text();
      let message = null;
      try { message = JSON.parse(text); }
      catch { return worker.fetch(request, env, ctx); }

      if (message?.method === 'tools/list') {
        const result = await callWorkerRpc(request, env, ctx, message);
        if (result.body?.result?.tools && Array.isArray(result.body.result.tools)) {
          result.body.result.tools.push(CONTEXT_TOOL, PERSONAL_LOANS_TOOL);
          return json(result.body, result.response.status);
        }
        return json(result.body, result.response.status);
      }

      if (message?.method === 'tools/call' && message.params?.name === 'get_financial_context') {
        try {
          const context = await buildFinancialContext(request, env, ctx, message);
          return rpcToolResult(message.id ?? null, context);
        } catch (error) {
          return json({
            jsonrpc: '2.0',
            id: message.id ?? null,
            error: { code: -32603, message: error instanceof Error ? error.message : String(error) }
          });
        }
      }

      if (message?.method === 'tools/call' && message.params?.name === 'get_personal_loans') {
        try {
          const adjustments = await getAllAdjustments(request, env, ctx, message.id);
          return rpcToolResult(message.id ?? null, personalLoansContext(extractPersonalLoans(adjustments)));
        } catch (error) {
          return json({
            jsonrpc: '2.0',
            id: message.id ?? null,
            error: { code: -32603, message: error instanceof Error ? error.message : String(error) }
          });
        }
      }
    }

    return worker.fetch(request, env, ctx);
  }
};