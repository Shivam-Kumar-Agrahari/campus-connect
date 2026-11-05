const SUPABASE_URL = "https://nxcczrclzbcgsknidqfo.supabase.co";
const SUPABASE_KEY = "sb_publishable_ory8JwJKD_Pz2R45ailHCg_GTOi4RPc";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const DEFAULT_STAFF_PASSWORD = "SHIVAM";
function getStaffPassword() {
  return localStorage.getItem('staff_password') || DEFAULT_STAFF_PASSWORD;
}