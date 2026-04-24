import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
    
    # Validate secret key
    if not SECRET_KEY or SECRET_KEY == 'secret-key':
        if os.getenv('FLASK_ENV') == 'production':
            raise ValueError("Production SECRET_KEY must be set and secure!")
        SECRET_KEY = 'dev-only-secret-key-do-not-use-in-prod'

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") 
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

    UPLOAD_FOLDER = 'uploads'
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

    LABEL_TEMPLATES = {
        'standard_20': {
            'name': 'Standard - 20 Labels',
            'dimensions': '1.75" x 1.8"',
            'label_width_inches': 1.75,
            'label_height_inches': 1.8,
            'rows': 5,
            'columns': 4,
            'margin_top_inches': 0.4,
            'margin_left_inches': 0.4,
            'x_gap_inches': 0.25,
            'y_gap_inches': 0.2,
            'padding_x_inches': 0.05,
            'barcode_height_inches': 0.8,
            'barcode_offset_y_inches': 0.5,
            'text_start_y_inches': 0.3,
            'text_line_spacing_inches': 0.15,
            'font': 'Helvetica',
            'font_size': 8,
            'max_text_lines': 2
        },
        '5163': {
            'name': '5163 - Shipping Labels',
            'dimensions' : '2" x 4"',
            'label_width_inches': 4.0,
            'label_height_inches': 2.0,
            'rows': 5,
            'columns': 2,
            'margin_top_inches': 0.5,
            'margin_left_inches': 0.16,
            'x_gap_inches': 0.14,
            'y_gap_inches': 0.0,
            'padding_x_inches': 0.2,
            'barcode_height_inches': 0.8,
            'barcode_offset_y_inches': 0.7,
            'text_start_y_inches': 0.45,
            'text_line_spacing_inches': 0.2,
            'font': 'Helvetica',
            'font_size': 10,
            'max_text_lines': 2
        },
        '5160': {
            'name': '5160 - Address Labels',
            'dimensions' : '1" x 2 5/8"',
            'label_width_inches': 2.6,
            'label_height_inches': 1.0,
            'rows': 10,
            'columns': 3,
            'margin_top_inches': 0.5,
            'margin_left_inches': 0.19,
            'x_gap_inches': 0.125,
            'y_gap_inches': 0.0,
            'padding_x_inches': 0.1,
            'barcode_height_inches': 0.4,
            'barcode_offset_y_inches': 0.3,
            'text_start_y_inches': 0.15,
            'text_line_spacing_inches': 0.1,
            'font': 'Helvetica',
            'font_size': 8,
            'max_text_lines': 1
        },
        '94233': {
            'name': '94233 - Rectangle Labels',
            'dimensions' : '2 1/2" x 2 1/2"',
            'label_width_inches': 2.35,
            'label_height_inches': 2.3,
            'rows': 4,
            'columns': 3,
            'margin_top_inches': 1.05,
            'margin_left_inches': 0.75,
            'x_gap_inches': 0.1,
            'y_gap_inches': 0.0,
            'padding_x_inches': 0.15,
            'barcode_height_inches': 0.8,
            'barcode_offset_y_inches': 1.0,
            'text_start_y_inches': 0.85,
            'text_line_spacing_inches': 0.2,
            'font': 'Helvetica',
            'font_size': 10,
            'max_text_lines': 2
        }
    }

    DEFAULT_TEMPLATE = 'standard_20'

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_DOMAIN = None

    # Production CORS; To be updated**
    CORS_CONFIG = {
        'origins': ['https://labelgenius.up.railway.app'],
        'supports_credentials': True,
        'allow_headers': ['Content-Type', 'Authorization'],
        'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        'expose_headers': ['Set-Cookie']
    }

    # Stricter production settings
    MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB in production
    MAX_LABELS = 5000  # Lower limit in production


class TestingConfig(Config):
    TESTING = True
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-secret'
    SESSION_TYPE = 'filesystem'
    SESSION_FILE_DIR = '/tmp/test_flask_sessions'
    UPLOAD_FOLDER = '/tmp/test_uploads'
    SHEET_FOLDER = '/tmp/test_sheets'
    SUPABASE_URL = 'https://placeholder.supabase.co'
    SUPABASE_ANON_KEY = 'test-anon-key'
    SUPABASE_SERVICE_KEY = 'test-service-key'
    RATELIMIT_STORAGE_URL = 'memory://'
