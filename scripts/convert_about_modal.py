import os

html_files = ['index.html', 'index_movil.html', 'index_movil_sec.html', 'index_sec.html']

about_modal_html = """
    <!-- Modal About -->
    <div class="modern-modal" id="about-modal">
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto; text-align: left; position: relative; line-height: 1.6; font-size: 1.1rem;">
            <button class="close-modal" id="close-about" style="position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; border-radius: 50%; padding: 0; display: flex; justify-content: center; align-items: center; z-index: 10;">&times;</button>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px; position: sticky; top: 0; z-index: 5;">
                <button id="about-btn-va" onclick="switchAboutLang('va')" style="background: var(--secondary); color: #0a0a0f; border: none; padding: 6px 16px; border-radius: 20px; font-weight: 800; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(255,215,0,0.3);">VAL</button>
                <button id="about-btn-es" onclick="switchAboutLang('es')" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 20px; font-weight: 800; cursor: pointer; transition: all 0.3s ease;">CAS</button>
            </div>

            <!-- Contenido en Valencià -->
            <div id="about-content-va">
                <h2 style="color: var(--secondary); text-transform: uppercase; font-weight: 800; text-align: center; margin-bottom: 20px;">¿Qué és Valencianismo Radio?</h2>
                <p><strong>Valencianismo Radio</strong> és un proyecte de comunicació digital lliure, independent i descentralisat, naixcut en l'únic propòsit de donar veu a la cultura, l'història i l'actualitat del poble valencià i del Valencia CF.</p>
                <p>En un entorn mediàtic a on les nostres arraïls a sovint queden diluïdes, la nostra emissora s'erigix com un bastió per a la defensa de les senyes d'identitat del <strong>Regne de Valéncia</strong>. Emetem ininterrompudament les 24 hores del dia, els 7 dies de la semana, oferint una cuidada selecció de tertúlies d'actualitat, programes d'anàlisis, humor tradicional i la millor música autòctona.</p>
                <h3 style="color: #00d2ff; margin-top: 30px; border-bottom: 1px solid rgba(0,210,255,0.3); padding-bottom: 8px;">El nostre compromís llingüístic</h3>
                <p>El pilar fonamental de Valencianismo Radio és el respecte absolut per la nostra llengua. Per això, tota la nostra llinea editorial, programació i texts escrits es rigen estrictament per les <strong>Normes d'El Puig</strong> (ortografia oficial de la Real Acadèmia de Cultura Valenciana - RACV). Creem fermament que la protecció i promoció de la genuïna llengua valenciana passa pel seu us quotidià, correcte i sense complexos en els nous formats digitals.</p>
                <h3 style="color: #00d2ff; margin-top: 30px; border-bottom: 1px solid rgba(0,210,255,0.3); padding-bottom: 8px;">Tecnologia i descentralisació</h3>
                <p>No a soles mirem al passat per a honrar la nostra història, sino que liderem el present tecnològic. Som pioners en l'integració de rets descentralisades com <strong>Nostr</strong> y la ret <strong>Lightning de Bitcoin</strong> (Zaps). Això assegura que el nostre mensage siga incensurable i que la nostra comunitat d'oients puga interactuar i colaborar de manera lliure, directa i entre pars (P2P), sense dependre dels algoritmes opacs ni de la censura de les corporacions tradicionals d'internet.</p>
            </div>

            <!-- Contenido en Castellano -->
            <div id="about-content-es" style="display: none;">
                <h2 style="color: var(--secondary); text-transform: uppercase; font-weight: 800; text-align: center; margin-bottom: 20px;">¿Qué es Valencianismo Radio?</h2>
                <p><strong>Valencianismo Radio</strong> es un proyecto de comunicación digital libre, independiente y descentralizado, nacido con el único propósito de dar voz a la cultura, la historia y la actualidad del pueblo valenciano y del Valencia CF.</p>
                <p>En un entorno mediático donde nuestras raíces a menudo quedan diluidas, nuestra emisora se erige como un bastión para la defensa de las señas de identidad del <strong>Regne de Valéncia</strong>. Emitimos ininterrumpidamente las 24 horas del día, los 7 días de la semana, ofreciendo una cuidada selección de tertulias de actualidad, programas de análisis, humor tradicional y la mejor música autóctona.</p>
                <h3 style="color: #00d2ff; margin-top: 30px; border-bottom: 1px solid rgba(0,210,255,0.3); padding-bottom: 8px;">Nuestro Compromiso Lingüístico</h3>
                <p>El pilar fundamental de Valencianismo Radio es el respeto absoluto por nuestra lengua. Por ello, toda nuestra línea editorial, programación y textos escritos se rigen estrictamente por las <strong>Normes d'El Puig</strong> (ortografía oficial de la Real Acadèmia de Cultura Valenciana - RACV). Creemos firmemente que la protección y promoción de la genuina llengua valenciana pasa por su uso cotidiano, correcto y sin complejos en los nuevos formatos digitales.</p>
                <h3 style="color: #00d2ff; margin-top: 30px; border-bottom: 1px solid rgba(0,210,255,0.3); padding-bottom: 8px;">Tecnología y Descentralización</h3>
                <p>No solo miramos al pasado para honrar nuestra historia, sino que lideramos el presente tecnológico. Somos pioners en la integración de redes descentralizadas como <strong>Nostr</strong> y la red <strong>Lightning de Bitcoin</strong> (Zaps). Esto asegura que nuestro mensaje sea incensurable y que nuestra comunidad de oyentes pueda interactuar y colaborar de manera libre, directa y entre pares (P2P), sin depender de los algoritmos opacos ni la censura de las corporaciones tradicionales de internet.</p>
            </div>
        </div>
    </div>
"""

