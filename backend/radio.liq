# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")

# AutoDJ principal (música de todo el día)
# Sugerencia: pon tu música normal en /mp3/generico
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Programa "La Hora Don Pío" (suena a las 20:00)
# Usaremos una carpeta 'actual' gestionada por un script para no repetir volúmenes.
don_pio = playlist(mode="randomize", reload_mode="watch", loop=false, "/mp3/programas/La hora Don Pio/actual")

# 2. Programación de la Parrilla
parrilla = switch(track_sensitive=false, [
  # Si son entre las 20:00-21:00 o 23:30-23:59, suena el programa.
  ({ 20h00-21h00 or 23h30-23h59 }, don_pio),
  
  # Por defecto (siempre que no haya un programa especial), suena la música normal.
  ({ true }, musica_normal)
])

# 3. Mezcla final y Salida
# Prioridad absoluta al directo, luego a la parrilla programada.
radio = mksafe(fallback(track_sensitive=false, [live, parrilla]))

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo, musica en lengua Valenciana, la de verdad.",
  genre="Valencian Music, Regional, Culture, News", url="https://valencianismo.com",
  public=true,
  radio)
