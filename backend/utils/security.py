import os
import mimetypes
import mimetypes 
from werkzeug.utils import secure_filename
from flask import current_app, request
from functools import wraps
import time
from collections import defaultdict

# Simple in-memory rate limiting (use Redis in production)
rate_limit_storage = defaultdict(list)

def validate_file_security(file):
    if not file or not file.filename:
        return False, "No file provided"
    
    # Secure filename
    filename = secure_filename(file.filename)
    if not filename:
        return False, "Invalid filename"
    
    # File size validation
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    
    max_size = current_app.config.get('MAX_FILE_SIZE', 50 * 1024 * 1024)
    if file_size > max_size:
        max_mb = max_size // (1024*1024)
        return False, f"File too large. Maximum size: {max_mb}MB"
    
    if file_size == 0:
        return False, "Empty file not allowed"
    
    # Extension validation (prevent .csv.exe attacks)
    _, ext = os.path.splitext(filename.lower())
    allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'.csv', '.xlsx', '.xls'})
    
    if ext not in allowed_extensions:
        allowed_str = ', '.join(allowed_extensions)
        return False, f"File type not allowed. Allowed: {allowed_str}"
    
    # MIME type validation
    allowed_mimes = {
        'text/csv', 'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    mimetype, _ = mimetypes.guess_type(filename)
    if mimetype not in allowed_mimes:
        return False, "Invalid file format detected"
    
    # Content validation (magic bytes)
    file_header = file.read(1024)  # Read more for better detection
    file.seek(0)
    
    if ext == '.csv':
        # Check for CSV delimiters
        if not any(sep.encode() in file_header for sep in [',', ';', '\t']):
            return False, "File doesn't appear to be a valid CSV"
        
        # Check for suspicious content
        suspicious_patterns = [b'<script', b'javascript:', b'vbscript:', b'<?php']
        if any(pattern in file_header.lower() for pattern in suspicious_patterns):
            return False, "File contains suspicious content"
    
    elif ext in ['.xlsx', '.xls']:
        # Check Excel magic bytes
        excel_signatures = [
            b'PK\x03\x04',  # .xlsx (ZIP format)
            b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'  # .xls (OLE format)
        ]
        if not any(file_header.startswith(sig) for sig in excel_signatures):
            return False, "File doesn't appear to be a valid Excel file"
    
    # Additional security: scan for embedded executables
    executable_signatures = [
        b'MZ',  # PE executable
        b'\x7fELF',  # ELF executable
        b'\xfe\xed\xfa',  # Mach-O executable
    ]
    if any(file_header.startswith(sig) for sig in executable_signatures):
        return False, "File contains executable content"
    
    return True, filename

def rate_limit(limit_string):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Parse limit string (e.g., "3 per minute", "20 per hour")
            count, period = limit_string.split(' per ')
            count = int(count)
            
            period_seconds = {
                'minute': 60,
                'hour': 3600,
                'day': 86400
            }.get(period, 60)
            
            # Get user identifier
            user_id = getattr(request, 'user_id', None)
            if user_id:
                # Fall back to IP address for unauthenticated requests
                identifier = f"user_{user_id}"
            else:
                identifier = request.remote_addr
            
            # Check rate limit
            now = time.time()
            key = f"{f.__name__}_{identifier}"
            
            # Clean old entries
            rate_limit_storage[key] = [
                timestamp for timestamp in rate_limit_storage[key]
                if now - timestamp < period_seconds
            ]
            
            # Check if limit exceeded
            if len(rate_limit_storage[key]) >= count:
                from flask import jsonify
                return jsonify({
                    'error': f'Rate limit exceeded. Maximum {count} requests per {period}.'
                }), 429
            
            # Record this request
            rate_limit_storage[key].append(now)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_input(data, max_length=1000):
    if not isinstance(data, str):
        data = str(data)
    
    # Remove null bytes and control characters
    data = ''.join(char for char in data if ord(char) >= 32 or char in '\t\n\r')
    
    # Limit length
    if len(data) > max_length:
        data = data[:max_length]
    
    # Remove potentially dangerous characters for file paths
    dangerous_chars = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*']
    for char in dangerous_chars:
        data = data.replace(char, '')
    
    return data.strip()