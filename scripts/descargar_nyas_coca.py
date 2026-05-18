import os
import sys
import time
import requests
import subprocess
import xml.etree.ElementTree as ET

# Configuración
RSS_URL = "https://rss.app/feeds/7vARajiOaO8zJO76.xml"
BASE_PATH = "/home/victor/proyectos/RadioValencianismomasmas"
DEST_DIR = os.path.join(BASE_PATH, "backend/mp3/generico/nyas_coca")
ARCHIVE_PATH = os.path.join(DEST_DIR, "archive_nyas_coca.txt")
SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519")

# Destino remoto de producción
RSYNC_TARGET = "debian@54.36.100.247:/home/debian/radiovalencianismo/backend/mp3/generico/nyas_coca/"

def get_binary_path(binary_name):
    import shutil
    path = shutil.which(binary_name)
    if path: return path
    common_paths = [
        os.path.expanduser(f"~/.local/bin/{binary_name}"),
        f"/usr/bin/{binary_name}",
        f"/usr/local/bin/{binary_name}"
    ]
    for p in common_paths:
        if os.path.exists(p): return p
    return binary_name

YT_DLP_PATH = get_binary_path("yt-dlp")

def descargar():
    print("=== Iniciando descarga de canciones para Nyas Coca ===")
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR, exist_ok=True)

    try:
        # Obtener el feed XML
        print(f"📥 Obteniendo feed RSS de: {RSS_URL}")
        response = requests.get(RSS_URL, timeout=30)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        links = []
        for item in root.findall('.//item'):
            link = item.find('link')
            if link is not None and ('youtube.com' in link.text or 'youtu.be' in link.text):
                # Limpiar URLs para no bajar cosas extras de playlists
                clean_url = link.text.split('&')[0] if 'watch?v=' in link.text else link.text
                if clean_url not in links:
                    links.append(clean_url)

        if not links:
            print("❌ No se encontraron enlaces de YouTube en este feed RSS.")
            return

        print(f"🎵 Se encontraron {len(links)} canciones potenciales en la lista.")
        
        # Descargar cada canción usando yt-dlp de forma incremental con el archive file
        for index, video_url in enumerate(links, 1):
            video_id = video_url.split("v=")[-1] if "v=" in video_url else video_url.split("/")[-1]
            print(f"\n📥 [{index}/{len(links)}] Procesando: {video_url}")
            
            cmd = [
                YT_DLP_PATH, "-x", "--audio-format", "mp3", "--no-playlist",
                "--no-check-certificate", "--download-archive", ARCHIVE_PATH,
                "-o", os.path.join(DEST_DIR, "%(title)s.%(ext)s"), "--format", "bestaudio/best"
            ]
            
            # Buscar archivo de cookies local si existe
            cookies_file = os.path.join(BASE_PATH, "cookies.txt")
            if os.path.exists(cookies_file):
                cmd.extend(["--cookies", cookies_file])
                
            cmd.append(video_url)
            
            res = subprocess.run(cmd)
            if res.returncode == 0:
                print(f"✅ Descargado / Ya archivado con éxito.")
            else:
                print(f"⚠️ Error al descargar o saltado: {video_url}")

        # Sincronizar carpeta local con producción usando rsync
        print("\n📤 Sincronizando con el servidor de producción (VPS)...")
        rsync_cmd = ["rsync", "-avz", "--delete", "--exclude=*.txt"]
        if os.path.exists(SSH_KEY_PATH):
            rsync_cmd += ["-e", f"ssh -i {SSH_KEY_PATH} -o StrictHostKeyChecking=no"]
        
        # Origen local y destino remoto
        src_dir = DEST_DIR + "/"
        rsync_cmd += [src_dir, RSYNC_TARGET]
        
        sync_res = subprocess.run(rsync_cmd)
        if sync_res.returncode == 0:
            print("✅ Sincronización con el servidor de producción completada con éxito.")
        else:
            print("⚠️ Advertencia: Error durante la sincronización rsync con producción.")

        print("\n🎉 ¡Proceso de descarga y actualización completado!")

    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}")

if __name__ == "__main__":
    descargar()
