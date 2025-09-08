import path from 'path';
import fs from 'fs';
import { SupaBootstrapConfig, ConflictingFile, InstallationResult } from '../utils/types';
import { FileOperations } from '../utils/file-operations';
import { featureRegistry } from './registry';
import { supabaseCLI } from './supabase-cli';
import { configManager } from './config';
import { debug } from '../utils/debug';

export class FeatureInstaller {
  private config: SupaBootstrapConfig;
  private projectRoot: string;
  private supabasePath: string;

  constructor(config: SupaBootstrapConfig, projectRoot: string) {
    this.config = config;
    this.projectRoot = projectRoot;
    this.supabasePath = configManager.getSupabasePath(config, projectRoot);
  }

  /**
   * Analyze a feature for potential file conflicts
   */
  async analyzeConflicts(featureId: string): Promise<ConflictingFile[]> {
    const feature = featureRegistry.getFeature(featureId);
    if (!feature) {
      throw new Error(`Feature '${featureId}' not found`);
    }

    if (!featureRegistry.featureExists(featureId)) {
      throw new Error(`Feature directory not found: ${featureId}`);
    }

    const conflicts: ConflictingFile[] = [];
    const featurePath = featureRegistry.getFeaturePath(featureId);

    // Check schema files
    const schemasPath = path.join(featurePath, 'schemas');
    if (FileOperations.directoryExists(schemasPath)) {
      const schemaFiles = FileOperations.getFilesInDirectory(schemasPath);
      for (const schemaFile of schemaFiles) {
        const relativePath = path.relative(schemasPath, schemaFile);
        const targetPath = this.getTargetPath('schemas', relativePath);
        
        if (FileOperations.fileExists(targetPath)) {
          conflicts.push({
            path: path.relative(this.projectRoot, targetPath),
            exists: true
          });
        }
      }
    }

    // Check function files (but skip migrations - they never conflict)
    const functionsPath = path.join(featurePath, 'functions');
    if (FileOperations.directoryExists(functionsPath)) {
      const functionDirs = fs.readdirSync(functionsPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

      for (const functionName of functionDirs) {
        const prefixedFunctionName = this.applyPrefix(functionName);
        const targetFunctionPath = path.join(supabaseCLI.getFunctionsPath(this.projectRoot), prefixedFunctionName);
        
        if (FileOperations.directoryExists(targetFunctionPath)) {
          conflicts.push({
            path: path.relative(this.projectRoot, targetFunctionPath),
            exists: true
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Install a feature with the given conflict resolutions
   */
  async installFeature(featureId: string, conflictResolutions: ConflictingFile[] = []): Promise<InstallationResult> {
    const feature = featureRegistry.getFeature(featureId);
    if (!feature) {
      throw new Error(`Feature '${featureId}' not found`);
    }

    const featurePath = featureRegistry.getFeaturePath(featureId);
    const installedFiles: string[] = [];
    const skippedFiles: string[] = [];
    const errors: string[] = [];

    try {
      console.log(`📁 Installing schemas...`);
      debug.info('Starting schema installation...');
      // Install schema files
      await this.installSchemas(featureId, featurePath, conflictResolutions, installedFiles, skippedFiles);

      console.log(`📄 Installing migrations...`);
      debug.info('Starting migration installation...');
      // Install migrations (always create new ones)
      await this.installMigrations(featureId, featurePath, installedFiles, errors);

      console.log(`⚡ Installing functions...`);
      debug.info('Starting function installation...');
      // Install functions
      await this.installFunctions(featureId, featurePath, conflictResolutions, installedFiles, skippedFiles, errors);

      console.log(`💾 Updating configuration...`);
      debug.info('Updating configuration...');
      // Update configuration to track installed feature
      await this.updateInstalledFeatures(featureId, installedFiles);

      console.log(`✅ Installation completed`);
      debug.info('Installation completed successfully');
      return {
        success: errors.length === 0,
        installedFiles,
        skippedFiles,
        errors
      };

    } catch (error) {
      console.error(`❌ Installation failed with error: ${(error as Error).message}`);
      return {
        success: false,
        installedFiles,
        skippedFiles,
        errors: [...errors, (error as Error).message]
      };
    }
  }

  /**
   * Install schema files
   */
  private async installSchemas(
    featureId: string, 
    featurePath: string, 
    conflictResolutions: ConflictingFile[], 
    installedFiles: string[], 
    skippedFiles: string[]
  ): Promise<void> {
    const schemasPath = path.join(featurePath, 'schemas');
    if (!FileOperations.directoryExists(schemasPath)) {
      return;
    }

    const schemaFiles = FileOperations.getFilesInDirectory(schemasPath);
    
    for (const schemaFile of schemaFiles) {
      const relativePath = path.relative(schemasPath, schemaFile);
      const targetPath = this.getTargetPath('schemas', relativePath);
      const relativeTargetPath = path.relative(this.projectRoot, targetPath);

      // Check if this file should be skipped due to conflict resolution
      const conflictResolution = conflictResolutions.find(c => c.path === relativeTargetPath);
      if (conflictResolution && conflictResolution.action === 'skip') {
        skippedFiles.push(relativeTargetPath);
        continue;
      }

      // Copy the file
      FileOperations.copyFile(schemaFile, targetPath, { 
        overwrite: true, 
        createDirs: true 
      });
      
      installedFiles.push(relativeTargetPath);
    }
  }

  /**
   * Install migration files (always create new timestamped migrations)
   */
  private async installMigrations(
    featureId: string, 
    featurePath: string, 
    installedFiles: string[], 
    errors: string[]
  ): Promise<void> {
    const migrationsPath = path.join(featurePath, 'migrations');
    if (!FileOperations.directoryExists(migrationsPath)) {
      debug.info(`No migrations directory found at ${migrationsPath}`);
      return;
    }

    const migrationFiles = FileOperations.getFilesInDirectory(migrationsPath)
      .filter(file => file.endsWith('.sql'));

    debug.info(`Found ${migrationFiles.length} migration files to install`);

    for (const migrationFile of migrationFiles) {
      try {
        debug.info(`Processing migration: ${path.basename(migrationFile)}`);
        debug.info(`Processing migration file: ${migrationFile}`);
        const migrationContent = FileOperations.readFile(migrationFile);
        const migrationName = this.applyPrefix(path.basename(migrationFile, '.sql'));
        
        debug.info(`Creating Supabase migration: ${migrationName}`);
        debug.info(`Creating migration with name: ${migrationName}`);
        // Create new migration using Supabase CLI
        const newMigrationFile = supabaseCLI.createMigration(migrationName, this.projectRoot);
        const newMigrationPath = path.join(supabaseCLI.getMigrationsPath(this.projectRoot), newMigrationFile);
        
        debug.info(`Writing content to: ${newMigrationPath}`);
        debug.info(`Writing migration content (${migrationContent.length} chars) to: ${newMigrationPath}`);
        // Replace the generated content with our feature content
        FileOperations.writeFile(newMigrationPath, migrationContent);
        
        const relativePath = path.relative(this.projectRoot, newMigrationPath);
        installedFiles.push(relativePath);
        debug.info(`Migration installed: ${relativePath}`);

      } catch (error) {
        const errorMsg = `Failed to install migration from ${migrationFile}: ${(error as Error).message}`;
        console.error(`  • Error: ${errorMsg}`);
        debug.error(`Migration installation error: ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
  }

  /**
   * Install function files
   */
  private async installFunctions(
    featureId: string, 
    featurePath: string, 
    conflictResolutions: ConflictingFile[], 
    installedFiles: string[], 
    skippedFiles: string[], 
    errors: string[]
  ): Promise<void> {
    const functionsPath = path.join(featurePath, 'functions');
    if (!FileOperations.directoryExists(functionsPath)) {
      debug.info(`No functions directory found at ${functionsPath}`);
      return;
    }

    const functionDirs = fs.readdirSync(functionsPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    debug.info(`Found ${functionDirs.length} functions to install`);

    for (const functionName of functionDirs) {
      try {
        debug.info(`Processing function: ${functionName}`);
        const prefixedFunctionName = this.applyPrefix(functionName);
        const sourceFunctionPath = path.join(functionsPath, functionName);
        const targetFunctionPath = path.join(supabaseCLI.getFunctionsPath(this.projectRoot), prefixedFunctionName);
        const relativeTargetPath = path.relative(this.projectRoot, targetFunctionPath);

        // Check if this function should be skipped due to conflict resolution
        const conflictResolution = conflictResolutions.find(c => c.path === relativeTargetPath);
        if (conflictResolution && conflictResolution.action === 'skip') {
          debug.info(`Skipping function due to conflict resolution: ${functionName}`);
          skippedFiles.push(relativeTargetPath);
          continue;
        }

        // If function exists and we're not overwriting, skip it
        if (FileOperations.directoryExists(targetFunctionPath) && 
            (!conflictResolution || conflictResolution.action !== 'overwrite')) {
          debug.info(`Skipping existing function: ${functionName}`);
          skippedFiles.push(relativeTargetPath);
          continue;
        }

        debug.info(`Creating Supabase function: ${prefixedFunctionName}`);
        // Create function using Supabase CLI (this will create the directory structure)
        supabaseCLI.createFunction(prefixedFunctionName, this.projectRoot);

        debug.info(`Copying function files from ${sourceFunctionPath} to ${targetFunctionPath}`);
        // Copy all files from source function to target function
        const sourceFunctionFiles = FileOperations.getFilesInDirectory(sourceFunctionPath);
        
        for (const sourceFile of sourceFunctionFiles) {
          const relativeFunctionPath = path.relative(sourceFunctionPath, sourceFile);
          const targetFile = path.join(targetFunctionPath, relativeFunctionPath);
          
          debug.info(`Copying: ${relativeFunctionPath}`);
          FileOperations.copyFile(sourceFile, targetFile, { 
            overwrite: true, 
            createDirs: true 
          });
          
          const relativeInstalledPath = path.relative(this.projectRoot, targetFile);
          installedFiles.push(relativeInstalledPath);
        }

        debug.info(`Function installed: ${prefixedFunctionName}`);

      } catch (error) {
        const errorMsg = `Failed to install function ${functionName}: ${(error as Error).message}`;
        console.error(`  • Error: ${errorMsg}`);
        debug.error(`Function installation error: ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
  }

  /**
   * Update configuration to track installed feature
   */
  private async updateInstalledFeatures(featureId: string, installedFiles: string[]): Promise<void> {
    const feature = featureRegistry.getFeature(featureId);
    if (!feature) return;

    this.config.installedFeatures[featureId] = {
      version: feature.version,
      installedAt: new Date().toISOString(),
      files: installedFiles
    };

    // Save updated configuration
    configManager.saveConfig(this.config);
  }

  /**
   * Get target path for a file, applying prefix if configured
   */
  private getTargetPath(type: 'schemas' | 'migrations' | 'functions', fileName: string): string {
    const prefixedFileName = this.applyPrefix(fileName);
    return path.join(this.supabasePath, type, prefixedFileName);
  }

  /**
   * Apply file prefix if configured
   */
  private applyPrefix(fileName: string): string {
    return configManager.applyFilePrefix(fileName, this.config);
  }

  /**
   * Check if all dependencies are installed
   */
  checkDependencies(featureId: string): { satisfied: boolean; missing: string[] } {
    const feature = featureRegistry.getFeature(featureId);
    if (!feature) {
      throw new Error(`Feature '${featureId}' not found`);
    }

    const installedFeatures = Object.keys(this.config.installedFeatures);
    const missing = feature.dependencies.filter(dep => !installedFeatures.includes(dep));
    
    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  /**
   * Check if a feature has schema files
   */
  hasSchemas(featurePath: string): boolean {
    const schemasPath = path.join(featurePath, 'schemas');
    return FileOperations.directoryExists(schemasPath) && 
           FileOperations.getFilesInDirectory(schemasPath).length > 0;
  }

  /**
   * Check if a feature has migration files
   */
  hasMigrations(featurePath: string): boolean {
    const migrationsPath = path.join(featurePath, 'migrations');
    return FileOperations.directoryExists(migrationsPath) && 
           FileOperations.getFilesInDirectory(migrationsPath).filter(f => f.endsWith('.sql')).length > 0;
  }

  /**
   * Check if a feature has function files
   */
  hasFunctions(featurePath: string): boolean {
    const functionsPath = path.join(featurePath, 'functions');
    if (!FileOperations.directoryExists(functionsPath)) {
      return false;
    }
    
    const functionDirs = fs.readdirSync(functionsPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory());
    
    return functionDirs.length > 0;
  }
}