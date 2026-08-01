import os
import sys
import time
import requests
import subprocess
import xml.etree.ElementTree as ET

# Configuración
RSS_URL = "https://rss.app/feeds/7vARajiOaO8zJO76.xml"
SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_vps_sync")

# Destinos remotos de producción para rsync (desde local)
RSYNC_TARGETS = [
    {"target": "debian@51.38.236.161:/opt/v0l0v/apps/radiovalencianismo/backend/mp3/generico/nyas_coca/", "port": 5122}, # Servidor Principal Nuevo
    {"target": "debian@54.36.100.247:/home/debian/radiovalencianismo/backend/mp3/generico/nyas_coca/", "port": 22}      # Servidor en la sombra
]

# Detección inteligente de entorno (VPS de producción o máquina local)
script_dir = os.path.dirname(os.path.abspath(__file__))
BASE_PATH = os.path.dirname(script_dir)
IS_VPS = os.path.exists("/opt/v0l0v/apps/radiovalencianismo") or os.path.exists("/home/debian/radiovalencianismo")
DEST_DIR = os.path.join(BASE_PATH, "backend/mp3/generico/nyas_coca")

if IS_VPS:
    print("🖥️ Entorno detectado: VPS de Producción")
else:
    print("💻 Entorno detectado: Máquina Local (Víctor)")

ARCHIVE_PATH = os.path.join(DEST_DIR, "archive_nyas_coca.txt")

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
    print(f"=== Iniciando descarga de canciones para Nyas Coca ===")
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
        descargadas_nuevas = 0
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
                descargadas_nuevas += 1
            else:
                print(f"⚠️ Error al descargar o saltado: {video_url}")

        # Sincronización rsync (Solo si estamos en local)
        if not IS_VPS:
            print("\n📤 Sincronizando con los servidores de producción via rsync...")
            src_dir = DEST_DIR + "/"
            for target_info in RSYNC_TARGETS:
                target = target_info["target"]
                port = target_info["port"]
                print(f"🌍 Iniciando sincronización a {target} en puerto {port}...")
                
                rsync_base_cmd = ["rsync", "-avz", "--delete", "--exclude=*.txt"]
                if os.path.exists(SSH_KEY_PATH):
                    rsync_base_cmd += ["-e", f"ssh -i {SSH_KEY_PATH} -p {port} -o StrictHostKeyChecking=no"]
                
                sync_res = subprocess.run(rsync_base_cmd + [src_dir, target])
                if sync_res.returncode == 0:
                    print(f"✅ Sincronización con {target} completada con éxito.")
                else:
                    print(f"⚠️ Advertencia: Error durante la sincronización rsync a {target}.")
        else:
            print("\nℹ️ Ejecución directa en VPS: Archivos depositados localmente. Sincronización rsync omitida.")

        print("\n🎉 ¡Proceso de descarga y actualización completado!")

    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}")

if __name__ == "__main__":
    descargar()
