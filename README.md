# 1 Desafio Técnico Full Stack - PonteTech

Aplicação full stack para gestão de tarefas, com backend em Django REST Framework e frontend em Angular com Tailwind CSS.

---

## 2 Como rodar com Docker

### 2.1 Pré-requisitos

- Docker instalado.
- Docker Compose instalado.

### 2.2 Execução

Na raiz do projeto:

```bash
docker-compose up --build
```

### 2.3 Serviços e portas

- Frontend Angular: http://localhost:4000  
- Backend Django API: http://localhost:8080/api  
- Django Admin: http://localhost:8080/admin/  

O container do backend aplica migrações, executa o comando `seed_data` e, em seguida, sobe o servidor Django na porta 8000 (mapeado para 8080 externamente).

---

## 3 Frontend (Angular)

### 3.1 Principais rotas

- Login: http://localhost:4000/login  
- Cadastro: http://localhost:4000/register  
- Dashboard / Tarefas: http://localhost:4000/tarefas (requer login)  
- Detalhes da tarefa: http://localhost:4000/tarefas/:id  

### 3.2 Funcionalidades implementadas

- Autenticação via JWT (login e cadastro integrados com a API).
- Dashboard de tarefas com gráfico (Chart.js via ng2-charts) e cartões com totais por status.
- Listagem paginada de tarefas com:
  - filtro por status e prioridade;
  - busca por título/descrição;
  - ordenação por data de criação (ascendente/descendente).
- CRUD de tarefas:
  - criar, editar, alterar status e excluir;
  - validações de formulário alinhadas com as regras do backend (tamanho de título e descrição, campos obrigatórios etc.).

### 3.3 Tela de detalhes da tarefa

- edição inline (tíulo, descrição, status, prioridade);
- atualização rápida de status (botões para PENDENTE / EM_ANDAMENTO / CONCLUIDA);
- listagem e criação de comentários;
- botão para marcar/desmarcar como favorita (persistido em localStorage no navegador);
- botão para atribuir tarefa a outro usuário (por e-mail).

---

## 4 Backend (Django + DRF)

Base da API: http://localhost:8080/api

### 4.1 Autenticação e usuǭrios

