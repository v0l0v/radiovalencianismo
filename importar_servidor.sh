#!/bin/bash

# Script de Importación e Instalación de Radio Valencianismo
# Este script se ejecuta en el nuevo servidor de DESTINO tras descomprimir el backup.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   IMPORTADOR AUTOMÁTICO - RADIO VALENCIANISMO     ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Verificar que estamos en la raíz del proyecto descomprimido
if [ ! -f "docker-compose.yml" ] || [ ! -f "Caddyfile" ]; then
    echo -e "${RED}[ERROR] Este script debe ejecutarse en el directorio raíz del proyecto descomprimido.${NC}"
    exit 1
fi

# 2. Instalar prerrequisitos si faltan (Docker, docker-compose)
echo -e "${YELLOW}[1/5] Comprobando dependencias del sistema...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker no está instalado. ¿Deseas instalarlo automáticamente ahora? (s/n):${NC} "
    read -r inst_docker
    if [ "$inst_docker" = "s" ] || [ "$inst_docker" = "S" ]; then
        echo -e "${BLUE}Instalando Docker...${NC}"
        sudo apt update && sudo apt install -y curl tar ufw
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER || true
        echo -e "${GREEN}Docker instalado correctamente.${NC}"
    else
        echo -e "${RED}[ERROR] Docker es obligatorio para correr este proyecto. Abortando.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✔ Docker ya está instalado.${NC}"
fi

# 3. Configurar Firewall (UFW)
echo -e "${YELLOW}[2/5] ¿Deseas configurar automáticamente el Firewall (UFW) con los puertos necesarios? (s/n):${NC} "
read -r conf_ufw
if [ "$conf_ufw" = "s" ] || [ "$conf_ufw" = "S" ]; then
    echo -e "${BLUE}Configurando Firewall UFW...${NC}"
    sudo ufw default deny incoming || true
    sudo ufw default allow outgoing || true
    sudo ufw allow ssh || true
    sudo ufw allow 80/tcp || true   # HTTP para Caddy / SSL
    sudo ufw allow 443/tcp || true  # HTTPS para Caddy
    sudo ufw allow 8080/tcp || true # Puerto de directo (BUTT) a Liquidsoap
    sudo ufw --force enable || true
    echo -e "${GREEN}✔ Firewall configurado y activo.${NC}"
else
    echo -e "${YELLOW}Omitiendo configuración de Firewall. Recuerda abrir los puertos 80, 443 y 8080 manualmente.${NC}"
fi

# 4. Modificación automática de Dominios
echo -e "${YELLOW}[3/5] ¿Vas a utilizar un dominio diferente al actual (valencianismo.com)? (s/n):${NC} "
read -r cambio_dominio
if [ "$cambio_dominio" = "s" ] || [ "$cambio_dominio" = "S" ]; then
    echo -e "${YELLOW}Introduce el NUEVO dominio base (ej. mi-nueva-radio.com):${NC} "
    read -r nuevo_dom
    if [ -n "$nuevo_dom" ]; then
        echo -e "${BLUE}Reemplazando dominios en el Caddyfile...${NC}"
        # Hacemos copia de seguridad antes de modificar
        cp Caddyfile Caddyfile.bak
        sed -i "s/valencianismo.com/$nuevo_dom/g" Caddyfile
        echo -e "${GREEN}✔ Caddyfile actualizado. (Se guardó respaldo en Caddyfile.bak)${NC}"
        
        # También actualizamos cualquier otra referencia si fuese necesario
        echo -e "${YELLOW}Dominio modificado a: $nuevo_dom${NC}"
    else
        echo -e "${RED}Entrada vacía. Manteniendo dominio original.${NC}"
    fi
else
    echo -e "${GREEN}Manteniendo el dominio original valencianismo.com.${NC}"
fi

# 5. Configurar archivos de entorno (.env)
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[4/5] No se detectó archivo .env de configuración. Creando plantilla...${NC}"
    echo "N8N_BASIC_AUTH_USER=admin" > .env
    echo "N8N_BASIC_AUTH_PASSWORD=valencianismotopsecret" >> .env
    echo -e "${GREEN}✔ Archivo .env generado. Puedes editarlo luego para cambiar claves.${NC}"
else
    echo -e "${GREEN}✔ Archivo .env existente detectado.${NC}"
fi

# 6. Despliegue de los contenedores
echo -e "${YELLOW}[5/5] Levantando la pila de contenedores de Docker Compose...${NC}"
sudo docker compose up -d

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}   ¡IMPORTACIÓN Y DESPLIEGUE COMPLETADOS!           ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "Todos los servicios (Caddy, Icecast, Liquidsoap, Piper-TTS, Portainer y n8n) se están ejecutando."
echo -e "El sistema puede tardar 1-2 minutos en iniciar completamente por la descarga del modelo de voz de Piper.\n"

echo -e "${YELLOW}Próximos pasos recomendados:${NC}"
echo -e "1. Asegúrate de haber apuntado el DNS de tu dominio a la IP de este servidor."
echo -e "2. Copia tus archivos de música (.mp3) a la carpeta: ${BLUE}$(pwd)/backend/mp3/${NC}"
echo -e "3. Comprueba el estado con: ${BLUE}sudo docker compose ps${NC}"
echo -e "4. Ver los logs de Caddy o Liquidsoap con: ${BLUE}sudo docker compose logs -f web${NC} o ${BLUE}liquidsoap${NC}"
