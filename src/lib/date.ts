export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
export const dateOnly = (s:string) => new Date(`${s}T12:00:00`)
export const addDays = (s:string,n:number) => {
  const d=dateOnly(s); d.setDate(d.getDate()+n)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
export const daysBetween=(a:string,b:string)=>Math.floor((dateOnly(b).getTime()-dateOnly(a).getTime())/86400000)
export const fmtDuration=(s:number)=>s>=3600?`${(s/3600).toFixed(s%3600?1:0)} h`:`${Math.round(s/60)} min`
export const fmtDate=(s:string)=>dateOnly(s).toLocaleDateString('pt-BR')
export const weekStart=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+offset*7);return d}
export const dateStr=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
