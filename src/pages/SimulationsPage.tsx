import { useState } from 'react'
import { Target } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { notify } from '../lib/feedback'

const pct=(c:number,t:number)=>t?Math.round(c/t*100):0

export function SimulationsPage(){
  const s=useAppStore(x=>x.data),add=useAppStore(x=>x.addSimulation)
  const [split,setSplit]=useState(true)
  const [total,setTotal]=useState(60),[correct,setCorrect]=useState(0)
  const [bt,setBt]=useState(30),[bc,setBc]=useState(0),[et,setEt]=useState(30),[ec,setEc]=useState(0)
  const T=split?bt+et:total,C=split?bc+ec:correct,percent=pct(C,T)
  const save=()=>{
    if(T<=0||C<0||C>T||(split&&(bc>bt||ec>et))){notify('Confira os números','Os acertos não podem passar do total de questões.','warning');return}
    add(percent,T,C,split?{basicTotal:bt,basicCorrect:bc,specificTotal:et,specificCorrect:ec}:undefined)
  }
  return <div><div className="page-heading"><div><span className="eyebrow">SIMULADOS</span><h1>Registre resultados sem transformar isso em uma obrigação.</h1><p>Separando Básicos e Específicos, o resultado alimenta o painel da linha de corte.</p></div></div>
    <div className="question-grid"><section className="panel form-panel"><span className="eyebrow">NOVO RESULTADO</span><h3>Registrar simulado</h3>
      <label className="check-line"><input type="checkbox" checked={split} onChange={e=>setSplit(e.target.checked)}/> Separar por parte da prova (recomendado)</label>
      {split?<div className="form-2">
        <label>Básicos · total<input type="number" min={0} value={bt} onChange={e=>setBt(Math.max(0,+e.target.value||0))}/></label>
        <label>Básicos · acertos<input type="number" min={0} value={bc} onChange={e=>setBc(Math.max(0,+e.target.value||0))}/></label>
        <label>Específicos · total<input type="number" min={0} value={et} onChange={e=>setEt(Math.max(0,+e.target.value||0))}/></label>
        <label>Específicos · acertos<input type="number" min={0} value={ec} onChange={e=>setEc(Math.max(0,+e.target.value||0))}/></label>
      </div>:<div className="form-2"><label>Total<input type="number" min={0} value={total} onChange={e=>setTotal(Math.max(0,+e.target.value||0))}/></label><label>Acertos<input type="number" min={0} value={correct} onChange={e=>setCorrect(Math.max(0,+e.target.value||0))}/></label></div>}
      <div className="sim-preview"><strong>{percent}%</strong><span>{split?`Básicos ${pct(bc,bt)}% · Específicos ${pct(ec,et)}%`:'resultado calculado'}</span></div>
      <button className="cta full" onClick={save}>Salvar simulado</button></section>
      <aside className="panel"><div className="panel-title"><div><span className="eyebrow">HISTÓRICO</span><h3>Resultados anteriores</h3></div><Target/></div>{s.simulations.slice().reverse().slice(0,12).map(x=><div className="upcoming-row" key={x.id}><div><b>{x.name||'Simulado'}</b><small>{x.date}{x.basicTotal||x.specificTotal?` · Básicos ${pct(x.basicCorrect||0,x.basicTotal||0)}% · Específicos ${pct(x.specificCorrect||0,x.specificTotal||0)}%`:''}</small></div><span>{x.percent}%</span></div>)}{!s.simulations.length&&<p className="muted">Nenhum simulado registrado.</p>}</aside></div></div>
}
