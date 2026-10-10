import type { AppState, Topic, TopicStatus } from '../types'
import { topics, disciplineWeights } from '../data/topics'
import { addDays, daysBetween, today, weekStart, dateStr } from './date'

const statusScore:Record<TopicStatus,number>={nao_iniciado:0,estudando:45,revisando:72,dominado:100}
export const getProgress=(s:AppState,id:string)=>s.progress.find(p=>p.topicId===id)||{topicId:id,status:'nao_iniciado' as TopicStatus,updatedAt:null}
export const accuracyForTopic=(s:AppState,id:string)=>{const qs=s.questionSessions.filter(q=>q.topicId===id);const total=qs.reduce((a,b)=>a+b.total,0);if(!total)return null;return Math.round(qs.reduce((a,b)=>a+b.correct,0)/total*100)}
export const questionCountTopic=(s:AppState,id:string)=>s.questionSessions.filter(q=>q.topicId===id).reduce((a,b)=>a+b.total,0)
export const overallAccuracy=(s:AppState)=>{const total=s.questionSessions.reduce((a,b)=>a+b.total,0);return total?Math.round(s.questionSessions.reduce((a,b)=>a+b.correct,0)/total*100):0}
export const totalQuestions=(s:AppState)=>s.questionSessions.reduce((a,b)=>a+b.total,0)
export const totalStudySeconds=(s:AppState)=>s.sessions.reduce((a,b)=>a+(+b.durationSeconds||0),0)
export const openErrors=(s:AppState)=>s.errors.filter(e=>!e.resolved)
export const weightedCoverage=(s:AppState)=>{
  let n=0,d=0
  for(const [discipline,w] of Object.entries(disciplineWeights)){
    const ts=topics.filter(t=>t.discipline===discipline); if(!ts.length)continue
    const cov=ts.reduce((a,t)=>a+statusScore[getProgress(s,t.id).status],0)/ts.length
    n+=cov*w;d+=w
  }
  return d?Math.round(n/d):0
}
export const streak=(s:AppState)=>{const dates=[...new Set(s.sessions.map(x=>x.date))].sort().reverse();let c=0,d=today();for(;;){if(dates.includes(d)){c++;d=addDays(d,-1)}else if(c===0){d=addDays(d,-1);if(dates.includes(d)){c++;d=addDays(d,-1)}else break}else break}return c}

// ---------- Partes da prova (edital SEDUC-PA, Anexo V, item 1.1) ----------
// Aprovação exige ≥ 50% em CADA parte, separadamente, e nenhum módulo zerado (item 8.16).
export type PartId='basicos'|'especificos'
export const PART_DISCIPLINES:Record<PartId,string[]>={basicos:['Língua Portuguesa','Raciocínio Lógico','Atualidades','Conhecimentos Pedagógicos'],especificos:['Física']}
export const PART_LABEL:Record<PartId,string>={basicos:'Conhecimentos Básicos',especificos:'Conhecimentos Específicos'}
export const partOf=(discipline:string):PartId=>PART_DISCIPLINES.especificos.includes(discipline)?'especificos':'basicos'
export const MIN_PART_QUESTIONS=15
export const MIN_READINESS_QUESTIONS=30
export const CUT_LINE=50
export type PartStatus='sem_dados'|'risco'|'atencao'|'seguro'
export type PartStat={id:PartId;label:string;questions:number;correct:number;accuracy:number|null;coverage:number;status:PartStatus;missing:number;disciplines:Array<{name:string;questions:number;accuracy:number|null;officialQuestions:number}>}
const partStatus=(acc:number|null):PartStatus=>acc===null?'sem_dados':acc<CUT_LINE?'risco':acc<60?'atencao':'seguro'
export function partStats(s:AppState):Record<PartId,PartStat>{
  const out={} as Record<PartId,PartStat>
  for(const id of ['basicos','especificos'] as PartId[]){
    const discs=PART_DISCIPLINES[id]
    const qs=s.questionSessions.filter(q=>discs.includes(q.discipline))
    const questions=qs.reduce((a,b)=>a+b.total,0),correct=qs.reduce((a,b)=>a+b.correct,0)
    const accuracy=questions>=MIN_PART_QUESTIONS?Math.round(correct/questions*100):null
    let n=0,d=0
    const disciplines=discs.map(name=>{
      const ts=topics.filter(t=>t.discipline===name),w=disciplineWeights[name]||0
      if(ts.length){n+=ts.reduce((a,t)=>a+statusScore[getProgress(s,t.id).status],0)/ts.length*w;d+=w}
      const dq=qs.filter(q=>q.discipline===name),tot=dq.reduce((a,b)=>a+b.total,0),cor=dq.reduce((a,b)=>a+b.correct,0)
      return {name,questions:tot,accuracy:tot?Math.round(cor/tot*100):null,officialQuestions:w}
    })
    out[id]={id,label:PART_LABEL[id],questions,correct,accuracy,coverage:d?Math.round(n/d):0,status:partStatus(accuracy),missing:Math.max(0,MIN_PART_QUESTIONS-questions),disciplines}
  }
  return out
}

