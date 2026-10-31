#!/usr/bin/env bash
# deploy.sh — publica o frontend do Adota Patos na VPS
# Uso: ./deploy.sh usuario@ip-da-vps
set -euo pipefail

REMOTE="${1:?Informe o destino, ex.: root@1.2.3.4}"
DEST="/var/www/adota-patos"
SRC_DIR="$(cd "$(dirname "$0")/../.." && pwd)/frontend"

echo "==> Origem local: $SRC_DIR"
echo "==> Destino remoto: $REMOTE:$DEST"

# 1. Garante que o diretório de destino existe na VPS
ssh "$REMOTE" "mkdir -p $DEST"

# 2. Sincroniza o frontend (rsync preserva estrutura e remove arquivos antigos)
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*.map' \
  "$SRC_DIR/" "$REMOTE:$DEST/"

echo "==> Deploy concluído. Verifique em https://SEU-DOMINIO.com.br"

# 3. (Opcional) Recarregar Caddy se a config mudou
# ssh "$REMOTE" "sudo systemctl reload caddy"