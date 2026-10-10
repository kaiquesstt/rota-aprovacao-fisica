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
export const dueReviews=(s:AppState)=>s.reviews.filter(r=>r.due<=today()).sort((a,b)=>a.due.localeCompare(b.due))
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
export const ratedReviews=(s:AppState)=>s.reviews.filter(r=>r.lastRating)
export const retention=(s:AppState):number|null=>{const done=ratedReviews(s);if(done.length<MIN_REVIEWS)return null;const ok=done.filter(r=>['bom','facil'].includes(String(r.lastRating))).length;return Math.round(ok/done.length*100)}

// ---------- Partes da prova (edital SEDUC-PA, Anexo V, item 1.1) ----------
// Aprovação exige ≥ 50% em CADA parte, separadamente, e nenhum módulo zerado (item 8.16).
export type PartId='basicos'|'especificos'
export const PART_DISCIPLINES:Record<PartId,string[]>={basicos:['Língua Portuguesa','Raciocínio Lógico','Atualidades','Conhecimentos Pedagógicos'],especificos:['Física']}
export const PART_LABEL:Record<PartId,string>={basicos:'Conhecimentos Básicos',especificos:'Conhecimentos Específicos'}
export const partOf=(discipline:string):PartId=>PART_DISCIPLINES.especificos.includes(discipline)?'especificos':'basicos'
export const MIN_PART_QUESTIONS=15
export const MIN_READINESS_QUESTIONS=30
export const MIN_REVIEWS=5
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
  const ret=retention(s);if(ret!==null)comps.push(['revisões',ret,.15])
  const sim=s.simulations.at(-1)?.percent;if(typeof sim==='number')comps.push(['último simulado',sim,.15])
  const w=comps.reduce((a,c)=>a+c[2],0)
  return {value:Math.round(comps.reduce((a,c)=>a+c[1]*c[2],0)/w),reason:`Baseada em ${comps.map(c=>c[0]).join(', ')}`,parts:comps.map(c=>c[0])}
}
export const readiness=(s:AppState)=>readinessInfo(s).value
export const daysToExam=()=>Math.max(0,daysBetween(today(),'2026-11-29'))
export const topicVisualScore=(s:AppState,t:Topic)=>{const p=getProgress(s,t.id);const a=accuracyForTopic(s,t.id);return Math.round(statusScore[p.status]*.7+(a??statusScore[p.status])*.3)}
export const disciplineStats=(s:AppState)=>Object.keys(disciplineWeights).map(d=>{const ts=topics.filter(t=>t.discipline===d);const score=ts.length?Math.round(ts.reduce((a,t)=>a+topicVisualScore(s,t),0)/ts.length):0;const q=s.questionSessions.filter(x=>x.discipline===d);const total=q.reduce((a,b)=>a+b.total,0);const correct=q.reduce((a,b)=>a+b.correct,0);return {name:d,score,accuracy:total?Math.round(correct/total*100):0,questions:total,dominated:ts.filter(t=>getProgress(s,t.id).status==='dominado').length,totalTopics:ts.length}})
export const statusCounts=(s:AppState)=>topics.reduce((a,t)=>{const st=getProgress(s,t.id).status;a[st]++;return a},{nao_iniciado:0,estudando:0,revisando:0,dominado:0} as Record<TopicStatus,number>)
export function weekStats(s:AppState,offset=0){const a=dateStr(weekStart(offset)),b=dateStr(new Date(weekStart(offset).getTime()+7*86400000));const ss=s.sessions.filter(x=>x.date>=a&&x.date<b),qs=s.questionSessions.filter(x=>x.date>=a&&x.date<b),time=ss.reduce((x,y)=>x+y.durationSeconds,0),total=qs.reduce((x,y)=>x+y.total,0),correct=qs.reduce((x,y)=>x+y.correct,0),revs=s.reviews.filter(r=>r.lastReviewed&&r.lastReviewed.slice(0,10)>=a&&r.lastReviewed.slice(0,10)<b).length;return {a,b,time,total,correct,acc:total?Math.round(correct/total*100):0,revs,sessions:ss.length}}
export const weeklySeries=(s:AppState,n=8)=>Array.from({length:n},(_,i)=>{const w=weekStats(s,i-(n-1));return {week:w.a.slice(5).replace('-','/'),hours:+(w.time/3600).toFixed(1),questions:w.total,accuracy:w.acc,reviews:w.revs}})

