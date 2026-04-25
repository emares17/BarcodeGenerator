import base64
import pandas as pd
import uuid
import time
import os
from flask import current_app
from services.storage_service import create_zip_from_sheets, upload_zip_to_storage
from services.redis_client import cache_zip
from utils.PDFSheetGenerator import PDFSheetGenerator
from models.database import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

_LABEL_INSERT_CHUNK = 500


def _bulk_insert_label_items(records):
    """Insert label metadata in chunks. Best-effort — never raises."""
    if not records:
        return
    try:
        db = get_supabase_admin()
        for i in range(0, len(records), _LABEL_INSERT_CHUNK):
            db.table('label_items').insert(records[i:i + _LABEL_INSERT_CHUNK]).execute()
        logger.info("Inserted %d label_items records", len(records))
    except Exception as e:
        logger.error("label_items bulk insert failed (non-fatal): %s", e)


def process_label_file(file, user_id, secure_filename, template_id=None, column_mapping=None, barcode_type='code128'):

    logger.info("Starting process_label_file for user %s", user_id)

    if not column_mapping:
        column_mapping = {
            'barcode_column': 1,
            'text_columns': [
                {'column': 0, 'label': 'Location'},
                {'column': 3, 'label': 'Unit'}
            ],
            'has_header_row': False
        }

    ext = os.path.splitext(secure_filename)[1]
    saved_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], saved_name)
    file.save(filepath)
    logger.info("File saved to %s", filepath)

    try:
        header_arg = 0 if column_mapping.get('has_header_row') else None
        if secure_filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(filepath, header=header_arg)
        else:
            df = pd.read_csv(filepath, header=header_arg)
        logger.info("File parsed, shape: %s", df.shape)

        barcode_col = column_mapping['barcode_column']
        text_cols = column_mapping.get('text_columns', [])

        labels = []
        for _, row in df.iterrows():
            if barcode_col >= len(row):
                continue
            barcode_value = str(row.iloc[barcode_col]).strip()[:100]
            if not barcode_value or barcode_value == 'nan':
                continue
            text_lines = []
            for tc in text_cols:
                col_idx = tc['column']
                if col_idx < len(row):
                    val = str(row.iloc[col_idx]).strip()[:100]
                    if val and val != 'nan':
                        text_lines.append((tc['label'], val))
            labels.append((barcode_value, text_lines))

        if not labels:
            raise ValueError('No valid data found in file')

        label_count = len(labels)
        if label_count > current_app.config['MAX_LABELS']:
            raise ValueError(f'Too many labels. Maximum: {current_app.config["MAX_LABELS"]}')

        logger.info("Processing %d labels...", label_count)
        start_time = time.time()

        effective_template_id = template_id or current_app.config['DEFAULT_TEMPLATE']
        template = current_app.config['LABEL_TEMPLATES'].get(effective_template_id)
        sheet_gen = PDFSheetGenerator(current_app.config['SHEET_FOLDER'], template)
        sheets = sheet_gen.generate_pdf_sheets(labels, barcode_type=barcode_type)

        logger.info("PDF generation: %.2fs", time.time() - start_time)

        zip_start = time.time()
        zip_buffer = create_zip_from_sheets(current_app.config['SHEET_FOLDER'], sheets)

        user_sheet_data = {
            'user_id': user_id,
            'original_filename': secure_filename,
            'label_count': label_count,
            'sheet_count': len(sheets),
            'total_size_bytes': 0,
        }
        sheet_response = get_supabase_admin().table('user_sheets').insert(user_sheet_data).execute()

        if not sheet_response.data:
            raise Exception("Failed to create user_sheets record")

        user_sheet_id = sheet_response.data[0]['id']

        upload_result = upload_zip_to_storage(user_id, user_sheet_id, zip_buffer, secure_filename)

        if not upload_result['success']:
            get_supabase_admin().table('user_sheets').delete().eq('id', user_sheet_id).execute()
            raise Exception(f'ZIP upload failed: {upload_result.get("error", "Unknown error")}')

        get_supabase_admin().table('user_sheets').update({
            'total_size_bytes': upload_result['zip_size'],
            'template_id': effective_template_id,
            'barcode_type': barcode_type,
        }).eq('id', user_sheet_id).execute()

        logger.info("ZIP & upload: %.2fs", time.time() - zip_start)

        sheet_file_data = {
            'user_sheet_id': user_sheet_id,
            'filename': f'sheets_{user_sheet_id}.zip',
            'storage_path': upload_result['storage_path'],
            'file_size_bytes': upload_result['zip_size'],
            'sheet_number': 0,
        }
        get_supabase_admin().table('sheet_files').insert(sheet_file_data).execute()

        # Cache ZIP for instant download (best-effort)
        try:
            cache_zip(user_sheet_id, zip_buffer.getvalue())
        except Exception as e:
            logger.warning("Redis cache write failed (non-fatal): %s", e)

        # Store label metadata for search/reprint (best-effort)
        labels_per_sheet = sheet_gen.rows * sheet_gen.columns
        label_records = [
            {
                'user_sheet_id': user_sheet_id,
                'user_id': user_id,
                'label_index': idx,
                'sheet_number': (idx // labels_per_sheet) + 1,
                'position_on_sheet': idx % labels_per_sheet,
                'barcode_value': barcode_value,
                'text_fields': [{'label': l, 'value': v} for l, v in text_lines],
                'barcode_type': barcode_type,
                'template_id': effective_template_id,
            }
            for idx, (barcode_value, text_lines) in enumerate(labels)
        ]
        _bulk_insert_label_items(label_records)

        os.remove(filepath)
        for sheet in sheets:
            sheet_path = os.path.join(current_app.config['SHEET_FOLDER'], sheet)
            if os.path.exists(sheet_path):
                os.remove(sheet_path)

        logger.info("Total processing time: %.2fs", time.time() - start_time)

        return {
            'success': True,
            'user_sheet_id': user_sheet_id,
            'storage_path': upload_result['storage_path'],
            'zip_size': upload_result['zip_size'],
            'template_used': effective_template_id,
            'label_count': label_count,
            'sheet_count': len(sheets),
            'message': f'Successfully processed {label_count} labels and uploaded as ZIP'
        }

    except Exception as e:
        logger.error("Processing failed, cleaning up temp files.")
        if os.path.exists(filepath):
            os.remove(filepath)
        raise


def generate_label_preview(file, user_id, secure_filename, template_id=None, column_mapping=None, barcode_type='code128'):
    logger.info("Starting generate_label_preview for user %s", user_id)

    if not column_mapping:
        column_mapping = {
            'barcode_column': 1,
            'text_columns': [
                {'column': 0, 'label': 'Location'},
                {'column': 3, 'label': 'Unit'}
            ],
            'has_header_row': False
        }

    ext = os.path.splitext(secure_filename)[1]
    saved_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], saved_name)
    file.save(filepath)

    try:
        header_arg = 0 if column_mapping.get('has_header_row') else None
        if secure_filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(filepath, header=header_arg)
        else:
            df = pd.read_csv(filepath, header=header_arg)

        barcode_col = column_mapping['barcode_column']
        text_cols = column_mapping.get('text_columns', [])

        labels = []
        for _, row in df.iterrows():
            if barcode_col >= len(row):
                continue
            barcode_value = str(row.iloc[barcode_col]).strip()[:100]
            if not barcode_value or barcode_value == 'nan':
                continue
            text_lines = []
            for tc in text_cols:
                col_idx = tc['column']
                if col_idx < len(row):
                    val = str(row.iloc[col_idx]).strip()[:100]
                    if val and val != 'nan':
                        text_lines.append((tc['label'], val))
            labels.append((barcode_value, text_lines))

        if not labels:
            raise ValueError('No valid data found in file')

        label_count = len(labels)
        if label_count > current_app.config['MAX_LABELS']:
            raise ValueError(f'Too many labels. Maximum: {current_app.config["MAX_LABELS"]}')

        template = current_app.config['LABEL_TEMPLATES'].get(template_id) if template_id else None
        sheet_gen = PDFSheetGenerator(current_app.config['SHEET_FOLDER'], template)
        pdf_bytes = sheet_gen.generate_preview_sheet(labels, barcode_type=barcode_type)

        os.remove(filepath)

        labels_per_sheet = sheet_gen.rows * sheet_gen.columns
        total_sheets = (label_count + labels_per_sheet - 1) // labels_per_sheet

        logger.info("Preview generated for user %s: %d labels, %d sheets", user_id, label_count, total_sheets)

        return {
            'preview_pdf': base64.b64encode(pdf_bytes).decode('utf-8'),
            'label_count': label_count,
            'total_sheets': total_sheets,
            'labels_on_first_sheet': min(label_count, labels_per_sheet),
        }

    except Exception as e:
        logger.error("Preview generation failed, cleaning up temp files.")
        if os.path.exists(filepath):
            os.remove(filepath)
        raise
