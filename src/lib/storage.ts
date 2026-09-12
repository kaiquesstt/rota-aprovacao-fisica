import Dexie, { type Table } from 'dexie'
import type { AppState } from '../types'
import { formulaSeed } from '../data/formulas'

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
    version:'2.4.0',progress:[],sessions:[],questionSessions:[],errors:[],reviews:[],flashcards:[],questionBank:[],simulations:[],discursives:[],practicals:[],
    formulas:formulaSeed.map(f=>({...f})),micro:{answered:0,correct:0},dailyDone:{},pinnedTopics:[],achievementsSeen:[],
    diagnostic:{attempts:[],draft:null,activeResultId:null,review:false},
    settings:{weeklyHoursGoal:12,weeklyQuestionsGoal:180,dailyMinutesGoal:120,firstCycleTarget:'2026-11-15',theme:'light',focusPreset:50,sidebarCollapsed:false,displayName:''},
    createdAt:new Date().toISOString(),meta:{sourceVersion:'new'}
  }
}

function safeArray<T>(x:T[]|undefined|null):T[]{return Array.isArray(x)?x:[]}
export function migrateState(input:unknown):AppState{
  const base=defaultState()
  if(!input||typeof input!=='object') return base
  const p=input as Partial<AppState> & Record<string,unknown>
  const qSource=Array.isArray(p.questionSessions)?p.questionSessions:(Array.isArray(p.questions)?p.questions:[]) as any[]
  return {
    ...base,...p,
    version:'2.4.0',
    progress:safeArray(p.progress),sessions:safeArray(p.sessions),questionSessions:safeArray<any>(qSource),errors:safeArray(p.errors),reviews:safeArray(p.reviews),flashcards:safeArray(p.flashcards),questionBank:safeArray(p.questionBank),simulations:safeArray(p.simulations),discursives:safeArray(p.discursives),practicals:safeArray(p.practicals),
    formulas:Array.isArray(p.formulas)&&p.formulas.length?p.formulas:base.formulas,
    micro:{...base.micro,...(p.micro||{})},dailyDone:{...base.dailyDone,...(p.dailyDone||{})},pinnedTopics:safeArray(p.pinnedTopics),achievementsSeen:safeArray(p.achievementsSeen),
    diagnostic:{...base.diagnostic,...(p.diagnostic||{}),attempts:safeArray(p.diagnostic?.attempts)},
    settings:{...base.settings,...(p.settings||{})},
    meta:{...(p.meta||{}),sourceVersion:String(p.version||'legacy'),migratedToReactAt:(p.meta as any)?.migratedToReactAt||new Date().toISOString()}
  }
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
  const blob=new Blob([JSON.stringify({...next,exportedAt:new Date().toISOString(),appVersion:'2.4.0'},null,2)],{type:'application/json'})
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`backup-rota-aprovacao-fisica-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
  return next
}
