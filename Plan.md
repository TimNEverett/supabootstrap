# SupaBootstrap CLI - Clean & Simple Implementation Plan

## Project Overview

SupaBootstrap is a CLI utility that can be run with `npx` to install database features into a Supabase project by copying files into the supabase directory. It allows users to easily add pre-built functionality like RAG databases, edge function queues, graph database structures, and more.

## Design Philosophy: Clean & Minimal

The CLI prioritizes **clean, quiet, and efficient** user experience with these core principles:

- **Minimal output** - Show only essential information 
- **No verbose banners or progress messages** - Work quietly in the background
- **Essential results only** - Success status, file count, and next steps
- **Streamlined interactions** - No redundant confirmations unless conflicts exist
- **Clean terminal** - Temporary messages are cleared, leaving only final results

## Core Architecture

### Technology Stack

- **TypeScript** for type safety and better developer experience
- **Commander.js** for CLI argument parsing
- **Inquirer.js** for interactive prompts
- **JSON** for configuration and feature registry

### Project Structure

```
supabootstrap/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── Plan.md                          # This file
├── bin/
│   └── supabootstrap.js             # Executable entry point
├── src/
│   ├── index.ts                     # Main CLI entry point
│   ├── commands/
│   │   ├── index.ts                 # Command exports
│   │   ├── init.ts                  # Initialize project + config
│   │   ├── list.ts                  # List available features
│   │   ├── install.ts               # Install feature with conflict resolution
│   │   ├── uninstall.ts             # Remove features
│   │   └── doctor.ts                # Check for modified files
│   ├── core/
│   │   ├── config.ts                # Configuration loading/validation
│   │   ├── registry.ts              # Feature registry manager
│   │   ├── validator.ts             # Supabase project validation
│   │   ├── installer.ts             # File copying and conflict resolution
│   │   ├── migration-generator.ts   # Supabase migration CLI integration
│   │   ├── function-generator.ts    # Supabase function CLI integration
│   │   └── supabase-cli.ts          # Wrapper for supabase commands
│   └── utils/
│       ├── file-operations.ts       # File system utilities
│       ├── prompts.ts               # User interaction prompts
│       ├── path-resolver.ts         # Handle sourceDir resolution
│       ├── diff.ts                  # For doctor command
│       ├── migration-scanner.ts     # Migration name comparison utilities
│       ├── content-comparison.ts    # File content comparison utilities
│       ├── console.ts               # Transient console output management
│       └── types.ts                 # TypeScript type definitions
├── features/
│   ├── features.json                # Global feature registry
│   └── placeholder-feature/         # Example feature structure
│       ├── README.md                # Feature documentation
│       ├── schemas/                 # Optional: SQL schema files
│       │   └── placeholder.sql
│       ├── migrations/              # Optional: SQL migration templates
│       │   └── create_placeholder_table.sql
│       └── functions/               # Optional: Edge function code
│           └── placeholder-fn/
│               ├── index.ts
│               └── package.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── config-schema.json               # JSON schema for user config validation
```

## CLI Commands

### Core Commands

- `npx supabootstrap init` - Initialize project and create config file
- `npx supabootstrap list` - Show available features with descriptions
- `npx supabootstrap install <feature>` - Install a feature with conflict resolution
- `npx supabootstrap uninstall <feature>` - Remove a feature
- `npx supabootstrap doctor` - Check for modified feature files

### Future Commands

- `npx supabootstrap upgrade` - Upgrade installed features (future implementation)

## Feature System

### Feature Directory Structure

Each feature is self-contained in its own directory under `features/`:

```
features/
├── features.json                    # Global registry with metadata and dependencies
└── [feature-name]/
    ├── README.md                    # Feature documentation and usage
    ├── schemas/                     # Optional: SQL schema files
    ├── migrations/                  # Optional: Migration templates
    └── functions/                   # Optional: Edge function code
```

### Global Feature Registry (`features/features.json`)

