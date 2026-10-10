import { PenLine, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import type { AppState } from '../types'
import { CUT_LINE, MIN_PART_QUESTIONS, partStats, type PartStat, type PartStatus } from '../lib/analytics'

const statusText:Record<PartStatus,string>={sem_dados:'Sem dados suficientes',risco:'Abaixo do corte',atencao:'Pouca margem',seguro:'Acima do corte'}

function PartCard({p,simulation}:{p:PartStat;simulation?:{total:number;correct:number}}){
  const Icon=p.status==='seguro'?ShieldCheck:p.status==='sem_dados'?ShieldQuestion:ShieldAlert
  const simPct=simulation&&simulation.total?Math.round(simulation.correct/simulation.total*100):null
  return <article className={`cut-card cut-${p.status}`}>
    <div className="cut-card-head">
      <div><span className="eyebrow">{p.id==='basicos'?'MÓDULO I · 30 QUESTÕES':'MÓDULO II · 30 QUESTÕES'}</span><h4>{p.label}</h4></div>
      <span className="cut-badge"><Icon size={15}/>{statusText[p.status]}</span>
    </div>
    <div className="cut-value"><strong>{p.accuracy===null?'—':`${p.accuracy}%`}</strong><small>{p.accuracy===null?`faltam ${p.missing} questões registradas para estimar`:`de acertos em ${p.questions} questões registradas`}</small></div>
    <div className="cut-meter" role="img" aria-label={`Acertos ${p.accuracy??'sem dados'}; linha de corte em ${CUT_LINE}%`}>
      <span className="cut-fill" style={{width:`${p.accuracy??0}%`}}></span>
      <i className="cut-line" style={{left:`${CUT_LINE}%`}}><em>corte {CUT_LINE}%</em></i>
    </div>
    <div className="cut-disciplines">{p.disciplines.map(d=><div key={d.name}><span>{d.name}</span><small>{d.officialQuestions} q no edital</small><b>{d.accuracy===null?'—':`${d.accuracy}%`}</b><small>{d.questions} feitas</small></div>)}</div>
    <div className="cut-foot"><span>Cobertura do edital nesta parte: <b>{p.coverage}%</b></span>{simPct!==null&&<span>Último simulado: <b>{simPct}%</b></span>}</div>
  </article>
}

export function CutPanel({s}:{s:AppState}){
  const ps=partStats(s)
  const lastSplit=[...s.simulations].reverse().find(x=>(x.basicTotal||0)>0||(x.specificTotal||0)>0)
  // Discursiva: 2 questões de 5 pontos; eliminado com menos de 5 pontos no total (item 8.28)
  const scored=s.discursives.filter(d=>d.score!==null)
  const discAvg=scored.length?scored.reduce((a,d)=>a+(d.score as number)/d.maxScore,0)/scored.length:null
  const discPts=discAvg===null?null:Math.round(discAvg*100)/10
  const discStatus:PartStatus=scored.length<2||discPts===null?'sem_dados':discPts<5?'risco':discPts<6?'atencao':'seguro'
  return <article className="panel cut-panel">
    <div className="panel-title"><div><span className="eyebrow">LINHA DE CORTE</span><h3>Básicos e Específicos, cada um por si</h3><p className="cut-note">Pelo edital (item 8.16), é preciso acertar pelo menos {CUT_LINE}% em <b>cada</b> parte, separadamente, e não zerar nenhum módulo. A estimativa aparece a partir de {MIN_PART_QUESTIONS} questões registradas em cada parte.</p></div></div>
    <div className="cut-grid">
      <PartCard p={ps.basicos} simulation={lastSplit&&lastSplit.basicTotal?{total:lastSplit.basicTotal,correct:lastSplit.basicCorrect||0}:undefined}/>
      <PartCard p={ps.especificos} simulation={lastSplit&&lastSplit.specificTotal?{total:lastSplit.specificTotal,correct:lastSplit.specificCorrect||0}:undefined}/>
    </div>
    <div className={`cut-disc cut-${discStatus}`}>
      <PenLine size={18}/>
      <div><b>Prova discursiva</b><small>2 questões de 5 pontos • mínimo de 5 pontos somados</small></div>
      <strong>{discPts===null?'—':`${String(discPts).replace('.',',')} / 10`}</strong>
      <span className="cut-badge">{scored.length<2?`${scored.length} treino${scored.length===1?'':'s'} com nota`:statusText[discStatus]}</span>
    </div>
  </article>
}
