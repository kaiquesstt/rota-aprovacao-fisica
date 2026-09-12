import { useEffect, useState, type CSSProperties } from 'react'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import type { AchievementInfo } from '../lib/analytics'
import type { FeedbackKind } from '../lib/feedback'

type Feedback={id:number;message:string;detail?:string;kind:FeedbackKind}

export function FeedbackCenter(){
  const [feedback,setFeedback]=useState<Feedback|null>(null)
  useEffect(()=>{
    let timer:number|undefined
    const handler=(e:Event)=>{
      const next=(e as CustomEvent<Feedback>).detail
      setFeedback(next)
      window.clearTimeout(timer)
      timer=window.setTimeout(()=>setFeedback(null),2200)
    }
    window.addEventListener('rota-feedback',handler)
    return()=>{window.removeEventListener('rota-feedback',handler);window.clearTimeout(timer)}
  },[])
  if(!feedback)return null
  const Icon=feedback.kind==='danger'?XCircle:feedback.kind==='warning'?TriangleAlert:feedback.kind==='info'?Info:CheckCircle2
  return <div className={`feedback-center ${feedback.kind}`} role="status" aria-live="polite"><div className="feedback-icon"><Icon size={34}/></div><div><strong>{feedback.message}</strong>{feedback.detail&&<span>{feedback.detail}</span>}</div></div>
}

export function AchievementCelebration({achievement,onClose}:{achievement:AchievementInfo|null;onClose:()=>void}){
  useEffect(()=>{if(!achievement)return;const t=window.setTimeout(onClose,5200);return()=>window.clearTimeout(t)},[achievement,onClose])
  if(!achievement)return null
  return <div className="achievement-celebration" role="dialog" aria-modal="true" aria-label="Conquista desbloqueada">
    <div className="confetti-field" aria-hidden="true">{Array.from({length:34},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}></i>)}</div>
    <div className="celebration-card">
      <button className="celebration-close" onClick={onClose} aria-label="Fechar"><X size={20}/></button>
      <div className="celebration-kicker">CONQUISTA DESBLOQUEADA</div>
      <div className="celebration-icon">{achievement.icon}</div>
      <h2>{achievement.title}</h2>
      <p>{achievement.desc}</p>
      <div className="celebration-badge">+ marco na sua jornada</div>
      <strong>Parabéns, Kaique!</strong>
      <span>Seu progresso está ficando cada vez mais consistente.</span>
    </div>
  </div>
}
