/* Valencianismo Lo-Fi — Sistema de Lógica y Efectos */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración y Referencias ---
    const ICECAST_JSON_URL = '/status-json.xsl';
    
    // Mapeo de ambientes
    const AMBIENTS = {
        pixelart: { name: 'Habitación Pixel-Art', file: 'assets/pixelart.png', tint: 'rgba(255, 159, 28, 0.05)' },
        retro: { name: 'Retro Vintage Años 50', file: 'assets/retro.png', tint: 'rgba(255, 100, 10, 0.04)' },
        cyberpunk: { name: 'Ciberpunk Futurista', file: 'assets/cyberpunk.png', tint: 'rgba(46, 196, 182, 0.05)' },
        nature: { name: 'Cabaña y Naturaleza', file: 'assets/nature.png', tint: 'rgba(10, 180, 50, 0.03)' }
    };

    let currentAmbient = 'retro';

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
    function setAmbient(ambientKey) {
        if (!AMBIENTS[ambientKey]) return;
        currentAmbient = ambientKey;
        const amb = AMBIENTS[ambientKey];

        // Cambiar la imagen de fondo con transición CSS3 suave
        bgContainer.style.backgroundImage = `url(${amb.file})`;
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

    // Inicializar ambientes con clicks
    ambientButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setAmbient(btn.getAttribute('data-ambient'));
        });
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


    // --- Canvas del Efecto Lluvia en el Vidrio ---
    const canvas = document.getElementById('rain-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Clase para Gotas Rápidas de Fondo (Lluvia cayendo detrás del vidrio)
    class RainDrop {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.length = Math.random() * 20 + 15;
            this.speed = Math.random() * 15 + 10;
            this.opacity = Math.random() * 0.15 + 0.05;
            this.width = Math.random() * 1 + 0.5;
        }
        update() {
            this.y += this.speed;
            this.x += this.speed * 0.05; // Leve caída diagonal
            if (this.y > height) {
                this.reset();
            }
        }
        draw() {
            ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
            ctx.lineWidth = this.width;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.length * 0.05, this.y + this.length);
            ctx.stroke();
        }
    }

    // Clase para Gotas del Vidrio (Efecto Condensación y Gravedad lenta)
    class WindowDrop {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.r = Math.random() * 2 + 1; // Radio de la gota
            this.opacity = Math.random() * 0.4 + 0.2;
            this.speedY = Math.random() * 0.5 + 0.1; // Deslizamiento lento
            this.slideChance = Math.random() < 0.2; // Solo algunas se deslizan
            this.trail = [];
        }
        update() {
            if (this.slideChance) {
                this.y += this.speedY;
                // Dejar un rastro de humedad detrás de la gota
                if (Math.random() < 0.3) {
                    this.trail.push({ x: this.x, y: this.y, opacity: this.opacity });
                }
                // Si sale del panel, reiniciar arriba
                if (this.y > height) {
                    this.reset();
                    this.y = 0;
                }
            } else {
                // Si es estática, tiene una probabilidad mínima de empezar a resbalar con el tiempo
                if (Math.random() < 0.0005) {
                    this.slideChance = true;
                }
            }
            
            // Reducir la opacidad del rastro
            this.trail.forEach(t => t.opacity -= 0.005);
            this.trail = this.trail.filter(t => t.opacity > 0);
        }
        draw() {
            // Dibujar rastro
            this.trail.forEach(t => {
                ctx.fillStyle = `rgba(255, 255, 255, ${t.opacity * 0.5})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.r * 0.8, 0, Math.PI * 2);
                ctx.fill();
            });

            // Dibujar gota de agua (con reflejo simulado)
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            
            // Pequeño reflejo luminoso interno
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const raindrops = Array.from({ length: 65 }, () => new RainDrop());
    const windowdrops = Array.from({ length: 120 }, () => new WindowDrop());

    function animateRain() {
        ctx.clearRect(0, 0, width, height);

        // Lluvia de fondo
        raindrops.forEach(drop => {
            drop.update();
            drop.draw();
        });

        // Gotas deslizándose en la ventana
        windowdrops.forEach(drop => {
            drop.update();
            drop.draw();
        });

        requestAnimationFrame(animateRain);
    }
    animateRain();


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
    const playerPanel = document.querySelector('.player-panel');
    const dragHeader = document.querySelector('.player-header');

    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;

    // Centrar inicialmente el panel en la pantalla
    function centerPanel() {
        const panelWidth = playerPanel.offsetWidth;
        const panelHeight = playerPanel.offsetHeight;
        
        // Centrado horizontal
        let left = (window.innerWidth - panelWidth) / 2;
        // Centrado vertical un poco desplazado hacia abajo
        let top = (window.innerHeight - panelHeight) / 2 + 50; 
        
        // Limitar al margen de 5px
        left = Math.max(5, Math.min(left, window.innerWidth - panelWidth - 5));
        top = Math.max(5, Math.min(top, window.innerHeight - panelHeight - 5));
        
        playerPanel.style.left = `${left}px`;
        playerPanel.style.top = `${top}px`;
        playerPanel.style.margin = '0';
    }

    // Ejecutar centrado tras un pequeño timeout para que el layout se renderice y se obtengan offsets reales
    setTimeout(centerPanel, 100);
    window.addEventListener('resize', centerPanel);

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
