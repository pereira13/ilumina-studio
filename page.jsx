'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ClipboardList,
  Clock3, Copy, Download, Edit3, ExternalLink, FileImage, FileText, FolderOpen,
  Grid2X2, History, Image as ImageIcon, LayoutDashboard, Loader2, LogOut, Menu,
  Package, Plus, RefreshCw, Save, Search, Settings2, ShieldCheck, Sparkles, Trash2,
  Upload, X, Zap, ZoomIn,
} from 'lucide-react';
import { supabase, isConfigured } from '../lib/supabase';
import { AGENTS, BUCKET, EMPTY_FORM, IMAGE_TYPES, STATUS_META, prettyDate, safeError } from '../lib/constants';
import { downloadPrivateFile, loadWorkspace, logActivity, saveResultImage, saveSourceFiles } from '../lib/data';
import { makeDirectorPrompt, makePrompt } from '../lib/prompts';
import AuthScreen from '../components/AuthScreen';
import OfficeScene from '../components/OfficeScene';
import ProductModal from '../components/ProductModal';
import PromptModal from '../components/PromptModal';
import StatusPill from '../components/StatusPill';

const NAV = [
  { key:'office', label:'Escritório', icon:LayoutDashboard },
  { key:'products', label:'Produtos', icon:Package },
  { key:'gallery', label:'Galeria', icon:Grid2X2 },
  { key:'history', label:'Histórico', icon:History },
  { key:'guides', label:'Padrão visual', icon:BookOpen },
  { key:'settings', label:'Minha conta', icon:Settings2 },
];

const JOB_ACTIONS = [
  { value: 'in_progress', label: 'Em produção' },
  { value: 'needs_review', label: 'Em revisão' },
  { value: 'approved', label: 'Aprovar' },
  { value: 'changes_requested', label: 'Pedir correção' },
  { value: 'pending', label: 'Reabrir' },
];

