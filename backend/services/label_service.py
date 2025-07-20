import pandas as pd
import uuid
import time
import os
import concurrent.futures
import base64
from flask import current_app
from utils.BarcodeGenerator import BarcodeGenerator
from utils.LabelSheetGenerator import LabelSheetGenerator
from services.storage_service import upload_files_to_storage
from models.database import get_supabase_admin
from utils.file_utils import cleanup_images_async

file_lock = Lock()

def thread_safe_barcode_worker(location, part, unit, image_folder):
    try:
        print(f"Generating barcode for: {location}")
        
        # Import here to avoid threading issues
        from utils.BarcodeGenerator import BarcodeGenerator
        
        generator = BarcodeGenerator(2.5, 2.0, 600, {}, image_folder)
        
        with file_lock:
            result = generator.generate_image(location, part, unit, image_folder)
        
        print(f"Generated barcode for: {location}")
        return result
        
    except Exception as e:
        print(f"Failed to generate barcode for {location}: {e}")
        return None

def generate_barcode_worker(location, part, unit, folder):
    generator = BarcodeGenerator(2.5, 2.0, 600, {}, folder)
    generator.generate_image(location, part, unit, folder)
    return f"Generated: {location}"

def process_label_file(file, user_id, secure_filename):

    print(f"Starting process_label_file for user {user_id}")

    # Save uploaded file
    ext = os.path.splitext(secure_filename)[1]
    saved_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], saved_name)

    print(f"Saving file to: {filepath}")

    file.save(filepath)

    print(f"File saved successfully")
    
    try:
        # Parse file
        if secure_filename.endswith(('.xlsx', '.xls')):
            print(f"Starting file parsing...")
            df = pd.read_excel(filepath, header=None)
        else:
            df = pd.read_csv(filepath, header=None)
        print(f"File parsed successfully, shape: {df.shape}")
        
        # Validate and process data
        inventory = {}
        for _, row in df.iterrows():
            location = str(row.iloc[0]).strip()[:100]
            part = str(row.iloc[1]).strip()[:100]
            unit = str(row.iloc[3]).strip()[:100] if len(row) > 3 else ""
            
            if not location or not part:
                continue
                
            inventory[location] = (part, unit)
        
        if not inventory:
            raise ValueError('No valid data found in file')
        
        label_count = len(inventory)
        if label_count > current_app.config['MAX_LABELS']:
            raise ValueError(f'Too many labels. Maximum: {current_app.config["MAX_LABELS"]}')
        
        # Process labels
        start_time = time.time()
        print(f"\n Processing {label_count} labels...")
        
        # Generate barcodes
        max_workers = min(
            current_app.config['MAX_CONCURRENT_WORKERS'], 
            os.cpu_count() - 1, 
            len(inventory)
        )

        print(f"Starting barcode generation with {max_workers} threads...")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(
                    thread_safe_barcode_worker, 
                    location, part, unit, 
                    current_app.config['IMAGE_FOLDER']
                ): location for location, (part, unit) in inventory.items()
            }
            # concurrent.futures.wait(futures)

            completed = 0
            failed = 0
    
            for future in concurrent.futures.as_completed(futures):
                location = futures[future]
                try:
                    result = future.result()
                    if result:
                        completed += 1
                    else:
                        failed += 1
                except Exception as e:
                    print(f"Thread failed for {location}: {e}")
                    failed += 1

        print(f"Barcode generation completed: {completed} success, {failed} failed")

        # Check if any barcode images were created:
        image_folder = current_app.config['IMAGE_FOLDER']
        if os.path.exists(image_folder):
            barcode_files = os.listdir(image_folder)
            print(f"🔍 Barcode files generated: {len(barcode_files)}")
            print(f"🔍 First few files: {barcode_files[:5] if barcode_files else 'NONE'}")
        else:
            print(f"🔍 IMAGE FOLDER DOESN'T EXIST: {image_folder}")

        barcode_time = time.time()
        barcode_duration = barcode_time - start_time

        # Generate sheets
        sheet_gen = LabelSheetGenerator(
            220, 180, 35, 85, 5, 4, 
            current_app.config['IMAGE_FOLDER']
        )
        sheet_gen.generate_sheet()

        sheet_time = time.time()
        sheet_duration = sheet_time - barcode_time
        
        # Move sheets to proper folder
        sheets = [f for f in os.listdir('.') 
                 if f.startswith('label_sheet') and f.endswith('.png')]
        
        for sheet in sheets:
            os.rename(sheet, os.path.join(current_app.config['SHEET_FOLDER'], sheet))
        
        # Upload to storage
        result = _upload_sheets_to_storage(
            user_id, secure_filename, sheets, label_count
        )
        
        # Cleanup
        os.remove(filepath)
        for sheet in sheets:
            sheet_path = os.path.join(current_app.config['SHEET_FOLDER'], sheet)
            if os.path.exists(sheet_path):
                os.remove(sheet_path)
        
        cleanup_images_async(current_app.config['IMAGE_FOLDER'])
        
        # Performance logging
        total_time = time.time() - start_time
        print(f"   PERFORMANCE RESULTS:")
        print(f"   Labels processed: {label_count}")
        print(f"   Barcode generation: {barcode_duration:.2f}s")
        print(f"   Sheet generation: {sheet_duration:.2f}s")
        print(f"   Total time: {total_time:.2f}s")
        
        return result
        
    except Exception as e:
        # Cleanup on error
        if os.path.exists(filepath):
            os.remove(filepath)
        cleanup_images_async(current_app.config['IMAGE_FOLDER'])
        raise e

def _upload_sheets_to_storage(user_id, filename, sheets, label_count):
    supabase_admin = get_supabase_admin()
    
    # Create user_sheets record
    user_sheet_data = {
        'user_id': user_id,
        'original_filename': filename,
        'label_count': label_count,
        'sheet_count': len(sheets),
        'total_size_bytes': 0
    }
    
    sheet_response = supabase_admin.table('user_sheets').insert(user_sheet_data).execute()
    
    if not sheet_response.data:
        raise Exception("Failed to create user_sheets record")
        
    user_sheet_id = sheet_response.data[0]['id']
    
    # Prepare file data
    file_data = []
    total_size = 0
    
    for i, sheet_filename in enumerate(sheets):
        sheet_path = os.path.join(current_app.config['SHEET_FOLDER'], sheet_filename)
        file_size = os.path.getsize(sheet_path)
        total_size += file_size
        
        with open(sheet_path, 'rb') as f:
            file_content = f.read()
            base64_content = base64.b64encode(file_content).decode('utf-8')
        
        file_data.append({
            'filename': sheet_filename,
            'content': base64_content,
            'size': file_size,
            'sheet_number': i + 1
        })
    
    # Upload files
    upload_result = upload_files_to_storage(user_id, user_sheet_id, file_data)
    
    if not upload_result['success']:
        # Cleanup on failure
        supabase_admin.table('user_sheets').delete().eq('id', user_sheet_id).execute()
        raise Exception(f'Upload failed: {upload_result["errors"]}')
    
    # Update total size
    supabase_admin.table('user_sheets').update({
        'total_size_bytes': total_size
    }).eq('id', user_sheet_id).execute()
    
    return {
        'success': True,
        'user_sheet_id': user_sheet_id,
        'files_uploaded': upload_result['total_uploaded'],
        'total_size': total_size,
        'label_count': label_count,
        'sheet_count': len(sheets),
        'message': f'Successfully processed {label_count} labels and uploaded {upload_result["total_uploaded"]} sheets'
    }