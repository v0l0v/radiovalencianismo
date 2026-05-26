from PIL import Image, ImageDraw

img = Image.open('assets/fuego_realista.png').convert("RGBA")
ImageDraw.floodfill(img, (0,0), (255, 255, 255, 0), thresh=50)
ImageDraw.floodfill(img, (img.width-1, 0), (255, 255, 255, 0), thresh=50)
ImageDraw.floodfill(img, (0, img.height-1), (255, 255, 255, 0), thresh=50)
ImageDraw.floodfill(img, (img.width-1, img.height-1), (255, 255, 255, 0), thresh=50)

img.save('assets/fuego_realista_transparent.png')
print("Done")
