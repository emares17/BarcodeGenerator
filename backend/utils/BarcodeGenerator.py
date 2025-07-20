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

    def get_font(self, font_size):
    
        fonts_to_try = [
            "/usr/share/fonts/truetype/arial.ttf"
            "arial.ttf",           # Windows
            "Arial.ttf",           # Windows alt
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Docker first
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",  # Docker backup
            "DejaVuSans.ttf",      # Linux
            "Helvetica.ttc",       # macOS
            "/System/Library/Fonts/Arial.ttf"  # macOS path
        ]
    
        for font_path in fonts_to_try:
            try:
                font = ImageFont.truetype(font_path, font_size)
                print(f"Found font: {font_path}")
                return font 
            except (OSError, IOError):
                print(f"Failed font: {font_path}")
                continue
        print("Using default font")
        return ImageFont.load_default()  

    def draw(self, image, font_size, text, text2):
        draw = ImageDraw.Draw(image)
        font = self.get_font(font_size)
        
        draw_text = f'Location: {text}\nUnit: {text2}'
        textbbox = draw.textbbox((0, 0), draw_text, font=font)

        text_x = (image.width - (textbbox[2] - textbbox[0])) / 2
        text_y = image.height - (textbbox[3] - textbbox[1]) * 1.2

        draw.text((text_x, text_y), draw_text, fill='black', font = font)

    def generate_image(self, location, part, unit, folder):
        width_pixels = int(self.width_inches * self.dpi)
        height_pixels = int(self.height_inches * self.dpi)

        jpeg_filename = f"{folder}/{location.replace('-', '')}.jpeg"

        with open(jpeg_filename, "wb") as f:
            code128 = Code128(part, writer=ImageWriter()).write(f)

        image = Image.open(jpeg_filename)
        image = image.resize((width_pixels, height_pixels), Image.Resampling.LANCZOS)

        self.draw(image, 85, location, unit)
        png_filename = f'{folder}/{location.replace("-", "")}.png'

        image.save(png_filename, dpi=(600, 600))

        os.remove(jpeg_filename)
