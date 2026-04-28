import sys
import mutagen
from mutagen.easyid3 import EasyID3
import os

if len(sys.argv) < 4:
    print("Usage: python3 tagger.py <file_path> <artist> <title>")
    sys.exit(1)

filepath = sys.argv[1]
artist = sys.argv[2]
title = sys.argv[3]

if not os.path.exists(filepath):
    print(f"Error: File not found - {filepath}")
    sys.exit(1)

try:
    audio = EasyID3(filepath)
except mutagen.id3.ID3NoHeaderError:
    # If no ID3 header exists, create one
    audio = mutagen.File(filepath, easy=True)
    audio.add_tags()
except Exception as e:
    # Fallback to standard mutagen
    audio = mutagen.File(filepath, easy=True)
    if audio is None:
        print(f"Error: {filepath} is not a valid or supported audio file.")
        sys.exit(1)
    try:
        audio.add_tags()
    except Exception:
        pass

audio['artist'] = artist
audio['title'] = title
audio.save()

print(f"Success: Tagged '{filepath}' with Artist='{artist}' and Title='{title}'")
