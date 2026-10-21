# Checklist de testes de aceitação

- [ ] `npm install` e `npm run build` sem erros.
- [ ] Supabase `schema.sql` executa sem erro e cria tabelas e bucket.
- [ ] Cadastro de novo usuário e login via e-mail.
- [ ] Criar produto insere automaticamente cinco linhas em `image_jobs`.
- [ ] Editar produto mantém arquivos e tarefas.
- [ ] Upload de JPEG/PNG/WebP é armazenado no bucket privado e listado na ficha do produto.
- [ ] Upload de PDF de ficha técnica funciona.
- [ ] Cada estação no escritório abre o agente certo.
- [ ] Seleção de produto atualiza os status apresentados.
- [ ] Copiar briefing da etapa gera texto com dados reais do produto.
- [ ] Importar imagem 01 muda status para `needs_review`.
- [ ] Aprovar imagem importada atualiza indicador para verde.
- [ ] Solicitar correção exige texto na observação.
- [ ] Galeria mostra imagens privadas e oferece download individual.
- [ ] Histórico registra ações realizadas no site.
- [ ] Excluir imagem de referência e excluir produto com confirmação funcionam.
- [ ] Usuário B não enxerga produtos nem arquivos do usuário A.
- [ ] Site adapta-se a dispositivos móveis e desktops.
- [ ] Nenhuma variável `service_role`/secret está presente no browser.

**Limitações da verificação local no momento da geração:** testes conectados ao Supabase e build com dependências requerem acesso a rede, instalação npm e credenciais reais; valide após implantar. Não marque itens como concluídos sem testá-los.
