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

# Crear el enlace en la carpeta de selección usando enlace RELATIVO
rm -f "$SELECCION_DIR"/*
ln -s "../$SELECTED" "$SELECCION_DIR/$SELECTED"

# Guardar en historial
echo "$SELECTED" >> "$HISTORIAL"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado Juan y Patri: $SELECTED" >> "$BASE_DIR/selector_log.txt"
echo "Cambio completado: $SELECTED"
