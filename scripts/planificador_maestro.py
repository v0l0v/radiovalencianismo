#!/usr/bin/env python3
"""
Planificador Maestro — Valencianismo Radio
Este script corre cada minuto en el cron del sistema VPS.
Comprueba el archivo 'programacion.json' para ver qué programas deben emitirse próximamente.
Si coincide que faltan 'minutos_antes' (normalmente 5 minutos) para la hora de emisión de un programa,
ejecuta automáticamente 'selector_maestro.py' para dicho programa.
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta

# Detección de entorno
VPS_BASE_PATH = "/home/debian/radiovalencianismo"
LOCAL_BASE_PATH = "/home/victor/proyectos/RadioValencianismomasmas"

if os.path.exists(VPS_BASE_PATH):
    BASE_PATH = VPS_BASE_PATH
else:
    BASE_PATH = LOCAL_BASE_PATH

CONFIG_FILE = os.path.join(BASE_PATH, "scripts/programacion.json")
SELECTOR_SCRIPT = os.path.join(BASE_PATH, "scripts/selector_maestro.py")

def main():
    if not os.path.exists(CONFIG_FILE):
        sys.stderr.write(f"Error: No existe el archivo de configuración {CONFIG_FILE}\n")
        sys.exit(1)
        
    try:
        with open(CONFIG_FILE, "r") as f:
            programacion = json.load(f)
    except Exception as e:
        sys.stderr.write(f"Error leyendo {CONFIG_FILE}: {e}\n")
        sys.exit(1)

    ahora = datetime.now()
    
    # Comprobar todos los programas configurados
    for prog in programacion:
        programa_id = prog["programa"]
        minutos_antes = prog.get("minutos_antes", 5)
        
        for hora_emision_str in prog["horas"]:
            try:
                # Parsear hora de emisión
                emision_t = datetime.strptime(hora_emision_str, "%H:%M")
                
                # Ajustar la fecha a hoy
                emision_hoy = ahora.replace(hour=emision_t.hour, minute=emision_t.minute, second=0, microsecond=0)
                
                # Calcular el momento exacto en el que debe dispararse el script selector
                disparo_dt = emision_hoy - timedelta(minutes=minutos_antes)
                
                # Comprobar si coincide con el minuto actual (hora y minuto)
                if ahora.hour == disparo_dt.hour and ahora.minute == disparo_dt.minute:
                    print(f"⏰ [{ahora.strftime('%Y-%m-%d %H:%M:%S')}] Disparando selector para '{programa_id}' (Emisión programada a las {hora_emision_str})")
                    
                    # Llamar al selector maestro
                    cmd = f"python3 {SELECTOR_SCRIPT} --programa {programa_id}"
                    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
                    
                    if result.returncode == 0:
                        print(f"✅ Selector ejecutado con éxito. Output: {result.stdout.strip()}")
                    else:
                        sys.stderr.write(f"❌ Error ejecutando selector para {programa_id}: {result.stderr}\n")
                        
            except Exception as ex:
                sys.stderr.write(f"Error procesando horario {hora_emision_str} para {programa_id}: {ex}\n")

if __name__ == "__main__":
    main()
