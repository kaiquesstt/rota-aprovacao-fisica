export type FeedbackKind = 'success'|'info'|'warning'|'danger'

export function notify(message:string, detail?:string, kind:FeedbackKind='success'){
  if(typeof window==='undefined') return
  window.dispatchEvent(new CustomEvent('rota-feedback',{detail:{message,detail,kind,id:Date.now()}}))
}
