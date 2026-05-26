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
        
        # En RSS standard, el primer <item> es el más reciente, en Atom es <entry>
        # YouTube usa Atom, que tiene namespaces en la etiqueta o se puede buscar sin namespace
        # Pero ET.fromstring con namespaces a veces es quisquilloso. Vamos a buscar ambos ignorando namespaces si es necesario, 
        # o buscando con el namespace de Atom.
        
        # Buscar item (RSS)
        first_item = root.find('.//item')
        is_atom = False
        if first_item is None:
            # Buscar entry (Atom)
            first_item = root.find('.//{http://www.w3.org/2005/Atom}entry')
            if first_item is None:
                # Fallback sin namespace por si acaso
                first_item = root.find('.//entry')
            if first_item is not None:
                is_atom = True

        if first_item is None:
            print(f"⚠️ No se encontraron items en el feed {prog['feed']}.")
            return
            
        # Usamos el link o el guid como ID único
        if is_atom:
            # En Atom, el link está en <link href="..."> o <link>...</link>
            link_el = first_item.find('{http://www.w3.org/2005/Atom}link')
            if link_el is None:
                link_el = first_item.find('link')
                
            if link_el is not None and link_el.get('href'):
                id_nuevo = link_el.get('href')
            else:
                yt_vid = first_item.find('{http://www.youtube.com/xml/schemas/2015}videoId')
                if yt_vid is not None:
                    id_nuevo = yt_vid.text
                else:
                    id_nuevo = first_item.find('{http://www.w3.org/2005/Atom}id').text if first_item.find('{http://www.w3.org/2005/Atom}id') is not None else first_item.find('id').text
            
            titulo_el = first_item.find('{http://www.w3.org/2005/Atom}title')
            if titulo_el is None:
                titulo_el = first_item.find('title')
            titulo = titulo_el.text if titulo_el is not None else "Sin título"
        else:
            id_nuevo = first_item.find('link').text if first_item.find('link') is not None else (first_item.find('guid').text if first_item.find('guid') is not None else None)
            titulo = first_item.find('title').text if first_item.find('title') is not None else "Sin título"
        
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

