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
    const shuffleBtn = document.getElementById('shuffle-btn');

    // --- Lógica del Reproductor de Audio ---
    let isPlaying = false;

    // Sincronizar volumen inicial
    radioAudio.volume = volumeSlider.value;

    function togglePlay() {
        if (!isPlaying) {
            // Recargar el stream para evitar lag por almacenamiento en búfer pasivo
            radioAudio.src = 'https://valencianismo.com/stream?v=' + Date.now();
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

        // Guardar preferencia
        localStorage.setItem('valencianismo_lofi_ambient', ambientKey);
    }

    // Inicializar ambientes con clicks
    ambientButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setAmbient(btn.getAttribute('data-ambient'));
        });
    });

    // Botón aleatorio (Sintonización)
    shuffleBtn.addEventListener('click', () => {
        const keys = Object.keys(AMBIENTS);
        const filtered = keys.filter(k => k !== currentAmbient);
        const randomKey = filtered[Math.floor(Math.random() * filtered.length)];
        setAmbient(randomKey);
    });

    // Cargar preferencia guardada o usar la de por defecto (retro)
    const savedAmbient = localStorage.getItem('valencianismo_lofi_ambient');
    setAmbient(savedAmbient && AMBIENTS[savedAmbient] ? savedAmbient : 'retro');


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
                    activeSource = sources.find(s => s.mount === '/stream');
                } else if (sources.mount === '/stream') {
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
});
