# SupaBootstrap CLI

A CLI utility to install database features into Supabase projects by copying files into the supabase directory. It allows users to easily add pre-built functionality like RAG databases, edge function queues, graph database structures, and more.

## Quick Start

### Prerequisites

- Node.js 16+
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

### Installation

```bash
# Install globally
npm install -g supabootstrap

# Or use with npx (recommended)
npx supabootstrap --help
```

### Basic Usage

1. **Initialize your project**

   ```bash
   npx supabootstrap init
   ```

2. **See available features**

   ```bash
   npx supabootstrap list
   ```

3. **Install a feature**
   ```bash
   npx supabootstrap install placeholder-feature
   ```

## Features

SupaBootstrap comes with pre-built features:

- **[edge-function-utils](features/edge-function-utils/README.md)** - Utility functions and schemas for edge function development

## Commands

### `supabootstrap init`

Initialize project and create configuration file. This will:

- Check if Supabase CLI is available
- Optionally run `supabase init` if no Supabase project exists
- Create `.supabootstrap.json` configuration file
- Set up file prefix and directory options

### `supabootstrap list`

Show available features with descriptions, categories, dependencies, and installation status.

### `supabootstrap install <feature>`

Install a feature with conflict resolution. Features may include:

- SQL schema files
- Database migrations
- Edge functions
- Documentation

The CLI will detect file conflicts and ask you which files to overwrite.

### `supabootstrap uninstall <feature>`

Remove a previously installed feature (Coming soon).

### `supabootstrap doctor`

Check for modified feature files to detect if installed files have been changed (Coming soon).

## Configuration

SupaBootstrap uses a `.supabootstrap.json` file in your project root:

```json
{
  "version": "1.0.0",
  "sourceDir": "./supabase",
  "filePrefix": "sb_",
  "installedFeatures": {
    "placeholder-feature": {
      "version": "1.0.0",
      "installedAt": "2024-09-07T12:00:00Z",
      "files": [
        "migrations/20240907120001_sb_create_placeholder_table.sql",
        "functions/sb_placeholder-fn/index.ts"
      ]
    }
  }
}
```

### Configuration Options

- **`sourceDir`** - Path to Supabase directory (default: `"./supabase"`)
- **`filePrefix`** - Optional prefix for installed files (e.g., `"sb_"`)
- **`installedFeatures`** - Tracks installed features and their files

## How It Works

### File Conflict Resolution

When installing features, SupaBootstrap will:

1. Scan for existing files that would be overwritten
2. Show you exactly which files conflict
3. Let you choose which files to overwrite vs skip
4. Apply your choices selectively

### Migration Handling

- Never overwrites existing migrations
- Always creates new timestamped migrations using `supabase migration new`
- Copies feature migration content into new migration files

### Function Handling

- Creates functions using `supabase functions new` with proper structure
- Replaces generated boilerplate with feature templates
- Applies file prefixes to function names

## Development

### Project Structure

```
supabootstrap/
├── src/
│   ├── commands/     # CLI command implementations
│   ├── core/         # Core functionality (config, registry, supabase)
│   └── utils/        # Utilities (file ops, prompts, types)
├── features/         # Feature definitions and templates
├── bin/              # Executable wrapper
└── dist/             # Compiled JavaScript (generated)
```

### Building

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development
pnpm dev

# Test locally
./bin/supabootstrap.js --help
```

### Adding Features

1. Create feature directory: `features/my-feature/`
2. Add feature files in subdirectories:
   - `schemas/` - SQL schema files
   - `migrations/` - Migration templates
   - `functions/` - Edge function code
3. Write feature documentation: `features/my-feature/README.md`
4. Update feature registry: `features/features.json`

## License

ISC

## Contributing

Contributions are welcome! Please read the Plan.md file for the full technical specification and development roadmap.