**POST /api/auth/register/**  
Cria usuário e perfil (`UsuarioPerfil`).  
Payload: `{ "nome": string, "email": string, "password": string }`

Regras:

- nome com, no mínimo, 3 caracteres;
- e-mail único;
- senha com, no mínimo, 8 caracteres, contendo pelo menos 1 letra e 1 número.

**POST /api/auth/login/**  
Autenticação por e-mail/senha e retorno de tokens JWT (`access` e `refresh`).  
Payload: `{ "email": string, "password": string }`

**GET /api/auth/me/**  
Retorna dados do usuǭrio autenticado e do respectivo perfil.  
Requer cabeçalho `Authorization: Bearer <access>`.

**SimpleJWT (endpoints auxiliares):**

- POST /api/auth/token/  
- POST /api/auth/token/refresh/  

### 4.2 Tarefas

Endpoint principal: `/api/tarefas/` (registrado via `DefaultRouter` como `tarefas`).

**GET /api/tarefas/**  
Lista tarefas do usuário autenticado, com paginação (`count`, `next`, `previous`, `results`).

Filtros opcionais via query string:

- `status`: PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA;
- `prioridade`: BAIXA, MEDIA, ALTA;
- `search`: busca em título e descrição;
- `ordering`: `criado_em` ou `-criado_em`.

**POST /api/tarefas/**  
Cria nova tarefa para o usuário autenticado.

Campos:

- `titulo` (3 a 100 caracteres);
- `descricao` (10 a 500 caracteres);
- `status` (opcional, padrão PENDENTE);
- `prioridade` (opcional, padrǜo MEDIA).

**GET /api/tarefas/<id>/**  
Detalhes de uma tarefa do usuário autenticado.

**PUT /api/tarefas/<id>/**  
Atualiza título, descrição, status e prioridade, respeitando as regras de validação e fluxo de status.

**PATCH /api/tarefas/<id>/**  
Atualização parcial (utilizada principalmente para alterar apenas status na tela de detalhes).

**DELETE /api/tarefas/<id>/**  
Exclui tarefa do usuário autenticado (comentários relacionados são removidos em cascata).

### 4.3 Fluxo de status

Validação implementada no serializer `TarefaSerializer`:

- De PENDENTE pode ir para:
  - PENDENTE, EM_ANDAMENTO ou CONCLUIDA;
- De EM_ANDAMENTO pode ir para:
  - EM_ANDAMENTO ou CONCLUIDA;
- De CONCLUIDA pode ir apenas para:
  - CONCLUIDA (não retrocede);
- De CANCELADA (se utilizada) só pode ir para:
  - CANCELADA.

Tentativas de transição inválida retornam 400 com erro em `status`.

### 4.4 Dashboard

**GET /api/dashboard/**  
Retorna contagem de tarefas do usuário autenticado:

```json
{
  "total": 3,
  "por_status": {
    "PENDENTE": 1,
    "EM_ANDAMENTO": 1,
    "CONCLUIDA": 1
  }
}
```

### 4.5 Comentários

**GET /api/tarefas/<tarefa_pk>/comentarios/**  
Lista comentários da tarefa pertencente ao usuário autenticado (sem paginação, ordenados por `criado_em` em ordem decrescente).

**POST /api/tarefas/<tarefa_pk>/comentarios/**  
Cria comentário para a tarefa:

- campo `texto` obrigatório, não pode ser vazio e tem limite de 1.000 caracteres;
- `usuario` e `tarefa` sǜo preenchidos automaticamente a partir do `request` e da URL.

Regras de segurança:

- Apenas tarefas do próprio usuário são acessíveis (`tarefa__usuario = request.user`);
- Não é possível criar comentário em tarefa de outro usuário (retorna 404).

### 4.6 Atribuição de tarefa

**POST /api/tarefas/<id>/atribuir/**  
Action customizada em `TarefaViewSet` para atribuir a tarefa a outro usuário.

Payload:

```json
{ "email": "destino@teste.com" }
```

Regras:

- A tarefa precisa ser do usuǭrio autenticado (caso contrário, 404);
- `email` É obrigatório; se não for enviado, retorna 400 com erro em `email`;
- Se o e-mail não existir na base, retorna 400 (usuário não encontrado);
- Em caso de sucesso:
  - `tarefa.usuario` passa a ser o usuário de destino;
  - a resposta retorna a tarefa atualizada.

---

## 5 Seeds e credenciais de teste

O comando de seed (`seed_data`) É executado automaticamente na subida do backend e cria:

- Usuário administrador (Django Admin e API):
  - Username (admin Django): `admin`;
  - E-mail na API: `admin@teste.com`;
  - Senha: `Admin@123`.
- Usuários comuns de teste:
  - E-mails: `user1@teste.com`, `user2@teste.com`, ..., até pelo menos `user20@teste.com`;
  - Senha (todos): `Teste@123`.

Também são criadas dezenas de tarefas de exemplo, cobrindo combinações de status e prioridade para o administrador e demais usuários.

---

## 6 Testes do backend e cobertura

Rodar testes (a partir da raiz, via Docker):

```bash
docker-compose run --rm backend python manage.py test
```

Com cobertura:

```bash
docker-compose run --rm backend coverage run manage.py test
docker-compose run --rm backend coverage report
```

Escopo coberto pelos testes:

- Autenticação: registro, login e erros de validação;
- Endpoint `/api/auth/me/` (usuário + perfil);
- CRUD de tarefas e fluxo de status (incluindo transições inválidas);
- Dashboard de tarefas;
- Validações de `TarefaSerializer` e `UsuarioRegisterSerializer`;
- Comando `seed_data` (garante criação de usuários e tarefas);
- Action de atribuição de tarefas (`/api/tarefas/<id>/atribuir/`);
- Listagem e criação de comentários, incluindo regras de segurança e validação de texto.

Os testes foram escritos para alcançar, no mínimo, 40% de cobertura de código no backend, conforme esperado pelo desafio (verifique o valor exato com `coverage report`).

---

## 7 Gaps e possíveis evoluções

Alguns pontos propositalmente simplificados ou ainda não endereçados:

- Favoritos: marcação de tarefa favorita é armazenada apenas no `localStorage` do navegador; não há persistência no backend nem filtro de favoritos na API;
- Atribuição de tarefas (UI): a atribuição é feita via `prompt` solicitando e-mail; uma evolução possível seria adicionar um campo dedicado com autocomplete ou seleção de usuários disponíveis;
- Gestão de comentários: não há edição ou exclusão de comentários, apenas criação e listagem;
- Testes de frontend: o foco de cobertura ficou no backend; não foram incluídos testes unitários ou de ponta a ponta no frontend;
- Internacionalização e acentuação: os textos estão em português simples, sem tratamento de i18n; em alguns pontos, acentos podem apresentar problemas de encoding;
- Segurança avançada: não há mecanismos de throttling, redefinição de senha, verificação de e-mail ou políticas de senha mais elaboradas.

Apesar desses pontos, o núcleo funcional do desafio (autenticação, tarefas, fluxo de status, dashboard, comentários, atribuição e favoritos no cliente) está implementado e coberto por testes no backend.

---

## 8 Problemas comuns (troubleshooting)

### 8.1 Erro Unknown database 'ponte_db'

Ao subir os serviços com Docker, pode aparecer o erro:

```text
MySQLdb.OperationalError: (1049, "Unknown database 'ponte_db'")
```

Esse erro indica que o banco de dados `ponte_db` ainda não foi criado no container `db` (MySQL).

#### 8.1.1 "Solução A ?" Criar o banco manualmente (sem apagar o volume)

Na raiz do projeto, executar:

```bash
docker-compose exec db mysql -uroot -proot -e "CREATE DATABASE ponte_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Em seguida, reiniciar o backend:

```bash
docker-compose restart backend
```

O Django aplicará as migrações e executará o `seed_data` normalmente.

#### 8.1.2 "Solução B ?" Resetar o volume do MySQL (apaga dados anteriores)

Caso não haja necessidade de preservar os dados atuais do banco:

```bash
docker-compose down -v
docker-compose up --build
```

O Docker removerá o volume `db_data`, o MySQL recriará o banco `ponte_db` a partir da variável `MYSQL_DATABASE` e o backend aplicará as migrações e o seed.

