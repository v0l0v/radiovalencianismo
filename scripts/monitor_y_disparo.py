import requests
import os
import subprocess
import time
import xml.etree.ElementTree as ET

# Configuración
FEED_FILE = "gothamvcf.txt"  # Archivo que contiene la URL del feed
ULTIMO_ID_FILE = "scripts/ultimo_id_gotham.txt"
REMOTE_USER = "operador_ia"
REMOTE_HOST = "100.96.253.125"
REMOTE_SCRIPT = "/home/operador_ia/proyectos/rvalencianismo/scripts/youtube_to_mp3.py"

def comprobar_y_disparar():
    # Obtener la ruta base (un nivel arriba de 'scripts')
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    feed_path = os.path.join(base_path, FEED_FILE)
    ultimo_id_path = os.path.join(base_path, ULTIMO_ID_FILE)

    if not os.path.exists(feed_path):
        print(f"❌ Error: No se encuentra el archivo de feed en {feed_path}")
        return

    with open(feed_path, 'r') as f:
        feed_url = f.read().strip()

    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Comprobando feed: {feed_url}")
    
    try:
        response = requests.get(feed_url, timeout=30)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        
        # En RSS standard, el primer <item> es el más reciente
        first_item = root.find('.//item')
        if first_item is None:
            print("⚠️ No se encontraron items en el feed.")
            return
            
        # Usamos el link o el guid como ID único
        id_nuevo = first_item.find('link').text or first_item.find('guid').text
        titulo = first_item.find('title').text
        
        if not id_nuevo:
            print("⚠️ No se pudo extraer un ID válido del primer item.")
            return

        # Leer último ID procesado
        if os.path.exists(ultimo_id_path):
            with open(ultimo_id_path, 'r') as f:
                ultimo_id = f.read().strip()
        else:
            ultimo_id = ""

        if id_nuevo != ultimo_id:
            print(f"🚀 ¡Nuevo audio detectado! '{titulo}'")
            print(f"ID: {id_nuevo}")
            print(f"Avisando a lamaquina ({REMOTE_HOST})...")
            
            # Comando SSH para disparar la descarga en el worker
            # Pasamos el nombre del archivo de feed para que el worker sepa qué bajar
            comando = f'ssh {REMOTE_USER}@{REMOTE_HOST} "python3 {REMOTE_SCRIPT} {FEED_FILE}"'
            
            try:
                subprocess.run(comando, shell=True, check=True)
                with open(ultimo_id_path, 'w') as f:
                    f.write(id_nuevo)
                print("✅ Orden enviada y registro actualizado.")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error al enviar la orden por SSH: {e}")
        else:
            print("😴 No hay novedades. Todo al día.")

    except Exception as e:
        print(f"❌ Error al procesar el feed: {e}")

if __name__ == "__main__":
    comprobar_y_disparar()
