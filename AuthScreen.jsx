'use client';

import { useState } from 'react';
import { ArrowRight, Layers3, LockKeyhole, Mail, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { safeError } from '../lib/constants';

export default function AuthScreen({ onToast }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNotice('');
    try {
      let result;
      if (mode === 'signup') result = await supabase.auth.signUp({ email: email.trim(), password });
      else if (mode === 'forgot') result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      else result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (mode === 'signup') setNotice('Cadastro solicitado. Se a confirmação de e-mail estiver habilitada, verifique sua caixa de entrada.');
      if (mode === 'forgot') { setNotice('Se o endereço existir, você receberá as instruções para redefinir sua senha.'); setMode('login'); }
    } catch (err) { onToast(safeError(err), 'error'); }
    finally { setBusy(false); }
  }

  return <div className="auth-page">
    <div className="auth-glow"/>
    <div className="auth-info">
      <div className="logo-big"><span className="logo-symbol">✦</span><span>ILUMINA <b>STUDIO</b></span></div>
      <span className="eyebrow">SEU ESTÚDIO DE IMAGENS DE ILUMINAÇÃO</span>
      <h1>Sete especialistas.<br/><em>Um só escritório.</em></h1>
      <p>Organize produtos, siga as cinco etapas padronizadas, importe suas imagens geradas no ChatGPT Plus e acompanhe cada revisão.</p>
      <div className="auth-benefits"><span><Layers3 size={17}/> 5 imagens por produto</span><span><Sparkles size={17}/> Padrão premium</span><span><LockKeyhole size={17}/> Arquivos privados</span></div>
      <div className="auth-orbit"><div className="auth-orbit-main">✦</div><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span></div>
    </div>
    <div className="auth-card">
      <div className="auth-card-icon"><LockKeyhole size={21}/></div>
      <h2>{mode === 'signup' ? 'Criar minha conta' : mode === 'forgot' ? 'Redefinir acesso' : 'Bem-vindo de volta'}</h2>
      <p>{mode === 'signup' ? 'Crie seu espaço privado de produção.' : mode === 'forgot' ? 'Informe o e-mail da sua conta.' : 'Entre para acessar seu escritório de agentes.'}</p>
      <form onSubmit={submit}>
        <label>E-mail</label>
        <div className="input-icon"><Mail size={16}/><input type="email" required placeholder="voce@empresa.com" value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
        {mode !== 'forgot' && <><label>Senha</label><div className="input-icon"><LockKeyhole size={16}/><input type="password" minLength={6} required placeholder="Mínimo de 6 caracteres" value={password} onChange={(e)=>setPassword(e.target.value)}/></div></>}
        <button type="submit" className="btn btn-gold btn-full" disabled={busy}>{busy ? <Loader2 size={17} className="spin"/> : <ArrowRight size={17}/>} {mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Enviar e-mail' : 'Entrar no escritório'}</button>
      </form>
      {notice && <div className="info-banner">{notice}</div>}
      <div className="auth-links">
        <button type="button" onClick={()=>{setMode(mode==='signup'?'login':'signup');setNotice('');}}>{mode === 'signup' ? 'Já tenho conta' : 'Criar conta'}</button>
        <button type="button" onClick={()=>{setMode(mode==='forgot'?'login':'forgot');setNotice('');}}>{mode === 'forgot' ? 'Voltar ao login' : 'Esqueci minha senha'}</button>
      </div>
      <div className="auth-smallprint">Autenticação Supabase · Sem cobrança de API de IA</div>
    </div>
  </div>;
}
