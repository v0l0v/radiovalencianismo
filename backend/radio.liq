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

# 2. Lógica de Parrilla (Nuevos Horarios)
parrilla = switch(track_sensitive=true, [
  # Ateneo (00:00)
  ({ 0h0m-0h2m }, ateneo),

  # Gotham VCF (10:00, 16:00, 22:00)
  ({ (10h or 16h or 22h) and 0m-2m }, gotham),

  # Don Pío (08:00, 14:00, 20:00)
  ({ (8h or 14h or 20h) and 0m-2m }, don_pio),
  
  # Por defecto AutoDJ
  ({ true }, musica_normal)
])

# 3. Mezcla final y Salida
radio = fallback(track_sensitive=false, [live, emergencia, parrilla])
radio = mksafe(radio)

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
