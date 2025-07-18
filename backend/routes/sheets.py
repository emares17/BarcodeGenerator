from flask import current_app, Blueprint, request, jsonify, send_file
from auth.decorators import verify_session_auth
from services.sheet_service import get_user_sheets, create_sheet_download, delete_user_sheet

sheets_bp = Blueprint('sheets', __name__)

@sheets_bp.route('/my-sheets', methods=['GET'])
@verify_session_auth
def get_sheets():
    try:
        user_id = request.user_id
        sheets = get_user_sheets(user_id)
        return jsonify({'sheets': sheets})
    except Exception as e:
        current_app.logger.error(f"Error fetching sheets for user {request.user_id}: {e}")
        return jsonify({'error': f'Failed to fetch sheets: {str(e)}'}), 500

@sheets_bp.route('/download-sheet/<user_sheet_id>', methods=['GET'])
@verify_session_auth
def download_sheet(user_sheet_id):
    try:
        user_id = request.user_id
        zip_buffer, filename = create_sheet_download(user_sheet_id, user_id)
        
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=filename
        )
    except ValueError as e:
        current_app.logger.warning(f"Download error for user {request.user_id}: {e}")
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        current_app.logger.warning(f"Permission error for user {request.user_id}: {e}")
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Error creating download for user {request.user_id}: {e}")
        return jsonify({'error': f'Failed to create download: {str(e)}'}), 500

@sheets_bp.route('/delete-sheet/<user_sheet_id>', methods=['DELETE'])
@verify_session_auth
def delete_sheet(user_sheet_id):
    try:
        user_id = request.user_id
        delete_user_sheet(user_sheet_id, user_id)
        return jsonify({'success': True, 'message': 'Sheet deleted successfully'})
    except Exception as e:
        current_app.logger.error(f"Error deleting sheet for user {request.user_id}: {e}")
        return jsonify({'error': f'Failed to delete sheet: {str(e)}'}), 500