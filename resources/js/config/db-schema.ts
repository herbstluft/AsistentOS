export const DB_SCHEMA = `
CONTEXTO DE BASE DE DATOS (MySQL / Laravel):
- appointments (id, user_id, title, description, start_time, end_time, reminder_minutes_before, created_at, updated_at, status)
- assistant_preferences (id, user_id, assistant_name, palette_id, created_at, updated_at)
- biometric_credentials (id, user_id, credential_id, public_key, name, sign_count, created_at, updated_at)
- cache (key, value, expiration)
- cache_locks (key, owner, expiration)
- contacts (id, name, phone, email, company, notes, created_at, updated_at, user_id)
- expenses (id, user_id, amount, description, category, date, created_at, updated_at)
- job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at)
- jobs (id, queue, payload, attempts, reserved_at, available_at, created_at)
- incomes (id, user_id, amount, description, source, date, created_at, updated_at)
- memories (id, user_id, key, value, type, created_at, updated_at)
- notes (id, user_id, title, content, created_at, updated_at)
- palettes (id, name, created_at, updated_at)
- sessions (id, user_id, ip_address, user_agent, payload, last_activity)
- users (id, name, email, preferred_voice, email_verified_at, password, security_nip, two_factor_secret, two_factor_recovery_codes, two_factor_confirmed_at, remember_token, created_at, updated_at, is_admin, spotify_id, spotify_access_token, spotify_refresh_token, spotify_token_expires_at)
`;
