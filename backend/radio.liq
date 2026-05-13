# 0. Configuración del Servidor de Control
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)

# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")
emergencia = request.queue(id="emergencia")
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Programas con loop=false
gotham = playlist(loop=false, mode="randomize", reload_mode="watch", "/mp3/programas/gothamvcf")
don_pio = playlist(loop=false, mode="randomize", reload_mode="watch", "/mp3/programas/horaDonPio")
ateneo = playlist(loop=false, mode="randomize", reload_mode="watch", "/mp3/programas/ateneo")

# 2. Lógica de Parrilla
parrilla = switch(track_sensitive=false, [
  # 1. Emergencias
  ({ not list.is_empty(emergencia.queue()) }, emergencia),

  # 2. Ateneo (21:00)
  ({ 21h }, ateneo),

  # 3. Gotham (Horas Impares excepto 21h)
  ({ 1h or 3h or 5h or 7h or 9h or 11h or 13h or 15h or 17h or 19h or 23h }, gotham),

  # 4. Don Pío (Horas Pares)
  ({ 0h or 2h or 4h or 6h or 8h or 10h or 12h or 14h or 16h or 18h or 20h or 22h }, don_pio),
  
  # 5. Por defecto AutoDJ
  ({ true }, musica_normal)
])

# 3. Mezcla final y Salida
radio = mksafe(fallback(track_sensitive=false, [live, parrilla]))

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
