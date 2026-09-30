# Mini-Prontuário T3

Projeto-fio do **Tópico 3 — Arquiteturas em Camadas, ORM e Autenticação**
(TEC.1052 · Programação para Internet II · ADS/IFPI).

Ele chega **funcionando de ponta a ponta** no estado em que o Tópico 2
terminou — camadas Route/Controller/Service, hierarquia de erros,
validação Zod, upload de foto — e já **evoluído** com o recurso de
prescrições (MedicationRequest). O Tópico 3 o transforma três vezes:

| Trilha | O que muda | O que NÃO pode mudar |
|---|---|---|
| **ARQ** | Nasce a camada Repository (ports & adapters); as 2 violações plantadas da Regra da Dependência são corrigidas | O comportamento da API (os testes são a prova) |
| **ORM** | better-sqlite3 sai, Prisma entra — atrás da mesma interface | A interface dos repositories e o comportamento |
| **AUTH** | Identidade (argon2 + JWT), papéis e a matriz de permissões | Tudo que já passava continua passando — e os ataques passam a falhar |

## Instalação e execução (Níveis 1 e 2 implementados)

Use Node 22. Antes de iniciar, copie `.env.example` para `.env` e preencha
`JWT_SECRET` com um segredo aleatório (não o publique). Exemplo de geração:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | `file:../database/prontuario.db`, relativo a `prisma/schema.prisma` |
| `JWT_SECRET` | Obrigatório para assinar/verificar JWT; somente no ambiente/`.env` |
| `JWT_EXPIRES_IN` | Padrão `15m`; aceita duração como `5s`, `1h`, ou número de segundos |

```bash
npm install
npm run db:generate  # gera o Prisma Client
npm run db:reset     # APAGA dados locais, aplica migrations e insere seed fictício
npm run dev         # http://localhost:3000
```

Para preservar um banco já gerenciado por migrations, use `npx prisma migrate deploy`
em vez do reset. O seed não cria usuários nem senhas padrão: registre uma conta
com `POST /api/auth/register` (`name`, `email`, `password` com pelo menos 8 caracteres,
`role`: `admin`, `profissional` ou `recepcao`) e use essas credenciais no login.
O registro aberto com escolha do papel segue o contrato didático desta atividade.

No PowerShell com execução de scripts bloqueada, use `npm.cmd`/`npx.cmd`.
O gate requer Bash e gitleaks no PATH. Nesta execução, Git Bash foi priorizado
ao Bash do WSL e gitleaks 8.30.1 foi usado da pasta temporária, sem alterar `gate.sh`.

A interface completa está em `http://localhost:3000` (ela é **fora do
escopo** de todas as tarefas — mas leia o código dela: é a revisão viva
do Tópico 1). Os testes manuais de API estão em `requests.http`.

## Os comandos que importam

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor com recarga automática |
| `npm run db:reset` | Recria o banco com o seed |
| `npm run check` | Tipos (`tsc --noEmit`) |
| `npm run arch` | Regras de arquitetura (dependency-cruiser) |
| `npm run test` | Testes de API (servidor real, porta efêmera) |
| `npm run gate` | **Tudo acima, na ordem. É o "Done when" de qualquer tarefa.** |

> **O projeto-base chegava com UMA luz vermelha — de propósito.**
> `npm run arch` acusa **2 violações plantadas** da Regra da
> Dependência. Encontrá-las é exercício do Encontro 1; corrigi-las é
> parte da trilha ARQ. As duas violações foram corrigidas. Os resultados
> reais de cada etapa estão em `IA.md`. O gate atual passa com 17 testes,
> incluindo os 7 ataques ativos. A validação visual ainda depende de um
> navegador integrado disponível nesta sessão.

## O mapa do território

