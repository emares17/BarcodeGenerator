from barcode import Code128
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import os

class BarcodeGenerator:

    _font_cache = {}

    def __init__(self, width_inches, height_inches, dpi, inventory, folder):
        self.width_inches = width_inches
        self.height_inches = height_inches
        self.dpi = dpi
        self.inventory = inventory
        self.folder = folder

    def get_font(self, font_size):

        if font_size in BarcodeGenerator._font_cache:
            return BarcodeGenerator._font_cache[font_size]
    
        fonts_to_try = [
            # Full paths for Linux (Docker)
            "/usr/share/fonts/truetype/msttcorefonts/Arial.TTF",
            "/usr/share/fonts/truetype/msttcorefonts/arial.ttf",
            # Case variations for different systems
            "Arial.TTF",           # Linux with fontconfig
            "arial.ttf",           # Windows
            "Arial.ttf",           # Windows alt
            # Fallback fonts
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "DejaVuSans.ttf",      # Linux
            # macOS
            "Helvetica.ttc",       
            "/System/Library/Fonts/Arial.ttf"
        ]
    
        for font_path in fonts_to_try:
            try:
                font = ImageFont.truetype(font_path, font_size)
                print(f"Found font: {font_path}")
                BarcodeGenerator._font_cache[font_size] = font
                return font  
            except (OSError, IOError):
                print(f"Failed font: {font_path}")
                continue

        print(f"Warning: No TrueType fonts found. Using default font.")
        default_font = ImageFont.load_default()
        BarcodeGenerator._font_cache[font_size] = default_font
        return default_font

    def draw(self, image, font_size, text, text2):
        draw = ImageDraw.Draw(image)
        font = self.get_font(font_size)
        
        draw_text = f'Location: {text}\nUnit: {text2}'
        textbbox = draw.textbbox((0, 0), draw_text, font=font)

        text_width = textbbox[2] - textbbox[0]
        text_height = textbbox[3] - textbbox[1]

        text_x = (image.width - text_width) / 2
        text_y = image.height - text_height - 30

        draw.text((text_x, text_y), draw_text, fill='black', font = font)

    def generate_image(self, location, part, unit, folder):
        # Generate barcode directly to PNG
        png_filename = f'{folder}/{location.replace("-", "")}.png'
    
        # Use ImageWriter to generate directly at target size
        writer = ImageWriter()
        code128 = Code128(part, writer=writer)
        code128.save(png_filename[:-4], options= {
            'font_size': 8,
            'center_text': True,
            'module_height': 10.0,
            'write_text': True,
            'text_distance': 3.7,
            'quiet_zone': 5.0,   
        })  
    
        image = Image.open(png_filename)

        width = image.width
        extra_height = 50
        new_height = image.height + extra_height

        new_image = Image.new('RGB', (width, new_height), 'white')
        new_image.paste(image, (0, 0))


        self.draw(new_image, 25, location, unit)
        new_image.save(png_filename, dpi=(600, 600))
    
        return True