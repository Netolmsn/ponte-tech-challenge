#!/bin/sh
set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-3306}"

echo "Esperando o banco MySQL em ${host}:${port}..."
while ! nc -z "$host" "$port"; do
  sleep 1
done

echo "Banco de dados disponível."

