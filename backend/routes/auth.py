from flask import current_app, Blueprint, request, jsonify
from auth.decorators import create_user_session, clear_user_session, get_current_user
from models.database import get_supabase_user
from utils.security import rate_limit

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
@rate_limit("3 per minute")  
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Authenticate with Supabase
        supabase_user = get_supabase_user()
        auth_response = supabase_user.auth.sign_in_with_password({
            'email': email,
            'password': password
        })
        
        if auth_response.user:
            create_user_session(auth_response.user.id, auth_response.user.email)
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': auth_response.user.id,
                    'email': auth_response.user.email
                }
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        current_app.logger.error(f"Login error: {type(e).__name__}: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    clear_user_session()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@auth_bp.route('/status', methods=['GET'])
def auth_status():
    try:
        user = get_current_user()
        if user:
            return jsonify({'authenticated': True, 'user': user})
        else:
            return jsonify({'authenticated': False})
    except Exception as e:
        current_app.logger.error(f"Auth status error: {type(e).__name__}")
        return jsonify({'error': 'Failed to check authentication status'}), 500