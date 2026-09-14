import { useEffect, useRef, useState } from 'react'
import { BarChart3, CheckCircle2, FileQuestion, Maximize2, Minimize2, Pause, Play, RotateCcw, Square, Target } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'
import { today } from '../lib/date'
import { notify } from '../lib/feedback'

const formatClock=(seconds:number)=>{const total=Math.max(0,Math.floor(seconds)),hh=Math.floor(total/3600),mm=String(Math.floor((total%3600)/60)).padStart(2,'0'),ss=String(total%60).padStart(2,'0');return hh>0?`${String(hh).padStart(2,'0')}:${mm}:${ss}`:`${mm}:${ss}`}

export function StudyPage(){
  const data=useAppStore(s=>s.data),timer=useAppStore(s=>s.timer),start=useAppStore(s=>s.startTimer),startFree=useAppStore(s=>s.startFreeTimer),toggle=useAppStore(s=>s.toggleTimer),reset=useAppStore(s=>s.resetTimer),finish=useAppStore(s=>s.finishTimer),setTopic=useAppStore(s=>s.setTimerTopic),setPreset=useAppStore(s=>s.setTimerPreset),updateQuestions=useAppStore(s=>s.updateTimerQuestions)
  const focusRef=useRef<HTMLElement>(null)
  const [isFullscreen,setIsFullscreen]=useState(false)
  const topic=topics.find(t=>t.id===timer.topicId)||topics.find(t=>t.discipline==='Física')||topics[0]
  const free=timer.mode==='countup'
  const target=free?0:timer.preset*60
  const elapsed=Math.max(0,timer.seconds)
  const overtime=!free&&target>0&&elapsed>=target
  const displaySeconds=free?elapsed:overtime?elapsed-target:Math.max(0,target-elapsed)
  const clock=`${overtime?'+':''}${formatClock(displaySeconds)}`
  const untouched=elapsed===0
  const progress=free||target<=0?0:Math.min(100,Math.round(elapsed/target*100))
  const qTotal=Math.max(0,timer.questionTotal||0),qCorrect=Math.max(0,timer.questionCorrect||0),qAccuracy=qTotal?Math.round(Math.min(qCorrect,qTotal)/qTotal*100):null

  const todaySessions=data.sessions.filter(s=>s.topicId===topic.id&&s.date===today())
  const todayQuestions=data.questionSessions.filter(q=>q.topicId===topic.id&&q.date===today())
  const storedSeconds=todaySessions.reduce((a,s)=>a+(s.durationSeconds||0),0)
  const storedQ=todayQuestions.reduce((a,q)=>a+q.total,0),storedCorrect=todayQuestions.reduce((a,q)=>a+q.correct,0)
  const liveSeconds=storedSeconds+elapsed,liveQ=storedQ+qTotal,liveCorrect=storedCorrect+Math.min(qCorrect,qTotal),liveAcc=liveQ?Math.round(liveCorrect/liveQ*100):null

  useEffect(()=>{const h=()=>setIsFullscreen(document.fullscreenElement===focusRef.current);document.addEventListener('fullscreenchange',h);return()=>document.removeEventListener('fullscreenchange',h)},[])
  const primary=()=>{if(timer.running){toggle();return}if(!timer.topicId){if(free){startFree(topic.id);setTimeout(()=>useAppStore.getState().toggleTimer(),0)}else start(topic.id,timer.preset);return}toggle()}
  const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await focusRef.current?.requestFullscreen()}catch{}}
  const finishAll=()=>{if(qTotal>0&&qCorrect>qTotal){notify('Confira os acertos','O número de acertos não pode ser maior que o total de questões.','warning');return}finish()}

  return <div><div className="page-heading"><div><span className="eyebrow">ESTUDAR</span><h1>Sessão de foco.</h1><p>A duração sugerida é uma meta, não um limite. Se você ultrapassar o tempo, o cronômetro continua contando até você encerrar.</p></div></div><div className="study-layout session-workspace"><article className={`focus-card ${overtime?'goal-complete':''}`} ref={focusRef}><button className="focus-fullscreen" onClick={fullscreen} title={isFullscreen?'Sair da tela inteira':'Abrir em tela inteira'}>{isFullscreen?<Minimize2/>:<Maximize2/>}<span>{isFullscreen?'Sair da tela inteira':'Tela inteira'}</span></button><span className="eyebrow light">MODO FOCO</span><h2>{topic?.title}</h2><p>{topic?.discipline} • {topic?.group}</p><div className={`focus-clock ${overtime?'overtime':''}`}>{clock}</div>{free?<div className="timer-goal-status free"><Target size={17}/><span><b>Cronômetro livre</b> • tempo total {formatClock(elapsed)}</span></div>:<><div className={`timer-goal-status ${overtime?'complete':''}`}>{overtime?<CheckCircle2 size={18}/>:<Target size={18}/>}<span>{overtime?<><b>Meta de {timer.preset} min concluída</b> • +{formatClock(elapsed-target)} além do recomendado</>:<><b>Meta sugerida: {timer.preset} min</b> • faltam {formatClock(target-elapsed)}</>}</span></div><div className="goal-progress"><i style={{width:`${progress}%`}}></i></div>{overtime&&<div className="total-time-line">Tempo total estudado nesta sessão: <b>{formatClock(elapsed)}</b></div>}</>}<div className="focus-buttons"><button onClick={primary} className="cta">{timer.running?<Pause/>:<Play/>}{timer.running?'Pausar':untouched?'Iniciar':'Continuar'}</button><button onClick={reset} className="secondary"><RotateCcw/> Reiniciar tempo</button><button onClick={finishAll} className="secondary finish-all"><Square/> Encerrar e salvar tudo</button></div><small className="fullscreen-hint">O tempo é calculado pelo relógio real do computador, inclusive quando esta aba fica em segundo plano.</small></article><aside className="panel setup session-side"><span className="eyebrow">CONFIGURAR SESSÃO</span><h3>Conteúdo e meta</h3><label>Conteúdo<select value={topic?.id} onChange={e=>{const id=e.target.value;setTopic(id);if(free)startFree(id);else setPreset(timer.preset,id)}}>{topics.map(t=><option key={t.id} value={t.id}>{t.discipline} — {t.title}</option>)}</select></label><div className="timer-mode-label">Meta de tempo</div><div className="preset-row timer-presets">{[15,20,25,30,50].map(m=><button key={m} onClick={()=>setPreset(m,topic.id)} className={!free&&timer.preset===m?'active':''}>{m} min</button>)}<button onClick={()=>startFree(topic.id)} className={free?'active free-mode':''}>Livre · 00:00</button></div><div className="muted-box">{free?<><b>Modo livre:</b> começa em 00:00 e conta para cima até você encerrar.</>:<><b>Meta flexível:</b> a contagem começa regressiva. Ao chegar a 00:00, ela continua como tempo extra (+00:01, +00:02...) até você encerrar.</>}</div>

        <div className="session-question-box"><div className="session-question-title"><div><span className="eyebrow">QUESTÕES DESTA SESSÃO</span><h3>Teoria + exercícios no mesmo registro</h3></div><FileQuestion/></div><div className="question-inline-stats"><label>Questões feitas<input type="number" min={0} value={timer.questionTotal} onChange={e=>updateQuestions({questionTotal:Math.max(0,+e.target.value||0)})}/></label><label>Acertos<input type="number" min={0} max={Math.max(0,timer.questionTotal)} value={timer.questionCorrect} onChange={e=>updateQuestions({questionCorrect:Math.max(0,+e.target.value||0)})}/></label><div className={`session-accuracy ${qAccuracy!==null&&qAccuracy>=70?'good':''}`}><small>Aproveitamento</small><strong>{qAccuracy===null?'—':`${qAccuracy}%`}</strong></div></div><div className="question-extra-grid"><label>Banca <span>(opcional)</span><input value={timer.questionBank} onChange={e=>updateQuestions({questionBank:e.target.value})} placeholder="Ex.: FGV"/></label><label>Ano <span>(opcional)</span><input type="number" value={timer.questionYear||''} onChange={e=>updateQuestions({questionYear:+e.target.value||new Date().getFullYear()})}/></label></div><label>Causa principal dos erros <span>(opcional)</span><select value={timer.questionReason} onChange={e=>updateQuestions({questionReason:e.target.value})}><option value="">Não registrar causa agora</option><option>Erro conceitual</option><option>Erro de cálculo</option><option>Interpretação</option><option>Fórmula esquecida</option><option>Distração</option></select></label><div className="session-save-note"><CheckCircle2 size={17}/><span>Ao clicar em <b>Encerrar e salvar tudo</b>, o tempo e as questões entram juntos no histórico e nos gráficos.</span></div></div>

        <div className="session-today-summary"><span className="eyebrow">HOJE NESTE CONTEÚDO</span><div><article><strong>{Math.round(liveSeconds/60)} min</strong><small>estudo</small></article><article><strong>{liveQ}</strong><small>questões</small></article><article><strong>{liveAcc===null?'—':`${liveAcc}%`}</strong><small>acertos</small></article></div></div>
      </aside></div></div>
}
