import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'

export function StudyPage(){
  const timer=useAppStore(s=>s.timer),start=useAppStore(s=>s.startTimer),startFree=useAppStore(s=>s.startFreeTimer),toggle=useAppStore(s=>s.toggleTimer),reset=useAppStore(s=>s.resetTimer),finish=useAppStore(s=>s.finishTimer),setTopic=useAppStore(s=>s.setTimerTopic),setPreset=useAppStore(s=>s.setTimerPreset)
  const focusRef=useRef<HTMLElement>(null)
  const [isFullscreen,setIsFullscreen]=useState(false)
  const topic=topics.find(t=>t.id===timer.topicId)||topics.find(t=>t.discipline==='Física')||topics[0]
  const total=timer.seconds,hh=Math.floor(total/3600),mm=String(Math.floor((total%3600)/60)).padStart(2,'0'),ss=String(total%60).padStart(2,'0')
  const clock=hh>0?`${String(hh).padStart(2,'0')}:${mm}:${ss}`:`${mm}:${ss}`
  const free=timer.mode==='countup'
  const untouched=free?timer.seconds===0:timer.seconds===timer.preset*60

  useEffect(()=>{const h=()=>setIsFullscreen(document.fullscreenElement===focusRef.current);document.addEventListener('fullscreenchange',h);return()=>document.removeEventListener('fullscreenchange',h)},[])
  const primary=()=>{if(timer.running){toggle();return}if(!timer.topicId){if(free){startFree(topic.id);setTimeout(()=>useAppStore.getState().toggleTimer(),0)}else start(topic.id,timer.preset);return}if(!free&&timer.seconds<=0){start(topic.id,timer.preset);return}toggle()}
  const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await focusRef.current?.requestFullscreen()}catch{}}

  return <div><div className="page-heading"><div><span className="eyebrow">ESTUDAR</span><h1>Sessão de foco.</h1><p>O cronômetro continua ativo mesmo quando você navega por outras áreas do aplicativo.</p></div></div><div className="study-layout"><article className="focus-card" ref={focusRef}><button className="focus-fullscreen" onClick={fullscreen} title={isFullscreen?'Sair da tela inteira':'Abrir em tela inteira'}>{isFullscreen?<Minimize2/>:<Maximize2/>}<span>{isFullscreen?'Sair da tela inteira':'Tela inteira'}</span></button><span className="eyebrow light">MODO FOCO</span><h2>{topic?.title}</h2><p>{topic?.discipline} • {topic?.group}</p><div className="focus-clock">{clock}</div><div className="focus-buttons"><button onClick={primary} className="cta">{timer.running?<Pause/>:<Play/>}{timer.running?'Pausar':untouched?'Iniciar':'Continuar'}</button><button onClick={reset} className="secondary"><RotateCcw/> Reiniciar</button><button onClick={finish} className="secondary"><Square/> Encerrar e salvar</button></div><small className="fullscreen-hint">Na tela inteira, pressione Esc para sair.</small></article><aside className="panel setup"><span className="eyebrow">CONFIGURAR SESSÃO</span><h3>Conteúdo e duração</h3><label>Conteúdo<select value={topic?.id} onChange={e=>{const id=e.target.value;setTopic(id);if(free)startFree(id);else setPreset(timer.preset,id)}}>{topics.map(t=><option key={t.id} value={t.id}>{t.discipline} — {t.title}</option>)}</select></label><div className="timer-mode-label">Modo do cronômetro</div><div className="preset-row timer-presets">{[15,20,25,30,50].map(m=><button key={m} onClick={()=>setPreset(m,topic.id)} className={!free&&timer.preset===m?'active':''}>{m} min</button>)}<button onClick={()=>startFree(topic.id)} className={free?'active free-mode':''}>Livre · 00:00</button></div><div className="muted-box">{free?<><b>Modo livre:</b> começa em 00:00 e conta para cima sem limite definido. Ao encerrar, o tempo estudado é salvo normalmente.</>:<>Escolha a duração e clique em <b>Iniciar</b>. O tempo faz contagem regressiva e, ao encerrar, a sessão é registrada no histórico.</>}</div></aside></div></div>
}
