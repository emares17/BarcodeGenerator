import base64
import io
import pytest
from unittest.mock import MagicMock, patch


CSV_HEADER = b"Location,Barcode,Name,Unit\n"
CSV_ROWS = b"Aisle-01,SKU001,Widget A,EA\nAisle-02,SKU002,Widget B,EA\nAisle-03,SKU003,Widget C,PK\n"
VALID_CSV = CSV_HEADER + CSV_ROWS

COLUMN_MAPPING = {
    'barcode_column': 1,
    'text_columns': [
        {'column': 0, 'label': 'Location'},
        {'column': 3, 'label': 'Unit'},
    ],
    'has_header_row': True,
}


def make_file(content=VALID_CSV, filename='test.csv'):
    f = io.BytesIO(content)
    f.filename = filename
    # Simulate werkzeug FileStorage.save() used by label_service
    def save(filepath):
        f.seek(0)
        with open(filepath, 'wb') as out:
            out.write(f.read())
        f.seek(0)
    f.save = save
    return f


@pytest.mark.unit
def test_preview_returns_expected_keys(app):
    with app.app_context():
        from services.label_service import generate_label_preview
        result = generate_label_preview(
            make_file(), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping=COLUMN_MAPPING,
        )
    assert {'preview_pdf', 'label_count', 'total_sheets', 'labels_on_first_sheet'} == set(result.keys())


@pytest.mark.unit
def test_preview_pdf_is_valid_base64_pdf(app):
    with app.app_context():
        from services.label_service import generate_label_preview
        result = generate_label_preview(
            make_file(), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping=COLUMN_MAPPING,
        )
    pdf_bytes = base64.b64decode(result['preview_pdf'])
    assert pdf_bytes[:4] == b'%PDF'


@pytest.mark.unit
def test_preview_skips_nan_barcode_rows(app):
    content = b"Location,Barcode\nAisle-01,nan\nAisle-02,SKU002\n"
    with app.app_context():
        from services.label_service import generate_label_preview
        result = generate_label_preview(
            make_file(content), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping={'barcode_column': 1, 'text_columns': [], 'has_header_row': True},
        )
    assert result['label_count'] == 1


@pytest.mark.unit
def test_preview_skips_empty_barcode_rows(app):
    content = b"Location,Barcode\nAisle-01,\nAisle-02,SKU002\n"
    with app.app_context():
        from services.label_service import generate_label_preview
        result = generate_label_preview(
            make_file(content), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping={'barcode_column': 1, 'text_columns': [], 'has_header_row': True},
        )
    assert result['label_count'] == 1


@pytest.mark.unit
def test_preview_skips_out_of_bounds_barcode_column(app):
    content = b"OnlyOneColumn\nValue1\nValue2\n"
    with app.app_context():
        from services.label_service import generate_label_preview
        with pytest.raises(ValueError, match='No valid data'):
            generate_label_preview(
                make_file(content), 'user-1', 'test.csv',
                template_id='standard_20',
                column_mapping={'barcode_column': 9, 'text_columns': [], 'has_header_row': True},
            )


@pytest.mark.unit
def test_preview_excludes_nan_text_columns(app):
    content = b"Location,Barcode,Extra\nnan,SKU001,nan\n"
    with app.app_context():
        from services.label_service import generate_label_preview
        result = generate_label_preview(
            make_file(content), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping={
                'barcode_column': 1,
                'text_columns': [{'column': 0, 'label': 'Loc'}, {'column': 2, 'label': 'Extra'}],
                'has_header_row': True,
            },
        )
    assert result['label_count'] == 1


@pytest.mark.unit
def test_preview_respects_has_header_row(app):
    # Without header row flag, first row is treated as data
    content = b"SKU000\nSKU001\nSKU002\n"
    with app.app_context():
        from services.label_service import generate_label_preview
        result = generate_label_preview(
            make_file(content), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping={'barcode_column': 0, 'text_columns': [], 'has_header_row': False},
        )
    assert result['label_count'] == 3


@pytest.mark.unit
def test_preview_empty_file_raises_value_error(app):
    content = b"Location,Barcode\n"
    with app.app_context():
        from services.label_service import generate_label_preview
        with pytest.raises(ValueError, match='No valid data'):
            generate_label_preview(
                make_file(content), 'user-1', 'test.csv',
                template_id='standard_20',
                column_mapping={'barcode_column': 1, 'text_columns': [], 'has_header_row': True},
            )


@pytest.mark.unit
def test_preview_exceeds_max_labels_raises(app):
    rows = ''.join(f'Loc{i},SKU{i}\n' for i in range(100))
    content = (CSV_HEADER + rows.encode())
    with app.app_context():
        app.config['MAX_LABELS'] = 2
        from services.label_service import generate_label_preview
        with pytest.raises(ValueError, match='Too many labels'):
            generate_label_preview(
                make_file(content), 'user-1', 'test.csv',
                template_id='standard_20',
                column_mapping={'barcode_column': 1, 'text_columns': [], 'has_header_row': True},
            )
        app.config['MAX_LABELS'] = 10000


@pytest.mark.unit
def test_process_label_file_calls_supabase_insert_once(app, mock_supabase, mock_storage):
    with app.app_context():
        from services.label_service import process_label_file
        process_label_file(
            make_file(), 'user-1', 'test.csv',
            template_id='standard_20',
            column_mapping=COLUMN_MAPPING,
        )
    assert mock_supabase.table.call_count >= 1
