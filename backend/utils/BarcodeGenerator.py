from reportlab.graphics.barcode import code128
from reportlab.lib.units import inch

class BarcodeGenerator:
    def __init__(self, template=None):
        self.template = template
        self.barcode_width_ratio = self.template['barcode_width_ratio'] 
        self.barcode_height_inches = self.template['barcode_height_inches'] * inch
        self.barcode_offset_y = self.template['barcode_offset_y_inches'] * inch
        self.text_start_y = self.template['text_start_y_inches'] * inch
        self.text_line_spacing = self.template['text_line_spacing_inches'] * inch
        self.font = self.template['font']
        self.font_size = self.template['font_size']

    def draw_label_to_canvas(self, canvas, x, y, location, part, unit):
        # Create barcode
        barcode = code128.Code128(value=part, 
                                  barHeight=self.barcode_height_inches, 
                                  barWidth=self.barcode_width_ratio
                                )

        # Draw barcode directly to canvas (Code128 has drawOn method)
        barcode.drawOn(canvas, x, y + self.barcode_offset_y)

        # Draw text below barcode
        canvas.setFont(self.font, self.font_size)
        canvas.drawString(x, y + self.text_start_y, f'Location: {location}')
        canvas.drawString(x, y + self.text_start_y - self.text_line_spacing, f'Unit: {unit}')