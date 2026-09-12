import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Clock3, Download, FileQuestion, History, Home, Layers3, Library, Pause, Play, Search, Settings, ShieldCheck, Square, Target, Upload, Zap } from 'lucide-react'
import type { PageId } from '../types'
import { useAppStore } from '../store/useAppStore'
import { topics } from '../data/topics'
import { daysToExam } from '../lib/analytics'
import { exportBackup, migrateState } from '../lib/storage'
import { notify } from '../lib/feedback'

const nav:Array<{id:PageId;label:string;icon:any}>=[
  {id:'home',label:'Hoje',icon:Home},{id:'plan',label:'Meu plano',icon:CalendarDays},{id:'study',label:'Estudar',icon:BookOpen},{id:'contents',label:'Conteúdos',icon:Layers3},{id:'questions',label:'Questões',icon:FileQuestion},{id:'reviews',label:'Revisões',icon:CheckCircle2},{id:'performance',label:'Desempenho',icon:BarChart3},{id:'simulations',label:'Simulados',icon:Target},{id:'materials',label:'Materiais',icon:Library},{id:'history',label:'Histórico',icon:History},
]

export function Layout({page,setPage,children}:{page:PageId;setPage:(p:PageId)=>void;children:React.ReactNode}){
  const data=useAppStore(s=>s.data),timer=useAppStore(s=>s.timer),tick=useAppStore(s=>s.tick),toggle=useAppStore(s=>s.toggleTimer),finish=useAppStore(s=>s.finishTimer),replaceData=useAppStore(s=>s.replaceData)
  const [menuOpen,setMenuOpen]=useState(false),[search,setSearch]=useState(''),[searchOpen,setSearchOpen]=useState(false)
  const fileRef=useRef<HTMLInputElement>(null),menuRef=useRef<HTMLDivElement>(null),searchRef=useRef<HTMLInputElement>(null),searchBoxRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{if(!timer.running)return;const h=window.setInterval(tick,1000);return()=>window.clearInterval(h)},[timer.running,tick])
  useEffect(()=>{const onClick=(e:MouseEvent)=>{const n=e.target as Node;if(menuRef.current&&!menuRef.current.contains(n))setMenuOpen(false);if(searchBoxRef.current&&!searchBoxRef.current.contains(n))setSearchOpen(false)};document.addEventListener('mousedown',onClick);return()=>document.removeEventListener('mousedown',onClick)},[])
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchRef.current?.focus();setSearchOpen(true)}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[])

  const timerTopic=topics.find(t=>t.id===timer.topicId)
  const hh=Math.floor(timer.seconds/3600),mm=String(Math.floor((timer.seconds%3600)/60)).padStart(2,'0'),ss=String(timer.seconds%60).padStart(2,'0'),timerText=hh>0?`${String(hh).padStart(2,'0')}:${mm}:${ss}`:`${mm}:${ss}`
  const firstName=(data.settings.displayName||'Kaique').trim().split(/\s+/)[0]||'Kaique'
  const q=search.trim().toLowerCase()
  const topicResults=useMemo(()=>q?topics.filter(t=>`${t.title} ${t.group} ${t.discipline} ${t.officialItem}`.toLowerCase().includes(q)).slice(0,6):[],[q])
  const formulaResults=useMemo(()=>q?data.formulas.filter(f=>`${f.title} ${f.topic} ${f.formula}`.toLowerCase().includes(q)).slice(0,4):[],[q,data.formulas])

  const openTopic=(title:string)=>{sessionStorage.setItem('rota-content-query',title);setPage('contents');setSearch('');setSearchOpen(false)}
  const handleExport=()=>{const next=exportBackup(data);replaceData(next);setMenuOpen(false);notify('Backup exportado','Seu arquivo JSON foi preparado para download.')}
  const handleImport=async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0]; if(!f)return; try{replaceData(migrateState(JSON.parse(await f.text())));notify('Backup importado com sucesso','Os dados foram carregados nesta versão.')}catch{notify('Backup inválido','Não foi possível ler esse arquivo.','danger')} finally {e.target.value=''; setMenuOpen(false)}}

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">⚛</div><div><strong>Rota da Aprovação</strong><span>SEDUC-PA • Física • Marabá</span></div></div>
      <nav>{nav.map(item=>{const I=item.icon;return <button key={item.id} className={page===item.id?'active':''} onClick={()=>setPage(item.id)}><I size={18}/><span>{item.label}</span></button>})}</nav>
      <div className="sidebar-focus"><Zap size={18}/><div><b>Modo foco</b><span>Mais foco. Mais resultados.</span></div></div>
      <div className="sidebar-foot"><b>{daysToExam()} dias</b><span>até 29/11/2026</span><small>v2.4 • Offline-first</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="global-search" ref={searchBoxRef}>
          <div className="search-shell input"><Search size={18}/><input ref={searchRef} value={search} onChange={e=>{setSearch(e.target.value);setSearchOpen(true)}} onFocus={()=>setSearchOpen(true)} placeholder="Buscar conteúdos, fórmulas ou recursos..."/><kbd>Ctrl K</kbd></div>
          {searchOpen&&q&&<div className="search-results">
            {topicResults.length>0&&<div className="search-section"><span>CONTEÚDOS</span>{topicResults.map(t=><button key={t.id} onClick={()=>openTopic(t.title)}><BookOpen size={16}/><div><b>{t.title}</b><small>{t.discipline} • {t.group}</small></div></button>)}</div>}
            {formulaResults.length>0&&<div className="search-section"><span>FÓRMULAS</span>{formulaResults.map(f=><button key={f.id} onClick={()=>{setPage('materials');setSearch('');setSearchOpen(false)}}><Zap size={16}/><div><b>{f.title}</b><small>{f.topic} • {f.formula}</small></div></button>)}</div>}
            {!topicResults.length&&!formulaResults.length&&<div className="search-empty"><Search size={24}/><b>Nenhum resultado encontrado</b><span>Tente outro termo ou parte do nome do conteúdo.</span></div>}
          </div>}
        </div>
        <div className="topbar-right">
          <div className="top-greeting"><small>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</small><strong>Olá, Kaique!</strong><span>Constância transforma esforço em resultado.</span></div>
          <div className="profile-menu" ref={menuRef}><button className="profile-trigger" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen}><div className="avatar">K</div><div className="profile-copy"><b>{firstName}</b><span>Ferramentas e backup</span></div><ChevronDown size={16}/></button>
            {menuOpen&&<div className="profile-dropdown"><div className="dropdown-head"><div className="avatar small">K</div><div><b>Olá, Kaique!</b><span>Configurações, backup e recursos menos frequentes.</span></div></div><button onClick={()=>{setPage('settings');setMenuOpen(false)}}><Settings size={15}/> Configurações</button><button onClick={handleExport}><Download size={15}/> Exportar backup</button><button onClick={()=>fileRef.current?.click()}><Upload size={15}/> Importar backup</button><a href="./legacy-v14.html" onClick={()=>setMenuOpen(false)}><ShieldCheck size={15}/> Abrir versão anterior</a><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleImport}/></div>}
          </div>
        </div>
      </header>
      {timer.topicId&&<div className="persistent-timer"><div className="timer-dot"></div><div className="persistent-timer-copy"><small>Sessão ativa</small><strong>{timerTopic?.title||'Conteúdo selecionado'}</strong></div><div className="timer-clock">{timerText}</div><button onClick={toggle}>{timer.running?<Pause size={16}/>:<Play size={16}/>}</button><button onClick={finish} title="Encerrar sessão"><Square size={16}/></button></div>}
      <div className="page-wrap">{children}</div>
    </main>
  </div>
}
