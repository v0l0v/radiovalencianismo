#!/bin/bash

# Directorio base de los programas de Don Pío en el servidor
BASE_DIR="/home/debian/radiovalencianismo/backend/mp3/programas/horaDonPio"
HISTORIAL="$BASE_DIR/historial.txt"
SELECCION_DIR="$BASE_DIR/seleccion"

# Asegurarse de que los directorios existen
mkdir -p "$SELECCION_DIR"

cd "$BASE_DIR"

# Obtener todos los archivos mp3 (excluyendo la carpeta de selección)
mapfile -t FILES < <(ls *.mp3 2>/dev/null)

# Si no hay archivos, salir
if [ ${#FILES[@]} -eq 0 ]; then
    echo "No se encontraron archivos mp3 en $BASE_DIR"
    exit 1
fi

# Si el historial ya tiene todos los archivos, lo reseteamos para empezar el ciclo
if [ -f "$HISTORIAL" ] && [ $(wc -l < "$HISTORIAL") -ge ${#FILES[@]} ]; then
    echo "Ciclo de Don Pío completado. Reiniciando historial."
    > "$HISTORIAL"
fi

# Buscar archivos disponibles (que no estén en el historial)
AVAILABLE=()
for f in "${FILES[@]}"; do
    if ! grep -qxF "$f" "$HISTORIAL" 2>/dev/null; then
        AVAILABLE+=("$f")
    fi
done

# Si por algún error AVAILABLE está vacío pero hay archivos, resetear historial
if [ ${#AVAILABLE[@]} -eq 0 ]; then
    > "$HISTORIAL"
    AVAILABLE=("${FILES[@]}")
fi

# Elegir uno al azar de los disponibles
SELECTED="${AVAILABLE[$RANDOM % ${#AVAILABLE[@]}]}"

# Limpiar la carpeta de selección y crear enlace al nuevo archivo
rm -f "$SELECCION_DIR"/*
ln -s "$BASE_DIR/$SELECTED" "$SELECCION_DIR/$SELECTED"

# Guardar la elegida en el historial
echo "$SELECTED" >> "$HISTORIAL"

# Registro para depuración
echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado para el próximo bloque: $SELECTED" >> "$BASE_DIR/selector_log.txt"
echo "Cambio completado: $SELECTED"
