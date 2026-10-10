import Dexie, { type Table } from 'dexie'
import type { AppState, DiscursiveRecord } from '../types'
import { topics } from '../data/topics'
import { TOPIC_MIGRATION } from '../data/topicMigration'
import type { ProgressItem, TopicStatus } from '../types'
import { APP_VERSION } from '../version'
import { dateStr, today } from './date'

export const APP_KEY='seduc-pa-fisica-maraba-v2'
const OLD_DB_NAME='rota-aprovacao-fisica-db'
const OLD_DB_STORE='state'
const NEW_DB_NAME='rota-aprovacao-fisica-v2-db'

interface KV { key:string; value:AppState; updatedAt:string }
class RotaDB extends Dexie {
  kv!:Table<KV,string>
  constructor(){ super(NEW_DB_NAME); this.version(1).stores({kv:'key,updatedAt'}) }
}
export const db=new RotaDB()

export function defaultState():AppState{
  return {
    version:'2.7.0',progress:[],sessions:[],questionSessions:[],errors:[],reviews:[],flashcards:[],questionBank:[],simulations:[],discursives:[],practicals:[],
    formulas:[],micro:{answered:0,correct:0},dailyDone:{},pinnedTopics:[],achievementsSeen:[],
    diagnostic:{attempts:[],draft:null,activeResultId:null,review:false},
    settings:{weeklyHoursGoal:12,weeklyQuestionsGoal:180,dailyMinutesGoal:120,firstCycleTarget:'2026-11-15',theme:'light',focusPreset:50,sidebarCollapsed:false,displayName:''},
    createdAt:new Date().toISOString(),meta:{sourceVersion:'new'}
  }
}

// Leva registros feitos nos 615 microconteúdos antigos para as 180 unidades atuais.
// Uma unidade nova só fica "Dominado" se todas as partes que ela juntou estavam dominadas;
// se alguma parte já tinha sido iniciada, ela fica "Estudando".
const topicTitle=new Map(topics.map(t=>[t.id,t.title]))
const sourcesOf=(()=>{const m=new Map<string,string[]>();for(const [o,n] of Object.entries(TOPIC_MIGRATION)){const a=m.get(n)||[];a.push(o);m.set(n,a)}return m})()
const remapId=(id:unknown)=>typeof id==='string'&&TOPIC_MIGRATION[id]?TOPIC_MIGRATION[id]:id as string
export function remapTopics(state:AppState):AppState{
  const touches=(id:unknown)=>typeof id==='string'&&id in TOPIC_MIGRATION&&TOPIC_MIGRATION[id]!==id
  const needs=state.progress.some(p=>touches(p.topicId))||state.questionSessions.some(q=>touches(q.topicId))||state.sessions.some(x=>touches(x.topicId))||state.errors.some(e=>touches(e.topicId))||state.discursives.some(d=>touches(d.topicId))||state.pinnedTopics.some(touches)
  if(!needs)return state
  const oldStatus=new Map(state.progress.map(p=>[p.topicId,p]))
  const targets=new Set(state.progress.map(p=>remapId(p.topicId)))
  const progress:ProgressItem[]=[]
  for(const id of targets){
    const srcs=[...new Set([...(sourcesOf.get(id)||[id]),...(oldStatus.has(id)?[id]:[])])]
    const recs=srcs.map(s=>oldStatus.get(s)).filter(Boolean) as ProgressItem[]
    const started=recs.filter(r=>r.status!=='nao_iniciado')
    if(!started.length)continue
    const isNewRecord=oldStatus.has(id)&&!(id in TOPIC_MIGRATION)
    const allDone=(isNewRecord&&oldStatus.get(id)!.status==='dominado')||(srcs.length>0&&srcs.filter(s=>s!==id||!isNewRecord).every(s=>oldStatus.get(s)?.status==='dominado'))
    const status:TopicStatus=allDone?'dominado':'estudando'
    const updatedAt=recs.map(r=>r.updatedAt||'').sort().at(-1)||null
    progress.push({topicId:id,status,updatedAt})
  }
  const title=(id:string,fallback?:string)=>topicTitle.get(id)||fallback||''
  return {...state,progress,
    questionSessions:state.questionSessions.map(q=>{const id=remapId(q.topicId);return id===q.topicId?q:{...q,topicId:id,topicTitle:title(id,q.topicTitle)}}),
    sessions:state.sessions.map(x=>{const id=remapId(x.topicId);return id===x.topicId?x:{...x,topicId:id,topicTitle:title(id,x.topicTitle)}}),
    errors:state.errors.map(e=>{const id=remapId(e.topicId);return id===e.topicId?e:{...e,topicId:id,title:title(id,e.title)}}),
    discursives:state.discursives.map(d=>d.topicId&&touches(d.topicId)?{...d,topicId:TOPIC_MIGRATION[d.topicId]}:d),
    pinnedTopics:[...new Set(state.pinnedTopics.map(remapId))],
    reviews:[],
    meta:{...(state.meta||{}),topicsRemappedAt:new Date().toISOString()}
  }
}

