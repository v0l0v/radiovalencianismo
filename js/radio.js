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
    const ambientBg = document.getElementById("ambient-bg");

    // State
    let isPlaying = false;
    let songHistory = [];
    const maxHistory = 10;

    // 1. Load Refranes
    function loadRefran() {
        try {
            if (typeof REFRANES !== 'undefined' && REFRANES.length > 0) {
                const randomRefran = REFRANES[Math.floor(Math.random() * REFRANES.length)];
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
        } else {
            iconPlay.style.display = "block";
            iconPause.style.display = "none";
            statusTextEl.textContent = "Pausado";
            if (vinylWrapper) vinylWrapper.classList.remove("playing");
        }
    }

    if (playBtn) playBtn.addEventListener('click', togglePlay);
    
    audio.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayState();
    });
    audio.addEventListener('play', () => {
        isPlaying = true;
        updatePlayState();
    });

    // 3. Metadata & Cover Logic
    let lastNewsShownTime = 0;
    const newsDisplayDuration = 30000; // 30 segundos mostrándose
    const newsFetchInterval = 180000; // Cada 3 minutos (180,000 ms)
    let isShowingNews = false;
    let currentNewsIndex = 0; // Para recordar qué noticia toca en el carrusel

    async function updateMetadata() {
        try {
            let songName = "Radio Valencianismo 24/7";
            const now = Date.now();

            // Rotar a la noticia de noticia_actual.txt si es el momento
            if (!isShowingNews && (now - lastNewsShownTime > newsFetchInterval)) {
                try {
                    // El "?t=" evita que el navegador guarde el archivo en caché
                    const newsRes = await fetch('noticia_actual.txt?t=' + now);
                    if (newsRes.ok) {
                        const newsText = await newsRes.text();
                        if (newsText && newsText.trim().length > 0) {
                            
                            // 1. Separamos el texto por líneas y quitamos las vacías
                            let newsLines = newsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                            
                            if (newsLines.length > 0) {
                                // 2. Nos aseguramos de no leer un número máximo exagerado si el archivo crece
                                // Por seguridad, cogemos como máximo las últimas 50 noticias
                                newsLines = newsLines.slice(-50);

                                // 3. Ajustamos el índice si el archivo de repente tiene menos noticias
                                if (currentNewsIndex >= newsLines.length) {
                                    currentNewsIndex = 0;
                                }

                                // 4. Mostramos la noticia en la tarjeta de ascensor flotante
                                const elevatorWidget = document.getElementById('elevator-news-widget');
                                const elevatorTitle = document.getElementById('elevator-title');
                                const elevatorImgWrapper = document.getElementById('elevator-img-wrapper');
                                const elevatorImg = document.getElementById('elevator-img');
                                const elevatorSourceTag = document.getElementById('elevator-source-tag');
                                
                                if (elevatorWidget && elevatorTitle) {
                                    let rawNews = newsLines[currentNewsIndex];
                                    let cleanNews = rawNews;
                                    let imgUrl = null;
                                    let sourceText = "ÚLTIMA HORA";

                                    // Extraemos la foto y la fuente si viene en formato: URL||FUENTE||TEXTO
                                    if (rawNews.includes('||')) {
                                        const parts = rawNews.split('||');
                                        if (parts.length >= 3) {
                                            imgUrl = parts[0].trim();
                                            sourceText = parts[1].trim();
                                            cleanNews = parts[2].trim();
                                        } else if (parts.length === 2) {
                                            imgUrl = parts[0].trim();
                                            cleanNews = parts[1].trim();
                                        }
                                    }

                                    // Limpiamos el texto
                                    cleanNews = cleanNews.replace("📢 ÚLTIMA HORA:", "").trim();
                                    elevatorTitle.textContent = cleanNews;
                                    
                                    if (elevatorSourceTag) {
                                        elevatorSourceTag.innerHTML = sourceText; //innerHTML para mantener el pseudo-elemento (el puntito rojo)
                                    }

                                    // Mostramos la foto si hay una
                                    if (elevatorImgWrapper && elevatorImg) {
                                        if (imgUrl && imgUrl.startsWith('http')) {
                                            elevatorImg.src = imgUrl;
                                            elevatorImgWrapper.style.display = 'block';
                                        } else {
                                            elevatorImgWrapper.style.display = 'none';
                                        }
                                    }

                                    elevatorWidget.classList.add('show');
                                }
                                
                                lastNewsShownTime = now;
                                isShowingNews = true;
                                
                                // 5. Preparamos el índice para la siguiente vez
                                currentNewsIndex = (currentNewsIndex + 1) % newsLines.length;
                                
                                // 6. Tras 30 segundos, ocultar tarjeta
                                setTimeout(() => {
                                    if (elevatorWidget) elevatorWidget.classList.remove('show');
                                    isShowingNews = false;
                                }, newsDisplayDuration);
                                
                                // OJO: Ya no hacemos 'return;' porque queremos que el título de la canción de fondo se siga mostrando en el vinilo
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error fetching noticia_actual.txt:", e);
                }
            }

            // Si no estamos en modo noticia, obtener la canción habitual de Icecast
            if (!isShowingNews) {
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
                } catch(e) {}

                if (currentSongEl.textContent !== songName && songName !== "Radio Valencianismo 24/7") {
                    currentSongEl.textContent = songName;
                    checkMarquee();
                    updateCover(songName);
                    addToHistory(songName);
                }
            }
        } catch (error) {
            console.error("Metadata error:", error);
        }
    }

    function checkMarquee() {
        const container = document.querySelector('.scrolling-text-container');
        const title = document.getElementById('current-song');
        
        if (title && container && title.scrollWidth > container.clientWidth) {
            container.classList.add('is-long');
        } else if (container) {
            container.classList.remove('is-long');
        }
    }

    window.addEventListener('resize', checkMarquee);

    function setRandomCover() {
        const defaultCovers = [
            'assets/default-cover.png',
            'assets/default-cover-2.png',
            'assets/default-cover-3.png',
            'assets/default-cover-4.png'
        ];
        const randomCover = defaultCovers[Math.floor(Math.random() * defaultCovers.length)];
        if (coverImage) coverImage.src = randomCover;
        if (ambientBg) {
            ambientBg.style.backgroundImage = `url(${randomCover})`;
            ambientBg.style.backgroundSize = 'cover';
            ambientBg.style.backgroundPosition = 'center';
            ambientBg.style.opacity = '0.5';
        }
    }

    async function updateCover(songName) {
        setRandomCover();
    }

    function addToHistory(songName) {
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
        
        if (songHistory.length === 0 || songHistory[0].title !== songName) {
            songHistory.unshift({ title: songName, time: timeStr });
            if (songHistory.length > maxHistory) {
                songHistory.pop();
            }
            renderHistory();
        }
    }

    function renderHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';
        songHistory.forEach(song => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="history-item-info" style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <span class="history-song-title" style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${song.title}</span>
                    <span class="history-song-time" style="font-size: 0.8rem; opacity: 0.5; margin-left: 10px;">${song.time}</span>
                </div>
            `;
            historyList.appendChild(li);
        });
    }

    // 4. Initialize
    loadRefran();
    setRandomCover();
    updateMetadata();
    checkMarquee();
    setInterval(updateMetadata, 15000);

    // 5. Nostr & Zaps & PayPal
    const zapBtn = document.getElementById("zap-btn");
    const paypalBtn = document.getElementById("paypal-btn");
    const vinylBtn = document.getElementById("record-player-btn");
    
    const LIGHTNING_ADDRESS = "boss@coinos.io";
    const NOSTR_PUBKEY = "72bdbc57bdd6dfc4e62685051de8041d148c3c68fe42bf301f71aa6cf53e52fb";
    const RELAYS = ["wss://relay.coinos.io", "wss://relay.damus.io", "wss://nos.lol"];

    const zapModal = document.getElementById("zap-modal");
    const zapQrImg = document.getElementById("zap-qr");
    const closeZapBtn = document.getElementById("close-zap");
    
    const paypalModal = document.getElementById("paypal-modal");
    const closePaypalBtn = document.getElementById("close-paypal");

    if (zapBtn) zapBtn.addEventListener('click', () => {
        const lnUri = `lightning:${LIGHTNING_ADDRESS}`;
        zapQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lnUri)}`;
        zapModal.classList.add("active");
    });

    if (closeZapBtn) closeZapBtn.addEventListener('click', () => {
        zapModal.classList.remove("active");
    });

    if (paypalBtn) paypalBtn.addEventListener('click', () => {
        paypalModal.classList.add("active");
    });

    if (vinylBtn) {
        vinylBtn.addEventListener('click', () => {
            document.querySelector('.history-panel').classList.toggle('active');
        });
    }

    if (closePaypalBtn) closePaypalBtn.addEventListener('click', () => {
        paypalModal.classList.remove("active");
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (zapModal) zapModal.classList.remove("active");
            if (paypalModal) paypalModal.classList.remove("active");
        }
    });

    function initNostr() {
        RELAYS.forEach(relayUrl => {
            try {
                const ws = new WebSocket(relayUrl);
                ws.onopen = () => {
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
        document.body.classList.add("zap-active");
        const originalCover = coverImage.src;
        coverImage.src = 'assets/logob.png';
        if (vinylWrapper) {
            vinylWrapper.style.boxShadow = "0 0 80px #FFD700";
        }
        setTimeout(() => {
            document.body.classList.remove("zap-active");
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
    const eggZap = document.getElementById("easter-egg-zap");
    const eggCd = document.getElementById("easter-egg-cd");
    const cdIconPath = document.getElementById("cd-icon-path");
    let isCdMode = false;

    if (eggZap) {
        eggZap.addEventListener('dblclick', () => {
            document.querySelector('.history-panel').classList.remove('active');
            handleZap({});
        });
    }

    if (eggCd) {
        eggCd.addEventListener('dblclick', () => {
            isCdMode = !isCdMode;
            document.querySelector('.history-panel').classList.remove('active');
            if (isCdMode) {
                vinylWrapper.classList.add("is-cd");
                cdIconPath.setAttribute("d", "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zM12 11c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z");
            } else {
                vinylWrapper.classList.remove("is-cd");
                cdIconPath.setAttribute("d", "M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,16.5C9.5,16.5 7.5,14.5 7.5,12C7.5,9.5 9.5,7.5 12,7.5C14.5,7.5 16.5,9.5 16.5,12C16.5,14.5 14.5,16.5 12,16.5M12,10.5C11.17,10.5 10.5,11.17 10.5,12C10.5,12.83 11.17,13.5 12,13.5C12.83,13.5 13.5,12.83 13.5,12C13.5,11.17 12.83,10.5 12,10.5Z");
            }
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
