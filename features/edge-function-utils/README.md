# Edge Function Utils Feature

## Description
Provides utility functions for edge function development, including secure access to Supabase configuration values and a helper function to invoke edge functions from within the database.

## Files
- `schemas/edge-function-utils.sql` - Database schema with utility functions
- `migrations/create_edge_function_utils.sql` - Database migration
- `seed/seed.sql` - Seed data for vault configuration

## Usage

### Available Functions

#### Configuration Access Functions
- `private.get_supabase_url()` - Retrieves the Supabase URL from vault
- `private.get_supabase_anon_key()` - Retrieves the anonymous key from vault
- `private.get_supabase_service_role_key()` - Retrieves the service role key from vault

#### Edge Function Invocation
- `private.invoke_edge_fn(fn_name TEXT, payload JSONB)` - Fire-and-forget HTTP POST to invoke edge functions

### Example Usage

```sql
-- Invoke an edge function from a database trigger or function
SELECT private.invoke_edge_fn('my-function', '{"data": "example"}'::jsonb);

-- Access configuration in your functions
SELECT private.get_supabase_url();
```

### Setup Requirements

Before using these functions, you need to store your Supabase configuration in the vault:

1. Store your Supabase URL, anon key, and service role key in the vault with names:
   - `supabase_url`
   - `supabase_anon_key`
   - `supabase_service_role_key`

2. The functions are granted execute permissions to `service_role` only for security.
