/* Valencianismo Lo-Fi — Sistema de Lógica y Efectos */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración y Referencias ---
    const ICECAST_JSON_URL = '/status-json.xsl';
    
    // Mapeo de ambientes (Modo Ilustración y Modo Foto)
    const AMBIENTS = {
        serranos: { name: 'Torres de Serrans y la Senyera', file_art: 'assets/serranos_art.png', file_photo: 'assets/pixelart_photo.png' },
        xativa: { name: 'Castell de Xàtiva', file_art: 'assets/xativa_art.png', file_photo: 'assets/xativa_photo.png' },
        cyberpunk: { name: 'Ciutat de les Arts Cyberpunk', file_art: 'assets/cyberpunk_cac_art.png', file_photo: 'assets/cyberpunk_photo.png' },
        malvarrosa: { name: 'Amanecer en la Malvarrosa', file_art: 'assets/malvarrosa_sorolla_art.png', file_photo: 'assets/malvarrosa_photo.png' },
        space: { name: 'Estación Espacial sobre Valencia', file_art: 'assets/space_art.png?v=3', file_photo: 'assets/space_photo.png' },
        lonja_mercado: { name: 'Mercat Central (1920)', file_art: 'assets/lonja_mercado_art.png', file_photo: 'assets/brooklyn_photo.png' },
        cac: { name: 'Ciutat de les Arts i les Ciències', file_art: 'assets/cac_art.png?v=2', file_photo: 'assets/cac_photo.png?v=2' },
        valencia: { name: 'Barraca en la Albufera', file_art: 'assets/valencia_art.png', file_photo: 'assets/valencia_photo.png' },
        naranjos_360: { name: 'Campo de Naranjos', file_art: 'assets/naranjos_360_art.png' }
    };

    let currentAmbient = '';

    // Elementos DOM
    const bgContainer = document.getElementById('bg-container');
    const ambientNameDisplay = document.getElementById('ambient-name');
    const playButtons = document.querySelectorAll('.play-btn');
    const radioAudio = document.getElementById('radio-audio');
    const trackTitle = document.getElementById('track-title');
    const musicIcon = document.querySelector('.music-icon');
    const ambientButtons = document.querySelectorAll('.ambient-btn[data-ambient]');

    // --- Lógica del Reproductor de Audio ---
    let isPlaying = false;

    // Sincronizar volumen inicial
    radioAudio.volume = 0.8;

    function updatePlayUI(playing) {
        playButtons.forEach(btn => {
            const playSvg = btn.querySelector('.play-icon');
            const pauseSvg = btn.querySelector('.pause-icon');
            if (playSvg && pauseSvg) {
                if (playing) {
                    playSvg.classList.add('hidden');
                    pauseSvg.classList.remove('hidden');
                    btn.setAttribute('aria-label', 'Pausar');
                } else {
                    playSvg.classList.remove('hidden');
                    pauseSvg.classList.add('hidden');
                    btn.setAttribute('aria-label', 'Reproducir');
                }
            }
        });
    }

    function togglePlay() {
        if (!isPlaying) {
            // Recargar el stream para evitar lag por almacenamiento en búfer pasivo
            radioAudio.src = 'https://valencianismo.com/stream_musical?v=' + Date.now();
            radioAudio.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayUI(true);
                    musicIcon.classList.remove('paused');
                })
                .catch(err => console.error("Error reproduciendo audio:", err));
        } else {
            radioAudio.pause();
            isPlaying = false;
            updatePlayUI(false);
            musicIcon.classList.add('paused');
        }
    }

    playButtons.forEach(btn => {
        btn.addEventListener('click', togglePlay);
    });

    // Poner el reproductor como pausado inicialmente
    musicIcon.classList.add('paused');

    // --- Sintonización de Ambientes (Estéticas) ---

    function loadAmbientVisual(ambientKey) {
        if (!AMBIENTS[ambientKey]) return;
        currentAmbient = ambientKey;
        
        const amb = AMBIENTS[ambientKey];
        const bgUrl = amb.file_art;

        // Cambiar la imagen de fondo con transición CSS3 suave
        bgContainer.style.backgroundImage = `url(${bgUrl})`;
        ambientNameDisplay.textContent = amb.name;

        bgContainer.style.backgroundSize = 'cover';
        bgContainer.style.backgroundRepeat = 'no-repeat';

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
        loadAmbientVisual(ambientKey);
    }

    // Inicializar ambientes con click simple
    ambientButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setAmbient(btn.getAttribute('data-ambient'));
        });
    });

    // --- Navegación de Ambientes con Ratón/Teclado ---
    const ambientKeys = Object.keys(AMBIENTS);
    function cycleAmbient(direction) {
        if (!currentAmbient) return;
        let currentIndex = ambientKeys.indexOf(currentAmbient);
        if (currentIndex === -1) return;
        
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = ambientKeys.length - 1;
        if (currentIndex >= ambientKeys.length) currentIndex = 0;
        
        setAmbient(ambientKeys[currentIndex]);
    }

    // Rueda del ratón
    window.addEventListener('wheel', (e) => {
        // Evitar el cambio si se hace scroll sobre el panel del reproductor o modales
        if (e.target.closest('#player-panel') || e.target.closest('.modal')) return;
        
        if (e.deltaY > 0) {
            cycleAmbient(1); // Scroll abajo = siguiente
        } else if (e.deltaY < 0) {
            cycleAmbient(-1); // Scroll arriba = anterior
        }
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
        
        // Ajustar posición del panel al cambiar de altura
        setTimeout(positionPanel, 150);
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





    // --- Lógica de Metadatos Alineada con Valencianismo Radio ---
    const SCHEDULE = [
        { h: 9, m: 30, name: "GOTHAM VCF" },
        { h: 11, m: 30, name: "LA HORA DON PÍO" },
        { h: 13, m: 30, name: "ATENEO" },
        { h: 15, m: 30, name: "GOTHAM VCF" },
        { h: 17, m: 30, name: "LA HORA DON PÍO" },
        { h: 19, m: 30, name: "ATENEO" },
        { h: 21, m: 30, name: "GOTHAM VCF" },
        { h: 23, m: 30, name: "ATENEO" }
    ];

    function getComingNextMessage() {
        const now = new Date();
        const curH = now.getHours();
        const curM = now.getMinutes();
        const curS = now.getSeconds();
        const totalMinutesNow = curH * 60 + curM;

        // Si estamos en los últimos 15 segundos del minuto, no mostrar aviso (para que rote la canción)
        if (curS >= 45) return null;

        for (const prog of SCHEDULE) {
            const progTotalMinutes = prog.h * 60 + prog.m;
            const diff = progTotalMinutes - totalMinutesNow;
            if (diff > 0 && diff <= 5) {
                return `PRÓXIMAMENTE (${prog.h}:${prog.m.toString().padStart(2,'0')}h): ${prog.name}`;
            }
        }
        if (curM >= 57 && curM < 60) {
            return `A LAS EN PUNTO: EL MÓN DE JUAN Y PATRI`;
        }
        return null;
    }

    function decodeHTMLEntities(text) {
        if (!text) return "";
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }

    let lastTrack = '';

    async function fetchMetadata() {
        try {
            let songName = "Valencianismo Radio 24/7";
            const comingNext = getComingNextMessage();

            // Añadimos cache-buster para evitar respuestas cacheadas
            const res = await fetch(ICECAST_JSON_URL + '?v=' + Date.now());
            if (res.ok) {
                const data = await res.json();
                if (data.icestats && data.icestats.source) {
                    const sources = data.icestats.source;
                    let activeSource = null;
                    
                    if (Array.isArray(sources)) {
                        // Buscar primero /stream (la principal) o sino la primera disponible
                        activeSource = sources.find(s => s.mount === '/stream') || sources[0];
                    } else {
                        activeSource = sources;
                    }
                    
                    if (activeSource && activeSource.title) {
                        songName = decodeHTMLEntities(activeSource.title.trim());
                    }
                }
            }

            // Prioridad al aviso si estamos en música genérica o por defecto
            if (comingNext && (songName === "Valencianismo Radio 24/7" || !songName.includes(':'))) {
                songName = comingNext;
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
        playerPanel.style.bottom = 'auto'; // Desactivar bottom de CSS
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
        playerPanel.style.bottom = 'auto'; // Asegurar desactivación de bottom en arrastre
        
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

    // --- Efecto Panning con Arrastre (Touch / Mouse Drag) ---
    // Sustituye al giroscopio por ser más cómodo y permitir ver la pantalla siempre.
    
    let isBgDragging = false;
    let bgStartX = 0;
    let bgStartY = 0;
    
    // Posiciones objetivo (a donde el usuario quiere ir arrastrando)
    let bgTargetX = 50; 
    let bgTargetY = 50;

    // Posiciones actuales (las que se renderizan y persiguen al objetivo con inercia)
    let bgCurrentX = 50;
    let bgCurrentY = 50;

    const bgEasing = 0.05; // Velocidad de la inercia (menor = más inercia)
    const dragSensitivityNormal = 0.08; // Sensibilidad del porcentaje por pixel arrastrado

    // Eventos de arrastre en el body
    document.body.addEventListener('mousedown', startBgDrag);
    document.body.addEventListener('touchstart', startBgDrag, { passive: false });

    document.body.addEventListener('mousemove', onBgDrag);
    document.body.addEventListener('touchmove', onBgDrag, { passive: false });

    document.body.addEventListener('mouseup', endBgDrag);
    document.body.addEventListener('touchend', endBgDrag);
    document.body.addEventListener('mouseleave', endBgDrag);

    function startBgDrag(e) {
        // Ignorar si hace clic dentro del panel del reproductor o modales
        if (e.target.closest('#player-panel') || e.target.closest('.modal')) return;
        
        isBgDragging = true;
        
        if (e.type === 'touchstart') {
            bgStartX = e.touches[0].clientX;
            bgStartY = e.touches[0].clientY;
        } else {
            bgStartX = e.clientX;
            bgStartY = e.clientY;
        }
    }

    function onBgDrag(e) {
        if (!isBgDragging) return;
        
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        let deltaX = clientX - bgStartX;
        let deltaY = clientY - bgStartY;
        
        // Actualizar punto de inicio para el siguiente frame de movimiento
        bgStartX = clientX;
        bgStartY = clientY;

        const amb = AMBIENTS[currentAmbient];

        // Modo Normal: limitado a 0-100%
        bgTargetX -= deltaX * dragSensitivityNormal;
        bgTargetX = Math.max(0, Math.min(100, bgTargetX));
        
        bgTargetY -= deltaY * dragSensitivityNormal;
        bgTargetY = Math.max(0, Math.min(100, bgTargetY));
        
        if (e.cancelable) e.preventDefault();
    }

    function endBgDrag() {
        isBgDragging = false;
    }

    // Navegación panorámica con cursores del teclado
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const amb = AMBIENTS[currentAmbient];
        const stepNormal = 5; // Porcentaje de movimiento por pulsación

        if (e.key === 'ArrowRight') {
            bgTargetX = Math.max(0, Math.min(100, bgTargetX + stepNormal));
            e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
            bgTargetX = Math.max(0, Math.min(100, bgTargetX - stepNormal));
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            bgTargetY = Math.max(0, Math.min(100, bgTargetY - stepNormal));
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            bgTargetY = Math.max(0, Math.min(100, bgTargetY + stepNormal));
            e.preventDefault();
        }
    });

    // Bucle de renderizado para aplicar la inercia (LERP)
    function animateBgParallax() {
        // Interpolar hacia el objetivo
        bgCurrentX += (bgTargetX - bgCurrentX) * bgEasing;
        bgCurrentY += (bgTargetY - bgCurrentY) * bgEasing;

        const amb = AMBIENTS[currentAmbient];

        if (Math.abs(bgTargetX - bgCurrentX) > 0.01 || Math.abs(bgTargetY - bgCurrentY) > 0.01) {
            // Aplicamos porcentaje a ambos
            bgContainer.style.backgroundPosition = `${bgCurrentX.toFixed(2)}% ${bgCurrentY.toFixed(2)}%`;
        }
        
        requestAnimationFrame(animateBgParallax);
    }

    // Iniciar bucle
    animateBgParallax();
});
