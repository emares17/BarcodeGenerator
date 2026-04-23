import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import lightgrey
from datetime import datetime
from utils.BarcodeGenerator import BarcodeGenerator

class PDFSheetGenerator:
    DEBUG_GRID = False  # Set to False to hide label boundaries

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
        
    def generate_pdf_sheets(self, labels, barcode_type='code128'):
        # labels: list of (barcode_value, [(label, value), ...]) tuples

        # Calculate sheets needed
        labels_per_sheet = self.rows * self.columns
        num_sheets = (len(labels) + labels_per_sheet - 1) // labels_per_sheet

        sheet_files = []
        barcode_gen = BarcodeGenerator(self.template, barcode_type=barcode_type)

        # Calibrate uniform barWidth based on longest barcode value
        all_parts = [bv for bv, _ in labels]
        barcode_gen.calibrate(all_parts)

        # Generate each sheet
        for sheet_idx in range(num_sheets):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_filename = f"label_sheet_{timestamp}_{sheet_idx + 1}.pdf"
            pdf_path = f"{self.output_folder}/{pdf_filename}"

            c = canvas.Canvas(pdf_path, pagesize=LETTER)

            start = sheet_idx * labels_per_sheet
            end = min(start + labels_per_sheet, len(labels))

            if self.DEBUG_GRID:
                self._draw_debug_grid(c)

            for i in range(start, end):
                barcode_value, text_lines = labels[i]

                position_in_sheet = i - start
                row = position_in_sheet // self.columns
                col = position_in_sheet % self.columns

                x = self.margin_left + col * (self.label_width + self.x_gap)
                y = LETTER[1] - self.margin_top - (row + 1) * self.label_height - row * self.y_gap

                barcode_gen.draw_label_to_canvas(c, x, y, barcode_value, text_lines)

            c.save()
            sheet_files.append(pdf_filename)

        return sheet_files
    
    def _draw_debug_grid(self, c):
        c.setStrokeColor(lightgrey)
        c.setLineWidth(0.5)
        for row in range(self.rows):
            for col in range(self.columns):
                x = self.margin_left + col * (self.label_width + self.x_gap)
                y = LETTER[1] - self.margin_top - (row + 1) * self.label_height - row * self.y_gap
                c.rect(x, y, self.label_width, self.label_height)

    def generate_preview_sheet(self, labels, barcode_type='code128'):
        labels_per_sheet = self.rows * self.columns
        preview_labels = labels[:labels_per_sheet]

        barcode_gen = BarcodeGenerator(self.template, barcode_type=barcode_type)
        barcode_gen.calibrate([bv for bv, _ in labels])

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=LETTER)

        for i, (barcode_value, text_lines) in enumerate(preview_labels):
            row = i // self.columns
            col = i % self.columns
            x = self.margin_left + col * (self.label_width + self.x_gap)
            y = LETTER[1] - self.margin_top - (row + 1) * self.label_height - row * self.y_gap
            barcode_gen.draw_label_to_canvas(c, x, y, barcode_value, text_lines)

        c.save()
        buf.seek(0)
        return buf.read()

    def _get_default_template(self):
        from config.settings import Config
        return Config.LABEL_TEMPLATES[Config.DEFAULT_TEMPLATE]