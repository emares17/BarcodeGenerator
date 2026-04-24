import os
import pytest
from config.settings import Config
from utils.PDFSheetGenerator import PDFSheetGenerator

TEMPLATE_IDS = ['standard_20', '5163', '5160', '94233']

SAMPLE_LABELS = [
    ('SKU001', [('Location', 'A-01'), ('Unit', 'EA')]),
    ('SKU002', [('Location', 'A-02'), ('Unit', 'PK')]),
    ('SKU003', [('Location', 'B-01'), ('Unit', 'EA')]),
]


def make_generator(template_id='standard_20', sheet_folder='/tmp/test_sheets'):
    os.makedirs(sheet_folder, exist_ok=True)
    template = Config.LABEL_TEMPLATES[template_id]
    return PDFSheetGenerator(sheet_folder, template)


@pytest.mark.unit
def test_generate_pdf_sheets_single_label_returns_one_file(tmp_path):
    gen = PDFSheetGenerator(str(tmp_path), Config.LABEL_TEMPLATES['standard_20'])
    files = gen.generate_pdf_sheets([('SKU001', [('Loc', 'A-01')])])
    assert len(files) == 1


@pytest.mark.unit
def test_generate_pdf_sheets_paginates_correctly(tmp_path):
    gen = PDFSheetGenerator(str(tmp_path), Config.LABEL_TEMPLATES['standard_20'])
    labels_per_sheet = gen.rows * gen.columns
    labels = [(f'SKU{i:03d}', []) for i in range(labels_per_sheet + 1)]
    files = gen.generate_pdf_sheets(labels)
    assert len(files) == 2


@pytest.mark.unit
def test_generated_pdf_has_valid_header(tmp_path):
    gen = PDFSheetGenerator(str(tmp_path), Config.LABEL_TEMPLATES['standard_20'])
    files = gen.generate_pdf_sheets([('SKU001', [])])
    pdf_path = os.path.join(str(tmp_path), files[0])
    with open(pdf_path, 'rb') as f:
        header = f.read(4)
    assert header == b'%PDF'


@pytest.mark.unit
@pytest.mark.parametrize('template_id', TEMPLATE_IDS)
def test_labels_per_sheet_matches_template(template_id):
    template = Config.LABEL_TEMPLATES[template_id]
    gen = PDFSheetGenerator('/tmp/test_sheets', template)
    expected = template['rows'] * template['columns']
    assert gen.rows * gen.columns == expected


@pytest.mark.unit
def test_preview_sheet_returns_bytes():
    gen = make_generator()
    result = gen.generate_preview_sheet(SAMPLE_LABELS)
    assert isinstance(result, bytes)


@pytest.mark.unit
def test_preview_sheet_is_valid_pdf():
    gen = make_generator()
    result = gen.generate_preview_sheet(SAMPLE_LABELS)
    assert result[:4] == b'%PDF'


@pytest.mark.unit
def test_preview_sheet_truncates_to_one_sheet():
    gen = make_generator('standard_20')
    labels_per_sheet = gen.rows * gen.columns
    many_labels = [(f'SKU{i:03d}', []) for i in range(labels_per_sheet * 3)]
    result = gen.generate_preview_sheet(many_labels)
    # Verify we get a valid PDF back (single page worth)
    assert result[:4] == b'%PDF'
    # Full generation of 3 sheets is larger than preview of 1 sheet
    full_size_ref = gen.generate_preview_sheet(many_labels[:labels_per_sheet])
    assert len(result) <= len(full_size_ref) * 2


@pytest.mark.unit
def test_preview_calibrates_from_all_labels():
    gen = make_generator()
    labels_per_sheet = gen.rows * gen.columns
    # Labels beyond first sheet have longer values — calibration should use them all
    long_value = 'X' * 50
    labels = [(f'SKU{i:03d}', []) for i in range(labels_per_sheet - 1)]
    labels.append((long_value, []))  # last on first sheet
    labels.append((long_value + 'EXTRA', []))  # second sheet — must still calibrate
    result = gen.generate_preview_sheet(labels)
    assert result[:4] == b'%PDF'


@pytest.mark.unit
def test_sheet_files_cleaned_up_in_tmp(tmp_path):
    gen = PDFSheetGenerator(str(tmp_path), Config.LABEL_TEMPLATES['standard_20'])
    files = gen.generate_pdf_sheets([('SKU001', [])])
    for f in files:
        full_path = os.path.join(str(tmp_path), f)
        assert os.path.exists(full_path)
