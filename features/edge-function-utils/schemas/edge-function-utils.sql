-- Create functions in the private schema to get Supabase configuration values from vault
create schema if not exists "private";

-- Function to get Supabase URL
CREATE OR REPLACE FUNCTION private.get_supabase_url()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    SELECT decrypted_secret INTO secret_value 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_url';
    
    IF secret_value IS NULL THEN
        RAISE EXCEPTION 'Secret "supabase_url" not found in vault';
    END IF;
    
    RETURN secret_value;
END;
$$;

-- Function to get Supabase anon key
CREATE OR REPLACE FUNCTION private.get_supabase_anon_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    SELECT decrypted_secret INTO secret_value 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_anon_key';
    
    IF secret_value IS NULL THEN
        RAISE EXCEPTION 'Secret "supabase_anon_key" not found in vault';
    END IF;
    
    RETURN secret_value;
END;
$$;

-- Function to get Supabase service role key
CREATE OR REPLACE FUNCTION private.get_supabase_service_role_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    SELECT decrypted_secret INTO secret_value 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_service_role_key';
    
    IF secret_value IS NULL THEN
        RAISE EXCEPTION 'Secret "supabase_service_role_key" not found in vault';
    END IF;
    
    RETURN secret_value;
END;
$$;

-- Function to invoke edge functions (fire and forget)
CREATE OR REPLACE FUNCTION private.invoke_edge_fn(
    fn_name TEXT,
    payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    supabase_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Get configuration values
    supabase_url := private.get_supabase_url();
    service_role_key := private.get_supabase_service_role_key();
    
    -- Fire and forget HTTP POST request to edge function
    PERFORM net.http_post(
        url := supabase_url || '/functions/v1/' || fn_name,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || service_role_key,
            'Content-Type', 'application/json'
        ),
        body := payload
    );
END;
$$;

-- Grant execute permissions only to service_role
GRANT EXECUTE ON FUNCTION private.get_supabase_url() TO service_role;
GRANT EXECUTE ON FUNCTION private.get_supabase_anon_key() TO service_role;
GRANT EXECUTE ON FUNCTION private.get_supabase_service_role_key() TO service_role;
GRANT EXECUTE ON FUNCTION private.invoke_edge_fn(TEXT, JSONB) TO service_role;
