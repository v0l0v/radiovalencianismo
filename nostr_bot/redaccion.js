import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import WebSocket from 'ws';
Object.assign(global, { WebSocket });

import { getPublicKey, nip19, finalizeEvent, verifyEvent } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';

dotenv.config();

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social'
];

const PUBLISHED_FILE = path.join(process.cwd(), 'published_news.json');
const FEEDS_FILE = path.join(process.cwd(), '../feeds.txt');

// Llegim les notícies publicades prèviament per a no repetir
let publishedNews = [];
if (fs.existsSync(PUBLISHED_FILE)) {
    try {
        publishedNews = JSON.parse(fs.readFileSync(PUBLISHED_FILE, 'utf-8'));
    } catch (e) {
        console.error("❌ ERROR: No s'ha pogut llegir published_news.json");
    }
}

async function publishToNostr(message) {
    const rawPrivKey = process.env.PRIVATE_KEY;
    if (!rawPrivKey) {
        console.error('❌ ERROR: Falta PRIVATE_KEY en .env');
        return false;
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
        console.error('❌ ERROR: Clau privada invàlida.');
        return false;
    }

    const eventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: message,
    };

    const signedEvent = finalizeEvent(eventTemplate, privKeyBytes);
    let successCount = 0;

    for (const url of RELAYS) {
        try {
            const relay = await Relay.connect(url);
            await relay.publish(signedEvent);
            relay.close();
            successCount++;
        } catch (error) {
            // Silenciem l'error de conexió per a no embrutar el log
        }
    }
    return successCount > 0;
}

async function checkFeeds() {
    console.log("📰 Iniciant la Redacció: Comprovant RSS...");
    
    if (!fs.existsSync(FEEDS_FILE)) {
        console.error("❌ ERROR: No s'ha trobat el ficher feeds.txt");
        return;
    }

    const urls = fs.readFileSync(FEEDS_FILE, 'utf-8').split('\n').map(u => u.trim()).filter(u => u.length > 0);
    let newItemsFound = 0;

    for (const url of urls) {
        try {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const data = await res.json();
            
            if (data.status !== 'ok' || !data.items) continue;

            let sourceName = data.feed.title || "NOTÍCIES CV";
            sourceName = sourceName.replace(/[\-\|•].*/g, '').trim();

            // Només comprovem les últimes 3 notícies de cada font per a no saturar
            const recentItems = data.items.slice(0, 3);
            
            for (const item of recentItems) {
                const uniqueId = item.guid || item.link;
                
                // Si ya s'ha publicat, el botem
                if (publishedNews.includes(uniqueId)) continue;
                
                // Comprovem que la notícia siga recent (últimes 48 hores)
                const pubDate = new Date(item.pubDate);
                const now = new Date();
                const diffHours = (now - pubDate) / (1000 * 60 * 60);
                
                if (diffHours < 48) {
                    console.log(`\n📢 Nova notícia detectada: ${item.title}`);
                    const message = `📰 NOU COMUNICAT [${sourceName}]\n\n"${item.title}"\n\nLlig-ho sencer ací: ${item.link}\n\n#Valéncia #RACV #CulturaValenciana`;
                    
                    const success = await publishToNostr(message);
                    if (success) {
                        console.log(`✅ Publicat en Nostr: ${uniqueId}`);
                        publishedNews.push(uniqueId);
                        newItemsFound++;
                        // Esperem 5 segons entre publicacions per a evitar spam en els relays
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }
        } catch (e) {
            console.error(`⚠️ Error al comprovar ${url}: ${e.message}`);
        }
    }

    // Guardem l'archiu per a tindre memòria de lo publicat
    if (newItemsFound > 0) {
        // Mantenim només les últimes 500 notícies per a no inflar el ficher
        if (publishedNews.length > 500) {
            publishedNews = publishedNews.slice(publishedNews.length - 500);
        }
        fs.writeFileSync(PUBLISHED_FILE, JSON.stringify(publishedNews, null, 2));
        console.log(`\n🏁 S'han publicat ${newItemsFound} notícies noves.`);
    } else {
        console.log("\n🏁 No hi ha notícies noves.");
    }
}

checkFeeds();
