import type { Topic } from '../types'
import { topics } from '../data/topics'
import { today } from './date'
import { TOPIC_MIGRATION } from '../data/topicMigration'

// Formato do código gerado pelas listas de questões em HTML:
//   ROTA1:<JSON em base64 (UTF-8)>
// JSON: { v:1, id, topicId?, topic, discipline?, date:'AAAA-MM-DD', total, correct, durationSeconds,
//         perQuestion?: [{ n, correct:boolean, seconds }] }
// Também aceita o JSON puro colado diretamente.
export interface ImportedReport {
  id:string
  topicId?:string
  topic:string
  discipline?:string
  date:string
  total:number
  correct:number
  durationSeconds:number
  perQuestion:Array<{n:number;correct:boolean;seconds:number}>
}

const norm=(x:string)=>x.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()

function decodeBase64Utf8(b64:string):string{
  const clean=b64.replace(/\s+/g,'').replace(/-/g,'+').replace(/_/g,'/')
  const padded=clean+'='.repeat((4-clean.length%4)%4)
  const bin=atob(padded)
  const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function parseReportCode(text:string):ImportedReport{
  const raw=text.trim()
  if(!raw)throw new Error('Cole o código do relatório.')
  let json:string
  const m=raw.match(/ROTA1:([A-Za-z0-9+/=_\-\s]+)/)
  if(m)json=decodeBase64Utf8(m[1])
  else if(raw.startsWith('{'))json=raw
  else throw new Error('Código não reconhecido. Ele deve começar com ROTA1:')
  let d:any
  try{d=JSON.parse(json)}catch{throw new Error('O código está incompleto ou foi copiado com cortes.')}
  const total=Math.round(+d.total),correct=Math.round(+d.correct)
  if(!Number.isFinite(total)||total<=0)throw new Error('O relatório não informa o total de questões.')
  if(!Number.isFinite(correct)||correct<0||correct>total)throw new Error('O número de acertos do relatório é inválido.')
  const perQuestion=Array.isArray(d.perQuestion)?d.perQuestion.map((q:any,i:number)=>({n:Math.round(+q.n)||i+1,correct:!!q.correct,seconds:Math.max(0,Math.round(+q.seconds||0))})):[]
  const summed=perQuestion.reduce((a:number,q:{seconds:number})=>a+q.seconds,0)
  const durationSeconds=Math.max(0,Math.round(+d.durationSeconds||summed||0))
  const date=typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)?d.date:today()
  const id=String(d.id||`${date}-${norm(String(d.topic||''))}-${total}-${correct}-${durationSeconds}`)
  return {id,topicId:d.topicId?String(d.topicId):undefined,topic:String(d.topic||d.topicTitle||''),discipline:d.discipline?String(d.discipline):undefined,date,total,correct,durationSeconds,perQuestion}
}

// Encontra o conteúdo do app correspondente ao relatório: id exato, título exato ou maior semelhança de palavras
export function matchTopics(r:ImportedReport):{exact:Topic|null;candidates:Topic[]}{
  if(r.topicId){const id=TOPIC_MIGRATION[r.topicId]||r.topicId;const t=topics.find(x=>x.id===id);if(t)return {exact:t,candidates:[t]}}
  const target=norm(r.topic)
  const pool=r.discipline?topics.filter(t=>norm(t.discipline)===norm(r.discipline!)):topics
  const exact=pool.find(t=>norm(t.title)===target)||null
  if(exact)return {exact,candidates:[exact]}
  const words=new Set(target.split(' ').filter(w=>w.length>2))
  const scored=pool.map(t=>{const tw=norm(`${t.title} ${t.officialItem}`).split(' ');const hit=tw.filter(w=>words.has(w)).length;return {t,score:hit/Math.max(1,words.size)}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)
  return {exact:null,candidates:scored.slice(0,8).map(x=>x.t)}
}
