import { useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import type { PageId } from './types'
import { useAppStore } from './store/useAppStore'
import { loadInitialState } from './lib/storage'
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
  const hydrated=useAppStore(s=>s.hydrated),hydrate=useAppStore(s=>s.hydrate)
  const [page,setPage]=useState<PageId>('home')
  useEffect(()=>{loadInitialState().then(({state,source})=>hydrate(state,source))},[hydrate])
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setPage('contents')}if(e.altKey&&e.key==='1')setPage('home');if(e.altKey&&e.key==='2')setPage('contents');if(e.altKey&&e.key==='3')setPage('questions');if(e.altKey&&e.key==='4')setPage('performance')};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[])
  if(!hydrated)return <div className="loading-screen"><div className="loader"></div><strong>Preparando sua Rota da Aprovação 2.0…</strong><span>Lendo seu progresso da versão anterior com segurança.</span></div>
  const pages:Record<PageId,React.ReactNode>={home:<HomePage go={setPage}/>,plan:<PlanPage/>,study:<StudyPage/>,contents:<ContentsPage go={setPage}/>,questions:<QuestionsPage/>,reviews:<ReviewsPage/>,performance:<PerformancePage/>,simulations:<SimulationsPage/>,materials:<MaterialsPage/>,history:<HistoryPage/>,settings:<SettingsPage/>}
  return <Layout page={page} setPage={setPage}>{pages[page]}</Layout>
}
