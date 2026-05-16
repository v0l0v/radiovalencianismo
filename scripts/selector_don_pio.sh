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

# Limpiar selección y crear ENLACE RELATIVO (muy importante para el rsync)
rm -f "$SELECCION_DIR"/*
cp "$SELECTED" "$SELECCION_DIR/programa_actual.mp3"

echo "$SELECTED" >> "$HISTORIAL"
# Generar JSON para la web
echo "{\"title\": \"$SELECTED\"}" > "$BASE_DIR/seleccion/ultimo_programa.json"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Don Pio: $SELECTED" >> "$BASE_DIR/selector_log.txt"
echo "Cambio completado: $SELECTED"