```
mini-prontuario-t3/
├── AGENTS.md                ← regras do projeto (humanos E agentes leem)
├── CLAUDE.md                ← 2 linhas: aponta para AGENTS + INVARIANTES
├── INVARIANTES.md           ← o que nunca pode quebrar (com enforcement)
├── gate.sh                  ← o portão: tipos + arquitetura + testes + segredos
├── .dependency-cruiser.cjs  ← as regras de camada, executáveis
├── requests.http            ← testes manuais (inclui os ATAQUES da trilha AUTH)
├── database/                ← schema.sql + seed.sql (vira histórico na trilha ORM)
├── prisma/                  ← LEIA-ME da trilha ORM (o schema é tarefa sua)
├── docs/
│   ├── code_review.md       ← roteiro da revisão adversarial
│   └── adr/0000-template.md ← modelo de ADR (nível 3 da atividade)
├── src/
│   ├── app.ts               ← montagem (testável) · server.ts só liga
│   ├── routes/              ← só roteiam        ┐
│   ├── controllers/         ← só traduzem HTTP  │ A Regra da
│   ├── services/            ← decidem           │ Dependência
│   ├── repositories/        ← (trilha ARQ)      ┘ aponta p/ dentro
│   ├── errors/ · middlewares/ · validation/
│   └── repositories/sqlite.ts ← conexão dos adapters SQLite preservados
├── tests/
│   ├── api.smoke.test.ts    ← a definição executável de "sem quebrar"
│   └── auth.attacks.test.ts ← dormem até a trilha AUTH nascer
└── public/                  ← frontend pronto (fora do escopo das tarefas)
```

## Mapa original das trilhas (tarefas implementadas)

Cada `TODO` no código diz **o que** fazer e **por quê** — nunca o código
pronto. A ordem importa: **ARQ → ORM → AUTH**.

### Trilha ARQ — Arquitetura (camada Repository)
| TODO | Onde | Tarefa |
|---|---|---|
| ARQ-1 | `services/patients.service.ts` | Interface `PatientsRepository` + adapter SQLite; o SQL sai do service |
| ARQ-2 | `services/encounters.service.ts` | Mesmo movimento para Encounter |
| ARQ-3 | `services/medications.service.ts` | Mesmo movimento para MedicationRequest |
| ARQ-4 e ARQ-5 | *(encontre-as)* | Corrigir as **2 violações plantadas** que o `npm run arch` acusa |
| ARQ-6 | `.dependency-cruiser.cjs` | Promover a régua: criar a regra "só repositories importam o driver" (a regra nasce DEPOIS da camada, senão é só ruído) |

### Trilha ORM — Prisma atrás da interface
O passo a passo mora em **`prisma/LEIA-ME.md`** (ORM-1 a ORM-5:
init → `db pull` → `@map`/`@@map` → repositories Prisma → baseline de
migrations). A partir daí vale o invariante **OP-1**: esquema só muda
por migration.

### Trilha AUTH — identidade e permissão
| TODO | Onde | Tarefa |
|---|---|---|
| AUTH-1 | `errors/HttpError.ts` | `UnauthorizedError` (401) e `ForbiddenError` (403) |
| AUTH-2 | *(migration Prisma)* | Tabela `users` (name, email único, password_hash, role) |
| AUTH-3 | `routes/auth.routes.ts` | `register` · `login` · `me` (+ controller + service) |
| AUTH-4 | `validation/auth.schemas.ts` | Schemas de registro e login |
| AUTH-5 | `middlewares/auth.ts` | `requireAuth` — verificação do JWT |
| AUTH-6/7/8 | *(não guiados)* | A Apresentação de Condução **para antes daqui**. Você tem a matriz de permissões e os testes de ataque — descubra o que falta e onde |

**Matriz de permissões** (o contrato da parte não guiada):

| Ação | admin | profissional | recepcao | sem token |
|---|---|---|---|---|
| Ver pacientes/atendimentos | ✅ | ✅ | ✅ | 401 |
| Criar paciente / foto | ✅ | ✅ | ✅ | 401 |
| Registrar atendimento | ✅ | ✅ | ❌ 403 | 401 |
| Ver prescrições | ✅ | ✅ | ❌ 403 | 401 |
| **Prescrever** | ❌ 403 | ✅ *só no atendimento que registrou* | ❌ 403 | 401 |

