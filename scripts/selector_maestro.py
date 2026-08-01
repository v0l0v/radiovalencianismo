#!/usr/bin/env python3
"""
Selector Maestro — Valencianismo Radio
Unifica la lógica de selección de pistas para todos los programas:
- Gotham VCF: Emite siempre el último programa disponible.
- Ateneo: Aplica el ciclo inteligente de 3 días (estreno y reposiciones secuenciales).
- La Hora de Don Pío: Rotación aleatoria sin repetir (historial).
- Juan y Patri: Rotación aleatoria sin repetir (historial).

Copia el archivo MP3 seleccionado a la subcarpeta 'seleccion/' con un timestamp único
para que Liquidsoap lo cargue dinámicamente y actualiza los metadatos de la web.
"""

import os
import sys
import json
import time
import shutil
import glob
import random
import argparse
from datetime import datetime

# Detección de entorno (Local vs VPS de producción)
script_dir = os.path.dirname(os.path.abspath(__file__))
BASE_PATH = os.path.dirname(script_dir)
IS_VPS = os.path.exists("/opt/v0l0v/apps/radiovalencianismo") or os.path.exists("/home/debian/radiovalencianismo")

# Mapeo de directorios por programa
PROGRAMAS_CONFIG = {
    "gothamvcf": {
        "dir": "backend/mp3/programas/gothamvcf",
        "modo": "ultimo_descargado",
        "nostr_aviso": "📻 En 5 minuts comença Gotham VCF en Valencianismo Radio! Connecta't ya en valencianismo.com"
    },
    "ateneo": {
        "dir": "backend/mp3/programas/ateneo",
        "modo": "ciclo_diario",
        "nostr_aviso": "📻 En 5 minuts comença L'Ateneo en Valencianismo Radio! Connecta't ya en valencianismo.com"
    },
    "don_pio": {
        "dir": "backend/mp3/programas/horaDonPio",
        "modo": "aleatorio_sin_repetir",
        "nostr_aviso": "📻 En 5 minuts comença La Hora de Don Pío en Valencianismo Radio! Connecta't ya en valencianismo.com"
    },
    "juan_y_patri": {
        "dir": "backend/mp3/programas/juan_y_patri",
        "modo": "aleatorio_sin_repetir",
        "nostr_aviso": "📻 En breu: nova pílula del Món de Juan i Patri en Valencianismo Radio! Connecta't ya en valencianismo.com"
    }
}

def enviar_aviso_nostr(mensaje):
    if not IS_VPS:
        return
    bot_dir = os.path.join(BASE_PATH, "nostr_bot")
    if os.path.exists(os.path.join(bot_dir, ".env")):
        try:
            import subprocess
            cmd = f'docker run --rm --env-file "{os.path.join(bot_dir, ".env")}" nostr-bot node index.js "{mensaje}"'
            subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            sys.stderr.write(f"Error al enviar aviso Nostr: {e}\n")

def registrar_log(prog_dir, mensaje):
    log_file = os.path.join(prog_dir, "selector_log.txt")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    try:
        with open(log_file, "a") as f:
            f.write(f"{timestamp} - {mensaje}\n")
    except Exception as e:
        sys.stderr.write(f"Error escribiendo log: {e}\n")

