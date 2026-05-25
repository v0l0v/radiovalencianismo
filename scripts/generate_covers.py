import os
from mutagen.mp3 import MP3
from mutagen.id3 import ID3
from PIL import Image
import io

src_dir = 'backend/mp3/generico'
dest_dir = 'assets/covers'

os.makedirs(dest_dir, exist_ok=True)

count = 0
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.mp3'):
            file_path = os.path.join(root, file)
            try:
                audio = MP3(file_path, ID3=ID3)
                title = audio.tags.get('TIT2', None)
                artist = audio.tags.get('TPE1', None)
                
                # Format "Artist - Title" or fallback to filename
                if artist and title:
                    song_name = f"{artist.text[0]} - {title.text[0]}"
                elif title:
                    song_name = title.text[0]
                else:
                    song_name = os.path.splitext(file)[0]
                
                # Sanitize name
                song_name = song_name.replace('/', '_').strip()
                
                # Extract APIC
                if audio.tags:
                    apics = [tag for tag in audio.tags.keys() if tag.startswith('APIC')]
                    if apics:
                        apic = audio.tags[apics[0]] # Get first image
                        image_data = apic.data
                        
                        # Convert to JPG and save
                        image = Image.open(io.BytesIO(image_data))
                        if image.mode != 'RGB':
                            image = image.convert('RGB')
                        
                        save_path = os.path.join(dest_dir, f"{song_name}.jpg")
                        image.thumbnail((600, 600)) # Resize to max 600x600 to save space
                        image.save(save_path, 'JPEG', quality=85)
                        count += 1
            except Exception as e:
                print(f"Error processing {file}: {e}")

print(f"✅ Se han extraído y guardado {count} carátulas en {dest_dir}/")
