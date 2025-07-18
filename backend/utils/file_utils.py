import os
import mimetypes
import threading
import glob
from werkzeug.utils import secure_filename
from flask import current_app

def validate_upload_file(file):
    if not file or not file.filename:
        return False, "No file provided"
    
    filename = secure_filename(file.filename)
    if not filename:
        return False, "Invalid filename"
    
    # Check file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > current_app.config['MAX_FILE_SIZE']:
        max_mb = current_app.config['MAX_FILE_SIZE'] // (1024*1024)
        return False, f"File too large. Maximum size: {max_mb}MB"
    
    if file_size == 0:
        return False, "Empty file not allowed"
    
    # Validate extension
    _, ext = os.path.splitext(filename.lower())
    if ext not in current_app.config['ALLOWED_EXTENSIONS']:
        allowed = ', '.join(current_app.config['ALLOWED_EXTENSIONS'])
        return False, f"File type not allowed. Allowed: {allowed}"
    
    # Validate MIME type
    allowed_mimes = {
        'text/csv', 'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    mimetype, _ = mimetypes.guess_type(filename)
    if mimetype not in allowed_mimes:
        return False, "Invalid file format detected"
    
    # Basic content validation
    file_header = file.read(512)
    file.seek(0)
    
    if ext == '.csv':
        if not any(sep.encode() in file_header for sep in [',', ';', '\t']):
            return False, "File doesn't appear to be a valid CSV"
    elif ext in ['.xlsx', '.xls']:
        excel_signatures = [
            b'PK\x03\x04',  # .xlsx
            b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'  # .xls
        ]
        if not any(file_header.startswith(sig) for sig in excel_signatures):
            return False, "File doesn't appear to be a valid Excel file"
    
    return True, filename

def cleanup_images_async(image_folder):
    def cleanup():
        try:
            patterns = [
                os.path.join(image_folder, "*.png"),
                os.path.join(image_folder, "*.jpeg"),
                os.path.join(image_folder, "*.jpg")
            ]
            
            for pattern in patterns:
                for file_path in glob.glob(pattern):
                    try:
                        os.remove(file_path)
                    except OSError:
                        pass
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    cleanup_thread = threading.Thread(target=cleanup, daemon=True)
    cleanup_thread.start()