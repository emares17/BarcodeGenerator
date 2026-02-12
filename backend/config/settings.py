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
    USE_PDF_GENERATION = True
    
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
            'barcode_width_ratio': 1.5,
            'barcode_height_inches': 0.8,
            'barcode_offset_y_inches': 0.5,
            'text_start_y_inches': 0.3,
            'text_line_spacing_inches': 0.2,
            'font': 'Helvetica',
            'font_size': 10
        },
        '5160': {
            'name': '5160 - Shipping Labels',
            'dimensions' : '1" x 2 5/8"',
            'label_width_inches': 2.6,
            'label_height_inches': 1.0,
            'rows': 10,
            'columns': 3,
            'margin_top_inches': 0.5,
            'margin_left_inches': 0.19,
            'x_gap_inches': 0.125,
            'y_gap_inches': 0.0,
            'barcode_width_ratio': 1.0,
            'barcode_height_inches': 0.4,
            'barcode_offset_y_inches': 0.2,
            'text_start_y_inches': 0.1,
            'text_line_spacing_inches': 0.1,
            'font': 'Helvetica',
            'font_size': 8
        },
        '22817': {
            'name': '22817 - Shipping Labels',
            'dimensions' : '2 1/2" x 2 1/2"',
            'label_width_inches': 2.5,
            'label_height_inches': 2.5,
            'rows': 4,
            'columns': 3,
            'margin_top_inches': 0.5,
            'margin_left_inches': 0.5,
            'x_gap_inches': 0.125,
            'y_gap_inches': 0.125,
            'barcode_width_ratio': 1.5,
            'barcode_height_inches': 1.0,
            'barcode_offset_y_inches': 0.6,
            'text_start_y_inches': 0.4,
            'text_line_spacing_inches': 0.2,
            'font': 'Helvetica',
            'font_size': 10
        }
    }

    DEFAULT_TEMPLATE = '5163'

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    USE_PDF_GENERATION = True

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
    USE_PDF_GENERATION = False
