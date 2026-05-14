#!/bin/bash
# =============================================================
# deploy.sh — Radio Valencianismo
# Hace git push a GitHub y luego actualiza el servidor (VPS)
# Uso: ./scripts/deploy.sh  o  git deploy
# =============================================================

set -e  # Parar si hay cualquier error

VPS_HOST="54.36.100.247"
VPS_USER="debian"
VPS_PATH="/home/debian/radiovalencianismo"
VPS_KEY="$HOME/.ssh/id_ed25519"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🚀 Radio Valencianismo — Deploy Automático${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 1. Git push a GitHub
echo -e "${YELLOW}[1/2] Subiendo cambios a GitHub...${NC}"
git push
echo -e "${GREEN}      ✓ GitHub actualizado${NC}\n"

# 2. SSH al VPS y git pull
echo -e "${YELLOW}[2/2] Actualizando servidor de producción (${VPS_HOST})...${NC}"
ssh -i "$VPS_KEY" "${VPS_USER}@${VPS_HOST}" "
    cd ${VPS_PATH} &&
    git pull --ff-only &&
    echo '✓ Servidor actualizado correctamente'
"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Deploy completado. valencianismo.com actualizado.${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