> A última linha é o coração da atividade: prescrever não é questão de
> **papel**, é questão de **domínio** — nem admin prescreve, e um
> profissional não prescreve no atendimento de outro. Middleware nenhum
> resolve isso sozinho. (`tests/auth.attacks.test.ts`, ATAQUE 6.)

## Escopo fechado de bibliotecas

`express` · `better-sqlite3` · `zod` · `multer` · `prisma`/`@prisma/client`
· `argon2` · `jsonwebtoken` · `dotenv` — **e nada além disso**, para você
e para qualquer agente que trabalhe aqui (está no `AGENTS.md`).

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `npm run test` falha em tudo | Esqueceu `npm run db:reset` antes |
| Upload responde 500 em vez de 413 | O tradutor do `LIMIT_FILE_SIZE` no errorHandler foi tocado |
| `mergeParams` — `req.params.id` undefined | Router aninhado sem `{ mergeParams: true }` |
| `arch` verde "do nada" | Alguém editou `.dependency-cruiser.cjs` — isso reprova a entrega (AGENTS.md § Do-not) |
| 401 em tudo depois da trilha AUTH | Falta `JWT_SECRET` no `.env` (copie de `.env.example`) |

## Nível 1 — ARQ e ORM

ARQ-1..3: `PatientsRepository`, `EncountersRepository` e `MedicationsRepository`
expõem apenas as operações usadas pelos services. Os adapters SQLite guardam SQL
parametrizado e traduções de persistência. Os ports são assíncronos desde a ARQ;
as fábricas dos services recebem o repository, e `repositories/index.ts` seleciona
os adapters. ARQ-4/5: o controller de atendimentos deixou de consultar o banco e
o service de prescrições recebe um ID, sem depender de `Request`/Express.
ARQ-6 acrescentou a proteção do driver, preservando as três regras anteriores.
A restrição UNIQUE também é traduzida em 409, fechando a corrida entre consulta e inserção.

ORM-1..5: introspecção do SQLite existente, models com `@map`/`@@map`, Client gerado,
adapters Prisma e baseline `0_init`. `active` continua INTEGER no banco e boolean
na API. Datas continuam strings no formato original. Os três services e os testes
permaneceram byte a byte inalterados na troca SQLite → Prisma (evidência em `IA.md`).
Somente a fase AUTH estendeu o port de atendimentos para registrar autoria.

O comando `prisma init` tentou buscar um subcomando na rede; a configuração mínima
foi criada localmente, seguida de `prisma db pull` real. A baseline foi gerada pelo
Prisma a partir do banco. Antes de ser aplicada, a criação do índice interno foi
expressa como `UNIQUE` na coluna, preservando o esquema original sem `writable_schema`.
Ela foi marcada aplicada no banco preexistente com `prisma migrate resolve --applied 0_init`.
Não execute esse resolve em banco vazio: use as migrations normalmente.

Depois da baseline, `create_users` e `encounter_author` foram criadas/aplicadas por
`prisma migrate dev`. Não há `$queryRaw`, nem edição do schema histórico ou de
migration já aplicada. Para evoluir: edite `prisma/schema.prisma` e execute
`npx prisma migrate dev --name nome_da_mudanca`. Mantenha os arquivos de migrations
no controle de versão; nenhum commit foi feito automaticamente.

## Nível 2 — AUTH

`POST /api/auth/register` valida com Zod, calcula argon2id antes de persistir e
responde 201 com usuário público; e-mail duplicado responde 409.
`POST /api/auth/login` responde `{ token, user }`; credenciais inválidas recebem
401 e a mesma mensagem genérica. `GET /api/auth/me` exige Bearer e retorna identidade.
Senha e hash nunca são retornados. O JWT HS256 contém `id`, `name`, `role`, `iat` e `exp`.
Header ausente/malformado, assinatura adulterada e expiração viram 401 pelo
`errorHandler`; papel sem permissão vira 403.

