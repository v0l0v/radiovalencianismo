ls#!/usr/bin/env bash
# --------------------------------------------------------------
# sync_gotham.sh (Para ejecutar en LA MÁQUINA)
# Sincroniza los MP3 descargados desde lamaquina a laradio.
# --------------------------------------------------------------

set -euo pipefail

# ---------- CONFIGURACIÓN ----------
# Ruta en Lamaquina
SRC_DIR="/home/operador_ia/proyectos/rvalencianismo/backend/mp3/programas/gothamvcf"

# Datos de Laradio (VPS)
# NOTA: Cambia 'radio_user' por tu usuario real (ej: 'victor' o 'debian')
DEST_USER="debian"                     
DEST_HOST="54.36.100.247"
DEST_DIR="/home/debian/radiovalencianismo/backend/mp3/gothamvcf"

# Opciones de rsync: -a (archive), -z (comprimir), --remove-source-files (limpiar al terminar)
RSYNC_OPTS="-az --partial --remove-source-files"

# ---------- FUNCIÓN DE SINCRONIZACIÓN ----------
sync_once() {
    if [ ! -d "$SRC_DIR" ]; then
        echo "📂 La carpeta de origen no existe todavía. Esperando..."
        return
    fi

    echo "🔄 Sincronizando archivos: ${SRC_DIR} → ${DEST_USER}@${DEST_HOST}:${DEST_DIR}"
    
    # Aseguramos que la carpeta de destino existe en la radio
    ssh "${DEST_USER}@${DEST_HOST}" "mkdir -p ${DEST_DIR}"
    
    # Sincronizamos
    rsync ${RSYNC_OPTS} "${SRC_DIR}/" "${DEST_USER}@${DEST_HOST}:${DEST_DIR}/"
    
    echo "✅ Sincronización completada $(date '+%Y-%m-%d %H:%M:%S')"
}

# ---------- MODO DAEMON (vigilancia) ----------
daemon() {
    echo "🛎️ Monitorizando ${SRC_DIR} cada 30 segundos..."
    while true; do
        # Si existen archivos MP3, los enviamos
        if ls "${SRC_DIR}"/*.mp3 >/dev/null 2>&1; then
            sync_once
        fi
        sleep 30
    done
}

# ---------- ENTRADA ----------
if [[ "${1:-}" == "daemon" ]]; then
    daemon
else
    sync_once
fi
