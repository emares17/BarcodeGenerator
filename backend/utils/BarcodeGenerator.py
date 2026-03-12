from reportlab.graphics.barcode import code128
from reportlab.lib.units import inch

class BarcodeGenerator:
    def __init__(self, template=None):
        self.template = template
        self.barcode_height_inches = self.template['barcode_height_inches'] * inch
        self.barcode_offset_y = self.template['barcode_offset_y_inches'] * inch
        self.text_start_y = self.template['text_start_y_inches'] * inch
        self.text_line_spacing = self.template['text_line_spacing_inches'] * inch
        self.font = self.template['font']
        self.font_size = self.template['font_size']
        self.label_width = self.template['label_width_inches'] * inch
        self.padding_x = self.template.get('padding_x_inches', 0.1) * inch
        self.max_text_lines = self.template.get('max_text_lines', 2)
        self.bar_width = None

    def calibrate(self, values):
        """Calculate a uniform barWidth based on the longest value in the dataset."""
        longest = max(len(v) for v in values)
        num_modules = 11 + (longest * 11) + 11 + 13
        usable_width = self.label_width - (2 * self.padding_x)
        max_barcode_width = usable_width
        self.bar_width = max_barcode_width / num_modules

    def draw_label_to_canvas(self, canvas, x, y, barcode_value, text_lines):
        # Create barcode with uniform barWidth
        barcode = code128.Code128(value=barcode_value,
                                  barHeight=self.barcode_height_inches,
                                  barWidth=self.bar_width
                                )

        # Center barcode horizontally within the label
        barcode_width = barcode.width
        barcode_x = x + (self.label_width - barcode_width) / 2

        # Draw barcode centered
        barcode.drawOn(canvas, barcode_x, y + self.barcode_offset_y)

        # Draw text lines centered in label
        canvas.setFont(self.font, self.font_size)
        label_center_x = x + self.label_width / 2
        for i, (label, value) in enumerate(text_lines[:self.max_text_lines]):
            canvas.drawCentredString(label_center_x, y + self.text_start_y - (i * self.text_line_spacing), f"{label}: {value}")