A matriz acima é aplicada integralmente: recepção cadastra pacientes/envia fotos,
mas não registra atendimentos nem vê prescrições; admin registra atendimentos e
vê prescrições, mas não prescreve. Só o profissional autor pode prescrever.
`professional_id` é obtido da identidade autenticada, nunca do corpo do pedido.
O service compara esse ID com o autor persistido, usando o repository. O middleware
não consulta o banco para decidir propriedade. Atendimentos históricos têm autor
nulo: continuam visíveis, mas ninguém pode prescrever neles sem autoria comprovada.

### AUTH-4: por que o login aceita senha curta no schema?

O registro estabelece a política de criação (mínimo 8 caracteres). O login verifica
uma credencial: senha curta, senha incorreta e usuário desconhecido devem produzir
o mesmo 401 genérico. Responder 400 somente à senha curta forneceria uma pista
adicional sobre as características esperadas de credenciais válidas. Campos com
tipo/formato inválido ainda são rejeitados pelo Zod; a distinção discutida é a
política de comprimento da senha.

## Validação e testes

```bash
npm run check
npm run arch
npm run test
npx tsx --test tests/auth.attacks.test.ts
npx tsx scripts/verify-auth.ts
npm run gate
npx prisma migrate status
```

O smoke mantém os cenários e suas verificações funcionais. Houve aprovação humana
explícita para preparar um profissional autenticado, enviar Bearer e criar um
atendimento próprio: o ID fixo do fixture passou a ser o ID criado pelo setup.
Os testes de ataque só mudaram no momento da decisão de skip, executada após
`before()`. O diff completo está em [`docs/auth-tests.diff`](docs/auth-tests.diff).
`tests/helpers.ts` não mudou. ARQ/ORM passaram antes dessas adaptações.

`scripts/verify-auth.ts` complementa os ataques com a matriz dos três papéis, upload,
hash persistido, payload mínimo, headers malformados e expiração real. Ele executa
os casos A1–A7 de `requests.http` via HTTP em porta efêmera, sem imprimir tokens
ou credenciais. Os sete testes de ataque originais incluem setup + seis ataques;
o caso de expiração é adicional. Para A7 manual, use o token expirado em `/api/auth/me`
ou outra rota protegida; refazer login emitiria um token novo.

O frontend, `gate.sh`, `database/schema.sql` e `tests/helpers.ts` foram preservados
por comparação SHA-256. `public/` não foi alterado. A validação visual de login,
crachá, cadastro, atendimento e prescrição permanece pendente: o Browser integrado
listou zero navegadores. As verificações HTTP não substituem essa etapa.

O gate varre o histórico Git. Como o checkout inicial não possuía arquivos
rastreados/commits, foi feita também uma varredura gitleaks dos arquivos não
ignorados, sem incluir `.env`, banco, uploads ou dependências. Veja evidências no
`IA.md`. Para reproduzir o gate completo, instale/disponibilize gitleaks no PATH.

## Autoavaliação baseada nas decisões desta execução

1. A decisão mais difícil foi resolver o conflito entre os smoke tests sem token
   e a nova matriz. A solução foi autorizada pelo humano: adaptar preparação e
   autenticação, preservando o comportamento funcional e sem exceções no backend.
2. Foi recusada a alternativa de liberar chamadas anônimas para satisfazer o smoke,
   pois violaria a matriz. Também foi recusada uma camada genérica de CRUD sem
   necessidade nas trilhas propostas.
3. Começando novamente, verificaríamos primeiro o momento em que o `skip` é
   calculado e a disponibilidade de Bash, gitleaks e navegador, evitando que
   limitações do ambiente fossem descobertas apenas durante os testes.

Nível 3 não foi implementado. Os commits foram criados posteriormente por pedido
explícito do responsável, com marcos para a base, ARQ, ORM, AUTH-1..5, matriz/testes
e documentação. O checkout começou sem arquivos rastreados; por isso o primeiro
marco registra a base recebida antes dos commits das trilhas.
