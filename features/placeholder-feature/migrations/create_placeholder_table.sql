-- Migration: Create placeholder_items table
-- This migration creates the basic structure for the placeholder feature

-- Create a simple table for placeholder items
create table if not exists placeholder_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table placeholder_items enable row level security;

-- Create a policy that allows all operations (adjust as needed for your use case)
create policy "Allow all operations on placeholder_items"
  on placeholder_items for all
  using (true)
  with check (true);

-- Create a function to automatically update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to auto-update updated_at
create trigger update_placeholder_items_updated_at
  before update on placeholder_items
  for each row execute function update_updated_at_column();