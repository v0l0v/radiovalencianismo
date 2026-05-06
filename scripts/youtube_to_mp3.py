import subprocess
import requests
import xml.etree.ElementTree as ET
import os
import sys

# La carpeta base para las descargas de audios
BASE_DEST_DIR = "backend/mp3/programas"

def download_videos(feed_filename):
    """
    Descarga audios de YouTube basándose en un archivo de feed .txt
    El archivo .txt debe contener la URL del RSS.
    Los audios se guardarán en backend/mp3/programas/[nombre_del_txt]/
    """
    # Determinar rutas base relativas al proyecto
    # Asumimos que el script está en la carpeta 'scripts' dentro de la raíz
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = os.path.dirname(script_dir)
    
    feed_path = os.path.join(base_path, feed_filename)
    
    # El nombre de la subcarpeta será el nombre del archivo sin la extensión .txt
    program_folder = os.path.splitext(feed_filename)[0]
    dest_path = os.path.join(base_path, BASE_DEST_DIR, program_folder)
    
    # Archivo de registro para no descargar lo mismo dos veces
    archive_path = os.path.join(dest_path, "archive_youtube.txt")

    if not os.path.exists(feed_path):
        print(f"Error: El archivo de feed '{feed_path}' no existe.")
        return

    # Leer la URL del feed
    with open(feed_path, 'r') as f:
        rss_url = f.read().strip()

    if not rss_url:
        print(f"Error: El archivo '{feed_filename}' está vacío.")
        return

    print(f"=== Iniciando Automatización para: {program_folder} ===")
    print(f"Feed: {rss_url}")
    print(f"Carpeta de destino: {dest_path}")

    try:
        # Obtener el contenido del RSS
        response = requests.get(rss_url, timeout=30)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        
        # Extraer enlaces de YouTube
        links = []
        for item in root.findall('.//item'):
            link = item.find('link')
            if link is not None and ('youtube.com' in link.text or 'youtu.be' in link.text):
                # Limpiar parámetros de tracking si existen
                clean_url = link.text.split('&')[0] if 'watch?v=' in link.text else link.text
                if clean_url not in links:
                    links.append(clean_url)

        if not links:
            print("No se encontraron vídeos de YouTube en este feed.")
            return

        # Solo procesar los 3 más recientes
        links = links[:3]

        print(f"Se detectaron {len(links)} vídeos recientes. Verificando descargas...")

        # Crear carpeta de destino si no existe
        if not os.path.exists(dest_path):
            os.makedirs(dest_path, exist_ok=True)

        for video_url in links:
            print(f"\n--- Procesando: {video_url} ---")
            
            # Comando de yt-dlp optimizado
            cmd = [
                "yt-dlp",
                "-x",                      # Extraer audio
                "--audio-format", "mp3",    # Formato mp3
                "--no-playlist",            # No bajar listas enteras
                "--no-check-certificate", 
                "--download-archive", archive_path,
                "-o", f"{dest_path}/%(title)s.%(ext)s",
                "--format", "bestaudio/best", # Asegurar que busca el mejor audio disponible
                video_url
            ]

            # Si existe el archivo cookies.txt, usarlo y cambiar el cliente
            cookie_path = os.path.join(base_path, "cookies.txt")
            if os.path.exists(cookie_path):
                print("Usando archivo de cookies detectado...")
                cmd.insert(1, "--cookies")
                cmd.insert(2, cookie_path)
                # Al usar cookies, usamos clientes que las soportan mejor
                cmd.extend([
                    "--extractor-args", "youtube:player_client=web_embedded,tv",
                    "--js-runtimes", "node",
                    "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
                ])
            else:
                # Sin cookies, usamos clientes móviles que suelen ser más permisivos
                cmd.insert(1, "--extractor-args")
                cmd.insert(2, "youtube:player_client=android,ios")
                cmd.insert(3, "--js-runtimes")
                cmd.insert(4, "node")
            
            # Ejecutar yt-dlp
            subprocess.run(cmd)
            # Pequeña pausa para no saturar a YouTube
            time.sleep(2)

        print(f"\n=== Tarea finalizada para {program_folder} ===")

    except Exception as e:
        print(f"Error durante el procesamiento del feed {feed_filename}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso incorrecto.")
        print("Ejemplo: python3 scripts/youtube_to_mp3.py gothamvcf.txt")
        sys.exit(1)
        
    feed_target = sys.argv[1]
    download_videos(feed_target)
