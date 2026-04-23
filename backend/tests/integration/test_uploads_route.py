import io
import json
import pytest


def make_csv_file(content=None):
    data = content or b"Location,Barcode,Name,Unit\nAisle-01,SKU001,Widget,EA\nAisle-02,SKU002,Gadget,PK\n"
    return (io.BytesIO(data), 'test.csv')


VALID_COLUMN_MAPPING = json.dumps({
    'barcode_column': 2,
    'text_columns': [{'column': 1, 'label': 'Location'}, {'column': 4, 'label': 'Unit'}],
    'has_header_row': True,
})


@pytest.mark.integration
def test_upload_happy_path_returns_200(auth_session, mock_supabase, mock_storage):
    file_data, filename = make_csv_file()
    response = auth_session.post(
        '/upload',
        data={
            'file': (file_data, filename),
            'template_id': 'standard_20',
            'barcode_type': 'code128',
            'column_mapping': VALID_COLUMN_MAPPING,
        },
        content_type='multipart/form-data',
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'user_sheet_id' in data


@pytest.mark.integration
def test_upload_missing_file_returns_400(auth_session):
    response = auth_session.post('/upload', data={}, content_type='multipart/form-data')
    assert response.status_code == 400


@pytest.mark.integration
def test_upload_invalid_template_returns_400(auth_session):
    file_data, filename = make_csv_file()
    response = auth_session.post(
        '/upload',
        data={'file': (file_data, filename), 'template_id': 'nonexistent_template'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_upload_invalid_barcode_type_returns_400(auth_session):
    file_data, filename = make_csv_file()
    response = auth_session.post(
        '/upload',
        data={'file': (file_data, filename), 'barcode_type': 'aztec'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_upload_barcode_column_zero_returns_400(auth_session):
    file_data, filename = make_csv_file()
    bad_mapping = json.dumps({'barcode_column': 0, 'text_columns': [], 'has_header_row': False})
    response = auth_session.post(
        '/upload',
        data={'file': (file_data, filename), 'column_mapping': bad_mapping},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_upload_barcode_column_over_100_returns_400(auth_session):
    file_data, filename = make_csv_file()
    bad_mapping = json.dumps({'barcode_column': 101, 'text_columns': [], 'has_header_row': False})
    response = auth_session.post(
        '/upload',
        data={'file': (file_data, filename), 'column_mapping': bad_mapping},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_upload_invalid_column_mapping_json_returns_400(auth_session):
    file_data, filename = make_csv_file()
    response = auth_session.post(
        '/upload',
        data={'file': (file_data, filename), 'column_mapping': 'not-valid-json{'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_preview_happy_path_returns_200(auth_session):
    file_data, filename = make_csv_file()
    response = auth_session.post(
        '/preview',
        data={
            'file': (file_data, filename),
            'template_id': 'standard_20',
            'barcode_type': 'code128',
            'column_mapping': VALID_COLUMN_MAPPING,
        },
        content_type='multipart/form-data',
    )
    assert response.status_code == 200
    data = response.get_json()
    assert 'preview_pdf' in data


@pytest.mark.integration
def test_preview_missing_file_returns_400(auth_session):
    response = auth_session.post('/preview', data={}, content_type='multipart/form-data')
    assert response.status_code == 400


@pytest.mark.integration
def test_preview_invalid_template_returns_400(auth_session):
    file_data, filename = make_csv_file()
    response = auth_session.post(
        '/preview',
        data={'file': (file_data, filename), 'template_id': 'no_such_template'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400


@pytest.mark.integration
def test_upload_triggers_supabase_insert(auth_session, mock_supabase, mock_storage):
    file_data, filename = make_csv_file()
    auth_session.post(
        '/upload',
        data={
            'file': (file_data, filename),
            'template_id': 'standard_20',
            'column_mapping': VALID_COLUMN_MAPPING,
        },
        content_type='multipart/form-data',
    )
    assert mock_supabase.table.called
