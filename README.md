# ILUMINA STUDIO — Escritório Virtual de Agentes

Sistema Next.js + Supabase + Vercel para gestão **manual** da produção de imagens de iluminação.

## O que o projeto inclui

- Escritório isométrico vetorial, interativo, com sete agentes e painel lateral de status.
- Autenticação por e-mail/senha no Supabase Auth.
- Catálogo de produtos com fichas técnicas, dimensões, acessórios e aplicações permitidas.
- Upload privado de fotografias e documentos técnicos (incluindo PDF).
- Cinco vagas de imagens por produto com statuses: aguardando, em produção, revisão, aprovada, correção.
- Criação e cópia de briefings para os GPTs personalizados no ChatGPT Plus.
- Cadastro opcional dos links dos sete GPTs em **Minha conta** para abrir cada especialista diretamente (salvo localmente no navegador).
- Importação de imagens geradas no ChatGPT Plus; download individual; galeria.
- Histórico de alterações e revisão por etapa.
- Identidade visual baseada nas cinco referências enviadas, disponíveis na aba Padrão visual.
- Supabase SQL com RLS e Storage privado (bucket `ilumina-media`).

> Não aciona GPTs personalizados via API nem gera imagens automaticamente. Status são atualizados por usuários no painel. Não há cobrança de API de IA nesta versão.

## Instalação

**Leia [GUIA_IMPLANTACAO.md](GUIA_IMPLANTACAO.md)** — contém roteiro de Supabase, GitHub, Vercel e teste de ponta a ponta.

### Desenvolvimento local

Requer Node.js >=20.

```bash
npm install
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Abra http://localhost:3000.

### Chaves

Use SOMENTE a chave pública `anon` ou `publishable`. Nunca use `service_role` ou `secret` em `NEXT_PUBLIC_...`.

### Limitações e escopo

- A revisão não é automática; ela apenas armazena a decisão humana.
- As referências são visuais: não fornecem dados técnicos de outros produtos.
- A aplicação lista até 150 produtos, 750 etapas e 800 arquivos na versão inicial.
- Upload máximo de 15 MB por arquivo, limitado a JPG, PNG, WebP e PDF.
- Para grande volume, implementar paginação e processamento de miniaturas.
- O projeto não depende de APIs pagas de IA, mas Vercel/Supabase podem cobrar conforme os respectivos limites dos planos.
