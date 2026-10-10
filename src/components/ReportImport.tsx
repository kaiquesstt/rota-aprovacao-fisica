import { useState } from 'react'
import { ClipboardPaste, FileCheck2, X } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'
import { matchTopics, parseReportCode, type ImportedReport } from '../lib/reportImport'
import { fmtDate } from '../lib/date'

const mmss=(s:number)=>`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`

export function ReportImport(){
  const importReport=useAppStore(x=>x.importReport)
  const [code,setCode]=useState(''),[error,setError]=useState(''),[report,setReport]=useState<ImportedReport|null>(null),[topicId,setTopicId]=useState(''),[options,setOptions]=useState<string[]>([])
  const read=()=>{
    try{
      const r=parseReportCode(code),m=matchTopics(r)
      setReport(r);setError('');setOptions(m.candidates.map(t=>t.id));setTopicId(m.exact?.id||m.candidates[0]?.id||'')
    }catch(e){setReport(null);setError(e instanceof Error?e.message:'Não foi possível ler o código.')}
  }
  const clear=()=>{setCode('');setReport(null);setError('');setTopicId('')}
  const confirm=()=>{if(report&&topicId&&importReport(report,topicId))clear()}
  const acc=report?Math.round(report.correct/report.total*100):0
  const avg=report&&report.total&&report.durationSeconds?report.durationSeconds/report.total:0
  const slow=report?[...report.perQuestion].sort((a,b)=>b.seconds-a.seconds).slice(0,3):[]
  const wrong=report?report.perQuestion.filter(q=>!q.correct).map(q=>q.n):[]
  const matched=topics.find(t=>t.id===topicId)
  return <section className="panel import-panel">
    <div className="panel-title"><div><span className="eyebrow">IMPORTAR RELATÓRIO</span><h3>Lista de questões em HTML</h3><p className="import-hint">No fim de cada lista, copie o código do relatório (começa com <b>ROTA1:</b>) e cole aqui. Acertos e tempo entram juntos no histórico.</p></div><ClipboardPaste/></div>
    {!report&&<><textarea className="import-code" rows={3} value={code} onChange={e=>setCode(e.target.value)} placeholder="ROTA1:eyJ2Ijox..."/>
      {error&&<div className="import-error">{error}</div>}
      <button className="cta" onClick={read} disabled={!code.trim()}><FileCheck2 size={16}/> Ler relatório</button></>}
    {report&&<div className="import-preview">
      <div className="import-stats">
        <div><strong>{report.correct}/{report.total}</strong><small>acertos • {acc}%</small></div>
        <div><strong>{report.durationSeconds?mmss(report.durationSeconds):'—'}</strong><small>tempo total</small></div>
        <div><strong>{avg?mmss(avg):'—'}</strong><small>média por questão</small></div>
        <div><strong>{fmtDate(report.date)}</strong><small>data</small></div>
      </div>
      {(slow.length>0||wrong.length>0)&&<p className="import-detail">{wrong.length>0&&<>Erradas: questões {wrong.join(', ')}. </>}{slow.length>0&&<>Mais demoradas: {slow.map(q=>`Q${q.n} (${mmss(q.seconds)})`).join(', ')}.</>}</p>}
      <label>Conteúdo do app {report.topic&&<span>(no relatório: “{report.topic}”)</span>}
        <select value={topicId} onChange={e=>setTopicId(e.target.value)}>
          {!topicId&&<option value="">Escolha o conteúdo…</option>}
          {options.length>0&&<optgroup label="Mais parecidos">{options.map(id=>{const t=topics.find(x=>x.id===id)!;return <option key={id} value={id}>{t.discipline} — {t.title}</option>})}</optgroup>}
          <optgroup label="Todos os conteúdos">{topics.filter(t=>!options.includes(t.id)).map(t=><option key={t.id} value={t.id}>{t.discipline} — {t.title}</option>)}</optgroup>
        </select>
      </label>
      {matched&&<small className="muted">{matched.group} • {matched.officialItem}</small>}
      <div className="disc-actions"><button className="cta" disabled={!topicId} onClick={confirm}><FileCheck2 size={16}/> Confirmar importação</button><button className="secondary" onClick={clear}><X size={16}/> Cancelar</button></div>
    </div>}
  </section>
}
