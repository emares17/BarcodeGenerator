import io
import logging
from flask import current_app
from models.database import get_supabase_admin
from utils.PDFSheetGenerator import PDFSheetGenerator

logger = logging.getLogger(__name__)


def search_labels(user_id, query, limit=50, offset=0):
    """
    Search a user's label_items by barcode value or text field content.
    Returns { results, total, limit, offset }.
    """
    db = get_supabase_admin()
    safe_query = query.replace('%', '').replace('_', '')[:100]

    response = (
        db.table('label_items')
        .select('*, user_sheets!inner(original_filename)')
        .eq('user_id', user_id)
        .ilike('barcode_value', f'%{safe_query}%')
        .order('created_at', desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    results = []
    for row in (response.data or []):
        sheet_info = row.pop('user_sheets', {}) or {}
        row['original_filename'] = sheet_info.get('original_filename', '')
        results.append(row)

    # Best-effort count via a separate query
    try:
        count_response = (
            db.table('label_items')
            .select('id', count='exact')
            .eq('user_id', user_id)
            .ilike('barcode_value', f'%{safe_query}%')
            .execute()
        )
        total = count_response.count or len(results)
    except Exception:
        total = len(results)

    return {'results': results, 'total': total, 'limit': limit, 'offset': offset}


def generate_reprint_pdf(label_id, user_id):
    """
    Generate a single-label PDF for reprint.
    Returns raw PDF bytes.
    Raises ValueError if not found, PermissionError if wrong user.
    """
    db = get_supabase_admin()

    response = db.table('label_items').select('*').eq('id', label_id).single().execute()
    if not response.data:
        raise ValueError('Label not found')

    row = response.data
    if row['user_id'] != user_id:
        raise PermissionError('Access denied')

    label = (
        row['barcode_value'],
        [(tf['label'], tf['value']) for tf in (row['text_fields'] or [])],
    )

    template = current_app.config['LABEL_TEMPLATES'].get(row['template_id'])
    sheet_gen = PDFSheetGenerator(current_app.config['SHEET_FOLDER'], template)
    pdf_bytes = sheet_gen.generate_preview_sheet([label], barcode_type=row['barcode_type'])

    return pdf_bytes
