import requests
import os
import subprocess
import time

# Configuración
FEED_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UC..." # Reemplazar con el ID real
ULTIMO_ID_FILE = "ultimo_id_gotham.txt"
REMOTE_USER = "operador_ia"
REMOTE_HOST = "100.96.253.125"
REMOTE_SCRIPT = "/home/operador_ia/proyectos/rvalencianismo/scripts/youtube_to_mp3.py"

def comprobar_y_disparar():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Comprobando feed...")
    # Aquí iría la lógica de lectura del RSS (usando requests y xml.etree.ElementTree)
    # Si detectamos un ID nuevo:
    
    id_nuevo = "EJEMPLO_ID" # Esto vendría del RSS
    
    if os.path.exists(ULTIMO_ID_FILE):
        with open(ULTIMO_ID_FILE, 'r') as f:
            ultimo_id = f.read().strip()
    else:
        ultimo_id = ""

    if id_nuevo != ultimo_id:
        print(f"¡Nuevo audio detectado ({id_nuevo})! Avisando a lamaquina...")
        
        # Comando SSH para disparar la descarga en el worker
        comando = f'ssh {REMOTE_USER}@{REMOTE_HOST} "python3 {REMOTE_SCRIPT} gothamvcf.txt"'
        
        try:
            subprocess.run(comando, shell=True, check=True)
            with open(ULTIMO_ID_FILE, 'w') as f:
                f.write(id_nuevo)
            print("✅ Orden enviada con éxito.")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error al enviar la orden: {e}")

if __name__ == "__main__":
    comprobar_y_disparar()
