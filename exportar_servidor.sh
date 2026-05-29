#!/bin/bash

# Script de Exportación de Radio Valencianismo
# Este script se ejecuta en el servidor de ORIGEN para preparar el paquete de migración.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   EXPORTADOR AUTOMÁTICO - RADIO VALENCIANISMO     ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Verificar directorio de ejecución
if [ ! -f "docker-compose.yml" ] || [ ! -f "Caddyfile" ]; then
    echo -e "${RED}[ERROR] Este script debe ejecutarse en la raíz del proyecto (donde están docker-compose.yml y Caddyfile).${NC}"
    exit 1
fi

PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")
BACKUP_NAME="radiovalencianismo_backup.tar.gz"
BACKUP_PATH="../$BACKUP_NAME"

echo -e "${YELLOW}[1/4] Detectando archivos del proyecto en:${NC} $PROJECT_DIR"

# 2. Preguntar si detener contenedores antes de empaquetar (para evitar inconsistencias de bases de datos)
echo -e "${YELLOW}[2/4] ¿Quieres detener temporalmente los contenedores para hacer una copia limpia? (s/n):${NC} "
read -r respuesta_stop
if [ "$respuesta_stop" = "s" ] || [ "$respuesta_stop" = "S" ]; then
    echo -e "${BLUE}Deteniendo contenedores con docker compose...${NC}"
    sudo docker compose down || true
else
    echo -e "${YELLOW}Advertencia: Se empaquetará con los contenedores activos. Podrían haber cambios en caliente en base de datos.${NC}"
fi

# 3. Preguntar si incluir la carpeta de música MP3 (backend/mp3)
echo -e "${YELLOW}[3/4] ¿Deseas incluir la música de 'backend/mp3/' en el paquete?${NC}"
echo -e "      (s = Sí, incluir todo en un solo archivo. n = No, la transferirás a mano después)${NC}"
read -r respuesta_mp3

# Definir exclusiones base
EXCLUDES=(
    "--exclude=.git"
    "--exclude=node_modules"
    "--exclude=caddy_data"
    "--exclude=caddy_config"
    "--exclude=.gemini"
    "--exclude=*.tar.gz"
    "--exclude=exportar_servidor.sh" # No necesitamos empaquetar el propio script de exportación
)

if [ "$respuesta_mp3" != "s" ] && [ "$respuesta_mp3" != "S" ]; then
    echo -e "${BLUE}Excluyendo la música de backend/mp3/ (se recomienda subirla por rsync posteriormente)...${NC}"
    EXCLUDES+=("--exclude=backend/mp3/*")
else
    echo -e "${BLUE}Incluyendo música de backend/mp3/ en el paquete...${NC}"
fi

# 4. Comprimir el proyecto
echo -e "${YELLOW}[4/4] Creando el archivo comprimido en la carpeta superior...${NC}"
cd ..
tar "${EXCLUDES[@]}" -czvf "$BACKUP_NAME" "$PROJECT_NAME"

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}   ¡MIGRACIÓN EXPORTADA CON ÉXITO!                  ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "El archivo de respaldo se ha creado en:"
echo -e "👉 ${YELLOW}$(pwd)/$BACKUP_NAME${NC}\n"

# Recomendar comando para enviar al nuevo servidor
echo -e "Paso siguiente: Sube este archivo a tu nuevo VPS usando el siguiente comando:"
echo -e "----------------------------------------------------------------------"
echo -e "${BLUE}scp $(pwd)/$BACKUP_NAME usuario@IP_NUEVO_SERVIDOR:/home/usuario/${NC}"
echo -e "----------------------------------------------------------------------"
echo -e "Una vez subido, ejecuta allí el script ${YELLOW}importar_servidor.sh${NC} para automatizar la puesta en marcha."
