import { assertMinor } from './money.js';
import { queryLedger } from './ledger.js';
import { assertIsoDay } from './dates.js';

function key(accountId, bucketId = null) {
  return `${accountId || '__unassigned__'}|${bucketId || '__free__'}`;
}

function latestObservation(observations, accountId, bucketId, asOf) {
  return (observations || [])
    .filter(row => row.accountId === accountId && (row.bucketId || null) === (bucketId || null) && String(row.observedAt).slice(0, 10) <= asOf)
    .sort((a, b) => String(b.observedAt).localeCompare(String(a.observedAt)))[0] || null;
}

function eventDay(event) {
  return String(event.occurredAt || event.scheduledAt || '').slice(0, 10);
}

export function resolveAccountState({
  accounts = [],
  buckets = [],
  events = [],
  transfers = [],
  observations = [],
  from,
  asOf
}) {
  assertIsoDay(from, 'from');
  assertIsoDay(asOf, 'asOf');
  const rows = queryLedger(events, { from, to: asOf });
  const balances = new Map();
  const provenance = new Map();

  const ensure = (accountId, bucketId = null) => {
    const k = key(accountId, bucketId);
    if (!balances.has(k)) balances.set(k, 0);
    if (!provenance.has(k)) provenance.set(k, []);
    return k;
  };

  for (const account of accounts) ensure(account.id, null);
  for (const bucket of buckets) ensure(bucket.accountId, bucket.id);

  for (const event of rows) {
    if (!event.accountId) continue;
    const k = ensure(event.accountId, event.bucketId || null);
    const amount = assertMinor(Number(event.amountMinor), 'event.amountMinor');
    balances.set(k, balances.get(k) + amount);
    provenance.get(k).push({ kind: 'event', id: event.id, day: eventDay(event), amountMinor: amount });
  }

  for (const transfer of transfers || []) {
    if (!['confirmed', 'actual'].includes(transfer.status)) continue;
    const day = String(transfer.occurredAt || transfer.expectedAt || '').slice(0, 10);
    if (!day || day < from || day > asOf) continue;
    const amount = Math.abs(assertMinor(Number(transfer.amountMinor), 'transfer.amountMinor'));
    const outKey = ensure(transfer.fromAccountId, transfer.fromBucketId || null);
    const inKey = ensure(transfer.toAccountId, transfer.toBucketId || null);
    balances.set(outKey, balances.get(outKey) - amount);
    balances.set(inKey, balances.get(inKey) + amount);
    provenance.get(outKey).push({ kind: 'transfer_out', id: transfer.id, day, amountMinor: -amount });
    provenance.get(inKey).push({ kind: 'transfer_in', id: transfer.id, day, amountMinor: amount });
  }

  const reconciliations = [];
  for (const [k, computed] of [...balances.entries()]) {
    const [accountId, rawBucket] = k.split('|');
    if (accountId === '__unassigned__') continue;
    const bucketId = rawBucket === '__free__' ? null : rawBucket;
    const observation = latestObservation(observations, accountId, bucketId, asOf);
    if (!observation) continue;
    const observed = assertMinor(Number(observation.amountMinor), 'observation.amountMinor');
    const observationDay = String(observation.observedAt).slice(0, 10);
    const items = provenance.get(k) || [];
    const postObservationDelta = items.filter(row => row.day > observationDay).reduce((sum, row) => sum + row.amountMinor, 0);
    const observedCurrent = observed + postObservationDelta;
    balances.set(k, observedCurrent);
    reconciliations.push({ accountId, bucketId, observationId: observation.id, computedMinor: computed, observedMinor: observed, currentMinor: observedCurrent });
  }

  const accountStates = accounts.map(account => {
    const folderRows = buckets.filter(bucket => bucket.accountId === account.id).map(bucket => ({
      id: bucket.id,
      name: bucket.name,
      balanceMinor: balances.get(key(account.id, bucket.id)) || 0
    }));
    const freeMinor = balances.get(key(account.id, null)) || 0;
    const totalMinor = freeMinor + folderRows.reduce((sum, bucket) => sum + bucket.balanceMinor, 0);
    return { id: account.id, name: account.name, isPrimary: !!account.isPrimary, freeMinor, buckets: folderRows, totalMinor };
  });

  const totalWealthMinor = accountStates.reduce((sum, account) => sum + account.totalMinor, 0);
  const splitMinor = accountStates.reduce((sum, account) => sum + account.freeMinor + account.buckets.reduce((n, bucket) => n + bucket.balanceMinor, 0), 0);

  return {
    asOf,
    totalWealthMinor,
    accounts: accountStates,
    reconciliations,
    diagnostics: {
      totalWealthMinor,
      splitMinor,
      invariantDifferenceMinor: totalWealthMinor - splitMinor,
      eventCount: rows.length,
      transferCount: (transfers || []).filter(row => ['confirmed', 'actual'].includes(row.status)).length
    }
  };
}

export function assertAccountingInvariants(state) {
  if (state.diagnostics.invariantDifferenceMinor !== 0) throw new Error('Accounting invariant failed: account split differs from total wealth');
  for (const account of state.accounts) {
    const split = account.freeMinor + account.buckets.reduce((sum, bucket) => sum + bucket.balanceMinor, 0);
    if (split !== account.totalMinor) throw new Error(`Accounting invariant failed for account ${account.id}`);
  }
  return true;
}
