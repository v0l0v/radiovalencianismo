# 0. Configuración del Servidor de Control
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)

# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")
emergencia = request.queue(id="emergencia")
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Programas
gotham = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/gothamvcf")
don_pio = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/horaDonPio/seleccion")
ateneo = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/ateneo")
juan_y_patri = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/juan_y_patri/seleccion")

# 2. Lógica de Audio (Horarios)
# Bloque de programas con horario fijo
programas_con_horario = switch([
  ({ 09h00-10h00 }, juan_y_patri),
  ({ 15h00-16h00 }, juan_y_patri),
  ({ 21h00-22h00 }, juan_y_patri),
  # La Hora Don Pío (Bloques impares por ejemplo)
  ({ 11h00-12h00 or 13h00-14h00 or 17h00-18h00 or 19h00-20h00 or 23h00-00h00 }, don_pio)
])

radio = fallback(track_sensitive=false, [
  live, 
  emergencia, 
  programas_con_horario, # Prioridad a programas sobre la música
  musica_normal          # Música genérica de fondo
])
radio = mksafe(radio)

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
