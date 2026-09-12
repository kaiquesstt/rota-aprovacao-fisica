import { useEffect, useMemo, useState } from 'react'
import { BarChart3, BookOpen, Clock3, Eye, EyeOff, FileQuestion, Search, Star } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'
import { accuracyForTopic, getProgress, questionCountTopic, topicVisualScore } from '../lib/analytics'
import type { PageId, TopicStatus } from '../types'

const statusLabel:Record<TopicStatus,string>={nao_iniciado:'Não iniciado',estudando:'Estudando',revisando:'Revisando',dominado:'Dominado'}
const actionLabel:Record<TopicStatus,string>={nao_iniciado:'Começar estudo',estudando:'Continuar estudo',revisando:'Revisar conteúdo',dominado:'Revisar conteúdo'}
const allStatuses:TopicStatus[]=['nao_iniciado','estudando','revisando','dominado']

export function ContentsPage({go}:{go:(p:PageId)=>void}){
  const s=useAppStore(x=>x.data),setStatus=useAppStore(x=>x.setStatus),startTimer=useAppStore(x=>x.startTimer)
  const initialQuery=typeof sessionStorage!=='undefined'?(sessionStorage.getItem('rota-content-query')||''):''
  const [query,setQuery]=useState(initialQuery),[discipline,setDiscipline]=useState('Todos')
  const [hidden,setHidden]=useState<Set<TopicStatus>>(new Set())
  const [selectedGroup,setSelectedGroup]=useState('Mecânica')
  useEffect(()=>{if(initialQuery)sessionStorage.removeItem('rota-content-query')},[])
  const disciplines=['Todos',...new Set(topics.map(t=>t.discipline))]
  const visible=(st:TopicStatus)=>!hidden.has(st)
  const toggleStatus=(st:TopicStatus)=>setHidden(prev=>{const n=new Set(prev);n.has(st)?n.delete(st):n.add(st);return n})
  const filtered=topics.filter(t=>(discipline==='Todos'||t.discipline===discipline)&&visible(getProgress(s,t.id).status)&&(!query||`${t.title} ${t.group} ${t.officialItem}`.toLowerCase().includes(query.toLowerCase())))
  const groups=useMemo(()=>[...new Set(filtered.map(t=>t.group))].map(group=>{const all=topics.filter(t=>t.group===group),view=filtered.filter(t=>t.group===group),counts={nao_iniciado:0,estudando:0,revisando:0,dominado:0} as Record<TopicStatus,number>;all.forEach(t=>counts[getProgress(s,t.id).status]++);return {group,all,view,counts,score:Math.round(all.reduce((a,t)=>a+topicVisualScore(s,t),0)/Math.max(1,all.length)),discipline:all[0]?.discipline||''}}),[filtered,s])
  const selected=groups.find(g=>g.group===selectedGroup)||groups[0]
  const groupTopics=selected?.view||[]
  return <div className="content-page">
    <div className="page-heading"><div><span className="eyebrow">CENTRO DO CONTEÚDO</span><h1>O edital como um mapa visual de estudo.</h1><p>Escolha o que quer ver. Você pode esconder conteúdos dominados, em revisão ou qualquer outro status.</p></div></div>
    <div className="content-toolbar-big"><label><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar tema, por exemplo: Leis de Newton..."/></label><select value={discipline} onChange={e=>setDiscipline(e.target.value)}>{disciplines.map(d=><option key={d}>{d}</option>)}</select><button className={`hide-dominated ${hidden.has('dominado')?'active':''}`} onClick={()=>toggleStatus('dominado')}>{hidden.has('dominado')?<Eye size={17}/>:<EyeOff size={17}/>} {hidden.has('dominado')?'Mostrar dominados':'Ocultar dominados'}</button></div>
    <div className="visibility-panel"><div><span className="eyebrow">VISIBILIDADE</span><b>Mostrar no mapa</b></div><div className="visibility-chips">{allStatuses.map(st=><button key={st} className={`visibility-chip ${st} ${visible(st)?'on':'off'}`} onClick={()=>toggleStatus(st)}>{visible(st)?<Eye size={15}/>:<EyeOff size={15}/>}<span>{statusLabel[st]}</span><b>{topics.filter(t=>getProgress(s,t.id).status===st).length}</b></button>)}</div><button className="text-btn" onClick={()=>setHidden(new Set())}>Mostrar tudo</button></div>
    <div className="content-workspace">
      <section className="group-cards"><div className="section-caption"><BookOpen size={19}/><b>Áreas e blocos do edital</b><span>{groups.length} grupos • {filtered.length} conteúdos visíveis</span></div><div className="group-grid">{groups.map(g=><button key={g.group} className={`group-card ${selected?.group===g.group?'selected':''}`} onClick={()=>setSelectedGroup(g.group)}><div className="group-card-head"><div className="group-symbol">{g.group.slice(0,1)}</div><div><strong>{g.group}</strong><small>{g.discipline}</small></div><Star size={15}/></div><div className="group-progress"><span style={{width:`${g.score}%`}}></span></div><div className="group-card-meta"><b>{g.score}%</b><span>{g.view.length} visíveis de {g.all.length}</span></div><div className="status-mini"><i className="dom"></i>{g.counts.dominado}<i className="rev"></i>{g.counts.revisando}<i className="est"></i>{g.counts.estudando}<i className="new"></i>{g.counts.nao_iniciado}</div></button>)}</div>{!groups.length&&<div className="empty-state rich-empty"><EyeOff size={34}/><strong>Nenhum conteúdo visível</strong><span>Reative algum status ou limpe a busca para voltar a visualizar o mapa.</span><button className="secondary" onClick={()=>{setHidden(new Set());setQuery('')}}>Mostrar todos os conteúdos</button></div>}</section>
      {selected&&<aside className="content-detail"><div className="detail-head"><div><span className="eyebrow">{selected.discipline||'CONTEÚDOS'}</span><h2>{selected.group}</h2><p>{selected.all.length} microconteúdos • {selected.view.length} visíveis • progresso médio {selected.score}%</p></div><div className="detail-score">{selected.score}%</div></div>
        <div className="detail-tabs"><button className="active">Conteúdo</button><button onClick={()=>go('questions')}>Questões</button><button onClick={()=>go('performance')}>Desempenho</button></div>
        <div className="micro-list">{groupTopics.map(t=>{const p=getProgress(s,t.id),acc=accuracyForTopic(s,t.id),count=questionCountTopic(s,t.id);return <article className={`micro-card status-${p.status}`} key={t.id}><div className="micro-main"><div className="micro-title"><strong>{t.title}</strong><span className={`status-pill ${p.status}`}>{statusLabel[p.status]}</span></div><small>{t.officialItem}</small><div className="micro-stats"><span><Clock3 size={13}/>{t.minutes} min</span><span><FileQuestion size={13}/>{count} questões</span><span><BarChart3 size={13}/>{acc===null?'sem dados':`${acc}% acertos`}</span></div><div className="micro-progress"><span style={{width:`${topicVisualScore(s,t)}%`}}></span></div></div><div className="micro-actions"><select value={p.status} onChange={e=>setStatus(t.id,e.target.value as TopicStatus)}><option value="nao_iniciado">Não iniciado</option><option value="estudando">Estudando</option><option value="revisando">Revisando</option><option value="dominado">Dominado</option></select><button onClick={()=>{startTimer(t.id,t.minutes);go('study')}}>{actionLabel[p.status]}</button></div></article>})}</div>
      </aside>}
    </div>
  </div>
}
