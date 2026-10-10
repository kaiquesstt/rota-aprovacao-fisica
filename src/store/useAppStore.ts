import { create } from 'zustand'
import type { AppState, DiscursiveRecord, Simulation, TimerState, TopicStatus } from '../types'
import type { ImportedReport } from '../lib/reportImport'
import { defaultState, persistState } from '../lib/storage'
import { addDays, today } from '../lib/date'
import { topics } from '../data/topics'
import { TOPIC_MIGRATION } from '../data/topicMigration'
import { notify } from '../lib/feedback'

type Store={
  data:AppState; hydrated:boolean; migrationSource:string; timer:TimerState;
  hydrate:(data:AppState,source:string)=>void; replaceData:(data:AppState)=>void;
  setStatus:(topicId:string,status:TopicStatus)=>void; addQuestionSession:(input:{topicId:string;total:number;correct:number;bank:string;year:number;reason?:string})=>void; deleteQuestionSession:(id:string)=>void;
  toggleErrorResolved:(id:string)=>void; deleteError:(id:string)=>void; syncFromOtherTab:(data:AppState)=>void; addSimulation:(percent:number,total:number,correct:number,split?:Pick<Simulation,'basicTotal'|'basicCorrect'|'specificTotal'|'specificCorrect'>)=>void;
  importReport:(report:ImportedReport,topicId:string,reason?:string)=>boolean; addDiscursive:(d:Omit<DiscursiveRecord,'id'|'createdAt'>)=>void; updateDiscursive:(id:string,patch:Partial<DiscursiveRecord>)=>void; deleteDiscursive:(id:string)=>void;
  startTimer:(topicId:string,preset?:number)=>void; startFreeTimer:(topicId:string)=>void; toggleTimer:()=>void; resetTimer:()=>void; tick:()=>void; finishTimer:()=>void; setTimerTopic:(topicId:string)=>void; setTimerPreset:(preset:number,topicId?:string)=>void; updateTimerQuestions:(patch:Partial<Pick<TimerState,'questionTotal'|'questionCorrect'|'questionBank'|'questionYear'|'questionReason'>>)=>void;
  updateSettings:(patch:Partial<AppState['settings']>)=>void; markAchievementSeen:(id:string)=>void;
}

const TIMER_KEY='rota-timer-v1'
const STALE_RUNNING_MS=30*60*1000
const blankTimer=():TimerState=>({topicId:null,seconds:0,running:false,startedAt:null,anchorSeconds:0,preset:25,type:'Teoria',mode:'countdown',questionTotal:0,questionCorrect:0,questionBank:'',questionYear:new Date().getFullYear(),questionReason:''})
const saveTimer=(timer:TimerState)=>{try{localStorage.setItem(TIMER_KEY,JSON.stringify({...timer,savedAt:Date.now()}))}catch{}}
// Recupera a sessão em andamento. Se ela ficou "rodando" com o app fechado por mais de 30 min,
// volta pausada no último instante em que o app estava aberto (para não somar tempo que não foi estudo).
function loadTimer():{timer:TimerState;message:string}|null{
  try{
    const raw=localStorage.getItem(TIMER_KEY);if(!raw)return null
    const t=JSON.parse(raw) as TimerState&{savedAt?:number}
    if(t&&t.topicId&&TOPIC_MIGRATION[t.topicId])t.topicId=TOPIC_MIGRATION[t.topicId]
    if(!t||!t.topicId||!topics.some(x=>x.id===t.topicId))return null
    const base={...blankTimer(),...t}
    const savedAt=t.savedAt||Date.now()
    const live=base.running&&base.startedAt?(base.anchorSeconds||0)+Math.floor((Date.now()-base.startedAt)/1000):base.seconds
    if(!base.running&&!(base.seconds>0)&&!(base.questionTotal>0))return null
    if(base.running&&base.startedAt&&Date.now()-savedAt>STALE_RUNNING_MS){
      const upTo=Math.max(0,(base.anchorSeconds||0)+Math.floor((savedAt-base.startedAt)/1000))
      return {timer:{...base,seconds:upTo,anchorSeconds:upTo,running:false,startedAt:null},message:'O app ficou fechado por um tempo, então a sessão voltou pausada no último momento registrado.'}
    }
    return {timer:{...base,seconds:Math.max(0,live)},message:base.running?'O cronômetro continua de onde parou.':'Tempo e questões da sessão foram mantidos.'}
  }catch{return null}
}

