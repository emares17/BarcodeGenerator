from flask import current_app, Blueprint, request, jsonify, send_file
from auth.decorators import verify_session_auth
from services.sheet_service import (
    get_user_sheets,
    create_sheet_download,
    extract_single_sheet,
    extract_selected_sheets,
    delete_user_sheet,
)

sheets_bp = Blueprint('sheets', __name__)


@sheets_bp.route('/my-sheets', methods=['GET'])
@verify_session_auth
def get_sheets():
    try:
        sheets = get_user_sheets(request.user_id)
        return jsonify({'sheets': sheets})
    except Exception as e:
        current_app.logger.error("Error fetching sheets for user %s: %s", request.user_id, e)
        return jsonify({'error': f'Failed to fetch sheets: {str(e)}'}), 500


@sheets_bp.route('/download-sheet/<user_sheet_id>', methods=['GET'])
@verify_session_auth
def download_sheet(user_sheet_id):
    try:
        zip_buffer, filename = create_sheet_download(user_sheet_id, request.user_id)
        return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name=filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error("Error downloading sheet %s: %s", user_sheet_id, e)
        return jsonify({'error': 'Failed to create download'}), 500


@sheets_bp.route('/download-sheet/<user_sheet_id>/sheet/<int:sheet_number>', methods=['GET'])
@verify_session_auth
def download_single_sheet(user_sheet_id, sheet_number):
    try:
        pdf_buffer, filename = extract_single_sheet(user_sheet_id, request.user_id, sheet_number)
        return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error("Error downloading single sheet %s/%s: %s", user_sheet_id, sheet_number, e)
        return jsonify({'error': 'Failed to extract sheet'}), 500


@sheets_bp.route('/download-sheet/<user_sheet_id>/selected', methods=['POST'])
@verify_session_auth
def download_selected_sheets(user_sheet_id):
    try:
        body = request.get_json(silent=True) or {}
        sheet_numbers = body.get('sheet_numbers', [])

        if not isinstance(sheet_numbers, list) or not sheet_numbers:
            return jsonify({'error': 'sheet_numbers must be a non-empty list'}), 400

        sheet_numbers = [int(n) for n in sheet_numbers]

        if len(sheet_numbers) > 50:
            return jsonify({'error': 'Cannot select more than 50 sheets at once'}), 400

        zip_buffer, filename = extract_selected_sheets(user_sheet_id, request.user_id, sheet_numbers)
        return send_file(zip_buffer, mimetype='application/zip', as_attachment=True, download_name=filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error("Error downloading selected sheets %s: %s", user_sheet_id, e)
        return jsonify({'error': 'Failed to create download'}), 500


@sheets_bp.route('/delete-sheet/<user_sheet_id>', methods=['DELETE'])
@verify_session_auth
def delete_sheet(user_sheet_id):
    try:
        delete_user_sheet(user_sheet_id, request.user_id)
        return jsonify({'success': True, 'message': 'Sheet deleted successfully'})
    except LookupError:
        return jsonify({'error': 'Sheet not found'}), 404
    except PermissionError:
        return jsonify({'error': 'Access denied'}), 403
    except Exception as e:
        current_app.logger.error("Error deleting sheet %s: %s", user_sheet_id, e)
        return jsonify({'error': 'Failed to delete sheet'}), 500
