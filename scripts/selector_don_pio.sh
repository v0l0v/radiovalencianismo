#!/bin/bash

# Directorio base de los programas de Don Pío
BASE_DIR="/home/victor/proyectos/RadioValencianismomasmas/backend/mp3/programas/horaDonPio"
HISTORIAL="$BASE_DIR/historial.txt"
ACTUAL_LINK="$BASE_DIR/actual"

# Asegurarse de que el directorio existe
mkdir -p "$BASE_DIR"

# Obtener todas las carpetas de volumen (ej: Vol. 1, Vol. 2...)
# Usamos un patrón que coincida con tus carpetas
cd "$BASE_DIR"
# Listamos directorios que empiecen por "Don Pío" y no sean "actual"
mapfile -t FOLDERS < <(ls -d Don\ Pío* 2>/dev/null | grep -v "actual")

# Si no hay carpetas, salir
if [ ${#FOLDERS[@]} -eq 0 ]; then
    echo "No se encontraron carpetas de Don Pío en $BASE_DIR"
    exit 1
fi

# Si el historial ya tiene todas las carpetas, lo reseteamos para empezar el ciclo
if [ -f "$HISTORIAL" ] && [ $(wc -l < "$HISTORIAL") -ge ${#FOLDERS[@]} ]; then
    echo "Ciclo completado. Reiniciando historial."
    > "$HISTORIAL"
fi

# Buscar carpetas disponibles (que no estén en el historial)
AVAILABLE=()
for folder in "${FOLDERS[@]}"; do
    if ! grep -qxF "$folder" "$HISTORIAL" 2>/dev/null; then
        AVAILABLE+=("$folder")
    fi
done

# Elegir una al azar de las disponibles
SELECTED="${AVAILABLE[$RANDOM % ${#AVAILABLE[@]}]}"

# Crear el enlace simbólico 'actual' apuntando a la carpeta elegida
# Usamos ln -sfn para forzar el cambio si ya existe
ln -sfn "$SELECTED" "actual"

# Guardar la elegida en el historial
echo "$SELECTED" >> "$HISTORIAL"

# Guardar registro detallado con fecha y hora para observar
echo "$(date '+%Y-%m-%d %H:%M:%S') - Seleccionado: $SELECTED" >> "$BASE_DIR/historial_detallado.txt"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Cambiado programa Don Pío a: $SELECTED"
