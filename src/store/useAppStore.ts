import { create } from 'zustand'
import type { AppState, TimerState, TopicStatus } from '../types'
import { defaultState, persistState } from '../lib/storage'
import { addDays, today } from '../lib/date'
import { topics } from '../data/topics'
import { notify } from '../lib/feedback'

type Store={
  data:AppState; hydrated:boolean; migrationSource:string; timer:TimerState;
  hydrate:(data:AppState,source:string)=>void; replaceData:(data:AppState)=>void;
  setStatus:(topicId:string,status:TopicStatus)=>void; addQuestionSession:(input:{topicId:string;total:number;correct:number;bank:string;year:number;reason?:string})=>void; deleteQuestionSession:(id:string)=>void;
  toggleErrorResolved:(id:string)=>void; rateReview:(id:string,rating:'errei'|'dificil'|'bom'|'facil')=>void; addSimulation:(percent:number,total:number,correct:number)=>void;
  startTimer:(topicId:string,preset?:number)=>void; startFreeTimer:(topicId:string)=>void; toggleTimer:()=>void; resetTimer:()=>void; tick:()=>void; finishTimer:()=>void; setTimerTopic:(topicId:string)=>void; setTimerPreset:(preset:number,topicId?:string)=>void; updateTimerQuestions:(patch:Partial<Pick<TimerState,'questionTotal'|'questionCorrect'|'questionBank'|'questionYear'|'questionReason'>>)=>void;
  updateSettings:(patch:Partial<AppState['settings']>)=>void; markAchievementSeen:(id:string)=>void;
}

let saveHandle:number|undefined
const scheduleSave=(state:AppState)=>{window.clearTimeout(saveHandle);saveHandle=window.setTimeout(()=>persistState(state),180)}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7)
const timerElapsed=(timer:TimerState)=>{
  if(!timer.running||!timer.startedAt)return Math.max(0,timer.seconds||0)
  return Math.max(0,(timer.anchorSeconds||0)+Math.floor((Date.now()-timer.startedAt)/1000))
}
const cleanTimerQuestions=(timer:TimerState)=>({...timer,questionTotal:0,questionCorrect:0,questionBank:'FGV',questionYear:new Date().getFullYear(),questionReason:''})

export const useAppStore=create<Store>((set,get)=>({
  data:defaultState(),hydrated:false,migrationSource:'',timer:{topicId:null,seconds:0,running:false,startedAt:null,anchorSeconds:0,preset:25,type:'Teoria',mode:'countdown',questionTotal:0,questionCorrect:0,questionBank:'FGV',questionYear:new Date().getFullYear(),questionReason:''},
  hydrate:(data,source)=>set({data,hydrated:true,migrationSource:source}),
  replaceData:(data)=>{set({data});scheduleSave(data)},
  setStatus:(topicId,status)=>set(st=>{const progress=st.data.progress.filter(p=>p.topicId!==topicId);progress.push({topicId,status,updatedAt:new Date().toISOString()});let reviews=st.data.reviews;if(status!=='nao_iniciado'&&!reviews.some(r=>r.topicId===topicId))reviews=[...reviews,{id:uid(),topicId,due:addDays(today(),1),interval:1,ease:2.3,count:0,lastRating:null,lastReviewed:null}];const data={...st.data,progress,reviews};scheduleSave(data);notify('Progresso salvo',`Status alterado para ${status==='dominado'?'Dominado':status==='revisando'?'Revisando':status==='estudando'?'Estudando':'Não iniciado'}.`);return {data}}),
  addQuestionSession:(input)=>set(st=>{const t=topics.find(x=>x.id===input.topicId);if(!t)return st;const wrong=Math.max(0,input.total-input.correct),q={id:uid(),topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:input.bank,year:input.year,total:input.total,correct:input.correct,wrong,accuracy:input.total?Math.round(input.correct/input.total*100):0,reason:input.reason||'',notes:'',date:today(),createdAt:new Date().toISOString()};let errors=st.data.errors;if(wrong>0&&input.reason)errors=[{id:uid(),topicId:t.id,title:t.title,reason:input.reason,note:`${wrong} erro(s) em ${input.total} questões`,date:today(),resolved:false,questionSessionId:q.id},...errors];const data={...st.data,questionSessions:[q,...st.data.questionSessions],errors};scheduleSave(data);notify('Bloco de questões salvo',`${input.total} questões registradas • ${q.accuracy}% de acertos.`);return {data}}),
  deleteQuestionSession:(id)=>set(st=>{const data={...st.data,questionSessions:st.data.questionSessions.filter(q=>q.id!==id),errors:st.data.errors.filter(e=>e.questionSessionId!==id)};scheduleSave(data);notify('Registro excluído','Os percentuais e gráficos foram recalculados.','info');return {data}}),
  toggleErrorResolved:(id)=>set(st=>{const data={...st.data,errors:st.data.errors.map(e=>e.id===id?{...e,resolved:!e.resolved}:e)};scheduleSave(data);return {data}}),
  rateReview:(id,rating)=>set(st=>{const score={errei:1,dificil:2,bom:3,facil:4}[rating];const reviews=st.data.reviews.map(r=>{if(r.id!==id)return r;let interval=r.interval||1;if(score===1)interval=1;else if(score===2)interval=Math.max(2,Math.round(interval*1.4));else if(score===3)interval=Math.max(3,Math.round(interval*2));else interval=Math.max(5,Math.round(interval*2.7));return {...r,interval,due:addDays(today(),interval),count:(r.count||0)+1,lastRating:rating,lastReviewed:new Date().toISOString()}});const data={...st.data,reviews};scheduleSave(data);notify('Revisão registrada',rating==='errei'?'O conteúdo voltará mais cedo para sua fila.':rating==='dificil'?'A próxima revisão foi ajustada.':'Seu intervalo de revisão foi atualizado.');return {data}}),
  addSimulation:(percent,total,correct)=>set(st=>{const data={...st.data,simulations:[...st.data.simulations,{id:uid(),date:today(),percent,total,correct,name:'Simulado'}]};scheduleSave(data);notify('Simulado salvo',`${percent}% de aproveitamento registrado.`);return {data}}),
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
      const q={id:qid,topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:st.timer.questionBank||'Sessão de estudo',year:st.timer.questionYear||new Date().getFullYear(),total,correct,wrong,accuracy,reason:st.timer.questionReason||'',notes:'Registrado ao encerrar sessão de estudo',date:today(),createdAt:new Date().toISOString()}
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
