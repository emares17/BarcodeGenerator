from supabase import create_client, Client

supabase_user = None
supabase_admin = None

def init_database(app):
    global supabase_user, supabase_admin
    
    with app.app_context():
        supabase_user = create_client(
            app.config['SUPABASE_URL'], 
            app.config['SUPABASE_ANON_KEY']
        )
        supabase_admin = create_client(
            app.config['SUPABASE_URL'], 
            app.config['SUPABASE_SERVICE_KEY']
        )

def get_supabase_user():
    return supabase_user

def get_supabase_admin():
    return supabase_admin