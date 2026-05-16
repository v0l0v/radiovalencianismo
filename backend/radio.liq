# 0. Configuración del Servidor de Control
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)

# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")
emergencia = request.queue(id="emergencia")
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Fuentes de Programas (usando carpetas de selección para control total)
gotham = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/gothamvcf/seleccion")
don_pio = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/horaDonPio/seleccion")
ateneo = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/ateneo/seleccion")
juan_y_patri = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/juan_y_patri/seleccion")

# 2. Lógica de Audio (Horario Maestro)

# Bloque de Píldoras Horarias (A las :00 de cada hora)
pildoras = switch(track_sensitive=true, [
  ({ 0m-1m }, juan_y_patri)
])

# Bloque de Programas Principales (A las :30 según horario)
# track_sensitive=true garantiza que NUNCA se corte un programa a mitad
programas = switch(track_sensitive=true, [
  ({ 09h30-10h30 }, gotham),
  ({ 11h30-12h30 }, don_pio),
  ({ 13h30-14h30 }, ateneo),
  ({ 15h30-16h30 }, gotham),
  ({ 17h30-18h30 }, don_pio),
  ({ 19h30-20h30 }, ateneo),
  ({ 21h30-22h30 }, gotham),
  ({ 23h30-00h30 }, ateneo)
])

# Mezcla Final
radio = fallback(track_sensitive=false, [
  live, 
  emergencia, 
  pildoras,   # Prioridad 1: Píldora a en punto
  programas,  # Prioridad 2: Programas a y media
  musica_normal # Prioridad 3: Música genérica todo el día
])
radio = mksafe(radio)

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
