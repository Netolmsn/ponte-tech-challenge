# StrataSec Backend (Django)

Instruções específicas do backend e configuração de CORS/JWT.

## Instalação

```powershell
cd StrataSec
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Se não quiser usar `requirements.txt`, instale manualmente:

```bash
pip install "Django>=5,<6" djangorestframework djangorestframework-simplejwt django-cors-headers
```

## Migrações e Admin

```bash
python manage.py migrate
python manage.py createsuperuser  # opcional
```

## Executar (porta 8080)

```bash
python manage.py runserver 8080
```

## Autenticação JWT

- Obter token: `POST /api/auth/token/` com `{ "username": "...", "password": "..." }`
- Refresh: `POST /api/auth/token/refresh/` com `{ "refresh": "<token>" }`
- Usuário atual: `GET /api/auth/me/` (requere header `Authorization: Bearer <access>`)