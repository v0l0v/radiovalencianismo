import os
import subprocess
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROGRAMS_DIR = os.path.join(BASE_DIR, "backend/mp3/programas")
GENERICO_DIR = os.path.join(BASE_DIR, "backend/mp3/generico")

ffmpeg_path = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"
ffprobe_path = shutil.which("ffprobe") or "/usr/bin/ffprobe"

def get_metadata(file_path):
    cmd = [
        ffprobe_path, "-v", "quiet",
        "-show_entries", "format_tags=title,artist",
        "-of", "default=noprint_wrappers=1:nokey=0",
        file_path
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        tags = {}
        for line in res.stdout.strip().split("\n"):
            if "=" in line:
                k, v = line.split("=", 1)
                tags[k.lower()] = v
        return tags
    except Exception as e:
        print(f"Error checking tags for {file_path}: {e}")
        return {}

def fix_metadata(file_path):
    tags = get_metadata(file_path)
    if "title" in tags and "artist" in tags:
        # Ya tiene ambos metadatos
        return False
        
    filename = os.path.basename(file_path)
    clean_title = filename.replace(".mp3", "").replace("⧸", "/").replace("⧹", "\\")
    
    # Determinar si es de la carpeta 'generico' o 'programas'
    is_generico = "backend/mp3/generico" in file_path.replace("\\", "/")
    
    if is_generico:
        # Para genérico, intentamos extraer artista y título de la forma "Artista - Título.mp3"
        if " - " in clean_title:
            parts = clean_title.split(" - ", 1)
            artist = parts[0].strip()
            title = parts[1].strip()
        else:
            # Fallback: el nombre de la carpeta contenedor inmediato como artista y el archivo como título
            parent_folder = os.path.basename(os.path.dirname(file_path))
            artist = parent_folder if parent_folder not in ["generico", "mp3"] else "Radio Valencianismo"
            title = clean_title
    else:
        # Comportamiento original para programas
        artist = "Radio Valencianismo"
        parent_folder = os.path.basename(os.path.dirname(file_path))
        if parent_folder == "gothamvcf" and "gotham" not in clean_title.lower():
            clean_title = f"Gotham VCF - {clean_title}"
        elif parent_folder == "ateneo" and "ateneo" not in clean_title.lower():
            clean_title = f"Ateneo - {clean_title}"
        elif parent_folder == "horaDonPio" and "don pío" not in clean_title.lower() and "don pio" not in clean_title.lower():
            clean_title = f"La Hora Don Pío - {clean_title}"
        title = clean_title
        
    tmp_path = file_path + ".tmp.mp3"
    print(f"🏷️ Inyectando metadatos a: {filename} -> Artista: '{artist}' | Título: '{title}'")
    
    cmd = [
        ffmpeg_path, "-y", "-nostdin",
        "-i", file_path,
        "-c", "copy", "-id3v2_version", "3",
        "-metadata", f"title={title}",
        "-metadata", f"artist={artist}",
        tmp_path
    ]
    
    try:
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if res.returncode == 0:
            os.replace(tmp_path, file_path)
            return True
        else:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            print(f"❌ Error al procesar {filename} con ffmpeg")
            return False
    except Exception as e:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        print(f"❌ Error al ejecutar ffmpeg para {filename}: {e}")
        return False

def scan_and_fix():
    fixed_count = 0
    # Escanear programas
    print("🔍 Escaneando carpeta de PROGRAMAS...")
    for root, dirs, files in os.walk(PROGRAMS_DIR):
        if "seleccion" in root:
            continue
        for f in files:
            if f.endswith(".mp3"):
                file_path = os.path.join(root, f)
                if fix_metadata(file_path):
                    fixed_count += 1

    # Escanear generico
    print("\n🔍 Escaneando carpeta de GENERICO...")
    for root, dirs, files in os.walk(GENERICO_DIR):
        for f in files:
            if f.endswith(".mp3"):
                file_path = os.path.join(root, f)
                if fix_metadata(file_path):
                    fixed_count += 1
                    
    print(f"\n✨ ¡Proceso terminado! Se corrigieron {fixed_count} archivos de audio.")

if __name__ == "__main__":
    scan_and_fix()
