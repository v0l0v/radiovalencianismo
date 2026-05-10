from http.server import BaseHTTPRequestHandler, HTTPServer
import os
import subprocess
import json

# CONFIGURACIÓN
AUTH_TOKEN = "VALENCIA_MAESTRO_2026" # Token de seguridad para las peticiones
PORT = 8003
SCRIPTS_DIR = "/home/debian/radiovalencianismo/scripts/"

class ControlHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/execute":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # Verificar Token
            if data.get("token") != AUTH_TOKEN:
                self.send_response(403)
                self.end_headers()
                self.wfile.write(b"No autorizado")
                return

            action = data.get("action")
            result = {"status": "error", "message": "Acción no reconocida"}

            try:
                if action == "lanzar_gotham":
                    # Buscar el último audio de Gotham
                    audio = subprocess.getoutput(f"ls -t {SCRIPTS_DIR}../backend/mp3/programas/gothamvcf/*.mp3 | head -1")
                    subprocess.Popen(["python3", os.path.join(SCRIPTS_DIR, "lanzar_gotham_urgente.py"), audio])
                    result = {"status": "success", "message": "Gotham lanzado con éxito"}
                
                elif action == "lanzar_donpio":
                    subprocess.Popen(["python3", os.path.join(SCRIPTS_DIR, "lanzar_donpio_urgente.py")])
                    result = {"status": "success", "message": "Don Pío lanzado con éxito"}
                
                elif action == "refresh_news":
                    subprocess.Popen(["python3", os.path.join(SCRIPTS_DIR, "generar_noticiero.py")])
                    result = {"status": "success", "message": "Actualizando noticias RSS..."}
                
                elif action == "get_logs":
                    logs = subprocess.getoutput(f"tail -n 20 {SCRIPTS_DIR}monitor.log")
                    result = {"status": "success", "message": logs}

            except Exception as e:
                result = {"status": "error", "message": str(e)}

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    print(f"🚀 API de Control de Radio escuchando en el puerto {PORT}...")
    httpd = HTTPServer(('0.0.0.0', PORT), ControlHandler)
    httpd.serve_forever()
