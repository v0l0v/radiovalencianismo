#!/bin/bash

# Detectar la ruta base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="$SCRIPT_DIR/../backend/mp3/programas/ateneo"
HISTORIAL="$BASE_DIR/historial.txt"
SELECCION_DIR="$BASE_DIR/seleccion"

mkdir -p "$SELECCION_DIR"
cd "$BASE_DIR"

# Obtener MP3s disponibles
mapfile -t FILES < <(ls *.mp3 2>/dev/null)

if [ ${#FILES[@]} -eq 0 ]; then
    echo "No hay archivos en $BASE_DIR"
    exit 1
fi

# Rotación sin repetir
if [ -f "$HISTORIAL" ] && [ $(wc -l < "$HISTORIAL") -ge ${#FILES[@]} ]; then
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

rm -f "$SELECCION_DIR"/*
# Usar nombre único para evitar caché en Liquidsoap
TIMESTAMP=$(date +%s)
cp "$SELECTED" "$SELECCION_DIR/programa_${TIMESTAMP}.mp3"

echo "$SELECTED" >> "$HISTORIAL"

# ✅ Generar JSON bien formado en RAÍZ (sin extensión .mp3 en el título)
TITLE="${SELECTED%.mp3}"
FECHA=$(date '+%Y-%m-%d %H:%M:%S')
printf '{\n    "title": "%s",\n    "thumbnail": "",\n    "url": "",\n    "date": "%s"\n}\n' "$TITLE" "$FECHA" > "$BASE_DIR/ultimo_programa.json"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Ateneo: $SELECTED" >> "$BASE_DIR/selector_log.txt"

# Publicar avís en Nostr (Normes d'El Puig)
BOT_DIR="$SCRIPT_DIR/../nostr_bot"
if [ -f "$BOT_DIR/.env" ]; then
    docker run --rm --env-file "$BOT_DIR/.env" nostr-bot node index.js "📻 En 5 minuts comença L'Ateneo en Valencianismo Radio! Connecta't ya en valencianismo.com" &
fi
