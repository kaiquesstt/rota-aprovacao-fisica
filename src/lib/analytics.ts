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
export const retention=(s:AppState)=>{if(!s.reviews.length)return 50;const done=s.reviews.filter(r=>r.lastRating);if(!done.length)return 50;const ok=done.filter(r=>['bom','facil'].includes(String(r.lastRating))).length;return Math.round(ok/done.length*100)}
export const readiness=(s:AppState)=>Math.round(weightedCoverage(s)*.35+(overallAccuracy(s)||40)*.35+retention(s)*.15+(s.simulations.at(-1)?.percent||50)*.15)
export const daysToExam=()=>Math.max(0,daysBetween(today(),'2026-11-29'))
export const topicVisualScore=(s:AppState,t:Topic)=>{const p=getProgress(s,t.id);const a=accuracyForTopic(s,t.id);return Math.round(statusScore[p.status]*.7+(a??statusScore[p.status])*.3)}
export const disciplineStats=(s:AppState)=>Object.keys(disciplineWeights).map(d=>{const ts=topics.filter(t=>t.discipline===d);const score=ts.length?Math.round(ts.reduce((a,t)=>a+topicVisualScore(s,t),0)/ts.length):0;const q=s.questionSessions.filter(x=>x.discipline===d);const total=q.reduce((a,b)=>a+b.total,0);const correct=q.reduce((a,b)=>a+b.correct,0);return {name:d,score,accuracy:total?Math.round(correct/total*100):0,questions:total,dominated:ts.filter(t=>getProgress(s,t.id).status==='dominado').length,totalTopics:ts.length}})
export const statusCounts=(s:AppState)=>topics.reduce((a,t)=>{const st=getProgress(s,t.id).status;a[st]++;return a},{nao_iniciado:0,estudando:0,revisando:0,dominado:0} as Record<TopicStatus,number>)
export function weekStats(s:AppState,offset=0){const a=dateStr(weekStart(offset)),b=dateStr(new Date(weekStart(offset).getTime()+7*86400000));const ss=s.sessions.filter(x=>x.date>=a&&x.date<b),qs=s.questionSessions.filter(x=>x.date>=a&&x.date<b),time=ss.reduce((x,y)=>x+y.durationSeconds,0),total=qs.reduce((x,y)=>x+y.total,0),correct=qs.reduce((x,y)=>x+y.correct,0),revs=s.reviews.filter(r=>r.lastReviewed&&r.lastReviewed.slice(0,10)>=a&&r.lastReviewed.slice(0,10)<b).length;return {a,b,time,total,correct,acc:total?Math.round(correct/total*100):0,revs,sessions:ss.length}}
export const weeklySeries=(s:AppState,n=8)=>Array.from({length:n},(_,i)=>{const w=weekStats(s,i-(n-1));return {week:w.a.slice(5).replace('-','/'),hours:+(w.time/3600).toFixed(1),questions:w.total,accuracy:w.acc,reviews:w.revs}})
export const activityHeatmap=(s:AppState,days=84)=>Array.from({length:days},(_,i)=>{const date=addDays(today(),-(days-1-i));const seconds=s.sessions.filter(x=>x.date===date).reduce((a,b)=>a+b.durationSeconds,0);const questions=s.questionSessions.filter(x=>x.date===date).reduce((a,b)=>a+b.total,0);return {date,minutes:Math.round(seconds/60),questions,score:Math.min(4,Math.ceil((seconds/60+questions*1.5)/35))}})
export const priorityScore=(s:AppState,t:Topic)=>{const p=getProgress(s,t.id),acc=accuracyForTopic(s,t.id),last=p.updatedAt?p.updatedAt.slice(0,10):null,stale=last?Math.max(0,Math.min(30,daysBetween(last,today()))):30,overdue=s.reviews.some(r=>r.topicId===t.id&&r.due<=today()),errs=s.errors.filter(e=>e.topicId===t.id&&!e.resolved).length;let x=(acc===null?18:Math.max(0,(75-acc)*.9))+Math.min(25,stale*.85)+({nao_iniciado:22,estudando:14,revisando:8,dominado:0}[p.status])+ (overdue?12:0)+Math.min(16,errs*4);return Math.round(Math.min(100,x))}
export const nextTopic=(s:AppState)=>topics.slice().sort((a,b)=>priorityScore(s,b)-priorityScore(s,a))[0]
export const xpInfo=(s:AppState)=>{const xp=Math.round(totalStudySeconds(s)/60)+totalQuestions(s)*2+s.reviews.filter(r=>r.lastReviewed).length*8+topics.filter(t=>getProgress(s,t.id).status==='dominado').length*45+s.errors.filter(e=>e.resolved).length*20;const level=Math.floor(xp/500)+1;return {xp,level,current:xp%500,next:500}}
export const recentActivity=(s:AppState)=>[
  ...s.sessions.map(x=>({date:x.createdAt||`${x.date}T12:00:00`,kind:'Estudo',title:x.topicTitle||'Sessão de estudo',detail:`${Math.round(x.durationSeconds/60)} min`})),
  ...s.questionSessions.map(x=>({date:x.createdAt||`${x.date}T12:00:00`,kind:'Questões',title:x.topicTitle,detail:`${x.total} questões • ${x.accuracy}%`}))
].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8)
