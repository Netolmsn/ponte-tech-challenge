FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependǦncias do sistema necessǭrias para compilar mysqlclient
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    build-essential \
    netcat-openbsd \
    && apt-get clean

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

RUN chmod +x wait-for-db.sh

EXPOSE 8000

