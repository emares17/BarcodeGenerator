from PIL import Image, ImageDraw
import os

class LabelSheetGenerator:
    def __init__(self, label_width, label_height, gap, rows, colums, folder):
        self.label_width = label_width
        self.label_height = label_height
        self.gap = gap
        self.rows = rows
        self.columns = colums
        self.folder = folder
        self.total_width = int((self.label_width + self.gap) * self.columns)
        self.total_height = int((self.label_height + self.gap) * self.rows)
    
    def generate_sheet(self):
        images_folder = self.folder
        image_files = image_files = [f for f in os.listdir(images_folder) if f.endswith('.png')]
        num_images = len(image_files)

        num_sheets = (num_images + (self.rows * self.columns) - 1) // (self.rows * self.columns)

        for sheet_idx in range(num_sheets):
            sheet = Image.new("RGB", (self.total_width, self.total_height), "white")
            draw = ImageDraw.Draw(sheet)

            for row in range(self.rows):
                for col in range(self.columns):
                    image_idx = sheet_idx * self.rows * self.columns + row * self.columns + col
                    if image_idx < num_images:
                        x = col * (self.label_width + self.gap)
                        y = row * (self.label_height + self.gap)
                        image_file = os.path.join(images_folder, image_files[image_idx])
                        label_image = Image.open(image_file)
                        label_image = label_image.resize((int(self.label_width), int(self.label_height)))
                        sheet.paste(label_image, (int(x), int(y)))

            sheet.save(f"label_sheet_{sheet_idx + 1}.png")