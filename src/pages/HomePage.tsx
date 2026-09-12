import { BarChart3, BookOpen, CheckCircle2, Clock3, FileQuestion, Flame, Play, RotateCcw, Target, Trophy, Zap } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts'
import { MetricCard } from '../components/MetricCard'
import { ChartBox } from '../components/ChartBox'
import { useAppStore } from '../store/useAppStore'
import { topics } from '../data/topics'
import { daysToExam, disciplineStats, dueReviews, nextTopic, overallAccuracy, readiness, recentActivity, statusCounts, streak, totalQuestions, totalStudySeconds, weightedCoverage, weeklySeries, xpInfo } from '../lib/analytics'
import { fmtDuration, fmtDate, today } from '../lib/date'
import type { PageId } from '../types'

export function HomePage({go}:{go:(p:PageId)=>void}){
  const s=useAppStore(x=>x.data),startTimer=useAppStore(x=>x.startTimer)
  const next=nextTopic(s),due=dueReviews(s),series=weeklySeries(s),status=statusCounts(s),xp=xpInfo(s),disc=disciplineStats(s).filter(x=>x.totalTopics>0),recent=recentActivity(s)
  const statusData=[{name:'Dominado',value:status.dominado,color:'#18a47c'},{name:'Revisando',value:status.revisando,color:'#4f9cf2'},{name:'Estudando',value:status.estudando,color:'#e9ad3e'},{name:'Não iniciado',value:status.nao_iniciado,color:'#c8d5df'}]
  return <div className="home-grid">
    <section className="home-main">
      <div className="page-heading"><div><span className="eyebrow">COMANDO DE ESTUDO</span><h1>Seu centro de controle para a aprovação em Física.</h1></div><div className="quote">“Disciplina hoje. Aprovação amanhã.”</div></div>
      <div className="today-row">
        <article className="today-hero"><span className="eyebrow light">HOJE</span><h2>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}</h2><p>Foco, constância e propósito. Você está construindo um resultado, sessão por sessão.</p><div className="mountain-art"><span></span><span></span><span></span></div><small>{daysToExam()} dias até a prova</small></article>
        <article className="next-action"><div className="next-head"><div className="round-icon"><Zap size={21}/></div><div><span className="eyebrow">PRÓXIMA AÇÃO SUGERIDA</span><h2>{due.length?`Revisar ${due.length} conteúdo${due.length>1?'s':''}`:next?.title||'Escolher um conteúdo'}</h2></div></div><p>{due.length?'Há revisões vencidas. Você decide se quer fazê-las agora ou seguir para conteúdo novo.':next?`${next.discipline} • ${next.group} • cerca de ${next.minutes} min`:'Abra o mapa de conteúdos para começar.'}</p><button className="cta" onClick={()=>{if(due.length)go('reviews');else if(next){startTimer(next.id,next.minutes);go('study')}}}><Play size={17}/> Iniciar agora</button></article>
      </div>
      <div className="quick-actions">
        <button onClick={()=>go('questions')}><FileQuestion/><span><b>Questões</b><small>Registre por assunto e banca</small></span></button>
        <button onClick={()=>go('study')}><Clock3/><span><b>Cronômetro</b><small>Estudo focado com método</small></span></button>
        <button onClick={()=>go('reviews')}><RotateCcw/><span><b>Revisões</b><small>Reforce o que já estudou</small></span></button>
        <button onClick={()=>go('performance')}><BarChart3/><span><b>Desempenho</b><small>Veja sua evolução gráfica</small></span></button>
      </div>
      <div className="metric-row">
        <MetricCard label="Prontidão" value={`${readiness(s)}%`} sub="índice composto" icon={<Target size={20}/>}/>
        <MetricCard label="Edital" value={`${weightedCoverage(s)}%`} sub="cobertura ponderada" icon={<BookOpen size={20}/>}/>
        <MetricCard label="Acertos" value={`${overallAccuracy(s)}%`} sub="nas questões registradas" icon={<CheckCircle2 size={20}/>}/>
        <MetricCard label="Questões" value={totalQuestions(s)} sub="volume acumulado" icon={<FileQuestion size={20}/>}/>
        <MetricCard label="Estudo" value={fmtDuration(totalStudySeconds(s))} sub="tempo acumulado" icon={<Clock3 size={20}/>}/>
        <MetricCard label="Sequência" value={`${streak(s)} dias`} sub="consistência recente" icon={<Flame size={20}/>}/>
      </div>
      <div className="dashboard-grid two">
        <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">EVOLUÇÃO</span><h3>Últimas 8 semanas</h3></div><button className="text-btn" onClick={()=>go('performance')}>Ver detalhes →</button></div><ChartBox height={270}>{({width,height})=><ComposedChart width={width} height={height} data={series} margin={{top:10,right:18,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#e6edf3"/><XAxis dataKey="week"/><YAxis/><Tooltip/><Bar dataKey="questions" fill="#7db8f5" opacity={.55}/><Line type="monotone" dataKey="accuracy" stroke="#15a6b6" strokeWidth={3} dot={{r:3}}/></ComposedChart>}</ChartBox></article>
        <article className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">CONTEÚDOS</span><h3>Distribuição dos status</h3></div></div><div className="donut-wrap"><div className="donut-chart-shell"><ChartBox height={250}>{({width,height})=><PieChart width={width} height={height}><Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={2}>{statusData.map(x=><Cell key={x.name} fill={x.color}/>)}</Pie><Tooltip/></PieChart>}</ChartBox></div><div className="legend-list">{statusData.map(x=><div key={x.name}><i style={{background:x.color}}></i><span>{x.name}</span><b>{x.value}</b></div>)}</div></div></article>
      </div>
      <div className="dashboard-grid three">
        <article className="panel"><span className="eyebrow">DESEMPENHO POR ÁREA</span><h3>Leitura rápida</h3><ChartBox height={230}>{({width,height})=><BarChart width={width} height={height} data={disc.slice(0,6)} margin={{top:10,right:14,left:0,bottom:8}}><CartesianGrid strokeDasharray="3 3" stroke="#e8eef3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis domain={[0,100]}/><Tooltip/><Bar dataKey="score" fill="#238ed3" radius={[6,6,0,0]}/></BarChart>}</ChartBox></article>
        <article className="panel journey"><div className="panel-title"><div><span className="eyebrow">SUA JORNADA</span><h3>Nível {xp.level}</h3></div><Trophy size={22}/></div><strong>{xp.xp.toLocaleString('pt-BR')} XP</strong><div className="xpbar"><span style={{width:`${Math.round(xp.current/xp.next*100)}%`}}></span></div><small>{xp.next-xp.current} XP para o próximo nível</small><div className="journey-badges"><div><Flame/> {streak(s)} dias</div><div><FileQuestion/> {totalQuestions(s)} questões</div><div><CheckCircle2/> {status.dominado} dominados</div></div></article>
        <article className="panel recent"><span className="eyebrow">ATIVIDADE RECENTE</span><h3>Últimos registros</h3>{recent.slice(0,5).map((a,i)=><div className="activity" key={i}><div className="activity-dot"></div><div><b>{a.title}</b><small>{a.kind} • {a.detail}</small></div></div>)}{!recent.length&&<p className="muted">Seus primeiros registros aparecerão aqui.</p>}</article>
      </div>
    </section>
    <aside className="right-rail">
      <article className="rail-card dark"><div className="rail-title"><CalendarIcon/> <b>Minha agenda da semana</b></div><div className="week-days">{Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7)+i);return <div className={d.toISOString().slice(0,10)===today()?'today':''} key={i}><small>{['SEG','TER','QUA','QUI','SEX','SÁB','DOM'][i]}</small><b>{d.getDate()}</b></div>})}</div><div className="agenda-list">{due.slice(0,4).map(r=>{const t=topics.find(x=>x.id===r.topicId);return <div key={r.id}><span>Revisão</span><b>{t?.title||'Conteúdo'}</b></div>})}{!due.length&&<><div><span>Hoje</span><b>Escolher 1 conteúdo principal</b></div><div><span>Questões</span><b>Registrar um bloco de exercícios</b></div><div><span>Revisão</span><b>Manter a fila em dia</b></div></>}</div><button onClick={()=>go('plan')}>Ver plano completo →</button></article>
      <article className="rail-card"><span className="eyebrow">MENSAGEM DO DIA</span><p className="daily-message">“Grandes resultados são construídos com pequenas ações, todos os dias.”</p></article>
      <article className="rail-card"><span className="eyebrow">RESUMO</span><h3>{status.dominado} conteúdos dominados</h3><p>{due.length} revisão(ões) pendente(s) e {s.errors.filter(e=>!e.resolved).length} erro(s) abertos.</p><button className="secondary" onClick={()=>go('performance')}>Abrir desempenho</button></article>
    </aside>
  </div>
}
function CalendarIcon(){return <Clock3 size={18}/>}
