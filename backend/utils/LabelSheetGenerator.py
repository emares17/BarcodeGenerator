from PIL import Image
import os
import concurrent.futures
from datetime import datetime

def load_and_resize_image(image_path, target_width, target_height):
    try:
        image = Image.open(image_path)
        resized = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
        image.close()  
        return resized
    except Exception as e:
        print(f"Error loading {image_path}: {e}")
        return None

class LabelSheetGenerator:
    def __init__(self, label_width, label_height, x_gap, y_gap, rows, columns, folder):
        self.label_width = int(label_width)
        self.label_height = int(label_height)
        self.x_gap = x_gap
        self.y_gap = y_gap
        self.rows = rows
        self.columns = columns
        self.folder = folder
        self.total_width = int((self.label_width + self.x_gap) * self.columns)
        self.total_height = int((self.label_height + self.y_gap) * self.rows)

    def generate_sheet(self):
        image_files = [f for f in os.listdir(self.folder) if f.endswith('.png')]
        num_images = len(image_files)
        labels_per_sheet = self.rows * self.columns
        num_sheets = (num_images + labels_per_sheet - 1) // labels_per_sheet
        cpu_cores = os.cpu_count()

        max_workers = min(6, cpu_cores - 1)

        for sheet_idx in range(num_sheets):
            start_idx = sheet_idx * labels_per_sheet
            end_idx = min(start_idx + labels_per_sheet, num_images)
            sheet_image_files = image_files[start_idx:end_idx]
            
            # Parallel image loading
            with concurrent.futures.ThreadPoolExecutor(max_workers) as executor:
                image_paths = [os.path.join(self.folder, f) for f in sheet_image_files]
                loaded_images = list(executor.map(
                    lambda path: load_and_resize_image(path, self.label_width, self.label_height),
                    image_paths
                ))
            
            loaded_images = [img for img in loaded_images if img is not None]
            sheet = Image.new("RGB", (self.total_width, self.total_height), "white")
            
            for i, image in enumerate(loaded_images):
                row = i // self.columns
                col = i % self.columns
                x = int(col * (self.label_width + self.x_gap) + (self.x_gap / 2))
                y = int(row * (self.label_height + self.y_gap) + 55)
                
                sheet.paste(image, (x, y))
                image.close()  
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            sheet.save(f"label_sheet_{timestamp}_{sheet_idx + 1}.png", dpi=(600, 600))
            sheet.close()