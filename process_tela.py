import sys
from PIL import Image, ImageDraw, ImageFilter

def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Create a radial mask
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # We want to keep the hole and the immediate burnt edges.
    # The hole is about 50% of the image. 
    # Radius of 40% will cover it, and blur will feather it.
    center = (width//2, height//2)
    radius = int(min(width, height) * 0.40)
    draw.ellipse((center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius), fill=255)

    # blur the mask to make it soft
    mask = mask.filter(ImageFilter.GaussianBlur(radius=50))

    pixels = img.load()
    mask_pixels = mask.load()

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            min_val = min(r, g, b)
            
            if min_val > 250: # Basically white
                pixels[x, y] = (0, 0, 0, 0)
            else:
                alpha_from_white = 255 - min_val
                alpha_norm = max(0.01, alpha_from_white / 255.0) # avoid division by zero
                
                new_r = max(0, min(255, int((r - 255 * (1 - alpha_norm)) / alpha_norm)))
                new_g = max(0, min(255, int((g - 255 * (1 - alpha_norm)) / alpha_norm)))
                new_b = max(0, min(255, int((b - 255 * (1 - alpha_norm)) / alpha_norm)))
                
                # combine alphas: the white-removal alpha AND the radial mask
                final_alpha = int((alpha_from_white / 255.0) * (mask_pixels[x, y] / 255.0) * 255)
                
                pixels[x, y] = (new_r, new_g, new_b, final_alpha)

    img.save(output_path)

if __name__ == "__main__":
    process_image(sys.argv[1], sys.argv[2])
