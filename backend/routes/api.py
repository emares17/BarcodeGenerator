from flask import current_app, Blueprint, request, jsonify
from auth.decorators import verify_session_auth
from models.database import get_supabase_admin

api_bp = Blueprint('api', __name__)

@api_bp.route('/create-user-sheet', methods=['POST'])
@verify_session_auth
def create_user_sheet():
    try:
        data = request.get_json()
        user_id = request.user_id
        supabase_admin = get_supabase_admin()
        
        user_sheet_data = {
            'user_id': user_id,
            'original_filename': data['original_filename'],
            'label_count': data['label_count'],
            'sheet_count': data['sheet_count'],
            'total_size_bytes': data['total_size_bytes']
        }
        
        sheet_response = supabase_admin.table('user_sheets').insert(user_sheet_data).execute()
        
        if not sheet_response.data:
            raise Exception("Failed to create user_sheets record")
            
        return jsonify({'id': sheet_response.data[0]['id']})
        
    except Exception as e:
        current_app.logger.error(f"Error creating user sheet: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/save-file-metadata', methods=['POST'])
@verify_session_auth
def save_file_metadata():
    try:
        data = request.get_json()
        supabase_admin = get_supabase_admin()
        
        sheet_file_data = {
            'user_sheet_id': data['user_sheet_id'],
            'filename': data['filename'],
            'storage_path': data['storage_path'],
            'file_size_bytes': data['file_size_bytes'],
            'sheet_number': data['sheet_number']
        }
        
        supabase_admin.table('sheet_files').insert(sheet_file_data).execute()
        return jsonify({'success': True})
        
    except Exception as e:
        current_app.logger.error(f"Error saving file metadata: {e}")
        return jsonify({'error': str(e)}), 500
    
@api_bp.route('/update-sheet-size/<user_sheet_id>', methods=['PATCH'])
@verify_session_auth
def update_sheet_size(user_sheet_id):
    try:
        data = request.get_json()
        supabase_admin = get_supabase_admin()
        
        supabase_admin.table('user_sheets').update({
            'total_size_bytes': data['total_size_bytes']
        }).eq('id', user_sheet_id).execute()
        
        return jsonify({'success': True})
        
    except Exception as e:
        current_app.logger.error(f"Error updating sheet size for {user_sheet_id}: {e}")
        return jsonify({'error': str(e)}), 500