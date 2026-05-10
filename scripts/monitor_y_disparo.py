import requests
import os
import subprocess
import time
import xml.etree.ElementTree as ET

# Configuración
FEED_FILE = "gothamvcf.txt"  # Archivo que contiene la URL del feed
ULTIMO_ID_FILE = "scripts/ultimo_id_gotham.txt"
# Ya no necesitamos REMOTE_HOST porque procesamos en local

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
            # Comando local para disparar la descarga en este mismo equipo
            script_descarga = os.path.join(base_path, "scripts", "youtube_to_mp3.py")
            comando = f'python3 {script_descarga} {FEED_FILE}'
            
            try:
                print(f"📥 Iniciando descarga y procesamiento local...")
                # Ejecutamos desde la raíz del proyecto para que las rutas coincidan
                subprocess.run(comando, shell=True, check=True, cwd=base_path)
                
                with open(ultimo_id_path, 'w') as f:
                    f.write(id_nuevo)
                print("✅ Proceso completado y registro actualizado.")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error en el procesamiento local: {e}")
        else:
            print("😴 No hay novedades. Todo al día.")

    except Exception as e:
        print(f"❌ Error al procesar el feed: {e}")

if __name__ == "__main__":
    comprobar_y_disparar()
