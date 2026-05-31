/* Valencianismo Lo-Fi — Sistema de Lógica y Efectos */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración y Referencias ---
    const ICECAST_JSON_URL = '/status-json.xsl';
    
    // Mapeo de ambientes (Modo Ilustración y Modo Foto)
    const AMBIENTS = {
        serranos: {
            name: 'Torres de Serrans y la Senyera', file_art: 'assets/serranos_art.png', file_photo: 'assets/pixelart_photo.png',
            hotspots: [
                { color:'blue',   x:68, y:22, icon:'🏛️', title:'Torres de Serrans', wiki:'Torres_de_Serrans', content:'Portal gòtic del s. XIV, una de les millors mostres de l\'arquitectura gòtica civil europea. Va ser presó reial i porta principal d\'entrada a la ciutat de València.' },
                { color:'red',    x:42, y:58, icon:'⚔️', title:'Muralla Medieval', wiki:'Muralles_de_Val%C3%A9ncia', content:'València va tindre 6 km de muralla medieval amb 12 portes. Quasi tota fou enderrocada en el s. XIX per a permetre el creixement de la ciutat.' },
                { color:'green',  x:22, y:72, icon:'🌿', title:'Jardí del Túria', wiki:'Jard%C3%AD_del_T%C3%BAria', content:'Antic llit del riu Túria convertit en parc urbà de 9 km després de les catastròfiques inundacions del 29 d\'octubre de 1957. Hui és el pulmó verd de la ciutat.' },
                { color:'yellow', x:78, y:48, icon:'🚩', title:'La Senyera Valenciana', wiki:'Senyera_valenciana', content:'La bandera del Regne de València, quatre barres roges sobre fons daurat. Símbol d\'identitat i d\'independència. La seua història es remunta al s. XIII amb la Reconquista.' }
            ]
        },
        xativa: {
            name: 'Castell de Xàtiva', file_art: 'assets/xativa_art.png', file_photo: 'assets/xativa_photo.png',
            hotspots: [
                { color:'blue',   x:55, y:18, icon:'🏰', title:'Castell de Xàtiva', wiki:'Castell_de_X%C3%A0tiva', content:'Una de les fortaleses més importants de la península ibèrica. D\'origen ibèric i romà, ampliat pels àrabs i reconquerit por Jaume I en 1244. Ofereix vistes espectaculars de la Costera.' },
                { color:'red',    x:35, y:45, icon:'🔥', title:'Incendi de Xàtiva (1707)', wiki:'Crema_de_X%C3%A0tiva', content:'Felip V va ordenar cremar i resar Xàtiva com a càstig per la seua resistència durant la Guerra de Successió. El rei apareix penjat del cap al Museu de l\'Almodí de Xàtiva.' },
                { color:'green',  x:72, y:65, icon:'💧', title:'Fonts de Xàtiva', wiki:'X%C3%A0tiva', content:'La muntanya de Xàtiva té nombroses fonts naturals que han fet de la ciutat un lloc fèrtil des de l\'antiguitat. El paper va arribar a Europa a través d\'ací al s. XII.' },
                { color:'yellow', x:25, y:55, icon:'⚜️', title:'Els Papes valencians', wiki:'Borja', content:'Xàtiva és el bressol de dos papes: Calixt III (1455) i Alexandre VI (1492), tots dos de la família Borja. Un dels llinatges més influents i controvertits del Renaixement europeu.' }
            ]
        },
        cyberpunk: {
            name: 'Ciutat de les Arts Cyberpunk', file_art: 'assets/cyberpunk_cac_art.png', file_photo: 'assets/cyberpunk_photo.png',
            hotspots: [
                { color:'blue',   x:72, y:30, icon:'🎭', title:'Palau de les Arts Reina Sofia', wiki:'Palau_de_les_Arts_Reina_Sof%C3%ADa', content:'Ópera i centre cultural dissenyat per Calatrava. Amb 75.000 m², és el segon teatre d\'òpera més gran del món. La seua silueta recorda un casc futurista o un ocell en vol.' },
                { color:'red',    x:40, y:55, icon:'🏎️', title:'Fórmula 1 a València (2008-2012)', wiki:'Circuit_urb%C3%A0_de_Val%C3%A9ncia', content:'El circuit urbà de València va acollir el Gran Premi d\'Europa de F1 durant cinc anys. Va ser el circuit urbà permanent més llarg de l\'era moderna amb 5,419 km al voltant del port.' },
                { color:'green',  x:20, y:70, icon:'🌱', title:'L\'Umbracle', wiki:'L%27Umbracle', content:'Jardí lineal cobert situat sobre el pàrquing del complex. Conté plantes autòctones valencianes i una col·lecció d\'escultures d\'art contemporani. Accés gratuït.' },
                { color:'yellow', x:60, y:65, icon:'🌉', title:'Pont de l\'Assut de l\'Or', wiki:'Pont_de_l%27Assut_de_l%27Or', content:'Pont atirantat de Calatrava de 125 metres d\'alçada, el punto més alt de la silueta de la Ciutat de les Arts. El seu nom fa referència a un antic rec d\'irrigació.' }
            ]
        },
        malvarrosa: {
            name: 'Amanecer en la Malvarrosa', file_art: 'assets/malvarrosa_sorolla_art.png', file_photo: 'assets/malvarrosa_photo.png',
            hotspots: [
                { color:'blue',   x:20, y:55, icon:'🏖️', title:'Platja de la Malva-rosa', wiki:'Platja_de_la_Malva-rosa', content:'Platja urbana de 5 km de llarg, símbol de l\'oci mediterrani valencià. El seu nom prové d\'una fàbrica de perfums que hi havia al s. XIX que elaborava oli de malva-rosa.' },
                { color:'red',    x:50, y:35, icon:'✍️', title:'Blasco Ibáñez', wiki:'Vicent_Blasco_Ib%C3%A1%C3%B1ez', content:'L\'escriptor valencià Vicente Blasco Ibáñez va viure i escriure ací. La seua novel·la "La Barraca" retrata la vida dels llauradors valencians. Va ser el primer autor de best-sellers en anglés.' },
                { color:'green',  x:72, y:70, icon:'🐚', title:'Dunes protegides', wiki:'Duna', content:'Les dunes del litoral valencià allotgen ecosistemes únics amb espècies vegetals adaptades. Malgrat la pressió urbanística, alguns trams han sigut recuperats com a hàbitat protegit.' },
                { color:'yellow', x:35, y:25, icon:'🎨', title:'Sorolla i la llum', wiki:'Joaquim_Sorolla_i_Bastida', content:'Joaquín Sorolla (1863-1923) és el pintor de la llum mediterrània per excel·lència. Moltes de les seues obres més famosas estan pintades ací, capturant el reflex del sol a les ones.' }
            ]
        },
        space: {
            name: 'Estación Espacial sobre Valencia', file_art: 'assets/space_art.png?v=3', file_photo: 'assets/space_photo.png',
            hotspots: [
                { color:'blue',   x:60, y:15, icon:'🛰️', title:'València des de l\'espai', wiki:'Val%C3%A9ncia', content:'La llum de València és visible des de l\'Estació Espacial Internacional. El seu litoral, l\'Albufera i l\'Horta formen un mosaic inconfusible vist des de l\'òrbita terrestre a 400 km d\'altura.' },
                { color:'red',    x:30, y:35, icon:'🌊', title:'Riuada del 1957', wiki:'Gran_riuada_de_Val%C3%A9ncia', content:'El 29 d\'octubre de 1957 el riu Túria va desbordar-se causant 81 morts i devastant la ciutat. Com a conseqüència, el curs del Túria es va desviar al sud i el llit es va convertir en parc.' },
                { color:'green',  x:75, y:60, icon:'🦆', title:'Parc Natural de l\'Albufera', wiki:'Albufera_de_Val%C3%A9ncia', content:'Vist des de l\'espai, l\'Albufera apareix com una taca fosca just al sud de València. És el llac d\'aigua dolça més gran de la península ibèrica i reserva natural d\'aus migratòries.' },
                { color:'yellow', x:45, y:72, icon:'🍊', title:'L\'Horta valenciana', wiki:'Horta_de_Val%C3%A9ncia', content:'El sistema de regadiu de l\'Horta valenciana, visible des de l\'espai com una trama geomètrica verda, és Patrimoni Immaterial de la UNESCO. Té origen romà i àrab, i més de 1.000 anys d\'història.' }
            ]
        },
        lonja_mercado: {
            name: 'Mercat Central (1920)', file_art: 'assets/lonja_mercado_art.png', file_photo: 'assets/brooklyn_photo.png',
            hotspots: [
                { color:'blue',   x:35, y:35, icon:'🏪', title:'Mercat Central de València', wiki:'Mercat_Central_de_Val%C3%A9ncia', content:'Inaugurat en 1928, és un dels mercats coberts més grans d\'Europa amb 8.000 m². La seua cúpula central amb vitralls modernistes és una obra d\'art. Cada dia hi passen milers de persones.' },
                { color:'red',    x:58, y:52, icon:'🏛️', title:'La Llotja de la Seda', wiki:'Llotja_de_Val%C3%A9ncia', content:'Declarada Patrimoni de la Humanitat por la UNESCO en 1996. Construïda entre 1482 i 1548, és el millor exemple de l\'arquitectura gòtica civil valenciana i símbol de la riquesa mercantil de la ciutat.' },
                { color:'green',  x:25, y:65, icon:'🎨', title:'El Carme', wiki:'Barri_del_Carme', content:'El barri del Carme és el cor medieval de València. Ple de galerietres d\'art, bars i botigues de disseny, és el barri bohemi per excel·lència. Conserva restes de la muralla àrab del s. XI.' },
                { color:'yellow', x:68, y:25, icon:'🏺', title:'Ceràmica valenciana', wiki:'Cer%C3%A0mica_de_Manises', content:'La tradició ceràmica valenciana, famosa pels azulejos blaus i blancs, es remunta al s. XV a Manises i Paterna. Va influir en la ceràmica de tot Europa i en l\'estil mudèjar hispànic.' }
            ]
        },
        cac: {
            name: 'Ciutat de les Arts i les Ciències', file_art: 'assets/cac_art.png?v=2', file_photo: 'assets/cac_photo.png?v=2',
            hotspots: [
                { color:'blue',   x:65, y:40, icon:'🔭', title:'L\'Hemisfèric', wiki:'L%27Hemisf%C3%A8ric', content:'Edifici en forma d\'ull humà amb una parpella mòbil que s\'obre i es tanca. Acull un cinema IMAX, un planetari i una sala làser. La seua superfície és una xarxa de formigó blanc i acer.' },
                { color:'red',    x:40, y:58, icon:'🐋', title:'L\'Oceanogràfic', wiki:'L%27Oceanogr%C3%A0fic', content:'El parc aquàtic més gran d\'Europa per volum d\'aigua (42 milions de litres). Dissenyat per Félix Candela, acull dofins, belugas, morses, taurons i més de 45.000 animals de 500 espècies.' },
                { color:'green',  x:22, y:32, icon:'🌴', title:'L\'Umbracle', wiki:'L%27Umbracle', content:'Passeig escultòric cobert de 300 metres de llarg ple de palmeres, tarongers i plantes del Mediterrani. A la nit es converteix en un dels espais d\'oci nocturn més glamurosos de la ciutat.' },
                { color:'yellow', x:72, y:68, icon:'🎶', title:'Palau de les Arts', wiki:'Palau_de_les_Arts_Reina_Sof%C3%ADa', content:'Una de les sales d\'òpera més importants del món. El seu disseny de Calatrava imita un casc medieval. La temporada inclou òpera, dansa i música clàssica d\'alt nivell internacional.' }
            ]
        },
        valencia: {
            name: 'Barraca en la Albufera', file_art: 'assets/valencia_art.png', file_photo: 'assets/valencia_photo.png',
            hotspots: [
                { color:'blue',   x:25, y:60, icon:'🦢', title:'L\'Albufera de València', wiki:'Albufera_de_Val%C3%A9ncia', content:'El llac costaner d\'aigua dolça més gran de la península ibèrica, amb 21.000 hectàrees. Hàbitat de centenars d\'espècies d\'aus, és un espai natural protegit i bressol de la paella valenciana.' },
                { color:'red',    x:55, y:35, icon:'🍚', title:'El bressol de la paella', wiki:'Paella', content:'La paella valenciana va nàixer a les vores de l\'Albufera. La recepta autèntica porta arròs de la zona, pollastre, conill, bajoqueta, garrofó, tomaca, oli i safrà. Cap altra cosa és paella.' },
                { color:'green',  x:40, y:72, icon:'🌾', title:'L\'arrossar de l\'Albufera', wiki:'Arr%C3%B2s', content:'Els camps d\'arròs de l\'Albufera creen un paisatge únic que canvia de color amb les estacions. L\'arròs es cultiva ací des del s. X àrab. Unes 14.000 hectàrees de cultiu envolten el llac.' },
                { color:'yellow', x:70, y:50, icon:'🏡', title:'La Barraca valenciana', wiki:'Barraca', content:'Casa tradicional dels llauradors valencians, amb sostre de palla de dos aigües i façana encalada. Hui quasi no en queden, pero la barraca és un dels símbols més poètics de la identitat del camp valencià.' }
            ]
        },
        naranjos_360: {
            name: 'Campo de Naranjos', file_art: 'assets/naranjos_360_art.png',
            hotspots: [
                { color:'blue',   x:50, y:50, icon:'🍊', title:'La taronja valenciana', wiki:'Taronja', content:'Valencia i les seues comarques produeixen el 60% de les taronges d\'Espanya. Des del s. XIX s\'exporta a tot el món. La varietat Navel, la Clementina i la Navelina són las més famoses.' },
                { color:'red',    x:28, y:30, icon:'🐛', title:'La plaga de la Tristesa (1957)', wiki:'Virus_de_la_tristesa_dels_c%C3%ADtrics', content:'Un virus devastador va destruir la pràctica totalitat dels tarongers valencians en la dècada dels 50. Gràcies a l\'esforç dels llauradors i nous patrons resistents, la taronja es va recuperar.' },
                { color:'green',  x:70, y:40, icon:'💧', title:'Séquia Reial del Xúquer', wiki:'S%C3%A9quia_Reial_del_X%C3%BAquer', content:'L\'antic sistema de reg de l\'Horta valenciana, d\'origen àrab, és Patrimoni Mundial. El Tribunal de les Aigües de València porta més de 1.000 anys resolent disputes de reg cada dijous davant la Catedral.' },
                { color:'yellow', x:38, y:68, icon:'✈️', title:'La caixa de taronges', wiki:'Taronja', content:'Las caixes de taronges amb paper setinat i etiquetes de colors vius foren un art gràfic propi del País Valencià. Les etiquetes dels anys 20-60 son objectes de col·leccionisme arreu del món.' }
            ]
        },
        mestalla: {
            name: 'Estadio de Mestalla', file_art: 'assets/mestallavcf_art.png',
            hotspots: [
                { color:'blue',   x:50, y:25, icon:'🏟️', title:'Estadi de Mestalla', wiki:'Mestalla', content:'Inaugurat el 1923, és un dels estadis amb més història d\'Espanya. Amb capacitat per a 49.430 espectadors, és famós per la seua gran inclinació de graderies, que crea una atmosfera intimidant per als visitants.' },
                { color:'red',    x:30, y:55, icon:'🏆', title:'València CF: la grandesa', wiki:'Val%C3%A9ncia_Club_de_Futbol', content:'Fundat en 1919, el Valencia CF ha sigut campió de Lliga en 1942, 1944, 1947, 2002 i 2004. Dos vegades campió de la UEFA (1980, 2004) i finalista de la Champions en 2001. Cinc vegades campió de Copa.' },
                { color:'green',  x:65, y:60, icon:'🧣', title:'La Graderia de Mestalla', wiki:'Mestalla', content:'Les grades de Mestalla, especialment el Fondo Nord, són famoses per la seua passió i la seua presència sonora. La penya "Yomus" és un dels colectius ultres més antics i actius del futbol espanyol.' },
                { color:'yellow', x:20, y:35, icon:'🦇', title:'El Murciélago de la Llegenda', wiki:'Lo_Rat_Penat', content:'Segons la llegenda, durant la Reconquista de València per Jaume I en 1238, un ratpenat va apareixer sobre el seu elm aturant-lo d\'una emboscada. Per agraïment, el ratpenat es va incloure a l\'escut del regne i del club.' }
            ]
        }
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
    // Hotspots (4 colores), puntos de proximidad y anillos
    const HS_COLORS = ['blue','red','green','yellow'];
    const hsButtons = {};
    const proxDots  = {};
    const hsRings   = {};
    let revealHotspots = false;
    HS_COLORS.forEach(c => {
        hsButtons[c] = document.getElementById('hs-' + c);
        proxDots[c]  = document.getElementById('pd-' + c);
        hsRings[c]   = document.getElementById('hr-' + c);
    });

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

        // Posicionar los 4 hotspots y sus anillos en el nuevo ambiente
        HS_COLORS.forEach(c => {
            const btn  = hsButtons[c];
            const ring = hsRings[c];
            const hs   = (amb.hotspots || []).find(h => h.color === c);
            if (hs) {
                const lft = hs.x + '%';
                const top = hs.y + '%';
                if (btn)  { btn.style.left  = lft; btn.style.top  = top; btn.style.display = 'flex'; }
                if (ring) { ring.style.left = lft; ring.style.top = top; ring.style.opacity = '0'; ring.classList.remove('pulse'); }
            } else {
                if (btn)  btn.style.display  = 'none';
                if (ring) ring.style.opacity = '0';
            }
        });
        updateHotspotReveal();
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

    // Rueda del ratón / trackpad → mueve el fondo (pan), NO cambia de ambiente
    window.addEventListener('wheel', (e) => {
        if (e.target.closest('#player-panel') || e.target.closest('#hotspot-modal')) return;
        e.preventDefault();
        bgTargetX = Math.max(0, Math.min(100, bgTargetX + e.deltaX * 0.08));
        bgTargetY = Math.max(0, Math.min(100, bgTargetY + e.deltaY * 0.08));
    }, { passive: false });



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

    const bgEasing = 0.12; // Velocidad de la inercia (menor = más inercia)
    const dragSensitivityNormal = 0.15; // Sensibilidad del porcentaje por pixel arrastrado

    // Zoom (Zoom in / Zoom out)
    let bgZoomTarget = 1.0;
    let bgZoomCurrent = 1.0;
    const ZOOM_STEP = 0.35;
    const ZOOM_MIN = 0.825; // Deja el máximo de fondo posible cubriendo la pantalla, escala resultante aprox 0.84
    const ZOOM_MAX = 3.0;

    const zoomInBtn  = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');

    if (zoomInBtn && zoomOutBtn) {
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            bgZoomTarget = Math.min(ZOOM_MAX, bgZoomTarget + ZOOM_STEP);
        });
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            bgZoomTarget = Math.max(ZOOM_MIN, bgZoomTarget - ZOOM_STEP);
        });
        
        // Evitar que el drag empiece al hacer mousedown o touchstart en los botones de zoom
        zoomInBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        zoomOutBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        zoomInBtn.addEventListener('touchstart', (e) => e.stopPropagation());
        zoomOutBtn.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    const zoomFullscreenBtn = document.getElementById('zoom-fullscreen-btn');

    if (zoomFullscreenBtn) {
        zoomFullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error("Error al activar pantalla completa:", err);
                });
            } else {
                document.exitFullscreen().catch(err => {
                    console.error("Error al salir de pantalla completa:", err);
                });
            }
        });
        zoomFullscreenBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        zoomFullscreenBtn.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    document.addEventListener('fullscreenchange', () => {
        const isFs = !!document.fullscreenElement;
        const enterIcon = document.querySelector('.fs-enter-icon');
        const exitIcon = document.querySelector('.fs-exit-icon');
        if (enterIcon && exitIcon) {
            if (isFs) {
                enterIcon.classList.add('hidden');
                exitIcon.classList.remove('hidden');
            } else {
                enterIcon.classList.remove('hidden');
                exitIcon.classList.add('hidden');
            }
        }
        // Restablecer el zoom a 1.0 y centrar para el menor desplazamiento posible
        bgTargetX = 50;
        bgTargetY = 50;
        bgZoomTarget = 1.0;
    });

    // Eventos de arrastre en el body
    document.body.addEventListener('mousedown', startBgDrag);
    document.body.addEventListener('touchstart', startBgDrag, { passive: false });

    document.body.addEventListener('mousemove', onBgDrag);
    document.body.addEventListener('touchmove', onBgDrag, { passive: false });

    document.body.addEventListener('mouseup', endBgDrag);
    document.body.addEventListener('touchend', endBgDrag);
    document.body.addEventListener('mouseleave', endBgDrag);

    function startBgDrag(e) {
        // Ignorar si hace clic dentro del panel del reproductor, modales o los controles de zoom
        if (e.target.closest('#player-panel') || e.target.closest('.modal') || e.target.closest('.zoom-controls')) return;
        
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
    // Cambio de ambiente solo con AvPág / RePág (+ botones numerados)
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Revelar posiciones de círculos (Hotspots) con Windows + X o Ctrl + X
        if ((e.key === 'x' || e.key === 'X') && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            revealHotspots = !revealHotspots;
            updateHotspotReveal();
            return;
        }

        const stepNormal = 8;

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
        } else if (e.key === 'PageDown') {
            cycleAmbient(1);
            e.preventDefault();
        } else if (e.key === 'PageUp') {
            cycleAmbient(-1);
            e.preventDefault();
        }
    });

    // Bucle de renderizado para aplicar la inercia (LERP)
    function animateBgParallax() {
        // Interpolar hacia el objetivo
        bgCurrentX += (bgTargetX - bgCurrentX) * bgEasing;
        bgCurrentY += (bgTargetY - bgCurrentY) * bgEasing;
        bgZoomCurrent += (bgZoomTarget - bgZoomCurrent) * bgEasing;

        // Calcular escala final (1.02 de base multiplicado por el zoom actual)
        const scaleVal = 1.02 * bgZoomCurrent;

        // Limitar la traslación máxima para que la imagen cubra exactamente la pantalla
        const maxOffsetW = 60 * scaleVal - 50; // en vw
        const maxOffsetH = 60 * scaleVal - 50; // en vh

        const transX = ((50 - bgCurrentX) / 50) * maxOffsetW;
        const transY = ((50 - bgCurrentY) / 50) * maxOffsetH;
        bgContainer.style.transform = `translate3d(${transX.toFixed(2)}vw, ${transY.toFixed(2)}vh, 0) scale(${scaleVal.toFixed(3)})`;
        
        requestAnimationFrame(animateBgParallax);
    }

    // Iniciar bucle
    animateBgParallax();


    // --- Hotspots (4 colores) ---
    const hotspotModal         = document.getElementById('hotspot-modal');
    const hotspotModalBox      = document.getElementById('hotspot-modal-box');
    const hotspotModalExpand   = document.getElementById('hotspot-modal-expand');
    const hotspotModalIcon     = document.getElementById('hotspot-modal-icon');
    const hotspotModalTitle    = document.getElementById('hotspot-modal-title');
    const hotspotModalDesc     = document.getElementById('hotspot-modal-desc');
    const hotspotModalClose    = document.getElementById('hotspot-modal-close');
    const hotspotWikiContainer = document.getElementById('hotspot-wiki-container');
    const hotspotWikiIframe    = document.getElementById('hotspot-wiki-iframe');
    const hotspotWikiLink      = document.getElementById('hotspot-wiki-link');

    let activeHotspot = null;

    // Colores finales de cada punto (para la interpolación blanco → color)
    const HS_TARGET_COLORS = {
        blue:   [0,   120, 255],
        red:    [220,  30,  30],
        green:  [0,   185,  80],
        yellow: [230, 180,   0]
    };

    function openHotspotModal(color) {
        const amb = AMBIENTS[currentAmbient];
        if (!amb || !amb.hotspots) return;
        const hs = amb.hotspots.find(h => h.color === color);
        if (!hs) return;
        
        activeHotspot = hs;
        
        // Reiniciar estado de expansión
        hotspotModalBox.classList.remove('expanded');
        hotspotModalExpand.textContent = '+';
        hotspotWikiContainer.classList.add('hidden');
        hotspotWikiIframe.src = '';
        hotspotWikiIframe.classList.remove('loaded');
        
        hotspotModalIcon.textContent  = hs.icon  || '📍';
        hotspotModalTitle.textContent = hs.title;
        hotspotModalDesc.textContent  = hs.content;
        
        // Color del borde según el punto
        const [r,g,b] = HS_TARGET_COLORS[color];
        hotspotModal.style.setProperty('--hs-color', `rgb(${r},${g},${b})`);
        hotspotModal.classList.add('visible');
    }

    function closeHotspotModal() {
        hotspotModal.classList.remove('visible');
        setTimeout(() => {
            hotspotModalBox.classList.remove('expanded');
            hotspotModalExpand.textContent = '+';
            hotspotWikiContainer.classList.add('hidden');
            hotspotWikiIframe.src = '';
            hotspotWikiIframe.classList.remove('loaded');
            activeHotspot = null;
        }, 250); // esperar a que termine la transición de opacidad
    }

    HS_COLORS.forEach(c => {
        const btn = hsButtons[c];
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openHotspotModal(c);
        });
    });

    hotspotModalClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeHotspotModal();
    });

    hotspotModal.addEventListener('click', (e) => {
        if (e.target === hotspotModal) closeHotspotModal();
    });

    hotspotModalExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!activeHotspot) return;

        const isExpanded = hotspotModalBox.classList.contains('expanded');
        if (isExpanded) {
            hotspotModalBox.classList.remove('expanded');
            hotspotModalExpand.textContent = '+';
            hotspotWikiContainer.classList.add('hidden');
            hotspotWikiIframe.src = '';
            hotspotWikiIframe.classList.remove('loaded');
        } else {
            hotspotModalBox.classList.add('expanded');
            hotspotModalExpand.textContent = '−';
            hotspotWikiContainer.classList.remove('hidden');
            
            const loader = hotspotWikiContainer.querySelector('.wiki-loader');
            if (loader) loader.style.display = 'flex';
            hotspotWikiIframe.classList.remove('loaded');

            if (activeHotspot.wiki) {
                hotspotWikiIframe.src = `https://www.lenciclopedia.org/w/index.php?title=${activeHotspot.wiki}&action=render`;
                hotspotWikiLink.href = `https://www.lenciclopedia.org/wiki/${activeHotspot.wiki}`;
            } else {
                hotspotWikiIframe.src = `https://www.lenciclopedia.org/w/index.php?search=${encodeURIComponent(activeHotspot.title)}&action=render`;
                hotspotWikiLink.href = `https://www.lenciclopedia.org/index.php?search=${encodeURIComponent(activeHotspot.title)}`;
            }
        }
    });

    hotspotWikiIframe.addEventListener('load', () => {
        const loader = hotspotWikiContainer.querySelector('.wiki-loader');
        if (loader) loader.style.display = 'none';
        hotspotWikiIframe.classList.add('loaded');
    });

    // --- Proximidad: 4 puntos de colores siguen al ratón ---
    const PROX_RADIUS = 260;

    document.body.addEventListener('mousemove', (e) => {
        const overUI = e.target.closest('#player-panel') || e.target.closest('#hotspot-modal');
        const amb = AMBIENTS[currentAmbient];

        HS_COLORS.forEach(c => {
            const dot  = proxDots[c];
            const ring = hsRings[c];
            const btn  = hsButtons[c];
            if (!dot || !btn || !ring) return;

            dot.style.left = e.clientX + 'px';
            dot.style.top  = e.clientY + 'px';

            const hs = (amb && amb.hotspots) ? amb.hotspots.find(h => h.color === c) : null;

            if (overUI || !amb || !amb.hotspots || !hs) {
                dot.style.opacity = '0';
                if (revealHotspots && hs) {
                    const [r, g, b] = HS_TARGET_COLORS[c];
                    ring.style.opacity = '0.75';
                    ring.style.borderColor = `rgba(${r},${g},${b},0.85)`;
                    ring.classList.add('reveal');
                    ring.classList.remove('pulse');
                } else {
                    ring.style.opacity = '0';
                    ring.classList.remove('reveal');
                    ring.classList.remove('pulse');
                }
                return;
            }

            // Medir la posición real del botón de hotspot en pantalla usando getBoundingClientRect()
            const rect = btn.getBoundingClientRect();
            const hx   = rect.left + rect.width / 2;
            const hy   = rect.top + rect.height / 2;
            const dist = Math.sqrt((e.clientX - hx) ** 2 + (e.clientY - hy) ** 2);

            if (dist > PROX_RADIUS) {
                dot.style.opacity = '0';
                if (revealHotspots) {
                    const [r, g, b] = HS_TARGET_COLORS[c];
                    ring.style.opacity = '0.75';
                    ring.style.borderColor = `rgba(${r},${g},${b},0.85)`;
                    ring.classList.add('reveal');
                    ring.classList.remove('pulse');
                } else {
                    ring.style.opacity = '0';
                    ring.classList.remove('reveal');
                    ring.classList.remove('pulse');
                }
                return;
            }

            const t   = 1 - dist / PROX_RADIUS;
            const [tr, tg, tb] = HS_TARGET_COLORS[c];
            const r   = Math.round(255 + (tr - 255) * t);
            const g   = Math.round(255 + (tg - 255) * t);
            const b   = Math.round(255 + (tb - 255) * t);
            const sc  = (0.7 + t * 1.1).toFixed(2);
            const op  = (0.25 + t * 0.75).toFixed(2);
            const glow = Math.round(t * 18);

            dot.style.opacity    = op;
            dot.style.background = `rgb(${r},${g},${b})`;
            dot.style.boxShadow  = `0 0 ${glow}px rgba(${r},${g},${b},0.8)`;
            dot.style.transform  = `translate(-50%,-50%) scale(${sc})`;

            // Anillo sobre el hotspot: aparece y pulsa al acercarse (o se mantiene fijo si está revelado)
            const ringOp = Math.max(revealHotspots ? 0.75 : 0.0, t * 0.75).toFixed(2);
            ring.style.opacity     = ringOp;
            ring.style.borderColor = `rgba(${r},${g},${b},0.85)`;
            if (revealHotspots) {
                ring.classList.add('reveal');
            } else {
                ring.classList.remove('reveal');
            }
            
            if (t > 0.55 && !ring.classList.contains('pulse')) {
                ring.classList.add('pulse');
            }
            if (t <= 0.55) {
                ring.classList.remove('pulse');
            }
        });
    });

    document.body.addEventListener('mouseleave', () => {
        HS_COLORS.forEach(c => { if (proxDots[c]) proxDots[c].style.opacity = '0'; });
    });

    // Revelar todos los hotspots del ambiente actual con su color respectivo
    function updateHotspotReveal() {
        const amb = AMBIENTS[currentAmbient];
        HS_COLORS.forEach(c => {
            const ring = hsRings[c];
            if (!ring) return;
            const hs = (amb && amb.hotspots) ? amb.hotspots.find(h => h.color === c) : null;
            if (revealHotspots && hs) {
                const [r, g, b] = HS_TARGET_COLORS[c];
                ring.style.borderColor = `rgba(${r},${g},${b},0.85)`;
                ring.style.opacity = '0.75';
                ring.classList.add('reveal');
            } else {
                if (!revealHotspots) {
                    ring.style.opacity = '0';
                    ring.classList.remove('reveal');
                    ring.classList.remove('pulse');
                }
            }
        });
    }
});
