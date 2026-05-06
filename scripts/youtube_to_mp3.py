import subprocess
import requests
import xml.etree.ElementTree as ET
import os
import sys

# Rutas relativas al directorio raíz del proyecto
FEED_FILE = "2radio.txt"
DEST_DIR = "backend/mp3/programas"
ARCHIVE_FILE = os.path.join(DEST_DIR, "archive_youtube.txt")

def download_videos():
    # Obtener el directorio del script para manejar rutas relativas si se lanza desde fuera
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    feed_path = os.path.join(base_path, FEED_FILE)
    dest_path = os.path.join(base_path, DEST_DIR)
    archive_path = os.path.join(base_path, ARCHIVE_FILE)

    if not os.path.exists(feed_path):
        print(f"Error: {feed_path} no encontrado.")
        return

    with open(feed_path, 'r') as f:
        rss_url = f.read().strip()

    if not rss_url:
        print("Error: URL de RSS vacía en 2radio.txt.")
        return

    print(f"Escaneando feed: {rss_url}")

    try:
        response = requests.get(rss_url, timeout=30)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        
        # Encontrar todos los enlaces <link> en los <item>
        links = []
        for item in root.findall('.//item'):
            link = item.find('link')
            if link is not None and ('youtube.com' in link.text or 'youtu.be' in link.text):
                # Limpiar el enlace si tiene parámetros extra de tracking
                clean_url = link.text.split('&')[0] if 'watch?v=' in link.text else link.text
                links.append(clean_url)

        if not links:
            print("No se encontraron enlaces de YouTube en el feed.")
            return

        print(f"Se encontraron {len(links)} posibles vídeos. Comprobando nuevos...")

        if not os.path.exists(dest_path):
            os.makedirs(dest_path, exist_ok=True)

        for video_url in links:
            # yt-dlp con --download-archive solo descargará los que no estén en el archivo
            cmd = [
                "yt-dlp",
                "-x",
                "--audio-format", "mp3",
                "--no-playlist",
                "--extractor-args", "youtube:player_client=ios,web",
                "--download-archive", archive_path,
                "-o", f"{dest_path}/%(title)s.%(ext)s",
                video_url
            ]
            
            print(f"--- Procesando: {video_url} ---")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                if "has already been recorded in archive" in result.stdout:
                    print(f"Vídeo ya descargado anteriormente.")
                else:
                    print(f"Descarga completada con éxito.")
            else:
                print(f"Error descargando {video_url}: {result.stderr}")

    except Exception as e:
        print(f"Error durante la automatización: {e}")

if __name__ == "__main__":
    download_videos()
