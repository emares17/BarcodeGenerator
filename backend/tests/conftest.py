import io
import os
import pytest
from collections import defaultdict
from datetime import datetime, timedelta
from unittest.mock import MagicMock


@pytest.fixture
def app():
    from app import create_app
    flask_app = create_app('testing')
    os.makedirs(flask_app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(flask_app.config['SHEET_FOLDER'], exist_ok=True)
    os.makedirs(flask_app.config['SESSION_FILE_DIR'], exist_ok=True)
    yield flask_app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_session(client):
    future = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    with client.session_transaction() as sess:
        sess['user_id'] = 'test-user-id'
        sess['access_token_expires'] = future
    return client


@pytest.fixture
def mock_supabase(app):
    mock_admin = MagicMock()
    # .table('user_sheets').insert(...).execute() returns data with an id
    insert_result = MagicMock()
    insert_result.data = [{'id': 'test-sheet-id'}]
    mock_admin.table.return_value.insert.return_value.execute.return_value = insert_result
    # .table(...).update(...).eq(...).execute() — no specific return needed
    mock_admin.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
    # .table(...).delete().eq(...).execute()
    mock_admin.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()

    import models.database as db
    original = db.supabase_admin
    db.supabase_admin = mock_admin
    yield mock_admin
    db.supabase_admin = original


@pytest.fixture
def mock_storage(mocker):
    return mocker.patch(
        'services.label_service.upload_zip_to_storage',
        return_value={
            'success': True,
            'storage_path': 'test-user/test-sheet-id/labels.zip',
            'zip_size': 2048,
        }
    )


@pytest.fixture
def sample_csv():
    content = b"Location,Barcode,Name,Unit\nAisle-01,SKU001,Widget A,EA\nAisle-02,SKU002,Widget B,EA\nAisle-03,SKU003,Widget C,PK\n"
    return io.BytesIO(content)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    import utils.security as sec
    sec.rate_limit_storage = defaultdict(list)
    yield
    sec.rate_limit_storage = defaultdict(list)
