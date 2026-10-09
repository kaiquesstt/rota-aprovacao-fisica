import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{}))}

// Pede ao navegador armazenamento persistente, para que o progresso não seja apagado automaticamente quando faltar espaço
if(navigator.storage&&navigator.storage.persist){navigator.storage.persisted().then(ok=>{if(!ok)navigator.storage.persist().catch(()=>{})}).catch(()=>{})}
