#!/bin/bash

# Detectar la ruta base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="$SCRIPT_DIR/../backend/mp3/programas/gothamvcf"
SELECCION_DIR="$BASE_DIR/seleccion"

mkdir -p "$SELECCION_DIR"
cd "$BASE_DIR"

# Coger el más reciente (por fecha de modificación)
SELECTED=$(ls -t *.mp3 2>/dev/null | head -n 1)

if [ -z "$SELECTED" ]; then
    echo "No hay archivos en $BASE_DIR"
    exit 1
fi

rm -f "$SELECCION_DIR"/*
# Copiar con un nombre único (timestamp) para que Liquidsoap no use la caché
TIMESTAMP=$(date +%s)
cp "$SELECTED" "$SELECCION_DIR/programa_${TIMESTAMP}.mp3"

# Generar JSON para la web (intentar copiar el original con carátula)
if [ -f "ultimo_programa.json" ]; then
    cp "ultimo_programa.json" "$SELECCION_DIR/ultimo_programa.json"
else
    echo "{\"title\": \"$SELECTED\"}" > "$SELECCION_DIR/ultimo_programa.json"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Gotham (Último): $SELECTED" >> "$BASE_DIR/selector_log.txt"


# Sincronizar selección con el VPS si existe la clave local (Opción A - Backup)
SSH_KEY_PATH="$HOME/.ssh/id_ed25519_vps_sync"
if [ -f "$SSH_KEY_PATH" ]; then
    RSYNC_TARGETS=(
        "debian@51.38.236.161:/opt/v0l0v/apps/radiovalencianismo/backend/mp3/programas/gothamvcf/seleccion/|5122"
        "debian@54.36.100.247:/home/debian/radiovalencianismo/backend/mp3/programas/gothamvcf/seleccion/|22"
    )
    for target_entry in "${RSYNC_TARGETS[@]}"; do
        target="${target_entry%%|*}"
        port="${target_entry##*|}"
        echo "📤 Sincronizando selección de Gotham VCF a $target en puerto $port..."
        rsync -avz --delete --exclude=*.txt -e "ssh -i $SSH_KEY_PATH -p $port -o StrictHostKeyChecking=no" "$SELECCION_DIR/" "$target"
    done
fi
