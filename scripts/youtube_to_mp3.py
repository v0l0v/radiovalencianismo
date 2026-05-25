import subprocess
import requests
import xml.etree.ElementTree as ET
import os
import sys
import time

# La carpeta base para las descargas de audios
BASE_DEST_DIR = "backend/mp3/programas"
# Rutas automáticas para yt-dlp y ffmpeg
def get_binary_path(binary_name):
    # Buscar en el PATH del sistema
    import shutil
    path = shutil.which(binary_name)
    if path: return path
    # Rutas comunes por si acaso (local y vps)
    common_paths = [
        os.path.expanduser(f"~/.local/bin/{binary_name}"),
        f"/usr/bin/{binary_name}",
        f"/usr/local/bin/{binary_name}"
    ]
    for p in common_paths:
        if os.path.exists(p): return p
    return binary_name # Fallback al nombre a secas

YT_DLP_PATH = get_binary_path("yt-dlp")
FFMPEG_PATH = get_binary_path("ffmpeg")

# Configuración del puente de envío (rsync)
RSYNC_ENABLED = True
RSYNC_TARGET = "debian@100.79.188.3:/home/debian/radiovalencianismo/backend/mp3/programas/"
SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519")



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
        
        # Procesar feeds RSS standard (<item>)
        for item in root.findall('.//item'):
            link = item.find('link')
            if link is not None and link.text and ('youtube.com' in link.text or 'youtu.be' in link.text):
                clean_url = link.text.split('&')[0] if 'watch?v=' in link.text else link.text
                if clean_url not in links:
                    links.append(clean_url)
                    
        # Procesar feeds Atom (<entry>), que es el nativo de YouTube
        # Buscar tanto con namespace como sin namespace
        entries = root.findall('.//{http://www.w3.org/2005/Atom}entry')
        if not entries:
            entries = root.findall('.//entry')
            
        for entry in entries:
            # Buscar el elemento link. En Atom es <link rel="alternate" href="..."/>
            for link in entry.findall('{http://www.w3.org/2005/Atom}link') + entry.findall('link'):
                href = link.get('href')
                if href and ('youtube.com' in href or 'youtu.be' in href):
                    clean_url = href.split('&')[0] if 'watch?v=' in href else href
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

                # 1. Definir título limpio (quitar extensión y arreglar caracteres raros)
                clean_title = f.replace(".mp3", "")
                # Sustituir el carácter raro de la barra (⧸) por una barra normal (/) o guion
                clean_title = clean_title.replace("⧸", "/").replace("⧹", "\\")

                # --- LIMPIEZA: Lógica diferenciada por programa ---
                if program_folder == "gothamvcf":
                    print(f"🧹 Gotham: Sustituyendo episodio antiguo por: {f}")
                    for f_old in files_before:
                        if f_old.endswith(".mp3") and f_old != f:
                            try: os.remove(os.path.join(dest_path, f_old))
                            except: pass
                    # Asegurar que el título contiene el nombre del programa para que el frontend cargue la carátula
                    if "gotham" not in clean_title.lower():
                        clean_title = f"Gotham VCF - {clean_title}"
                elif program_folder == "ateneo":
                    print(f"🧹 Ateneo: Limpiando archivos con más de 7 días...")
                    import time as t_lib
                    ahora = t_lib.time()
                    siete_dias = 7 * 24 * 60 * 60
                    for f_old in os.listdir(dest_path):
                        if f_old.endswith(".mp3"):
                            f_path = os.path.join(dest_path, f_old)
                            mtime = os.path.getmtime(f_path)
                            if (ahora - mtime) > siete_dias:
                                try: 
                                    os.remove(f_path)
                                    print(f"🗑️ Borrado por antigüedad: {f_old}")
                                except: pass
                        
                    # Asegurar que el título contiene el nombre del programa para que el frontend cargue la carátula
                    if "ateneo" not in clean_title.lower():
                        clean_title = f"Ateneo - {clean_title}"
                        
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
                    "-metadata", "artist=Valencianismo Radio"
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
                
                # --- NUEVO: Exportar metadatos para la web ---
                import json
                try:
                    # Intentar obtener la miniatura también
                    meta_cmd = [YT_DLP_PATH, "--get-title", "--get-thumbnail", "--no-playlist"]
                    if os.path.exists(cookies_file): meta_cmd.extend(["--cookies", cookies_file])
                    meta_cmd.append(video_url)
                    meta_res = subprocess.run(meta_cmd, capture_output=True, text=True)
                    
                    video_title = clean_title
                    video_thumb = ""
                    if meta_res.returncode == 0:
                        meta_lines = meta_res.stdout.strip().split("\n")
                        if len(meta_lines) >= 2:
                            video_title = meta_lines[0]
                            video_thumb = meta_lines[1]
                    
                    with open(os.path.join(dest_path, "ultimo_programa.json"), "w") as jf:
                        json.dump({
                            "title": video_title, 
                            "thumbnail": video_thumb, 
                            "url": video_url,
                            "date": time.strftime("%Y-%m-%d %H:%M:%S")
                        }, jf, indent=4)
                    print(f"📊 Metadatos exportados a ultimo_programa.json")
                    
                    # --- NUEVO: Copiar inmediatamente a la carpeta seleccion ---
                    import shutil
                    seleccion_dir = os.path.join(dest_path, "seleccion")
                    os.makedirs(seleccion_dir, exist_ok=True)
                    
                    # Limpiar archivos antiguos en seleccion local
                    for old_sel in os.listdir(seleccion_dir):
                        try: os.remove(os.path.join(seleccion_dir, old_sel))
                        except: pass
                        
                    # Copiar el mp3 con timestamp para Liquidsoap
                    timestamp = int(time.time())
                    shutil.copy2(full_mp3_path, os.path.join(seleccion_dir, f"programa_{timestamp}.mp3"))
                    
                    # Copiar el json
                    shutil.copy2(os.path.join(dest_path, "ultimo_programa.json"), os.path.join(seleccion_dir, "ultimo_programa.json"))
                    print(f"🚀 Episodio y metadatos movidos inmediatamente a '{seleccion_dir}'")
                    
                except Exception as je:
                    print(f"⚠️ Error exportando JSON o copiando a seleccion: {je}")

                break
            else:
                # Si llegamos aquí es porque yt-dlp falló (video privado, miembros, etc.)
                print(f"⚠️ No se pudo descargar el vídeo {video_id} (posiblemente privado o bloqueado).")
                print(f"📝 Anotando {video_id} en el archivo para saltarlo en el futuro.")
                with open(archive_path, 'a') as arch:
                    arch.write(f"youtube {video_id}\n")
                # Continuamos con el siguiente vídeo del feed
                continue

        # Mover rsync fuera del bucle para que se ejecute siempre
        # Usar rsync con la llave SSH específica y --delete para limpiar el servidor
        rsync_base_cmd = ["rsync", "-avz", "--delete", "--exclude=*.txt"]
        if os.path.exists(SSH_KEY_PATH):
            rsync_base_cmd += ["-e", f"ssh -i {SSH_KEY_PATH} -o StrictHostKeyChecking=no"]
        
        if program_folder == "gothamvcf":
            src_gotham = os.path.join(base_path, "backend/mp3/programas/gothamvcf/")
            dest_gotham = RSYNC_TARGET + "gothamvcf/"
            print(f"📤 Sincronizando Gotham (con limpieza)...")
            subprocess.run(rsync_base_cmd + [src_gotham, dest_gotham])
        else:
            # Espejo completo para el resto
            src_all = os.path.join(base_path, "backend/mp3/programas/")
            subprocess.run(rsync_base_cmd + [src_all, RSYNC_TARGET])
        print("✅ Sincronización completa.")


    except Exception as e:
        print(f"Error durante el procesamiento: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso incorrecto.")
        sys.exit(1)
    download_videos(sys.argv[1])


