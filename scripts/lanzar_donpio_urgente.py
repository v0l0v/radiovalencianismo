import socket
import os
import sys

# Configuración
PROGRAMA_FOLDER_LOCAL = "/home/debian/radiovalencianismo/backend/mp3/programas/horaDonPio/"
PROGRAMA_FOLDER_REMOTO = "/home/debian/radiovalencianismo/backend/mp3/programas/horaDonPio/"
VPS_IP = "100.79.188.3"
LIQUIDSOAP_PORT = 1234

def obtener_ultimo_audio():
    # 1. Intentar localmente primero (si estamos en el VPS)
    import glob
    # Buscamos dentro de la carpeta 'actual' que es donde el selector pone el volumen vigente
    files = glob.glob(PROGRAMA_FOLDER_LOCAL + "actual/*.mp3")
    if files:
        # Ordenar por fecha de modificación
        files.sort(key=os.path.getmtime, reverse=True)
        return files[0]
    
    # 2. Si no hay archivos locales, intentar por SSH (si estamos en otro equipo)
    print("🌐 No se encontraron archivos locales en 'actual/', probando vía SSH...")
    ssh_cmd = f"ssh -o StrictHostKeyChecking=no debian@{VPS_IP} 'ls -t {PROGRAMA_FOLDER_REMOTO}actual/*.mp3 | head -1'"
    import subprocess
    result = subprocess.run(ssh_cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()
    return None

def lanzar_donpio():
    print("🎭 Buscando el último chiste de Don Pío...")
    audio_path = obtener_ultimo_audio()
    
    if not audio_path:
        print("❌ No se encontró ningún audio de Don Pío.")
        return

    # Determinar si conectamos a localhost o a la IP externa
    host = "localhost" if os.path.exists(PROGRAMA_FOLDER_LOCAL) else VPS_IP
    print(f"📡 Conectando a Liquidsoap en {host}...")

    # Convertir ruta a formato Docker
    docker_audio_path = audio_path.replace("/home/debian/radiovalencianismo/backend/mp3", "/mp3")
    
    print(f"🚀 ¡Inyectando a Don Pío!: {os.path.basename(docker_audio_path)}")
    
    res = enviar_comando_custom(host, f"emergencia.push {docker_audio_path}")
    
    if res:
        print("✅ ¡Don Pío ya está en la cola! Sonará en breve.")
    else:
        print("❌ Falló el disparo. Verifica que Liquidsoap esté corriendo.")

def enviar_comando_custom(host, comando):
    try:
        with socket.create_connection((host, LIQUIDSOAP_PORT), timeout=5) as s:
            s.sendall(f"{comando}\n".encode())
            return s.recv(4096).decode()
    except:
        return None

if __name__ == "__main__":
    lanzar_donpio()
