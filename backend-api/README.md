# Back-end Trinity

API Rails 8.1, PostgreSQL 15 e notificações persistentes com Solid Queue.
A execução local está descrita no README da raiz.

## Autenticação e permissões

As rotas exigem Authorization: Bearer <token>, exceto cadastro, login e GET /up.
Tokens HS256 expiram em 24 horas; tokens inválidos retornam 401.
Cada recurso é buscado dentro dos clubes do usuário. Criar/alterar/remover ciclos,
moderar indicações e agendar reuniões exige administração do clube correspondente.
Perfis de terceiros mostram apenas dados do clube compartilhado.

Email é normalizado para minúsculas, nickname é único sem diferenciar maiúsculas,
e novas senhas precisam de pelo menos 8 caracteres. Senhas existentes continuam válidas.
Login permite 10 tentativas por IP a cada 3 minutos; cadastro permite 5 por hora.
Os limites usam o cache Rails (memória no desenvolvimento, Solid Cache em produção).
Em instalações com múltiplos processos, configure um cache compartilhado e persistente.

Erros retornam { error: string, errors: string[] }, mantendo os campos usados pelo Angular.
Usuários e clubes têm listas explícitas de atributos serializáveis: hashes de senha
e URLs de webhook nunca são enviados, inclusive em associações aninhadas.

## Regras e concorrência

Indicação valida participação no clube, dono do slot e ciclo aberto. Filme e slot
são gravados na mesma transação; locks seguem clube, ciclo e slot.
O mesmo filme não pode ocupar duas vagas. Uma vaga preenchida não pode ser
sobrescrita pelo membro; o administrador só pode alterar indicações sem avaliações.
Avaliações exigem filme vinculado ao ciclo aberto e participação no clube.
Restrições e índices únicos no PostgreSQL complementam as validações Ruby.

MonthlyCycleCreator concentra o sorteio; FilmIndication concentra indicação e moderação;
ClubDashboard, ClubCatalog e UserProfile montam as consultas das telas.

## Paginação

Listagens aceitam page (padrão 1) e per_page (padrão 50, máximo 100).
Catálogo, ciclos, filmes e avaliações continuam retornando arrays e informam
X-Total-Count, X-Page e X-Per-Page, acessíveis pelo CORS.
Perfis retornam pagination no JSON e paginam avaliações/recados.
O catálogo traz até 50 críticas recentes por filme/ciclo; médias e totais consideram
todas as avaliações. As demais críticas podem ser consultadas na listagem paginada
GET /avaliacoes/filme/:filme_id. A interface usa a paginação do catálogo, dos ciclos,
das críticas, das avaliações do perfil e dos recados. O perfil também informa total_recados.

## Discord

O serviço jobs do Compose executa Solid Queue, com dados na mesma base da aplicação.
A API agenda as notificações apenas após commit; rollback descarta o agendamento.
Aceitam-se somente webhooks HTTPS de discord.com ou discordapp.com, sem redirecionamentos.
A entrega possui timeouts de 5 segundos e até 5 tentativas em caso de erro.
O job revalida URLs já armazenadas e não permite menções automáticas.
Salvar a integração confirma o agendamento; não anuncia entrega síncrona.

Logs: docker compose logs -f jobs

## Migrations e preservação dos dados

As migrations novas não apagam duplicatas silenciosamente: uma colisão interrompe
a transação para correção explícita. Emails são normalizados antes dos índices.
Reuniões antigas são copiadas sem duplicação para reunioes, e a tabela anterior
é preservada como reuniaos_legacy, sem bloquear exclusões de ciclos.
As migrations de normalização/arquivamento são irreversíveis; para desfazê-las,
restaure um backup. Não altere migrations antigas já aplicadas.

## Verificação

Os testes usam registros próprios, transações e um banco separado.
Não aponte TEST_DATABASE_NAME para o banco usado pela aplicação.

```powershell
docker compose run --rm --no-deps -e RAILS_ENV=test -e TEST_DATABASE_NAME=trinity_backend_test api bundle exec rails db:prepare
docker compose run --rm --no-deps -e RAILS_ENV=test -e TEST_DATABASE_NAME=trinity_backend_test api bundle exec rails zeitwerk:check
docker compose run --rm --no-deps -e RAILS_ENV=test -e TEST_DATABASE_NAME=trinity_backend_test api bundle exec rails test
docker compose run --rm --no-deps api bundle exec rubocop
docker compose run --rm --no-deps api bundle exec brakeman --no-pager
```

A CI está em .github/workflows/ci.yml na raiz, com PostgreSQL 15, análise estática,
verificação de estilo, autoload e testes. Os testes de concorrência usam conexões reais
e verificam que indicações/sorteios simultâneos não criam registros duplicados.

Para produção, use Dockerfile.prod, configure SECRET_KEY_BASE, credenciais do banco,
FRONTEND_URL, o worker e HTTPS. O Compose da raiz continua sendo desenvolvimento local.
