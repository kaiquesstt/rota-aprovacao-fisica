import { useMemo, useState } from 'react'
import { ClipboardCopy, PenLine, Save, Trash2 } from 'lucide-react'
import { topics } from '../data/topics'
import { useAppStore } from '../store/useAppStore'
import { notify } from '../lib/feedback'
import { today, fmtDate } from '../lib/date'
import type { DiscursiveRecord } from '../types'

// Edital (Anexo V e item 8.18): 2 questões de conteúdo específico, 5 pontos cada, de 15 a 30 linhas,
// situações-problema baseadas em casos escolares. Eliminado quem fizer menos de 5 pontos no total.
const MIN_LINES=15,MAX_LINES=30,MAX_SCORE=5,CHARS_PER_LINE=70
const fisica=topics.filter(t=>t.discipline==='Física')
const groups=[...new Set(fisica.map(t=>t.group))]
const estimateLines=(text:string)=>text.trim()?text.split(/\n/).reduce((a,p)=>a+Math.max(1,Math.ceil(p.trim().length/CHARS_PER_LINE)),0):0
const lineState=(n:number)=>n===0?'empty':n<MIN_LINES?'short':n>MAX_LINES?'long':'ok'
const lineMsg:Record<string,string>={empty:'Comece a escrever para ver a estimativa.',short:`Abaixo do mínimo de ${MIN_LINES} linhas exigido.`,long:`Acima do máximo de ${MAX_LINES} linhas.`,ok:`Dentro do intervalo de ${MIN_LINES} a ${MAX_LINES} linhas.`}

function correctionPrompt(d:{theme:string;topicTitle?:string;prompt?:string;answer?:string;lines:number}){
  return `Corrija esta resposta discursiva no padrão da FGV para o concurso SEDUC-PA (Professor de Física). A questão vale ${MAX_SCORE} pontos e a resposta deve ter de ${MIN_LINES} a ${MAX_LINES} linhas. Avalie domínio do conteúdo, adequação à situação-problema escolar, estrutura e norma culta. Dê a nota, o que faltou para a nota máxima e uma versão melhorada.\n\nTema: ${d.theme}${d.topicTitle?`\nConteúdo do edital: ${d.topicTitle}`:''}\nLinhas (estimativa): ${d.lines}\n\nENUNCIADO:\n${d.prompt||'(não informado)'}\n\nMINHA RESPOSTA:\n${d.answer||'(não informada)'}`
}
async function copy(text:string){try{await navigator.clipboard.writeText(text);notify('Copiado','Cole na conversa para receber a correção.')}catch{notify('Não foi possível copiar','Selecione o texto e copie manualmente.','warning')}}

function Entry({d}:{d:DiscursiveRecord}){
  const update=useAppStore(x=>x.updateDiscursive),remove=useAppStore(x=>x.deleteDiscursive)
  const [open,setOpen]=useState(false),[score,setScore]=useState(d.score===null?'':String(d.score)),[feedback,setFeedback]=useState(d.feedback||'')
  const topic=topics.find(t=>t.id===d.topicId)
  const save=()=>{const v=score.trim()===''?null:Math.max(0,Math.min(d.maxScore,+score.replace(',','.')));if(v!==null&&!Number.isFinite(v)){notify('Nota inválida','Use um número, por exemplo 3,5.','warning');return}update(d.id,{score:v,feedback})}
  return <article className="disc-entry">
    <button className="disc-entry-head" onClick={()=>setOpen(o=>!o)} aria-expanded={open}>
      <div><b>{d.theme}</b><small>{fmtDate(d.date)} • {d.lines} linhas{topic?` • ${topic.title}`:''}</small></div>
      <span className={`disc-score ${d.score===null?'pending':d.score/d.maxScore>=.5?'good':'warn'}`}>{d.score===null?'Sem nota':`${String(d.score).replace('.',',')}/${d.maxScore}`}</span>
    </button>
    {open&&<div className="disc-entry-body">
      {d.prompt&&<><span className="eyebrow">ENUNCIADO</span><p className="disc-text">{d.prompt}</p></>}
      {d.answer&&<><span className="eyebrow">RESPOSTA</span><p className="disc-text">{d.answer}</p></>}
      {d.notes&&<><span className="eyebrow">OBSERVAÇÕES</span><p className="disc-text">{d.notes}</p></>}
      <div className="form-2"><label>Nota (0 a {d.maxScore})<input inputMode="decimal" value={score} onChange={e=>setScore(e.target.value)} placeholder="ex.: 3,5"/></label></div>
      <label>Devolutiva da correção<textarea rows={4} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Cole aqui os pontos principais da correção"/></label>
      <div className="disc-actions">
        <button className="cta" onClick={save}><Save size={16}/> Salvar nota</button>
        {(d.prompt||d.answer)&&<button className="secondary" onClick={()=>copy(correctionPrompt({...d,topicTitle:topic?.title}))}><ClipboardCopy size={16}/> Copiar para correção</button>}
        <button className="danger-icon" title="Excluir treino" onClick={()=>{if(window.confirm('Excluir este treino discursivo?'))remove(d.id)}}><Trash2 size={16}/></button>
      </div>
    </div>}
  </article>
}

