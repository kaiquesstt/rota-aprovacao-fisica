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
  startTimer:(topicId:string,preset?:number)=>void; startFreeTimer:(topicId:string)=>void; toggleTimer:()=>void; resetTimer:()=>void; tick:()=>void; finishTimer:()=>void; setTimerTopic:(topicId:string)=>void; setTimerPreset:(preset:number,topicId?:string)=>void;
  updateSettings:(patch:Partial<AppState['settings']>)=>void; markAchievementSeen:(id:string)=>void;
}

let saveHandle:number|undefined
const scheduleSave=(state:AppState)=>{window.clearTimeout(saveHandle);saveHandle=window.setTimeout(()=>persistState(state),180)}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7)

export const useAppStore=create<Store>((set,get)=>({
  data:defaultState(),hydrated:false,migrationSource:'',timer:{topicId:null,seconds:25*60,running:false,startedAt:null,preset:25,type:'Teoria',mode:'countdown'},
  hydrate:(data,source)=>set({data,hydrated:true,migrationSource:source}),
  replaceData:(data)=>{set({data});scheduleSave(data)},
  setStatus:(topicId,status)=>set(st=>{const progress=st.data.progress.filter(p=>p.topicId!==topicId);progress.push({topicId,status,updatedAt:new Date().toISOString()});let reviews=st.data.reviews;if(status!=='nao_iniciado'&&!reviews.some(r=>r.topicId===topicId))reviews=[...reviews,{id:uid(),topicId,due:addDays(today(),1),interval:1,ease:2.3,count:0,lastRating:null,lastReviewed:null}];const data={...st.data,progress,reviews};scheduleSave(data);notify('Progresso salvo',`Status alterado para ${status==='dominado'?'Dominado':status==='revisando'?'Revisando':status==='estudando'?'Estudando':'Não iniciado'}.`);return {data}}),
  addQuestionSession:(input)=>set(st=>{const t=topics.find(x=>x.id===input.topicId);if(!t)return st;const wrong=Math.max(0,input.total-input.correct),q={id:uid(),topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:input.bank,year:input.year,total:input.total,correct:input.correct,wrong,accuracy:input.total?Math.round(input.correct/input.total*100):0,reason:input.reason||'',notes:'',date:today(),createdAt:new Date().toISOString()};let errors=st.data.errors;if(wrong>0&&input.reason)errors=[{id:uid(),topicId:t.id,title:t.title,reason:input.reason,note:`${wrong} erro(s) em ${input.total} questões`,date:today(),resolved:false,questionSessionId:q.id},...errors];const data={...st.data,questionSessions:[q,...st.data.questionSessions],errors};scheduleSave(data);notify('Bloco de questões salvo',`${input.total} questões registradas • ${q.accuracy}% de acertos.`);return {data}}),
  deleteQuestionSession:(id)=>set(st=>{const data={...st.data,questionSessions:st.data.questionSessions.filter(q=>q.id!==id),errors:st.data.errors.filter(e=>e.questionSessionId!==id)};scheduleSave(data);notify('Registro excluído','Os percentuais e gráficos foram recalculados.','info');return {data}}),
  toggleErrorResolved:(id)=>set(st=>{const data={...st.data,errors:st.data.errors.map(e=>e.id===id?{...e,resolved:!e.resolved}:e)};scheduleSave(data);return {data}}),
  rateReview:(id,rating)=>set(st=>{const score={errei:1,dificil:2,bom:3,facil:4}[rating];const reviews=st.data.reviews.map(r=>{if(r.id!==id)return r;let interval=r.interval||1;if(score===1)interval=1;else if(score===2)interval=Math.max(2,Math.round(interval*1.4));else if(score===3)interval=Math.max(3,Math.round(interval*2));else interval=Math.max(5,Math.round(interval*2.7));return {...r,interval,due:addDays(today(),interval),count:(r.count||0)+1,lastRating:rating,lastReviewed:new Date().toISOString()}});const data={...st.data,reviews};scheduleSave(data);notify('Revisão registrada',rating==='errei'?'O conteúdo voltará mais cedo para sua fila.':rating==='dificil'?'A próxima revisão foi ajustada.':'Seu intervalo de revisão foi atualizado.');return {data}}),
  addSimulation:(percent,total,correct)=>set(st=>{const data={...st.data,simulations:[...st.data.simulations,{id:uid(),date:today(),percent,total,correct,name:'Simulado'}]};scheduleSave(data);notify('Simulado salvo',`${percent}% de aproveitamento registrado.`);return {data}}),
  startTimer:(topicId,preset=25)=>set({timer:{topicId,seconds:preset*60,running:true,startedAt:Date.now(),preset,type:'Teoria',mode:'countdown'}}),
  startFreeTimer:(topicId)=>set({timer:{topicId,seconds:0,running:false,startedAt:null,preset:0,type:'Teoria',mode:'countup'}}),
  toggleTimer:()=>set(st=>({timer:{...st.timer,running:!st.timer.running,startedAt:st.timer.running?null:Date.now()}})),
  resetTimer:()=>set(st=>({timer:{...st.timer,seconds:st.timer.mode==='countup'?0:st.timer.preset*60,running:false,startedAt:null}})),
  setTimerPreset:(preset,topicId)=>set(st=>({timer:{...st.timer,topicId:topicId||st.timer.topicId,seconds:preset*60,preset,running:false,startedAt:null,mode:'countdown'}})),
  tick:()=>set(st=>{if(!st.timer.running)return st.timer.mode==='countup'?({timer:st.timer}):({timer:st.timer});if(st.timer.mode==='countup')return {timer:{...st.timer,seconds:st.timer.seconds+1}};if(st.timer.seconds>0)return {timer:{...st.timer,seconds:st.timer.seconds-1}};return {timer:{...st.timer,running:false}}}),
  finishTimer:()=>set(st=>{const resetSeconds=st.timer.mode==='countup'?0:st.timer.preset*60;if(!st.timer.topicId)return {timer:{...st.timer,running:false,seconds:resetSeconds,startedAt:null}};const t=topics.find(x=>x.id===st.timer.topicId);const elapsed=st.timer.mode==='countup'?st.timer.seconds:(st.timer.preset*60)-st.timer.seconds;if(elapsed<=0)return {timer:{...st.timer,running:false,seconds:resetSeconds,startedAt:null}};const session={id:uid(),topicId:t?.id,topicTitle:t?.title||'Sessão',discipline:t?.discipline,group:t?.group,type:st.timer.type,durationSeconds:Math.max(1,elapsed),date:today(),createdAt:new Date().toISOString()};const data={...st.data,sessions:[session,...st.data.sessions]};scheduleSave(data);notify('Sessão salva no histórico',`${Math.max(1,Math.round(elapsed/60))} min registrados em ${t?.title||'Sessão'}.`);return {data,timer:{...st.timer,running:false,seconds:resetSeconds,startedAt:null}}}),
  setTimerTopic:(topicId)=>set(st=>({timer:{...st.timer,topicId}})),
  updateSettings:(patch)=>set(st=>{const data={...st.data,settings:{...st.data.settings,...patch}};scheduleSave(data);notify('Configurações salvas');return {data}}),
  markAchievementSeen:(id)=>set(st=>{if(st.data.achievementsSeen.includes(id))return st;const data={...st.data,achievementsSeen:[...st.data.achievementsSeen,id]};scheduleSave(data);return {data}})
}))
