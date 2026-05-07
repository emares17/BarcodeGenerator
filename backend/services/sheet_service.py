import io
import zipfile
import logging
from models.database import get_supabase_admin
from services.redis_client import cache_zip, get_cached_zip, invalidate_zip

logger = logging.getLogger(__name__)


def get_user_sheets(user_id):
    supabase_admin = get_supabase_admin()

    sheets_response = supabase_admin.table('user_sheets').select(
        "*, sheet_files(count)"
    ).eq('user_id', user_id).order('created_at', desc=True).execute()

    return sheets_response.data


def _fetch_zip(user_sheet_id, user_id):
    """
    Auth check then return (BytesIO of ZIP, original_filename, sheet_count).
    Checks Redis first; falls back to Supabase and re-caches on miss.
    """
    supabase_admin = get_supabase_admin()

    files_response = supabase_admin.table('sheet_files').select(
        "*, user_sheets!inner(user_id, original_filename, sheet_count)"
    ).eq('user_sheet_id', user_sheet_id).execute()

    if not files_response.data:
        raise ValueError('No sheets found')

    sheet_meta = files_response.data[0]['user_sheets']
    if sheet_meta['user_id'] != user_id:
        raise PermissionError('Access denied')

    original_filename = sheet_meta['original_filename']
    sheet_count = sheet_meta['sheet_count']

    # Redis cache hit
    cached = get_cached_zip(user_sheet_id)
    if cached:
        logger.info("ZIP cache hit for %s", user_sheet_id)
        return io.BytesIO(cached), original_filename, sheet_count

    # Cache miss — fetch from Supabase
    zip_file = next((f for f in files_response.data if f.get('sheet_number') == 0), None)

    if zip_file and zip_file['filename'].endswith('.zip'):
        zip_data = supabase_admin.storage.from_('label-sheets').download(zip_file['storage_path'])
        if not zip_data:
            raise ValueError('Failed to download ZIP file')
    else:
        # Legacy: rebuild ZIP from individual PDF files
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_data in files_response.data:
                if file_data.get('sheet_number', 1) > 0:
                    file_response = supabase_admin.storage.from_('label-sheets').download(
                        file_data['storage_path']
                    )
                    if file_response:
                        zf.writestr(file_data['filename'], file_response)
        buf.seek(0)
        zip_data = buf.getvalue()

    # Read-through: re-cache so subsequent requests are fast
    cache_zip(user_sheet_id, zip_data)

    return io.BytesIO(zip_data), original_filename, sheet_count


def create_sheet_download(user_sheet_id, user_id):
    zip_buffer, original_filename, _ = _fetch_zip(user_sheet_id, user_id)
    return zip_buffer, f"{original_filename}_labels.zip"


def extract_single_sheet(user_sheet_id, user_id, sheet_number):
    zip_buffer, original_filename, sheet_count = _fetch_zip(user_sheet_id, user_id)

    if sheet_number < 1 or sheet_number > sheet_count:
        raise ValueError(f'Sheet {sheet_number} does not exist (total: {sheet_count})')

    with zipfile.ZipFile(zip_buffer, 'r') as zf:
        target = f"sheet_{sheet_number:03d}.pdf"
        if target not in zf.namelist():
            raise ValueError(f'Sheet {sheet_number} not found in archive')
        pdf_bytes = zf.read(target)

    base_name = original_filename.rsplit('.', 1)[0]
    return io.BytesIO(pdf_bytes), f"{base_name}_sheet_{sheet_number}.pdf"


def extract_selected_sheets(user_sheet_id, user_id, sheet_numbers):
    if not sheet_numbers:
        raise ValueError('No sheet numbers provided')

    zip_buffer, original_filename, sheet_count = _fetch_zip(user_sheet_id, user_id)

    invalid = [n for n in sheet_numbers if n < 1 or n > sheet_count]
    if invalid:
        raise ValueError(f'Invalid sheet numbers: {invalid}')

    out_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'r') as src_zf:
        with zipfile.ZipFile(out_buffer, 'w', zipfile.ZIP_DEFLATED) as out_zf:
            for n in sorted(sheet_numbers):
                target = f"sheet_{n:03d}.pdf"
                if target in src_zf.namelist():
                    out_zf.writestr(target, src_zf.read(target))

    out_buffer.seek(0)
    base_name = original_filename.rsplit('.', 1)[0]
    nums = '_'.join(str(n) for n in sorted(sheet_numbers))
    return out_buffer, f"{base_name}_sheets_{nums}.zip"


def delete_user_sheet(user_sheet_id, user_id):
    supabase_admin = get_supabase_admin()

    sheet_response = supabase_admin.table('user_sheets').select('user_id').eq(
        'id', user_sheet_id
    ).maybe_single().execute()

    if not sheet_response.data:
        raise LookupError('Sheet not found')
    if sheet_response.data['user_id'] != user_id:
        raise PermissionError('Access denied')

    files_response = supabase_admin.table('sheet_files').select(
        "storage_path"
    ).eq('user_sheet_id', user_sheet_id).execute()

    for file_data in files_response.data:
        try:
            supabase_admin.storage.from_('label-sheets').remove([file_data['storage_path']])
        except Exception as e:
            logger.warning("Failed to delete file %s: %s", file_data['storage_path'], e)

    supabase_admin.table('user_sheets').delete().eq('id', user_sheet_id).execute()

    # Evict from cache
    invalidate_zip(user_sheet_id)
