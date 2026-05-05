from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_SERVICE_KEY

# Service-role client — has full DB access, only used server-side
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
