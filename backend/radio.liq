# 0. Configuración del Servidor de Control
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)

# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")
emergencia = request.queue(id="emergencia")
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Programas (Quitamos loop=false para que siempre estén disponibles al llamar)
gotham = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/gothamvcf")
don_pio = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/horaDonPio")
ateneo = playlist(mode="randomize", reload_mode="watch", "/mp3/programas/ateneo")

# 2. Lógica de Parrilla
# Usamos track_sensitive=true para que los programas no se corten a mitad
# Pero usamos ventanas de tiempo cortas (0m-2m) para el disparo inicial
parrilla = switch(track_sensitive=true, [
  # 2. Ateneo (21:00)
  ({ 21h0m-21h2m }, ateneo),

  # 3. Gotham (Horas Impares) - Se dispara en el minuto 0 de la hora
  ({ (1h or 3h or 5h or 7h or 9h or 11h or 13h or 15h or 17h or 19h or 23h) and 0m-2m }, gotham),

  # 4. Don Pío (Horas Pares) - Se dispara en el minuto 0 de la hora
  ({ (0h or 2h or 4h or 6h or 8h or 10h or 12h or 14h or 16h or 18h or 20h or 22h) and 0m-2m }, don_pio),
  
  # 5. Por defecto AutoDJ
  ({ true }, musica_normal)
])

# 3. Mezcla final y Salida
# Las emergencias y el Live tienen prioridad absoluta e interrumpen (track_sensitive=false)
radio = fallback(track_sensitive=false, [live, emergencia, parrilla])
radio = mksafe(radio)

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