function safeArray<T>(x:T[]|undefined|null):T[]{return Array.isArray(x)?x:[]}
// Aceita tanto o formato da v14 (theme, lines, score, notes) quanto o novo (enunciado, resposta, devolutiva)
function normalizeDiscursives(x:unknown):DiscursiveRecord[]{
  if(!Array.isArray(x))return []
  return x.filter(d=>d&&typeof d==='object').map((d:any,i)=>({
    id:String(d.id||`disc-${i}-${Date.now().toString(36)}`),
    date:String(d.date||(d.createdAt?dateStr(new Date(d.createdAt)):today())),
    createdAt:d.createdAt,
    theme:String(d.theme||'Treino discursivo'),
    topicId:d.topicId||undefined,
    prompt:d.prompt||'',
    answer:d.answer||'',
    lines:Number.isFinite(+d.lines)?+d.lines:0,
    score:d.score===null||d.score===undefined||d.score===''||!Number.isFinite(+d.score)?null:+d.score,
    maxScore:Number.isFinite(+d.maxScore)&&+d.maxScore>0?+d.maxScore:10, // v14 dava nota de 0 a 10
    notes:d.notes||'',
    feedback:d.feedback||''
  }))
}
export function migrateState(input:unknown):AppState{
  const base=defaultState()
  if(!input||typeof input!=='object') return base
  const p=input as Partial<AppState> & Record<string,unknown>
  const qSource=Array.isArray(p.questionSessions)?p.questionSessions:(Array.isArray(p.questions)?p.questions:[]) as any[]
  const migrated:AppState={
    ...base,...p,
    version:'2.7.0',
    progress:safeArray(p.progress),sessions:safeArray(p.sessions),questionSessions:safeArray<any>(qSource),errors:safeArray(p.errors),reviews:safeArray(p.reviews),flashcards:safeArray(p.flashcards),questionBank:safeArray(p.questionBank),simulations:safeArray(p.simulations),discursives:normalizeDiscursives(p.discursives),practicals:safeArray(p.practicals),
    formulas:safeArray(p.formulas),
    micro:{...base.micro,...(p.micro||{})},dailyDone:{...base.dailyDone,...(p.dailyDone||{})},pinnedTopics:safeArray(p.pinnedTopics),achievementsSeen:safeArray(p.achievementsSeen),
    diagnostic:{...base.diagnostic,...(p.diagnostic||{}),attempts:safeArray(p.diagnostic?.attempts)},
    settings:{...base.settings,...(p.settings||{})},
    meta:{...(p.meta||{}),sourceVersion:String(p.version||'legacy'),migratedToReactAt:(p.meta as any)?.migratedToReactAt||new Date().toISOString()}
  }
  return remapTopics(migrated)
}

async function readOldIndexedDB():Promise<AppState|null>{
  if(!('indexedDB' in window)) return null
  return new Promise(resolve=>{
    try{
      const req=indexedDB.open(OLD_DB_NAME,1)
      req.onerror=()=>resolve(null)
      req.onupgradeneeded=()=>{ try{req.transaction?.abort()}catch{}; resolve(null) }
      req.onsuccess=()=>{
        try{
          const odb=req.result
          if(!odb.objectStoreNames.contains(OLD_DB_STORE)){odb.close();resolve(null);return}
          const tx=odb.transaction(OLD_DB_STORE,'readonly')
          const get=tx.objectStore(OLD_DB_STORE).get(APP_KEY)
          get.onsuccess=()=>{odb.close();resolve(get.result||null)}
          get.onerror=()=>{odb.close();resolve(null)}
        }catch{resolve(null)}
      }
    }catch{resolve(null)}
  })
}

const stamp=(s:AppState|null)=>s?.meta?.updatedAt||s?.createdAt||''
export async function loadInitialState():Promise<{state:AppState;source:string}>{
  let local:AppState|null=null
  try{const raw=localStorage.getItem(APP_KEY); if(raw)local=migrateState(JSON.parse(raw))}catch{}
  const oldIdbRaw=await readOldIndexedDB()
  const oldIdb=oldIdbRaw?migrateState(oldIdbRaw):null
  const newRow=await db.kv.get(APP_KEY).catch(()=>undefined)
  const modern=newRow?.value?migrateState(newRow.value):null
  const candidates=[{state:local,source:'LocalStorage v14'},{state:oldIdb,source:'IndexedDB v14'},{state:modern,source:'IndexedDB 2.0'}].filter(x=>x.state) as {state:AppState;source:string}[]
  candidates.sort((a,b)=>stamp(b.state).localeCompare(stamp(a.state)))
  const chosen=candidates[0]||{state:defaultState(),source:'Novo perfil'}
  chosen.state.meta={...(chosen.state.meta||{}),migratedToReactAt:chosen.state.meta?.migratedToReactAt||new Date().toISOString()}
  await persistState(chosen.state)
  return chosen
}

export async function persistState(state:AppState){
  const withMeta={...state,meta:{...(state.meta||{}),updatedAt:new Date().toISOString()}}
  try{localStorage.setItem(APP_KEY,JSON.stringify(withMeta))}catch{}
  try{await db.kv.put({key:APP_KEY,value:withMeta,updatedAt:withMeta.meta?.updatedAt||new Date().toISOString()})}catch{}
}

export function exportBackup(state:AppState){
  const next={...state,meta:{...(state.meta||{}),lastBackupAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}
  const blob=new Blob([JSON.stringify({...next,exportedAt:new Date().toISOString(),appVersion:APP_VERSION},null,2)],{type:'application/json'})
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`backup-rota-aprovacao-fisica-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
  return next
}