```json
{
  "version": "1.0.0",
  "features": {
    "placeholder-feature": {
      "name": "Placeholder Feature",
      "description": "Example feature showing the structure",
      "version": "1.0.0",
      "dependencies": [],
      "category": "example"
    },
    "edge-fn-utils": {
      "name": "Edge Function Utilities",
      "description": "Core utilities for invoking edge functions from database",
      "version": "1.0.0",
      "dependencies": [],
      "category": "core"
    },
    "rag-database": {
      "name": "RAG Database with Embeddings",
      "description": "Vector embeddings and similarity search for RAG applications",
      "version": "1.0.0",
      "dependencies": ["edge-fn-utils"],
      "category": "ai"
    }
  }
}
```

### Adding New Features

To add a new feature:

1. Create new directory: `features/my-new-feature/`
2. Add feature files in appropriate subdirectories (`schemas/`, `migrations/`, `functions/`)
3. Write `features/my-new-feature/README.md`
4. Update `features/features.json` with metadata and dependencies

## User Configuration System

### Configuration File Location

- File: `.supabootstrap.json` (in user's project root)
- Format: JSON with validation schema

### Configuration Schema

```json
{
  "$schema": "https://supabootstrap.dev/config.schema.json",
  "version": "1.0.0",
  "sourceDir": "./supabase",
  "filePrefix": undefined,
  "installedFeatures": {}
}
```

### Configuration Options

#### `version` (string, required)

- Version of supabootstrap CLI that created/last updated this config
- Used for future upgrade compatibility checks
- Automatically set during `init` and updated during installations

#### `sourceDir` (string, default: `"./supabase"`)

- Path to the Supabase directory relative to project root
- Examples:
  - `"./supabase"` - Standard Supabase project
  - `"./apps/backend/supabase"` - Monorepo structure
  - `"./database"` - Custom directory name

#### `filePrefix` (string, default: `undefined`)

- Optional prefix added to all files installed by the CLI
- Makes files more identifiable and reduces conflicts
- Examples:
  - `undefined` - No prefix (default)
  - `"sb_"` - Adds "sb\_" prefix to all files
  - `"mycompany_"` - Custom company prefix

#### `installedFeatures` (object, optional)

- Tracks installed features and their versions
- Used by doctor command and future upgrade functionality

```json
{
  "installedFeatures": {
    "rag-database": {
      "version": "1.0.0",
      "installedAt": "2024-09-07T12:00:00Z",
      "files": [
        "functions/sb_similarity-search/index.ts",
        "schemas/sb_embeddings.sql"
      ]
    }
  }
}
```

## Supabase CLI Dependency

### Requirement

SupaBootstrap **requires** the Supabase CLI to be installed and available in the user's PATH. We do not replicate or reimplement Supabase CLI functionality.

### Commands We Use

- `supabase init` - Initialize new Supabase project
- `supabase migration new [name]` - Create new migration files with proper timestamps
- `supabase functions new [name]` - Create new edge function with proper structure

### Error Handling

When Supabase CLI is not available:

```bash
$ npx supabootstrap init

✗ Supabase CLI not found

SupaBootstrap requires the Supabase CLI to be installed.

Install it with:
  npm install -g supabase
  # or
  brew install supabase/tap/supabase

Then run this command again.
```

### Validation Process

1. **CLI Detection**: Check if `supabase` command is available in PATH
2. **Version Check**: Ensure minimum compatible version (if needed)
3. **Clear Error Messages**: Provide installation instructions when missing
4. **No Fallbacks**: Do not attempt to work without Supabase CLI

## Core Functionality

### 1. Project Initialization (`init` command)

#### Flow:

1. Check if `supabase/` directory exists
2. If not, run `supabase init` command
3. Create `.supabootstrap.json` with default configuration
4. If Supabase project already exists, just create the config file

#### Example Usage (Clean Output):

```bash
$ npx supabootstrap init
✓ Supabase CLI found (version: 1.27.7)
✓ Supabase project initialized
✓ Created .supabootstrap.json

🎯 Next steps:
  • Run supabootstrap list to see available features
  • Run supabootstrap install <feature> to install a feature
```

### 2. Conflict Resolution System

#### Design Principles:

- **No Backups**: Users control overwrites directly, no backup complexity
- **Interactive Selection**: Users choose which files to overwrite
- **Granular Control**: Select individual files, not all-or-nothing
- **Clear Visibility**: Show exactly what will happen before execution

#### Installation Flow:

1. **Pre-Installation Conflict Detection**: Scan all files the feature wants to install
2. **Interactive File Selection**: Present user with choices for each conflicting file
3. **Selective Installation**: Only install user-approved files
4. **Post-Installation Report**: Show what was installed/skipped

#### Example Flow (Clean Output):

**No conflicts:**
```bash
$ npx supabootstrap install rag-database
✓ Feature 'rag-database' installed successfully!
  Installed 5 files

🎯 Next steps:
  • Run supabase db reset to apply migrations
  • Run supabase functions deploy to deploy functions
  • Run supabootstrap doctor to check for modifications
```

**With conflicts (only shown when needed):**
```bash
$ npx supabootstrap install rag-database

⚠️ File conflicts detected:
  ✗ functions/search/index.ts
  ✗ schemas/embeddings.sql

What should we do with functions/search/index.ts?
❯ Overwrite
  Skip

✓ Feature 'rag-database' installed successfully!
  Installed 3 files, Skipped 1 file

🎯 Next steps:
  • Run supabase db reset to apply migrations  
  • Run supabase functions deploy to deploy functions
  • Run supabootstrap doctor to check for modifications
```

### 3. Migration Handling

#### Key Principles:

- **Never overwrite existing migrations**
- **Use Supabase CLI for proper timestamps**
- **Smart duplicate detection** - avoid creating identical migrations
- **Content-aware conflict resolution**

#### Enhanced Implementation:

1. **Pre-Installation Scan**: Check existing migrations for similar names
   - Extract migration name from filename (part after timestamp)
   - Compare with template migration names
2. **Content Comparison**: For matching names, compare file content
   - If identical: Skip installation entirely (no user prompt needed)
   - If different: Warn user and offer overwrite option with conflict details
3. **New Migration Creation**: Only create new migrations when needed
   - Use `supabase migration new [prefix][name]` for new migrations
   - Install template content into newly created files

#### Example Implementation:

```typescript
// core/migration-generator.ts
async function installMigration(templatePath: string, migrationName: string) {
  const existingMigrations = await scanExistingMigrations(migrationName);

  if (existingMigrations.length > 0) {
    const templateContent = await readFile(templatePath);

    for (const existing of existingMigrations) {
      const existingContent = await readFile(existing.path);

      if (existingContent === templateContent) {
        console.log(
          `✓ Migration ${migrationName} already exists with identical content - skipping`
        );
        return { skipped: true, reason: "identical" };
      }
    }

    // Content differs - warn user
    const shouldOverwrite = await confirmMigrationConflict(
      migrationName,
      existingMigrations
    );
    if (!shouldOverwrite) {
      return { skipped: true, reason: "user_declined" };
    }
  }

  // Create new migration
  const newMigrationFile = await createTimestampedMigration(migrationName);
  await writeFile(newMigrationFile, templateContent);

  return { created: newMigrationFile };
}
```

### 4. Function Handling

#### Key Principles:

- **Filesystem-first detection** - check actual directory before config tracking
- **Skip redundant CLI calls** - don't run `supabase functions new` for existing functions
- **Preserve existing structure** - keep non-template files when overwriting
- **Smart content replacement** - only update template files

#### Enhanced Implementation:

1. **Pre-Installation Check**: Scan functions directory for existing function folders
   - Check filesystem directly: `functions/[prefix][function-name]/` exists
   - Don't rely solely on `.supabootstrap.json` tracking
2. **Conditional CLI Usage**: Only create new functions when folder doesn't exist
   - If exists: Skip `supabase functions new` command entirely
   - If new: Use `supabase functions new [prefix][function-name]`
3. **Selective File Updates**: Replace only template-provided files
   - Always replace: `index.ts` (main function code)
   - Conditionally replace: `package.json` (if feature provides custom version)
   - Preserve: Any existing files not provided by feature template

#### Example Implementation:

```typescript
// core/function-generator.ts
async function installFunction(
  templateDir: string,
  functionName: string,
  prefix?: string
) {
  const fullFunctionName = prefix ? `${prefix}${functionName}` : functionName;
  const functionPath = `functions/${fullFunctionName}`;

  // Check if function already exists on filesystem
  const functionExists = await directoryExists(functionPath);

  if (!functionExists) {
    // Create new function using Supabase CLI
    await execCommand(`supabase functions new ${fullFunctionName}`);
    console.transient(`✓ Created function structure: ${fullFunctionName}`);
  } else {
    console.transient(`✓ Found existing function: ${fullFunctionName}`);
  }

  // Install/update template files
  const templateFiles = await listTemplateFiles(templateDir);

  for (const file of templateFiles) {
    const targetPath = `${functionPath}/${file.name}`;
    await copyFile(file.path, targetPath);
    console.transient(`✓ Updated ${file.name}`);
  }

  return { functionName: fullFunctionName, existed: functionExists };
}
```

#### Clean Implementation:

Functions are handled silently in the background. Users only see the final result unless there are conflicts that require their input.

### 5. File Prefix System

#### Without Prefix (Default):

```
supabase/
├── functions/similarity-search/index.ts
├── migrations/20240907120001_create_embeddings_table.sql
└── schemas/embeddings.sql
```

#### With Prefix (`"filePrefix": "sb_"`):

```
supabase/
├── functions/sb_similarity-search/index.ts
├── migrations/20240907120001_sb_create_embeddings_table.sql
└── schemas/sb_embeddings.sql
```

### 6. Doctor Command

#### Purpose:

- Detect files that have been modified after installation
- Compare installed feature files against original templates
- **Read-only analysis** - no automatic fixes

#### Example Output (Clean):

```bash
$ npx supabootstrap doctor
✓ 2 features checked

⚠️  Modified files detected:
  • rag-database: sb_similarity-search/index.ts has been modified

💡 Modified files may affect feature functionality.
```

## Implementation Phases

### Phase 1: Core Infrastructure

1. **TypeScript Project Setup**

   - Configure build system and development environment
   - Set up CLI framework with Commander.js
   - Create basic project structure

2. **Configuration System**

   - Implement config file loading and validation
   - Create JSON schema for user configuration
   - Handle sourceDir and filePrefix resolution

3. **Feature Registry System**

   - Load and parse `features/features.json`
   - Validate feature definitions
   - Create placeholder feature for testing

4. **Supabase CLI Validation**

   - Check if Supabase CLI is installed and available
   - Validate minimum version compatibility (if needed)
   - Provide clear error messages with installation instructions

5. **Supabase Project Validation**
   - Detect existing Supabase projects
   - Validate project structure
   - Integration with Supabase CLI commands

### Phase 2: Installation System

1. **Enhanced User Experience Utilities**

   - Implement transient console output system (`utils/console.ts`)
   - Create content comparison utilities (`utils/content-comparison.ts`)
   - Build migration scanner for duplicate detection (`utils/migration-scanner.ts`)
   - Add debug mode support for verbose output

2. **Smart File Conflict Detection**

   - Scan target directories for existing files
   - Compare feature files against user's project
   - Auto-skip identical files without prompting
   - Generate streamlined conflict reports

3. **Optimized Interactive Prompts**

   - Batch related decisions into single prompts
   - Implement smart defaults to reduce user input
   - Show confirmation summary before proceeding
   - Minimize total number of user interactions

4. **Enhanced File Installation Logic**

   - Copy files with respect to user choices
   - Apply file prefixes when configured
   - Handle different file types with type-specific logic
   - Use filesystem-first detection for existing resources

5. **Enhanced Migration Integration**

   - Pre-scan existing migrations for duplicates by name
   - Compare content and auto-skip identical migrations
   - Warn about potential conflicts for different content
   - Use `supabase migration new` only when creating new migrations

6. **Enhanced Function Integration**

   - Check filesystem directly for existing function directories
   - Skip `supabase functions new` for existing functions
   - Replace only template-provided files, preserve others
   - Apply file prefixes to function names

7. **Init Command**
   - Detect existing Supabase projects
   - Run `supabase init` when needed
   - Create default configuration files

### Phase 3: Advanced Features

1. **Doctor Command**

   - File diff detection and reporting
   - Compare installed files against templates
   - Track modification status

2. **Uninstall Functionality**

   - Remove installed feature files
   - Update configuration tracking
   - Handle dependency checking

3. **Dependency Resolution**

   - Automatic installation of required dependencies
   - Dependency graph validation
   - Prevent circular dependencies

4. **Error Handling & Logging**
   - Comprehensive error messages
   - User-friendly logging system
   - Recovery suggestions

### Phase 4: Polish & Distribution

1. **Testing**

   - Unit tests for core functionality
   - Integration tests with real Supabase projects
   - Test fixtures and mock data

2. **Documentation**

   - Comprehensive README
   - Feature creation guide
   - API documentation

3. **Distribution Preparation**
   - npm package configuration
   - Binary executable setup
   - Version management

## Future Enhancements

### Planned Features (Not in Initial Scope)

- **Config File Merging**: Smart merging of `supabase/config.toml` files
- **Upgrade Command**: Update installed features to newer versions
- **Feature Templates**: Scaffolding for creating new features
- **Web Interface**: Optional web UI for feature management
- **Feature Marketplace**: Community-contributed features

### Version Compatibility

The version tracking in configuration files sets up future upgrade capabilities:

- Detect compatibility issues between CLI versions
- Handle migration of configuration formats
- Provide upgrade paths for breaking changes

## Clean UX Implementation

### Core UX Principles

**What users see - BEFORE (verbose, cluttered):**
```bash
supabootstrap install feature
🚀 Installing feature: feature

Warning: migrations directory not found...
📦 Feature Details:
  Feature Name (v1.0.0)  
  Description here
  Category: example

✓ No conflicts detected

📋 Installation Plan:
  • Install schema files to: ./supabase/schemas/
? Proceed with installation? Yes

📁 Installing schemas...
📄 Installing migrations...
⚡ Installing functions...
💾 Updating configuration...

✓ Feature installed successfully!
📁 Installed files:
  ✓ file1.sql
  ✓ file2.sql
  ✓ file3.ts

🎯 Next steps: ...
```

**What users see - AFTER (clean, essential):**
```bash
supabootstrap install feature
✓ Feature 'feature' installed successfully!
  Installed 3 files

🎯 Next steps:
  • Run supabase db reset to apply migrations
  • Run supabase functions deploy to deploy functions
  • Run supabootstrap doctor to check modifications
```

### Implementation Strategy

1. **Remove All Verbose Output**
   - No installation banners or feature descriptions
   - No installation plans or progress indicators that stay visible
   - No detailed file listings - just counts
   - No redundant confirmations unless conflicts require resolution

2. **Clean Temporary Output** 
   - Progress messages appear temporarily and are cleared
   - Only final results remain visible in terminal
   - Keep terminal clean and uncluttered

3. **Essential Information Only**
   - Success/failure status
   - File count (brief indication of work done)  
   - Next steps (actionable guidance)
   - Error messages when needed
   - Conflict resolution only when conflicts exist

4. **Streamlined Interaction**
   - No confirmation prompts for routine operations
   - Dependency installation happens automatically without verbose output
   - Conflicts handled efficiently with minimal user input

## Key Design Decisions

1. **Clean & Minimal UX**: Show only essential information, clear temporary messages
2. **Simple Feature Structure**: Each feature is just a directory with optional subdirectories  
3. **No Redundant Prompts**: Skip confirmations unless real conflicts exist
4. **Migration Safety**: Never edit existing migrations, always create new ones
5. **Configuration Flexibility**: Support different project structures with sourceDir
6. **File Identification**: Optional prefixes to reduce conflicts
7. **Version Tracking**: Foundation for future upgrade capabilities
8. **Filesystem Truth**: Always check actual filesystem state, not just config tracking
9. **Professional Output**: Respectful of user's time and terminal space

## Success Criteria

The CLI should be successful when:

1. **Clean & Fast**: Users get results quickly without visual clutter
2. **Easy Onboarding**: `npx supabootstrap init` sets up everything needed  
3. **Minimal Interaction**: Works without unnecessary prompts or confirmations
4. **Clear When Needed**: Shows conflicts and errors clearly when they occur
5. **Safe Operations**: No accidental data loss or project corruption
6. **Professional Feel**: Feels fast, respectful, and efficient to use
7. **Extensible**: Adding new features requires minimal effort
8. **Reliable**: Handles edge cases gracefully with helpful error messages

This plan provides a roadmap for building a **clean, minimal, and professional** CLI tool that respects the user's time and terminal space while extending Supabase projects with pre-built functionality.
