import io
import pytest
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from config.settings import Config
from utils.BarcodeGenerator import BarcodeGenerator

TEMPLATE_IDS = ['standard_20', '5163', '5160', '94233']


def make_canvas():
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    return c, buf


def get_template(template_id='standard_20'):
    return Config.LABEL_TEMPLATES[template_id]


@pytest.mark.unit
def test_calibrate_code128_sets_bar_width():
    gen = BarcodeGenerator(get_template(), barcode_type='code128')
    gen.calibrate(['SKU001', 'SKU002', 'LONGSKU99999'])
    assert gen.bar_width is not None
    assert gen.bar_width > 0


@pytest.mark.unit
def test_calibrate_qr_skips_calculation():
    gen = BarcodeGenerator(get_template(), barcode_type='qr')
    gen.calibrate(['SKU001', 'SKU002'])
    assert gen.bar_width is None


@pytest.mark.unit
def test_calibrate_empty_list_raises():
    gen = BarcodeGenerator(get_template(), barcode_type='code128')
    with pytest.raises(ValueError):
        gen.calibrate([])


@pytest.mark.unit
def test_draw_label_code128_does_not_raise():
    gen = BarcodeGenerator(get_template(), barcode_type='code128')
    gen.calibrate(['SKU001'])
    c, _ = make_canvas()
    gen.draw_label_to_canvas(c, 0, 0, 'SKU001', [('Location', 'A-01')])
    c.save()


@pytest.mark.unit
def test_draw_label_qr_does_not_raise():
    gen = BarcodeGenerator(get_template(), barcode_type='qr')
    c, _ = make_canvas()
    gen.draw_label_to_canvas(c, 0, 0, 'SKU001', [('Location', 'A-01')])
    c.save()


@pytest.mark.unit
def test_text_lines_respect_max_text_lines():
    template = get_template('standard_20')
    assert template['max_text_lines'] == 2
    gen = BarcodeGenerator(template, barcode_type='code128')
    gen.calibrate(['SKU001'])
    c, buf = make_canvas()
    # Pass 4 text lines — only 2 should be drawn (no error, just truncated)
    gen.draw_label_to_canvas(c, 0, 0, 'SKU001', [
        ('Col1', 'val1'), ('Col2', 'val2'), ('Col3', 'val3'), ('Col4', 'val4')
    ])
    c.save()
    buf.seek(0)
    assert buf.read(4) == b'%PDF'


@pytest.mark.unit
@pytest.mark.parametrize('template_id', TEMPLATE_IDS)
def test_all_templates_construct_without_keyerror(template_id):
    template = Config.LABEL_TEMPLATES[template_id]
    gen = BarcodeGenerator(template, barcode_type='code128')
    assert gen.label_width > 0
    assert gen.label_height > 0


@pytest.mark.unit
def test_draw_label_empty_barcode_does_not_raise():
    gen = BarcodeGenerator(get_template(), barcode_type='qr')
    c, _ = make_canvas()
    gen.draw_label_to_canvas(c, 0, 0, '', [])
    c.save()


@pytest.mark.unit
def test_draw_label_long_barcode_does_not_raise():
    gen = BarcodeGenerator(get_template(), barcode_type='code128')
    long_value = 'A' * 100
    gen.calibrate([long_value])
    c, _ = make_canvas()
    gen.draw_label_to_canvas(c, 0, 0, long_value, [])
    c.save()


@pytest.mark.unit
def test_draw_label_no_text_lines_does_not_raise():
    gen = BarcodeGenerator(get_template(), barcode_type='code128')
    gen.calibrate(['SKU001'])
    c, _ = make_canvas()
    gen.draw_label_to_canvas(c, 0, 0, 'SKU001', [])
    c.save()
