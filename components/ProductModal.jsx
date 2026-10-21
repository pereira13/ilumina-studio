'use client';

import { useEffect, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { CATEGORIES, EMPTY_FORM } from '../lib/constants';

export default function ProductModal({ open, initial, onClose, onSave, busy }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  useEffect(() => { if (open) setForm(initial ? Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, initial[k] || ''])) : { ...EMPTY_FORM }); }, [open, initial?.id]);
  if (!open) return null;
  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal modal-product" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div className="modal-header"><div><span className="eyebrow">CADASTRO DE PRODUÇÃO</span><h2 id="product-modal-title">{initial ? 'Editar produto' : 'Novo produto'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></div>
      <form className="product-form" onSubmit={(e) => { e.preventDefault(); onSave(form, initial); }}>
        <div className="form-grid">
          <label className="field field-wide">Nome do produto <span>*</span><input required minLength={2} maxLength={180} value={form.name} onChange={set('name')} placeholder="Ex.: Arandela Iglu 6W" /></label>
          <label className="field">Código interno / SKU<input value={form.sku} onChange={set('sku')} placeholder="Ex.: 60484" /></label>
          <label className="field">Categoria<select value={form.category} onChange={set('category')}>{CATEGORIES.map((c)=><option key={c}>{c}</option>)}</select></label>
          <label className="field field-wide">Especificações técnicas<textarea rows={4} value={form.specifications} onChange={set('specifications')} placeholder="Potência, tensão, fluxo luminoso, IP, cor, material, temperatura de cor..." /></label>
          <label className="field">Dimensões oficiais<textarea rows={3} value={form.dimensions} onChange={set('dimensions')} placeholder="Altura, largura, profundidade, diâmetro, recorte..." /></label>
          <label className="field">Conteúdo da embalagem<textarea rows={3} value={form.package_contents} onChange={set('package_contents')} placeholder="Ex.: 1 luminária, 2 buchas, 2 parafusos" /></label>
          <label className="field field-wide">Aplicações autorizadas<textarea rows={2} value={form.applications} onChange={set('applications')} placeholder="Ex.: áreas internas secas, corredores e quartos" /></label>
          <label className="field field-wide">Observações adicionais<textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Restrições de instalação, acabamento, instruções especiais..." /></label>
        </div>
        <div className="modal-footer"><span>Campos não preenchidos não serão inventados nos prompts.</span><button className="btn btn-muted" type="button" onClick={onClose}>Cancelar</button><button className="btn btn-gold" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={16}/> : <Save size={16}/>} Salvar produto</button></div>
      </form>
    </section>
  </div>;
}
