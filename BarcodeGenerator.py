from barcode import Code128
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import os

class BarcodeGenerator:
    def __init__(self, width_inches, height_inches, dpi, inventory, folder):
        self.width_inches = width_inches
        self.height_inches = height_inches
        self.dpi = dpi
        self.inventory = inventory
        self.folder = folder

    def draw(self, image, font_size, text):
        draw = ImageDraw.Draw(image)
        font = ImageFont.truetype("arial.ttf", font_size)
        
        draw_text = text
        textbbox = draw.textbbox((0, 0), draw_text, font=font)

        text_x = (image.width - (textbbox[2] - textbbox[0])) / 2
        text_y = image.height - (textbbox[3] - textbbox[1]) * 3

        draw.text((text_x, text_y), draw_text, fill='black', font = font)

    def generate_image(self):
        width_pixels = int(self.width_inches * self.dpi)
        height_pixels = int(self.height_inches * self.dpi)

        for i, (location, part) in enumerate(self.inventory.items()):
            jpeg_filename = f"{self.folder}/{location.replace('-', '')}.jpeg"
            
            with open(jpeg_filename, "wb") as f:
                code128 = Code128(part, writer=ImageWriter()).write(f)

            image = Image.open(jpeg_filename)
            image = image.resize((width_pixels, height_pixels))

            self.draw(image, 70, location)

            png_filename = f'{self.folder}/{location.replace("-", "")}.png'

            image.save(png_filename)

            os.remove(jpeg_filename)