#!/usr/bin/env python3
"""
update_mp3_covers.py
--------------------
Inyecta la carátula assets/logoVR800.webp en todos los MP3 de backend/mp3/
de forma pausada (SLEEP_BETWEEN segundos entre cada archivo) para no
bloquear el servidor de producción.

Uso:
    python3 scripts/update_mp3_covers.py
    python3 scripts/update_mp3_covers.py --dry-run   # solo lista, no modifica
    python3 scripts/update_mp3_covers.py --sleep 3   # pausa personalizada (seg)
"""

import os
import sys
import time
import shutil
import subprocess
import argparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP3_ROOT  = os.path.join(BASE_DIR, "backend", "mp3")
COVER_SRC = os.path.join(BASE_DIR, "assets", "logoVR800.webp")

FFMPEG = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"


def has_cover(file_path: str) -> bool:
    """Devuelve True si el mp3 ya lleva portada incrustada."""
    cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v",
        "-show_entries", "stream=codec_type",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
        return "video" in result.stdout  # la carátula se almacena como stream de vídeo en MP3
    except Exception:
        return False


def inject_cover(file_path: str, dry_run: bool) -> bool:
    """Inyecta COVER_SRC en file_path. Devuelve True si tuvo éxito."""
    tmp_path = file_path + ".cover.tmp.mp3"

    if dry_run:
        print(f"  [DRY-RUN] Procesaría: {os.path.relpath(file_path, BASE_DIR)}")
        return True

    cmd = [
        FFMPEG, "-y", "-nostdin", "-loglevel", "error",
        "-i", file_path,
        "-i", COVER_SRC,
        "-map", "0:a",          # audio del original
        "-map", "1:v",          # vídeo (portada) de la imagen
        "-c:a", "copy",         # sin re-encodificar el audio
        "-c:v", "mjpeg",        # conversión de webp → JPEG incrustado
        "-disposition:v:0", "attached_pic",
        "-id3v2_version", "3",
        "-metadata:s:v", "title=Album cover",
        "-metadata:s:v", "comment=Cover (Front)",
        tmp_path,
    ]

    try:
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        if result.returncode == 0:
            os.replace(tmp_path, file_path)
            return True
        else:
            print(f"  ❌ ffmpeg error:\n{result.stderr.strip()}")
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            return False
    except Exception as e:
        print(f"  ❌ Excepción: {e}")
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return False


def collect_mp3s() -> list:
    mp3s = []
    for root, _, files in os.walk(MP3_ROOT):
        for f in files:
            if f.lower().endswith(".mp3"):
                mp3s.append(os.path.join(root, f))
    mp3s.sort()
    return mp3s


def main():
    parser = argparse.ArgumentParser(description="Actualiza carátulas de MP3s con logoVR800.webp")
    parser.add_argument("--dry-run", action="store_true", help="No modifica nada, solo lista los archivos")
    parser.add_argument("--sleep", type=float, default=2.0, help="Segundos de pausa entre archivos (default: 2)")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Omitir mp3s que ya tengan portada")
    parser.add_argument("--force", action="store_true", help="Actualizar aunque ya tengan portada")
    args = parser.parse_args()

    if not os.path.exists(COVER_SRC):
        print(f"❌ No se encontró la imagen fuente: {COVER_SRC}")
        sys.exit(1)

    mp3s = collect_mp3s()
    total = len(mp3s)
    print(f"🎵 Encontrados {total} archivos MP3 en {MP3_ROOT}")
    print(f"🖼️  Portada fuente: {COVER_SRC}")
    print(f"⏱️  Pausa entre archivos: {args.sleep}s")
    print(f"{'[DRY-RUN] ' if args.dry_run else ''}Iniciando...\n")

    ok = skip = fail = 0

    for i, mp3 in enumerate(mp3s, 1):
        rel = os.path.relpath(mp3, BASE_DIR)

        # Saltar si ya tiene portada (a menos que --force)
        if not args.force and has_cover(mp3):
            print(f"[{i}/{total}] ⏭️  Ya tiene portada, omitiendo: {rel}")
            skip += 1
            # Pausa mínima incluso al omitir
            time.sleep(0.1)
            continue

        print(f"[{i}/{total}] 🔄 Procesando: {rel}")
        success = inject_cover(mp3, args.dry_run)

        if success:
            if not args.dry_run:
                print(f"  ✅ OK")
            ok += 1
        else:
            fail += 1

        # Pausa para no saturar I/O del servidor
        if i < total:
            time.sleep(args.sleep)

    print(f"\n{'=' * 50}")
    print(f"✨ Proceso completado")
    print(f"   ✅ Actualizados : {ok}")
    print(f"   ⏭️  Omitidos     : {skip}")
    print(f"   ❌ Fallidos      : {fail}")
    print(f"   📦 Total        : {total}")


if __name__ == "__main__":
    main()
