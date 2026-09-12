import { useEffect, useRef, useState } from 'react'

export function ChartBox({height=300,children,className=''}:{height?:number;children:(size:{width:number;height:number})=>React.ReactNode;className?:string}){
  const ref=useRef<HTMLDivElement>(null)
  const [width,setWidth]=useState(0)
  useEffect(()=>{
    const el=ref.current
    if(!el)return
    const update=()=>setWidth(Math.max(0,Math.floor(el.getBoundingClientRect().width)))
    update()
    const ro=new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize',update)
    return()=>{ro.disconnect();window.removeEventListener('resize',update)}
  },[])
  return <div ref={ref} className={`chart-box ${className}`} style={{height}}>{width>40?children({width,height}):null}</div>
}
