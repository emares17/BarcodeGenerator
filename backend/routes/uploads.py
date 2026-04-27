import json
from flask import current_app, Blueprint, request, jsonify
from auth.decorators import verify_session_auth
from services.label_service import process_label_file, generate_label_preview
from utils.security import validate_file_security, rate_limit, sanitize_input
import logging

uploads_bp = Blueprint('uploads', __name__)
logger = logging.getLogger(__name__)

@uploads_bp.route('/upload', methods=['POST'])
@rate_limit("5 per hour")    
@rate_limit("15 per day")     
@verify_session_auth
def upload_file():
    try:
        # Get and validate file
        if 'file' not in request.files:
            logger.warning("No file provided.")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_id = request.user_id
        
        file_size_bytes = len(file.read()) 
        file.seek(0)  # Reset file pointer
        if file_size_bytes > current_app.config['MAX_FILE_SIZE']:  
            max_mb = current_app.config['MAX_FILE_SIZE'] // (1024 * 1024)
            logger.warning(f"File size exceeded the maximum {max_mb}MB.")
            return jsonify({'error': f'File too large. Maximum {max_mb}MB.'}), 400
        
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

        # Parse column_mapping from request
        column_mapping = None
        column_mapping_raw = request.form.get('column_mapping')
        if column_mapping_raw:
            try:
                mapping = json.loads(column_mapping_raw)
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid column_mapping JSON'}), 400

            barcode_col = mapping.get('barcode_column')
            if barcode_col is None or not isinstance(barcode_col, int) or barcode_col < 1 or barcode_col > 100:
                return jsonify({'error': 'barcode_column must be an integer between 1 and 100'}), 400

            # Convert 1-based (user-facing) to 0-based (pandas iloc)
            column_mapping = {
                'barcode_column': barcode_col - 1,
                'text_columns': [
                    {'column': tc['column'] - 1, 'label': str(tc.get('label', f'Column {tc["column"]}'))[:50]}
                    for tc in mapping.get('text_columns', [])
                    if isinstance(tc.get('column'), int) and 1 <= tc['column'] <= 100
                ],
                'has_header_row': bool(mapping.get('has_header_row', False))
            }

        # Extract and validate barcode type
        barcode_type = request.form.get('barcode_type', 'code128')
        if barcode_type not in ('code128', 'qr'):
            return jsonify({'error': f"Invalid barcode_type '{barcode_type}'. Valid types: code128, qr"}), 400

        # Process labels
        result = process_label_file(file, user_id, secure_filename_result, template_id=template_id, column_mapping=column_mapping, barcode_type=barcode_type)

        return jsonify(result)
    
    except ValueError as e:
        logger.warning("Upload validation error for user %s", request.user_id)
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.exception("Error processing upload for user %s", request.user_id)
        return jsonify({'error': 'An error occurred processing your file'}), 500


@uploads_bp.route('/preview', methods=['POST'])
@rate_limit("10 per hour")
@verify_session_auth
def preview_labels():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        user_id = request.user_id

        file_size_bytes = len(file.read())
        file.seek(0)
        if file_size_bytes > current_app.config['MAX_FILE_SIZE']:
            max_mb = current_app.config['MAX_FILE_SIZE'] // (1024 * 1024)
            logger.warning(f"File size exceeded the maximum {max_mb}MB.")
            return jsonify({'error': f'File too large. Maximum {max_mb}MB.'}), 400

        is_valid, result = validate_file_security(file)
        if not is_valid:
            return jsonify({'error': result}), 400

        secure_filename_result = sanitize_input(result)

        template_id = request.form.get('template_id', current_app.config['DEFAULT_TEMPLATE'])
        templates = current_app.config['LABEL_TEMPLATES']
        if template_id not in templates:
            valid = ', '.join(templates.keys())
            return jsonify({'error': f"Invalid template_id '{template_id}'. Valid templates: {valid}"}), 400

        column_mapping = None
        column_mapping_raw = request.form.get('column_mapping')
        if column_mapping_raw:
            try:
                mapping = json.loads(column_mapping_raw)
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid column_mapping JSON'}), 400

            barcode_col = mapping.get('barcode_column')
            if barcode_col is None or not isinstance(barcode_col, int) or barcode_col < 1 or barcode_col > 100:
                return jsonify({'error': 'barcode_column must be an integer between 1 and 100'}), 400

            column_mapping = {
                'barcode_column': barcode_col - 1,
                'text_columns': [
                    {'column': tc['column'] - 1, 'label': str(tc.get('label', f'Column {tc["column"]}'))[:50]}
                    for tc in mapping.get('text_columns', [])
                    if isinstance(tc.get('column'), int) and 1 <= tc['column'] <= 100
                ],
                'has_header_row': bool(mapping.get('has_header_row', False))
            }

        barcode_type = request.form.get('barcode_type', 'code128')
        if barcode_type not in ('code128', 'qr'):
            return jsonify({'error': f"Invalid barcode_type '{barcode_type}'. Valid types: code128, qr"}), 400

        result = generate_label_preview(
            file, user_id, secure_filename_result,
            template_id=template_id,
            column_mapping=column_mapping,
            barcode_type=barcode_type
        )
        return jsonify(result)

    except ValueError as e:
        logger.warning("Preview validation error for user %s", request.user_id)
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.exception("Error generating preview for user %s", request.user_id)
        return jsonify({'error': 'An error occurred generating the preview'}), 500
