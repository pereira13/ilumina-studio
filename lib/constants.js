export const BUCKET = 'ilumina-media';

export const IMAGE_TYPES = [
  { id: 1, key: 'capa', title: 'Capa ambientada', short: 'Capa', agent: 'Fotógrafo de Produto', file: '/references/01-capa.jpg', description: 'Produto corretamente instalado e em destaque, sem textos.' },
  { id: 2, key: 'acessorios', title: 'O que acompanha', short: 'Acessórios', agent: 'Especialista em Embalagem', file: '/references/02-acessorios.jpg', description: 'Produto ambientado e painel com os itens confirmados da embalagem.' },
  { id: 3, key: 'especificacoes', title: 'Características técnicas', short: 'Especificações', agent: 'Especialista Técnico', file: '/references/03-especificacoes.jpg', description: 'Produto ambientado, informações e valores conferidos.' },
  { id: 4, key: 'dimensoes', title: 'Dimensões', short: 'Dimensões', agent: 'Desenhista Técnico', file: '/references/04-dimensoes.jpg', description: 'Ambientação superior, cotas e vistas com medidas oficiais.' },
  { id: 5, key: 'aplicacoes', title: 'Ambientes adequados', short: 'Aplicações', agent: 'Arquiteto de Ambientes', file: '/references/05-aplicacoes.jpg', description: 'Dois ambientes distintos, com uso tecnicamente autorizado.' },
];

export const AGENTS = [
  { key: 'director', name: 'Diretor', number: '00', role: 'Direção de produção', color: '#c18bff', description: 'Organiza o cadastro, as referências e a ficha técnica do produto.' },
  ...IMAGE_TYPES.map((i) => ({ key: i.key, name: i.short, number: String(i.id).padStart(2, '0'), role: i.agent, color: ['#f6bb68','#79d5c6','#87aef2','#e19ec0','#e8cd86'][i.id-1], description: i.description, imageNumber: i.id })),
  { key: 'auditor', name: 'Auditor', number: '06', role: 'Qualidade e revisão', color: '#b7bfcc', description: 'Acompanha aprovações e solicitações de correção das cinco imagens.' },
];

export const STATUS_LABELS = {
  pending: 'Aguardando',
  in_progress: 'Em produção',
  needs_review: 'Em revisão',
  approved: 'Aprovada',
  changes_requested: 'Corrigir',
};

export const STATUS_META = {
  pending: { label: 'Aguardando', color: 'idle' },
  in_progress: { label: 'Em produção', color: 'working' },
  needs_review: { label: 'Em revisão', color: 'review' },
  approved: { label: 'Aprovada', color: 'done' },
  changes_requested: { label: 'Correção pendente', color: 'issue' },
};

export const CATEGORIES = ['Arandela', 'Spot', 'Plafon', 'Pendente', 'Refletor', 'Lâmpada', 'Trilho', 'Fita LED', 'Outro'];

export const EMPTY_FORM = { name: '', sku: '', category: 'Arandela', specifications: '', dimensions: '', package_contents: '', applications: '', notes: '' };

export function prettyDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export function safeError(error) {
  if (!error) return 'Ocorreu um erro inesperado.';
  const str = typeof error === 'string' ? error : error.message || 'Erro inesperado';
  if (str.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (str.includes('Email not confirmed')) return 'Confirme o e-mail para acessar.';
  if (str.includes('row-level security')) return 'Sem permissão para este arquivo ou registro. Verifique se executou todo o SQL.';
  if (str.includes('Bucket not found')) return 'Bucket de arquivos não encontrado. Execute o SQL do projeto.';
  return str;
}
