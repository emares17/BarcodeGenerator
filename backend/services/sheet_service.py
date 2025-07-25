import io
import zipfile
from models.database import get_supabase_admin

def get_user_sheets(user_id):
    supabase_admin = get_supabase_admin()
    
    sheets_response = supabase_admin.table('user_sheets').select(
        "*, sheet_files(count)"
    ).eq('user_id', user_id).order('created_at', desc=True).execute()
    
    return sheets_response.data

def create_sheet_download(user_sheet_id, user_id):
    supabase_admin = get_supabase_admin()
    
    # Get sheet files
    files_response = supabase_admin.table('sheet_files').select(
        "*, user_sheets!inner(user_id, original_filename)"
    ).eq('user_sheet_id', user_sheet_id).execute()
    
    if not files_response.data:
        raise ValueError('No sheets found')
    
    # Verify ownership
    if files_response.data[0]['user_sheets']['user_id'] != user_id:
        raise PermissionError('Access denied')
    
    zip_file = next((f for f in files_response.data if f.get('sheet_number') == 0), None)
    
    if zip_file and zip_file['filename'].endswith('.zip'):
        # New format
        print(f"Using optimized ZIP download for sheet {user_sheet_id}")
        storage_path = zip_file['storage_path']
        zip_data = supabase_admin.storage.from_('label-sheets').download(storage_path)
        
        if not zip_data:
            raise ValueError('Failed to download ZIP file')
            
        zip_buffer = io.BytesIO(zip_data)
        filename = f"{files_response.data[0]['user_sheets']['original_filename']}_labels.zip"
        
        return zip_buffer, filename
    
    else:
        # Old format: Create ZIP from individual files (backwards compatibility)
        print(f"Using legacy ZIP creation for sheet {user_sheet_id}")
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_data in files_response.data:
                if file_data.get('sheet_number', 1) > 0:  # Skip the ZIP entry if present
                    storage_path = file_data['storage_path']
                    file_response = supabase_admin.storage.from_('label-sheets').download(storage_path)
                    
                    if file_response:
                        zip_file.writestr(file_data['filename'], file_response)
        
        zip_buffer.seek(0)
        filename = f"{files_response.data[0]['user_sheets']['original_filename']}_labels.zip"
        
        return zip_buffer, filename

def delete_user_sheet(user_sheet_id, user_id):
    supabase_admin = get_supabase_admin()
    
    sheet_response = supabase_admin.table('user_sheets').select('user_id').eq('id', user_sheet_id).single().execute()

    if not sheet_response.data or sheet_response.data['user_id'] != user_id:
        raise PermissionError('Access denied')

    # Get files to delete
    files_response = supabase_admin.table('sheet_files').select(
        "storage_path"
    ).eq('user_sheet_id', user_sheet_id).execute()
    
    # Delete from storage
    for file_data in files_response.data:
        try:
            supabase_admin.storage.from_('label-sheets').remove([file_data['storage_path']])
        except Exception as e:
            print(f"Failed to delete file {file_data['storage_path']}: {e}")
    
    # Delete from database
    supabase_admin.table('user_sheets').delete().eq('id', user_sheet_id).execute()