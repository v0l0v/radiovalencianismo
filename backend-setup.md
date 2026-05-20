# Guía de Configuración del Servidor Backend (Valencianismo Radio)

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

## 4. Despliegue de la PWA (Frontend) con Docker

Ya que tu servidor cuenta con **Docker y Docker Compose**, no necesitas instalar nada en el sistema. Puedes levantar la web de forma limpia con el archivo `docker-compose.yml` incluido en este repositorio.

Pasos para levantar la web en tu servidor:

1. Entra por SSH a tu servidor: `ssh debian@54.36.100.247`
2. Clona el repositorio:
   ```bash
   git clone https://github.com/v0l0v/radiovalencianismo.git
   cd radiovalencianismo
   ```
3. Levanta el servidor web con Docker en segundo plano:
   ```bash
   sudo docker compose up -d
   ```

A partir de este momento, si visitas `http://54.36.100.247` en tu navegador, verás la web funcionando perfectamente.

> **Nota para el futuro (Backend Completo con Docker):**
> Si más adelante quieres pasar Icecast y Liquidsoap también a Docker para no tener que usar `apt install`, el archivo `docker-compose.yml` se puede ampliar fácilmente añadiendo los servicios de `icecast` y `liquidsoap`.
