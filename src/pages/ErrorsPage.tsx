import { useState } from 'react'
import { CheckCircle2, CircleAlert, Play, RotateCcw, Trash2 } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'
import { fmtDate } from '../lib/date'
import type { PageId } from '../types'

const REASONS=['Erro conceitual','Erro de cálculo','Interpretação','Fórmula esquecida','Distração']
type Filter='abertos'|'resolvidos'|'todos'

export function ErrorsPage({go}:{go:(p:PageId)=>void}){
  const s=useAppStore(x=>x.data),toggle=useAppStore(x=>x.toggleErrorResolved),remove=useAppStore(x=>x.deleteError),startTimer=useAppStore(x=>x.startTimer)
  const [filter,setFilter]=useState<Filter>('abertos'),[reason,setReason]=useState('')
  const open=s.errors.filter(e=>!e.resolved)
  const byReason=[...new Set([...REASONS,...s.errors.map(e=>e.reason||'Sem causa')])].map(r=>({r,n:open.filter(e=>(e.reason||'Sem causa')===r).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n)
  const maxN=Math.max(1,...byReason.map(x=>x.n))
  const byDisc=[...new Set(open.map(e=>topics.find(t=>t.id===e.topicId)?.discipline||'Outro'))].map(d=>({d,n:open.filter(e=>(topics.find(t=>t.id===e.topicId)?.discipline||'Outro')===d).length})).sort((a,b)=>b.n-a.n)
  const list=s.errors.filter(e=>filter==='todos'||(filter==='abertos'?!e.resolved:e.resolved)).filter(e=>!reason||(e.reason||'Sem causa')===reason).sort((a,b)=>b.date.localeCompare(a.date))
  return <div>
    <div className="page-heading"><div><span className="eyebrow">ERROS</span><h1>O que errou e por quê.</h1><p>Cada bloco de questões com erros e uma causa marcada vira um registro aqui. Marque como resolvido quando retomar o ponto.</p></div></div>
    <div className="errors-grid">
      <aside className="panel"><span className="eyebrow">EM ABERTO</span><h3>{open.length} registro{open.length===1?'':'s'}</h3>
        {byReason.length?<div className="reason-bars">{byReason.map(x=><button key={x.r} className={reason===x.r?'active':''} onClick={()=>setReason(reason===x.r?'':x.r)}><span>{x.r}</span><i><b style={{width:`${x.n/maxN*100}%`}}></b></i><strong>{x.n}</strong></button>)}</div>:<p className="muted">Nenhum erro em aberto.</p>}
        {byDisc.length>0&&<div className="disc-chips">{byDisc.map(x=><span key={x.d}>{x.d}: <b>{x.n}</b></span>)}</div>}
        {reason&&<button className="text-btn" onClick={()=>setReason('')}>Mostrar todas as causas</button>}
      </aside>
      <section className="panel">
        <div className="panel-title"><div><span className="eyebrow">REGISTROS</span><h3>{reason||'Todas as causas'}</h3></div><div className="range-switch">{(['abertos','resolvidos','todos'] as Filter[]).map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f[0].toUpperCase()+f.slice(1)}</button>)}</div></div>
        <div className="error-list">{list.map(e=>{const t=topics.find(x=>x.id===e.topicId);return <article key={e.id} className={`error-card ${e.resolved?'resolved':''}`}>
          <div className="error-icon">{e.resolved?<CheckCircle2 size={18}/>:<CircleAlert size={18}/>}</div>
          <div className="error-body"><b>{t?.title||e.title||'Conteúdo'}</b><small>{t?.discipline||''}{t?` • ${t.officialItem}`:''} • {fmtDate(e.date)}</small><p><span className="reason-tag">{e.reason||'Sem causa'}</span> {e.note}</p></div>
          <div className="error-actions">{t&&!e.resolved&&<button title="Estudar de novo" onClick={()=>{startTimer(t.id,t.minutes);go('study')}}><Play size={15}/></button>}<button title={e.resolved?'Reabrir':'Marcar como resolvido'} onClick={()=>toggle(e.id)}>{e.resolved?<RotateCcw size={15}/>:<CheckCircle2 size={15}/>}</button><button className="danger-icon" title="Excluir" onClick={()=>{if(window.confirm('Excluir este registro de erro?'))remove(e.id)}}><Trash2 size={15}/></button></div>
        </article>})}</div>
        {!list.length&&<div className="empty-state">{filter==='abertos'?'Nenhum erro em aberto. Ao registrar ou importar questões, escolha a causa principal dos erros para que eles apareçam aqui.':'Nada por aqui.'}</div>}
      </section>
    </div>
  </div>
}
