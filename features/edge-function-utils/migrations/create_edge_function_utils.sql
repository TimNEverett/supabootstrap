-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

create schema if not exists "private";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.get_supabase_anon_key()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION private.get_supabase_service_role_key()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION private.get_supabase_url()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION private.invoke_edge_fn(fn_name text, payload jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;


