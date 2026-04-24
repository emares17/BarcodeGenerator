import pytest
from datetime import datetime, timedelta


@pytest.mark.integration
def test_upload_with_no_session_returns_401(client):
    response = client.post('/upload')
    assert response.status_code == 401


@pytest.mark.integration
def test_upload_with_expired_token_returns_401(client):
    past = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    with client.session_transaction() as sess:
        sess['user_id'] = 'test-user-id'
        sess['access_token_expires'] = past
    response = client.post('/upload')
    assert response.status_code == 401


@pytest.mark.integration
def test_upload_with_valid_session_passes_auth(auth_session):
    # Valid session passes auth — returns 400 for missing file, not 401
    response = auth_session.post('/upload')
    assert response.status_code == 400
    data = response.get_json()
    assert 'Authentication required' not in data.get('error', '')


@pytest.mark.integration
def test_preview_with_no_session_returns_401(client):
    response = client.post('/preview')
    assert response.status_code == 401
