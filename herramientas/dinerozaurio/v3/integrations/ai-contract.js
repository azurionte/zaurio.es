import { validateDecisionCommand } from '../core/decision-engine.js';

export const AI_CONTRACT_VERSION='dz3-ai-contract-1';

export const FINANCIAL_AI_TOOLS=Object.freeze([
  {name:'get_period_summary',readOnly:true,description:'Return one resolved financial period and its explainable ledger summary.'},
  {name:'explain_amount',readOnly:true,description:'Return the exact ledger events contributing to an aggregate.'},
  {name:'get_current_position',readOnly:true,description:'Return the strongest known current account position and unknown truth gaps.'},
  {name:'project_cashflow',readOnly:true,description:'Project future cash flow over a requested horizon.'},
  {name:'evaluate_purchase',readOnly:true,description:'Simulate a purchase against current truth, future commitments and funding risks.'},
  {name:'list_funding_risks',readOnly:true,description:'Return expected transfers that have not been confirmed and affected obligations.'},
  {name:'propose_occurrence_override',readOnly:false,description:'Propose changing one expected occurrence without changing the recurring rule.'},
  {name:'propose_expense_rule_change',readOnly:false,description:'Propose an effective-dated change to an expense rule.'},
  {name:'propose_transfer',readOnly:false,description:'Propose an internal transfer.'},
  {name:'propose_reconciliation',readOnly:false,description:'Propose matching a bank transaction to an expected event.'},
  {name:'propose_savings_change',readOnly:false,description:'Propose a savings configuration change.'},
  {name:'register_planned_purchase',readOnly:false,description:'Propose registering an accepted hypothetical purchase as planned data.'}
]);

export function validateAiToolCall(call){
  if(!call?.name)throw new TypeError('AI tool call name is required');
  const tool=FINANCIAL_AI_TOOLS.find(row=>row.name===call.name);
  if(!tool)throw new RangeError(`Unsupported AI tool: ${call.name}`);
  if(!call.arguments||typeof call.arguments!=='object')throw new TypeError('AI tool arguments are required');
  return{...call,tool,contractVersion:AI_CONTRACT_VERSION};
}

export function aiMutationToDecisionCommand(call){
  const validated=validateAiToolCall(call);
  if(validated.tool.readOnly)throw new RangeError(`${call.name} is read-only and cannot create a mutation command`);
  return validateDecisionCommand({type:call.name,payload:call.arguments,proposedBy:'ai',requiresUserConfirmation:true});
}

export function buildAiTrace({sessionId,requestId,question,toolCalls=[],engineVersion,ledgerFingerprint,result}){
  return{contractVersion:AI_CONTRACT_VERSION,sessionId,requestId,question,engineVersion,ledgerFingerprint,toolCalls:toolCalls.map(validateAiToolCall),result,createdAt:new Date().toISOString()};
}
