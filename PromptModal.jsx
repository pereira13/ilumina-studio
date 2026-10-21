'use client';
import { useState } from 'react';
import { Check, Copy, ExternalLink, X, AlertCircle } from 'lucide-react';

export default function PromptModal({ title, prompt, onClose, gptUrl }) {
  const [copied, setCopied] = useState(false);
  if (!prompt) return null;
  async function copy() { try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(()=>setCopied(false),2200); } catch { alert('Copie o texto manualmente.'); } }
  return <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget && onClose()}>
    <section className="modal modal-prompt" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
      <div className="modal-header"><div><span className="eyebrow">BRIEFING PARA O CHATGPT PLUS</span><h2 id="prompt-modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div>
      <div className="prompt-note"><AlertCircle size={17}/><span>Copie o briefing, abra seu GPT no ChatGPT e envie também as fotos reais do produto. A geração ocorre no Plus, fora deste site.</span></div>
      <pre className="prompt-text">{prompt}</pre>
      <div className="modal-footer"><span>A referência do produto precisa acompanhar o texto.</span><button className="btn btn-muted" onClick={()=>window.open(gptUrl || 'https://chatgpt.com/','_blank','noopener,noreferrer')}><ExternalLink size={16}/> {gptUrl?'Abrir meu GPT':'Abrir ChatGPT'}</button><button className="btn btn-gold" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copiado!':'Copiar briefing'}</button></div>
    </section>
  </div>;
}
