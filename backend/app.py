from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_session import Session
from config.settings import Config, DevelopmentConfig, ProductionConfig
from routes import auth_bp, uploads_bp, sheets_bp, api_bp
from models.database import init_database
import os

def create_app(config_name='development'):
    """Enhanced application factory with security"""
    app = Flask(__name__)
    app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024 # 25MB limit

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'An internal error occurred'}), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(413)
    def request_too_large(error):
        return jsonify({'error': 'File too large'}), 413
    
    # Load configuration
    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig
    }
    
    config_class = config_map.get(config_name, DevelopmentConfig)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app, **app.config['CORS_CONFIG'])
    Session(app)
    
    # Add security headers
    @app.after_request
    def add_security_headers(response):
        for header, value in app.config.get('SECURITY_HEADERS', {}).items():
            response.headers[header] = value
        return response
    
    # Request size limiting
    @app.before_request
    def limit_request_size():
        if request.content_length and request.content_length > app.config['MAX_FILE_SIZE']:
            from flask import jsonify
            return jsonify({'error': 'Request too large'}), 413
    
    # Initialize database
    init_database(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(uploads_bp, url_prefix='/')
    app.register_blueprint(sheets_bp, url_prefix='/')
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Ensure folders exist
    folders = [
        app.config['UPLOAD_FOLDER'],
        app.config['IMAGE_FOLDER'], 
        app.config['SHEET_FOLDER']
    ]
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
    
    return app

@app.route('/')
def health():
    return {'status': 'healthy', 'message': 'Label Generator API'}, 200

@app.route('/health')
def health_check():
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    env = os.getenv('FLASK_ENV', 'development')
    app = create_app(env)
    
    port_env = os.environ.get('PORT')
    port = int(port_env) if port_env else 5000
    
    if env == 'production':
        # Production settings
        app.run(
            host='0.0.0.0',
            port=port,
            debug=False
        )
    else:
        app.run(
            host='0.0.0.0',  
            port=port,
            debug=True
        )