function EmptyState({ icon: Icon = FolderOpen, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={25}/></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

function Toast({ value, onClose }) {
  if (!value) return null;
  return <div className={`toast ${value.type === 'error' ? 'toast-error' : ''}`} role="status"><span>{value.text}</span><button className="icon-button" onClick={onClose} aria-label="Dispensar"><X size={16}/></button></div>;
}

function Filename({ file, onOpen, onDelete }) {
  return <div className="file-row"><div className="file-icon">{file.content_type==='application/pdf'? <FileText size={18}/>:<FileImage size={18}/>}</div><div className="file-name"><strong title={file.filename}>{file.filename}</strong><small>{Math.round(file.byte_size / 1024)} KB · {prettyDate(file.created_at)}</small></div><button className="icon-button" onClick={()=>onOpen(file)} title="Baixar arquivo"><Download size={16}/></button><button className="icon-button danger-hover" onClick={()=>onDelete(file)} title="Excluir arquivo"><Trash2 size={16}/></button></div>;
}

export default function Page() {
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [tab,setTab]=useState('office');
  const [products,setProducts]=useState([]);
  const [logs,setLogs]=useState([]);
  const [signed,setSigned]=useState({});
  const [selectedId,setSelectedId]=useState(null);
  const [selectedAgent,setSelectedAgent]=useState('director');
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [toast,setToast]=useState(null);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [promptTarget,setPromptTarget]=useState(null);
  const [search,setSearch]=useState('');
  const [notes,setNotes]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [gptLinks,setGptLinks]=useState({});
  const sourceInput=useRef(null);
  const datasheetInput=useRef(null);
  const resultInput=useRef(null);
  const resultStep=useRef(null);

  useEffect(()=>{
    try {
      const saved=JSON.parse(window.localStorage.getItem('ilumina-gpt-links')||'{}');
      if(saved && typeof saved==='object' && !Array.isArray(saved)) setGptLinks(saved);
    } catch { /* links opcionais */ }
  },[]);

  function saveGptLinks(e){
    e.preventDefault();
    for(const [key,value] of Object.entries(gptLinks)){
      if(!value?.trim()) continue;
      try {
        const url=new URL(value.trim());
        if(url.protocol!=='https:' || url.hostname!=='chatgpt.com') throw new Error('Host inválido');
      } catch {
        notify(`Link inválido para ${AGENTS.find(a=>a.key===key)?.name||key}. Use https://chatgpt.com/...`,'error');
        return;
      }
    }
    window.localStorage.setItem('ilumina-gpt-links',JSON.stringify(gptLinks));
    notify('Links dos GPTs salvos neste navegador.');
  }

  const notify=useCallback((text,type='success')=>setToast({text,type,at:Date.now()}),[]);

  useEffect(()=>{
    if(!supabase){setAuthLoading(false);return;}
    let active=true;
    supabase.auth.getSession().then(({data,error})=>{
      if (!active) return;
      if (error) console.warn(error);
      setUser(data?.session?.user || null); setAuthLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if (active) {setUser(session?.user || null);setAuthLoading(false);}
    });
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);

  const refresh=useCallback(async(quiet=false)=>{
    if(!user?.id || !supabase)return;
    if(!quiet)setLoading(true);
    try{
      const data=await loadWorkspace(user.id);
      setProducts(data.products);setLogs(data.logs);setSigned(data.signed);
    }catch(err){notify(safeError(err),'error');}
    finally{setLoading(false);}
  },[user?.id,notify]);

  useEffect(()=>{
    if(user?.id)refresh();
    else {setProducts([]);setLogs([]);setSigned({});setSelectedId(null);}
  },[user?.id,refresh]);

  const current=useMemo(()=>products.find((p)=>p.id===selectedId)||products[0]||null,[products,selectedId]);
  const currentJobs=useMemo(()=>IMAGE_TYPES.map((image)=>current?.jobs?.find((job)=>job.image_number===image.id)||null),[current]);
  const currentAgent=AGENTS.find((a)=>a.key===selectedAgent)||AGENTS[0];
  const currentJob=currentAgent.imageNumber?currentJobs[currentAgent.imageNumber-1]:null;
  const completedCount=products.reduce((acc,p)=>acc+p.jobs.filter((j)=>j.status==='approved').length,0);
  const pendingReviews=products.reduce((acc,p)=>acc+p.jobs.filter((j)=>j.status==='needs_review'||j.status==='changes_requested').length,0);
  const statusFor=useCallback((agent)=>{
    if (!current) return 'pending';
    if(agent.key==='director')return current.files.length>0 ? 'ready' : 'in_progress';
    if(agent.key==='auditor'){
      if (current.jobs.length===5 && current.jobs.every((j)=>j.status==='approved'))return 'approved';
      if(current.jobs.some((j)=>j.status==='changes_requested'))return 'changes_requested';
      if(current.jobs.some((j)=>j.status==='needs_review'))return 'needs_review';
      return 'pending';
    }
    return current.jobs.find((job)=>job.image_number===agent.imageNumber)?.status||'pending';
  },[current]);

  useEffect(()=>{setNotes(currentJob?.review_notes||'');},[currentJob?.id,currentJob?.review_notes]);

  async function run(action, successMessage) {
    setBusy(true);
    try{await action();if(successMessage)notify(successMessage);await refresh(true);}
    catch(err){notify(safeError(err),'error');}
    finally{setBusy(false);}
  }

  function onCreate(){setEditing(null);setModal(true);}
  async function saveProduct(form,initial){
    const data=Object.fromEntries(Object.keys(EMPTY_FORM).map((key)=>[key,form[key]?.trim?.()||'']));
    if(!data.name || data.name.length<2){notify('Informe um nome de produto válido.','error');return;}
    await run(async()=>{
      if(initial){
        const {error}=await supabase.from('products').update(data).eq('id',initial.id);
        if(error)throw error;
        await logActivity(user.id,initial.id,null,'Produto atualizado','Ficha de produto editada');
      }else{
        const {data:created,error}=await supabase.from('products').insert({ ...data,owner_id:user.id }).select().single();
        if(error)throw error;
        setSelectedId(created.id);
        await logActivity(user.id,created.id,null,'Produto cadastrado','Cinco etapas criadas');
      }
      setModal(false);setEditing(null);setTab('products');
    },initial?'Produto atualizado.':'Produto criado com cinco etapas.');
  }

  async function uploadSources(e,kind){
    const files=Array.from(e.target.files||[]);e.target.value='';
    if(!current||!files.length)return;
    await run(async()=>{
      const saved=await saveSourceFiles({userId:user.id,productId:current.id,kind,inputFiles:files});
      await logActivity(user.id,current.id,null,kind==='reference'?'Fotos adicionadas':'Ficha técnica anexada',`${saved.length} arquivo(s)`);
    },'Arquivos enviados com segurança.');
  }

  async function removeFile(file){
    if(!window.confirm(`Excluir definitivamente "${file.filename}"?`))return;
    await run(async()=>{
      const {error:storageError}=await supabase.storage.from(BUCKET).remove([file.storage_path]);
      if(storageError)throw storageError;
      const {error}=await supabase.from('product_files').delete().eq('id',file.id);
      if(error)throw error;
      await logActivity(user.id,current.id,null,'Arquivo removido',file.filename);
    },'Arquivo removido.');
  }

  async function deleteProduct(product){
    if(!window.confirm(`Excluir "${product.name}"? Todas as fotos, imagens e tarefas serão apagadas. Essa ação não pode ser desfeita.`))return;
    await run(async()=>{
      const paths=[...product.files.map((f)=>f.storage_path),...product.jobs.map((j)=>j.storage_path).filter(Boolean)];
      if(paths.length){
        const {error}=await supabase.storage.from(BUCKET).remove(paths);
        if(error)throw error;
      }
      const {error}=await supabase.from('products').delete().eq('id',product.id);
      if(error)throw error;
      if(selectedId===product.id)setSelectedId(null);
    },'Produto excluído.');
  }

  async function uploadOutput(e){
    const file=e.target.files?.[0];e.target.value='';
    const number=resultStep.current;
    const job=current?.jobs?.find((j)=>j.image_number===number);
    if(!file||!job)return;
    await run(async()=>{
      await saveResultImage({userId:user.id,product:current,job,file});
      await logActivity(user.id,current.id,number,'Imagem importada',file.name);
    },`Imagem ${number} importada. Aguardando revisão.`);
  }

  async function setJobStatus(job,status,reviewNotes=''){
    if(!job)return;
    if(['approved','needs_review'].includes(status)&&!job.storage_path){notify('Importe primeiro a imagem desta etapa.','error');return;}
    if(status==='changes_requested'&&!reviewNotes.trim()){notify('Descreva a correção necessária.','error');return;}
    await run(async()=>{
      const {error}=await supabase.from('image_jobs').update({status,review_notes:reviewNotes.trim()}).eq('id',job.id);
      if(error)throw error;
      await logActivity(user.id,current.id,job.image_number,STATUS_META[status]?.label||status,reviewNotes.trim());
    },`Etapa ${job.image_number}: ${STATUS_META[status]?.label||status}.`);
  }

  async function download(path,filename){try{await downloadPrivateFile(path,filename);}catch(err){notify(safeError(err),'error');}}
  async function copy(text){try{await navigator.clipboard.writeText(text);notify('Copiado para a área de transferência.');}catch{notify('Não foi possível copiar.','error');}}
  const activePrompt=promptTarget===null?'':promptTarget===0?makeDirectorPrompt(current):makePrompt(current,promptTarget);

  if(!isConfigured)return <div className="configuration-page"><div className="config-box"><Sparkles size={38}/><h1>Configuração inicial necessária</h1><p>Defina as variáveis de ambiente do Supabase no projeto e execute o arquivo <code>supabase/schema.sql</code> no SQL Editor.</p><pre>NEXT_PUBLIC_SUPABASE_URL=https://...\nNEXT_PUBLIC_SUPABASE_ANON_KEY=...</pre><p>Veja o arquivo <strong>GUIA_IMPLANTACAO.md</strong> no ZIP.</p></div></div>;
  if(authLoading)return <div className="page-loading"><span className="loader-ring"/><span>Carregando Ilumina Studio...</span></div>;
  if(!user)return <><AuthScreen onToast={notify}/><Toast value={toast} onClose={()=>setToast(null)}/></>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><span className="logo-symbol">✦</span><div><strong>ILUMINA</strong><small>STUDIO <span>v1.0</span></small></div></div>
      <div className="sidebar-divider"/>
      <div className="sidebar-kicker">WORKSPACE</div>
      <nav className="nav-list" aria-label="Navegação principal">{NAV.map(({key,label,icon:Icon})=><button key={key} type="button" onClick={()=>setTab(key)} className={`nav-item ${tab===key?'nav-active':''}`}><Icon size={18}/><span>{label}</span>{key==='products'&&<b>{products.length}</b>}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-bottom"><span className="sidebar-kicker">MEU PLANO DE PRODUÇÃO</span><div className="plan-tile"><Sparkles size={17}/><div><strong>ChatGPT Plus</strong><small>Importação manual · sem API</small></div></div><div className="account-mini"><span className="avatar">{(user.email||'U')[0].toUpperCase()}</span><div><strong>{user.email?.split('@')[0]}</strong><small>{user.email}</small></div><button type="button" className="icon-button" onClick={()=>supabase.auth.signOut()} title="Sair"><LogOut size={17}/></button></div></div>
    </aside>

    <div className="main-area">
      <header className="topbar"><div className="topbar-left"><span className="crumb">ESCRITÓRIO</span><span className="crumb-sep">/</span><span className="crumb-current">{NAV.find((n)=>n.key===tab)?.label}</span><span className="topbar-tag"><span className="status-dot"/> Online</span></div><div className="topbar-right"><span className="tiny-muted">{loading?'Atualizando...':'Dados no Supabase'}</span><button className="icon-button" onClick={()=>refresh()} title="Atualizar" disabled={loading}><RefreshCw size={17} className={loading?'spin':''}/></button><button className="btn btn-gold btn-small" onClick={onCreate}><Plus size={16}/> Novo produto</button></div></header>

      <main className="content">
      {tab==='office' && <>
        <div className="page-head"><div><span className="eyebrow">CENTRAL DE OPERAÇÕES</span><h1>Escritório de agentes <span className="title-star">✦</span></h1><p>Acompanhe a produção das cinco imagens de cada produto, em um só lugar.</p></div><button className="btn btn-muted" onClick={()=>refresh()}><RefreshCw size={16} className={loading?'spin':''}/> Atualizar</button></div>
        <div className="metric-grid"><div className="metric"><div className="metric-label"><Package size={16}/> Produtos cadastrados</div><div className="metric-number">{products.length}<span>produtos</span></div></div><div className="metric"><div className="metric-label"><CheckCircle2 size={16}/> Imagens aprovadas</div><div className="metric-number">{completedCount}<span>de {products.length*5}</span></div></div><div className="metric"><div className="metric-label"><AlertCircle size={16}/> Requerem atenção</div><div className="metric-number">{pendingReviews}<span>etapas</span></div></div><div className="metric"><div className="metric-label"><Zap size={16}/> Agentes no escritório</div><div className="metric-number">7<span>especialidades</span></div></div></div>
        <div className="workstation-layout">
          <section className="office-card">
            <div className="office-card-header"><div><h2>Seu escritório virtual</h2><span>Selecione um agente para ver tarefas e progresso</span></div><div className="office-product-select"><label htmlFor="office-product">PRODUTO ATIVO</label><select id="office-product" value={current?.id||''} onChange={e=>setSelectedId(e.target.value)} disabled={!products.length}>{products.length?products.map(p=><option key={p.id} value={p.id}>{p.name}</option>):<option value="">Nenhum produto</option>}</select></div></div>
            <OfficeScene selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} statusFor={statusFor}/>
            <div className="office-legend"><span><i className="legend-dot green"/> Aprovado</span><span><i className="legend-dot yellow"/> Em produção</span><span><i className="legend-dot blue"/> Revisão</span><span><i className="legend-dot red"/> Correção</span><span><i className="legend-dot grey"/> Aguardando</span></div>
          </section>
          <aside className="inspector"><Inspector agent={currentAgent} product={current} job={currentJob} status={statusFor(currentAgent)} notes={notes} setNotes={setNotes} onPrompt={()=>setPromptTarget(currentAgent.key==='director'?0:currentAgent.imageNumber||0)} onImport={()=>{resultStep.current=currentAgent.imageNumber;resultInput.current?.click();}} onStatus={setJobStatus} busy={busy} onCreate={onCreate} onProduct={()=>setTab('products')} onGallery={()=>setTab('gallery')} signed={signed} onDownload={download}/></aside>
        </div>
        <div className="bottom-panel"><div><h3><Activity size={18}/> Atividade recente</h3><p>As ações refletem atualizações feitas no painel, não trabalho autônomo de IA.</p></div><button className="text-button" onClick={()=>setTab('history')}>Ver histórico <ArrowRight size={15}/></button></div>
        <ActivityList logs={logs.slice(0,5)} products={products}/>
      </>}

      {tab==='products' && <>
        <div className="page-head"><div><span className="eyebrow">CATÁLOGO DE PRODUÇÃO</span><h1>Produtos</h1><p>Cadastre a ficha do produto, anexe fotos e acompanhe as cinco etapas.</p></div><button className="btn btn-gold" onClick={onCreate}><Plus size={17}/> Cadastrar produto</button></div>
        <div className="products-layout">
          <section className="panel product-list-panel"><div className="panel-heading"><h2>Seus produtos <span className="count-bubble">{products.length}</span></h2></div><div className="search-box"><Search size={17}/><input placeholder="Buscar nome, código ou categoria" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="product-list">{products.filter(p=>(p.name+' '+p.sku+' '+p.category).toLowerCase().includes(search.toLowerCase())).map(p=>{
            const done=p.jobs.filter(j=>j.status==='approved').length;
            const cover=p.files.find(f=>f.kind==='reference' && f.content_type.startsWith('image/'));
            return <button key={p.id} className={`product-item ${current?.id===p.id?'product-item-active':''}`} onClick={()=>setSelectedId(p.id)}><div className="product-thumb">{cover&&signed[cover.storage_path]?<img src={signed[cover.storage_path]} alt=""/>:<Package size={24}/>}</div><div className="product-info"><strong>{p.name}</strong><small>{p.category} {p.sku?'· '+p.sku:''}</small><span className="small-progress"><i style={{width:`${done*20}%`}}/></span></div><span className="product-count">{done}/5</span></button>;
          })}{products.length===0&&<EmptyState icon={Package} title="Seu catálogo está vazio" description="Cadastre o primeiro produto para iniciar." action={<button className="btn btn-gold" onClick={onCreate}><Plus size={16}/> Novo produto</button>}/>}</div></section>
          <section className="panel product-detail">{current?<>
            <div className="detail-head"><div><span className="eyebrow">FICHA DE PRODUTO</span><h2>{current.name}</h2><span className="detail-meta">{current.category} {current.sku&&`· ${current.sku}`} · Criado em {prettyDate(current.created_at)}</span></div><div className="detail-actions"><button className="btn btn-muted btn-small" onClick={()=>{setEditing(current);setModal(true);}}><Edit3 size={15}/> Editar</button><button className="icon-button danger-hover" onClick={()=>deleteProduct(current)} title="Excluir produto"><Trash2 size={18}/></button></div></div>
            <div className="product-detail-body">
              <div className="section-title"><h3><FileText size={17}/> Informações confirmadas</h3><button className="text-button" onClick={()=>setPromptTarget(0)}><Copy size={15}/> Briefing do diretor</button></div>
              <div className="facts-grid">{[['Especificações',current.specifications],['Dimensões',current.dimensions],['Conteúdo da embalagem',current.package_contents],['Aplicações permitidas',current.applications]].map(([name,value])=><div key={name} className="fact"><span>{name}</span><p>{value||'Não informado'}</p></div>)}</div>
              {current.notes&&<div className="fact fact-notes"><span>Observações</span><p>{current.notes}</p></div>}
              <div className="section-title with-top"><h3><FileImage size={17}/> Fotografias do produto</h3><button className="btn btn-muted btn-small" onClick={()=>sourceInput.current?.click()} disabled={busy}><Upload size={15}/> Enviar fotos</button></div>
              <div className="reference-grid">{current.files.filter(f=>f.kind==='reference'&&f.content_type.startsWith('image/')).map(f=><div key={f.id} className="reference-photo"><img src={signed[f.storage_path]||''} alt={f.filename}/><button className="reference-download" onClick={()=>download(f.storage_path,f.filename)} title="Baixar"><Download size={15}/></button><button className="reference-delete" onClick={()=>removeFile(f)} title="Excluir"><X size={15}/></button></div>)}<button className="reference-add" onClick={()=>sourceInput.current?.click()}><Plus size={24}/><span>Adicionar fotos</span></button></div>
              <div className="section-title with-top"><h3><ClipboardList size={17}/> Ficha técnica e arquivos</h3><button className="btn btn-muted btn-small" onClick={()=>datasheetInput.current?.click()} disabled={busy}><Upload size={15}/> Anexar</button></div>
              <div className="files-list">{current.files.filter(f=>f.kind==='datasheet').length?current.files.filter(f=>f.kind==='datasheet').map(f=><Filename key={f.id} file={f} onOpen={file=>download(file.storage_path,file.filename)} onDelete={removeFile}/>):<p className="muted">Nenhuma ficha anexada. Aceita PDF, JPG, PNG e WebP.</p>}</div>
              <div className="section-title with-top"><h3><ImageIcon size={17}/> Etapas das imagens</h3><span className="tiny-muted">Uma imagem por etapa</span></div>
              <div className="job-list">{IMAGE_TYPES.map(i=>{
                const job=current.jobs.find(j=>j.image_number===i.id);
                return <div key={i.id} className="job-row"><div className="job-num">{String(i.id).padStart(2,'0')}</div><div className="job-description"><strong>{i.title}</strong><small>{i.description}</small></div><StatusPill status={job?.status||'pending'}/><button className="btn btn-muted btn-small" onClick={()=>{setSelectedAgent(i.key);setTab('office');}}>Abrir <ArrowRight size={14}/></button></div>;
              })}</div>
            </div>
          </>:<EmptyState icon={Package} title="Selecione um produto" description="Cadastre seu primeiro produto para anexar imagens e organizar as etapas." action={<button className="btn btn-gold" onClick={onCreate}><Plus size={16}/> Criar produto</button>}/>}</section>
        </div>
      </>}

      {tab==='gallery' && <>
        <div className="page-head"><div><span className="eyebrow">ARQUIVOS DE PRODUÇÃO</span><h1>Galeria de imagens</h1><p>Os cinco arquivos são independentes e mantidos em armazenamento privado.</p></div><button className="btn btn-muted" onClick={()=>refresh()}><RefreshCw size={16}/> Atualizar</button></div>
        {products.length===0?<EmptyState icon={ImageIcon} title="Nenhum produto cadastrado" description="Crie um produto e importe as imagens produzidas no ChatGPT Plus." action={<button className="btn btn-gold" onClick={onCreate}>Cadastrar produto</button>}/>:<>
          <div className="gallery-toolbar"><label>Produto<select value={current?.id||''} onChange={e=>setSelectedId(e.target.value)}>{products.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label><span>{current?.jobs.filter(j=>j.storage_path).length||0} de 5 imagens importadas</span></div>
          <div className="gallery-grid">{IMAGE_TYPES.map(i=>{
            const job=current?.jobs.find(j=>j.image_number===i.id);
            return <article key={i.id} className="gallery-card"><div className="gallery-picture">{job?.storage_path && signed[job.storage_path]?<img src={signed[job.storage_path]} alt={`Imagem ${i.id}: ${i.title}`}/>:<div className="gallery-empty"><ImageIcon size={29}/><span>Imagem não importada</span></div>}<span className="gallery-number">{String(i.id).padStart(2,'0')}</span></div><div className="gallery-body"><div><strong>{i.title}</strong><StatusPill status={job?.status||'pending'}/></div><small>{i.description}</small><div className="gallery-actions"><button className="btn btn-muted btn-small" onClick={()=>{setSelectedAgent(i.key);setTab('office');}}>Gerenciar</button>{job?.storage_path?<button className="btn btn-gold btn-small" onClick={()=>download(job.storage_path,`${current.sku||'produto'}_imagem_${i.id}.${job.storage_path.split('.').pop()}`)}><Download size={15}/> Baixar</button>:<button className="btn btn-gold btn-small" onClick={()=>{resultStep.current=i.id;resultInput.current?.click();}}><Upload size={15}/> Importar</button>}</div></div></article>;
          })}</div>
        </>}
      </>}

      {tab==='history' && <><div className="page-head"><div><span className="eyebrow">RASTREABILIDADE</span><h1>Histórico de atividade</h1><p>Importações, aprovações, correções e alterações realizadas no painel.</p></div><button className="btn btn-muted" onClick={()=>refresh()}><RefreshCw size={16}/> Atualizar</button></div><section className="panel history-panel"><ActivityList logs={logs} products={products}/></section></>}

      {tab==='guides' && <><div className="page-head"><div><span className="eyebrow">MANUAL DE IDENTIDADE VISUAL</span><h1>Padrão das cinco imagens</h1><p>Use essas referências somente para composição e estilo, não como fonte técnica de outros produtos.</p></div></div><div className="guide-grid">{IMAGE_TYPES.map(i=><article key={i.id} className="guide-card"><img src={i.file} alt={`Referência visual ${i.id}: ${i.title}`}/><div><span className="eyebrow">IMAGEM {String(i.id).padStart(2,'0')}</span><h3>{i.title}</h3><p>{i.description}</p></div></article>)}</div><div className="guide-workflow panel"><h3><Sparkles size={18}/> Fluxo manual usando ChatGPT Plus</h3><ol><li>Cadastre o produto e envie as fotografias e a ficha técnica.</li><li>Abra o agente pelo escritório e copie o briefing correspondente.</li><li>Abra seu GPT personalizado no ChatGPT; cole o briefing e anexe as fotos reais.</li><li>Baixe a imagem produzida no ChatGPT e importe-a na etapa correspondente.</li><li>Revise e aprove no painel. Repita até concluir as cinco imagens.</li></ol><p>Os agentes da interface representam estações de trabalho e não executam tarefas sozinhos nesta versão.</p></div></>}

      {tab==='settings' && <><div className="page-head"><div><span className="eyebrow">SEGURANÇA E PERFIL</span><h1>Minha conta</h1><p>Gerencie seu acesso e confira a configuração da integração.</p></div></div><div className="settings-grid"><section className="panel settings-card"><h3><ShieldCheck size={18}/> Dados do usuário</h3><div className="settings-data"><span>E-mail</span><strong>{user.email}</strong></div><div className="settings-data"><span>Identificador</span><code>{user.id}</code></div><div className="settings-data"><span>Armazenamento</span><strong>Supabase Storage (privado)</strong></div><button className="btn btn-muted" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sair da conta</button></section><section className="panel settings-card"><h3><ShieldCheck size={18}/> Alterar senha</h3><p>Defina uma nova senha para sua conta autenticada.</p><form onSubmit={async e=>{e.preventDefault();await run(async()=>{const {error}=await supabase.auth.updateUser({password:newPassword});if(error)throw error;setNewPassword('');},'Senha atualizada.');}}><label className="field">Nova senha<input type="password" minLength={6} required value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Ao menos 6 caracteres"/></label><button disabled={busy} className="btn btn-gold" type="submit"><Save size={16}/> Salvar nova senha</button></form></section><section className="panel settings-card gpt-links-card"><h3><ExternalLink size={18}/> Links dos seus 7 GPTs</h3><p>Cadastre os endereços dos GPTs que você já criou no ChatGPT. O botão "Abrir GPT" usará o link específico da etapa. Os endereços ficam somente neste navegador.</p><form onSubmit={saveGptLinks} className="gpt-links-form">{AGENTS.map(agent=><label key={agent.key} className="field">{agent.number} — {agent.name}<input type="url" placeholder="https://chatgpt.com/g/..." value={gptLinks[agent.key]||''} onChange={e=>setGptLinks(prev=>({...prev,[agent.key]:e.target.value}))}/></label>)}<button type="submit" className="btn btn-gold"><Save size={16}/> Salvar links dos GPTs</button></form></section></div></>}
      </main>
    </div>

    <input ref={sourceInput} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>uploadSources(e,'reference')}/>
    <input ref={datasheetInput} hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple onChange={e=>uploadSources(e,'datasheet')}/>
    <input ref={resultInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadOutput}/>
    <ProductModal open={modal} initial={editing} onClose={()=>{if(!busy){setModal(false);setEditing(null);}}} onSave={saveProduct} busy={busy}/>
    <PromptModal gptUrl={gptLinks[promptTarget===0?'director':IMAGE_TYPES.find(i=>i.id===promptTarget)?.key]||''} title={promptTarget===0?'Briefing do Diretor':`Imagem ${String(promptTarget).padStart(2,'0')} — ${IMAGE_TYPES.find(i=>i.id===promptTarget)?.title||''}`} prompt={activePrompt} onClose={()=>setPromptTarget(null)}/>
    <Toast value={toast} onClose={()=>setToast(null)}/>
    {busy&&<div className="busy-overlay"><Loader2 className="spin" size={17}/> Salvando alterações...</div>}
  </div>;
}

function Inspector({agent,product,job,status,notes,setNotes,onPrompt,onImport,onStatus,busy,onCreate,onProduct,onGallery,signed,onDownload}){
  const isAgent=Boolean(agent.imageNumber);
  const label=status==='ready'?'Referências cadastradas':STATUS_META[status]?.label||'Aguardando';
  const color=STATUS_META[status]?.color|| (status==='ready'?'done':'idle');
  return <><div className="inspector-head"><span className="eyebrow">ESTAÇÃO DE TRABALHO</span><div className="inspector-agent-avatar" style={{'--agent-color':agent.color}}><span>{agent.number}</span></div><h2>{agent.name}</h2><p>{agent.role}</p><span className={`pill pill-${color}`}><i className="status-dot"/>{label}</span></div>
    <div className="inspector-body"><div className="inspector-section"><h4>SOBRE ESTE AGENTE</h4><p>{agent.description}</p></div><div className="inspector-section"><h4>PRODUTO EM FOCO</h4>{product?<div className="inspector-product"><Package size={18}/><div><strong>{product.name}</strong><small>{product.category} {product.sku&&'· '+product.sku}</small></div></div>:<div className="missing-message">Nenhum produto cadastrado.</div>}</div>
      {!product?<button className="btn btn-gold btn-full" onClick={onCreate}><Plus size={16}/> Cadastrar primeiro produto</button>:<>
        {isAgent&&<div className="inspector-section"><h4>RESULTADO DA ETAPA {String(agent.imageNumber).padStart(2,'0')}</h4>{job?.storage_path&&signed[job.storage_path]?<div className="inspector-image"><img src={signed[job.storage_path]} alt={`Imagem ${agent.imageNumber} importada`}/></div>:<div className="inspector-empty"><ImageIcon size={24}/>Nenhum arquivo importado</div>}{job?.storage_path&&<button className="btn btn-muted btn-full" onClick={()=>onDownload(job.storage_path,`imagem_${agent.imageNumber}.${job.storage_path.split('.').pop()}`)}><Download size={15}/> Baixar imagem</button>}</div>}
        {agent.key==='auditor'?<div className="inspector-section"><h4>REVISÃO GERAL</h4><div className="auditor-list">{IMAGE_TYPES.map(i=>{const j=product.jobs.find(x=>x.image_number===i.id);return <div key={i.id}><span>{String(i.id).padStart(2,'0')} · {i.short}</span><StatusPill status={j?.status||'pending'}/></div>;})}</div><p className="small-note">O auditor é um posto de acompanhamento manual. A aprovação de cada imagem ocorre na estação correspondente.</p></div>:isAgent?<><div className="inspector-section"><h4>AÇÕES DE PRODUÇÃO</h4><button className="btn btn-gold btn-full" onClick={onPrompt}><Copy size={16}/> Copiar briefing para GPT</button><button className="btn btn-muted btn-full" onClick={onImport} disabled={busy}><Upload size={16}/> Importar imagem do Plus</button><div className="mini-link">Abra seu GPT, gere e baixe a imagem; depois importe aqui.</div></div><div className="inspector-section"><h4>STATUS E REVISÃO</h4><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anotações ou correções necessárias..." rows={3}/><div className="status-actions"><button disabled={busy} className="btn btn-muted" onClick={()=>onStatus(job,'in_progress',notes)}>Em produção</button><button disabled={busy||!job?.storage_path} className="btn btn-muted" onClick={()=>onStatus(job,'needs_review',notes)}>Em revisão</button><button disabled={busy||!job?.storage_path} className="btn btn-approve" onClick={()=>onStatus(job,'approved',notes)}><Check size={15}/> Aprovar</button><button disabled={busy} className="btn btn-danger" onClick={()=>onStatus(job,'changes_requested',notes)}>Solicitar correção</button></div>{job?.status==='changes_requested'&&<button className="text-button" onClick={()=>onStatus(job,'pending','')}>Voltar a aguardando</button>}</div></>:<div className="inspector-section"><h4>BRIEFING MESTRE</h4><p>O Diretor organiza as informações, mas o trabalho de IA é realizado manualmente no ChatGPT Plus.</p><button className="btn btn-gold btn-full" onClick={onPrompt}><Copy size={16}/> Copiar briefing geral</button><button className="btn btn-muted btn-full" onClick={onProduct}><Edit3 size={16}/> Ver ficha e referências</button></div>}
      </>}
    </div><div className="inspector-footer"><span><span className="status-dot"/> Trabalho controlado manualmente</span><button className="text-button" onClick={onGallery}>Galeria <ArrowRight size={15}/></button></div>
  </>;
}

function ActivityList({logs,products}){
  if(!logs.length)return <EmptyState icon={History} title="Nenhuma atividade registrada" description="Cadastros, importações e aprovações aparecerão aqui."/>;
  return <div className="activity-list">{logs.map(l=>{
    const product=products.find(p=>p.id===l.product_id);
    return <div className="activity-row" key={l.id}><div className="activity-icon"><Activity size={16}/></div><div><strong>{l.action}</strong><span>{product?.name||'Produto excluído'} {l.image_number?'· Imagem '+l.image_number:''}{l.details?' · '+l.details:''}</span></div><time>{prettyDate(l.created_at)}</time></div>;
  })}</div>;
}
