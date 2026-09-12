import { useEffect, useRef, useState } from 'react'
import { Layout } from './components/Layout'
import { AchievementCelebration, FeedbackCenter } from './components/GlobalOverlays'
import type { PageId } from './types'
import { useAppStore } from './store/useAppStore'
import { loadInitialState } from './lib/storage'
import { achievementData, type AchievementInfo } from './lib/analytics'
import { HomePage } from './pages/HomePage'
import { PlanPage } from './pages/PlanPage'
import { StudyPage } from './pages/StudyPage'
import { ContentsPage } from './pages/ContentsPage'
import { QuestionsPage } from './pages/QuestionsPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { PerformancePage } from './pages/PerformancePage'
import { SimulationsPage } from './pages/SimulationsPage'
import { MaterialsPage } from './pages/MaterialsPage'
import { HistoryPage } from './pages/HistoryPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App(){
  const hydrated=useAppStore(s=>s.hydrated),hydrate=useAppStore(s=>s.hydrate),data=useAppStore(s=>s.data),markSeen=useAppStore(s=>s.markAchievementSeen)
  const [page,setPage]=useState<PageId>('home')
  const [celebrationQueue,setCelebrationQueue]=useState<AchievementInfo[]>([])
  const previousUnlocked=useRef<Set<string>|null>(null)

  useEffect(()=>{loadInitialState().then(({state,source})=>hydrate(state,source))},[hydrate])
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.altKey&&e.key==='1')setPage('home');if(e.altKey&&e.key==='2')setPage('contents');if(e.altKey&&e.key==='3')setPage('questions');if(e.altKey&&e.key==='4')setPage('performance')};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[])
  useEffect(()=>{
    if(!hydrated)return
    const current=achievementData(data).filter(a=>a.done)
    const currentSet=new Set(current.map(a=>a.id))
    if(previousUnlocked.current===null){previousUnlocked.current=currentSet;return}
    const fresh=current.filter(a=>!previousUnlocked.current!.has(a.id)&&!data.achievementsSeen.includes(a.id))
    if(fresh.length)setCelebrationQueue(q=>[...q,...fresh.filter(a=>!q.some(x=>x.id===a.id))])
    previousUnlocked.current=currentSet
  },[hydrated,data])

  const closeCelebration=()=>setCelebrationQueue(q=>{const first=q[0];if(first)markSeen(first.id);return q.slice(1)})
  if(!hydrated)return <div className="loading-screen"><div className="loader"></div><strong>Preparando sua Rota da Aprovação 2.4…</strong><span>Lendo seu progresso com segurança.</span></div>
  const pages:Record<PageId,React.ReactNode>={home:<HomePage go={setPage}/>,plan:<PlanPage/>,study:<StudyPage/>,contents:<ContentsPage go={setPage}/>,questions:<QuestionsPage/>,reviews:<ReviewsPage/>,performance:<PerformancePage/>,simulations:<SimulationsPage/>,materials:<MaterialsPage/>,history:<HistoryPage/>,settings:<SettingsPage/>}
  return <><Layout page={page} setPage={setPage}>{pages[page]}</Layout><FeedbackCenter/><AchievementCelebration achievement={celebrationQueue[0]||null} onClose={closeCelebration}/></>
}
