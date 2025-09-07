# SupaBootstrap CLI - Implementation Plan

## Project Overview

SupaBootstrap is a CLI utility that can be run with `npx` to install database features into a Supabase project by copying files into the supabase directory. It allows users to easily add pre-built functionality like RAG databases, edge function queues, graph database structures, and more.

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
  - `"sb_"` - Adds "sb_" prefix to all files
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

#### Example Usage:
```bash
$ npx supabootstrap init

Initializing supabootstrap project...
  ✗ No supabase/ directory found
  ✓ Running: supabase init
  ✓ Supabase project created at ./supabase/
  ✓ Created .supabootstrap.json

Ready to install features! Run 'npx supabootstrap list' to get started.
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

#### Example Flow:
```bash
$ npx supabootstrap install rag-database

Checking for file conflicts...

The following files already exist and would be overwritten:
  ✗ functions/search/index.ts
  ✗ migrations/20240101000000_create_users.sql

The following files will be created (no conflicts):
  ✓ migrations/20240907000000_create_embeddings.sql
  ✓ schemas/embeddings.sql
  ✓ functions/embed-text/index.ts

Select which files to overwrite:
? functions/search/index.ts
  ● Overwrite
  ○ Skip

? migrations/20240101000000_create_users.sql  
  ○ Overwrite
  ● Skip

Continue with installation? (y/N)
```

### 3. Migration Handling

#### Key Principles:
- **Never overwrite existing migrations**
- **Use Supabase CLI for proper timestamps**
- **Always create new timestamped migrations**

#### Implementation:
- Use `supabase migration new [name]` command to generate proper timestamps
- Install migration content into newly created migration files
- Skip conflict detection for migrations entirely (always create new)

### 4. Function Handling

#### Key Principles:
- **Use Supabase CLI for function generation**
- **Replace generated index.ts with feature content**
- **Preserve Supabase-generated structure and files**

#### Implementation:
- Use `supabase functions new [function-name]` to create function structure
- Replace the generated `index.ts` with feature template content
- Keep other generated files (like `package.json`) unless feature provides replacements
- Apply file prefixes to function names: `supabase functions new [prefix][function-name]`

#### Example Flow:
```bash
# Feature wants to install: functions/similarity-search/index.ts
# With filePrefix: "sb_"

1. Run: supabase functions new sb_similarity-search
   Creates: functions/sb_similarity-search/index.ts (boilerplate)
           functions/sb_similarity-search/package.json (if needed)

2. Replace: functions/sb_similarity-search/index.ts 
   With: Feature template content

3. Update other files if feature provides them:
   - functions/sb_similarity-search/package.json (if feature has custom dependencies)
```

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

#### Example Output:
```bash
$ npx supabootstrap doctor

Configuration: ./backend/supabase (prefix: sb_)

Checking installed features...
  rag-database: 
    ✗ sb_similarity-search/index.ts has been modified
    ✓ sb_embeddings.sql matches template
    
⚠️  Modified files may affect feature functionality.
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
1. **File Conflict Detection**
   - Scan target directories for existing files
   - Compare feature files against user's project
   - Generate conflict reports

2. **Interactive User Prompts**
   - Implement file selection interface
   - Handle user choices (overwrite/skip)
   - Confirmation flows

3. **File Installation Logic**
   - Copy files with respect to user choices
   - Apply file prefixes when configured
   - Handle different file types (schemas, functions, migrations)

4. **Migration Integration**
   - Wrapper for `supabase migration new` command
   - Copy migration content to generated files
   - Proper timestamp handling

5. **Function Integration**
   - Wrapper for `supabase functions new` command
   - Replace generated index.ts with feature content
   - Handle custom package.json and other function files
   - Apply file prefixes to function names

6. **Init Command**
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

## Key Design Decisions

1. **Simple Feature Structure**: Each feature is just a directory with optional subdirectories
2. **No Backups**: Users control overwrites directly without backup complexity
3. **Migration Safety**: Never edit existing migrations, always create new ones
4. **Configuration Flexibility**: Support different project structures with sourceDir
5. **File Identification**: Optional prefixes to reduce conflicts
6. **Version Tracking**: Foundation for future upgrade capabilities

## Success Criteria

The CLI should be successful when:
1. **Easy Onboarding**: `npx supabootstrap init` sets up everything needed
2. **Clear Conflicts**: Users understand exactly what will be overwritten
3. **Safe Operations**: No accidental data loss or project corruption
4. **Extensible**: Adding new features requires minimal effort
5. **Reliable**: Handles edge cases gracefully with helpful error messages

This plan provides a comprehensive roadmap for building a robust, user-friendly CLI tool for extending Supabase projects with pre-built functionality.