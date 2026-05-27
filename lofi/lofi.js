/* Valencianismo Lo-Fi — Sistema de Lógica y Efectos */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración y Referencias ---
    const ICECAST_JSON_URL = '/status-json.xsl';
    
    // Mapeo de ambientes (Modo Ilustración y Modo Foto)
    const AMBIENTS = {
        pixelart: { name: 'Habitación Pixel-Art', file_art: 'assets/pixelart_art.png', file_photo: 'assets/pixelart_photo.png' },
        retro: { name: 'Retro Vintage Años 50', file_art: 'assets/retro_art.png', file_photo: 'assets/retro_photo.png' },
        cyberpunk: { name: 'Ciberpunk Futurista', file_art: 'assets/cyberpunk_art.png', file_photo: 'assets/cyberpunk_photo.png' },
        nature: { name: 'Cabaña y Naturaleza', file_art: 'assets/nature_art.png', file_photo: 'assets/nature_photo.png' },
        space: { name: 'Estación Espacial sobre Valencia', file_art: 'assets/space_art.png', file_photo: 'assets/space_photo.png' },
        brooklyn: { name: 'Loft en Brooklyn', file_art: 'assets/brooklyn_art.png', file_photo: 'assets/brooklyn_photo.png' },
        nyc: { name: 'Rascacielos en Manhattan', file_art: 'assets/nyc_art.png', file_photo: 'assets/nyc_photo.png' },
        valencia: { name: 'Barraca en la Albufera', file_art: 'assets/valencia_art.png', file_photo: 'assets/valencia_photo.png' }
    };

    let currentAmbient = '';

    // Elementos DOM
    const bgContainer = document.getElementById('bg-container');
    const ambientNameDisplay = document.getElementById('ambient-name');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playSvg = document.getElementById('play-svg');
    const pauseSvg = document.getElementById('pause-svg');
    const volumeSlider = document.getElementById('volume-slider');
    const radioAudio = document.getElementById('radio-audio');
    const trackTitle = document.getElementById('track-title');
    const musicIcon = document.querySelector('.music-icon');
    const ambientButtons = document.querySelectorAll('.ambient-btn[data-ambient]');

    // --- Lógica del Reproductor de Audio ---
    let isPlaying = false;

    // Sincronizar volumen inicial
    radioAudio.volume = volumeSlider.value;

    function togglePlay() {
        if (!isPlaying) {
            // Recargar el stream para evitar lag por almacenamiento en búfer pasivo
            radioAudio.src = 'https://valencianismo.com/stream_musical?v=' + Date.now();
            radioAudio.play()
                .then(() => {
                    isPlaying = true;
                    playSvg.classList.add('hidden');
                    pauseSvg.classList.remove('hidden');
                    musicIcon.classList.remove('paused');
                    playPauseBtn.setAttribute('aria-label', 'Pausar');
                })
                .catch(err => console.error("Error reproduciendo audio:", err));
        } else {
            radioAudio.pause();
            isPlaying = false;
            playSvg.classList.remove('hidden');
            pauseSvg.classList.add('hidden');
            musicIcon.classList.add('paused');
            playPauseBtn.setAttribute('aria-label', 'Reproducir');
        }
    }

    playPauseBtn.addEventListener('click', togglePlay);

    // Ajustar volumen
    volumeSlider.addEventListener('input', (e) => {
        radioAudio.volume = e.target.value;
    });

    // Poner el reproductor como pausado inicialmente
    musicIcon.classList.add('paused');

    // --- Sintonización de Ambientes (Estéticas) ---
    let currentVisualType = 'art'; // 'art' o 'photo'

    function loadAmbientVisual(ambientKey, visualType) {
        if (!AMBIENTS[ambientKey]) return;
        currentAmbient = ambientKey;
        currentVisualType = visualType;
        
        const amb = AMBIENTS[ambientKey];
        const bgUrl = visualType === 'photo' ? amb.file_photo : amb.file_art;

        // Cambiar la imagen de fondo con transición CSS3 suave
        bgContainer.style.backgroundImage = `url(${bgUrl})`;
        ambientNameDisplay.textContent = amb.name;

        // Actualizar estados de botones de selección
        ambientButtons.forEach(btn => {
            if (btn.getAttribute('data-ambient') === ambientKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function setAmbient(ambientKey) {
        // Seleccionar aleatoriamente entre modo ilustración ('art') y modo fotografía ('photo')
        const visualType = Math.random() < 0.5 ? 'photo' : 'art';
        loadAmbientVisual(ambientKey, visualType);
    }

    // Inicializar ambientes con clicks y doble clicks
    ambientButtons.forEach(btn => {
        // Click simple: sintoniza ambiente con fondo aleatorio
        btn.addEventListener('click', () => {
            setAmbient(btn.getAttribute('data-ambient'));
        });

        // Doble click: alterna el modo (Foto / Ilustración) para el ambiente pulsado
        btn.addEventListener('dblclick', (e) => {
            e.preventDefault();
            const ambientKey = btn.getAttribute('data-ambient');
            
            // Alternamos el tipo visual actual
            const nextVisualType = currentVisualType === 'art' ? 'photo' : 'art';
            loadAmbientVisual(ambientKey, nextVisualType);
        });
    });

    // --- Minimizar / Maximizar Reproductor ---
    const playerPanel = document.getElementById('player-panel');
    const togglePlayerBtn = document.getElementById('toggle-player-btn');

    function togglePlayerMinimize() {
        const isMinimized = playerPanel.classList.toggle('minimized');
        togglePlayerBtn.textContent = isMinimized ? '▲' : '▼';
        togglePlayerBtn.title = isMinimized ? 'Maximizar Reproductor' : 'Minimizar Reproductor';
        
        // Recalcular posicionamiento de margen de 5px tras redimensionarse
        setTimeout(positionPanel, 150);
    }

    togglePlayerBtn.addEventListener('click', togglePlayerMinimize);

    // En dispositivos móviles (ancho <= 580px) arranca minimizado por defecto
    if (window.innerWidth <= 580) {
        playerPanel.classList.add('minimized');
        togglePlayerBtn.textContent = '▲';
        togglePlayerBtn.title = 'Maximizar Reproductor';
    }

    // --- Desplegar / Colapsar Selector de Ambientes ---
    const toggleSelectorBtn = document.getElementById('toggle-selector-btn');
    const ambientSelectorWrapper = document.getElementById('ambient-selector-wrapper');

    toggleSelectorBtn.addEventListener('click', () => {
        const isCollapsed = ambientSelectorWrapper.classList.toggle('collapsed');
        toggleSelectorBtn.textContent = isCollapsed ? '▲' : '▼';
        toggleSelectorBtn.title = isCollapsed ? 'Mostrar ambientes' : 'Ocultar ambientes';
    });

    // Botón de Pantalla Completa (Full Screen API)
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => {
                    fullscreenBtn.textContent = '🗗';
                    fullscreenBtn.title = 'Salir de Pantalla Completa';
                })
                .catch(err => {
                    console.error(`Error al activar pantalla completa: ${err.message}`);
                });
        } else {
            document.exitFullscreen();
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = 'Pantalla Completa';
        }
    });

    // Sincronizar el botón si se sale pulsando ESC
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = 'Pantalla Completa';
        } else {
            fullscreenBtn.textContent = '🗗';
            fullscreenBtn.title = 'Salir de Pantalla Completa';
        }
    });

    // Cargar un ambiente aleatorio distinto cada vez que se entra a la página
    const ambientKeys = Object.keys(AMBIENTS);
    const randomAmbient = ambientKeys[Math.floor(Math.random() * ambientKeys.length)];
    setAmbient(randomAmbient);


    // --- Reloj Analógico y Digital Funcional ---
    const hourHand = document.getElementById('hour-hand');
    const minHand = document.getElementById('min-hand');
    const secHand = document.getElementById('sec-hand');
    const digitalTimeDisplay = document.getElementById('digital-time');

    function updateClock() {
        const now = new Date();
        
        // Digital
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        digitalTimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        // Analógico (Ángulos)
        const sec = now.getSeconds();
        const min = now.getMinutes();
        const hr = now.getHours();

        const secDegrees = (sec / 60) * 360;
        const minDegrees = (min / 60) * 360 + (sec / 60) * 6;
        const hrDegrees = (hr / 12) * 360 + (min / 60) * 30;

        secHand.style.transform = `rotate(${secDegrees}deg)`;
        minHand.style.transform = `rotate(${minDegrees}deg)`;
        hourHand.style.transform = `rotate(${hrDegrees}deg)`;
    }

    setInterval(updateClock, 1000);
    updateClock(); // Carga inicial inmediata





    // --- Actualización de Metadatos en tiempo real (Canción Actual) ---
    let lastTrack = '';

    async function fetchMetadata() {
        try {
            // Añadimos cache-buster para evitar respuestas cacheadas por Caddy
            const res = await fetch(ICECAST_JSON_URL + '?v=' + Date.now());
            if (!res.ok) throw new Error("HTTP error " + res.status);
            const data = await res.json();
            
            // Buscar la fuente montada en Icecast
            let songName = 'Emisión en directo';
            if (data.icestats && data.icestats.source) {
                const sources = data.icestats.source;
                let activeSource = null;
                
                if (Array.isArray(sources)) {
                    activeSource = sources.find(s => s.mount === '/stream_musical');
                } else if (sources.mount === '/stream_musical') {
                    activeSource = sources;
                }
                
                if (activeSource && activeSource.title) {
                    songName = activeSource.title;
                }
            }

            // Normalizar y mostrar
            if (songName !== lastTrack) {
                lastTrack = songName;
                trackTitle.textContent = songName;
                
                // Efecto marquesina si el título es demasiado largo
                if (songName.length > 25) {
                    trackTitle.classList.add('marquee');
                } else {
                    trackTitle.classList.remove('marquee');
                }
            }
        } catch (e) {
            console.error("Error al refrescar metadatos:", e);
            // Fallback si falla la petición a Icecast
            if (!lastTrack) {
                trackTitle.textContent = 'Valencianismo Radio - Directo';
            }
        }
    }

    // Refrescar metadatos cada 10 segundos
    setInterval(fetchMetadata, 10000);
    fetchMetadata(); // Primera carga


    // --- Lógica de Arrastre (Draggable) del Panel ---
    const dragHeader = document.querySelector('.player-header');

    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;

    // Posicionar el panel en la esquina inferior izquierda
    function positionPanel() {
        const panelWidth = playerPanel.offsetWidth;
        const panelHeight = playerPanel.offsetHeight;
        
        // Esquina inferior izquierda (20px de margen)
        let left = 20;
        let top = window.innerHeight - panelHeight - 20; 
        
        // Limitar al margen de 5px en pantallas muy pequeñas
        left = Math.max(5, Math.min(left, window.innerWidth - panelWidth - 5));
        top = Math.max(5, Math.min(top, window.innerHeight - panelHeight - 5));
        
        playerPanel.style.left = `${left}px`;
        playerPanel.style.top = `${top}px`;
        playerPanel.style.margin = '0';
    }

    // Ejecutar posicionamiento tras un pequeño timeout para que el layout se renderice y se obtengan offsets reales
    setTimeout(positionPanel, 100);
    window.addEventListener('resize', positionPanel);

    dragHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    dragHeader.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        // Si se hace click en un botón u otro control, no arrastrar
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.ambient-selector')) return;
        
        isDragging = true;
        playerPanel.classList.add('dragging');
        
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        
        initialLeft = parseFloat(playerPanel.style.left) || 0;
        initialTop = parseFloat(playerPanel.style.top) || 0;
    }

    function drag(e) {
        if (!isDragging) return;
        
        // Evitar scroll en móvil al arrastrar
        if (e.type === 'touchmove') {
            e.preventDefault();
        }
        
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        const panelWidth = playerPanel.offsetWidth;
        const panelHeight = playerPanel.offsetHeight;
        
        // Límite de 5px de margen
        const minX = 5;
        const maxX = window.innerWidth - panelWidth - 5;
        const minY = 5;
        const maxY = window.innerHeight - panelHeight - 5;
        
        newLeft = Math.max(minX, Math.min(newLeft, maxX));
        newTop = Math.max(minY, Math.min(newTop, maxY));
        
        playerPanel.style.left = `${newLeft}px`;
        playerPanel.style.top = `${newTop}px`;
    }

    function dragEnd() {
        isDragging = false;
        playerPanel.classList.remove('dragging');
    }
});
