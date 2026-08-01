#!/usr/bin/env python3
"""
Selector dinámico para el programa Ateneo en Valencianismo Radio.

Aplica la siguiente lógica:
- Bloque 1 (13:30): Estreno el primer día, reposiciones los días sin novedad.
- Bloque 2 (19:30): Estreno el segundo día, reposiciones en los demás.
- Bloque 3 (23:30): Estreno el tercer día, reposiciones en los demás.

El ciclo avanza de forma diaria si no hay descargas nuevas. Si hay descarga, el ciclo se reinicia a 1.
Las reposiciones van rotando secuencialmente según la lista de MP3 ordenada por fecha.
"""

import os
import sys
import json
import time
import shutil
import glob
import argparse
from datetime import datetime

# Configurar zona horaria de Madrid para evitar desfases con el contenedor Docker de la radio
os.environ['TZ'] = 'Europe/Madrid'
time.tzset()


# Detección de entorno
script_dir = os.path.dirname(os.path.abspath(__file__))
BASE_PATH = os.path.dirname(script_dir)
IS_VPS = os.path.exists("/opt/v0l0v/apps/radiovalencianismo") or os.path.exists("/home/debian/radiovalencianismo")

ATENEO_DIR = os.path.join(BASE_PATH, "backend/mp3/programas/ateneo")
SELECCION_DIR = os.path.join(ATENEO_DIR, "seleccion")
ESTADO_FILE = os.path.join(ATENEO_DIR, "ateneo_estado.json")
LOG_FILE = os.path.join(ATENEO_DIR, "selector_log.txt")

def obtener_archivos_mp3():
    # Obtener todos los MP3 del directorio de ateneo (excluyendo subcarpetas como seleccion)
    mp3_pattern = os.path.join(ATENEO_DIR, "*.mp3")
    archivos = glob.glob(mp3_pattern)
    
    if not archivos:
        return []
        
    # Ordenar por fecha de modificación descendente (de más nuevo a más viejo)
    archivos.sort(key=os.path.getmtime, reverse=True)
    return [os.path.basename(f) for f in archivos]

def obtener_con_fallbacks(archivos, indices_deseados):
    for idx in indices_deseados:
        if idx < len(archivos):
            return archivos[idx]
    return archivos[0]