let saveHandle:number|undefined
const scheduleSave=(state:AppState)=>{window.clearTimeout(saveHandle);saveHandle=window.setTimeout(()=>persistState(state),180)}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7)
const timerElapsed=(timer:TimerState)=>{
  if(!timer.running||!timer.startedAt)return Math.max(0,timer.seconds||0)
  return Math.max(0,(timer.anchorSeconds||0)+Math.floor((Date.now()-timer.startedAt)/1000))
}
const cleanTimerQuestions=(timer:TimerState)=>({...timer,questionTotal:0,questionCorrect:0,questionBank:'',questionYear:new Date().getFullYear(),questionReason:''})

export const useAppStore=create<Store>((set,get)=>({
  data:defaultState(),hydrated:false,migrationSource:'',timer:blankTimer(),
  hydrate:(data,source)=>{const restored=loadTimer();set({data,hydrated:true,migrationSource:source,...(restored?{timer:restored.timer}:{})});if(restored)window.setTimeout(()=>notify('Sessão em andamento recuperada',restored.message,'info'),400)},
  replaceData:(data)=>{set({data});scheduleSave(data)},
  setStatus:(topicId,status)=>set(st=>{const progress=st.data.progress.filter(p=>p.topicId!==topicId);progress.push({topicId,status,updatedAt:new Date().toISOString()});const data={...st.data,progress};scheduleSave(data);notify('Progresso salvo',`Status alterado para ${status==='dominado'?'Dominado':status==='revisando'?'Revisando':status==='estudando'?'Estudando':'Não iniciado'}.`);return {data}}),
  addQuestionSession:(input)=>set(st=>{const t=topics.find(x=>x.id===input.topicId);if(!t)return st;const wrong=Math.max(0,input.total-input.correct),q={id:uid(),topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:input.bank,year:input.year,total:input.total,correct:input.correct,wrong,accuracy:input.total?Math.round(input.correct/input.total*100):0,reason:input.reason||'',notes:'',date:today(),createdAt:new Date().toISOString()};let errors=st.data.errors;if(wrong>0&&input.reason)errors=[{id:uid(),topicId:t.id,title:t.title,reason:input.reason,note:`${wrong} erro(s) em ${input.total} questões`,date:today(),resolved:false,questionSessionId:q.id},...errors];const data={...st.data,questionSessions:[q,...st.data.questionSessions],errors};scheduleSave(data);notify('Bloco de questões salvo',`${input.total} questões registradas • ${q.accuracy}% de acertos.`);return {data}}),
  deleteQuestionSession:(id)=>set(st=>{const data={...st.data,questionSessions:st.data.questionSessions.filter(q=>q.id!==id),errors:st.data.errors.filter(e=>e.questionSessionId!==id)};scheduleSave(data);notify('Registro excluído','Os percentuais e gráficos foram recalculados.','info');return {data}}),
  toggleErrorResolved:(id)=>set(st=>{const e0=st.data.errors.find(e=>e.id===id);const data={...st.data,errors:st.data.errors.map(e=>e.id===id?{...e,resolved:!e.resolved}:e)};scheduleSave(data);notify(e0?.resolved?'Erro reaberto':'Erro resolvido',e0?.resolved?'Ele volta para a lista de pendentes.':'Bom trabalho: esse ponto foi retomado.');return {data}}),
  deleteError:(id)=>set(st=>{const data={...st.data,errors:st.data.errors.filter(e=>e.id!==id)};scheduleSave(data);notify('Registro excluído','','info');return {data}}),
  syncFromOtherTab:(data)=>set({data}), // sem salvar de novo, para não criar eco entre abas
  addSimulation:(percent,total,correct,split)=>set(st=>{const data={...st.data,simulations:[...st.data.simulations,{id:uid(),date:today(),percent,total,correct,name:'Simulado',...(split||{})}]};scheduleSave(data);notify('Simulado salvo',`${percent}% de aproveitamento registrado.`);return {data}}),
  importReport:(r,topicId,reason)=>{
    const st=get(),t=topics.find(x=>x.id===topicId)
    if(!t)return false
    if(st.data.questionSessions.some(q=>q.importId===r.id)){notify('Relatório já importado','Esse relatório já está no seu histórico.','info');return false}
    const now=new Date().toISOString(),qid=uid(),wrong=Math.max(0,r.total-r.correct)
    const q={id:qid,topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:'Lista própria',year:+r.date.slice(0,4)||new Date().getFullYear(),total:r.total,correct:r.correct,wrong,accuracy:Math.round(r.correct/r.total*100),reason:reason||'',notes:'Importado do relatório da lista de questões',date:r.date,createdAt:now,source:'relatorio-html',importId:r.id,durationSeconds:r.durationSeconds,secondsPerQuestion:r.perQuestion.map(x=>x.seconds)}
    const sessions=r.durationSeconds>0?[{id:uid(),topicId:t.id,topicTitle:t.title,discipline:t.discipline,group:t.group,type:'Questões',durationSeconds:r.durationSeconds,date:r.date,createdAt:now},...st.data.sessions]:st.data.sessions
    const errors=wrong>0&&reason?[{id:uid(),topicId:t.id,title:t.title,reason,note:`${wrong} erro(s) em ${r.total} questões${r.perQuestion.length?` (questões ${r.perQuestion.filter(x=>!x.correct).map(x=>x.n).join(', ')})`:''}`,date:r.date,resolved:false,questionSessionId:qid},...st.data.errors]:st.data.errors
    const data={...st.data,sessions,errors,questionSessions:[q,...st.data.questionSessions]}
    set({data});scheduleSave(data)
    notify('Relatório importado',`${r.total} questões • ${q.accuracy}% de acertos${r.durationSeconds?` • ${Math.max(1,Math.round(r.durationSeconds/60))} min`:''}`)
    return true
  },
  addDiscursive:(d)=>set(st=>{const data={...st.data,discursives:[{...d,id:uid(),createdAt:new Date().toISOString()},...st.data.discursives]};scheduleSave(data);notify('Treino discursivo salvo',d.score===null?'Quando tiver a correção, registre a nota.':`Nota ${d.score}/${d.maxScore} registrada.`);return {data}}),
  updateDiscursive:(id,patch)=>set(st=>{const data={...st.data,discursives:st.data.discursives.map(d=>d.id===id?{...d,...patch}:d)};scheduleSave(data);notify('Treino atualizado');return {data}}),
  deleteDiscursive:(id)=>set(st=>{const data={...st.data,discursives:st.data.discursives.filter(d=>d.id!==id)};scheduleSave(data);notify('Treino excluído','','info');return {data}}),
  startTimer:(topicId,preset=25)=>set(st=>({timer:{...cleanTimerQuestions(st.timer),topicId,seconds:0,running:true,startedAt:Date.now(),anchorSeconds:0,preset,type:'Teoria',mode:'countdown'}})),
  startFreeTimer:(topicId)=>set(st=>({timer:{...cleanTimerQuestions(st.timer),topicId,seconds:0,running:false,startedAt:null,anchorSeconds:0,preset:0,type:'Teoria',mode:'countup'}})),
  toggleTimer:()=>set(st=>{
    const current=timerElapsed(st.timer)
    if(st.timer.running)return {timer:{...st.timer,seconds:current,anchorSeconds:current,running:false,startedAt:null}}
    return {timer:{...st.timer,seconds:current,anchorSeconds:current,running:true,startedAt:Date.now()}}
  }),
  resetTimer:()=>set(st=>({timer:{...st.timer,seconds:0,anchorSeconds:0,running:false,startedAt:null}})),
  setTimerPreset:(preset,topicId)=>set(st=>({timer:{...st.timer,topicId:topicId||st.timer.topicId,seconds:0,anchorSeconds:0,preset,running:false,startedAt:null,mode:'countdown'}})),
  tick:()=>set(st=>{if(!st.timer.running||!st.timer.startedAt)return {timer:st.timer};const current=timerElapsed(st.timer);return {timer:{...st.timer,seconds:current}}}),
  finishTimer:()=>set(st=>{
    const elapsed=timerElapsed(st.timer)
    const total=Math.max(0,Math.round(st.timer.questionTotal||0))
    const correct=Math.min(total,Math.max(0,Math.round(st.timer.questionCorrect||0)))
    const t=topics.find(x=>x.id===st.timer.topicId)
    if(!st.timer.topicId||(!elapsed&&total<=0)){
      notify('Nada para salvar','Inicie o cronômetro ou registre as questões desta sessão.','info')
      return {timer:{...st.timer,seconds:0,anchorSeconds:0,running:false,startedAt:null}}
    }
    let sessions=st.data.sessions
    let questionSessions=st.data.questionSessions
    let errors=st.data.errors
    if(elapsed>0){
      const session={id:uid(),topicId:t?.id,topicTitle:t?.title||'Sessão',discipline:t?.discipline,group:t?.group,type:st.timer.type,durationSeconds:elapsed,date:today(),createdAt:new Date().toISOString()}
      sessions=[session,...sessions]
    }
    if(total>0&&t){
      const qid=uid(),wrong=Math.max(0,total-correct),accuracy=Math.round(correct/total*100)
      const q={id:qid,topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:st.timer.questionBank||'',year:st.timer.questionYear||new Date().getFullYear(),total,correct,wrong,accuracy,reason:st.timer.questionReason||'',notes:'Registrado ao encerrar sessão de estudo',date:today(),createdAt:new Date().toISOString()}
      questionSessions=[q,...questionSessions]
      if(wrong>0&&st.timer.questionReason)errors=[{id:uid(),topicId:t.id,title:t.title,reason:st.timer.questionReason,note:`${wrong} erro(s) em ${total} questões`,date:today(),resolved:false,questionSessionId:qid},...errors]
    }
    const data={...st.data,sessions,questionSessions,errors}
    scheduleSave(data)
    const mins=elapsed?Math.max(1,Math.round(elapsed/60)):0
    const accuracy=total?Math.round(correct/total*100):null
    const detail=[elapsed?`${mins} min de estudo`:null,total?`${total} questões`:null,accuracy!==null?`${accuracy}% de acertos`:null].filter(Boolean).join(' • ')
    notify('Sessão concluída ✓',detail||'Seu progresso foi registrado.')
    const reset={...cleanTimerQuestions(st.timer),seconds:0,anchorSeconds:0,running:false,startedAt:null}
    return {data,timer:reset}
  }),
  setTimerTopic:(topicId)=>set(st=>({timer:{...st.timer,topicId}})),
  updateTimerQuestions:(patch)=>set(st=>({timer:{...st.timer,...patch}})),
  updateSettings:(patch)=>set(st=>{const data={...st.data,settings:{...st.data.settings,...patch}};scheduleSave(data);notify('Configurações salvas');return {data}}),
  markAchievementSeen:(id)=>set(st=>{if(st.data.achievementsSeen.includes(id))return st;const data={...st.data,achievementsSeen:[...st.data.achievementsSeen,id]};scheduleSave(data);return {data}})
}))

// Grava a sessão em andamento a cada mudança (inclusive a cada segundo do cronômetro)
useAppStore.subscribe((st,prev)=>{if(st.hydrated&&st.timer!==prev.timer)saveTimer(st.timer)})
