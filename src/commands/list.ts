import { featureRegistry } from '../core/registry';
import { configManager } from '../core/config';
import { PromptUtils } from '../utils/prompts';
import chalk from 'chalk';

export async function listCommand(): Promise<void> {
  try {
    console.log(chalk.blue('📦 Available SupaBootstrap Features\n'));

    // Load feature registry
    const features = featureRegistry.getAllFeatures();
    const categories = featureRegistry.getCategories();

    if (Object.keys(features).length === 0) {
      PromptUtils.showWarning('No features found in the registry.');
      return;
    }

    // Try to load configuration to show installation status
    let config;
    let installedFeatures: Set<string> = new Set();
    
    try {
      config = configManager.loadConfig();
      installedFeatures = new Set(Object.keys(config.installedFeatures));
    } catch (error) {
      // Config doesn't exist - that's OK, we'll just show all features as not installed
    }

    // Group features by category
    for (const category of categories) {
      const categoryFeatures = featureRegistry.getFeaturesByCategory(category);
      
      console.log(chalk.bold.blue(`\n📁 ${category.toUpperCase()}`));
      console.log(chalk.gray('─'.repeat(50)));

      for (const [featureId, feature] of Object.entries(categoryFeatures)) {
        const isInstalled = installedFeatures.has(featureId);
        const statusIcon = isInstalled ? chalk.green('✓') : chalk.gray('○');
        const statusText = isInstalled ? chalk.green('(installed)') : chalk.gray('(available)');
        
        console.log(`\n${statusIcon} ${chalk.bold(feature.name)} ${statusText}`);
        console.log(`  ${chalk.cyan(featureId)} - v${feature.version}`);
        console.log(`  ${feature.description}`);
        
        if (feature.dependencies.length > 0) {
          const depsStatus = feature.dependencies.map(dep => {
            const depInstalled = installedFeatures.has(dep);
            return depInstalled ? chalk.green(dep) : chalk.red(dep);
          });
          console.log(`  ${chalk.yellow('Dependencies:')} ${depsStatus.join(', ')}`);
        }
      }
    }

    // Show summary
    const totalFeatures = Object.keys(features).length;
    const installedCount = installedFeatures.size;
    const availableCount = totalFeatures - installedCount;

    console.log('\n' + chalk.gray('─'.repeat(50)));
    console.log(chalk.blue('📊 Summary:'));
    console.log(`  ${chalk.green('Installed:')} ${installedCount}`);
    console.log(`  ${chalk.gray('Available:')} ${availableCount}`);
    console.log(`  ${chalk.blue('Total:')} ${totalFeatures}`);

    // Show helpful commands
    if (availableCount > 0) {
      console.log('\n' + chalk.blue('💡 Next steps:'));
      console.log('  • Run ' + chalk.cyan('supabootstrap install <feature>') + ' to install a feature');
      
      if (!config) {
        console.log('  • Run ' + chalk.cyan('supabootstrap init') + ' to initialize configuration first');
      }
    }

    if (installedCount > 0) {
      console.log('  • Run ' + chalk.cyan('supabootstrap doctor') + ' to check for modified files');
    }

    console.log('');

  } catch (error) {
    PromptUtils.showError(`Failed to list features: ${(error as Error).message}`);
    process.exit(1);
  }
}