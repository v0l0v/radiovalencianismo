#!/bin/bash
# =============================================================
# sync_from_server.sh — Valencianismo Radio
# Descarga el estado actual (datos dinámicos, mp3, n8n, etc.) 
# desde el servidor de producción a tu entorno local.
# NO sobrescribe tu código local gracias a las exclusiones.
# =============================================================

set -e

VPS_HOST="100.79.188.3"
VPS_USER="debian"
VPS_PATH="/home/debian/radiovalencianismo/"
VPS_KEY="$HOME/.ssh/id_ed25519"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  ⬇️ Valencianismo Radio — Sync desde Producción${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Conectando con ${VPS_HOST} para sincronizar el estado...${NC}"

# Ejecutamos rsync excluyendo el código fuente y repositorios
# para que no sobrescriba los archivos html, css, js en los que estés trabajando.
rsync -avz -e "ssh -i $VPS_KEY" \
    --exclude='.git/' \
    --exclude='*.html' \
    --exclude='css/' \
    --exclude='js/' \
    --exclude='assets/' \
    --exclude='scripts/' \
    --exclude='docker-compose.yml' \
    --exclude='Caddyfile' \
    --exclude='.gitignore' \
    --exclude='__pycache__/' \
    "${VPS_USER}@${VPS_HOST}:${VPS_PATH}" .

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Estado del servidor copiado localmente con éxito.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
