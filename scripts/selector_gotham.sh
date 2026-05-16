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
ln -s "../$SELECTED" "$SELECCION_DIR/$SELECTED"

# Generar JSON para la web
echo "{\"title\": \"$SELECTED\"}" > "$BASE_DIR/seleccion/ultimo_programa.json"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Gotham (Último): $SELECTED" >> "$BASE_DIR/selector_log.txt"
