from reportlab.graphics.barcode import code128
from reportlab.lib.units import inch

class BarcodeGenerator:

    # Changes to be made here later on, this will take in template values instead of hardcoded values.
    def __init__(self, width_inches, height_inches, dpi, inventory, folder):
        self.width_inches = width_inches
        self.height_inches = height_inches
        self.dpi = dpi
        self.inventory = inventory
        self.folder = folder

    def draw_label_to_canvas(self, canvas, x, y, location, part, unit):
        """Draw a single label with barcode and text to the canvas at position (x, y)."""
        # Create barcode
        barcode = code128.Code128(value=part, barHeight=0.8*inch, barWidth=1.5)

        # Draw barcode directly to canvas (Code128 has drawOn method)
        barcode.drawOn(canvas, x, y + 0.5*inch)

        # Draw text below barcode
        canvas.setFont('Helvetica', 10)
        canvas.drawString(x, y + 0.3*inch, f'Location: {location}')
        canvas.drawString(x, y + 0.1*inch, f'Unit: {unit}')

        return canvas