#!/usr/bin/env bash

# download_and_upload.sh
# ---------------------------------------
# Descarga el audio de un vídeo de YouTube usando yt-dlp (o youtube-dl) y lo envía a un servidor mediante una petición HTTP POST.
# Requisitos: yt-dlp (o youtube-dl) instalado y curl.
# Uso: ./download_and_upload.sh <URL_VIDEO> <ENDPOINT_UPLOAD>
# Ejemplo: ./download_and_upload.sh https://www.youtube.com/watch?v=abc123 https://mi-servidor.com/upload
# ---------------------------------------

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Uso: $0 <URL_VIDEO> <ENDPOINT_UPLOAD>"
  exit 1
fi

VIDEO_URL="$1"
UPLOAD_URL="$2"

# Directorio temporal para el archivo descargado
TMP_DIR=$(mktemp -d)

# Nombre del archivo sin extensión (yt-dlp lo genera)
OUTPUT_TEMPLATE="${TMP_DIR}/%(title)s.%(ext)s"

# Descargar solo el audio en formato mp3 (o m4a si prefieres)
# --extract-audio convierte a mp3, --audio-format especifica el formato
yt-dlp -x --audio-format mp3 -o "$OUTPUT_TEMPLATE" "$VIDEO_URL"

# Encontrar el archivo descargado
AUDIO_FILE=$(find "$TMP_DIR" -type f -name "*.mp3" | head -n 1)

if [[ -z "$AUDIO_FILE" ]]; then
  echo "Error: No se encontró el archivo de audio descargado."
  exit 1
fi

# Enviar el audio al servidor
# Se asume que el endpoint acepta multipart/form-data con el campo "file"
curl -X POST "$UPLOAD_URL" \
     -H "Accept: application/json" \
     -F "file=@${AUDIO_FILE}"

# Limpiar archivos temporales
rm -rf "$TMP_DIR"

echo "✅ Descarga y envío completados."
