#!/bin/bash
BASE_DIR="/home/victor/proyectos/RadioValencianismomasmas/backend/mp3/programas/horaDonPio"
find "$BASE_DIR" -type f -name "*.mp3" | while read -r file; do
    dir=$(dirname "$file")
    filename=$(basename "$file")
    # Crear un nombre limpio: don_pio_vol_X.mp3
    if [[ "$dir" =~ (Vol\.\ [0-9]+) ]]; then
        vol="${BASH_REMATCH[1]}"
        vol_num=$(echo "$vol" | grep -o '[0-9]\+')
        new_name="donpio${vol_num}.mp3"
        if [ "$filename" != "$new_name" ]; then
            mv "$file" "$dir/$new_name"
            echo "Renombrado: $filename -> $new_name"
        fi
    fi
done
