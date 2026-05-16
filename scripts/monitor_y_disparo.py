import requests
import os
import subprocess
import time
import xml.etree.ElementTree as ET

# Configuración de programas a vigilar
PROGRAMAS = [
    {"feed": "gothamvcf.txt", "id_file": "scripts/ultimo_id_gotham.txt"},
    {"feed": "ateneo.txt", "id_file": "scripts/ultimo_id_ateneo.txt"}
]

def comprobar_y_disparar(prog):
    # Obtener la ruta base (un nivel arriba de 'scripts')
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    feed_path = os.path.join(base_path, prog["feed"])
    ultimo_id_path = os.path.join(base_path, prog["id_file"])

    if not os.path.exists(feed_path):
        print(f"❌ Error: No se encuentra el archivo de feed en {feed_path}")
        return

    with open(feed_path, 'r') as f:
        feed_url = f.read().strip()

    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Comprobando {prog['feed']}: {feed_url}")
    
    try:
        response = requests.get(feed_url, timeout=30)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        
        # En RSS standard, el primer <item> es el más reciente
        first_item = root.find('.//item')
        if first_item is None:
            print(f"⚠️ No se encontraron items en el feed {prog['feed']}.")
            return
            
        # Usamos el link o el guid como ID único
        id_nuevo = first_item.find('link').text or first_item.find('guid').text
        titulo = first_item.find('title').text
        
        if not id_nuevo:
            print(f"⚠️ No se pudo extraer un ID válido de {prog['feed']}.")
            return

        # Leer último ID procesado
        ultimo_id = ""
        if os.path.exists(ultimo_id_path):
            with open(ultimo_id_path, 'r') as f:
                ultimo_id = f.read().strip()

        if id_nuevo != ultimo_id:
            print(f"🚀 ¡Novedad en {prog['feed']}! '{titulo}'")
            script_descarga = os.path.join(base_path, "scripts", "youtube_to_mp3.py")
            comando = f'python3 {script_descarga} {prog["feed"]}'
            
            try:
                print(f"📥 Iniciando descarga y procesamiento local...")
                subprocess.run(comando, shell=True, check=True, cwd=base_path)
                
                with open(ultimo_id_path, 'w') as f:
                    f.write(id_nuevo)
                print(f"✅ {prog['feed']} actualizado correctamente.")
            except subprocess.CalledProcessError as e:
                print(f"❌ Error al procesar {prog['feed']}: {e}")
        else:
            print(f"😴 {prog['feed']} al día.")

    except Exception as e:
        print(f"❌ Error al procesar el feed {prog['feed']}: {e}")

if __name__ == "__main__":
    for p in PROGRAMAS:
        comprobar_y_disparar(p)

