import socket
import time
import os
import sys

# Configuración
LIQUIDSOAP_HOST = "localhost"
LIQUIDSOAP_PORT = 1234
CUNA_PATH = "/mp3/alertas/gotham_urgente.mp3"
ESPERA_MINUTOS = 5

def enviar_comando(comando):
    try:
        with socket.create_connection((LIQUIDSOAP_HOST, LIQUIDSOAP_PORT), timeout=5) as s:
            s.sendall(f"{comando}\n".encode())
            response = s.recv(4096).decode()
            return response
    except Exception as e:
        print(f"❌ Error conectando con Liquidsoap: {e}")
        return None

def lanzar_secuencia(audio_programa_path):
    print(f"📢 Iniciando secuencia de urgencia para: {audio_programa_path}")
    
    # 1. Lanzar la cuña de aviso inmediatamente
    print("🎙️ Inyectando cuña de aviso...")
    enviar_comando(f"emergencia.push {CUNA_PATH}")
    
    # 2. Esperar el tiempo de cortesía (5 minutos)
    # Podríamos esperar 5 minutos reales, o simplemente dejar que suenen 2-3 canciones.
    # Para ser exactos con lo que pides, esperamos 5 minutos.
    print(f"⏳ Esperando {ESPERA_MINUTOS} minutos de expectación...")
    # Nota: Durante este tiempo la radio sigue con su música normal
    time.sleep(ESPERA_MINUTOS * 60)
    
    # 3. Lanzar el programa de Gotham
    print("🚀 ¡Lanzando Gotham VCF!")
    enviar_comando(f"emergencia.push {audio_programa_path}")
    print("✅ Secuencia completada.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 lanzar_gotham_urgente.py /ruta/al/audio.mp3")
        sys.exit(1)
    
    archivo_programa = sys.argv[1]
    lanzar_secuencia(archivo_programa)
