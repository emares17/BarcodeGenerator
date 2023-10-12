from barcode import Code128
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import os
import PyPDF2

pdf_merger = PyPDF2.PdfMerger()

inventory_dict = {
    "C01-001-01-01": '123-135345f',
    "C01-001-01-02": '123-135345g',
    "C01-001-01-03": '123-135345h',
    "C01-001-01-04": '123-135345i',
    "C01-001-01-05": '123-135345j',
    "C01-001-01-06": '123-135345k',
    "C01-001-01-07": '123-135345l',
    "C01-001-01-08": '123-135345m',
    "C01-001-01-09": '123-135345n',
    "C01-001-01-10": '123-135345o',
    "C01-001-01-11": '123-135345p',
    "C01-001-01-12": '123-135345q',
    "C01-001-01-13": '123-135345r',
    "C01-001-01-14": '123-135345s',
    "C01-001-01-15": '123-135345t',
    "C01-001-01-16": '123-135345u',
    "C01-001-01-17": '123-135345v',
    "C01-001-01-18": '123-135345w',
    "C01-001-01-19": '123-135345x',
    "C01-001-01-20": '123-135345y'
}


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
        text_y = (image.height - (textbbox[3] - textbbox[1])) - 20

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

            self.draw(image, 30, location)

            png_filename = f'{self.folder}/{location.replace("-", "")}.png'

            image.save(png_filename)

            os.remove(jpeg_filename)


generator = BarcodeGenerator(width_inches=1.5, height_inches=1.0, dpi=300, inventory=inventory_dict, folder="images")

generator.generate_image()

label_width = 200 
label_height = 180  
gap = 0.25  
rows = 4
columns = 5

total_width = int((label_width + gap) * columns)
total_height = int((label_height + gap) * rows)

image = Image.new("RGB", (total_width, total_height), "white")
draw = ImageDraw.Draw(image)

images_folder = "images"

image_files = [f for f in os.listdir(images_folder) if f.endswith('.png')]

if len(image_files) >= rows * columns:
    for row in range(rows):
        for col in range(columns):
            x = col * (label_width + gap)
            y = row * (label_height + gap)
            image_file = os.path.join(images_folder, image_files[row * columns + col])
            label_image = Image.open(image_file)
            label_image = label_image.resize((int(label_width), int(label_height)))
            image.paste(label_image, (int(x), int(y)))
else:
    print("Not enough images in the folder for the specified layout.")

image.save("label_sheet.png")