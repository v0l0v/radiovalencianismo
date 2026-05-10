import feedparser
import json
import os
import random
import re

# Configuración
FEEDS_FILE = "feeds.txt"
OUTPUT_FILE = "noticias_flash.json"

def limpiar_texto(texto):
    # Eliminar HTML y URLs
    texto = re.sub(r'<[^>]+>', '', texto)
    texto = re.sub(r'http\S+', '', texto)
    return texto.strip()

def obtener_noticias():
    if not os.path.exists(FEEDS_FILE):
        print(f"❌ No se encuentra {FEEDS_FILE}")
        return []

    with open(FEEDS_FILE, 'r') as f:
        urls = [line.strip() for line in f if line.strip()]

    todas_las_noticias = []
    
    for url in urls:
        print(f"📡 Leyendo feed: {url}")
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:5]: # 5 por feed
                todas_las_noticias.append({
                    "titulo": limpiar_texto(entry.title),
                    "fuente": feed.feed.title if 'title' in feed.feed else url,
                    "link": entry.link
                })
        except Exception as e:
            print(f"⚠️ Error en {url}: {e}")

    # Mezclar y devolver las 10 mejores
    random.shuffle(todas_las_noticias)
    return todas_las_noticias[:10]

if __name__ == "__main__":
    print("🚀 Generando Noticiero Flash...")
    noticias = obtener_noticias()
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(noticias, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Noticiero generado en {OUTPUT_FILE}")
