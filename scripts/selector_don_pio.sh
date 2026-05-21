#!/bin/bash

# Detectar la ruta base independientemente de si estamos en local o en el VPS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="$SCRIPT_DIR/../backend/mp3/programas/horaDonPio"
HISTORIAL="$BASE_DIR/historial.txt"
SELECCION_DIR="$BASE_DIR/seleccion"

mkdir -p "$SELECCION_DIR"
cd "$BASE_DIR"

# Obtener todos los archivos mp3
mapfile -t FILES < <(ls *.mp3 2>/dev/null)

if [ ${#FILES[@]} -eq 0 ]; then
    echo "No se encontraron archivos mp3 en $BASE_DIR"
    exit 1
fi

if [ -f "$HISTORIAL" ] && [ $(wc -l < "$HISTORIAL") -ge ${#FILES[@]} ]; then
    echo "Ciclo de Don Pío completado. Reiniciando historial."
    > "$HISTORIAL"
fi

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

SELECTED="${AVAILABLE[$RANDOM % ${#AVAILABLE[@]}]}"

# Limpiar selección y crear archivo con nombre único para evitar caché de Liquidsoap
rm -f "$SELECCION_DIR"/*
TIMESTAMP=$(date +%s)
cp "$SELECTED" "$SELECCION_DIR/programa_${TIMESTAMP}.mp3"

echo "$SELECTED" >> "$HISTORIAL"
# Generar JSON para la web
echo "{\"title\": \"$SELECTED\"}" > "$BASE_DIR/seleccion/ultimo_programa.json"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Don Pio: $SELECTED" >> "$BASE_DIR/selector_log.txt"
echo "Cambio completado: $SELECTED"

# Publicar avís en Nostr (Normes d'El Puig)
BOT_DIR="$SCRIPT_DIR/../nostr_bot"
if [ -f "$BOT_DIR/.env" ]; then
    docker run --rm --env-file "$BOT_DIR/.env" nostr-bot node index.js "📻 En 5 minuts comença La Hora de Don Pío en Valencianismo Radio! Connecta't ya en valencianismo.com" &
fi
