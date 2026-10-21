# Guia de implantação — Ilumina Studio

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com/dashboard e crie ou abra seu projeto.
2. Abra **SQL Editor > New Query**.
3. No editor, escolha **New Query**, apague qualquer conteúdo antigo e cole **todo** o conteúdo de `supabase/schema.sql` (do começo ao fim). Sem selecionar um trecho, execute com **Run**.
   - Se aparecer `syntax error at or near "$function$;"`, confira se o texto começa por `create extension ...` e se nenhuma parte isolada foi selecionada.
   - O arquivo pode ser executado novamente depois de uma tentativa parcial: suas tabelas são criadas com `IF NOT EXISTS` e as políticas/triggers são recriados.
4. Em **Table Editor**, confirme as tabelas `products`, `image_jobs`, `product_files` e `activity_logs`.
5. Em **Storage**, confirme que existe o bucket privado `ilumina-media` (criado pelo SQL).
6. Em **Authentication > Providers**, habilite Email se ainda não estiver habilitado.
7. Em **Authentication > URL Configuration**, configure **Site URL** com a URL da Vercel após publicar, e o **Redirect URL** correspondente (ex.: `https://seu-projeto.vercel.app/**`).
8. Em **Project Settings > API Keys** ou **Connect**, copie **Project URL** e a chave **publishable** ou **anon** pública.

**Segurança:** nunca use a chave `service_role`/`secret` no código cliente ou em variáveis `NEXT_PUBLIC_`.

## 2. Subir código no GitHub

Descompacte o ZIP e entre na pasta `ilumina-studio`.

```bash
git init
git add .
git commit -m "Ilumina Studio primeira versao"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/ilumina-studio.git
git push -u origin main
```

Crie o repositório vazio no GitHub antes de executar os últimos comandos. Não envie `.env.local` (ele já está no `.gitignore`).

## 3. Publicar na Vercel

1. Abra https://vercel.com/new.
2. Escolha **Import Git Repository** e importe `ilumina-studio`.
3. Selecione Framework **Next.js**, pasta raiz padrão (`./` se você enviou os arquivos da pasta ao repositório; ou `ilumina-studio` se enviou a pasta mãe).
4. Abra **Environment Variables** e cadastre:

   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ID-DO-PROJETO.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave pública `anon` ou `publishable`

5. Clique **Deploy**. Essas variáveis são inseridas na compilação do front-end. Se mudar alguma, execute **Redeploy**.
6. Copie o endereço `https://...vercel.app` e volte ao Supabase Authentication > URL Configuration para preencher Site URL/redirect.

## 4. Testar os sete agentes (fluxo manual)

1. Abra o site e clique **Criar conta** (ou entre). Se o Supabase exigir confirmação de e-mail, confirme antes do login.
2. Clique **Novo produto**. Informe nome, categoria e dados confirmados.
3. Na aba **Produtos**, clique **Enviar fotos** e anexe as referências reais do produto.
4. Abra **Escritório**, selecione o produto e clique no **Diretor** para copiar seu briefing geral.
5. Se desejar, abra **Minha conta > Links dos seus 7 GPTs**, cole as URLs dos GPTs personalizados que criou e clique em **Salvar links dos GPTs**. Elas são salvas apenas nesse navegador.
6. Clique no agente **Capa** e depois **Copiar briefing para GPT**.
7. Abra o GPT correspondente no ChatGPT Plus, **cole o briefing e anexe as fotografias reais**.
8. Baixe a imagem do ChatGPT e clique **Importar imagem do Plus** no site.
9. O agente ficará em **Em revisão**. Confira a imagem, marque **Aprovar** ou insira observação e **Solicitar correção**.
10. Repita com Acessórios, Especificações, Dimensões e Aplicações.
11. A aba **Galeria** mostra os cinco arquivos individualmente; **Histórico** registra mudanças no painel.

**Observação:** a versão manual não transfere arquivos automaticamente entre ChatGPT e o site, nem consulta o estado real de processamento de GPTs. Os indicadores refletem apenas eventos persistidos no Supabase.

## 5. Problemas comuns

- **Tela de configuração inicial:** URL/chave ausentes, inválidas ou ainda não disponíveis no build da Vercel. Corrija as variáveis e redeploy.
- **Bucket not found:** execute o `supabase/schema.sql` integralmente e confirme Storage > Buckets.
- **Permission denied / row level security:** entre na conta; confirme execução das policies do SQL e se você está enviando arquivos para um produto criado no mesmo usuário.
- **E-mail não confirmado:** confira a caixa de entrada ou configure confirmações no Supabase Auth.
- **Imagem não carrega:** conexão, sessão ou URL temporária expirada. Recarregue a página para renovar links assinados.
- **Grande quantidade de imagens:** tamanho máximo por arquivo = 15 MB. Use formatos JPEG/PNG/WebP.
- **Arquivos não enviados:** verifique políticas de Storage, bucket privado, tipo MIME, limite de tamanho e status da conta Supabase.
- **Build:** use Node 20+ e `npm install && npm run build`. O projeto não precisa de serviços pagos de IA.

## 6. Custo

- O ChatGPT Plus não fornece créditos para API. Neste projeto, **não há integração com a API da OpenAI**.
- A Vercel hospeda a aplicação; o Supabase salva os dados e arquivos. Os custos dos serviços seguem os limites de seus próprios planos.

## 7. Operação segura

- Ative confirmação de e-mail e as proteções de autenticação apropriadas no Supabase.
- Confirme que `ilumina-media` permanece **PRIVATE**.
- As políticas RLS bloqueiam leitura de produtos e arquivos de outros usuários.
- Considere backups regulares, monitoramento de uso e limitação de cadastro aberto antes de disponibilizar a ferramenta para equipe externa.
- Para uma equipe com acesso compartilhado aos mesmos produtos, será necessária uma evolução do modelo de permissões (organizações/membros); esta versão é multiusuário isolado.
