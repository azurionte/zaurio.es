import { buildPeriodView, currentPosition, answerCanIBuy } from '../../../herramientas/dinerozaurio/v3/application/financial-service.js';
import { majorToMinor } from '../../../herramientas/dinerozaurio/v3/core/money.js';

const SERVER_NAME = 'dinerozaurio-finance-v3';
const SERVER_VERSION = '3.0.0-preprod';
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const MONTH = { type:'string', pattern:'^\\d{4}-(0[1-9]|1[0-2])$', description:'Financial label month in YYYY-MM format.' };
const DAY = { type:'string', pattern:'^\\d{4}-\\d{2}-\\d{2}$', description:'Date in YYYY-MM-DD format.' };

const TOOLS = [
  { name:'get_financial_overview', description:'Get the authenticated user\'s DineroZaurio v3 financial period summary using the canonical Financial Core and funding-cycle semantics.', inputSchema:{type:'object',properties:{month:MONTH},additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_period_snapshot', description:'Get the exact strongest-evidence ledger events, account state, funding risks and totals that explain a DineroZaurio v3 period.', inputSchema:{type:'object',properties:{month:MONTH},required:['month'],additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_financial_timeline', description:'Get canonical v3 period totals across a range of labelled months.', inputSchema:{type:'object',properties:{from_month:MONTH,to_month:MONTH},required:['from_month','to_month'],additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_current_position', description:'Get the strongest known current account position. Returns unknown/stale accounts instead of inventing balances.', inputSchema:{type:'object',properties:{as_of:DAY},additionalProperties:false}, annotations:READ_ONLY },
  { name:'evaluate_purchase', description:'Deterministically simulate whether a purchase is safe after considering current confirmed position, future obligations and missing funding transfers. This never writes financial data.', inputSchema:{type:'object',properties:{amount:{type:'number',exclusiveMinimum:0},purchase_date:DAY,month:MONTH,safety_floor:{type:'number',minimum:0},horizon_end:DAY},required:['amount'],additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_incomes', description:'List v3 income rules for the authenticated plan.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_expenses', description:'List v3 expense rules for the authenticated plan.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_debts', description:'List v3 debts and their schedules for the authenticated plan.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:READ_ONLY },
  { name:'get_savings_goals', description:'List v3 savings goals for the authenticated plan.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:READ_ONLY }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ok:true,service:SERVER_NAME,version:SERVER_VERSION,financialCore:'v3'});
    if (url.pathname === '/.well-known/oauth-protected-resource' || url.pathname === '/.well-known/oauth-protected-resource/mcp') return protectedResourceMetadata(url,env);
    if (url.pathname !== '/mcp') return json({error:'Not found'},404);
    if (request.method !== 'POST') return new Response(null,{status:405,headers:{Allow:'POST'}});
    const missing = ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY'].filter(key=>!env[key]);
    if (missing.length) return json({error:'Server is not configured',missing},503);
    const accessToken = bearerToken(request);
    if (!accessToken) return oauthUnauthorized(url);
    const user = await authenticatedUser(env,accessToken);
    if (!user) return oauthUnauthorized(url,'invalid_token');
    let message;
    try { message = await request.json(); } catch { return rpcError(null,-32700,'Parse error'); }
    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return rpcError(message?.id ?? null,-32600,'Invalid Request');
    try {
      const response = await handleRpc(message,env,accessToken,user);
      if (response === null) return new Response(null,{status:202});
      return json(response);
    } catch (error) {
      console.error('DineroZaurio v3 MCP error',error);
      return rpcError(message.id ?? null,-32603,'Internal error',{message:safeError(error)});
    }
  }
};

async function handleRpc(message,env,token,user){
  const id=message.id;
  if(message.method==='initialize') return rpcResult(id,{protocolVersion:message.params?.protocolVersion||'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:SERVER_NAME,version:SERVER_VERSION}});
  if(message.method==='notifications/initialized'||message.method==='notifications/cancelled') return null;
  if(message.method==='ping') return rpcResult(id,{});
  if(message.method==='tools/list') return rpcResult(id,{tools:TOOLS});
  if(message.method==='tools/call'){
    const value=await callTool(message.params?.name,message.params?.arguments||{},env,token,user);
    return rpcResult(id,{content:[{type:'text',text:JSON.stringify(value)}]});
  }
  return rpcErrorObject(id,-32601,'Method not found');
}

async function callTool(name,args,env,token,user){
  const repository=new RestV3Repository(env,token,user.id);
  const plan=await repository.getPlanForCurrentUser();
  if(!plan) throw new Error('No active DineroZaurio v3 plan is visible for the authenticated user.');
  const state=await repository.loadPlanState(plan.id);
  const month=validMonth(args.month)?args.month:currentMonth(env.FINANCE_TIMEZONE||state.plan.timezone||'Europe/Madrid');
  switch(name){
    case 'get_financial_overview': return compactPeriod(buildPeriodView(state,month));
    case 'get_period_snapshot': return buildPeriodView(state,month);
    case 'get_financial_timeline': {
      validateRange(args.from_month,args.to_month);
      const months=monthsInRange(args.from_month,args.to_month);
      if(months.length>60) throw new Error('Maximum timeline is 60 periods.');
      return {fromMonth:args.from_month,toMonth:args.to_month,periods:months.map(label=>compactPeriod(buildPeriodView(state,label)))};
    }
    case 'get_current_position': return currentPosition(state,validDay(args.as_of)?args.as_of:todayInZone(env.FINANCE_TIMEZONE||state.plan.timezone||'Europe/Madrid'));
    case 'evaluate_purchase': {
      const asOf=todayInZone(env.FINANCE_TIMEZONE||state.plan.timezone||'Europe/Madrid');
      const purchaseDate=validDay(args.purchase_date)?args.purchase_date:asOf;
      const decisionMonth=validMonth(args.month)?args.month:month;
      return answerCanIBuy({state,labelMonth:decisionMonth,amountMinor:majorToMinor(Number(args.amount)),purchaseDate,horizonEnd:validDay(args.horizon_end)?args.horizon_end:null,safetyFloorMinor:majorToMinor(Number(args.safety_floor||0)),asOf});
    }
    case 'get_incomes': return state.incomeRules;
    case 'get_expenses': return state.expenseRules;
    case 'get_debts': return state.debts.map(debt=>({...debt,schedule:state.debtSchedules.find(row=>row.debtId===debt.id)||null,adjustments:state.debtAdjustments.filter(row=>row.debtId===debt.id)}));
    case 'get_savings_goals': return state.savingsGoals;
    default: throw new Error(`Unknown tool: ${String(name)}`);
  }
}

function compactPeriod(view){
  const totals=view.summary?.totalsByType||{};
  return {engineVersion:view.engineVersion,labelMonth:view.labelMonth,period:view.period,currency:'EUR',incomeMinor:Number(totals.income||0),expenseMinor:Math.abs(Number(totals.expense||0)+Number(totals.adjustment||0)),debtMinor:Math.abs(Number(totals.debt_payment||0)),savingsMinor:Math.abs(Number(totals.saving_reservation||0)),netMinor:Number(view.summary?.netMinor||0),confirmedFacts:(view.summary?.events||[]).filter(event=>['actual','confirmed'].includes(event.status)).length,fundingRisks:view.fundingRisks||[]};
}

class RestV3Repository {
  constructor(env,token,userId){this.env=env;this.token=token;this.userId=userId;}
  async query(table,params={}){
    const url=new URL(`${this.env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/${table}`);
    url.searchParams.set('select','*');
    for(const[k,v]of Object.entries(params)) if(v!==undefined&&v!==null) url.searchParams.set(k,v);
    const response=await fetch(url,{headers:{apikey:this.env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${this.token}`,Accept:'application/json'}});
    if(!response.ok) throw new Error(`Supabase ${table}: ${response.status} ${await response.text()}`);
    return response.json();
  }
  async getPlanForCurrentUser(){const rows=await this.query('dz3_plans',{user_id:`eq.${this.userId}`,status:'eq.active',order:'updated_at.desc',limit:'1'});return camel(rows[0]||null);}
  async loadPlanState(planId){
    const byPlan=table=>this.query(table,{plan_id:`eq.${planId}`}).then(camelRows);
    const [plans,accounts,recurrenceRules,incomeRules,expenseRules,debts,savingsGoals,eventOverrides,financialEvents,transferRules,transfers,observations,ruleVersions]=await Promise.all([
      this.query('dz3_plans',{id:`eq.${planId}`,limit:'1'}).then(camelRows),byPlan('dz3_accounts'),byPlan('dz3_recurrence_rules'),byPlan('dz3_income_rules'),byPlan('dz3_expense_rules'),byPlan('dz3_debts'),byPlan('dz3_savings_goals'),byPlan('dz3_event_overrides'),byPlan('dz3_financial_events'),byPlan('dz3_transfer_rules'),byPlan('dz3_transfers'),byPlan('dz3_balance_observations'),byPlan('dz3_rule_versions')
    ]);
    const accountIds=accounts.map(x=>x.id),debtIds=debts.map(x=>x.id);
    const [buckets,debtSchedules,debtAdjustments]=await Promise.all([
      accountIds.length?this.query('dz3_account_buckets',{account_id:`in.(${accountIds.join(',')})`}).then(camelRows):[],
      debtIds.length?this.query('dz3_debt_schedules',{debt_id:`in.(${debtIds.join(',')})`}).then(camelRows):[],
      debtIds.length?this.query('dz3_debt_adjustments',{debt_id:`in.(${debtIds.join(',')})`}).then(camelRows):[]
    ]);
    return {plan:plans[0],accounts,buckets,recurrenceRules,incomeRules,expenseRules,debts,debtSchedules,debtAdjustments,savingsGoals,eventOverrides,financialEvents,transferRules,transfers,observations,ruleVersions};
  }
}

function camel(row){if(!row)return row;const out={};for(const[k,v]of Object.entries(row))out[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())]=v;return out;}
function camelRows(rows){return(rows||[]).map(camel);}
function bearerToken(request){const value=request.headers.get('Authorization')||'';const match=value.match(/^Bearer\s+(.+)$/i);return match?.[1]||null;}
async function authenticatedUser(env,token){const response=await fetch(`${env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});if(!response.ok)return null;return response.json();}
function protectedResourceMetadata(url,env){return json({resource:`${url.origin}/mcp`,authorization_servers:[`${env.SUPABASE_URL.replace(/\/$/,'')}/auth/v1`],scopes_supported:['email','profile'],bearer_methods_supported:['header']});}
function oauthUnauthorized(url,error=null){const metadata=`${url.origin}/.well-known/oauth-protected-resource`;const parts=[`Bearer resource_metadata="${metadata}"`];if(error)parts.push(`error="${error}"`);return json({error:error||'unauthorized',message:'OAuth authorization is required.'},401,{'WWW-Authenticate':parts.join(', ')});}
function validMonth(value){return typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value);}
function validDay(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);}
function currentMonth(zone){return todayInZone(zone).slice(0,7);}
function todayInZone(zone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=t=>parts.find(p=>p.type===t)?.value;return`${get('year')}-${get('month')}-${get('day')}`;}
function addMonth(ym,n){const[y,m]=ym.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+n,1));return`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
function monthsInRange(from,to){const out=[];for(let cur=from;cur<=to;cur=addMonth(cur,1))out.push(cur);return out;}
function validateRange(from,to){if(!validMonth(from)||!validMonth(to)||from>to)throw new Error('Invalid month range.');}
function json(body,status=200,extra={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}});}
function rpcResult(id,result){return{jsonrpc:'2.0',id,result};}
function rpcErrorObject(id,code,message,data){return{jsonrpc:'2.0',id,error:{code,message,...(data===undefined?{}:{data})}};}
function rpcError(id,code,message,data){return json(rpcErrorObject(id,code,message,data));}
function safeError(error){return error instanceof Error?error.message:String(error);}
