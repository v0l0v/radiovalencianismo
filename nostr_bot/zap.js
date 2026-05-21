import WebSocket from 'ws';
Object.assign(global, { WebSocket });

import dotenv from 'dotenv';
import { getPublicKey, nip19, finalizeEvent } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';
import { webln } from '@getalby/sdk';

dotenv.config();

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social'
];

async function fetchUserMetadata(pubkeyHex) {
    console.log('Buscant el perfil (kind 0) en la ret Nostr...');
    for (const url of RELAYS) {
        try {
            const relay = await Relay.connect(url);
            return new Promise((resolve) => {
                const sub = relay.subscribe([
                    { kinds: [0], authors: [pubkeyHex], limit: 1 }
                ], {
                    onevent(event) {
                        relay.close();
                        resolve(JSON.parse(event.content));
                    },
                    oneose() {
                        relay.close();
                        resolve(null);
                    }
                });
                setTimeout(() => { relay.close(); resolve(null); }, 3000);
            });
        } catch (e) {
            continue;
        }
    }
    return null;
}

async function sendZap(targetNpub, amountSats, message) {
    const rawPrivKey = process.env.PRIVATE_KEY;
    const nwcUri = process.env.NWC_URI;

    if (!rawPrivKey || !nwcUri) {
        console.error('❌ ERROR: Falten les claus PRIVATE_KEY o NWC_URI en el archiu .env');
        return;
    }

    let privKeyBytes;
    try {
        if (rawPrivKey.startsWith('nsec')) {
            let { type, data } = nip19.decode(rawPrivKey);
            privKeyBytes = data;
        } else {
            privKeyBytes = Uint8Array.from(Buffer.from(rawPrivKey, 'hex'));
        }
    } catch (e) {
        console.error('❌ ERROR: La clau privada no és vàlida.');
        return;
    }

    const pubKey = getPublicKey(privKeyBytes);
    let targetPubkeyHex;
    try {
        const { type, data } = nip19.decode(targetNpub);
        if (type !== 'npub') throw new Error();
        targetPubkeyHex = data;
    } catch (e) {
        console.error('❌ ERROR: El npub de destí no és vàlit.');
        return;
    }

    console.log(`⚡ Iniciant el procés de ZAP per a ${targetNpub}`);
    console.log(`💰 Quantitat: ${amountSats} sats | Missage: "${message}"`);

    // 1. Obtindre perfil de l'usuari
    const profile = await fetchUserMetadata(targetPubkeyHex);
    if (!profile || !profile.lud16) {
        console.error('❌ ERROR: L\'usuari no té configurada una Lightning Address (lud16) en el seu perfil.');
        return;
    }

    const lud16 = profile.lud16;
    console.log(`✅ Adreça Lightning trobada: ${lud16}`);

    // 2. Obtindre dades del servidor LNURL
    const [name, domain] = lud16.split('@');
    const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${name}`;
    
    let lnurlpData;
    try {
        const res = await fetch(lnurlpUrl);
        lnurlpData = await res.json();
    } catch (e) {
        console.error(`❌ ERROR: No s'ha pogut connectar en el servidor de ${domain}`);
        return;
    }

    if (!lnurlpData.allowsNostr || !lnurlpData.nostrPubkey) {
        console.error('❌ ERROR: El proveïdor Lightning no suporta Zaps de Nostr.');
        return;
    }

    // 3. Crear el Zap Request (kind 9734)
    const amountMillisats = amountSats * 1000;
    const zapRequestEvent = {
        kind: 9734,
        created_at: Math.floor(Date.now() / 1000),
        content: message,
        tags: [
            ['relays', ...RELAYS],
            ['amount', amountMillisats.toString()],
            ['p', targetPubkeyHex]
        ]
    };

    const signedZapRequest = finalizeEvent(zapRequestEvent, privKeyBytes);

    // 4. Demanar la factura (Invoice)
    console.log('🔄 Solicitant factura...');
    const callbackUrl = new URL(lnurlpData.callback);
    callbackUrl.searchParams.append('amount', amountMillisats.toString());
    callbackUrl.searchParams.append('nostr', JSON.stringify(signedZapRequest));

    let invoice;
    try {
        const res = await fetch(callbackUrl.toString());
        const data = await res.json();
        if (data.status === 'ERROR') throw new Error(data.reason);
        invoice = data.pr;
        console.log('✅ Factura obtinguda.');
    } catch (e) {
        console.error('❌ ERROR al generar la factura:', e.message);
        return;
    }

    // 5. Pagar la factura utilisants NWC
    console.log('💸 Pagant factura en NWC...');
    try {
        const nwc = new webln.NWC({ nostrWalletConnectUrl: nwcUri });
        await nwc.enable();
        const response = await nwc.sendPayment(invoice);
        console.log(`🎉 ZAP enviat en èxit! Preimage: ${response.preimage}`);
        nwc.close();
    } catch (e) {
        console.error('❌ ERROR al pagar en NWC:', e.message);
    }
}

// Execució per consola: node zap.js <npub_desti> <sats> <missage>
const target = process.argv[2];
const sats = parseInt(process.argv[3]) || 21;
const msg = process.argv[4] || "Benvingut/da des de Valencianismo Radio!";

if (!target) {
    console.log('Instruccions d\'ús: node zap.js <npub_desti> <sats> <"missage">');
} else {
    sendZap(target, sats, msg);
}
