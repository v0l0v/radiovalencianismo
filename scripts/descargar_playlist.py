import os
import subprocess
import shutil

# Configuración
PLAYLISTS = [
    "https://www.youtube.com/watch?v=ofSlu6WelIA&list=PLk2QqWaU-e7MblEjH0CjkCiMvd0OHD3aZ",
    "https://www.youtube.com/watch?v=XTE98FNsS5U&list=PLk2QqWaU-e7MiQHjmx1N3edpYwAhw-ZSr"
]
DEST_DIR = "/home/victor/proyectos/RadioValencianismomasmas/backend/mp3/programas/juan_y_patri"
YT_DLP_PATH = shutil.which("yt-dlp") or os.path.expanduser("~/.local/bin/yt-dlp")

def descargar():
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)

    for url in PLAYLISTS:
        print(f"📥 Procesando lista: {url}")
        cmd = [
            YT_DLP_PATH,
            "-x", "--audio-format", "mp3",
            "--yes-playlist",
            "--download-archive", os.path.join(DEST_DIR, "archive_playlist.txt"),
            "-o", os.path.join(DEST_DIR, "%(title)s.%(ext)s"),
            "--add-metadata",
            url
        ]
        try:
            subprocess.run(cmd, check=True)
        except Exception as e:
            print(f"❌ Error descargando lista: {e}")

    print("✅ Proceso de descarga de listas finalizado.")

if __name__ == "__main__":
    descargar()
