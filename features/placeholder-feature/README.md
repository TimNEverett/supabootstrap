# Placeholder Feature

This is an example feature that demonstrates the structure of SupaBootstrap features.

## What it includes

- **Schema**: A simple placeholder table
- **Migration**: SQL to create the placeholder table
- **Function**: An example edge function that interacts with the table

## Installation

```bash
npx supabootstrap install placeholder-feature
```

## Usage

After installation, you'll have:

1. A new migration file that creates a `placeholder_items` table
2. An edge function at `functions/placeholder-fn/` that can:
   - Create new placeholder items
   - List existing items

## API

The edge function accepts POST requests:

```typescript
// Create an item
fetch('/functions/v1/placeholder-fn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    data: { name: 'My Item', description: 'A test item' }
  })
})

// List items
fetch('/functions/v1/placeholder-fn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'list' })
})
```