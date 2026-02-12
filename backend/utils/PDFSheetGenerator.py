from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from datetime import datetime
from utils.BarcodeGenerator import BarcodeGenerator

class PDFSheetGenerator:
    def __init__(self, output_folder, template=None):
        self.output_folder = output_folder
        self.template = template or self._get_default_template()
        self.label_width = self.template['label_width_inches'] * inch
        self.label_height = self.template['label_height_inches'] * inch
        self.x_gap = self.template['x_gap_inches'] * inch
        self.y_gap = self.template['y_gap_inches'] * inch
        self.margin_left = self.template['margin_left_inches'] * inch
        self.margin_top = self.template['margin_top_inches'] * inch
        self.rows = self.template['rows'] 
        self.columns = self.template['columns']
        
    def generate_pdf_sheets(self, inventory):
        # Convert dict to list for indexing
        inventory_list = list(inventory.items())
        
        # Calculate sheets needed
        labels_per_sheet = self.rows * self.columns  # 20
        num_sheets = (len(inventory_list) + labels_per_sheet - 1) // labels_per_sheet
        
        sheet_files = []
        barcode_gen = BarcodeGenerator(self.template)
        
        # Generate each sheet
        for sheet_idx in range(num_sheets):
            # Create timestamp for unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_filename = f"label_sheet_{timestamp}_{sheet_idx + 1}.pdf"
            pdf_path = f"{self.output_folder}/{pdf_filename}"
            
            # Create PDF canvas
            c = canvas.Canvas(pdf_path, pagesize=LETTER)
            
            # Calculate label range for this sheet
            start = sheet_idx * labels_per_sheet
            end = min(start + labels_per_sheet, len(inventory_list))
            
            # Draw each label on this sheet
            for i in range(start, end):
                location, (part, unit) = inventory_list[i]
                
                # Calculate grid position
                position_in_sheet = i - start
                row = position_in_sheet // self.columns
                col = position_in_sheet % self.columns
                
                # Calculate x, y coordinates 
                x = self.margin_left + col * (self.label_width + self.x_gap)
                y = LETTER[1] - self.margin_top - (row + 1) * self.label_height - row * self.y_gap
                
                # Draw the label
                barcode_gen.draw_label_to_canvas(c, x, y, location, part, unit)
            
            # Save the PDF
            c.save()
            sheet_files.append(pdf_filename)
        
        return sheet_files
    
    def _get_default_template(self):
        from config.settings import Config
        return Config.LABEL_TEMPLATES[Config.DEFAULT_TEMPLATE]