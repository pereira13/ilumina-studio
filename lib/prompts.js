import { IMAGE_TYPES } from './constants';

const specified = (text) => text?.trim() || 'NÃO INFORMADO — omitir qualquer alegação sobre esse campo';

export function makePrompt(product, step) {
  if (!product) return '';
  const job = IMAGE_TYPES.find((i) => i.id === step);
  const brief = {
    1: 'Imagem 01: capa exclusivamente fotográfica. Produto instalado em cenário arquitetônico coerente, em primeiro plano, com máxima nitidez. NÃO acrescentar textos, ícones, logotipos ou selos.',
    2: 'Imagem 02: produto ambientado e um painel preto-grafite com borda amarelo-dourada contendo somente os acessórios efetivamente incluídos. Nome e textos legíveis. Não inventar acessórios. Se vier só o produto, mostrar somente 1 unidade.',
    3: 'Imagem 03: produto ambientado e painel técnico de especificações com ícones dourados e texto branco. Incluir SOMENTE características confirmadas da ficha técnica; não inventar watts, lumens, IP ou certificações.',
    4: 'Imagem 04: produto ambientado na porção superior e painel inferior de dimensões com vistas técnicas fundamentadas nas fotos/desenhos enviados, cotas e medidas exatas. Caso faltem medidas, solicitar antes de apresentar cotas.',
    5: 'Imagem 05: composição vertical dividida em dois ambientes realistas de uso permitido, produto corretamente instalado nas duas cenas; títulos, ícones dourados e textos breves. Nunca supor aptidão a piscina, sauna, umidade ou exterior.',
  };
  return `ILUMINA STUDIO — BRIEFING ${String(step).padStart(2,'0')} — ${job?.title || ''}\n\nPRODUTO: ${product.name}\nCÓDIGO INTERNO: ${specified(product.sku)}\nCATEGORIA: ${specified(product.category)}\nFICHA TÉCNICA: ${specified(product.specifications)}\nDIMENSÕES CONFIRMADAS: ${specified(product.dimensions)}\nCONTEÚDO DA EMBALAGEM: ${specified(product.package_contents)}\nAPLICAÇÕES AUTORIZADAS: ${specified(product.applications)}\nOBSERVAÇÕES: ${specified(product.notes)}\n\nPADRÃO VISUAL: premium, fotografia arquitetônica hiper-realista, painéis preto grafite e amarelo-dourado, textos brancos. A referência ${job?.file || ''} mostra apenas o estilo visual; ela NÃO fornece especificações deste novo produto.\n\nTAREFA:\n${brief[step]}\n\nREGRAS INEGOCIÁVEIS:\n- Usar as fotos REAIS deste produto que enviarei nesta mesma conversa. Preservar corpo, formato, cor, acabamento, difusor, escala, componentes e método de instalação.\n- Não inserir nome nem logotipo de fabricante, marca d’água ou peças inexistentes.\n- Não reproduzir as especificações da imagem de referência como se fossem deste produto.\n- Não inventar informações não informadas, acessórios, medidas ou aplicações.\n- Gerar somente UMA imagem separada nesta etapa, não um mosaico das cinco etapas.\n- Revisar ortografia, números e proporções; se não for possível garantir uma cota exata, indicar que é necessário revisar o desenho com uma ferramenta de diagramação.\n\nFAVOR GERAR AGORA A IMAGEM ${step} COM BASE NA FOTO ORIGINAL ANEXADA.`;
}

export function makeDirectorPrompt(product) {
  return `Atue como Diretor de Produção Ilumina Studio. Analise as fotos do produto e a ficha abaixo; separe informações confirmadas e pendentes e prepare cinco briefings individuais de imagem sem inventar especificações.\n\nProduto: ${product.name}\nCategoria: ${product.category}\nCódigo: ${specified(product.sku)}\nEspecificações: ${specified(product.specifications)}\nDimensões: ${specified(product.dimensions)}\nConteúdo da embalagem: ${specified(product.package_contents)}\nAplicações autorizadas: ${specified(product.applications)}\nObservações: ${specified(product.notes)}\n\nPadrão: imagem 1 capa ambientada sem textos; 2 acessórios; 3 características; 4 dimensões; 5 dois ambientes adequados. Preto grafite, branco e dourado. Sem marca de fabricante.`;
}
