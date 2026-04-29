document.addEventListener('DOMContentLoaded', () => {
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
    const visualizer = document.querySelector(".audio-visualizer");
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
                refranText.textContent = `"${randomRefran}"`;
            } else {
                refranText.textContent = '"A poc a poc s\'ompli la gerra"';
            }
        } catch (error) {
            console.error("Error loading refranes:", error);
            refranText.textContent = '"A poc a poc s\'ompli la gerra"'; // Fallback
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
            if (visualizer) visualizer.classList.add("active");
        } else {
            iconPlay.style.display = "block";
            iconPause.style.display = "none";
            statusTextEl.textContent = "Pausado";
            if (vinylWrapper) vinylWrapper.classList.remove("playing");
            if (visualizer) visualizer.classList.remove("active");
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
                updateCover(songName);
                addToHistory(songName);
            }
        } catch (error) {
            console.error("Metadata error:", error);
        }
    }

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
            ambientBg.style.opacity = '0.3';
        }
    }

    async function updateCover(songName) {
        try {
            // Remove common radio tags for better search
            const query = encodeURIComponent(songName.replace(/ft\.|feat\.|&/ig, '').trim());
            const imgRes = await fetch(`https://itunes.apple.com/search?term=${query}&limit=1&entity=song`);
            const data = await imgRes.json();

            if (data.results && data.results.length > 0) {
                // Get high-res artwork
                const coverUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
                coverImage.src = coverUrl;
                
                // Update ambient background for v2
                if (ambientBg) {
                    // Extract dominant color roughly or just use the image
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
    updateMetadata();
    // Poll metadata every 15 seconds
    setInterval(updateMetadata, 15000);

    // 5. Register PWA Service Worker
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
