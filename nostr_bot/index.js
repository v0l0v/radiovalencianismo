require('websocket-polyfill');
const dotenv = require('dotenv');
const { getPublicKey, nip19, finalizeEvent, verifyEvent } = require('nostr-tools');
const { Relay } = require('nostr-tools/relay');

// Cargar variables de entorno (el archivo .env)
dotenv.config();

// Configuración inicial
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social'
];

async function publishMessage(message) {
    const rawPrivKey = process.env.PRIVATE_KEY;
    if (!rawPrivKey || rawPrivKey === 'aqui_tu_llave_privada_hex_o_nsec') {
        console.error('❌ ERROR: No has configurado tu llave privada en el archivo .env');
        return;
    }

    // Convertir la llave si empieza por nsec
    let privKeyBytes;
    try {
        if (rawPrivKey.startsWith('nsec')) {
            let { type, data } = nip19.decode(rawPrivKey);
            if (type !== 'nsec') throw new Error('No es un nsec válido');
            privKeyBytes = data;
        } else {
            // Se asume Hex string
            privKeyBytes = Uint8Array.from(Buffer.from(rawPrivKey, 'hex'));
        }
    } catch (e) {
        console.error('❌ ERROR: La llave privada no es válida.', e.message);
        return;
    }

    const pubKey = getPublicKey(privKeyBytes);
    console.log(`🤖 Iniciando Bot Nostr... PublicKey: ${nip19.npubEncode(pubKey)}`);
    console.log(`📡 Mensaje a publicar: "${message}"`);

    // Crear y firmar el evento (Tipo 1: Nota de texto corta)
    const eventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: message,
    };

    const signedEvent = finalizeEvent(eventTemplate, privKeyBytes);
    const isGood = verifyEvent(signedEvent);
    if (!isGood) {
        console.error('❌ ERROR: Firma del evento inválida.');
        return;
    }

    // Conectar a los relays y publicar
    for (const url of RELAYS) {
        try {
            console.log(`⏳ Conectando a ${url}...`);
            const relay = await Relay.connect(url);
            console.log(`✅ Conectado a ${url}. Publicando...`);
            
            await relay.publish(signedEvent);
            console.log(`🚀 Mensaje publicado con éxito en ${url}`);
            
            relay.close();
        } catch (error) {
            console.error(`⚠️ Fallo al publicar en ${url}:`, error.message);
        }
    }
    console.log('🏁 Proceso finalizado.');
}

// Ejecución
const msgArg = process.argv[2] || "📻 Probant el sistema automatitzat de Valencianismo Radio en Nostr. Això és una prova de connexió.";
publishMessage(msgArg);
