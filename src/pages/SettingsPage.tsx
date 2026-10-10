import { useRef, useState } from 'react'
import { Database, Download, ShieldCheck, Upload } from 'lucide-react'
import { exportBackup, migrateState } from '../lib/storage'
import { useAppStore } from '../store/useAppStore'
import { notify } from '../lib/feedback'
import { topics } from '../data/topics'
import { APP_VERSION } from '../version'

export function SettingsPage(){
  const s=useAppStore(x=>x.data),source=useAppStore(x=>x.migrationSource),replace=useAppStore(x=>x.replaceData),update=useAppStore(x=>x.updateSettings),file=useRef<HTMLInputElement>(null),[name,setName]=useState(s.settings.displayName||'')
  const backup=()=>{const next=exportBackup(s);replace(next);notify('Backup exportado','Seu arquivo JSON foi preparado para download.')}
  const importFile=async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;try{replace(migrateState(JSON.parse(await f.text())));notify('Backup importado com sucesso','Backups antigos são convertidos para a organização atual dos conteúdos.')}catch{notify('Arquivo de backup inválido','Não foi possível ler esse arquivo.','danger')}finally{e.target.value=''}}
  return <div><div className="page-heading"><div><span className="eyebrow">CONFIGURAÇÕES</span><h1>Dados e backup.</h1><p>Seus registros ficam neste navegador. Exporte um backup de vez em quando.</p></div></div>
    <div className="settings-grid">
      <article className="panel safety-card"><div className="panel-title"><div><span className="eyebrow">DADOS</span><h3>Situação do armazenamento</h3></div><ShieldCheck/></div>
        <div className="storage-status"><div><small>Origem carregada</small><strong>{source||'Verificando...'}</strong></div><div><small>Versão</small><strong>{APP_VERSION}</strong></div><div><small>Unidades do edital</small><strong>{topics.length}</strong></div></div>
        <p>{s.meta?.topicsRemappedAt?`Seu progresso foi convertido para a nova organização dos conteúdos em ${new Date(s.meta.topicsRemappedAt).toLocaleDateString('pt-BR')}. Unidades que juntaram partes já iniciadas aparecem como “Estudando”; só ficam “Dominado” se todas as partes estavam dominadas.`:'Os conteúdos estão na organização atual.'}</p>
      </article>
      <article className="panel"><span className="eyebrow">BACKUP</span><h3>Proteja seu histórico</h3><div className="backup-actions"><button className="cta" onClick={backup}><Download/> Exportar JSON</button><button className="secondary" onClick={()=>file.current?.click()}><Upload/> Importar JSON</button><input ref={file} type="file" accept=".json,application/json" hidden onChange={importFile}/></div><small>Último backup: {s.meta?.lastBackupAt?new Date(s.meta.lastBackupAt).toLocaleString('pt-BR'):'nenhum backup externo registrado'}</small></article>
      <article className="panel"><span className="eyebrow">PERFIL</span><h3>Personalização simples</h3><label>Nome exibido<input value={name} onChange={e=>setName(e.target.value)} placeholder="Opcional"/></label><button className="secondary" onClick={()=>update({displayName:name})}>Salvar nome</button></article>
      <article className="panel"><div className="panel-title"><div><span className="eyebrow">ARMAZENAMENTO</span><h3>Offline-first</h3></div><Database/></div><p>O app guarda tudo no IndexedDB e mantém uma cópia no LocalStorage. Se você abrir duas abas, a que salvar por último atualiza a outra automaticamente.</p></article>
    </div></div>
}
