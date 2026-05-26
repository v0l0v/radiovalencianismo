import sys
from PIL import Image

def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            min_val = min(r, g, b)
            
            if min_val == 255:
                pixels[x, y] = (255, 255, 255, 0)
            else:
                alpha = 255 - min_val
                alpha_norm = alpha / 255.0
                
                new_r = max(0, min(255, int((r - 255 * (1 - alpha_norm)) / alpha_norm)))
                new_g = max(0, min(255, int((g - 255 * (1 - alpha_norm)) / alpha_norm)))
                new_b = max(0, min(255, int((b - 255 * (1 - alpha_norm)) / alpha_norm)))
                
                pixels[x, y] = (new_r, new_g, new_b, alpha)

    img.save(output_path)

if __name__ == "__main__":
    process_image(sys.argv[1], sys.argv[2])
