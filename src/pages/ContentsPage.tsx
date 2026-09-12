import { useMemo, useState } from 'react'
import { BarChart3, BookOpen, CheckCircle2, Clock3, FileQuestion, Search, Star } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'
import { accuracyForTopic, getProgress, questionCountTopic, topicVisualScore } from '../lib/analytics'
import type { PageId, TopicStatus } from '../types'

const statusLabel:Record<TopicStatus,string>={nao_iniciado:'Não iniciado',estudando:'Estudando',revisando:'Revisando',dominado:'Dominado'}
const actionLabel:Record<TopicStatus,string>={nao_iniciado:'Começar estudo',estudando:'Continuar estudo',revisando:'Revisar conteúdo',dominado:'Revisar conteúdo'}

export function ContentsPage({go}:{go:(p:PageId)=>void}){
  const s=useAppStore(x=>x.data),setStatus=useAppStore(x=>x.setStatus),startTimer=useAppStore(x=>x.startTimer)
  const [query,setQuery]=useState(''),[discipline,setDiscipline]=useState('Todos'),[statusFilter,setStatusFilter]=useState<'todos'|TopicStatus>('todos')
  const [selectedGroup,setSelectedGroup]=useState('Mecânica')
  const disciplines=['Todos',...new Set(topics.map(t=>t.discipline))]
  const filtered=topics.filter(t=>(discipline==='Todos'||t.discipline===discipline)&&(statusFilter==='todos'||getProgress(s,t.id).status===statusFilter)&&(!query||`${t.title} ${t.group} ${t.officialItem}`.toLowerCase().includes(query.toLowerCase())))
  const groups=useMemo(()=>[...new Set(filtered.map(t=>t.group))].map(group=>{const all=topics.filter(t=>t.group===group),view=filtered.filter(t=>t.group===group),counts={nao_iniciado:0,estudando:0,revisando:0,dominado:0} as Record<TopicStatus,number>;all.forEach(t=>counts[getProgress(s,t.id).status]++);return {group,all,view,counts,score:Math.round(all.reduce((a,t)=>a+topicVisualScore(s,t),0)/Math.max(1,all.length)),discipline:all[0]?.discipline||''}}),[filtered,s])
  const selected=groups.find(g=>g.group===selectedGroup)||groups[0]
  const groupTopics=selected?.view||[]
  return <div className="content-page">
    <div className="page-heading"><div><span className="eyebrow">CENTRO DO CONTEÚDO</span><h1>O edital como um mapa visual de estudo.</h1><p>Veja status, desempenho e histórico no mesmo lugar. O status continua sob seu controle.</p></div></div>
    <div className="content-toolbar-big"><label><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar tema, por exemplo: Leis de Newton..."/></label><select value={discipline} onChange={e=>setDiscipline(e.target.value)}>{disciplines.map(d=><option key={d}>{d}</option>)}</select><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)}><option value="todos">Todos os status</option><option value="nao_iniciado">Não iniciados</option><option value="estudando">Estudando</option><option value="revisando">Revisando</option><option value="dominado">Dominados</option></select></div>
    <div className="content-workspace">
      <section className="group-cards"><div className="section-caption"><BookOpen size={19}/><b>Áreas e blocos do edital</b><span>{groups.length} grupos</span></div><div className="group-grid">{groups.map(g=><button key={g.group} className={`group-card ${selected?.group===g.group?'selected':''}`} onClick={()=>setSelectedGroup(g.group)}><div className="group-card-head"><div className="group-symbol">{g.group.slice(0,1)}</div><div><strong>{g.group}</strong><small>{g.discipline}</small></div><Star size={15}/></div><div className="group-progress"><span style={{width:`${g.score}%`}}></span></div><div className="group-card-meta"><b>{g.score}%</b><span>{g.all.length} conteúdos</span></div><div className="status-mini"><i className="dom"></i>{g.counts.dominado}<i className="rev"></i>{g.counts.revisando}<i className="est"></i>{g.counts.estudando}<i className="new"></i>{g.counts.nao_iniciado}</div></button>)}</div></section>
      <aside className="content-detail"><div className="detail-head"><div><span className="eyebrow">{selected?.discipline||'CONTEÚDOS'}</span><h2>{selected?.group||'Selecione um grupo'}</h2><p>{selected?.all.length||0} microconteúdos • progresso médio {selected?.score||0}%</p></div><div className="detail-score">{selected?.score||0}%</div></div>
        <div className="detail-tabs"><button className="active">Conteúdo</button><button onClick={()=>go('questions')}>Questões</button><button onClick={()=>go('performance')}>Desempenho</button></div>
        <div className="micro-list">{groupTopics.slice(0,36).map(t=>{const p=getProgress(s,t.id),acc=accuracyForTopic(s,t.id),count=questionCountTopic(s,t.id);return <article className={`micro-card status-${p.status}`} key={t.id}><div className="micro-main"><div className="micro-title"><strong>{t.title}</strong><span className={`status-pill ${p.status}`}>{statusLabel[p.status]}</span></div><small>{t.officialItem}</small><div className="micro-stats"><span><Clock3 size={13}/>{t.minutes} min</span><span><FileQuestion size={13}/>{count} questões</span><span><BarChart3 size={13}/>{acc===null?'sem dados':`${acc}% acertos`}</span></div><div className="micro-progress"><span style={{width:`${topicVisualScore(s,t)}%`}}></span></div></div><div className="micro-actions"><select value={p.status} onChange={e=>setStatus(t.id,e.target.value as TopicStatus)}><option value="nao_iniciado">Não iniciado</option><option value="estudando">Estudando</option><option value="revisando">Revisando</option><option value="dominado">Dominado</option></select><button onClick={()=>{startTimer(t.id,t.minutes);go('study')}}>{actionLabel[p.status]}</button></div></article>})}{!groupTopics.length&&<div className="empty-state">Nenhum conteúdo corresponde aos filtros.</div>}</div>
      </aside>
    </div>
  </div>
}
