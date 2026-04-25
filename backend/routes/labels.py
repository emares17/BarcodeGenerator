import io
from flask import Blueprint, request, jsonify, send_file, current_app
from auth.decorators import verify_session_auth
from services.label_inventory_service import search_labels, generate_reprint_pdf

labels_bp = Blueprint('labels', __name__)


@labels_bp.route('/search', methods=['GET'])
@verify_session_auth
def search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'q parameter is required'}), 400
    if len(query) > 100:
        return jsonify({'error': 'Query too long (max 100 characters)'}), 400

    try:
        limit = min(int(request.args.get('limit', 50)), 200)
        offset = max(int(request.args.get('offset', 0)), 0)
    except ValueError:
        return jsonify({'error': 'limit and offset must be integers'}), 400

    try:
        result = search_labels(request.user_id, query, limit=limit, offset=offset)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error("Label search error for user %s: %s", request.user_id, e)
        return jsonify({'error': 'Search failed'}), 500


@labels_bp.route('/<label_id>/reprint', methods=['GET'])
@verify_session_auth
def reprint(label_id):
    try:
        pdf_bytes = generate_reprint_pdf(label_id, request.user_id)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'reprint_{label_id[:8]}.pdf',
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        current_app.logger.error("Reprint error for label %s: %s", label_id, e)
        return jsonify({'error': 'Reprint failed'}), 500
