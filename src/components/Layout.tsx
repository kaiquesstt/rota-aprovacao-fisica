import { useEffect, useRef, useState } from 'react'
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock3, Download, FileQuestion, History, Home, Layers3, Library, Play, Pause, Search, Settings, ShieldCheck, Square, Target, Trophy, Upload, Zap } from 'lucide-react'
import type { PageId } from '../types'
import { useAppStore } from '../store/useAppStore'
import { topics } from '../data/topics'
import { daysToExam } from '../lib/analytics'
import { exportBackup, migrateState } from '../lib/storage'

const nav:Array<{id:PageId;label:string;icon:any}>=[
  {id:'home',label:'Hoje',icon:Home},{id:'plan',label:'Meu plano',icon:CalendarDays},{id:'study',label:'Estudar',icon:BookOpen},{id:'contents',label:'Conteúdos',icon:Layers3},{id:'questions',label:'Questões',icon:FileQuestion},{id:'reviews',label:'Revisões',icon:CheckCircle2},{id:'performance',label:'Desempenho',icon:BarChart3},{id:'simulations',label:'Simulados',icon:Target},{id:'materials',label:'Materiais',icon:Library},{id:'history',label:'Histórico',icon:History},
]

export function Layout({page,setPage,children}:{page:PageId;setPage:(p:PageId)=>void;children:React.ReactNode}){
  const data=useAppStore(s=>s.data),timer=useAppStore(s=>s.timer),tick=useAppStore(s=>s.tick),toggle=useAppStore(s=>s.toggleTimer),finish=useAppStore(s=>s.finishTimer),replaceData=useAppStore(s=>s.replaceData)
  const [menuOpen,setMenuOpen]=useState(false)
  const fileRef=useRef<HTMLInputElement>(null)
  const menuRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{if(!timer.running)return;const h=window.setInterval(tick,1000);return()=>window.clearInterval(h)},[timer.running,tick])
  useEffect(()=>{const onClick=(e:MouseEvent)=>{if(menuRef.current&&!menuRef.current.contains(e.target as Node))setMenuOpen(false)};document.addEventListener('mousedown',onClick);return()=>document.removeEventListener('mousedown',onClick)},[])

  const timerTopic=topics.find(t=>t.id===timer.topicId)
  const mm=String(Math.floor(timer.seconds/60)).padStart(2,'0'),ss=String(timer.seconds%60).padStart(2,'0')
  const firstName=(data.settings.displayName||'Kaique').trim().split(/\s+/)[0]||'Kaique'

  const handleExport=()=>{const next=exportBackup(data);replaceData(next);setMenuOpen(false)}
  const handleImport=async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0]; if(!f)return; try{replaceData(migrateState(JSON.parse(await f.text()))); alert('Backup importado com sucesso.');}catch{alert('Arquivo de backup inválido.')} finally {e.target.value=''; setMenuOpen(false)}}

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">⚛</div><div><strong>Rota da Aprovação</strong><span>SEDUC-PA • Física • Marabá</span></div></div>
      <nav>{nav.map(item=>{const I=item.icon;return <button key={item.id} className={page===item.id?'active':''} onClick={()=>setPage(item.id)}><I size={18}/><span>{item.label}</span></button>})}</nav>
      <div className="sidebar-focus"><Zap size={18}/><div><b>Modo foco</b><span>Mais foco. Mais resultados.</span></div></div>
      <div className="sidebar-foot"><b>{daysToExam()} dias</b><span>até 29/11/2026</span><small>v2.3.1 • Offline-first</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="search-shell" onClick={()=>setPage('contents')}><Search size={16}/><span>Buscar conteúdos, questões ou recursos...</span><kbd>Ctrl K</kbd></button>
        <div className="topbar-right">
          <div className="top-greeting">
            <small>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</small>
            <strong>Olá, Kaique!</strong>
            <span>Constância transforma esforço em resultado.</span>
          </div>
          <div className="profile-menu" ref={menuRef}>
            <button className="profile-trigger" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen}>
              <div className="avatar">K</div>
              <div className="profile-copy"><b>{firstName}</b><span>Ferramentas e backup</span></div>
              <ChevronDown size={16}/>
            </button>
            {menuOpen && <div className="profile-dropdown">
              <div className="dropdown-head">
                <div className="avatar small">K</div>
                <div><b>Olá, Kaique!</b><span>Configurações, backup e recursos menos frequentes.</span></div>
              </div>
              <button onClick={()=>{setPage('settings'); setMenuOpen(false)}}><Settings size={15}/> Configurações</button>
              <button onClick={handleExport}><Download size={15}/> Exportar backup</button>
              <button onClick={()=>fileRef.current?.click()}><Upload size={15}/> Importar backup</button>
              <a href="./legacy-v14.html" onClick={()=>setMenuOpen(false)}><ShieldCheck size={15}/> Abrir versão anterior</a>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleImport}/>
            </div>}
          </div>
        </div>
      </header>
      {timer.topicId&&<div className="persistent-timer"><div className="timer-dot"></div><div className="persistent-timer-copy"><small>Sessão ativa</small><strong>{timerTopic?.title||'Conteúdo selecionado'}</strong></div><div className="timer-clock">{mm}:{ss}</div><button onClick={toggle}>{timer.running?<Pause size={16}/>:<Play size={16}/>}</button><button onClick={finish} title="Encerrar sessão"><Square size={16}/></button></div>}
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
