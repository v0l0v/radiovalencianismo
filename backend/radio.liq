# Configuracion basica de Liquidsoap para Radio Valencianismo

# Configuracion de logs para poder depurar si algo falla
set("log.file.path", "/tmp/radio.log")
set("log.stdout", true)

# 1. Fuente 1: Puerto "Harbor" para conectar BUTT en directo
# Esto abre el puerto interno 8080. BUTT se conectará aquí con el password "hackme"
live = input.harbor("live", port=8080, password="hackme")

# 2. Fuente 2: Carpeta de música MP3 (AutoDJ)
# Reproduce los archivos en bucle aleatorio
playlist = playlist(mode="random", "/mp3")

# 3. Logica de Fallback
# Si entra audio por el puerto 8080 (live), la lista de reproduccion se corta
# 'track_sensitive=false' significa que# Creamos la radio con fallback (si entra el directo, corta la música)
# mksafe asegura que la radio nunca se apague si no hay archivos
radio = mksafe(fallback(track_sensitive=false, [live, playlist]))

# 4. Salida hacia Icecast
# Mandamos la señal resultante (radio) a nuestro contenedor de icecast en el puerto 8000
output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", description="Emisión 24/7",
  radio)
