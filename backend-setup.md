# Guía de Configuración del Servidor Backend (Radio Valencianismo)

Esta guía explica cómo instalar y configurar Icecast2 y Liquidsoap en tu VPS Ubuntu (ej. en OVH / SpinupWP) para tener una radio 24/7 autónoma con posibilidad de interrumpir la emisión para hacer directos.

## 1. Instalar Icecast2

Icecast2 es el servidor de streaming.

```bash
sudo apt update
sudo apt install icecast2
```

Durante la instalación, te pedirá configurar contraseñas. Anota la contraseña de "source" (fuente), "relay" y "admin".
Por defecto, editarás la configuración en `/etc/icecast2/icecast.xml`.

Inicia el servicio:
```bash
sudo systemctl enable icecast2
sudo systemctl start icecast2
```

## 2. Instalar Liquidsoap (AutoDJ)

Liquidsoap es un lenguaje potente para flujos de audio que nos servirá como AutoDJ y para gestionar la conmutación entre la lista de reproducción (AutoDJ) y los directos (Micrófono).

```bash
sudo apt install liquidsoap
```

Crea un archivo de configuración para la radio, por ejemplo `/etc/liquidsoap/radio.liq`:

```liquidsoap
# Nivel de log
set("log.file.path", "/var/log/liquidsoap/radio.log")

# 1. Fuente 1: Emisión en directo (Icecast mount /live)
live = input.harbor("live", port=8080, password="TU_PASSWORD_AQUI")

# 2. Fuente 2: AutoDJ (Lista de reproducción en bucle)
# Pon tus MP3 en esta carpeta
playlist = playlist("/var/www/radio/mp3")

# 3. Fallback: Si alguien se conecta a /live, se corta el AutoDJ suavemente y entra el directo.
# track_sensitive=false permite cortar a mitad de la canción.
radio = fallback(track_sensitive=false, [live, playlist])

# 4. Salida hacia Icecast (mount /stream)
output.icecast(%mp3(bitrate=128),
  host="localhost", port=8000, password="TU_PASSWORD_ICECAST",
  mount="stream", radio)
```

Inicia Liquidsoap:
```bash
sudo systemctl enable liquidsoap
sudo systemctl start liquidsoap
```

## 3. Emitir en directo (Usando BUTT)

Para hablar encima del AutoDJ cuando quieras:

1. Descarga e instala **BUTT** (Broadcast Using This Tool) en tu ordenador personal (Windows/Mac/Linux).
2. Entra en `Settings` -> `Server`.
3. Añade un nuevo servidor:
   - Type: Icecast
   - Address: La IP de tu VPS.
   - Port: `8080` (Ojo: Es el puerto del `input.harbor` de Liquidsoap, no el de Icecast).
   - Password: `TU_PASSWORD_AQUI` (La configurada en radio.liq).
   - Mount: `/live`
4. Guarda y pulsa en **Play**.
5. Liquidsoap automáticamente bajará o cortará la música del servidor y pasará tu micrófono a la emisión principal. Al desconectar, volverá la lista de reproducción.

## 4. Despliegue de la PWA (Frontend)

El código de tu web estática (las versiones 1 y 2, css, js, etc.) debes subirlo a SpinupWP en un "Site" normal de HTML estático y apuntar el dominio `valencianismo.com` hacia allí.

Luego, en `js/radio.js` del código fuente, asegúrate de cambiar la URL del stream de ZenoFM a la URL de tu nuevo servidor (por ejemplo, `https://valencianismo.com:8000/stream`).
