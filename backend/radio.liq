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

# 2. Lógica de Audio (AutoDJ)
radio = fallback(track_sensitive=false, [
  live, 
  emergencia, 
  musica_normal
])
radio = mksafe(radio)

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
