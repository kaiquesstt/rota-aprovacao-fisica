import { useState } from 'react'
import { BarChart3, BookOpen, CheckCircle2, Clock3, FileQuestion, Flame, Play, RotateCcw, Target, Trophy, Zap } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts'
import { MetricCard } from '../components/MetricCard'
import { ChartBox } from '../components/ChartBox'
import { CutPanel } from '../components/CutPanel'
import { useAppStore } from '../store/useAppStore'
import { topics } from '../data/topics'
import { overallAccuracy } from '../lib/analytics'
import { achievementData, daysToExam, disciplineStats, nextTopic, paceInfo, suggestionQueue, priorityInfo, readinessInfo, recentActivity, statusCounts, streak, totalQuestions, totalStudySeconds, weightedCoverage, dailySeries, xpInfo } from '../lib/analytics'
import { fmtDuration, today } from '../lib/date'
import type { PageId } from '../types'

export function HomePage({go}:{go:(p:PageId)=>void}){
  const s=useAppStore(x=>x.data),startTimer=useAppStore(x=>x.startTimer)
  const next=nextTopic(s),nextWhy=next?priorityInfo(s,next).reasons:[],ready=readinessInfo(s),qTotal=totalQuestions(s),pace=paceInfo(s),openErr=s.errors.filter(e=>!e.resolved).length,upNext=suggestionQueue(s,3,1,next?[next.id]:[]).map(x=>x.t),series=dailySeries(s,15),status=statusCounts(s),xp=xpInfo(s),disc=disciplineStats(s).filter(x=>x.totalTopics>0),recent=recentActivity(s),achievements=achievementData(s)
  const [showAllAchievements,setShowAllAchievements]=useState(false)
  const unlocked=achievements.filter(a=>a.done).length
  const statusData=[{name:'Dominado',value:status.dominado,color:'#18a47c'},{name:'Revisando',value:status.revisando,color:'#4f9cf2'},{name:'Estudando',value:status.estudando,color:'#e9ad3e'},{name:'Não iniciado',value:status.nao_iniciado,color:'#c8d5df'}]
  return <div className="home-grid">
    <section className="home-main">
      <div className="page-heading"><div><span className="eyebrow">COMANDO DE ESTUDO</span><h1>Seu centro de controle para a aprovação em Física.</h1></div><div className="quote">“Disciplina hoje. Aprovação amanhã.”</div></div>
      <div className="today-row">
        <article className="today-hero"><span className="eyebrow light">HOJE</span><h2>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</h2><p>Foco, constância e propósito. Você está construindo um resultado, sessão por sessão.</p><div className="mountain-art"><span></span><span></span><span></span></div><small>{daysToExam()} dias até a prova</small></article>
        <article className="next-action"><div className="next-head"><div className="round-icon"><Zap size={21}/></div><div><span className="eyebrow">PRÓXIMA AÇÃO SUGERIDA</span><h2>{next?.title||'Escolher um conteúdo'}</h2></div></div><p>{next?`${next.discipline} • ${next.group} • cerca de ${next.minutes} min`:'Abra o mapa de conteúdos para começar.'}</p>{nextWhy.length>0&&<p className="next-why">Por quê: {nextWhy.slice(0,3).join(' · ')}.</p>}<button className="cta" onClick={()=>{if(next){startTimer(next.id,next.minutes);go('study')}}}><Play size={17}/> Iniciar agora</button></article>
      </div>
      <div className="quick-actions">
        <button onClick={()=>go('questions')}><FileQuestion/><span><b>Questões</b><small>Registre por assunto e banca</small></span></button>
        <button onClick={()=>go('study')}><Clock3/><span><b>Cronômetro</b><small>Estudo focado com método</small></span></button>
        <button onClick={()=>go('errors')}><RotateCcw/><span><b>Erros</b><small>{openErr} em aberto para retomar</small></span></button>
        <button onClick={()=>go('performance')}><BarChart3/><span><b>Desempenho</b><small>Veja sua evolução gráfica</small></span></button>
      </div>
      <div className="metric-row">
        <MetricCard label="Prontidão" value={ready.value===null?'—':`${ready.value}%`} sub={ready.value===null?ready.reason:'índice composto'} icon={<Target size={20}/>}/>
        <MetricCard label="Edital" value={`${weightedCoverage(s)}%`} sub="cobertura ponderada" icon={<BookOpen size={20}/>}/>
        <MetricCard label="Acertos" value={qTotal?`${overallAccuracy(s)}%`:'—'} sub={qTotal?'nas questões registradas':'nenhuma questão registrada'} icon={<CheckCircle2 size={20}/>}/>
        <MetricCard label="Questões" value={totalQuestions(s)} sub="volume acumulado" icon={<FileQuestion size={20}/>}/>
        <MetricCard label="Estudo" value={fmtDuration(totalStudySeconds(s))} sub="tempo acumulado" icon={<Clock3 size={20}/>}/>
        <MetricCard label="Sequência" value={`${streak(s)} dias`} sub="consistência recente" icon={<Flame size={20}/>}/>
      </div>
      <CutPanel s={s}/>
      <article className="panel achievements-panel"><div className="panel-title"><div><span className="eyebrow">CONQUISTAS</span><h3>Marcos da sua preparação</h3><p className="achievement-summary-copy">{unlocked} de {achievements.length} conquistas desbloqueadas</p></div><button className="text-btn" onClick={()=>setShowAllAchievements(v=>!v)}>{showAllAchievements?'Mostrar menos':'Ver todas'} →</button></div><div className="achievement-overall"><span style={{width:`${Math.round(unlocked/achievements.length*100)}%`}}></span></div><div className="achievement-grid">{achievements.slice(0,showAllAchievements?achievements.length:6).map(a=><div className={`achievement-card ${a.done?'unlocked':'locked'}`} key={a.id}><div className="achievement-icon">{a.icon}</div><div className="achievement-copy"><strong>{a.title}</strong><small>{a.desc}</small><div className="achievement-meta"><span>{a.done?'Concluída':'Em progresso'}</span><b>{a.currentLabel} / {a.targetLabel}</b></div><div className="achievement-progress"><i style={{width:`${a.done?100:a.pct}%`}}></i></div></div></div>)}</div></article>
      <div className="dashboard-grid two">
        <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">EVOLUÇÃO DIÁRIA</span><h3>Últimos 15 dias</h3></div><button className="text-btn" onClick={()=>go('performance')}>Ver detalhes →</button></div><ChartBox height={270}>{({width,height})=><ComposedChart width={width} height={height} data={series} margin={{top:10,right:18,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#e6edf3"/><XAxis dataKey="day" interval={2}/><YAxis/><Tooltip/><Bar dataKey="questions" fill="#7db8f5" opacity={.55}/><Line type="monotone" dataKey="accuracy" stroke="#15a6b6" strokeWidth={3} dot={{r:3}} connectNulls/></ComposedChart>}</ChartBox></article>
        <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">CONTEÚDOS</span><h3>Distribuição dos status</h3></div></div><div className="donut-wrap"><div className="donut-chart-shell"><ChartBox height={250}>{({width,height})=><PieChart width={width} height={height}><Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={2}>{statusData.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/></PieChart>}</ChartBox></div><div className="legend-list">{statusData.map(x=><div key={x.name}><i style={{background:x.color}}></i><span>{x.name}</span><b>{x.value}</b></div>)}</div></div></article>
      </div>
      <div className="dashboard-grid three">
        <article className="panel"><span className="eyebrow">DESEMPENHO POR ÁREA</span><h3>Leitura rápida</h3><ChartBox height={230}>{({width,height})=><BarChart width={width} height={height} data={disc.slice(0,6)} margin={{top:10,right:14,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#e8eef3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="score" fill="#238ed3" radius={[6,6,0,0]}/></BarChart>}</ChartBox></article>
        <article className="panel journey"><div className="panel-title"><div><span className="eyebrow">SUA JORNADA</span><h3>Nível {xp.level}</h3></div><Trophy size={22}/></div><strong>{xp.xp.toLocaleString('pt-BR')} XP</strong><div className="xpbar"><span style={{width:`${Math.round(xp.current/xp.next*100)}%`}}></span></div><small>{xp.next-xp.current} XP para o próximo nível</small><div className="journey-badges"><div><Flame/> {streak(s)} dias</div><div><FileQuestion/> {totalQuestions(s)} questões</div><div><CheckCircle2/> {status.dominado} dominados</div></div></article>
        <article className="panel recent"><span className="eyebrow">ATIVIDADE RECENTE</span><h3>Últimos registros</h3>{recent.slice(0,5).map((a,i)=><div className="activity" key={i}><div className="activity-dot"></div><div><b>{a.title}</b><small>{a.kind} • {a.detail}</small></div></div>)}{!recent.length&&<p className="muted">Seus primeiros registros aparecerão aqui.</p>}</article>
      </div>
    </section>
    <aside className="right-rail">
      <article className="rail-card dark pace-rail"><div className="rail-title"><CalendarIcon/> <b>Ritmo até a prova</b></div><div className="pace-big"><strong>{pace.neededPerDay.toFixed(1).replace('.',',')}</strong><span>unidades por dia para dominar as {pace.remaining} que faltam em {pace.days} dias</span></div><div className={`pace-status ${pace.onTrack?'ok':'behind'}`}>{pace.last7?`Últimos 7 dias: ${pace.last7} dominada${pace.last7>1?'s':''} (${pace.ratePerDay.toFixed(1).replace('.',',')}/dia)`:'Nenhuma unidade dominada nos últimos 7 dias'}</div><div className="agenda-list">{upNext.map(t=><div key={t.id}><span>{t.discipline}</span><b>{t.title}</b></div>)}</div><button onClick={()=>go('plan')}>Ver ritmo completo →</button></article>
      <article className="rail-card"><span className="eyebrow">MENSAGEM DO DIA</span><p className="daily-message">“Grandes resultados são construídos com pequenas ações, todos os dias.”</p></article>
      <article className="rail-card"><span className="eyebrow">RESUMO</span><h3>{status.dominado} de {topics.length} unidades dominadas</h3><p>{pace.remaining} unidades por dominar e {openErr} erro(s) em aberto.</p><button className="secondary" onClick={()=>go('performance')}>Abrir desempenho</button></article>
    </aside>
  </div>
}
function CalendarIcon(){return <Clock3 size={18}/>}
