#!/bin/bash

# Función para incrustar carátula
incrustar() {
    local dir="$1"
    local cover="$2"
    local pattern="$3"

    if [ ! -f "$cover" ]; then
        echo "⚠️ No se encontró la carátula en $cover"
        return 1
    fi

    echo "--- Procesando programa en $dir ---"
    find "$dir" -type f -name "*.mp3" | while read -r mp3; do
        echo "Procesando $(basename "$mp3")..."
        tmp_mp3="${mp3%/*}/tmp_$(basename "$mp3")"
        
        ffmpeg -y -nostdin -i "$mp3" -i "$cover" -map 0:a -map 1:v -c copy -id3v2_version 3 -disposition:v:0 attached_pic "$tmp_mp3" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            mv "$tmp_mp3" "$mp3"
            echo "✅ Carátula incrustada con éxito."
        else
            echo "❌ Error procesando $(basename "$mp3")"
            rm -f "$tmp_mp3"
        fi
    done
}

# 1. Don Pío
incrustar "/home/victor/proyectos/RadioValencianismomasmas/backend/mp3/programas/horaDonPio" \
          "/home/victor/proyectos/RadioValencianismomasmas/assets/donpio.jpg"

# 2. Gotham VCF
incrustar "/home/victor/proyectos/RadioValencianismomasmas/backend/mp3/programas/gothamvcf" \
          "/home/victor/proyectos/RadioValencianismomasmas/assets/gothamvcf.jpg"
