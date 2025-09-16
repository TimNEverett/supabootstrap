#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createFeature(featureName) {
  if (!featureName) {
    console.error('Error: Feature name is required');
    console.log('Usage: node scripts/add-feature.js <feature-name>');
    process.exit(1);
  }

  // Validate feature name (kebab-case)
  if (!/^[a-z0-9-]+$/.test(featureName)) {
    console.error('Error: Feature name must be in kebab-case (lowercase letters, numbers, and hyphens only)');
    process.exit(1);
  }

  const featureDir = path.join('features', featureName);

  // Check if feature already exists
  if (fs.existsSync(featureDir)) {
    console.error(`Error: Feature "${featureName}" already exists`);
    process.exit(1);
  }

  console.log(`Creating feature: ${featureName}`);

  // Create feature directory structure
  const dirs = [
    featureDir,
    path.join(featureDir, 'schemas'),
    path.join(featureDir, 'migrations'),
    path.join(featureDir, 'functions', `${featureName}-fn`)
  ];

  dirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  });

  // Create schema file from template
  const schemaTemplate = fs.readFileSync(path.join('file_templates', 'schema.sql'), 'utf8');
  const schemaContent = schemaTemplate
    .replace(/{{FEATURE_NAME}}/g, featureName)
    .replace(/{{TABLE_NAME}}/g, featureName.replace(/-/g, '_'));

  fs.writeFileSync(path.join(featureDir, 'schemas', `${featureName}.sql`), schemaContent);
  console.log(`Created schema: ${featureName}.sql`);

  // Create migration file from template
  const migrationTemplate = fs.readFileSync(path.join('file_templates', 'migration.sql'), 'utf8');
  const migrationContent = migrationTemplate
    .replace(/{{FEATURE_NAME}}/g, featureName)
    .replace(/{{TABLE_NAME}}/g, featureName.replace(/-/g, '_'))
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString());

  const migrationFile = `create_${featureName.replace(/-/g, '_')}.sql`;
  fs.writeFileSync(path.join(featureDir, 'migrations', migrationFile), migrationContent);
  console.log(`Created migration: ${migrationFile}`);

  // Create edge function from templates
  try {
    const functionDir = path.join(featureDir, 'functions', `${featureName}-fn`);

    // Read templates
    const functionTemplate = fs.readFileSync(path.join('file_templates', 'function.ts'), 'utf8');
    const denoTemplate = fs.readFileSync(path.join('file_templates', 'deno.json'), 'utf8');

    // Replace placeholders in template
    const functionContent = functionTemplate.replace(/{{FUNCTION_NAME}}/g, `${featureName}-fn`);

    // Write files
    fs.writeFileSync(path.join(functionDir, 'index.ts'), functionContent);
    fs.writeFileSync(path.join(functionDir, 'deno.json'), denoTemplate);

    console.log(`Created edge function: ${featureName}-fn from templates`);

  } catch (error) {
    console.error('Error creating edge function from templates:', error.message);
    process.exit(1);
  }

  // Create README.md
  const readmeContent = `# ${featureName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Feature

## Description
Brief description of the ${featureName} feature.

## Files
- \`schemas/${featureName}.sql\` - Database schema definitions
- \`migrations/${migrationFile}\` - Database migration
- \`functions/${featureName}-fn/\` - Edge function implementation

## Installation
This feature will be installed automatically when selected during the supabootstrap installation process.

## Usage
Add usage instructions here.

## Dependencies
List any dependencies or prerequisites here.
`;

  fs.writeFileSync(path.join(featureDir, 'README.md'), readmeContent);
  console.log(`Created README.md`);

  // Update features.json
  const featuresJsonPath = path.join('features', 'features.json');
  let featuresData;

  try {
    featuresData = JSON.parse(fs.readFileSync(featuresJsonPath, 'utf8'));
  } catch (error) {
    console.error('Error reading features.json:', error.message);
    process.exit(1);
  }

  const displayName = featureName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  featuresData.features[featureName] = {
    name: displayName,
    description: `${displayName} feature implementation`,
    version: "1.0.0",
    dependencies: [],
    category: "custom"
  };

  fs.writeFileSync(featuresJsonPath, JSON.stringify(featuresData, null, 2));
  console.log(`Updated features.json with ${featureName}`);

  console.log(`\n✅ Feature "${featureName}" created successfully!`);
  console.log(`\nNext steps:`);
  console.log(`1. Edit schemas/${featureName}.sql to define your database schema`);
  console.log(`2. Update migrations/${migrationFile} if needed`);
  console.log(`3. Implement your logic in functions/${featureName}-fn/index.ts`);
  console.log(`4. Update the README.md with proper documentation`);
}

// Get feature name from command line arguments
const featureName = process.argv[2];
createFeature(featureName);