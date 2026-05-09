# 0. Configuración del Servidor de Control
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)

# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")

# Fuente para anuncios de última hora y programas urgentes
# A esta cola le enviaremos los audios desde Python
emergencia = request.queue(id="emergencia")

# AutoDJ principal (música de todo el día)
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Programa "Gotham VCF" (Solo el último descargado)
# Se emite en las horas impares y también por el canal de emergencia
gotham = playlist(mode="randomize", reload_mode="watch", loop=false, "/mp3/programas/gothamvcf")

# Programa "La Hora Don Pío" (suena a las 20:00)
don_pio = playlist(mode="randomize", reload_mode="watch", loop=false, "/mp3/programas/horaDonPio/actual")

# 2. Programación de la Parrilla
parrilla = switch(track_sensitive=false, [
  # Si hay algo en la cola de emergencia (estrenos), suena con prioridad absoluta
  ({ not list.is_empty(emergencia.queue()) }, emergencia),

  # Gotham en todas las horas impares
  ({ 1h or 3h or 5h or 7h or 9h or 11h or 13h or 15h or 17h or 19h or 21h or 23h }, gotham),

  # Si son entre las 20:00-21:00 o 00:10-01:00, suena Don Pío.
  ({ 20h00-21h00 or 00h10-01h00 }, don_pio),
  
  # Por defecto suena la música normal.
  ({ true }, musica_normal)
])

# 3. Mezcla final y Salida
# Prioridad: Directo > Emergencias/Parrilla
radio = mksafe(fallback(track_sensitive=false, [live, parrilla]))

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo, musica en lengua Valenciana, la de verdad.",
  genre="Valencian Music, Regional, Culture, News", url="https://valencianismo.com",
  public=true,
  radio)
