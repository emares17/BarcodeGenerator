from flask import current_app, Blueprint, request, jsonify
from auth.decorators import verify_session_auth
from services.label_service import process_label_file
from utils.security import validate_file_security, rate_limit, sanitize_input
import logging

uploads_bp = Blueprint('uploads', __name__)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

@uploads_bp.route('/upload', methods=['POST'])
@rate_limit("5 per hour")     # Updated: Team-friendly rate limit
@rate_limit("15 per day")     # Updated: Daily safety net
@verify_session_auth
def upload_file():
    try:
        # Get and validate file
        if 'file' not in request.files:
            logger.warning("No file provided.")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_id = request.user_id
        
        file_size_mb = len(file.read()) / (1024 * 1024)
        file.seek(0)  # Reset file pointer
        if file_size_mb > 25:  # 25MB limit for team usage
            logger.warning("File size was too large, exceeded the maximum 25MB.")
            return jsonify({'error': 'File too large. Maximum 25MB.'}), 400
        
        # Validate file
        is_valid, result = validate_file_security(file)
        if not is_valid:
            logger.warning("File security validation failed: %s", result)
            return jsonify({'error': result}), 400
        
        secure_filename_result = sanitize_input(result) 

        # Validate template_id if provided
        template_id = request.form.get('template_id', current_app.config['DEFAULT_TEMPLATE'])
        templates = current_app.config['LABEL_TEMPLATES']
        if template_id not in templates:
            valid = ', '.join(templates.keys())
            return jsonify({'error': f"Invalid template_id '{template_id}'. Valid templates: {valid}"}), 400

        # Process labels
        result = process_label_file(file, user_id, secure_filename_result, template_id=template_id)

        return jsonify(result)
    
    except ValueError as e:
        logger.warning("Upload validation error for user %s", request.user_id)
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.exception("Error processing upload for user %s", request.user_id)
        return jsonify({'error': 'An error occurred processing your file'}), 500

@uploads_bp.route('/test-storage-service', methods=['POST'])
@verify_session_auth
def test_storage_service():
    from services.storage_service import upload_files_to_storage
    from models.database import get_supabase_admin
    
    try:
        user_id = request.user_id
        supabase_admin = get_supabase_admin()
        
        # Create test data
        test_sheet_data = {
            'user_id': user_id,
            'original_filename': 'test.csv',
            'label_count': 1,
            'sheet_count': 1,
            'total_size_bytes': 0
        }
        
        sheet_response = supabase_admin.table('user_sheets').insert(test_sheet_data).execute()
        user_sheet_id = sheet_response.data[0]['id']
        
        test_content = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        test_files = [{
            'filename': 'test_sheet_1.png',
            'content': test_content,
            'size': 100,
            'sheet_number': 1
        }]
        
        result = upload_files_to_storage(user_id, user_sheet_id, test_files)
        
        return jsonify({
            'test_result': result,
            'user_sheet_id': user_sheet_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500