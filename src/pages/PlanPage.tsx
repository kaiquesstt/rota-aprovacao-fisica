import { CalendarDays, Gauge, Play, TrendingUp } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { paceInfo, suggestionQueue } from '../lib/analytics'
import type { PageId } from '../types'

const n1=(x:number)=>x.toFixed(1).replace('.',',')

export function PlanPage({go}:{go?:(p:PageId)=>void}){
  const s=useAppStore(x=>x.data),startTimer=useAppStore(x=>x.startTimer)
  const pace=paceInfo(s)
  const queue=suggestionQueue(s,8,2)
  const pct=Math.round(pace.dominated/pace.total*100)
  return <div>
    <div className="page-heading"><div><span className="eyebrow">RITMO ATÉ A PROVA</span><h1>Quanto falta e em que velocidade.</h1><p>Uma unidade dominada é uma lista de questões aprovada. O ritmo considera as unidades que você marcou como dominadas nos últimos 7 dias.</p></div></div>
    <div className="metric-row compact">
      <div className="metric-card"><div className="metric-icon"><Gauge/></div><div><small>Necessário</small><strong>{n1(pace.neededPerDay)}/dia</strong><span>{pace.remaining} unidades em {pace.days} dias</span></div></div>
      <div className="metric-card"><div className="metric-icon"><TrendingUp/></div><div><small>Seu ritmo</small><strong>{n1(pace.ratePerDay)}/dia</strong><span>{pace.last7} dominadas nos últimos 7 dias</span></div></div>
      <div className="metric-card"><div className="metric-icon"><CalendarDays/></div><div><small>Projeção em 29/11</small><strong>{pace.projected} de {pace.total}</strong><span>{pace.onTrack?'no ritmo atual, dá para cobrir tudo':'no ritmo atual, parte do edital fica de fora'}</span></div></div>
    </div>
    <div className="pace-grid">
      <section className="panel"><div className="panel-title"><div><span className="eyebrow">POR DISCIPLINA</span><h3>{pace.dominated} de {pace.total} unidades dominadas ({pct}%)</h3></div></div>
        <div className="pace-disciplines">{pace.byDiscipline.map(d=>{const done=d.total-d.remaining;return <div key={d.name}><div className="pace-row-head"><b>{d.name}</b><span>{done}/{d.total} · faltam {d.remaining} ({n1(d.remaining/pace.days)}/dia)</span></div><div className="pace-bar"><i style={{width:`${Math.round(done/Math.max(1,d.total)*100)}%`}}></i></div></div>})}</div>
        {!pace.onTrack&&<div className="muted-box">Se o ritmo não fechar, priorize pelo peso: Física vale 30 questões e é o tema da discursiva, mas os Básicos precisam de 50% sozinhos. A fila ao lado já faz essa conta.</div>}
      </section>
      <aside className="panel"><div className="panel-title"><div><span className="eyebrow">FILA SUGERIDA</span><h3>Próximas unidades</h3><p className="cut-note">No máximo duas por disciplina, para alternar matérias.</p></div></div>
        <div className="queue-list">{queue.map(({t,reasons},i)=><div className="queue-row" key={t.id}><span className="queue-n">{i+1}</span><div><b>{t.title}</b><small>{t.discipline} • {t.officialItem}</small>{reasons.length>0&&<em>{reasons.slice(0,2).join(' · ')}</em>}</div><button title="Estudar agora" onClick={()=>{startTimer(t.id,t.minutes);go?.('study')}}><Play size={15}/></button></div>)}</div>
      </aside>
    </div>
  </div>
}
