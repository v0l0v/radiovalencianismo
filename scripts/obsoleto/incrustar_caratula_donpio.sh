#!/bin/bash

# Directorio base
BASE_DIR="/home/victor/proyectos/RadioValencianismomasmas/backend/mp3/programas/horaDonPio"
COVER="$BASE_DIR/donpio.jpg"

if [ ! -f "$COVER" ]; then
    echo "No se encontró la carátula en $COVER"
    exit 1
fi

# Buscar todos los mp3 y aplicar la carátula
find "$BASE_DIR" -type f -name "*.mp3" | while read -r mp3; do
    echo "Procesando $mp3..."
    # Creamos un archivo temporal para evitar colisiones
    tmp_mp3="${mp3%/*}/tmp_$(basename "$mp3")"
    
    # ffmpeg -y -nostdin (sobrescribir, no consumir stdin)
    ffmpeg -y -nostdin -i "$mp3" -i "$COVER" -map 0:a -map 1:v -c copy -id3v2_version 3 -disposition:v:0 attached_pic "$tmp_mp3" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        mv "$tmp_mp3" "$mp3"
        echo "Carátula incrustada con éxito en $(basename "$mp3")"
    else
        echo "Error procesando $(basename "$mp3")"
        rm -f "$tmp_mp3"
    fi
done
