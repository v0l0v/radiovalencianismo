#!/bin/bash

# Detectar la ruta base independientemente de si estamos en local o en el VPS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="$SCRIPT_DIR/../backend/mp3/programas/juan_y_patri"
HISTORIAL="$BASE_DIR/historial.txt"
SELECCION_DIR="$BASE_DIR/seleccion"

mkdir -p "$SELECCION_DIR"
cd "$BASE_DIR"

# Obtener todos los archivos mp3 (excluyendo carpetas)
mapfile -t FILES < <(ls *.mp3 2>/dev/null)

if [ ${#FILES[@]} -eq 0 ]; then
    echo "No se encontraron archivos mp3 en $BASE_DIR"
    exit 1
fi

# Resetear historial si ya hemos puesto todos
if [ -f "$HISTORIAL" ] && [ $(wc -l < "$HISTORIAL") -ge ${#FILES[@]} ]; then
    echo "Ciclo completado. Reiniciando historial."
    > "$HISTORIAL"
fi

# Buscar disponibles
AVAILABLE=()
for f in "${FILES[@]}"; do
    if ! grep -qxF "$f" "$HISTORIAL" 2>/dev/null; then
        AVAILABLE+=("$f")
    fi
done

if [ ${#AVAILABLE[@]} -eq 0 ]; then
    > "$HISTORIAL"
    AVAILABLE=("${FILES[@]}")
fi

# Seleccionar uno al azar
SELECTED="${AVAILABLE[$RANDOM % ${#AVAILABLE[@]}]}"

# Crear el archivo en la carpeta de selección con nombre único (timestamp)
rm -f "$SELECCION_DIR"/*
TIMESTAMP=$(date +%s)
cp "$SELECTED" "$SELECCION_DIR/pildora_${TIMESTAMP}.mp3"

# Guardar en historial
echo "$SELECTED" >> "$HISTORIAL"

# Generar JSON para la web
echo "{\"title\": \"$SELECTED\", \"type\": \"pildora\"}" > "$BASE_DIR/seleccion/ultimo_programa.json"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Juan y Patri: $SELECTED" >> "$BASE_DIR/selector_log.txt"
echo "Cambio completado: $SELECTED"


# Sincronizar selección con el VPS si existe la clave local (Opción A - Backup)
SSH_KEY_PATH="$HOME/.ssh/id_ed25519_vps_sync"
if [ -f "$SSH_KEY_PATH" ]; then
    RSYNC_TARGETS=(
        "debian@51.38.236.161:/opt/v0l0v/apps/radiovalencianismo/backend/mp3/programas/juan_y_patri/seleccion/|5122"
        "debian@54.36.100.247:/home/debian/radiovalencianismo/backend/mp3/programas/juan_y_patri/seleccion/|22"
    )
    for target_entry in "${RSYNC_TARGETS[@]}"; do
        target="${target_entry%%|*}"
        port="${target_entry##*|}"
        echo "📤 Sincronizando selección de Juan y Patri a $target en puerto $port..."
        rsync -avz --delete --exclude=*.txt -e "ssh -i $SSH_KEY_PATH -p $port -o StrictHostKeyChecking=no" "$SELECCION_DIR/" "$target"
    done
fi
