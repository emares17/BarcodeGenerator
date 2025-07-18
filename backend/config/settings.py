import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
    
    # Validate secret key
    if not SECRET_KEY or SECRET_KEY == 'secret-key':
        if os.getenv('FLASK_ENV') == 'production':
            raise ValueError("Production SECRET_KEY must be set and secure!")
        SECRET_KEY = os.urandom(24).hex() 

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") 
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

    UPLOAD_FOLDER = 'uploads'
    IMAGE_FOLDER = 'images'
    SHEET_FOLDER = 'sheets'
    
    # Session configuration
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_KEY_PREFIX = 'labelapp:'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_NAME = 'session'
    SESSION_COOKIE_MAX_AGE = 3600  
    
    # CORS configuration 
    CORS_CONFIG = {
        'origins': ['http://localhost:5173'],  
        'supports_credentials': True,
        'allow_headers': ['Content-Type', 'Authorization'],
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    }
    
    # File security settings
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
    MAX_LABELS = 10000
    MAX_CONCURRENT_WORKERS = 6
    
    # Rate limiting settings
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Security headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    SESSION_COOKIE_SECURE = True
    
    # Production CORS; To be updated**
    CORS_CONFIG = {
        'origins': [os.getenv('FRONTEND_URL', 'https://yourdomain.com')],
        'supports_credentials': True,
        'allow_headers': ['Content-Type', 'Authorization'],
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    }
    
    # Stricter production settings
    MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB in production
    MAX_LABELS = 5000  # Lower limit in production
