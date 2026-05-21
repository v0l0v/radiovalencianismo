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

# Publicar avís en Nostr (Normes d'El Puig)
BOT_DIR="$SCRIPT_DIR/../nostr_bot"
if [ -f "$BOT_DIR/.env" ]; then
    # Utilitzem l'ortografia RACV i executem en background per a no bloquejar
    docker run --rm --env-file "$BOT_DIR/.env" nostr-bot node index.js "📻 En 5 minuts comença Gotham VCF en Valencianismo Radio! Connecta't ya en valencianismo.com" &
fi