def actualizar_ultimo_programa_json(prog_dir, selected_file, is_pildora=False):
    seleccion_dir = os.path.join(prog_dir, "seleccion")
    os.makedirs(seleccion_dir, exist_ok=True)
    
    title_without_ext = os.path.splitext(selected_file)[0]
    src_json = os.path.join(prog_dir, f"{title_without_ext}.json")
    dest_json = os.path.join(seleccion_dir, "ultimo_programa.json")
    
    # Intentamos copiar el JSON específico si existe
    if os.path.exists(src_json):
        try:
            shutil.copy2(src_json, dest_json)
            return
        except Exception as e:
            sys.stderr.write(f"Error al copiar JSON específico: {e}\n")
            
    # Si no, generamos un JSON genérico/fallback
    json_data = {
        "title": title_without_ext,
        "thumbnail": "",
        "url": "",
        "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    if is_pildora:
        json_data["type"] = "pildora"
        
    try:
        with open(dest_json, "w") as f:
            json.dump(json_data, f, indent=4)
    except Exception as e:
        sys.stderr.write(f"Error escribiendo JSON de fallback: {e}\n")

def obtener_archivos_mp3(prog_dir):
    mp3_pattern = os.path.join(prog_dir, "*.mp3")
    archivos = glob.glob(mp3_pattern)
    return [os.path.basename(f) for f in archivos]

def resolver_ultimo_descargado(prog_dir, archivos):
    archivos.sort(key=lambda x: os.path.getmtime(os.path.join(prog_dir, x)), reverse=True)
    return archivos[0]

def resolver_ciclo_diario(prog_dir, archivos, forzar_bloque=None):
    archivos.sort(key=lambda x: os.path.getmtime(os.path.join(prog_dir, x)), reverse=True)
    estreno = archivos[0]
    hoy = datetime.now().strftime("%Y-%m-%d")
    
    estado_file = os.path.join(prog_dir, "ateneo_estado.json")
    estado = {}
    
    if os.path.exists(estado_file):
        try:
            with open(estado_file, "r") as f:
                estado = json.load(f)
        except Exception as e:
            sys.stderr.write(f"Error leyendo estado ateneo: {e}\n")
            
    if not estado or estado.get("ultimo_estreno_id") != estreno:
        estado = {
            "ultimo_estreno_id": estreno,
            "dia_ciclo": 1,
            "fecha_ultimo_desplazamiento": hoy
        }
    elif estado.get("fecha_ultimo_desplazamiento") != hoy:
        antiguo_ciclo = estado.get("dia_ciclo", 1)
        nuevo_ciclo = (antiguo_ciclo % 3) + 1
        estado["dia_ciclo"] = nuevo_ciclo
        estado["fecha_ultimo_desplazamiento"] = hoy

    try:
        with open(estado_file, "w") as f:
            json.dump(estado, f, indent=4)
    except Exception as e:
        sys.stderr.write(f"Error escribiendo estado ateneo: {e}\n")

    if forzar_bloque:
        bloque = forzar_bloque
    else:
        hora = datetime.now().hour
        if 12 <= hora < 15:
            bloque = 1
        elif 18 <= hora < 21:
            bloque = 2
        elif 22 <= hora <= 23 or 0 <= hora < 1:
            bloque = 3
        else:
            bloque = 1

    dia_ciclo = estado["dia_ciclo"]
    
    def obtener_con_fallbacks(indices):
        for idx in indices:
            if idx < len(archivos):
                return archivos[idx]
        return archivos[0]

    selected = None
    tipo_em = ""

    if dia_ciclo == 1:
        if bloque == 1:
            selected = estreno
            tipo_em = "Estreno (Ciclo Día 1)"
        elif bloque == 2:
            selected = obtener_con_fallbacks([1, 0])
            tipo_em = "Reposición A (Ciclo Día 1)"
        elif bloque == 3:
            selected = obtener_con_fallbacks([2, 1, 0])
            tipo_em = "Reposición B (Ciclo Día 1)"

    elif dia_ciclo == 2:
        if bloque == 1:
            selected = obtener_con_fallbacks([3, 1, 0])
            tipo_em = "Reposición A (Ciclo Día 2)"
        elif bloque == 2:
            selected = estreno
            tipo_em = "Estreno (Ciclo Día 2)"
        elif bloque == 3:
            selected = obtener_con_fallbacks([4, 2, 1, 0])
            tipo_em = "Reposición B (Ciclo Día 2)"

    elif dia_ciclo == 3:
        if bloque == 1:
            selected = obtener_con_fallbacks([5, 3, 1, 0])
            tipo_em = "Reposición A (Ciclo Día 3)"
        elif bloque == 2:
            selected = obtener_con_fallbacks([6, 4, 2, 1, 0])
            tipo_em = "Reposición B (Ciclo Día 3)"
        elif bloque == 3:
            selected = estreno
            tipo_em = "Estreno (Ciclo Día 3)"

    return selected, tipo_em

def resolver_aleatorio_sin_repetir(prog_dir, archivos):
    historial_file = os.path.join(prog_dir, "historial.txt")
    reproducidos = []
    
    if os.path.exists(historial_file):
        try:
            with open(historial_file, "r") as f:
                reproducidos = [line.strip() for line in f if line.strip()]
        except Exception as e:
            sys.stderr.write(f"Error leyendo historial: {e}\n")
            
    if len(reproducidos) >= len(archivos):
        reproducidos = []
        try:
            with open(historial_file, "w") as f:
                f.write("")
        except Exception as e:
            sys.stderr.write(f"Error vaciando historial: {e}\n")

    disponibles = [f for f in archivos if f not in reproducidos]
    if not disponibles:
        disponibles = archivos
        reproducidos = []
        try:
            with open(historial_file, "w") as f:
                f.write("")
        except Exception as e:
            sys.stderr.write(f"Error vaciando historial: {e}\n")

    selected = random.choice(disponibles)
    
    try:
        with open(historial_file, "a") as f:
            f.write(f"{selected}\n")
    except Exception as e:
        sys.stderr.write(f"Error escribiendo historial: {e}\n")
        
    return selected

def main():
    parser = argparse.ArgumentParser(description="Selector Maestro para Valencianismo Radio")
    parser.add_argument("--programa", required=True, choices=list(PROGRAMAS_CONFIG.keys()), help="Nombre del programa")
    parser.add_argument("--bloque", type=int, choices=[1, 2, 3], help="Forzar bloque para Ateneo")
    args = parser.parse_args()

    prog_id = args.programa
    config = PROGRAMAS_CONFIG[prog_id]
    prog_dir = os.path.join(BASE_PATH, config["dir"])
    
    if not os.path.exists(prog_dir):
        sys.stderr.write(f"Error: No existe el directorio {prog_dir}\n")
        sys.exit(1)

    archivos = obtener_archivos_mp3(prog_dir)
    if not archivos:
        sys.stderr.write(f"Error: No hay MP3s en {prog_dir}\n")
        sys.exit(1)

    selected_file = None
    log_msg = ""

    if config["modo"] == "ultimo_descargado":
        selected_file = resolver_ultimo_descargado(prog_dir, archivos)
        log_msg = f"Seleccionado último descargado: {selected_file}"

    elif config["modo"] == "ciclo_diario":
        selected_file, tipo_em = resolver_ciclo_diario(prog_dir, archivos, args.bloque)
        log_msg = f"Seleccionado Ateneo ({tipo_em}): {selected_file}"

    elif config["modo"] == "aleatorio_sin_repetir":
        selected_file = resolver_aleatorio_sin_repetir(prog_dir, archivos)
        log_msg = f"Seleccionado aleatorio: {selected_file}"

    if not selected_file:
        sys.stderr.write("Error: No se pudo seleccionar ningún archivo.\n")
        sys.exit(1)

    # 1. Preparar la carpeta de seleccion
    seleccion_dir = os.path.join(prog_dir, "seleccion")
    os.makedirs(seleccion_dir, exist_ok=True)
    
    # 2. Limpiar archivos antiguos en seleccion (excepto ultimo_programa.json que se sobreescribe)
    for f in glob.glob(os.path.join(seleccion_dir, "*")):
        try:
            if os.path.basename(f) != "ultimo_programa.json":
                os.remove(f)
        except Exception as e:
            sys.stderr.write(f"Error limpiando archivo viejo en seleccion: {e}\n")

    # 3. Copiar el MP3 seleccionado con timestamp para evitar cache en Liquidsoap
    timestamp = int(time.time())
    prefix = "pildora" if prog_id == "juan_y_patri" else "programa"
    dest_mp3 = os.path.join(seleccion_dir, f"{prefix}_{timestamp}.mp3")
    src_mp3 = os.path.join(prog_dir, selected_file)
    
    try:
        shutil.copy2(src_mp3, dest_mp3)
    except Exception as e:
        sys.stderr.write(f"Error copiando MP3 a seleccion: {e}\n")
        sys.exit(1)

    # 4. Actualizar metadatos JSON para la compatibilidad de la web
    is_pildora = (prog_id == "juan_y_patri")
    actualizar_ultimo_programa_json(prog_dir, selected_file, is_pildora)

    # 5. Registrar en el log del programa
    registrar_log(prog_dir, log_msg)

    # 6. Enviar aviso por Nostr si está configurado
    if config["nostr_aviso"]:
        enviar_aviso_nostr(config["nostr_aviso"])

    # 7. Sincronizar selección con el VPS (Solo si estamos en local y existe la clave SSH)
    if not IS_VPS:
        SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_vps_sync")
        if os.path.exists(SSH_KEY_PATH):
            RSYNC_TARGETS = [
                {"target": f"debian@51.38.236.161:/opt/v0l0v/apps/radiovalencianismo/{config['dir']}/seleccion/", "port": 5122},
                {"target": f"debian@54.36.100.247:/home/debian/radiovalencianismo/{config['dir']}/seleccion/", "port": 22}
            ]
            for target_info in RSYNC_TARGETS:
                target = target_info["target"]
                port = target_info["port"]
                try:
                    print(f"📤 Sincronizando selección de {prog_id} a {target} en puerto {port}...")
                    rsync_cmd = ["rsync", "-avz", "--delete", "--exclude=*.txt", "-e", f"ssh -i {SSH_KEY_PATH} -p {port} -o StrictHostKeyChecking=no", seleccion_dir + "/", target]
                    import subprocess
                    subprocess.run(rsync_cmd, check=True)
                except Exception as rse:
                    sys.stderr.write(f"⚠️ Error al sincronizar selección de {prog_id} a {target}: {rse}\n")

    # Imprimir por stdout la ruta del archivo copiado (por si se necesita)
    print(dest_mp3)

if __name__ == "__main__":
    main()