// Prontidão: só usa componentes com dados reais; sem base mínima, devolve null (nada de valores inventados)
export type Readiness={value:number|null;reason:string;parts:string[]}
export function readinessInfo(s:AppState):Readiness{
  const totalQ=totalQuestions(s)
  if(totalQ<MIN_READINESS_QUESTIONS)return {value:null,reason:`Registre mais ${MIN_READINESS_QUESTIONS-totalQ} questões para calcular`,parts:[]}
  const ps=partStats(s),accs=[ps.basicos.accuracy,ps.especificos.accuracy].filter((x):x is number=>x!==null)
  const acc=accs.length?Math.round(accs.reduce((a,b)=>a+b,0)/accs.length):overallAccuracy(s)
  const comps:Array<[string,number,number]>=[['cobertura do edital',weightedCoverage(s),.35],['acertos',acc,.35]]
  const sim=s.simulations.at(-1)?.percent;if(typeof sim==='number')comps.push(['último simulado',sim,.15])
  const w=comps.reduce((a,c)=>a+c[2],0)
  return {value:Math.round(comps.reduce((a,c)=>a+c[1]*c[2],0)/w),reason:`Baseada em ${comps.map(c=>c[0]).join(', ')}`,parts:comps.map(c=>c[0])}
}
export const readiness=(s:AppState)=>readinessInfo(s).value
export const daysToExam=()=>Math.max(0,daysBetween(today(),'2026-11-29'))
export const topicVisualScore=(s:AppState,t:Topic)=>{const p=getProgress(s,t.id);const a=accuracyForTopic(s,t.id);return Math.round(statusScore[p.status]*.7+(a??statusScore[p.status])*.3)}
export const disciplineStats=(s:AppState)=>Object.keys(disciplineWeights).map(d=>{const ts=topics.filter(t=>t.discipline===d);const score=ts.length?Math.round(ts.reduce((a,t)=>a+topicVisualScore(s,t),0)/ts.length):0;const q=s.questionSessions.filter(x=>x.discipline===d);const total=q.reduce((a,b)=>a+b.total,0);const correct=q.reduce((a,b)=>a+b.correct,0);return {name:d,score,accuracy:total?Math.round(correct/total*100):0,questions:total,dominated:ts.filter(t=>getProgress(s,t.id).status==='dominado').length,totalTopics:ts.length}})
export const statusCounts=(s:AppState)=>topics.reduce((a,t)=>{const st=getProgress(s,t.id).status;a[st]++;return a},{nao_iniciado:0,estudando:0,revisando:0,dominado:0} as Record<TopicStatus,number>)
export function weekStats(s:AppState,offset=0){const a=dateStr(weekStart(offset)),b=dateStr(new Date(weekStart(offset).getTime()+7*86400000));const ss=s.sessions.filter(x=>x.date>=a&&x.date<b),qs=s.questionSessions.filter(x=>x.date>=a&&x.date<b),time=ss.reduce((x,y)=>x+y.durationSeconds,0),total=qs.reduce((x,y)=>x+y.total,0),correct=qs.reduce((x,y)=>x+y.correct,0);return {a,b,time,total,correct,acc:total?Math.round(correct/total*100):0,sessions:ss.length}}
export const weeklySeries=(s:AppState,n=8)=>Array.from({length:n},(_,i)=>{const w=weekStats(s,i-(n-1));return {week:w.a.slice(5).replace('-','/'),hours:+(w.time/3600).toFixed(1),questions:w.total,accuracy:w.acc}})

