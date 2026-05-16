# 0. Configuración del Servidor de Control
set("server.telnet", true)
set("server.telnet.bind_addr", "0.0.0.0")
set("server.telnet.port", 1234)

# 1. Fuentes de audio
live = input.harbor("live", port=8080, password="D26VmLg3791+")
emergencia = request.queue(id="emergencia")
musica_normal = playlist(mode="randomize", reload_mode="watch", "/mp3/generico")

# Fuentes de Programas (usando carpetas de selección para control total)
# loop=false asegura que el programa suene una vez y no se repita
gotham = playlist(mode="normal", loop=false, reload_mode="watch", "/mp3/programas/gothamvcf/seleccion")
don_pio = playlist(mode="normal", loop=false, reload_mode="watch", "/mp3/programas/horaDonPio/seleccion")
ateneo = playlist(mode="normal", loop=false, reload_mode="watch", "/mp3/programas/ateneo/seleccion")
juan_y_patri = playlist(mode="normal", loop=false, reload_mode="watch", "/mp3/programas/juan_y_patri/seleccion")

# 2. Lógica de Audio (Horario Maestro con Interrupción Inmediata)

# Bloque 1: Programas y Música (Se respetan entre ellos)
# track_sensitive=true para que Gotham, Ateneo, etc. no se corten entre sí.
programas_y_musica = switch(track_sensitive=true, [
  ({ 9h30m-9h35m }, gotham),
  ({ 11h30m-11h35m }, don_pio),
  ({ 13h30m-13h35m }, ateneo),
  ({ 15h30m-15h35m }, gotham),
  ({ 17h30m-17h35m }, don_pio),
  ({ 19h30m-19h35m }, ateneo),
  ({ 21h30m-21h35m }, gotham),
  ({ 23h30m-00h35m }, ateneo),
  ({ true }, musica_normal)
])

# Bloque Final con Interrupción de Píldoras
# track_sensitive=false para que Juan y Patri corten EN SECO a las :00
radio = fallback(track_sensitive=false, [
  live,
  emergencia,
  switch([ ({ 0m-5m }, juan_y_patri) ]), # Prioridad máxima: Corte inmediato a las :00
  programas_y_musica                      # El resto de la programación
])

radio = mksafe(radio)

output.icecast(%mp3(bitrate=128),
  host="icecast", port=8000, password="hackme",
  mount="stream", name="Radio Valencianismo", 
  description="La radio del valencianismo",
  genre="Valencian Music", url="https://valencianismo.com",
  public=true,
  radio)
