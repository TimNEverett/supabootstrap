# Testing the Install Functionality

## Test Scenario 1: Basic Install

1. **Create a test directory:**
```bash
mkdir supabootstrap-test
cd supabootstrap-test
```

2. **Initialize with mock Supabase project:**
```bash
# Create basic Supabase structure
mkdir -p supabase/migrations
mkdir -p supabase/functions
echo '[project_id = "test"]' > supabase/config.toml
```

3. **Initialize SupaBootstrap:**
```bash
supabootstrap init
```

4. **Try to install the placeholder feature:**
```bash
supabootstrap install placeholder-feature
```

Expected behavior:
- Should detect no conflicts (clean install)
- Should create migration files using mock setup
- Should create function directory structure
- Should copy all feature files
- Should update configuration

## Test Scenario 2: Conflict Resolution

1. **Create conflicting files:**
```bash
# Create conflicting schema file
mkdir -p supabase/schemas
echo "-- conflicting schema" > supabase/schemas/placeholder.sql

# Create conflicting function
mkdir -p supabase/functions/placeholder-fn
echo "// conflicting function" > supabase/functions/placeholder-fn/index.ts
```

2. **Try to install with conflicts:**
```bash
supabootstrap install placeholder-feature
```

Expected behavior:
- Should detect conflicts
- Should prompt user for each conflict
- Should allow user to choose overwrite/skip
- Should proceed with user choices

## Test Scenario 3: Dependencies

1. **Try to install RAG database (has dependencies):**
```bash
supabootstrap install rag-database
```

Expected behavior:
- Should detect missing dependency: edge-fn-utils  
- Should offer to install dependencies first
- Should install edge-fn-utils then rag-database

## Test Scenario 4: Reinstall

1. **Try to reinstall an already installed feature:**
```bash
supabootstrap install placeholder-feature
```

Expected behavior:
- Should detect feature is already installed
- Should ask if user wants to reinstall
- Should proceed if confirmed

## Mock Test (Without Supabase CLI)

If Supabase CLI is not available, the install will fail with proper error message. For development testing, you could mock the Supabase CLI calls by temporarily modifying the supabase-cli.ts file.