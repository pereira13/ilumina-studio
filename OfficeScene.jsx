'use client';

import { AGENTS } from '../lib/constants';

const PLACE = {
  director: { x: 310, y: 295 },
  capa: { x: 470, y: 204 },
  acessorios: { x: 630, y: 280 },
  especificacoes: { x: 470, y: 385 },
  dimensoes: { x: 650, y: 460 },
  aplicacoes: { x: 820, y: 354 },
  auditor: { x: 790, y: 540 },
};

const COLOR = { pending: '#717886', in_progress: '#f5bd4d', needs_review: '#80aaff', approved: '#4ed0a2', changes_requested: '#fa6d72', ready: '#4ed0a2' };

function OfficeDesk({ x, y, agent, state, selected, onClick }) {
  const color = COLOR[state] || COLOR.pending;
  return (
    <g transform={`translate(${x} ${y})`} onClick={() => onClick(agent.key)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(agent.key); } }}
      role="button" tabIndex={0} aria-label={`Abrir agente ${agent.name}`} className={`office-agent ${selected ? 'office-selected' : ''}`}>
      <ellipse cx="10" cy="37" rx="74" ry="22" fill="#665b57" opacity=".2" />
      <path d="M-60 16 L-11 -10 L65 26 L13 56Z" fill="#fff2dd" stroke="#dfd2bc" strokeWidth="2" />
      <path d="M-60 16 V28 L13 70 V56Z" fill="#d1bfa1" />
      <path d="M13 56 V70 L65 39 V26Z" fill="#e8d5b9" />
      <path d="M-41 33 V63 L-33 67 V37M36 49 V76 L43 73 V45" stroke="#dfd5c5" strokeWidth="8" />
      <path d="M-28 15 L-25 -19 L0 -9 L-2 27Z" fill="#252934" stroke="#78848e" strokeWidth="2" />
      <path d="M-25 -16 L-2 -6 L-4 22 L-27 10Z" fill="#35414f" />
      <path d="M-27 -17 L-1 -6 L-6 12 L-27 2Z" fill="#5b6d77" opacity=".65" />
      <path d="M-10 21 L12 32 L25 25 L5 16Z" fill="#596371" />
      <path d="M-25 35 L-12 42 L0 34 L-11 27Z" fill="#f8f3e9" />
      <path d="M29 3 V-22 Q29 -39 48 -37 Q65 -33 64 -14 V11 Z" fill={agent.color} stroke="#45434b" strokeWidth="1" />
      <circle cx="46" cy="-45" r="15" fill="#e4b791" />
      <path d="M31 -51 Q36 -69 51 -60 Q65 -58 62 -43 Q50 -53 31 -51" fill="#4f3c37" />
      <path d="M35 -21 L22 -4 L16 5" fill="none" stroke="#e4b791" strokeWidth="8" strokeLinecap="round" />
      <circle cx="46" cy="-45" r="17" fill="none" stroke={selected ? '#f8c65a' : 'transparent'} strokeWidth="3" />
      <g transform="translate(-58 -92)">
        <rect x="0" y="0" width="155" height="34" rx="17" fill={selected ? '#2a303b' : '#222730'} stroke={selected ? '#f6c55e' : '#454b53'} strokeWidth={selected ? 2 : 1.5} />
        <circle cx="16" cy="17" r="5.7" fill={color} />
        <text x="28" y="22" fill="#f9f6ef" fontWeight="700" fontSize="15">{agent.name}</text>
        <circle cx="135" cy="17" r="12" fill="#ece8de" />
        <text x="135" y="21" fill="#272a33" fontSize="12" textAnchor="middle" fontWeight="800">{agent.number}</text>
      </g>
      <rect x="-66" y="-100" width="169" height="180" rx="12" fill="transparent" />
    </g>
  );
}

