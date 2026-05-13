import subprocess
import requests
import xml.etree.ElementTree as ET
import os
import sys
import time

# La carpeta base para las descargas de audios
BASE_DEST_DIR = "backend/mp3/programas"
# Ruta de yt-dlp (se usa ruta absoluta para evitar problemas en cron)
YT_DLP_PATH = "/usr/local/bin/yt-dlp"
FFMPEG_PATH = "/usr/bin/ffmpeg"
# Configuración del puente de envío (rsync)
RSYNC_ENABLED = False
RSYNC_TARGET = "debian@54.36.100.247:/home/debian/radiovalencianismo/backend/mp3/programas/"



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
    
    # El sistema ahora usa el archivo alerta.mp3 estático que debe estar en la carpeta del programa.

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

        # Buscamos el más reciente que sea público y no hayamos bajado
        
        # Leer el archivo de archivo una sola vez para comparar rápido
        archived_ids = []
        if os.path.exists(archive_path):
            with open(archive_path, 'r') as arch:
                archived_ids = arch.read()

        if not os.path.exists(dest_path):
            os.makedirs(dest_path, exist_ok=True)
            
        # Recorrer el feed buscando el más reciente que podamos bajar
        # Si encontramos uno ya archivado, paramos (ya estamos al día)
        ultimo_audio_path = ""
        success = False
        for video_url in links:
            video_id = video_url.split("v=")[-1] if "v=" in video_url else video_url.split("/")[-1]
            
            if video_id in archived_ids:
                print(f"🛑 El vídeo {video_id} ya ha sido procesado. Estamos al día. Finalizando.")
                break

            print(f"\n--- Procesando novedad: {video_url} ---")
            
            # Memorizar archivos antes de descargar para identificar el nuevo
            files_before = set(os.listdir(dest_path))
            
            # Usamos el título real del vídeo para que en la radio se vea cuál es
            out_template = f"{dest_path}/%(title)s.%(ext)s"
            
            cmd = [
                YT_DLP_PATH, "-x", "--audio-format", "mp3", "--no-playlist",
                "--no-check-certificate", "--download-archive", archive_path,
                "-o", out_template, "--format", "bestaudio/best"
            ]
            
            # Añadir cookies si el archivo existe
            cookies_file = os.path.join(base_path, "cookies.txt")
            if os.path.exists(cookies_file):
                cmd.extend(["--cookies", cookies_file])
                
            cmd.append(video_url)
            
            res = subprocess.run(cmd)
            if res.returncode == 0:
                files_after = set(os.listdir(dest_path))
                new_files = [f for f in (files_after - files_before) if f.endswith(".mp3") and not f.startswith("tmp_")]
                
                if not new_files:
                    # Probablemente ya existía el archivo o yt-dlp no descargó nada nuevo
                    print("ℹ️ No se detectó un archivo nuevo (posiblemente ya existía).")
                    continue

                f = new_files[0]
                full_mp3_path = os.path.join(dest_path, f)

                # --- LIMPIEZA: Ahora sí, borramos los viejos si es Gotham ---
                if program_folder == "gothamvcf":
                    print(f"🧹 Sustituyendo episodio antiguo por: {f}")
                    for f_old in files_before:
                        if f_old.endswith(".mp3") and f_old != f:
                            try: os.remove(os.path.join(dest_path, f_old))
                            except: pass
                        
                        # 1. Definir título limpio (quitar extensión y arreglar caracteres raros)
                        clean_title = f.replace(".mp3", "")
                        # Sustituir el carácter raro de la barra (⧸) por una barra normal (/) o guion
                        clean_title = clean_title.replace("⧸", "/").replace("⧹", "\\")
                        
                        # Asegurar que el título contiene el nombre del programa para que el frontend cargue la carátula
                        if program_folder == "gothamvcf" and "gotham" not in clean_title.lower():
                            clean_title = f"Gotham VCF - {clean_title}"
                        
                        tmp_mp3 = os.path.join(dest_path, f"tmp_{f}")
                        
                        # 2. Preparar comando base de ffmpeg para metadatos
                        cmd_args = [FFMPEG_PATH, "-y", "-nostdin", "-i", full_mp3_path]
                        
                        # 3. Añadir carátula si existe
                        cover_files = [cf for cf in os.listdir(dest_path) if cf.lower().endswith((".jpg", ".png"))]
                        if cover_files:
                            cover_path = os.path.join(dest_path, cover_files[0])
                            cmd_args += ["-i", cover_path, "-map", "0:a", "-map", "1:v"]
                            print(f"🖼️ Preparando carátula {cover_files[0]} para {f}...")
                        else:
                            cmd_args += ["-map", "0:a"]
                            
                        # 4. Añadir etiquetas y generar salida
                        cmd_args += [
                            "-c", "copy", "-id3v2_version", "3",
                            "-metadata", f"title={clean_title}",
                            "-metadata", "artist=Radio Valencianismo"
                        ]
                        
                        if cover_files:
                            cmd_args += ["-metadata:s:v", "title=Album cover", "-metadata:s:v", "comment=Cover (Front)", "-disposition:v:0", "attached_pic"]
                            
                        cmd_args.append(tmp_mp3)
                        
                        print(f"🏷️ Etiquetando audio: {clean_title}")
                        embed_res = subprocess.run(cmd_args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        
                        if embed_res.returncode == 0:
                            os.replace(tmp_mp3, full_mp3_path)
                            print("✅ Metadatos y carátula aplicados correctamente.")
                        else:
                            if os.path.exists(tmp_mp3): os.remove(tmp_mp3)
                            print("⚠️ Error al aplicar metadatos.")

                        success = True
                        break
                
                if success:
                    break

        if RSYNC_ENABLED:
            print(f"Iniciando sincronización selectiva con el servidor de la radio...")
            if program_folder == "gothamvcf":
                # Sincronizar solo carpeta gotham (mucho más rápido)
                src_gotham = os.path.join(base_path, "backend/mp3/programas/gothamvcf/")
                dest_gotham = RSYNC_TARGET + "gothamvcf/"
                
                print(f"📤 Subiendo episodios de Gotham...")
                subprocess.run(["rsync", "-avz", "--exclude=*.txt", src_gotham, dest_gotham])
            else:
                # Espejo completo para el resto de programas
                sync_cmd = ["rsync", "-avz", "--delete", os.path.join(base_path, "backend/"), RSYNC_TARGET.replace("/programas/", "/")]
                subprocess.run(sync_cmd)
            print("✅ Sincronización completa.")

    except Exception as e:
        print(f"Error durante el procesamiento: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso incorrecto.")
        sys.exit(1)
    download_videos(sys.argv[1])


