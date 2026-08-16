import { evaluateAffordability } from './projection-engine.js';
import { assertMinor } from './money.js';

export const DECISION_ENGINE_VERSION = 'dz3-decision-1';

export function evaluatePurchaseDecision({
  openingBalanceMinor,
  events,
  from,
  to,
  amountMinor,
  purchaseDate,
  safetyFloorMinor = 0,
  missingFundingRisks = []
}) {
  assertMinor(amountMinor, 'amountMinor');
  const affordability = evaluateAffordability({
    openingBalanceMinor,
    events,
    from,
    to,
    purchaseAmountMinor: amountMinor,
    purchaseDate,
    safetyFloorMinor
  });

  const fundingRisks = (missingFundingRisks || []).filter(risk => !risk.firstRiskDate || risk.firstRiskDate >= purchaseDate);
  const operationallySafe = fundingRisks.length === 0;
  const affordable = affordability.affordable && operationallySafe;
  const blockers = [
    ...(!affordability.affordable ? affordability.dependencies.filter(row => row.amountMinor < 0) : []),
    ...fundingRisks.map(risk => ({
      type: 'missing_transfer',
      date: risk.firstRiskDate,
      amountMinor: -Math.abs(risk.amountMinor),
      toAccountId: risk.toAccountId,
      affectedEvents: risk.affectedEvents
    }))
  ];

  return {
    engineVersion: DECISION_ENGINE_VERSION,
    decisionType: 'purchase',
    affordable,
    financiallyAffordable: affordability.affordable,
    operationallySafe,
    riskLevel: !affordable ? 'high' : affordability.riskLevel,
    amountMinor,
    safeSpendableMinor: affordability.safeSpendableMinor,
    minimumProjectedBalanceMinor: affordability.minimumAfterMinor,
    closingProjectedBalanceMinor: affordability.closingAfterMinor,
    dependencies: affordability.dependencies,
    fundingRisks,
    blockers,
    explanationFacts: {
      minimumBeforeMinor: affordability.minimumBeforeMinor,
      minimumAfterMinor: affordability.minimumAfterMinor,
      closingBeforeMinor: affordability.closingBeforeMinor,
      closingAfterMinor: affordability.closingAfterMinor,
      safetyFloorMinor
    }
  };
}

export function validateDecisionCommand(command) {
  if (!command || typeof command !== 'object') throw new TypeError('command is required');
  const allowed = new Set([
    'propose_expense_rule_change',
    'propose_occurrence_override',
    'propose_transfer',
    'propose_reconciliation',
    'propose_savings_change',
    'register_planned_purchase'
  ]);
  if (!allowed.has(command.type)) throw new RangeError(`Unsupported decision command: ${command.type}`);
  if (!command.payload || typeof command.payload !== 'object') throw new TypeError('command payload is required');
  return { ...command, validated: true, validatedBy: DECISION_ENGINE_VERSION };
}
