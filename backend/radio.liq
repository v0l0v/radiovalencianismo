# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")

# AutoDJ principal (música de todo el día)
# Sugerencia: pon tu música normal en /mp3/generico
musica_normal = playlist(mode="randomize", "/mp3/generico")

# Programa "Veinte Horas" (suena a las 20:00)
# Pon los archivos en /mp3/programas/veinte-horas
# loop=false hace que suene una vez y luego pase a la siguiente fuente
veinte_horas = playlist(mode="randomize", loop=false, "/mp3/programas/veinte-horas")

# 2. Programación de la Parrilla
parrilla = switch(track_sensitive=false, [
  # Si son entre las 20:00 y las 21:00, suena el programa.
  # Al tener loop=false, si termina antes de las 21:00, saltará al AutoDJ automáticamente.
  ({ 19h52-21h00 }, veinte_horas),
  
  # Por defecto (siempre que no haya un programa especial), suena la música normal.
  ({ true }, musica_normal)
])

# 3. Mezcla final y Salida
# Prioridad absoluta al directo, luego a la parrilla programada.
radio = mksafe(fallback(track_sensitive=false, [live, parrilla]))

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="Noticiero y Agenda de eventos de Radio Valencianismo",
  genre="News, Talk, Society", url="https://valencianismo.com",
  public=true,
  radio)
