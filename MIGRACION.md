# Guía de Migración y Duplicación del Servidor (Valencianismo Radio)

Este documento detalla, paso por paso, cómo exportar todo el ecosistema de **Valencianismo Radio** (Frontend, Lofi, Icecast, Liquidsoap, Piper TTS y n8n) desde tu servidor actual e importarlo/duplicarlo en un nuevo servidor VPS.

> [!TIP]
> **MIGRACIÓN AUTOMATIZADA:** Para agilizar este proceso, he creado dos scripts autoejecutables en la raíz del proyecto:
> 1. `./exportar_servidor.sh` (en el servidor de origen): Empaqueta el proyecto automáticamente, te permite elegir si incluir la música de `/mp3` y apaga ordenadamente los contenedores.
> 2. `./importar_servidor.sh` (en el nuevo servidor): Instala Docker/Compose si no existen, configura los puertos en el cortafuegos (UFW), modifica automáticamente tu dominio en el `Caddyfile` y despliega todo.
>
> Puedes seguir la guía paso a paso detallada a continuación o usar estos scripts para hacer el 90% del trabajo de forma automatizada.

---

## Índice del Contenido
1. [Estructura del Proyecto a Migrar](#1-estructura-del-proyecto-a-migrar)
2. [Paso 1: Copia de Seguridad en el Servidor de Origen (Exportar)](#2-paso-1-copia-de-seguridad-en-el-servidor-de-origen-exportar)
3. [Paso 2: Prerrequisitos en el Servidor de Destino](#3-paso-2-prerrequisitos-en-el-servidor-de-destino)
4. [Paso 3: Transferir y Descomprimir en el Nuevo Servidor](#4-paso-3-transferir-y-descomprimir-en-el-nuevo-servidor)
5. [Paso 4: Configuración de Dominios y Ajustes](#5-paso-4-configuracion-de-dominios-y-ajustes)
6. [Paso 5: Despliegue e Inicio de los Contenedores](#6-paso-5-despliegue-e-inicio-de-los-contenedores)
7. [Paso 6: Verificación y Pruebas de Funcionamiento](#7-paso-6-verificacion-y-pruebas-de-funcionamiento)

---

## 1. Estructura del Proyecto a Migrar

El ecosistema cuenta con los siguientes componentes esenciales que debemos mover:
- **Código Fuente y Assets**: Ficheros HTML, JavaScript, CSS y las imágenes optimizadas de la carpeta `/lofi` y raíz.
- **Lista de reproducción (MP3)**: Ubicada en `backend/mp3/` (Ojo: esta carpeta suele estar en `.gitignore` por su tamaño, por lo que **no se sube a GitHub** y hay que migrarla a mano).
- **Configuraciones de los servicios**:
  - `docker-compose.yml`: Define los contenedores (Caddy, Icecast, Liquidsoap, Portainer, Piper TTS y n8n).
  - `Caddyfile`: Define la configuración SSL y redirección de los dominios (`valencianismo.com`, `lofi.valencianismo.com`, etc.).
  - `backend/icecast.xml`: Configuración del servidor de streaming.
  - `backend/radio.liq`: Script que controla el reproductor automático (AutoDJ) y la conmutación al directo.
  - `.env`: Credenciales privadas para el acceso de n8n.
- **Datos persistentes (Volúmenes)**: Base de datos de n8n (`n8n_data`), Portainer (`portainer_data`), modelos descargados de Piper (`piper_data`) y configuraciones de certificados SSL de Caddy (`caddy_data`).

---

## 2. Paso 1: Copia de Seguridad en el Servidor de Origen (Exportar)

Dado que la mayor parte del código está en Git, podríamos clonarlo en el nuevo servidor, pero para **duplicar exactamente** el estado actual (incluyendo las canciones MP3 y los datos persistentes de n8n sin perder flujos de trabajo), es recomendable empaquetar el directorio actual del VPS.

### A. Detener los contenedores actuales
Para evitar corrupciones en las bases de datos de SQLite (n8n/Portainer) al hacer la copia, accede por SSH a tu servidor de origen y detén temporalmente los contenedores:
```bash
cd /home/victor/proyectos/RadioValencianismomasmas   # Ve al directorio raíz del proyecto
sudo docker compose down
```

### B. Comprimir el proyecto y sus volúmenes
Creamos un archivo comprimido que incluya el código fuente, las configuraciones, el script de Liquidsoap y, muy importante, la música local que no está en Git:
```bash
# Sube un nivel para empaquetar la carpeta completa
cd ..
tar -czvf radiovalencianismo_backup.tar.gz RadioValencianismomasmas/
```

> **Nota:** Si deseas migrar también las bases de datos internas y el historial de Portainer o n8n que residen en volúmenes gestionados por Docker (en `/var/lib/docker/volumes/`), puedes empaquetarlos también de forma opcional. Sin embargo, para n8n, lo más limpio suele ser exportar los flujos de trabajo en formato `.json` desde el panel de n8n (o usando la CLI de n8n) y volverlos a importar en el nuevo servidor para evitar arrastrar basura o incompatibilidades.

---

## 3. Paso 2: Prerrequisitos en el Servidor de Destino

Antes de importar el proyecto, prepara el nuevo servidor VPS (por ejemplo, con Ubuntu/Debian instalado limpio).

### A. Actualizar el sistema e instalar Docker y Git
Ejecuta los siguientes comandos para preparar el entorno:
```bash
sudo apt update && sudo apt upgrade -y

# Instalar dependencias necesarias
sudo apt install -y curl git tar ufw

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Añadir tu usuario al grupo docker para no requerir siempre sudo (opcional)
sudo usermod -aG docker $USER
```
*Nota: Cierra la sesión SSH y vuelve a entrar para que se aplique el permiso de docker sin sudo.*

### B. Abrir puertos necesarios en el Firewall (UFW)
Asegura los accesos necesarios para el servidor web y la transmisión remota (BUTT):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh

# Puertos web estándar (Caddy los usará para Let's Encrypt)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Puerto para BUTT (Emisión en directo a Liquidsoap)
sudo ufw allow 8080/tcp

# Puerto alternativo de Icecast (Opcional, si quieres ver el panel administrativo directo)
# sudo ufw allow 8000/tcp

# Activar el firewall
sudo ufw enable
```

### C. Configurar el DNS
Para que Caddy pueda generar y renovar los certificados SSL automáticos y gratuitos en el nuevo servidor, entra en tu proveedor de dominio (Namecheap, GoDaddy, Cloudflare, etc.) y edita los registros **A** para que apunten a la **nueva dirección IP pública** de tu nuevo servidor:
- `@` o `valencianismo.com` -> `IP_NUEVO_SERVER`
- `lofi` -> `IP_NUEVO_SERVER`
- `n8n` -> `IP_NUEVO_SERVER`
- `ai` / `ia` -> `IP_NUEVO_SERVER`
- `biblioteca` -> `IP_NUEVO_SERVER`

---

## 4. Paso 3: Transferir y Descomprimir en el Nuevo Servidor

### A. Subir el archivo de copia de seguridad al nuevo servidor
Desde tu ordenador local (o desde el servidor de origen si tiene conexión directa), utiliza `scp` o `rsync` para enviar el archivo `.tar.gz` al nuevo VPS:
```bash
scp radiovalencianismo_backup.tar.gz usuario@IP_NUEVO_SERVER:/home/usuario/
```

### B. Descomprimir el proyecto en el destino
Accede al nuevo servidor por SSH y extrae los archivos en el directorio donde quieras alojarlo (por ejemplo en `/home/usuario/proyectos/` o directamente en tu home):
```bash
mkdir -p ~/proyectos
mv ~/radiovalencianismo_backup.tar.gz ~/proyectos/
cd ~/proyectos
tar -xzvf radiovalencianismo_backup.tar.gz
cd RadioValencianismomasmas/
```

---

## 5. Paso 4: Configuración de Dominios y Ajustes

Dado que estás duplicando el proyecto, posiblemente quieras cambiar los dominios o mantener los mismos. 

### A. Modificar el Caddyfile
Abre el `Caddyfile` con tu editor preferido (ej. `nano Caddyfile`) y asegúrate de cambiar los nombres de dominio si el nuevo servidor utilizará otros diferentes. 
- Si usas los mismos dominios, asegúrate de que el DNS en el Paso 2 ya ha propagado su IP correctamente antes de arrancar Caddy.
- Si usas dominios diferentes (ej. `mi-nueva-radio.com`), reemplaza todas las menciones de `valencianismo.com` por tu nuevo dominio.

### B. Revisar el archivo de variables (.env)
Verifica que las credenciales del panel de n8n sean correctas. Si quieres cambiarlas, edita el archivo `.env`:
```env
N8N_BASIC_AUTH_USER=nuevo_usuario
N8N_BASIC_AUTH_PASSWORD=nueva_contraseña_segura
```

### C. Verificar contraseñas del flujo de Audio (Icecast/Liquidsoap)
Si quieres cambiar las contraseñas de transmisión por seguridad:
1. Abre `backend/icecast.xml` y edita la sección `<authentication>` cambiando las contraseñas de `<source-password>`, `<relay-password>` y `<admin-password>`.
2. Abre `backend/radio.liq` y actualiza:
   - La contraseña de entrada para el directo en `input.harbor`:
     ```liquidsoap
     live = input.harbor("live", port=8080, password="NUEVA_PASSWORD_DIRECTO")
     ```
   - La contraseña de salida hacia Icecast (debe coincidir con la de `<source-password>` que pusiste en `icecast.xml`):
     ```liquidsoap
     output.icecast(%mp3(bitrate=128), host="icecast", port=8000, password="NUEVA_PASSWORD_SOURCE", mount="stream", radio)
     ```

---

## 6. Paso 5: Despliegue e Inicio de los Contenedores

Una vez todo esté configurado, es el momento de levantar el sistema.

### A. Levantar la pila de contenedores
Ejecuta Docker Compose para construir e iniciar todos los servicios en segundo plano:
```bash
sudo docker compose up -d
```

Este comando descargará las imágenes de Caddy, Icecast, Liquidsoap, Portainer, Piper TTS y n8n, configurará los volúmenes persistentes y ejecutará los servicios. 

> **Tip:** La primera vez que inicie, el contenedor de **piper-tts** descargará automáticamente el modelo neural en español a través del enlace configurado en `docker-compose.yml`. Esto puede tardar un par de minutos dependiendo de la velocidad de red del servidor.

### B. Verificar que todo está corriendo
Comprueba el estado de los contenedores levantados:
```bash
sudo docker compose ps
```
Deberías ver una salida con todos los contenedores en estado `Up` (corriendo).

Si alguno falla o está en bucle de reinicio (`Restarting`), revisa los logs de ese contenedor en particular para ver qué error está dando:
```bash
sudo docker compose logs -f liquidsoap   # Para monitorizar Liquidsoap
sudo docker compose logs -f web          # Para monitorizar Caddy
```

---

## 7. Paso 6: Verificación y Pruebas de Funcionamiento

Para confirmar que la duplicación ha sido exitosa, realiza las siguientes pruebas:

### 1. Servidor Web (HTTPS)
Abre en tu navegador `https://lofi.valencianismo.com` (o el subdominio que hayas configurado en el Caddyfile).
- Debería cargar la interfaz visual Lofi con los 10 fondos de ambiente.
- Si no carga o da error SSL, comprueba con `sudo docker compose logs web` si Caddy está teniendo problemas para solicitar el certificado SSL a Let's Encrypt (suele deberse a que el dominio aún no apunta a la IP del nuevo servidor).

### 2. Emisión Automática (AutoDJ)
Cuando entras en la web y das al botón "Play", deberías empezar a oír la música de fondo que está sirviendo Liquidsoap desde la carpeta `backend/mp3`.
- Si da error al reproducir o el título de la canción se queda eternamente en "Cargando emisión...", comprueba que hay archivos `.mp3` dentro de tu directorio `backend/mp3/` y que Liquidsoap no tiene errores de sintaxis en su log.

### 3. Prueba de Conexión de Directo (BUTT)
Para comprobar que puedes emitir en directo e interrumpir al AutoDJ:
1. Abre **BUTT** en tu ordenador local.
2. Crea una conexión apuntando a la **IP del nuevo servidor** (o al dominio de streaming asignado).
3. Usa el puerto `8080` (el puerto de `input.harbor` expuesto en el `docker-compose.yml` para Liquidsoap).
4. Introduce la contraseña del directo que configuraste en `backend/radio.liq`.
5. Haz clic en "Play" en BUTT y comprueba que la música en la web se atenúa suavemente dando paso a tu micrófono.

### 4. Flujos de Automatización (n8n)
Accede a `https://n8n.valencianismo.com` (o tu subdominio configurado).
- Inicia sesión con las credenciales que definiste en tu archivo `.env`.
- Si decidiste no migrar los volúmenes SQLite y hacer una instalación limpia, tendrás que volver a importar tus Workflows. Puedes importarlos fácilmente subiendo los archivos `.json` que hayas exportado previamente de tu anterior servidor.