export const dailySeries=(s:AppState,days=15)=>Array.from({length:days},(_,i)=>{
  const date=addDays(today(),-(days-1-i))
  const ss=s.sessions.filter(x=>x.date===date)
  const qs=s.questionSessions.filter(x=>x.date===date)
  const seconds=ss.reduce((a,b)=>a+(+b.durationSeconds||0),0)
  const total=qs.reduce((a,b)=>a+b.total,0)
  const correct=qs.reduce((a,b)=>a+b.correct,0)
  return {date,day:`${date.slice(8,10)}/${date.slice(5,7)}`,hours:+(seconds/3600).toFixed(1),minutes:Math.round(seconds/60),questions:total,accuracy:total?Math.round(correct/total*100):null}
})

// Mapa de calor: 5 semanas (segunda a domingo), terminando na semana atual
export const activityHeatmap=(s:AppState,weeks=5)=>{const start=dateStr(weekStart(-(weeks-1)));return Array.from({length:weeks*7},(_,i)=>{const date=addDays(start,i);const future=date>today();const seconds=s.sessions.filter(x=>x.date===date).reduce((a,b)=>a+b.durationSeconds,0);const questions=s.questionSessions.filter(x=>x.date===date).reduce((a,b)=>a+b.total,0);return {date,future,minutes:Math.round(seconds/60),questions,score:future?-1:Math.min(4,Math.ceil((seconds/60+questions*1.5)/35))}})}
// ---------- Prioridade ----------
// Rendimento = questões esperadas por hora de estudo da disciplina (questões no edital ÷ horas estimadas no mapa).
// Física ganha peso extra porque também é o conteúdo das 2 questões discursivas (10 pontos, item 12.1 do edital).
export const DISCURSIVE_BOOST=1.5
const disciplineHours:Record<string,number>=topics.reduce((a,t)=>{a[t.discipline]=(a[t.discipline]||0)+t.minutes/60;return a},{} as Record<string,number>)
const rawYield=(d:string)=>(disciplineWeights[d]||0)/Math.max(1,disciplineHours[d]||1)
const avgYield=Object.keys(disciplineWeights).reduce((a,d)=>a+rawYield(d),0)/Math.max(1,Object.keys(disciplineWeights).length)
export const yieldFactor=(d:string)=>Math.max(.7,Math.min(1.6,rawYield(d)*(partOf(d)==='especificos'?DISCURSIVE_BOOST:1)/avgYield))
const PART_BONUS:Record<PartStatus,number>={risco:16,atencao:9,sem_dados:5,seguro:0}
export type Priority={score:number;reasons:string[]}
export function priorityInfo(s:AppState,t:Topic,ps=partStats(s)):Priority{
  const p=getProgress(s,t.id),acc=accuracyForTopic(s,t.id),last=p.updatedAt?dateStr(new Date(p.updatedAt)):null,stale=last?Math.max(0,Math.min(30,daysBetween(last,today()))):30,errs=s.errors.filter(e=>e.topicId===t.id&&!e.resolved).length
  const need=(acc===null?18:Math.max(0,(75-acc)*.9))+Math.min(25,stale*.85)+({nao_iniciado:22,estudando:14,revisando:8,dominado:0}[p.status])+Math.min(16,errs*4)
  const pid=partOf(t.discipline),yf=yieldFactor(t.discipline),part=ps[pid],other=ps[pid==='basicos'?'especificos':'basicos']
  // Parte ainda sem medição enquanto a outra já tem: empurra para medir antes que vire surpresa no corte
  const unmeasured=part.status==='sem_dados'&&other.status!=='sem_dados'
  const bonus=unmeasured?14:PART_BONUS[part.status]
  const reasons:string[]=[]
  if(partOf(t.discipline)==='especificos')reasons.push('Física vale 30 questões e é o tema da discursiva')
  else if(yf>=1.05)reasons.push(`${t.discipline} rende bem por hora de estudo`)
  if(part.status==='risco')reasons.push(`${part.label} abaixo da linha de corte (${part.accuracy}%)`)
  else if(part.status==='atencao')reasons.push(`${part.label} com pouca margem sobre o corte (${part.accuracy}%)`)
  if(unmeasured)reasons.push(`${part.label} ainda sem questões suficientes para medir o corte`)
  if(errs)reasons.push(`${errs} erro(s) em aberto`)
  if(acc!==null&&acc<60)reasons.push(`${acc}% de acertos neste conteúdo`)
  if(p.status==='nao_iniciado'&&reasons.length<2)reasons.push('ainda não iniciado')
  return {score:Math.round(Math.min(100,need*.8*yf+bonus)),reasons}
}
export const priorityScore=(s:AppState,t:Topic)=>priorityInfo(s,t).score
// Fila sugerida: maiores prioridades, com no máximo `perDiscipline` unidades da mesma disciplina para não virar uma lista de uma matéria só
export function suggestionQueue(s:AppState,n=8,perDiscipline=2,exclude:string[]=[]){
  const ps=partStats(s),count:Record<string,number>={}
  const ranked=topics.filter(t=>!exclude.includes(t.id)).map(t=>({t,...priorityInfo(s,t,ps)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)
  const out:typeof ranked=[]
  for(const x of ranked){if(out.length>=n)break;if((count[x.t.discipline]||0)>=perDiscipline)continue;count[x.t.discipline]=(count[x.t.discipline]||0)+1;out.push(x)}
  return out
}
export const nextTopic=(s:AppState)=>{const ps=partStats(s);let best:Topic|undefined,bs=-1;for(const t of topics){const sc=priorityInfo(s,t,ps).score;if(sc>bs||(sc===bs&&best&&(disciplineWeights[t.discipline]||0)>(disciplineWeights[best.discipline]||0))){best=t;bs=sc}}return best}
export const xpInfo=(s:AppState)=>{const xp=Math.round(totalStudySeconds(s)/60)+totalQuestions(s)*2+topics.filter(t=>getProgress(s,t.id).status==='dominado').length*45+s.errors.filter(e=>e.resolved).length*20;const level=Math.floor(xp/500)+1;return {xp,level,current:xp%500,next:500}}
export const recentActivity=(s:AppState)=>[
  ...s.sessions.map(x=>({date:x.createdAt||`${x.date}T12:00:00`,kind:'Estudo',title:x.topicTitle||'Sessão de estudo',detail:`${Math.round(x.durationSeconds/60)} min`})),
  ...s.questionSessions.map(x=>({date:x.createdAt||`${x.date}T12:00:00`,kind:'Questões',title:x.topicTitle,detail:`${x.total} questões • ${x.accuracy}%`}))
].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8)


export type AchievementInfo={id:string;icon:string;title:string;desc:string;current:number;target:number;suffix?:string;done:boolean;pct:number;currentLabel:string;targetLabel:string}
export function achievementData(s:AppState):AchievementInfo[]{
  const totalQ=totalQuestions(s)
  const timeHours=Math.round(totalStudySeconds(s)/360)/10
  const counts=statusCounts(s)
  const studying=topics.filter(t=>['estudando','revisando'].includes(getProgress(s,t.id).status)).length
  const phys=s.questionSessions.filter(q=>q.discipline==='Física')
  const physTot=phys.reduce((a,b)=>a+b.total,0),physCor=phys.reduce((a,b)=>a+b.correct,0),physAcc=physTot?Math.round(physCor/physTot*100):0
  const magnetIds=new Set(topics.filter(t=>t.group==='Eletricidade e Magnetismo').map(t=>t.id))
  const magnetQ=s.questionSessions.filter(q=>magnetIds.has(q.topicId)).reduce((a,b)=>a+b.total,0)
  const simBest=Math.max(0,...s.simulations.map(x=>x.percent||0))
  const imported=s.questionSessions.filter(q=>q.importId).length
  const ps=partStats(s),bothAbove=ps.basicos.accuracy!==null&&ps.especificos.accuracy!==null?Math.min(ps.basicos.accuracy,ps.especificos.accuracy):0
  const discScored=s.discursives.filter(d=>d.score!==null)
  const discBest=Math.max(0,...discScored.map(d=>Math.round((d.score as number)/d.maxScore*100)))
  const physItems=new Set(topics.filter(t=>t.discipline==='Física').map(t=>t.officialItem))
  const physItemsDone=[...physItems].filter(item=>topics.filter(t=>t.officialItem===item&&t.discipline==='Física').every(t=>getProgress(s,t.id).status==='dominado')).length
  const list=[
    {id:'import1',icon:'📥',title:'Primeira lista',desc:'Importar o relatório de uma lista de questões',current:imported,target:1},
    {id:'import20',icon:'🗂️',title:'Vinte listas',desc:'Importar 20 relatórios de listas',current:imported,target:20},
    {id:'q100',icon:'🏅',title:'Primeiras 100',desc:'Resolver 100 questões',current:totalQ,target:100},
    {id:'q500',icon:'🎖️',title:'Meio milhar',desc:'Resolver 500 questões',current:totalQ,target:500},
    {id:'tempo20',icon:'🕒',title:'Carga de estudo',desc:'Acumular 20 horas de estudo',current:timeHours,target:20,suffix:' h'},
    {id:'tempo60',icon:'⏳',title:'Maratona',desc:'Acumular 60 horas de estudo',current:timeHours,target:60,suffix:' h'},
    {id:'streak7',icon:'🔥',title:'Uma semana seguida',desc:'Estudar 7 dias seguidos',current:streak(s),target:7,suffix:' dias'},
    {id:'streak21',icon:'⚡',title:'Três semanas seguidas',desc:'Estudar 21 dias seguidos',current:streak(s),target:21,suffix:' dias'},
    {id:'dom10',icon:'📘',title:'Dez unidades',desc:'Dominar 10 unidades do edital',current:counts.dominado,target:10},
    {id:'dom50',icon:'📚',title:'Cinquenta unidades',desc:'Dominar 50 unidades do edital',current:counts.dominado,target:50},
    {id:'em_andamento',icon:'🧭',title:'Motor ligado',desc:'Ter 5 unidades em andamento',current:studying,target:5},
    {id:'item_fisica',icon:'🧩',title:'Item completo',desc:'Dominar todas as unidades de 5 itens de Física do edital',current:physItemsDone,target:5},
    {id:'fisica75',icon:'⚛️',title:'Física em alta',desc:'Atingir 75% em 100+ questões de Física',current:physAcc,target:75,extra:physTot>=100},
    {id:'magneto',icon:'🧲',title:'Magneto',desc:'Resolver 100 questões de Eletricidade e Magnetismo',current:magnetQ,target:100},
    {id:'corte',icon:'🛡️',title:'Acima do corte',desc:'Ficar acima de 60% em Básicos e em Específicos',current:bothAbove,target:60,suffix:'%'},
    {id:'disc1',icon:'✍️',title:'Primeira discursiva',desc:'Registrar um treino discursivo com nota',current:discScored.length,target:1},
    {id:'disc80',icon:'🖋️',title:'Discursiva forte',desc:'Tirar 80% da nota em um treino discursivo',current:discBest,target:80,suffix:'%'},
    {id:'edital50',icon:'🗺️',title:'Edital 50',desc:'Alcançar 50% de cobertura ponderada',current:weightedCoverage(s),target:50,suffix:'%'},
    {id:'sim70',icon:'📝',title:'Simulado consistente',desc:'Alcançar 70% no melhor simulado',current:simBest,target:70,suffix:'%'},
  ] as Array<{id:string;icon:string;title:string;desc:string;current:number;target:number;suffix?:string;extra?:boolean}>
  return list.map(a=>{const raw=Number.isFinite(a.current)?a.current:0;const done=raw>=a.target&&(a.extra===undefined||a.extra);const pct=Math.max(0,Math.min(100,Math.round(raw/a.target*100)));return {...a,done,pct,currentLabel:`${raw}${a.suffix||''}`,targetLabel:`${a.target}${a.suffix||''}`}})
}

// ---------- Ritmo até a prova ----------
export type Pace={remaining:number;total:number;dominated:number;days:number;neededPerDay:number;last7:number;ratePerDay:number;projected:number;onTrack:boolean;byDiscipline:Array<{name:string;remaining:number;total:number}>}
export function paceInfo(s:AppState):Pace{
  const total=topics.length,dominated=topics.filter(t=>getProgress(s,t.id).status==='dominado').length,remaining=total-dominated
  const days=Math.max(1,daysToExam())
  const since=addDays(today(),-6)
  const last7=s.progress.filter(p=>p.status==='dominado'&&p.updatedAt&&dateStr(new Date(p.updatedAt))>=since).length
  const ratePerDay=last7/7
  const neededPerDay=remaining/days
  const projected=Math.min(total,dominated+Math.round(ratePerDay*days))
  const byDiscipline=Object.keys(disciplineWeights).map(name=>{const ts=topics.filter(t=>t.discipline===name);return {name,total:ts.length,remaining:ts.filter(t=>getProgress(s,t.id).status!=='dominado').length}})
  return {remaining,total,dominated,days,neededPerDay,last7,ratePerDay,projected,onTrack:ratePerDay>=neededPerDay&&ratePerDay>0,byDiscipline}
}

// ---------- Itens do edital (nível intermediário do mapa) ----------
export const itemsOfGroup=(group:string)=>[...new Set(topics.filter(t=>t.group===group).map(t=>t.officialItem))]
