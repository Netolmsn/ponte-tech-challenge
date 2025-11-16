# Desafio Técnico Full Stack - PonteTech

## Como rodar com Docker

Pré-requisitos:
- Docker e Docker Compose instalados.

Na raiz do projeto:

```bash
docker-compose up --build
```

Serviços:
- Frontend Angular: `http://localhost:4000`
- Backend Django API: `http://localhost:8080/api`
- Django Admin: `http://localhost:8080/admin/`

## Acesso ao frontend

Páginas principais:
- Login: `http://localhost:4000/login`
- Dashboard / Tarefas: `http://localhost:4000/tarefas` (requer login)

## Credenciais de teste

O comando de seed (`seed_data`) é executado automaticamente na subida do backend e cria:

- **Usuário administrador (Django Admin e aplicação)**
  - Username (admin Django): `admin`
  - E-mail na API: `admin@teste.com`
  - Senha: `Admin@123`

- **Usuários comuns de teste**
  - E-mails: `user1@teste.com`, `user2@teste.com`, ..., até pelo menos `user20@teste.com`
  - Senha (todos): `Teste@123`

## Testes do backend

Rodar testes (a partir da raiz, via Docker):

```bash
docker-compose run --rm backend python manage.py test
```

Com cobertura:

```bash
docker-compose run --rm backend coverage run manage.py test
docker-compose run --rm backend coverage report
```
