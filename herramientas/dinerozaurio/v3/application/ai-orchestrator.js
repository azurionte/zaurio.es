import { buildPeriodView, answerCanIBuy, currentPosition } from './financial-service.js';
import { validateAiToolCall, aiMutationToDecisionCommand, AI_CONTRACT_VERSION } from '../integrations/ai-contract.js';

export const AI_ORCHESTRATOR_VERSION='dz3-ai-orchestrator-1';

function fingerprint(view){
  const text=(view?.summary?.events||[]).map(e=>[e.sourceType,e.sourceId,e.originalScheduledAt||e.scheduledAt,e.amountMinor,e.evidenceLevel].join(':')).sort().join('|');
  let hash=2166136261;
  for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return (hash>>>0).toString(16).padStart(8,'0');
}

export class FinancialAiOrchestrator {
  constructor({repository,state}){this.repository=repository;this.state=state;}
  setState(state){this.state=state;}

  async createSession(){
    const{data,error}=await this.repository.client.from('dz3_decision_sessions').insert({plan_id:this.state.plan.id,source:'chat',metadata:{contractVersion:AI_CONTRACT_VERSION,orchestratorVersion:AI_ORCHESTRATOR_VERSION}}).select().single();
    if(error)throw error;return data;
  }

  async recordRequest({sessionId,question}){
    const{data,error}=await this.repository.client.from('dz3_decision_requests').insert({session_id:sessionId,question}).select().single();
    if(error)throw error;return data;
  }

  executeReadTool(call){
    const validated=validateAiToolCall(call),args=validated.arguments;
    if(!validated.tool.readOnly)throw new RangeError('Mutation tools must be proposed, not executed directly');
    if(call.name==='get_period_summary')return buildPeriodView(this.state,args.labelMonth,args.asOf);
    if(call.name==='explain_amount')return buildPeriodView(this.state,args.labelMonth,args.asOf).explanation;
    if(call.name==='get_current_position')return currentPosition(this.state,args.asOf);
    if(call.name==='evaluate_purchase')return answerCanIBuy({state:this.state,...args});
    if(call.name==='list_funding_risks')return buildPeriodView(this.state,args.labelMonth,args.asOf).fundingRisks;
    if(call.name==='project_cashflow'){
      const months=args.labelMonths||[args.labelMonth];
      return months.map(labelMonth=>{const view=buildPeriodView(this.state,labelMonth,args.asOf);return{labelMonth,period:view.period,summary:view.summary,fundingRisks:view.fundingRisks};});
    }
    throw new RangeError(`Read tool not implemented: ${call.name}`);
  }

  proposeMutation(call){return aiMutationToDecisionCommand(call);}

  async persistEvaluation({requestId,labelMonth,toolCalls,result}){
    const view=labelMonth?buildPeriodView(this.state,labelMonth):null;
    const payload={request_id:requestId,engine_version:view?.engineVersion||'unknown',ledger_version:fingerprint(view),evaluation_type:'ai_chat',input_snapshot:{toolCalls},result,metadata:{contractVersion:AI_CONTRACT_VERSION,orchestratorVersion:AI_ORCHESTRATOR_VERSION}};
    const{data,error}=await this.repository.client.from('dz3_decision_evaluations').insert(payload).select().single();
    if(error)throw error;return data;
  }

  async persistProposedAction({evaluationId,command}){
    const validated=aiMutationToDecisionCommand(command);
    const{data,error}=await this.repository.client.from('dz3_decision_actions').insert({evaluation_id:evaluationId,action_type:validated.type,status:'proposed',proposed_change:validated.payload,metadata:{validatedBy:validated.validatedBy,requiresUserConfirmation:true}}).select().single();
    if(error)throw error;return data;
  }
}
