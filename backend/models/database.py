from supabase import create_client, Client

supabase_user = None
supabase_admin = None

def init_database(app):
    if app.config.get('TESTING'):
        return
    url = app.config.get('SUPABASE_URL')
    anon_key = app.config.get('SUPABASE_ANON_KEY')
    service_key = app.config.get('SUPABASE_SERVICE_KEY')
    if not url or not anon_key or not service_key:
        return
    global supabase_user, supabase_admin
    with app.app_context():
        supabase_user = create_client(url, anon_key)
        supabase_admin = create_client(url, service_key)

def get_supabase_user():
    return supabase_user

def get_supabase_admin():
    return supabase_admin