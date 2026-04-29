document.addEventListener('DOMContentLoaded', () => {
    // Configuración de la radio
    const STREAM_URL = "https://valencianismo.com/stream";
    const ICECAST_JSON_URL = "https://valencianismo.com/status-json.xsl";

    // Elements
    const audio = document.getElementById("radio-stream");
    const playBtn = document.getElementById("play-btn");
    const iconPlay = document.getElementById("icon-play");
    const iconPause = document.getElementById("icon-pause");
    const refranText = document.getElementById("refran-text");
    const currentSongEl = document.getElementById("current-song");
    const statusTextEl = document.getElementById("status-text");
    const coverImage = document.getElementById("cover-image");
    const historyList = document.getElementById("history-list");
    
    // v2 specific elements
    const vinylWrapper = document.getElementById("vinyl-wrapper");
    const progressContainer = document.getElementById("progress-container");
    const ambientBg = document.getElementById("ambient-bg");

    // State
    let isPlaying = false;
    let songHistory = [];
    const maxHistory = 10;
    const STREAM_ID = "oqux7fanb3lvv"; // Your ZenoFM Stream ID

    // 1. Load Refranes
    function loadRefran() {
        try {
            if (typeof REFRANES !== 'undefined' && REFRANES.length > 0) {
                const randomRefran = REFRANES[Math.floor(Math.random() * REFRANES.length)];
                // Separamos el refrán de la fuente
                const parts = randomRefran.split(' (');
                if (parts.length > 1) {
                    refranText.innerHTML = `"${parts[0]}"<br>(${parts[1]}`;
                } else {
                    refranText.innerHTML = `"${randomRefran}"`;
                }
            } else {
                refranText.innerHTML = '"A poc a poc s\'ompli la gerra"<br>(Refrán Valenciano)';
            }
        } catch (error) {
            console.error("Error loading refranes:", error);
            refranText.innerHTML = '"A poc a poc s\'ompli la gerra"<br>(Refrán Valenciano)';
        }
    }

    // 2. Audio Control
    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            // Force reload stream to avoid buffering old audio
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    isPlaying = true;
                    updatePlayState();
                }).catch(error => {
                    console.error("Auto-play was prevented", error);
                    isPlaying = false;
                    updatePlayState();
                });
            }
        }
        updatePlayState();
    }

    function updatePlayState() {
        if (isPlaying) {
            iconPlay.style.display = "none";
            iconPause.style.display = "block";
            statusTextEl.textContent = "Emitiendo en directo";
            if (vinylWrapper) vinylWrapper.classList.add("playing");
            if (progressContainer) progressContainer.classList.add("active");
        } else {
            iconPlay.style.display = "block";
            iconPause.style.display = "none";
            statusTextEl.textContent = "Pausado";
            if (vinylWrapper) vinylWrapper.classList.remove("playing");
            if (progressContainer) progressContainer.classList.remove("active");
        }
    }

    playBtn.addEventListener('click', togglePlay);
    
    // Sync external pauses
    audio.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayState();
    });
    audio.addEventListener('play', () => {
        isPlaying = true;
        updatePlayState();
    });

    // 3. Metadata & Cover Logic
    async function updateMetadata() {
        try {
            let songName = "Radio Valencianismo 24/7";
            
            try {
                const metaRes = await fetch(ICECAST_JSON_URL);
                if (metaRes.ok) {
                    const data = await metaRes.json();
                    if (data.icestats && data.icestats.source) {
                        const source = Array.isArray(data.icestats.source) ? data.icestats.source[0] : data.icestats.source;
                        if (source && source.title) {
                            songName = source.title;
                        }
                    }
                }
            } catch(e) {
                // Ignore API fetch error, keep default name or try another endpoint
                // In a real scenario you might parse an ICY header via a proxy
            }

            if (currentSongEl.textContent !== songName && songName !== "Radio Valencianismo 24/7") {
                currentSongEl.textContent = songName;
                checkMarquee();
                updateCover(songName);
                addToHistory(songName);
            }
        } catch (error) {
            console.error("Metadata error:", error);
        }
    }

    function checkMarquee() {
        const container = document.querySelector('.scrolling-text-container');
        const title = document.getElementById('current-song');
        
        if (title.scrollWidth > container.clientWidth) {
            container.classList.add('is-long');
        } else {
            container.classList.remove('is-long');
        }
    }

    // Check on resize too
    window.addEventListener('resize', checkMarquee);

    function setRandomCover() {
        const defaultCovers = [
            'assets/default-cover.png',
            'assets/default-cover-2.png',
            'assets/default-cover-3.png',
            'assets/default-cover-4.png'
        ];
        const randomCover = defaultCovers[Math.floor(Math.random() * defaultCovers.length)];
        coverImage.src = randomCover;
        if (ambientBg) {
            ambientBg.style.backgroundImage = `url(${randomCover})`;
            ambientBg.style.backgroundSize = 'cover';
            ambientBg.style.backgroundPosition = 'center';
            ambientBg.style.opacity = '0.5';
        }
    }

    async function updateCover(songName) {
        try {
            // Limpieza básica del nombre
            const cleanName = songName.replace(/ft\.|feat\.|&/ig, '').replace(/\d+/g, '').trim();
            if (cleanName.length < 3) {
                setRandomCover();
                return;
            }

            const query = encodeURIComponent(cleanName);
            // Pedimos 5 resultados para poder filtrar si el primero es basura (Disney/Frozen)
            const imgRes = await fetch(`https://itunes.apple.com/search?term=${query}&limit=5&entity=song`);
            const data = await imgRes.json();

            if (data.results && data.results.length > 0) {
                // Buscamos el primer resultado que NO sea de Disney o Frozen
                const bestMatch = data.results.find(res => {
                    const artist = (res.artistName || "").toLowerCase();
                    const collection = (res.collectionName || "").toLowerCase();
                    return !artist.includes("disney") && !artist.includes("frozen") && 
                           !collection.includes("disney") && !collection.includes("frozen");
                }) || data.results[0]; // Si todos son "basura", nos quedamos el primero o fallamos

                // Si incluso el mejor match es sospechoso, usamos cover aleatoria
                const finalArtist = (bestMatch.artistName || "").toLowerCase();
                if (finalArtist.includes("disney") || finalArtist.includes("frozen")) {
                    setRandomCover();
                    return;
                }

                const coverUrl = bestMatch.artworkUrl100.replace('100x100bb', '600x600bb');
                coverImage.src = coverUrl;
                
                if (ambientBg) {
                    ambientBg.style.backgroundImage = `url(${coverUrl})`;
                    ambientBg.style.backgroundSize = 'cover';
                    ambientBg.style.backgroundPosition = 'center';
                    ambientBg.style.opacity = '0.3';
                }
            } else {
                setRandomCover();
            }
        } catch (error) {
            console.error("Cover search error:", error);
            setRandomCover();
        }
    }

    function addToHistory(songName) {
        if (songHistory.length === 0 || songHistory[0] !== songName) {
            songHistory.unshift(songName);
            if (songHistory.length > maxHistory) {
                songHistory.pop();
            }
            renderHistory();
        }
    }

    function renderHistory() {
        historyList.innerHTML = '';
        songHistory.forEach(song => {
            const li = document.createElement('li');
            li.textContent = song;
            historyList.appendChild(li);
        });
    }

    // 4. Initialize
    loadRefran();
    setRandomCover(); // Fondo con portada desde el primer momento
    updateMetadata();
    checkMarquee();
    // Poll metadata every 15 seconds
    setInterval(updateMetadata, 15000);

    // 5. Nostr & Zaps & PayPal
    const zapBtn = document.getElementById("zap-btn");
    const paypalBtn = document.getElementById("paypal-btn");
    const vinylBtn = document.getElementById("record-player-btn");
    
    const LIGHTNING_ADDRESS = "boss@coinos.io";
    const NOSTR_PUBKEY = "72bdbc57bdd6dfc4e62685051de8041d148c3c68fe42bf301f71aa6cf53e52fb";
    const RELAYS = ["wss://relay.coinos.io", "wss://relay.damus.io", "wss://nos.lol"];
    const PAYPAL_ME_URL = "https://www.paypal.me/RadioValencianismo";

    const zapModal = document.getElementById("zap-modal");
    const zapQrImg = document.getElementById("zap-qr");
    const closeZapBtn = document.getElementById("close-zap");
    
    const paypalModal = document.getElementById("paypal-modal");
    const closePaypalBtn = document.getElementById("close-paypal");

    zapBtn.addEventListener('click', () => {
        const lnUri = `lightning:${LIGHTNING_ADDRESS}`;
        // Usamos una API gratuita para generar el QR al vuelo
        zapQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lnUri)}`;
        zapModal.classList.add("active");
    });

    closeZapBtn.addEventListener('click', () => {
        zapModal.classList.remove("active");
    });

    // PayPal Logic
    const openPaypal = () => {
        paypalModal.classList.add("active");
    };

    if (paypalBtn) paypalBtn.addEventListener('click', openPaypal);
    
    // Vinyl click -> History
    if (vinylBtn) {
        vinylBtn.addEventListener('click', () => {
            document.querySelector('.history-panel').classList.toggle('active');
        });
    }

    closePaypalBtn.addEventListener('click', () => {
        paypalModal.classList.remove("active");
    });

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            zapModal.classList.remove("active");
            paypalModal.classList.remove("active");
        }
    });

    function initNostr() {
        RELAYS.forEach(relayUrl => {
            try {
                const ws = new WebSocket(relayUrl);
                ws.onopen = () => {
                    // Subscribe to Zap events (Kind 9735) for your pubkey
                    const sub = ["REQ", "zaps-" + Math.random(), {
                        kinds: [9735],
                        "#p": [NOSTR_PUBKEY],
                        since: Math.floor(Date.now() / 1000)
                    }];
                    ws.send(JSON.stringify(sub));
                };
                ws.onmessage = (e) => {
                    const data = JSON.parse(e.data);
                    if (data[0] === "EVENT" && data[2].kind === 9735) {
                        handleZap(data[2]);
                    }
                };
            } catch (err) {
                console.error("Nostr error on " + relayUrl, err);
            }
        });
    }

    function handleZap(event) {
        // Active celebration state
        document.body.classList.add("zap-active");

        // Save original cover and swap to Bitcoin logo
        const originalCover = coverImage.src;
        coverImage.src = 'assets/logob.png';

        // Vinyl Glow Effect (stronger)
        if (vinylWrapper) {
            vinylWrapper.style.boxShadow = "0 0 80px #FFD700";
        }

        setTimeout(() => {
            document.body.classList.remove("zap-active");
            // Only restore if the cover hasn't changed in the meantime (unlikely but safe)
            if (coverImage.src.includes('logob.png')) {
                coverImage.src = originalCover;
            }
            if (vinylWrapper) {
                vinylWrapper.style.boxShadow = "0 20px 50px rgba(0,0,0,0.8)";
            }
        }, 5000);
    }

    initNostr();

    // 6. Test & Simulation
    const logoImg = document.querySelector(".logo-img");
    if (logoImg) {
        logoImg.addEventListener('dblclick', () => {
            console.log("Simulando Zap...");
            handleZap({});
        });
    }
    window.simulateZap = () => handleZap({});

    // 7. Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('SW registered: ', registration.scope);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
});
