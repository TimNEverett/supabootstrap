import path from 'path';
import chalk from 'chalk';
import { configManager } from '../core/config';
import { featureRegistry } from '../core/registry';
import { FeatureInstaller } from '../core/installer';
import { supabaseCLI, SupabaseCLI } from '../core/supabase-cli';
import { PromptUtils } from '../utils/prompts';

export async function installCommand(featureId: string): Promise<void> {
  try {

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


    // 7. Check dependencies
    const installer = new FeatureInstaller(config, projectRoot);
    const dependencyCheck = installer.checkDependencies(featureId);

    if (!dependencyCheck.satisfied) {
      // Get all transitive dependencies that need to be installed
      const allDependencies = featureRegistry.resolveDependencies(featureId);
      const missingDeps = allDependencies.filter(dep =>
        dep !== featureId && !config.installedFeatures[dep]
      );

      PromptUtils.showError('Missing required dependencies:');
      for (const dep of missingDeps) {
        const depFeature = featureRegistry.getFeature(dep);
        console.log(`  • ${chalk.red(dep)} - ${depFeature?.name || 'Unknown feature'}`);
      }

      const installDeps = await PromptUtils.confirmAction(
        `Install ${missingDeps.length} missing dependencies first?`,
        true
      );

      if (installDeps) {
        for (const dep of missingDeps) {
          PromptUtils.showTemp(chalk.yellow(`📦 Installing dependency: ${dep}...`));
          await installFeatureRecursive(dep, installer, config, projectRoot);
          PromptUtils.replaceTemp(chalk.green(`  ✓ Dependency '${dep}' installed`));
        }
      } else {
        PromptUtils.showError('Cannot install feature without its dependencies.');
        process.exit(1);
      }
    }

    // 8. Analyze conflicts (silently)
    const conflicts = await installer.analyzeConflicts(featureId);

    // 9. Handle conflicts if any
    let conflictResolutions = conflicts;
    if (conflicts.length > 0) {
      conflictResolutions = await PromptUtils.handleFileConflicts(conflicts);
    }

    // 10. Skip confirmation - just proceed (conflicts are handled separately)

    // 12. Get feature info for next steps
    const featurePath = featureRegistry.getFeaturePath(featureId);
    const hasMigrations = installer.hasMigrations(featurePath);
    const hasFunctions = installer.hasFunctions(featurePath);
    const hasSeeds = installer.hasSeeds(featurePath);

    // 13. Install the feature
    PromptUtils.showTemp(chalk.blue('Installing...'));
    const installSpinner = PromptUtils.showSpinner('Installing files...');
    
    const result = await installer.installFeature(featureId, conflictResolutions);
    installSpinner.stop();
    PromptUtils.clearLine();

    // 14. Show results
    if (result.success) {
      PromptUtils.showSuccess(`Feature '${featureId}' installed successfully!`, [
        `Installed ${result.installedFiles.length} files`,
        result.skippedFiles.length > 0 ? `Skipped ${result.skippedFiles.length} files` : null,
      ].filter(Boolean) as string[]);

      // Show next steps
      console.log(chalk.blue('🎯 Next steps:'));
      if (hasMigrations || hasSeeds) {
        console.log(`  • Run ${chalk.cyan('supabase db reset')} to apply migrations and seeds`);
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
}