import os
import base64
import io
from tusclient import client
from supabase import create_client, Client
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase_admin: Client = create_client(supabase_url, supabase_service_key)

def create_tus_client():
    tus_endpoint = f"{os.getenv('SUPABASE_URL')}/storage/v1/upload/resumable"
    
    return client.TusClient(
        tus_endpoint,
        headers={
            'authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_KEY")}',
            'x-upsert': 'true'
        }
    )

def upload_single_file(user_id, user_sheet_id, file_data):
    try:
        
        # Create separate TUS client for thread safety
        tus_client = create_tus_client()
        
        # Convert base64 to file stream
        file_content = base64.b64decode(file_data['content'])
        file_stream = io.BytesIO(file_content)
        
        # Create storage path
        storage_path = f"{user_id}/{user_sheet_id}/{file_data['filename']}"
        
        # Upload via TUS
        uploader = tus_client.uploader(
            file_stream=file_stream, 
            chunk_size=6*1024*1024,
            metadata={
                'bucketName': 'label-sheets',
                'objectName': storage_path,
                'contentType': 'image/png'
            }
        )
        uploader.upload()
        
        # Save metadata to database
        sheet_file_data = {
            'user_sheet_id': user_sheet_id,
            'filename': file_data['filename'],
            'storage_path': storage_path,
            'file_size_bytes': file_data['size'],
            'sheet_number': file_data['sheet_number']
        }
        
        supabase_admin.table('sheet_files').insert(sheet_file_data).execute()
        
        print(f"   Uploaded successfully: {file_data['filename']}")
        
        return {
            'success': True, 
            'filename': file_data['filename'],
            'storage_path': storage_path
        }
        
    except Exception as e:
        print(f"   Upload failed: {file_data['filename']} - {e}")
        return {
            'success': False, 
            'filename': file_data['filename'], 
            'error': str(e)
        }

def upload_files_to_storage(user_id, user_sheet_id, files_data):
    try:
        
        uploaded_files = []
        errors = []
        
        max_workers = min(4, len(files_data))  
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all upload tasks
            future_to_file = {
                executor.submit(upload_single_file, user_id, user_sheet_id, file_data): file_data
                for file_data in files_data
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_file):
                file_data = future_to_file[future]
                try:
                    result = future.result()
                    
                    if result['success']:
                        uploaded_files.append(result['filename'])
                    else:
                        errors.append(f"{result['filename']}: {result['error']}")
                        
                except Exception as e:
                    # Handle any unexpected errors
                    errors.append(f"{file_data['filename']}: {str(e)}")
                    print(f"   Unexpected error for {file_data['filename']}: {e}")
        
        success = len(errors) == 0
        total_uploaded = len(uploaded_files)
        total_failed = len(errors)
        
        if errors:
            print(f"   Errors: {errors}")
        
        return {
            'success': success,
            'uploaded_files': uploaded_files,
            'errors': errors,
            'total_uploaded': total_uploaded,
            'total_failed': total_failed
        }
        
    except Exception as e:
        print(f"  Critical error in parallel uploads: {e}")
        return {
            'success': False, 
            'errors': [f"Critical upload error: {str(e)}"],
            'uploaded_files': [],
            'total_uploaded': 0,
            'total_failed': len(files_data)
        }