export const dailySeries=(s:AppState,days=15)=>Array.from({length:days},(_,i)=>{
  const date=addDays(today(),-(days-1-i))
  const ss=s.sessions.filter(x=>x.date===date)
  const qs=s.questionSessions.filter(x=>x.date===date)
  const seconds=ss.reduce((a,b)=>a+(+b.durationSeconds||0),0)
  const total=qs.reduce((a,b)=>a+b.total,0)
  const correct=qs.reduce((a,b)=>a+b.correct,0)
  const reviews=s.reviews.filter(r=>r.lastReviewed?.slice(0,10)===date).length
  return {date,day:`${date.slice(8,10)}/${date.slice(5,7)}`,hours:+(seconds/3600).toFixed(1),minutes:Math.round(seconds/60),questions:total,accuracy:total?Math.round(correct/total*100):null,reviews}
})

export const activityHeatmap=(s:AppState,days=84)=>Array.from({length:days},(_,i)=>{const date=addDays(today(),-(days-1-i));const seconds=s.sessions.filter(x=>x.date===date).reduce((a,b)=>a+b.durationSeconds,0);const questions=s.questionSessions.filter(x=>x.date===date).reduce((a,b)=>a+b.total,0);return {date,minutes:Math.round(seconds/60),questions,score:Math.min(4,Math.ceil((seconds/60+questions*1.5)/35))}})
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
  const p=getProgress(s,t.id),acc=accuracyForTopic(s,t.id),last=p.updatedAt?p.updatedAt.slice(0,10):null,stale=last?Math.max(0,Math.min(30,daysBetween(last,today()))):30,overdue=s.reviews.some(r=>r.topicId===t.id&&r.due<=today()),errs=s.errors.filter(e=>e.topicId===t.id&&!e.resolved).length
  const need=(acc===null?18:Math.max(0,(75-acc)*.9))+Math.min(25,stale*.85)+({nao_iniciado:22,estudando:14,revisando:8,dominado:0}[p.status])+(overdue?12:0)+Math.min(16,errs*4)
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
  if(overdue)reasons.push('revisão vencida')
  if(errs)reasons.push(`${errs} erro(s) em aberto`)
  if(acc!==null&&acc<60)reasons.push(`${acc}% de acertos neste conteúdo`)
  if(p.status==='nao_iniciado'&&reasons.length<2)reasons.push('ainda não iniciado')
  return {score:Math.round(Math.min(100,need*.8*yf+bonus)),reasons}
}
export const priorityScore=(s:AppState,t:Topic)=>priorityInfo(s,t).score
export const nextTopic=(s:AppState)=>{const ps=partStats(s);let best:Topic|undefined,bs=-1;for(const t of topics){const sc=priorityInfo(s,t,ps).score;if(sc>bs||(sc===bs&&best&&(disciplineWeights[t.discipline]||0)>(disciplineWeights[best.discipline]||0))){best=t;bs=sc}}return best}
export const xpInfo=(s:AppState)=>{const xp=Math.round(totalStudySeconds(s)/60)+totalQuestions(s)*2+s.reviews.filter(r=>r.lastReviewed).length*8+topics.filter(t=>getProgress(s,t.id).status==='dominado').length*45+s.errors.filter(e=>e.resolved).length*20;const level=Math.floor(xp/500)+1;return {xp,level,current:xp%500,next:500}}
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
  const reviewDone=s.reviews.filter(r=>r.lastReviewed).length
  const phys=s.questionSessions.filter(q=>q.discipline==='Física')
  const physTot=phys.reduce((a,b)=>a+b.total,0),physCor=phys.reduce((a,b)=>a+b.correct,0),physAcc=physTot?Math.round(physCor/physTot*100):0
  const fgv=s.questionSessions.filter(q=>(q.bank||'').toUpperCase()==='FGV')
  const fgvTot=fgv.reduce((a,b)=>a+b.total,0),fgvCor=fgv.reduce((a,b)=>a+b.correct,0),fgvAcc=fgvTot?Math.round(fgvCor/fgvTot*100):0
  const magnetIds=new Set(topics.filter(t=>/magnet|eletricidade/i.test(`${t.group} ${t.title}`)).map(t=>t.id))
  const magnetQ=s.questionSessions.filter(q=>magnetIds.has(q.topicId)).reduce((a,b)=>a+b.total,0)
  const simBest=Math.max(0,...s.simulations.map(x=>x.percent||0))
  const diag=(s.diagnostic?.attempts||[]).map((a:any)=>Number(a?.total?.pct||0)).filter(Number.isFinite)
  const diagGain=diag.length>1?diag[diag.length-1]-diag[0]:0
  const list=[
    {id:'q10',icon:'🎯',title:'Primeiros 10',desc:'Resolver 10 questões',current:totalQ,target:10},
    {id:'q100',icon:'🏅',title:'Primeiros 100',desc:'Resolver 100 questões',current:totalQ,target:100},
    {id:'tempo5',icon:'⏱️',title:'Ritmo inicial',desc:'Acumular 5 horas de estudo',current:timeHours,target:5,suffix:' h'},
    {id:'tempo20',icon:'🕒',title:'Carga de estudo',desc:'Acumular 20 horas de estudo',current:timeHours,target:20,suffix:' h'},
    {id:'streak3',icon:'🔥',title:'Constância 3 dias',desc:'Estudar por 3 dias seguidos',current:streak(s),target:3,suffix:' dias'},
    {id:'streak10',icon:'⚡',title:'Constância 10 dias',desc:'Estudar por 10 dias seguidos',current:streak(s),target:10,suffix:' dias'},
    {id:'dom1',icon:'📘',title:'Primeiro domínio',desc:'Dominar o primeiro conteúdo',current:counts.dominado,target:1},
    {id:'dom10',icon:'📚',title:'Mapa avançando',desc:'Dominar 10 conteúdos',current:counts.dominado,target:10},
    {id:'em_andamento',icon:'🧭',title:'Motor ligado',desc:'Ter 5 conteúdos em andamento',current:studying,target:5},
    {id:'review20',icon:'🔁',title:'Revisor ativo',desc:'Concluir 20 revisões',current:reviewDone,target:20},
    {id:'fisica80',icon:'⚛️',title:'Física em alta',desc:'Atingir 80% em 50+ questões de Física',current:physAcc,target:80,extra:physTot>=50},
    {id:'fgv80',icon:'🏛️',title:'FGV 80',desc:'Atingir 80% em 100 questões FGV',current:fgvAcc,target:80,extra:fgvTot>=100},
    {id:'magneto',icon:'🧲',title:'Magneto',desc:'Resolver 100 questões de eletromagnetismo',current:magnetQ,target:100},
    {id:'edital50',icon:'🗂️',title:'Edital 50',desc:'Alcançar 50% de cobertura ponderada',current:weightedCoverage(s),target:50,suffix:'%'},
    {id:'sim70',icon:'📝',title:'Simulado consistente',desc:'Alcançar 70% no melhor simulado',current:simBest,target:70,suffix:'%'},
    {id:'diag10',icon:'🚀',title:'Evolução visível',desc:'Melhorar 10 p.p. no diagnóstico',current:diagGain,target:10,suffix:' p.p.'},
  ] as Array<{id:string;icon:string;title:string;desc:string;current:number;target:number;suffix?:string;extra?:boolean}>
  return list.map(a=>{const raw=Number.isFinite(a.current)?a.current:0;const done=raw>=a.target&&(a.extra===undefined||a.extra);const pct=Math.max(0,Math.min(100,Math.round(raw/a.target*100)));return {...a,done,pct,currentLabel:`${raw}${a.suffix||''}`,targetLabel:`${a.target}${a.suffix||''}`}})
}
