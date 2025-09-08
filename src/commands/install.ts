import path from 'path';
import chalk from 'chalk';
import { configManager } from '../core/config';
import { featureRegistry } from '../core/registry';
import { FeatureInstaller } from '../core/installer';
import { supabaseCLI, SupabaseCLI } from '../core/supabase-cli';
import { PromptUtils } from '../utils/prompts';

export async function installCommand(featureId: string): Promise<void> {
  try {
    console.log(chalk.blue(`🚀 Installing feature: ${featureId}\n`));

    // 1. Load configuration
    const config = configManager.loadConfig();
    const projectRoot = path.dirname(configManager.findConfigFile() || process.cwd());

    // 2. Validate Supabase CLI is available
    const isSupabaseCLIAvailable = await supabaseCLI.checkCLIAvailable();
    if (!isSupabaseCLIAvailable) {
      SupabaseCLI.showInstallInstructions();
      process.exit(1);
    }

    // 3. Validate Supabase project
    try {
      supabaseCLI.validateProject(projectRoot);
    } catch (error) {
      PromptUtils.showError(`Supabase project validation failed: ${(error as Error).message}`);
      console.log(chalk.yellow('Make sure you have a valid Supabase project initialized.'));
      process.exit(1);
    }

    // 4. Check if feature exists
    const feature = featureRegistry.getFeature(featureId);
    if (!feature) {
      PromptUtils.showError(`Feature '${featureId}' not found.`);
      console.log(chalk.blue('Available features:'));
      const features = featureRegistry.getAllFeatures();
      for (const [id, feat] of Object.entries(features)) {
        console.log(`  • ${chalk.cyan(id)} - ${feat.name}`);
      }
      process.exit(1);
    }

    // 5. Check if feature is already installed
    const isInstalled = config.installedFeatures[featureId];
    if (isInstalled) {
      const reinstall = await PromptUtils.confirmAction(
        `Feature '${featureId}' is already installed (v${isInstalled.version}). Reinstall?`,
        false
      );
      
      if (!reinstall) {
        PromptUtils.showInfo('Installation cancelled.');
        return;
      }
    }

    // 6. Display feature information
    console.log(chalk.blue('📦 Feature Details:'));
    console.log(`  ${chalk.bold(feature.name)} (v${feature.version})`);
    console.log(`  ${feature.description}`);
    console.log(`  Category: ${feature.category}`);
    
    if (feature.dependencies.length > 0) {
      console.log(`  Dependencies: ${feature.dependencies.join(', ')}`);
    }
    console.log('');

    // 7. Check dependencies
    const installer = new FeatureInstaller(config, projectRoot);
    const dependencyCheck = installer.checkDependencies(featureId);
    
    if (!dependencyCheck.satisfied) {
      PromptUtils.showError('Missing required dependencies:');
      for (const dep of dependencyCheck.missing) {
        console.log(`  • ${chalk.red(dep)}`);
      }
      
      const installDeps = await PromptUtils.confirmAction(
        'Install missing dependencies first?',
        true
      );
      
      if (installDeps) {
        // Resolve and install dependencies
        const allDependencies = featureRegistry.resolveDependencies(featureId);
        const missingDeps = allDependencies.filter(dep => 
          dep !== featureId && !config.installedFeatures[dep]
        );
        
        for (const dep of missingDeps) {
          console.log(chalk.yellow(`\n📦 Installing dependency: ${dep}`));
          await installFeatureRecursive(dep, installer, config, projectRoot);
        }
      } else {
        PromptUtils.showError('Cannot install feature without its dependencies.');
        process.exit(1);
      }
    }

    // 8. Analyze conflicts
    console.log(chalk.blue('🔍 Checking for file conflicts...'));
    const spinner = PromptUtils.showSpinner('Analyzing potential conflicts...');
    
    const conflicts = await installer.analyzeConflicts(featureId);
    spinner.stop();

    // 9. Handle conflicts if any
    let conflictResolutions = conflicts;
    if (conflicts.length > 0) {
      conflictResolutions = await PromptUtils.handleFileConflicts(conflicts);
    } else {
      console.log(chalk.green('  ✓ No conflicts detected'));
    }

    // 10. Show installation plan
    console.log('\n' + chalk.blue('📋 Installation Plan:'));
    
    const featurePath = featureRegistry.getFeaturePath(featureId);
    const hasSchemas = installer.hasSchemas(featurePath);
    const hasMigrations = installer.hasMigrations(featurePath);
    const hasFunctions = installer.hasFunctions(featurePath);
    
    if (hasSchemas) console.log(`  • Install schema files to: ${config.sourceDir}/schemas/`);
    if (hasMigrations) console.log(`  • Create new migration files using Supabase CLI`);
    if (hasFunctions) console.log(`  • Create edge functions using Supabase CLI`);
    
    if (config.filePrefix) {
      console.log(`  • Apply prefix '${config.filePrefix}' to all files`);
    }

    // 11. Final confirmation
    const proceed = await PromptUtils.confirmAction('\nProceed with installation?', true);
    if (!proceed) {
      PromptUtils.showInfo('Installation cancelled.');
      return;
    }

    // 12. Install the feature
    console.log('\n' + chalk.blue('🔧 Installing feature...'));
    const installSpinner = PromptUtils.showSpinner('Installing files...');
    
    const result = await installer.installFeature(featureId, conflictResolutions);
    installSpinner.stop();

    // 13. Show results
    if (result.success) {
      PromptUtils.showSuccess(`Feature '${featureId}' installed successfully!`, [
        `Installed ${result.installedFiles.length} files`,
        result.skippedFiles.length > 0 ? `Skipped ${result.skippedFiles.length} files` : null,
      ].filter(Boolean) as string[]);

      if (result.installedFiles.length > 0) {
        console.log(chalk.blue('📁 Installed files:'));
        for (const file of result.installedFiles) {
          console.log(`  ${chalk.green('✓')} ${file}`);
        }
      }

      if (result.skippedFiles.length > 0) {
        console.log(chalk.yellow('\n⚠️  Skipped files:'));
        for (const file of result.skippedFiles) {
          console.log(`  ${chalk.yellow('-')} ${file}`);
        }
      }

      // Show next steps
      console.log('\n' + chalk.blue('🎯 Next steps:'));
      if (hasMigrations) {
        console.log(`  • Run ${chalk.cyan('supabase db reset')} or ${chalk.cyan('supabase migration up')} to apply migrations`);
      }
      if (hasFunctions) {
        console.log(`  • Run ${chalk.cyan('supabase functions deploy')} to deploy edge functions`);
      }
      console.log(`  • Run ${chalk.cyan('supabootstrap doctor')} to check for modifications`);
      
    } else {
      PromptUtils.showError('Installation failed with errors:');
      for (const error of result.errors) {
        console.log(`  • ${error}`);
      }
      process.exit(1);
    }

  } catch (error) {
    PromptUtils.showError(`Installation failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Helper function to install a feature recursively (for dependencies)
 */
async function installFeatureRecursive(
  featureId: string, 
  installer: FeatureInstaller, 
  config: any, 
  projectRoot: string
): Promise<void> {
  const conflicts = await installer.analyzeConflicts(featureId);
  
  // For dependencies, auto-resolve conflicts by overwriting
  const conflictResolutions = conflicts.map(conflict => ({
    ...conflict,
    action: 'overwrite' as const
  }));
  
  const result = await installer.installFeature(featureId, conflictResolutions);
  
  if (!result.success) {
    throw new Error(`Failed to install dependency '${featureId}': ${result.errors.join(', ')}`);
  }
  
  console.log(chalk.green(`  ✓ Dependency '${featureId}' installed`));
}