export function DiscursivePage(){
  const s=useAppStore(x=>x.data),add=useAppStore(x=>x.addDiscursive)
  const [theme,setTheme]=useState(''),[topicId,setTopicId]=useState(''),[prompt,setPrompt]=useState(''),[answer,setAnswer]=useState(''),[date,setDate]=useState(today())
  const [manualLines,setManualLines]=useState(''),[score,setScore]=useState(''),[notes,setNotes]=useState('')
  const est=estimateLines(answer),lines=manualLines.trim()?Math.max(0,Math.round(+manualLines)||0):est,st=lineState(lines)
  const scored=s.discursives.filter(d=>d.score!==null)
  const avg=useMemo(()=>scored.length?Math.round(scored.reduce((a,d)=>a+(d.score as number)/d.maxScore,0)/scored.length*100):null,[scored])
  const topic=topics.find(t=>t.id===topicId)
  const reset=()=>{setTheme('');setPrompt('');setAnswer('');setManualLines('');setScore('');setNotes('')}
  const save=()=>{
    if(!theme.trim()&&!topic){notify('Informe o tema','Escreva um tema ou escolha o conteúdo do edital.','warning');return}
    if(!answer.trim()&&!manualLines.trim()){notify('Falta a resposta','Escreva a resposta ou informe quantas linhas escreveu à mão.','warning');return}
    const v=score.trim()===''?null:Math.max(0,Math.min(MAX_SCORE,+score.replace(',','.')))
    if(v!==null&&!Number.isFinite(v)){notify('Nota inválida','Use um número de 0 a 5.','warning');return}
    add({date,theme:theme.trim()||topic!.title,topicId:topicId||undefined,prompt:prompt.trim(),answer:answer.trim(),lines,score:v,maxScore:MAX_SCORE,notes:notes.trim(),feedback:''})
    reset()
  }
  return <div>
    <div className="page-heading"><div><span className="eyebrow">PROVA DISCURSIVA</span><h1>Treino de respostas discursivas.</h1><p>Na prova são 2 questões de Física, de 5 pontos cada, com 15 a 30 linhas, a partir de situações-problema em casos escolares. Quem somar menos de 5 pontos é eliminado.</p></div></div>
    <div className="metric-row compact">
      <div className="metric-card"><div className="metric-icon"><PenLine/></div><div><small>Treinos</small><strong>{s.discursives.length}</strong><span>{scored.length} com nota</span></div></div>
      <div className="metric-card"><div className="metric-icon"><PenLine/></div><div><small>Média</small><strong>{avg===null?'—':`${avg}%`}</strong><span>{avg===null?'registre notas para calcular':'da nota máxima por questão'}</span></div></div>
      <div className="metric-card"><div className="metric-icon"><PenLine/></div><div><small>Corte</small><strong>5 de 10</strong><span>soma das duas questões</span></div></div>
    </div>
    <div className="disc-grid">
      <section className="panel form-panel">
        <div className="panel-title"><div><span className="eyebrow">NOVO TREINO</span><h3>Escrever e registrar</h3></div><PenLine/></div>
        <div className="form-2"><label>Data<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
          <label>Conteúdo do edital <span>(opcional)</span><select value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">Sem vínculo</option>{groups.map(g=><optgroup key={g} label={g}>{fisica.filter(t=>t.group===g).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>)}</select></label></div>
        <label>Tema<input value={theme} onChange={e=>setTheme(e.target.value)} placeholder="Ex.: Aula sobre conservação de energia em usina hidrelétrica"/></label>
        <label>Enunciado<textarea rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Cole a situação-problema"/></label>
        <label>Resposta<textarea rows={12} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Escreva como faria na folha de resposta"/></label>
        <div className={`line-meter line-${st}`}>
          <div className="line-bar"><span style={{width:`${Math.min(100,lines/MAX_LINES*100)}%`}}></span><i style={{left:`${MIN_LINES/MAX_LINES*100}%`}}></i></div>
          <div><b>{lines} linhas</b> {manualLines.trim()?'(informado)':`(estimativa: ~${CHARS_PER_LINE} caracteres por linha)`} • {lineMsg[st]}</div>
        </div>
        <div className="form-2"><label>Linhas escritas à mão <span>(opcional)</span><input type="number" min={0} value={manualLines} onChange={e=>setManualLines(e.target.value)} placeholder={`${est}`}/></label><label>Nota, se já corrigida <span>(0 a 5)</span><input inputMode="decimal" value={score} onChange={e=>setScore(e.target.value)} placeholder="ex.: 3,5"/></label></div>
        <label>Observações <span>(opcional)</span><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="O que achou difícil, tempo gasto…"/></label>
        <div className="disc-actions"><button className="cta" onClick={save}><Save size={16}/> Salvar treino</button><button className="secondary" disabled={!answer.trim()} onClick={()=>copy(correctionPrompt({theme:theme||topic?.title||'Treino discursivo',topicTitle:topic?.title,prompt,answer,lines}))}><ClipboardCopy size={16}/> Copiar para correção</button></div>
      </section>
      <aside className="panel"><div className="panel-title"><div><span className="eyebrow">HISTÓRICO</span><h3>Treinos registrados</h3></div></div>
        <div className="disc-list">{s.discursives.map(d=><Entry key={d.id} d={d}/>)}</div>
        {!s.discursives.length&&<div className="empty-state">Nenhum treino ainda. Peça um enunciado no estilo da prova, escreva aqui e use “Copiar para correção”.</div>}
      </aside>
    </div>
  </div>
}
