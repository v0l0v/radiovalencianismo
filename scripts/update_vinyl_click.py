import os
import re

html_files = ['index.html', 'index_movil.html', 'index_movil_sec.html', 'index_sec.html']

for html_file in html_files:
    if os.path.exists(html_file):
        with open(html_file, 'r') as f:
            content = f.read()
        
        # Modify Tooltip
        content = re.sub(
            r'<strong>Doble clic:</strong> Historial<br>\s*<span class="tooltip-sub">Descubre lo que ha sonado antes</span>',
            '<strong>Clic:</strong> Parar/Girar<br><strong>Doble clic:</strong> Info del disco',
            content
        )
        
        # Modify History panel header
        content = content.replace('>HISTORIAL</h3>', '>INFORMACIÓN</h3>')
        
        # Add track info container inside history panel
        info_container_html = '''
                <div id="track-info-container" style="display: flex; flex-direction: column; align-items: center; gap: 15px; text-align: center; margin-top: 10px; margin-bottom: 20px;">
                    <img id="info-cover" src="assets/logoVR.png" style="width: 140px; height: 140px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); object-fit: cover;">
                    <div style="flex: 1;">
                        <h4 id="info-title" style="margin: 0 0 5px 0; font-size: 1.2rem; font-weight: bold; color: #fff;">Cargando...</h4>
                        <p id="info-artist" style="margin: 0; font-size: 1rem; color: #ffd700; opacity: 0.8;">Valencianismo Radio</p>
                    </div>
                </div>
                '''
        
        # Inject info_container_html before the history-list if it doesn't exist
        if 'id="track-info-container"' not in content:
            content = content.replace('<ul class="modern-history-list" id="history-list">', info_container_html + '\n                <ul class="modern-history-list" id="history-list" style="display:none;">')
        
        with open(html_file, 'w') as f:
            f.write(content)

# Update style-v2.css
css_file = 'css/style-v2.css'
with open(css_file, 'r') as f:
    css_content = f.read()

if '.paused-by-user' not in css_content:
    css_addition = '''
.vinyl-wrapper.paused-by-user {
    animation: none !important;
    transform: rotate(0deg) !important;
}
'''
    css_content += css_addition
    with open(css_file, 'w') as f:
        f.write(css_content)

# Update radio.js
js_file = 'js/radio.js'
with open(js_file, 'r') as f:
    js_content = f.read()

# Replace the vinylBtn event listener
js_replacement = '''
    if (vinylBtn) {
        let clickTimer;
        vinylBtn.addEventListener('click', (e) => {
            if (e.detail === 1) {
                clickTimer = setTimeout(() => {
                    vinylWrapper.classList.toggle('paused-by-user');
                }, 250);
            }
        });
        vinylBtn.addEventListener('dblclick', (e) => {
            clearTimeout(clickTimer);
            document.querySelector('.history-panel').classList.toggle('active');
        });
    }
'''

js_content = re.sub(
    r'if \(vinylBtn\) \{[\s\S]*?vinylBtn\.addEventListener\(\'click\', \(\) => \{[\s\S]*?\}\);[\s\S]*?\}',
    js_replacement.strip(),
    js_content
)

# In updateMetadata, we also need to update the info-cover, info-title, and info-artist
metadata_update_injection = '''
                    if (document.getElementById('info-title')) {
                        let infoTitle = "Desconocido";
                        let infoArtist = "Valencianismo Radio";
                        if (currentSongName.includes(' - ')) {
                            const parts = currentSongName.split(' - ');
                            infoArtist = parts[0];
                            infoTitle = parts.slice(1).join(' - ');
                        } else {
                            infoTitle = currentSongName;
                        }
                        document.getElementById('info-title').textContent = infoTitle;
                        document.getElementById('info-artist').textContent = infoArtist;
                        if (coverImage) {
                            document.getElementById('info-cover').src = coverImage.src;
                        }
                    }
'''
if "document.getElementById('info-title')" not in js_content:
    js_content = js_content.replace('updateHistory(currentSongName);', 'updateHistory(currentSongName);\n' + metadata_update_injection)


with open(js_file, 'w') as f:
    f.write(js_content)

print("Actualización completada en archivos locales.")
