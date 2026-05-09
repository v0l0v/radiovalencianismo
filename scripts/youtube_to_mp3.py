import subprocess
import requests
import xml.etree.ElementTree as ET
import os
import sys
import time

# La carpeta base para las descargas de audios
BASE_DEST_DIR = "backend/mp3/programas"
# Ruta de yt-dlp (ajustada para el servidor privado)
YT_DLP_PATH = os.path.expanduser("~/.local/bin/yt-dlp")
# Configuración del puente de envío (rsync)
RSYNC_ENABLED = True
RSYNC_TARGET = "debian@100.79.188.3:/home/debian/radiovalencianismo/backend/mp3/programas/"

def generar_cuna_ia(base_path):
    """
    Usa el servicio siro_tts (puerto 8002) de La Máquina para generar la cuña de aviso.
    """
    texto = "Atención, en 5 minutos, Gotham tiene noticias frescas que contarnos. No se muevan de la sintonía de Radio Valencianismo."
    print(f"🎙️ Generando cuña por IA: '{texto}'")
    
    url_tts = "http://localhost:8002/api/tts" # Ajustar si el endpoint es distinto
    payload = {
        "text": texto,
        "speaker": "es_0", # Voz por defecto, se puede cambiar
        "speed": 1.0
    }
    
    try:
        response = requests.post(url_tts, json=payload, timeout=30)
        if response.status_code == 200:
            cuna_path = os.path.join(base_path, "backend/mp3/alertas/gotham_urgente.mp3")
            os.makedirs(os.path.dirname(cuna_path), exist_ok=True)
            with open(cuna_path, "wb") as f:
                f.write(response.content)
            print("✅ Cuña generada con éxito.")
            return True
    except Exception as e:
        print(f"⚠️ No se pudo generar la cuña por IA: {e}")
    return False

def download_videos(feed_filename):
    """
    Descarga audios de YouTube basándose en un archivo de feed .txt
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.dirname(script_dir)
    feed_path = os.path.join(base_path, feed_filename)
    program_folder = os.path.splitext(feed_filename)[0]
    dest_path = os.path.join(base_path, BASE_DEST_DIR, program_folder)
    archive_path = os.path.join(dest_path, "archive_youtube.txt")

    if not os.path.exists(feed_path):
        print(f"Error: El archivo de feed '{feed_path}' no existe.")
        return

    with open(feed_path, 'r') as f:
        rss_url = f.read().strip()

    if not rss_url:
        print(f"Error: El archivo '{feed_filename}' está vacío.")
        return

    print(f"=== Iniciando Automatización para: {program_folder} ===")
    
    # --- NOVEDAD: Si es Gotham, generamos la cuña de aviso con IA ---
    if program_folder == "gothamvcf":
        generar_cuna_ia(base_path)

    try:
        response = requests.get(rss_url, timeout=30)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        links = []
        for item in root.findall('.//item'):
            link = item.find('link')
            if link is not None and ('youtube.com' in link.text or 'youtu.be' in link.text):
                clean_url = link.text.split('&')[0] if 'watch?v=' in link.text else link.text
                if clean_url not in links:
                    links.append(clean_url)

        if not links:
            print("No se encontraron vídeos de YouTube en este feed.")
            return

        # Solo procesar el más reciente para la urgencia
        links = links[:1]
        
        if not os.path.exists(dest_path):
            os.makedirs(dest_path, exist_ok=True)

        # --- NOVEDAD: Limpieza total para Gotham (Solo queremos el último) ---
        if program_folder == "gothamvcf":
            print("🧹 Limpiando episodios antiguos de Gotham...")
            for f in os.listdir(dest_path):
                if f.endswith(".mp3"):
                    os.remove(os.path.join(dest_path, f))

        ultimo_audio_path = ""
        for video_url in links:
            print(f"\n--- Procesando: {video_url} ---")
            
            # Usamos el título real del vídeo para que en la radio se vea cuál es
            out_template = f"{dest_path}/%(title)s.%(ext)s"
            
            cmd = [
                YT_DLP_PATH, "-x", "--audio-format", "mp3", "--no-playlist",
                "--no-check-certificate", "--download-archive", archive_path,
                "-o", out_template, "--format", "bestaudio/best",
                "--extractor-args", "youtube:player_client=mweb",
                video_url
            ]

            cookie_path = os.path.join(base_path, "cookies.txt")
            if os.path.exists(cookie_path):
                cmd.insert(1, "--cookies")
                cmd.insert(2, cookie_path)
            
            res = subprocess.run(cmd)
            if res.returncode == 0 and program_folder == "gothamvcf":
                # Buscamos el archivo que acabamos de bajar para pasárselo al trigger
                for f in os.listdir(dest_path):
                    if f.endswith(".mp3"):
                        ultimo_audio_path = f"/mp3/programas/gothamvcf/{f}"
                        break

        if RSYNC_ENABLED:
            print(f"Iniciando sincronización con el servidor de la radio...")
            # Usamos --delete para que la radio sea un espejo exacto de lamaquina
            sync_cmd = ["rsync", "-avz", "--delete", os.path.join(base_path, "backend/"), RSYNC_TARGET.replace("/programas/", "/")]
            subprocess.run(sync_cmd)
            print("✅ Sincronización completa (Espejo activado).")

            # --- NOVEDAD: Si hay un audio nuevo de Gotham, disparamos la secuencia en la Radio ---
            if ultimo_audio_path:
                print("📢 Disparando protocolo de Última Hora en La Radio...")
                # El host de la radio es el que definimos en RSYNC_TARGET (ej: 100.79.188.3)
                radio_ip = RSYNC_TARGET.split("@")[1].split(":")[0]
                radio_user = RSYNC_TARGET.split("@")[0]
                
                trigger_cmd = f"ssh {radio_user}@{radio_ip} 'python3 /home/{radio_user}/radiovalencianismo/scripts/lanzar_gotham_urgente.py {ultimo_audio_path}'"
                # Usamos nohup para que el script de los 5 minutos siga corriendo aunque se cierre el SSH
                subprocess.Popen(f"nohup {trigger_cmd} > /dev/null 2>&1 &", shell=True)
                print("🚀 Protocolo activado. ¡En 5 minutos sonará en antena!")

    except Exception as e:
        print(f"Error durante el procesamiento: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso incorrecto.")
        sys.exit(1)
    download_videos(sys.argv[1])


