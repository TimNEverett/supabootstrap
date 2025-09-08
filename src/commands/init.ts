import path from 'path';
import { configManager } from '../core/config';
import { supabaseCLI, SupabaseCLI } from '../core/supabase-cli';
import { PromptUtils } from '../utils/prompts';
import chalk from 'chalk';

export async function initCommand(): Promise<void> {
  const projectRoot = process.cwd();
  
  try {
    console.log(chalk.blue('🚀 Initializing SupaBootstrap project...\n'));

    // 1. Check if Supabase CLI is available
    PromptUtils.showTemp('📋 Checking requirements...');
    
    const isSupabaseCLIAvailable = await supabaseCLI.checkCLIAvailable();
    if (!isSupabaseCLIAvailable) {
      SupabaseCLI.showInstallInstructions();
      process.exit(1);
    }
    
    const version = await supabaseCLI.getVersion();
    PromptUtils.replaceTemp(chalk.green(`  ✓ Supabase CLI found (version: ${version || 'unknown'})`));

    // 2. Check if config already exists
    const existingConfig = configManager.findConfigFile(projectRoot);
    if (existingConfig) {
      const overwrite = await PromptUtils.confirmAction(
        `Configuration file already exists at ${existingConfig}. Overwrite?`,
        false
      );
      
      if (!overwrite) {
        PromptUtils.showInfo('Initialization cancelled.');
        return;
      }
    }

    // 3. Check/Initialize Supabase project
    let needsSupabaseInit = false;
    
    if (!supabaseCLI.isSupabaseProject(projectRoot)) {
      console.log(chalk.yellow('  ⚠ No supabase/ directory found'));
      
      const initSupabase = await PromptUtils.confirmAction(
        'Initialize a new Supabase project?',
        true
      );
      
      if (initSupabase) {
        needsSupabaseInit = true;
      } else {
        PromptUtils.showWarning('Continuing without Supabase initialization. You can run "supabase init" manually later.');
      }
    } else {
      console.log(chalk.green('  ✓ Supabase project found'));
      
      // Validate the existing project
      try {
        supabaseCLI.validateProject(projectRoot);
        console.log(chalk.green('  ✓ Supabase project structure is valid'));
      } catch (error) {
        PromptUtils.showWarning(`Supabase project validation warning: ${(error as Error).message}`);
      }
    }

    // 4. Initialize Supabase if needed
    if (needsSupabaseInit) {
      const spinner = PromptUtils.showSpinner('Initializing Supabase project...');
      
      try {
        await supabaseCLI.initProject(projectRoot);
        spinner.succeed('Supabase project initialized');
      } catch (error) {
        spinner.fail('Failed to initialize Supabase project');
        throw error;
      }
    }

    // 5. Get configuration options from user
    console.log('\n📝 Configuration setup:');
    
    const sourceDir = await PromptUtils.inputText(
      'Supabase directory path (relative to project root)',
      './supabase'
    );

    let filePrefix: string | undefined;
    const usePrefix = await PromptUtils.confirmAction(
      'Add a prefix to installed files? (recommended to avoid conflicts)',
      false
    );
    
    if (usePrefix) {
      filePrefix = await PromptUtils.inputText(
        'File prefix (will be added to all installed files)',
        'sb_'
      );
    }

    // 6. Create configuration
    const config = configManager.createDefaultConfig('1.0.0');
    config.sourceDir = sourceDir;
    if (filePrefix) {
      config.filePrefix = filePrefix;
    }

    // 7. Save configuration
    const configPath = path.join(projectRoot, '.supabootstrap.json');
    configManager.saveConfig(config, configPath);

    // 8. Success message
    PromptUtils.showSuccess('SupaBootstrap initialized successfully!', [
      `Configuration saved to: ${configPath}`,
      `Supabase directory: ${sourceDir}`,
      filePrefix ? `File prefix: ${filePrefix}` : 'No file prefix',
    ]);

    console.log(chalk.blue('🎯 Next steps:'));
    console.log('  • Run ' + chalk.cyan('supabootstrap list') + ' to see available features');
    console.log('  • Run ' + chalk.cyan('supabootstrap install <feature>') + ' to install a feature');
    console.log('');

  } catch (error) {
    PromptUtils.showError(`Initialization failed: ${(error as Error).message}`);
    process.exit(1);
  }
}