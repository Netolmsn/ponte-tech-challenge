# StrataSec Backend (Django)

Instrucoes especificas do backend e configuracao de CORS/JWT.

## Instalacao

```powershell
cd StrataSec
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Se nao quiser usar `requirements.txt`, instale manualmente:

```bash
pip install "Django>=5,<6" djangorestframework djangorestframework-simplejwt django-cors-headers
```

## Migracoes e Admin

```bash
python manage.py migrate
python manage.py createsuperuser  # opcional
```

## Executar (porta 8080)

```bash
python manage.py runserver 8080
```

## Testes unitarios

Os testes usam o framework padrao do Django + DRF (`APITestCase`) e a biblioteca `coverage` para medir cobertura.

### Rodar testes localmente (sem Docker)

```bash
python manage.py test
```

Com cobertura:

```bash
coverage run manage.py test
coverage report  # mostra percentual total (esperado >= 40%)
```

### Rodar testes via Docker Compose (recomendado)

A partir da raiz do projeto:

```bash
docker-compose run --rm backend python manage.py test
```

Com cobertura:

```bash
docker-compose run --rm backend coverage run manage.py test
docker-compose run --rm backend coverage report
```

Observacoes:
- A configuracao de banco em `stratasec/settings.py` usa o mesmo `DB_NAME` para testes (`TEST.NAME = ponte_db`), pois o usuario MySQL do desafio nao possui permissao para criar `test_ponte_db`.
- Isso significa que rodar testes pode limpar dados da base `ponte_db`. Em ambiente de desenvolvimento com Docker, os dados podem ser re-populados pelo comando `seed_data` (executado automaticamente na subida dos containers).

## Autenticacao JWT

- Obter token: `POST /api/auth/token/` com `{ "username": "...", "password": "..." }`
- Refresh: `POST /api/auth/token/refresh/` com `{ "refresh": "<token>" }`
- Usuario atual: `GET /api/auth/me/` (requer header `Authorization: Bearer <access>`)