for fpath in html_files:
    if os.path.exists(fpath):
        with open(fpath, 'r') as f:
            content = f.read()
        
        # 1. Replace button onclick
        content = content.replace("onclick=\"window.location.href='about.html'\"", "onclick=\"document.getElementById('about-modal').classList.add('active')\"")
        
        # 2. Add Modal before closing body
        if 'id="about-modal"' not in content:
            content = content.replace('</body>', about_modal_html + '\n</body>')
            
        with open(fpath, 'w') as f:
            f.write(content)

# Update radio.js
js_path = 'js/radio.js'
with open(js_path, 'r') as f:
    js_content = f.read()

js_additions = """
    const aboutModal = document.getElementById("about-modal");
    const closeAboutBtn = document.getElementById("close-about");

    if (closeAboutBtn && aboutModal) {
        closeAboutBtn.addEventListener('click', () => {
            aboutModal.classList.remove("active");
        });
    }

    window.switchAboutLang = function(lang) {
        const va = document.getElementById('about-content-va');
        const es = document.getElementById('about-content-es');
        const btnVa = document.getElementById('about-btn-va');
        const btnEs = document.getElementById('about-btn-es');

        if (!va || !es) return;

        if (lang === 'va') {
            va.style.display = 'block';
            es.style.display = 'none';
            btnVa.style.background = 'var(--secondary)';
            btnVa.style.color = '#0a0a0f';
            btnVa.style.border = 'none';
            btnVa.style.boxShadow = '0 2px 10px rgba(255,215,0,0.3)';
            btnEs.style.background = 'rgba(255,255,255,0.1)';
            btnEs.style.color = '#fff';
            btnEs.style.border = '1px solid rgba(255,255,255,0.2)';
            btnEs.style.boxShadow = 'none';
        } else {
            es.style.display = 'block';
            va.style.display = 'none';
            btnEs.style.background = 'var(--secondary)';
            btnEs.style.color = '#0a0a0f';
            btnEs.style.border = 'none';
            btnEs.style.boxShadow = '0 2px 10px rgba(255,215,0,0.3)';
            btnVa.style.background = 'rgba(255,255,255,0.1)';
            btnVa.style.color = '#fff';
            btnVa.style.border = '1px solid rgba(255,255,255,0.2)';
            btnVa.style.boxShadow = 'none';
        }
    };
"""

if 'switchAboutLang' not in js_content:
    js_content = js_content.replace("if (closePaypalBtn) closePaypalBtn.addEventListener('click', () => {", js_additions + "\n    if (closePaypalBtn) closePaypalBtn.addEventListener('click', () => {")
    
    # Update ESC key close
    js_content = js_content.replace('if (paypalModal) paypalModal.classList.remove("active");', 'if (paypalModal) paypalModal.classList.remove("active");\n            if (aboutModal) aboutModal.classList.remove("active");')

with open(js_path, 'w') as f:
    f.write(js_content)

print("Actualizado.")
