import { create } from 'zustand'
import type { AppState, TimerState, TopicStatus } from '../types'
import { defaultState, persistState } from '../lib/storage'
import { addDays, today } from '../lib/date'
import { topics } from '../data/topics'

type Store={
  data:AppState; hydrated:boolean; migrationSource:string; timer:TimerState;
  hydrate:(data:AppState,source:string)=>void; replaceData:(data:AppState)=>void;
  setStatus:(topicId:string,status:TopicStatus)=>void; addQuestionSession:(input:{topicId:string;total:number;correct:number;bank:string;year:number;reason?:string})=>void;
  toggleErrorResolved:(id:string)=>void; rateReview:(id:string,rating:'errei'|'dificil'|'bom'|'facil')=>void; addSimulation:(percent:number,total:number,correct:number)=>void;
  startTimer:(topicId:string,preset?:number)=>void; toggleTimer:()=>void; resetTimer:()=>void; tick:()=>void; finishTimer:()=>void; setTimerTopic:(topicId:string)=>void;
  updateSettings:(patch:Partial<AppState['settings']>)=>void;
}

let saveHandle:number|undefined
const scheduleSave=(state:AppState)=>{window.clearTimeout(saveHandle);saveHandle=window.setTimeout(()=>persistState(state),180)}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7)

export const useAppStore=create<Store>((set,get)=>({
  data:defaultState(),hydrated:false,migrationSource:'',timer:{topicId:null,seconds:0,running:false,startedAt:null,preset:25,type:'Teoria'},
  hydrate:(data,source)=>set({data,hydrated:true,migrationSource:source}),
  replaceData:(data)=>{set({data});scheduleSave(data)},
  setStatus:(topicId,status)=>set(st=>{const progress=st.data.progress.filter(p=>p.topicId!==topicId);progress.push({topicId,status,updatedAt:new Date().toISOString()});let reviews=st.data.reviews;if(status!=='nao_iniciado'&&!reviews.some(r=>r.topicId===topicId))reviews=[...reviews,{id:uid(),topicId,due:addDays(today(),1),interval:1,ease:2.3,count:0,lastRating:null,lastReviewed:null}];const data={...st.data,progress,reviews};scheduleSave(data);return {data}}),
  addQuestionSession:(input)=>set(st=>{const t=topics.find(x=>x.id===input.topicId);if(!t)return st;const wrong=Math.max(0,input.total-input.correct),q={id:uid(),topicId:t.id,discipline:t.discipline,topicTitle:t.title,bank:input.bank,year:input.year,total:input.total,correct:input.correct,wrong,accuracy:input.total?Math.round(input.correct/input.total*100):0,reason:input.reason||'',notes:'',date:today(),createdAt:new Date().toISOString()};let errors=st.data.errors;if(wrong>0&&input.reason)errors=[{id:uid(),topicId:t.id,title:t.title,reason:input.reason,note:`${wrong} erro(s) em ${input.total} questões`,date:today(),resolved:false},...errors];const data={...st.data,questionSessions:[q,...st.data.questionSessions],errors};scheduleSave(data);return {data}}),
  toggleErrorResolved:(id)=>set(st=>{const data={...st.data,errors:st.data.errors.map(e=>e.id===id?{...e,resolved:!e.resolved}:e)};scheduleSave(data);return {data}}),
  rateReview:(id,rating)=>set(st=>{const score={errei:1,dificil:2,bom:3,facil:4}[rating];const reviews=st.data.reviews.map(r=>{if(r.id!==id)return r;let interval=r.interval||1;if(score===1)interval=1;else if(score===2)interval=Math.max(2,Math.round(interval*1.4));else if(score===3)interval=Math.max(3,Math.round(interval*2));else interval=Math.max(5,Math.round(interval*2.7));return {...r,interval,due:addDays(today(),interval),count:(r.count||0)+1,lastRating:rating,lastReviewed:new Date().toISOString()}});const data={...st.data,reviews};scheduleSave(data);return {data}}),
  addSimulation:(percent,total,correct)=>set(st=>{const data={...st.data,simulations:[...st.data.simulations,{id:uid(),date:today(),percent,total,correct,name:'Simulado'}]};scheduleSave(data);return {data}}),
  startTimer:(topicId,preset=25)=>set({timer:{topicId,seconds:preset*60,running:true,startedAt:Date.now(),preset,type:'Teoria'}}),
  toggleTimer:()=>set(st=>({timer:{...st.timer,running:!st.timer.running,startedAt:st.timer.running?null:Date.now()}})),
  resetTimer:()=>set(st=>({timer:{...st.timer,seconds:st.timer.preset*60,running:false,startedAt:null}})),
  tick:()=>set(st=>st.timer.running&&st.timer.seconds>0?({timer:{...st.timer,seconds:st.timer.seconds-1}}):({timer:{...st.timer,running:false}})),
  finishTimer:()=>set(st=>{if(!st.timer.topicId)return {timer:{...st.timer,running:false}};const t=topics.find(x=>x.id===st.timer.topicId);const elapsed=Math.max(60,(st.timer.preset*60)-st.timer.seconds);const session={id:uid(),topicId:t?.id,topicTitle:t?.title||'Sessão',discipline:t?.discipline,group:t?.group,type:st.timer.type,durationSeconds:elapsed,date:today(),createdAt:new Date().toISOString()};const data={...st.data,sessions:[session,...st.data.sessions]};scheduleSave(data);return {data,timer:{...st.timer,running:false,seconds:st.timer.preset*60,startedAt:null}}}),
  setTimerTopic:(topicId)=>set(st=>({timer:{...st.timer,topicId}})),
  updateSettings:(patch)=>set(st=>{const data={...st.data,settings:{...st.data.settings,...patch}};scheduleSave(data);return {data}})
}))
