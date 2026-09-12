import { useEffect } from 'react'
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, Clock3, FileQuestion, History, Home, Layers3, Library, Settings, Target, Trophy, Zap, Play, Pause, Square, Search } from 'lucide-react'
import type { PageId } from '../types'
import { useAppStore } from '../store/useAppStore'
import { topics } from '../data/topics'
import { daysToExam } from '../lib/analytics'

const nav:Array<{id:PageId;label:string;icon:any}>=[
  {id:'home',label:'Hoje',icon:Home},{id:'plan',label:'Meu plano',icon:CalendarDays},{id:'study',label:'Estudar',icon:BookOpen},{id:'contents',label:'Conteúdos',icon:Layers3},{id:'questions',label:'Questões',icon:FileQuestion},{id:'reviews',label:'Revisões',icon:CheckCircle2},{id:'performance',label:'Desempenho',icon:BarChart3},{id:'simulations',label:'Simulados',icon:Target},{id:'materials',label:'Materiais',icon:Library},{id:'history',label:'Histórico',icon:History},{id:'settings',label:'Configurações',icon:Settings},
]

export function Layout({page,setPage,children}:{page:PageId;setPage:(p:PageId)=>void;children:React.ReactNode}){
  const data=useAppStore(s=>s.data),timer=useAppStore(s=>s.timer),tick=useAppStore(s=>s.tick),toggle=useAppStore(s=>s.toggleTimer),finish=useAppStore(s=>s.finishTimer)
  useEffect(()=>{if(!timer.running)return;const h=window.setInterval(tick,1000);return()=>window.clearInterval(h)},[timer.running,tick])
  const timerTopic=topics.find(t=>t.id===timer.topicId)
  const mm=String(Math.floor(timer.seconds/60)).padStart(2,'0'),ss=String(timer.seconds%60).padStart(2,'0')
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">⚛</div><div><strong>Rota da Aprovação</strong><span>SEDUC-PA • Física • Marabá</span></div></div>
      <nav>{nav.map(item=>{const I=item.icon;return <button key={item.id} className={page===item.id?'active':''} onClick={()=>setPage(item.id)}><I size={18}/><span>{item.label}</span></button>})}</nav>
      <div className="sidebar-focus"><Zap size={18}/><div><b>Modo foco</b><span>Mais foco. Mais resultados.</span></div></div>
      <div className="sidebar-foot"><b>{daysToExam()} dias</b><span>até 29/11/2026</span><small>v2.0 • Offline-first</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="search-shell" onClick={()=>setPage('contents')}><Search size={16}/><span>Buscar conteúdos, questões ou recursos...</span><kbd>Ctrl K</kbd></button>
        <div className="top-meta"><span>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</span><div className="avatar">{(data.settings.displayName||'R').slice(0,1).toUpperCase()}</div></div>
      </header>
      {timer.topicId&&<div className="persistent-timer"><div className="timer-dot"></div><div className="persistent-timer-copy"><small>Sessão ativa</small><strong>{timerTopic?.title||'Conteúdo selecionado'}</strong></div><div className="timer-clock">{mm}:{ss}</div><button onClick={toggle}>{timer.running?<Pause size={16}/>:<Play size={16}/>}</button><button onClick={finish} title="Encerrar sessão"><Square size={16}/></button></div>}
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