def main():
    parser = argparse.ArgumentParser(description="Selector inteligente para Ateneo")
    parser.add_argument("--bloque", type=int, choices=[1, 2, 3], help="Forzar un bloque de emisión")
    args = parser.parse_args()

    os.makedirs(SELECCION_DIR, exist_ok=True)
    
    # 1. Obtener MP3s disponibles
    archivos = obtener_archivos_mp3()
    if not archivos:
        print("❌ Error: No se encontraron archivos MP3 en el directorio de Ateneo.")
        sys.exit(1)
        
    estreno = archivos[0]
    hoy = datetime.now().strftime("%Y-%m-%d")
    
    # 2. Cargar o inicializar estado
    estado = {}
    if os.path.exists(ESTADO_FILE):
        try:
            with open(ESTADO_FILE, "r") as f:
                estado = json.load(f)
        except Exception as e:
            print(f"⚠️ Error al leer estado: {e}. Reiniciando estado.")
            
    # Comprobar si hay un estreno nuevo o si el archivo está corrupto/vacío
    if not estado or estado.get("ultimo_estreno_id") != estreno:
        print(f"🆕 Nuevo estreno detectado o estado vacío: '{estreno}'. Reiniciando ciclo a 1.")
        estado = {
            "ultimo_estreno_id": estreno,
            "dia_ciclo": 1,
            "fecha_ultimo_desplazamiento": hoy
        }
    elif estado.get("fecha_ultimo_desplazamiento") != hoy:
        # Ha cambiado el día natural y no hay un estreno nuevo, avanzamos el ciclo
        antiguo_ciclo = estado.get("dia_ciclo", 1)
        nuevo_ciclo = (antiguo_ciclo % 3) + 1
        print(f"📅 Cambio de día detectado ({estado.get('fecha_ultimo_desplazamiento')} -> {hoy}). Avanzando ciclo: {antiguo_ciclo} -> {nuevo_ciclo}.")
        estado["dia_ciclo"] = nuevo_ciclo
        estado["fecha_ultimo_desplazamiento"] = hoy

    # Guardar estado actualizado
    try:
        with open(ESTADO_FILE, "w") as f:
            json.dump(estado, f, indent=4)
    except Exception as e:
        print(f"⚠️ Error al guardar estado: {e}")

    # 3. Determinar el bloque de emisión actual
    if args.bloque:
        bloque = args.bloque
        print(f"🔧 Bloque forzado por argumento: {bloque}")
    else:
        hora = datetime.now().hour
        if 12 <= hora < 15:
            bloque = 1  # 13:30
        elif 18 <= hora < 21:
            bloque = 2  # 19:30
        elif 22 <= hora <= 23 or 0 <= hora < 1:
            bloque = 3  # 23:30
        else:
            # Fallback por si se ejecuta a otra hora (por ejemplo, tareas de mantenimiento o test)
            bloque = 1
            print(f"ℹ️ Hora actual ({hora}h) fuera de rangos de programación. Usando bloque fallback: 1")

    # 4. Aplicar lógica de asignación
    dia_ciclo = estado["dia_ciclo"]
    selected_file = None
    tipo_emision = ""

    if dia_ciclo == 1:
        if bloque == 1:
            selected_file = estreno
            tipo_emision = "Estreno (Ciclo día 1)"
        elif bloque == 2:
            selected_file = obtener_con_fallbacks(archivos, [1, 0])
            tipo_emision = "Reposición A (Ciclo día 1)"
        elif bloque == 3:
            selected_file = obtener_con_fallbacks(archivos, [2, 1, 0])
            tipo_emision = "Reposición B (Ciclo día 1)"

    elif dia_ciclo == 2:
        if bloque == 1:
            selected_file = obtener_con_fallbacks(archivos, [3, 1, 0])
            tipo_emision = "Reposición A (Ciclo día 2)"
        elif bloque == 2:
            selected_file = estreno
            tipo_emision = "Estreno (Ciclo día 2)"
        elif bloque == 3:
            selected_file = obtener_con_fallbacks(archivos, [4, 2, 1, 0])
            tipo_emision = "Reposición B (Ciclo día 2)"

    elif dia_ciclo == 3:
        if bloque == 1:
            selected_file = obtener_con_fallbacks(archivos, [5, 3, 1, 0])
            tipo_emision = "Reposición A (Ciclo día 3)"
        elif bloque == 2:
            selected_file = obtener_con_fallbacks(archivos, [6, 4, 2, 1, 0])
            tipo_emision = "Reposición B (Ciclo día 3)"
        elif bloque == 3:
            selected_file = estreno
            tipo_emision = "Estreno (Ciclo día 3)"

    print(f"📊 Ciclo Día: {dia_ciclo} | Bloque: {bloque} | Modo: {tipo_emision}")
    print(f"🎵 Archivo Seleccionado: '{selected_file}'")

    # 5. Actualizar la carpeta de selección
    # Borrar archivos antiguos en seleccion
    for f in glob.glob(os.path.join(SELECCION_DIR, "*")):
        try:
            if os.path.isdir(f):
                shutil.rmtree(f)
            else:
                os.remove(f)
        except Exception as e:
            print(f"⚠️ Error limpiando archivo de selección {f}: {e}")

    # Copiar con timestamp para evitar caché de Liquidsoap
    timestamp = int(time.time())
    src_mp3 = os.path.join(ATENEO_DIR, selected_file)
    dest_mp3 = os.path.join(SELECCION_DIR, f"programa_{timestamp}.mp3")
    
    try:
        shutil.copy2(src_mp3, dest_mp3)
        print(f"✅ Copiado a seleccion: programa_{timestamp}.mp3")
    except Exception as e:
        print(f"❌ Error copiando MP3 a seleccion: {e}")
        sys.exit(1)

    # 6. Generar JSON de metadatos para la web
    title_without_ext = os.path.splitext(selected_file)[0]
    src_json = os.path.join(ATENEO_DIR, f"{title_without_ext}.json")
    dest_json = os.path.join(SELECCION_DIR, "ultimo_programa.json")
    
    if os.path.exists(src_json):
        try:
            shutil.copy2(src_json, dest_json)
            print("✅ Metadatos copiados de archivo JSON específico.")
        except Exception as e:
            print(f"⚠️ Error al copiar JSON específico: {e}")
    else:
        # Generar fallback de JSON bien estructurado
        json_data = {
            "title": title_without_ext,
            "thumbnail": "",
            "url": "",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        try:
            with open(dest_json, "w") as f:
                json.dump(json_data, f, indent=4)
            print("✅ Metadatos autogenerados (JSON de fallback).")
        except Exception as e:
            print(f"⚠️ Error al escribir JSON de fallback: {e}")

    # 7. Registrar en el log
    log_msg = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Selección Ateneo ({tipo_emision}): {selected_file}\n"
    try:
        with open(LOG_FILE, "a") as f:
            f.write(log_msg)
    except Exception as e:
        print(f"⚠️ Error escribiendo log: {e}")


    # 9. Sincronizar selección con el VPS (Solo si estamos en local y existe la clave SSH)
    if not IS_VPS:
        SSH_KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_vps_sync")
        if os.path.exists(SSH_KEY_PATH):
            RSYNC_TARGETS = [
                {"target": "debian@51.38.236.161:/opt/v0l0v/apps/radiovalencianismo/backend/mp3/programas/ateneo/seleccion/", "port": 5122},
                {"target": "debian@54.36.100.247:/home/debian/radiovalencianismo/backend/mp3/programas/ateneo/seleccion/", "port": 22}
            ]
            for target_info in RSYNC_TARGETS:
                target = target_info["target"]
                port = target_info["port"]
                try:
                    print(f"📤 Sincronizando selección de Ateneo a {target} en puerto {port}...")
                    rsync_cmd = ["rsync", "-avz", "--delete", "--exclude=*.txt", "-e", f"ssh -i {SSH_KEY_PATH} -p {port} -o StrictHostKeyChecking=no", SELECCION_DIR + "/", target]
                    import subprocess
                    subprocess.run(rsync_cmd, check=True)
                except Exception as rse:
                    print(f"⚠️ Error al sincronizar selección a {target}: {rse}")

if __name__ == "__main__":
    main()
