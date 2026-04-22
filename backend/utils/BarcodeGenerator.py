from reportlab.graphics.barcode import code128
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics import renderPDF
from reportlab.graphics.shapes import Drawing
from reportlab.lib.units import inch

class BarcodeGenerator:
    def __init__(self, template=None, barcode_type='code128'):
        self.template = template
        self.barcode_type = barcode_type
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
        if self.barcode_type != 'code128':
            return
        longest = max(len(v) for v in values)
        num_modules = 11 + (longest * 11) + 11 + 13
        usable_width = self.label_width - (2 * self.padding_x)
        self.bar_width = usable_width / num_modules

    def draw_label_to_canvas(self, canvas, x, y, barcode_value, text_lines):
        if self.barcode_type == 'qr':
            usable_width = self.label_width - (2 * self.padding_x)
            qr_size = min(self.barcode_height_inches, usable_width)

            qr = QrCodeWidget(barcode_value)
            bounds = qr.getBounds()
            raw_w = bounds[2] - bounds[0]
            raw_h = bounds[3] - bounds[1]

            d = Drawing(qr_size, qr_size, transform=[qr_size / raw_w, 0, 0, qr_size / raw_h, 0, 0])
            d.add(qr)

            qr_x = x + (self.label_width - qr_size) / 2
            renderPDF.draw(d, canvas, qr_x, y + self.barcode_offset_y)
        else:
            barcode = code128.Code128(value=barcode_value,
                                      barHeight=self.barcode_height_inches,
                                      barWidth=self.bar_width)
            barcode_x = x + (self.label_width - barcode.width) / 2
            barcode.drawOn(canvas, barcode_x, y + self.barcode_offset_y)

        canvas.setFont(self.font, self.font_size)
        label_center_x = x + self.label_width / 2
        for i, (label, value) in enumerate(text_lines[:self.max_text_lines]):
            canvas.drawCentredString(label_center_x, y + self.text_start_y - (i * self.text_line_spacing), f"{label}: {value}")
