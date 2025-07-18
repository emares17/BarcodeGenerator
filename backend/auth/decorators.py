from functools import wraps
from flask import request, jsonify, session
from datetime import datetime, timedelta
import secrets 

def verify_session_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        if 'access_token_expires' not in session:
            return jsonify({'error': 'Invalid session'}), 401
        
        expires_at = datetime.fromisoformat(session['access_token_expires'])

        if datetime.utcnow() > expires_at:
            if not refresh_access_token():
                return jsonify({'error': 'Session expired'}), 401

        request.user_id = session['user_id']
        return f(*args, **kwargs)
    return decorated

def refresh_access_token():
    try:
        if 'refresh_token' not in session or 'refresh_token_expires' not in session:
            return False
        
        refresh_expires = datetime.fromisoformat(session['refresh_token_expires'])
        if datetime.utcnow() > refresh_expires:
            return False
        
        session['access_token'] = secrets.token_urlsafe(32)
        session['access_token_expires'] = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

        session['last_activity'] = datetime.utcnow().isoformat()

        return True
    
    except Exception as e:
        print(f"Error refreshing access token: {e}")
        return False
    
def create_user_session(user_id, user_email):
    # Clear any existing session
    session.clear()
    
    session['user_id'] = user_id
    session['user_email'] = user_email
    session['created_at'] = datetime.utcnow().isoformat()
    session['last_activity'] = datetime.utcnow().isoformat()
    
    session['access_token'] = secrets.token_urlsafe(32)
    session['access_token_expires'] = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
    
    session['refresh_token'] = secrets.token_urlsafe(32)
    session['refresh_token_expires'] = (datetime.utcnow() + timedelta(days=7)).isoformat()
    
    return True

def clear_user_session():
    session.clear()
    return True

def get_current_user():
    if 'user_id' not in session:
        return None
    
    return {
        'user_id': session.get('user_id'),
        'user_email': session.get('user_email'),
        'created_at': session.get('created_at'),
        'last_activity': session.get('last_activity'),
    }