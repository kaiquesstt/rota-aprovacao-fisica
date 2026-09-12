import { Pause, Play, RotateCcw, Square } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'

export function StudyPage(){
  const timer=useAppStore(s=>s.timer),start=useAppStore(s=>s.startTimer),toggle=useAppStore(s=>s.toggleTimer),reset=useAppStore(s=>s.resetTimer),finish=useAppStore(s=>s.finishTimer),setTopic=useAppStore(s=>s.setTimerTopic)
  const topic=topics.find(t=>t.id===timer.topicId)||topics.find(t=>t.discipline==='Física')||topics[0]
  const mm=String(Math.floor(timer.seconds/60)).padStart(2,'0'),ss=String(timer.seconds%60).padStart(2,'0')
  return <div><div className="page-heading"><div><span className="eyebrow">ESTUDAR</span><h1>Sessão de foco.</h1><p>O cronômetro continua ativo mesmo quando você navega por outras áreas do aplicativo.</p></div></div><div className="study-layout"><article className="focus-card"><span className="eyebrow light">MODO FOCO</span><h2>{topic?.title}</h2><p>{topic?.discipline} • {topic?.group}</p><div className="focus-clock">{mm}:{ss}</div><div className="focus-buttons"><button onClick={toggle} className="cta">{timer.running?<Pause/>:<Play/>}{timer.running?'Pausar':'Continuar'}</button><button onClick={reset} className="secondary"><RotateCcw/> Reiniciar</button><button onClick={finish} className="secondary"><Square/> Encerrar e salvar</button></div></article><aside className="panel setup"><span className="eyebrow">CONFIGURAR SESSÃO</span><h3>Conteúdo e duração</h3><label>Conteúdo<select value={topic?.id} onChange={e=>setTopic(e.target.value)}>{topics.map(t=><option key={t.id} value={t.id}>{t.discipline} — {t.title}</option>)}</select></label><div className="preset-row">{[15,20,25,30,50].map(m=><button key={m} onClick={()=>start(topic.id,m)} className={timer.preset===m?'active':''}>{m} min</button>)}</div><div className="muted-box">Ao encerrar, a sessão é registrada automaticamente no histórico e alimenta os gráficos de progresso.</div></aside></div></div>
}
