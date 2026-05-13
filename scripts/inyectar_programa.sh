#!/bin/bash

# Configuración
LSO_HOST="127.0.0.1"
LSO_PORT="1234"
BASE_PATH="/mp3/programas" # Ruta interna del contenedor

PROGRAMA=$1

if [ -z "$PROGRAMA" ]; then
    echo "Uso: $0 [gotham|donpio|ateneo]"
    exit 1
fi

case $PROGRAMA in
    gotham)
        # Buscar el único mp3 en la carpeta de gotham
        ARCHIVO=$(ls /home/debian/radiovalencianismo/backend/mp3/programas/gothamvcf/*.mp3 | head -n 1)
        INTERNAL_PATH="/mp3/programas/gothamvcf/$(basename "$ARCHIVO")"
        ;;
    donpio)
        # Ejecutar el selector primero para que elija uno nuevo
        /home/debian/radiovalencianismo/scripts/selector_don_pio.sh
        # El selector deja un link en 'seleccion'. Buscamos ese archivo.
        ARCHIVO=$(ls /home/debian/radiovalencianismo/backend/mp3/programas/horaDonPio/seleccion/*.mp3 | head -n 1)
        INTERNAL_PATH="/mp3/programas/horaDonPio/seleccion/$(basename "$ARCHIVO")"
        ;;
    ateneo)
        ARCHIVO=$(ls /home/debian/radiovalencianismo/backend/mp3/programas/ateneo/*.mp3 | head -n 1)
        INTERNAL_PATH="/mp3/programas/ateneo/$(basename "$ARCHIVO")"
        ;;
    *)
        echo "Programa no reconocido."
        exit 1
        ;;
esac

if [ -z "$ARCHIVO" ]; then
    echo "No se encontró ningún archivo para $PROGRAMA"
    exit 1
fi

echo "Inyectando programa: $INTERNAL_PATH"

# Comando vía Perl (mensajero telnet) para inyectar y saltar la canción actual
docker exec liquidsoap perl -e 'use IO::Socket; my $s = IO::Socket::INET->new(PeerAddr => "localhost", PeerPort => 1234) or die "Socket error"; print $s "emergencia.push '"$INTERNAL_PATH"'\nexit\n"; close($s);'

# Forzar el salto de la canción actual para que el programa entre YA
# Enviamos skip a musica_normal para que Liquidsoap pase a la siguiente fuente de prioridad (emergencia)
docker exec liquidsoap perl -e 'use IO::Socket; my $s = IO::Socket::INET->new(PeerAddr => "localhost", PeerPort => 1234) or die "Socket error"; print $s "musica_normal.skip\nexit\n"; close($s);'

echo "✅ Inyección completada. El programa comienza INMEDIATAMENTE."
