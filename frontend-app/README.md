# Front-end Trinity

Interface Angular 21.2 para o clube de filmes, com tema escuro, navegação responsiva e integração com a API Rails.
Para o uso normal, inicie o projeto pelo Docker Compose da raiz e acesse http://localhost:4200.

## Fluxos

- Login e cadastro com sessão automática, validação e mensagens de erro.
- Entrada por convite ou criação de clube, sem depender de dados antigos do navegador.
- Dashboard com todas as vagas visíveis, próximas ações, agenda e atividade do clube.
- Indicação de filmes com busca cancelável, confirmação e vaga real.
- Avaliações de 0,5 a 5, comentário obrigatório e proteção contra envios repetidos.
- Catálogo e críticas com paginação, curtidas e substituição de imagens ausentes.
- Ciclos com criação de mês/ano, moderação, status e confirmação de exclusão.
- Perfil com edição sincronizada na navegação, avaliações e recados paginados.
- Discord com estado configurado, substituição e remoção; a URL salva nunca é recuperada.

As regras de permissão continuam sendo aplicadas no servidor. O front-end apresenta somente as ações adequadas ao membro ou administrador.

## Organização

- models/api.models.ts: contratos tipados da API.
- services/api.service.ts: chamadas e leitura dos cabeçalhos de paginação.
- services/auth.service.ts: sessão, normalização e expiração do token.
- services/club-store.service.ts: dados compartilhados do clube e invalidação após mudanças.
- core/http.ts: Bearer enviado apenas à API do projeto; nunca ao TMDB ou a outro domínio.
- core/guards.ts: navegação autenticada, clube e telas de acesso.
- shared/: modais, paginação, estados, imagens, busca, avaliação, criação de ciclo e agenda.
- styles.scss: cores, tipografia e componentes visuais compartilhados.

Os modais usam dialog nativo, com foco contido, Escape, restauração do foco e da rolagem.
Há suporte a teclado, rótulos de campos, estados anunciados e preferência por movimento reduzido.
As rotas são carregadas sob demanda. A antiga /adicionar-filme redireciona para o dashboard.

## Desenvolvimento local

Node 22 e npm 11.6.2. O arquivo environment.ts versionado contém apenas padrões seguros.
No Docker, o entrypoint gera a configuração a partir do .env da raiz.
A chave TMDB usada pelo navegador é pública; nunca inclua segredos de servidor nesse arquivo.

```powershell
npm ci
npm start
```

O host e a porta devem corresponder ao FRONTEND_URL da API. O padrão do projeto é http://localhost:4200.

## Testes

```powershell
npm test -- --watch=false
npm run build
npm run test:e2e:install
npm run test:e2e
```

No Linux, use npm run test:e2e:install -- --with-deps para instalar as bibliotecas do Chromium.

Os testes unitários cobrem sessão, escopo do token, contrato de paginação e validações.
Os testes de navegador usam dados simulados: não criam contas, não alteram o banco real e não enviam mensagens ao Discord.
Cobrem desktop e celular, erros de rede, permissões, modais, perfil, convites, indicação, avaliação, ciclos e agenda.
Também verificam teclado, 320 pixels, texto ampliado e regras automáticas WCAG com axe.
O servidor de testes usa a porta 4201; os navegadores ficam em .cache/ms-playwright.

Relatórios e capturas ficam em playwright-report e test-results, ignorados pelo Git e pelo Docker.
A CI está em .github/workflows/frontend.yml na raiz.
As verificações automáticas complementam a inspeção visual; o player permanece dependente de um serviço externo.

## Dependências

As dependências compatíveis foram atualizadas. A auditoria da aplicação distribuída não contém alertas.
Permanecem avisos moderados na cadeia de ferramentas do Angular CLI (glob/minimatch).
A sugestão automática de correção exige downgrade incompatível do Angular; não foi aplicada.
O lockfile registra as versões efetivamente testadas.