export default function OfficeScene({ selectedAgent, onSelectAgent, statusFor }) {
  return (
    <div className="office-viewport">
      <svg className="office-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 720" role="img" aria-label="Escritório isométrico interativo com sete agentes de iluminação">
        <defs>
          <linearGradient id="wallL" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e9e4dc"/><stop offset="1" stopColor="#d6d1c8"/></linearGradient>
          <linearGradient id="wallR" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e8e7e1"/><stop offset="1" stopColor="#c6c7bf"/></linearGradient>
          <linearGradient id="floorG" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#efdbc0"/><stop offset="1" stopColor="#c9ae8c"/></linearGradient>
          <pattern id="floorGrid" width="52" height="52" patternUnits="userSpaceOnUse" patternTransform="skewY(28) scale(1 0.85)"><path d="M52 0 H0 V52" stroke="#b49d83" strokeWidth="1" fill="none" opacity=".32"/></pattern>
          <filter id="softShadow" x="-20%" y="-30%" width="150%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
        </defs>
        <ellipse cx="585" cy="635" rx="450" ry="60" fill="#000" opacity=".17" filter="url(#softShadow)" />
        <path d="M73 275 L550 17 L1027 283 L1027 472 L558 718 L73 453Z" fill="#11151d" opacity=".8"/>
        <path d="M75 274 L550 17 L550 183 L75 442Z" fill="url(#wallL)" stroke="#c7c5be" strokeWidth="4" />
        <path d="M550 17 L1027 282 L1027 450 L550 183Z" fill="url(#wallR)" stroke="#d7d6ce" strokeWidth="4" />
        <path d="M75 442 L550 183 L1027 450 L555 712Z" fill="url(#floorG)" stroke="#dbbfa0" strokeWidth="5" />
        <path d="M75 442 L550 183 L1027 450 L555 712Z" fill="url(#floorGrid)" />
        <path d="M75 442 L555 712 L555 725 L75 455Z" fill="#8e795f" />
        <path d="M555 712 L1027 450 L1027 463 L555 725Z" fill="#a18a70" />
        {/* Logo da empresa fictícia, sem reutilizar a marca presente na referência enviada */}
        <path d="M148 252 L350 143 L350 213 L148 320Z" fill="#222630" opacity=".95" />
        <text x="172" y="268" fill="#f2bf55" fontSize="28" fontWeight="900" transform="skewY(-27)">ILUMINA</text>
        <text x="172" y="292" fill="#f2f0e9" fontSize="17" fontWeight="600" transform="skewY(-27)">STUDIO</text>
        {/* Janelas arquitetônicas */}
        <path d="M630 95 L725 148 L725 205 L630 151Z" fill="#d7dedc" />
        <path d="M642 111 L710 149 L710 191 L642 153Z" fill="#a7c9d8" />
        <path d="M763 171 L851 219 L851 276 L763 226Z" fill="#d7dedc" />
        <path d="M775 188 L836 223 L836 264 L775 230Z" fill="#a7c9d8" />
        {/* Quadro */}
        <path d="M864 235 L988 305 L988 355 L864 285Z" fill="#f3eee2" stroke="#c1beb7" strokeWidth="2"/>
        <text x="879" y="265" fontSize="12" fontWeight="800" fill="#55545a" transform="skewY(28)">5 IMAGENS</text>
        <path d="M890 288 L966 331" stroke="#d9ab57" strokeWidth="3" />
        {/* Móveis de ambientação */}
        <path d="M210 472 L278 435 L348 475 L280 515Z" fill="#313743" />
        <path d="M210 472 V514 L280 553 V515Z" fill="#1f242c" />
        <path d="M280 515 V553 L348 513 V475Z" fill="#292e37" />
        <path d="M570 590 L650 547 L733 590 L650 635Z" fill="#bb8158" />
        <path d="M570 590 V608 L650 655 V635Z" fill="#96684c" />
        <path d="M650 635 V655 L733 608 V590Z" fill="#a9724b" />
        {/* Plantas */}
        {[[165,403],[908,516],[510,650]].map(([x,y],i)=>(
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M-16 10 L18 28 L42 14 L7 -4Z" fill="#e5e8df" />
            <path d="M-16 10 V29 L18 47 V28Z" fill="#c8cfc8" />
            <path d="M18 28 V47 L42 34 V14Z" fill="#d7dbd1" />
            <circle cx="2" cy="-6" r="23" fill="#6aa981" />
            <circle cx="22" cy="-1" r="20" fill="#72b18c" />
            <circle cx="14" cy="-25" r="17" fill="#54966f" />
          </g>
        ))}
        {/* Escritório de agentes */}
        {AGENTS.map((agent) => (
          <OfficeDesk key={agent.key} x={PLACE[agent.key].x} y={PLACE[agent.key].y} agent={agent}
            state={statusFor(agent)} selected={selectedAgent === agent.key} onClick={onSelectAgent} />
        ))}
      </svg>
      <div className="office-note"><span className="pulse-dot"/> Clique em um agente para abrir a estação de trabalho</div>
    </div>
  );
}
